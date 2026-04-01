import { Router, Request, Response, NextFunction } from 'express';
import { callDeviceApi } from '../services/device-manager';
import { findDeviceGlobal } from '../services/device-manager';
import { triggerVncCapture } from '../services/vnc-tap';
import { getAuthUserId, isAdmin } from '../helpers/get-user';

const router = Router();

/**
 * Middleware: kiểm tra user có quyền truy cập device không.
 * - Admin: luôn được phép
 * - User: chỉ được truy cập device trong tenant của mình
 */
async function verifyDeviceAccess(req: Request, res: Response, next: NextFunction) {
  const userId = getAuthUserId(req);
  const found = await findDeviceGlobal(req.params.deviceId);

  if (!found) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  if (!isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  next();
}

// POST /api/control/:deviceId/tap
router.post('/:deviceId/tap', verifyDeviceAccess, async (req, res) => {
  const { x, y } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/tap', { x, y });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/swipe
router.post('/:deviceId/swipe', verifyDeviceAccess, async (req, res) => {
  const { fromX, fromY, toX, toY, duration } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/swipe', {
    fromX, fromY, toX, toY, duration,
  });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/type
router.post('/:deviceId/type', verifyDeviceAccess, async (req, res) => {
  const { text } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/type', { text });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/key
router.post('/:deviceId/key', verifyDeviceAccess, async (req, res) => {
  const { key } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/key', { key });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/launch
router.post('/:deviceId/launch', verifyDeviceAccess, async (req, res) => {
  const { bundleId } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/launch', { bundleId });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// GET /api/control/:deviceId/screenshot
router.get('/:deviceId/screenshot', verifyDeviceAccess, async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.set('Pragma', 'no-cache');

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
router.get('/:deviceId/clipboard', verifyDeviceAccess, async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/clipboard');
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/control/:deviceId/clipboard
router.post('/:deviceId/clipboard', verifyDeviceAccess, async (req, res) => {
  const { text } = req.body;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/clipboard', { text });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// GET /api/control/:deviceId/status
router.get('/:deviceId/status', verifyDeviceAccess, async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/status');
  res.json({ success: result.ok, data: result.data, error: result.error });
});

export default router;
