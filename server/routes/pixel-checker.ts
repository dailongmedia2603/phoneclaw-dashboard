import { Router } from 'express';
import { callDeviceApi, findDeviceGlobal } from '../services/device-manager';
import { sampleColorFromScreenshot } from '../services/pixel-checker';
import { getAuthUserId } from '../helpers/get-user';

const router = Router();

/**
 * POST /api/pixel-checker/sample-color
 * Body: { deviceId: string, x: number (0-1), y: number (0-1) }
 * Response: { success: true, data: { color: "#RRGGBB", rgb: {r,g,b}, pixelX, pixelY } }
 */
router.post('/sample-color', async (req, res) => {
  try {
    const { deviceId, x, y } = req.body || {};

    if (!deviceId || typeof deviceId !== 'string') {
      return res.status(400).json({ success: false, error: 'deviceId bắt buộc' });
    }

    const nx = Number(x);
    const ny = Number(y);
    if (isNaN(nx) || nx < 0 || nx > 1) {
      return res.status(400).json({ success: false, error: 'x phải là số trong [0,1]' });
    }
    if (isNaN(ny) || ny < 0 || ny > 1) {
      return res.status(400).json({ success: false, error: 'y phải là số trong [0,1]' });
    }

    // Verify device belongs to this user
    const userId = getAuthUserId(req);
    const found = await findDeviceGlobal(deviceId);
    if (!found) {
      return res.status(404).json({ success: false, error: 'Device not found' });
    }
    if (found.tenantId !== userId) {
      return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
    }

    // Capture screenshot
    const shotRes = await callDeviceApi(deviceId, 'GET', '/api/screenshot');
    if (!shotRes.ok || typeof shotRes.data !== 'string') {
      return res.status(500).json({
        success: false,
        error: `Screenshot failed: ${shotRes.error || 'Unknown error'}`,
      });
    }

    // Decode + extract pixel
    const { color, rgb } = await sampleColorFromScreenshot(shotRes.data, nx, ny);

    return res.json({
      success: true,
      data: { color, rgb, pixelX: nx, pixelY: ny },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ success: false, error: msg });
  }
});

export default router;
