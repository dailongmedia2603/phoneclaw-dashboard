import { Router } from 'express';
import net from 'net';
import crypto from 'crypto';
import { callDeviceApi, getDevice } from '../services/device-manager';

const router = Router();

// POST /api/control/:deviceId/tap
// Uses VNC protocol for accurate tapping (same path as Live VNC viewer)
// Falls back to HTTP API if VNC fails
router.post('/:deviceId/tap', async (req, res) => {
  const { x, y } = req.body;
  const device = getDevice(req.params.deviceId);
  if (!device) return res.json({ success: false, error: 'Device not found' });

  // Try VNC tap first (accurate, same path as Live VNC viewer)
  try {
    await vncTap(device.tailscaleIp, device.vncPort, x, y, device.vncPassword);
    return res.json({ success: true, data: { ok: true, method: 'vnc', x, y } });
  } catch (err) {
    console.log(`[TAP] VNC tap failed, falling back to HTTP API:`, err instanceof Error ? err.message : err);
  }

  // Fallback: HTTP API (may have coordinate offset on some devices)
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/tap', { x, y });
  res.json({ success: result.ok, data: { ...(result.data as any), method: 'http-fallback' }, error: result.error });
});

// POST /api/control/:deviceId/swipe
router.post('/:deviceId/swipe', async (req, res) => {
  const { fromX, fromY, toX, toY, duration } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/swipe', {
    fromX, fromY, toX, toY, duration,
  });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/type
