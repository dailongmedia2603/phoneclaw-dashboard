/**
 * Exit Node API Routes
 *
 * Manages sing-box proxy routing on VPS for Tailscale Exit Node traffic.
 * Each device (identified by Tailscale IP) can have an independent proxy config.
 */

import { Router, Request, Response } from 'express';
import {
  setDeviceProxy,
  removeDeviceProxy,
  getDeviceProxies,
  updateAndReload,
  persistState,
} from '../services/singbox-manager';
import { getAuthUserId } from '../helpers/get-user';
import { findDeviceGlobal } from '../services/device-manager';

const router = Router();

/**
 * POST /api/exit-node/config
 * Set proxy config for a single device (by Tailscale IP).
 */
router.post('/config', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { deviceId, mode, proxyIp, proxyPort, proxyUser, proxyPass } = req.body;

  if (!deviceId || !mode) {
    return res.json({ success: false, error: 'Missing deviceId or mode' });
  }

  const found = await findDeviceGlobal(deviceId);
  if (!found || found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  const device = found.device;
  if (!device.tailscaleIp) {
    return res.json({ success: false, error: 'Device has no Tailscale IP' });
  }

  if (mode === 'us' && (!proxyIp || !proxyPort)) {
    return res.json({ success: false, error: 'US mode requires proxyIp and proxyPort' });
  }

  setDeviceProxy({
    tailscaleIp: device.tailscaleIp,
    mode,
    proxyIp: proxyIp || '',
    proxyPort: proxyPort ? Number(proxyPort) : 0,
    proxyUser: proxyUser || '',
    proxyPass: proxyPass || '',
  });

  persistState();
  const reloadResult = updateAndReload();

  res.json({
    success: reloadResult.ok,
    data: { tailscaleIp: device.tailscaleIp, mode },
    error: reloadResult.error,
  });
});

/**
 * POST /api/exit-node/batch/config
 * Set proxy config for multiple devices in one reload.
 */
router.post('/batch/config', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const { deviceIds, mode, proxyIp, proxyPort, proxyUser, proxyPass } = req.body;

  if (!deviceIds?.length || !mode) {
    return res.json({ success: false, error: 'Missing deviceIds or mode' });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};

  for (const deviceId of deviceIds) {
    const found = await findDeviceGlobal(deviceId);
    if (!found || found.tenantId !== userId) {
      results[deviceId] = { ok: false, error: 'Access denied' };
      continue;
    }

    const device = found.device;
    if (!device.tailscaleIp) {
      results[deviceId] = { ok: false, error: 'No Tailscale IP' };
      continue;
    }

    setDeviceProxy({
      tailscaleIp: device.tailscaleIp,
      mode,
      proxyIp: proxyIp || '',
      proxyPort: proxyPort ? Number(proxyPort) : 0,
      proxyUser: proxyUser || '',
      proxyPass: proxyPass || '',
    });
    results[deviceId] = { ok: true };
  }

  // Persist + reload once for all devices
  persistState();
  const reloadResult = updateAndReload();

  const allOk = Object.values(results).every(r => r.ok) && reloadResult.ok;
  res.json({ success: allOk, data: results, error: reloadResult.error });
});

/**
 * GET /api/exit-node/status
 * Get all device proxy configs currently active in sing-box.
 */
router.get('/status', async (_req: Request, res: Response) => {
  const devices = getDeviceProxies();
  res.json({ success: true, data: { devices, count: devices.length } });
});

/**
 * DELETE /api/exit-node/config/:deviceId
 * Remove proxy config for a device and reload sing-box.
 */
router.delete('/config/:deviceId', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  const found = await findDeviceGlobal(req.params.deviceId);

  if (!found || found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Access denied' });
  }

  if (found.device.tailscaleIp) {
    removeDeviceProxy(found.device.tailscaleIp);
    persistState();
    updateAndReload();
  }

  res.json({ success: true });
});

export default router;
