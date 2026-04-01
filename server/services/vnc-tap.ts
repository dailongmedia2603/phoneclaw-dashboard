/**
 * VNC Protocol Tap Service
 * Sends taps via RFB PointerEvent — same path as Live VNC viewer.
 * This ensures coordinates map correctly through vncPointToDevicePoint().
 */
import net from 'net';
import crypto from 'crypto';
import { getDevice } from './device-manager';

function reverseBits(byte: number): number {
  let result = 0;
  for (let i = 0; i < 8; i++) {
    result = (result << 1) | (byte & 1);
    byte >>= 1;
  }
  return result;
}

function vncAuthResponse(challenge: Buffer, password: string): Buffer {
  const keyBytes = Buffer.alloc(8);
  for (let i = 0; i < 8 && i < password.length; i++) {
    keyBytes[i] = reverseBits(password.charCodeAt(i));
  }

  const cipher1 = crypto.createCipheriv('des-ecb', keyBytes, null);
  cipher1.setAutoPadding(false);
  const enc1 = cipher1.update(challenge.subarray(0, 8));

  const cipher2 = crypto.createCipheriv('des-ecb', keyBytes, null);
  cipher2.setAutoPadding(false);
  const enc2 = cipher2.update(challenge.subarray(8, 16));

  return Buffer.concat([enc1, enc2]);
}

/**
 * Perform a complete VNC RFB handshake up to ServerInit.
 * Returns the connected socket and framebuffer dimensions.
 * The caller is responsible for destroying the socket.
 */
function vncHandshake(ip: string, port: number, password?: string): Promise<{ socket: net.Socket; fbWidth: number; fbHeight: number }> {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    let phase = 0;
    let settled = false;

    const fail = (msg: string) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      reject(new Error(msg));
    };

    socket.setTimeout(5000);
    socket.on('timeout', () => fail('VNC timeout'));
    socket.on('error', (e) => fail(e.message));

    socket.on('data', (data: Buffer) => {
      try {
        if (phase === 0 && data.length >= 12 && data.toString('ascii', 0, 3) === 'RFB') {
          socket.write(Buffer.from('RFB 003.008\n'));
          phase = 1;
        } else if (phase === 1) {
          const numTypes = data[0];
          if (numTypes === 0) { fail('VNC connection refused'); return; }
          const types = Array.from(data.subarray(1, 1 + numTypes));
          if (types.includes(1)) {
            socket.write(Buffer.from([1]));
            phase = 3;
          } else if (types.includes(2) && password) {
            socket.write(Buffer.from([2]));
            phase = 2;
          } else {
            fail('No supported VNC auth');
          }
        } else if (phase === 2 && data.length >= 16) {
          socket.write(vncAuthResponse(data.subarray(0, 16), password || ''));
          phase = 3;
        } else if (phase === 3) {
          if (data.length >= 4 && data.readUInt32BE(0) === 0) {
            socket.write(Buffer.from([1])); // ClientInit shared=1
            phase = 4;
          } else {
            fail('VNC auth failed');
          }
        } else if (phase === 4 && data.length >= 24) {
          const fbWidth = data.readUInt16BE(0);
          const fbHeight = data.readUInt16BE(2);
          if (!settled) {
            settled = true;
            resolve({ socket, fbWidth, fbHeight });
          }
        }
      } catch (e) {
        fail(e instanceof Error ? e.message : 'VNC protocol error');
      }
    });

    socket.connect(port, ip);
    setTimeout(() => fail('VNC handshake timeout'), 6000);
  });
}

/**
 * Send a tap at normalized (0-1) coordinates via VNC PointerEvent.
 * Uses the same code path as the Live VNC viewer (ptrAddEvent → vncPointToDevicePoint).
 */
export async function vncTap(deviceId: string, x: number, y: number): Promise<void> {
  const device = await getDevice(deviceId);
  if (!device) throw new Error('Device not found');

  const { socket, fbWidth, fbHeight } = await vncHandshake(
    device.tailscaleIp, device.vncPort, device.vncPassword
  );

  const px = Math.round(x * fbWidth);
  const py = Math.round(y * fbHeight);

  // RFB PointerEvent: [type:1][button-mask:1][x:2][y:2]
  const down = Buffer.alloc(6);
  down[0] = 5; down[1] = 1; // left button pressed
  down.writeUInt16BE(px, 2);
  down.writeUInt16BE(py, 4);

  const up = Buffer.alloc(6);
  up[0] = 5; up[1] = 0; // released
  up.writeUInt16BE(px, 2);
  up.writeUInt16BE(py, 4);

  socket.write(down);
  await new Promise(r => setTimeout(r, 80));
  socket.write(up);
  await new Promise(r => setTimeout(r, 200));
  socket.destroy();
}

/**
 * Trigger a VNC framebuffer capture (for screenshot refresh).
 */
export async function triggerVncCapture(deviceId: string): Promise<void> {
  const device = await getDevice(deviceId);
  if (!device) return;

  try {
    const { socket, fbWidth, fbHeight } = await vncHandshake(
      device.tailscaleIp, device.vncPort, device.vncPassword
    );

    const fbReq = Buffer.alloc(10);
    fbReq[0] = 3; fbReq[1] = 0;
    fbReq.writeUInt16BE(0, 2);
    fbReq.writeUInt16BE(0, 4);
    fbReq.writeUInt16BE(fbWidth, 6);
    fbReq.writeUInt16BE(fbHeight, 8);
    socket.write(fbReq);

    await new Promise(r => setTimeout(r, 1200));
    socket.destroy();
  } catch { /* ignore capture errors */ }
}
