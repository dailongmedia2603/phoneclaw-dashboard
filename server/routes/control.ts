import { Router } from 'express';
import { callDeviceApi } from '../services/device-manager';
import { captureVncScreenshot } from '../services/template-matcher';

const router = Router();

// POST /api/control/:deviceId/tap
router.post('/:deviceId/tap', async (req, res) => {
  const { x, y } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/tap', { x, y });
  res.json({ success: result.ok, data: result.data, error: result.error });
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
// Uses VNC capture (vncdotool) for live screenshot, falls back to HTTP API
router.get('/:deviceId/screenshot', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');

  // Try VNC capture first (connects to device, always returns current screen)
  try {
    const base64 = captureVncScreenshot(req.params.deviceId);
    if (base64) {
      return res.json({ success: true, data: base64 });
    }
  } catch { /* fall through to HTTP API */ }

  // Fallback: HTTP API (may return stale buffer if no VNC client connected)
  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/screenshot');
  if (result.ok && result.data) {
    res.json({ success: true, data: result.data });
  } else {
    res.json({ success: false, error: result.error });
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
