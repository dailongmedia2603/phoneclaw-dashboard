import { Router } from 'express';
import { callDeviceApi, getDevice } from '../services/device-manager';
import { vncTap, triggerVncCapture } from '../services/vnc-tap';

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
    await vncTap(req.params.deviceId, Number(x), Number(y));
    return res.json({ success: true, data: { ok: true, method: 'vnc', x, y } });
  } catch (err) {
    console.log(`[TAP] VNC tap failed, falling back to HTTP API:`, err instanceof Error ? err.message : err);
  }

  // Fallback: HTTP API
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

// GET /api/control/:deviceId/screenshot
// Normal mode: HTTP API only (fast, no VNC connection)
// Live mode (?live=true): VNC handshake first to refresh screen buffer
router.get('/:deviceId/screenshot', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');

  const device = getDevice(req.params.deviceId);
  if (!device) {
    return res.json({ success: false, error: 'Device not found' });
  }

  if (req.query.live === 'true') {
    await triggerVncCapture(req.params.deviceId);
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