router.post('/:deviceId/type', async (req, res) => {
  const { text } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/type', { text });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/key
router.post('/:deviceId/key', async (req, res) => {
  const { key } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/key', { key });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/launch
router.post('/:deviceId/launch', async (req, res) => {
  const { bundleId } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/launch', { bundleId });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

/**
 * Reverse bits in each byte (VNC DES auth quirk).
 */
function reverseBits(byte: number): number {
  let result = 0;
  for (let i = 0; i < 8; i++) {
    result = (result << 1) | (byte & 1);
    byte >>= 1;
  }
  return result;
}

/**
 * VNC DES auth: encrypt 16-byte challenge with password.
 */
function vncAuthResponse(challenge: Buffer, password: string): Buffer {
  // Password to 8-byte key, bit-reversed per VNC spec
  const keyBytes = Buffer.alloc(8);
  for (let i = 0; i < 8 && i < password.length; i++) {
    keyBytes[i] = reverseBits(password.charCodeAt(i));
  }

  // DES-ECB encrypt: first 8 bytes, then next 8 bytes
  const cipher1 = crypto.createCipheriv('des-ecb', keyBytes, null);
  cipher1.setAutoPadding(false);
  const enc1 = cipher1.update(challenge.subarray(0, 8));

  const cipher2 = crypto.createCipheriv('des-ecb', keyBytes, null);
  cipher2.setAutoPadding(false);
  const enc2 = cipher2.update(challenge.subarray(8, 16));

  return Buffer.concat([enc1, enc2]);
}

/**
 * Quick VNC (RFB) handshake to trigger TrollVNC screen capture update.
 * Same protocol as noVNC uses when viewing device detail.
 * Connects, authenticates, requests a framebuffer update to force
 * the device to capture a fresh frame, then disconnects.
 */
function triggerVncCapture(ip: string, port: number, password?: string): Promise<void> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let phase = 0; // 0=version, 1=security, 2=auth-challenge, 3=auth-result, 4=serverinit, 5=done
    let resolved = false;
    const done = () => { if (!resolved) { resolved = true; socket.destroy(); resolve(); } };

    socket.setTimeout(5000);
    socket.on('timeout', done);
    socket.on('error', done);
    socket.on('close', () => { if (!resolved) { resolved = true; resolve(); } });

    socket.on('data', (data: Buffer) => {
      try {
        if (phase === 0 && data.length >= 12 && data.toString('ascii', 0, 3) === 'RFB') {
          // Server version → reply with RFB 003.008
          socket.write(Buffer.from('RFB 003.008\n'));
          phase = 1;

        } else if (phase === 1) {
          // Security types list
          const numTypes = data[0];
          if (numTypes === 0) { done(); return; } // connection failed
          const types = Array.from(data.subarray(1, 1 + numTypes));

          if (types.includes(1)) {
            // SecurityType None
            socket.write(Buffer.from([1]));
            phase = 3; // skip auth, wait for SecurityResult
          } else if (types.includes(2) && password) {
            // SecurityType VNCAuth
            socket.write(Buffer.from([2]));
            phase = 2; // wait for challenge
          } else {
            done();
          }

        } else if (phase === 2 && data.length >= 16) {
          // VNC Auth challenge → compute DES response
          const response = vncAuthResponse(data.subarray(0, 16), password || '');
          socket.write(response);
          phase = 3; // wait for SecurityResult

        } else if (phase === 3) {
          // SecurityResult (4 bytes, 0 = OK)
          if (data.length >= 4 && data.readUInt32BE(0) === 0) {
            // Auth OK → send ClientInit (shared=1)
            socket.write(Buffer.from([1]));
            phase = 4;
          } else {
            done(); // Auth failed
          }

        } else if (phase === 4 && data.length >= 24) {
          // ServerInit received (at least 24 bytes: width, height, pixel format, name length...)
          // Extract actual screen dimensions
          const fbWidth = data.readUInt16BE(0);
          const fbHeight = data.readUInt16BE(2);

          // Send FramebufferUpdateRequest for full screen
          const fbReq = Buffer.alloc(10);
          fbReq[0] = 3;  // message type: FramebufferUpdateRequest
          fbReq[1] = 0;  // incremental = 0 (full update)
          fbReq.writeUInt16BE(0, 2);        // x-position
          fbReq.writeUInt16BE(0, 4);        // y-position
          fbReq.writeUInt16BE(fbWidth, 6);  // width
          fbReq.writeUInt16BE(fbHeight, 8); // height
          socket.write(fbReq);

          // Wait for device to capture a fresh frame, then disconnect
          phase = 5;
          setTimeout(done, 1200);
        }
      } catch {
        done();
      }
    });

    socket.connect(port, ip);

    // Hard timeout safety net
    setTimeout(done, 5000);
  });
}

/**
 * Send a tap via VNC protocol (RFB PointerEvent).
 * Same path as Live VNC viewer: ptrAddEvent → vncPointToDevicePoint → STHIDEventGenerator.
 * This ensures coordinates map correctly regardless of screen scaling/rotation.
 *
 * @param x Normalized 0-1 coordinate
 * @param y Normalized 0-1 coordinate
 */
function vncTap(ip: string, port: number, x: number, y: number, password?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let phase = 0;
    let resolved = false;
    let fbWidth = 0;
    let fbHeight = 0;

    const finish = (err?: Error) => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      err ? reject(err) : resolve();
    };

    socket.setTimeout(5000);
    socket.on('timeout', () => finish(new Error('VNC timeout')));
    socket.on('error', (e) => finish(e));
    socket.on('close', () => { if (!resolved) { resolved = true; resolve(); } });

    socket.on('data', (data: Buffer) => {
      try {
        if (phase === 0 && data.length >= 12 && data.toString('ascii', 0, 3) === 'RFB') {
          socket.write(Buffer.from('RFB 003.008\n'));
          phase = 1;

        } else if (phase === 1) {
          const numTypes = data[0];
          if (numTypes === 0) { finish(new Error('VNC connection refused')); return; }
          const types = Array.from(data.subarray(1, 1 + numTypes));

          if (types.includes(1)) {
            socket.write(Buffer.from([1])); // None auth
            phase = 3;
          } else if (types.includes(2) && password) {
            socket.write(Buffer.from([2])); // VNC auth
            phase = 2;
          } else {
            finish(new Error('No supported VNC auth'));
          }

        } else if (phase === 2 && data.length >= 16) {
          socket.write(vncAuthResponse(data.subarray(0, 16), password || ''));
          phase = 3;

        } else if (phase === 3) {
          if (data.length >= 4 && data.readUInt32BE(0) === 0) {
            socket.write(Buffer.from([1])); // ClientInit shared=1
            phase = 4;
          } else {
            finish(new Error('VNC auth failed'));
          }

        } else if (phase === 4 && data.length >= 24) {
          // ServerInit: get framebuffer dimensions
          fbWidth = data.readUInt16BE(0);
          fbHeight = data.readUInt16BE(2);

          // Convert normalized (0-1) to VNC pixel coordinates
          const px = Math.round(x * fbWidth);
          const py = Math.round(y * fbHeight);

          // RFB PointerEvent (message type 5):
          // [type:1] [button-mask:1] [x:2] [y:2]
          const pointerDown = Buffer.alloc(6);
          pointerDown[0] = 5;  // PointerEvent
          pointerDown[1] = 1;  // button-mask: left button pressed
          pointerDown.writeUInt16BE(px, 2);
          pointerDown.writeUInt16BE(py, 4);

          const pointerUp = Buffer.alloc(6);
          pointerUp[0] = 5;    // PointerEvent
          pointerUp[1] = 0;    // button-mask: released
          pointerUp.writeUInt16BE(px, 2);
          pointerUp.writeUInt16BE(py, 4);

          // Send press, wait briefly, send release
          socket.write(pointerDown);
          setTimeout(() => {
            socket.write(pointerUp);
            // Wait for event to be processed, then disconnect
            setTimeout(() => finish(), 200);
          }, 80);

          phase = 5;
        }
      } catch (e) {
        finish(e instanceof Error ? e : new Error('VNC protocol error'));
      }
    });

    socket.connect(port, ip);
    setTimeout(() => finish(new Error('VNC tap timeout')), 6000);
  });
}

// GET /api/control/:deviceId/screenshot
// Normal mode: HTTP API only (fast, no VNC connection)
// Live mode (?live=true): VNC handshake first to refresh screen buffer (for Coordinate Picker)
router.get('/:deviceId/screenshot', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');

  const device = getDevice(req.params.deviceId);
  if (!device) {
    return res.json({ success: false, error: 'Device not found' });
  }

  // Only trigger VNC when explicitly requested (Coordinate Picker)
  if (req.query.live === 'true') {
    await triggerVncCapture(device.tailscaleIp, device.vncPort, device.vncPassword);
  }

  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/screenshot');
  if (result.ok && result.data) {
    res.json({ success: true, data: result.data });
  } else {
    res.json({ success: false, error: result.error || 'Screenshot failed' });
  }
});

// GET /api/control/:deviceId/clipboard
router.get('/:deviceId/clipboard', async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/clipboard');
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/clipboard
router.post('/:deviceId/clipboard', async (req, res) => {
  const { text } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/clipboard', { text });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// GET /api/control/:deviceId/status
router.get('/:deviceId/status', async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/status');
  res.json({ success: result.ok, data: result.data, error: result.error });
});

export default router;
