import { Router, Request, Response, NextFunction } from 'express';
import { callDeviceApi, findDeviceGlobal, updateDeviceForTenant } from '../services/device-manager';
import { getAuthUserId } from '../helpers/get-user';
import { checkFeature } from '../helpers/check-quota';
import type { ProxyConfig } from '../../src/types';

const router = Router();

// Helper: đợi ms
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// Helper: verify proxy is actually running on device after start
async function verifyProxyRunning(deviceId: string): Promise<{ running: boolean; error?: string; detail?: unknown }> {
  await sleep(2000);
  const statusResult = await callDeviceApi(deviceId, 'GET', '/api/proxy/status');
  if (!statusResult.ok) return { running: false, error: 'Không thể kết nối thiết bị để xác nhận' };
  const data = statusResult.data as Record<string, unknown>;
  return { running: data?.proxyStatus === 'running', detail: data };
}

/**
 * Middleware: kiểm tra user có quyền truy cập device không.
 * Mỗi user chỉ được truy cập device trong tenant của mình.
 */
async function verifyDeviceAccess(req: Request, res: Response, next: NextFunction) {
  const userId = getAuthUserId(req);
  const found = await findDeviceGlobal(req.params.deviceId);

  if (!found) {
    return res.status(404).json({ success: false, error: 'Device not found' });
  }

  if (found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  // Gắn tenantId vào request để dùng trong handler
  (req as any).deviceTenantId = found.tenantId;
  next();
}

/**
 * Helper: verify tất cả deviceIds thuộc user. Trả về map deviceId → tenantId.
 * Nếu bất kỳ device nào không thuộc user → trả null.
 */
async function verifyBatchOwnership(req: Request, deviceIds: string[]): Promise<Record<string, string> | null> {
  const userId = getAuthUserId(req);
  const map: Record<string, string> = {};

  for (const deviceId of deviceIds) {
    const found = await findDeviceGlobal(deviceId);
    if (!found) return null;
    if (found.tenantId !== userId) return null;
    map[deviceId] = found.tenantId;
  }
  return map;
}

// ============================================================
// BATCH ROUTES — PHẢI đặt TRƯỚC /:deviceId routes
// ============================================================

// POST /api/proxy/batch/config
router.post('/batch/config', async (req, res) => {
  // Enforce proxy feature
  const proxyCheck = await checkFeature(req, 'proxy');
  if (!proxyCheck.allowed) return res.status(403).json({ success: false, error: proxyCheck.error });

  const { deviceIds, ip, port, username, password, mode } = req.body;
  if (!deviceIds?.length || !ip || !port) {
    return res.json({ success: false, error: 'Missing deviceIds, ip, or port' });
  }

  const ownerMap = await verifyBatchOwnership(req, deviceIds);
  if (!ownerMap) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập một hoặc nhiều thiết bị' });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};
  for (const deviceId of deviceIds) {
    const proxyConfig: ProxyConfig = {
      ip, port: Number(port), username: username || '', password: password || '',
      enabled: false, mode: mode || 'none',
    };
    await updateDeviceForTenant(ownerMap[deviceId], deviceId, { proxyConfig });

    const result = await callDeviceApi(deviceId, 'POST', '/api/proxy/config', {
      ip, port: Number(port), username: username || '', password: password || '', mode: mode || 'none',
    });
    results[deviceId] = { ok: result.ok, error: result.error };
  }
  const allOk = Object.values(results).every(r => r.ok);
  res.json({ success: allOk, data: results, ...(allOk ? {} : { error: 'Một số thiết bị không nhận được config' }) });
});

// POST /api/proxy/batch/start
router.post('/batch/start', async (req, res) => {
  const { deviceIds } = req.body;
  if (!deviceIds?.length) {
    return res.json({ success: false, error: 'Missing deviceIds' });
  }

  const ownerMap = await verifyBatchOwnership(req, deviceIds);
  if (!ownerMap) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập một hoặc nhiều thiết bị' });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};
  for (const deviceId of deviceIds) {
    const tid = ownerMap[deviceId];
    const result = await callDeviceApi(deviceId, 'POST', '/api/proxy/start');
    if (result.ok) {
      const verify = await verifyProxyRunning(deviceId);
      if (verify.running) {
        const found = await findDeviceGlobal(deviceId);
        if (found?.device.proxyConfig) {
          await updateDeviceForTenant(tid, deviceId, {
            proxyConfig: { ...found.device.proxyConfig, enabled: true },
            proxyStatus: 'running',
          });
        }
        results[deviceId] = { ok: true };
      } else {
        await updateDeviceForTenant(tid, deviceId, { proxyStatus: 'stopped' });
        results[deviceId] = { ok: false, error: 'sing-box crashed — kiểm tra binary/TUN trên iPhone' };
      }
    } else {
      results[deviceId] = { ok: false, error: result.error };
    }
  }
  const allOk = Object.values(results).every(r => r.ok);
  res.json({ success: allOk, data: results, ...(allOk ? {} : { error: 'Một số thiết bị không bật được proxy' }) });
});

// POST /api/proxy/batch/stop
router.post('/batch/stop', async (req, res) => {
  const { deviceIds } = req.body;
  if (!deviceIds?.length) {
    return res.json({ success: false, error: 'Missing deviceIds' });
  }

  const ownerMap = await verifyBatchOwnership(req, deviceIds);
  if (!ownerMap) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập một hoặc nhiều thiết bị' });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};
  for (const deviceId of deviceIds) {
    const tid = ownerMap[deviceId];
    const result = await callDeviceApi(deviceId, 'POST', '/api/proxy/stop');
    if (result.ok) {
      const found = await findDeviceGlobal(deviceId);
      if (found?.device.proxyConfig) {
        await updateDeviceForTenant(tid, deviceId, {
          proxyConfig: { ...found.device.proxyConfig, enabled: false },
          proxyStatus: 'stopped',
        });
      }
    }
    results[deviceId] = { ok: result.ok, error: result.error };
  }
  const allOk = Object.values(results).every(r => r.ok);
  res.json({ success: allOk, data: results });
});

// GET /api/proxy/geolocate/:ip
router.get('/geolocate/:ip', async (req, res) => {
  try {
    const response = await fetch(`https://ipinfo.io/${req.params.ip}/json`);
    const raw = await response.json() as Record<string, unknown>;
    if (raw.bogon || !raw.loc) {
      return res.json({ success: false, error: 'Không thể xác định vị trí từ IP' });
    }
    // Parse "lat,lon" string → numbers
    const [lat, lon] = (raw.loc as string).split(',').map(Number);
    res.json({
      success: true,
      data: {
        country: raw.country as string,
        regionName: raw.region as string,
        city: raw.city as string,
        lat,
        lon,
        timezone: raw.timezone as string,
      },
    });
  } catch {
    res.json({ success: false, error: 'Lỗi khi tra cứu IP' });
  }
});

// ============================================================
// SINGLE DEVICE ROUTES — /:deviceId phải đặt SAU batch routes
// ============================================================

// GET /api/proxy/:deviceId/status
router.get('/:deviceId/status', verifyDeviceAccess, async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/proxy/status');
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/proxy/:deviceId/config
router.post('/:deviceId/config', verifyDeviceAccess, async (req, res) => {
  // Enforce proxy feature
  const proxyCheck = await checkFeature(req, 'proxy');
  if (!proxyCheck.allowed) return res.status(403).json({ success: false, error: proxyCheck.error });

  const tid = (req as any).deviceTenantId as string;
  const { ip, port, username, password, mode } = req.body;
  if (!ip || !port) {
    return res.json({ success: false, error: 'Missing ip or port' });
  }

  const found = await findDeviceGlobal(req.params.deviceId);
  if (!found) return res.json({ success: false, error: 'Device not found' });
  const device = found.device;

  const proxyConfig: ProxyConfig = {
    ip, port: Number(port), username: username || '', password: password || '',
    enabled: device.proxyConfig?.enabled ?? false,
    mode: mode || device.proxyConfig?.mode || 'none',
    timezone: req.body.timezone || device.proxyConfig?.timezone,
    locale: req.body.locale || device.proxyConfig?.locale,
    latitude: req.body.latitude ?? device.proxyConfig?.latitude,
    longitude: req.body.longitude ?? device.proxyConfig?.longitude,
  };
  await updateDeviceForTenant(tid, device.id, { proxyConfig });

  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/config', {
    ip, port: Number(port), username: username || '', password: password || '', mode: mode || 'none',
  });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/proxy/:deviceId/start
router.post('/:deviceId/start', verifyDeviceAccess, async (req, res) => {
  const tid = (req as any).deviceTenantId as string;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/start');
  if (result.ok) {
    const verify = await verifyProxyRunning(req.params.deviceId);
    if (verify.running) {
      const found = await findDeviceGlobal(req.params.deviceId);
      if (found?.device.proxyConfig) {
        await updateDeviceForTenant(tid, req.params.deviceId, {
          proxyConfig: { ...found.device.proxyConfig, enabled: true },
          proxyStatus: 'running',
        });
      } else {
        await updateDeviceForTenant(tid, req.params.deviceId, { proxyStatus: 'running' });
      }
      res.json({ success: true, data: result.data });
    } else {
      await updateDeviceForTenant(tid, req.params.deviceId, { proxyStatus: 'stopped' });
      console.log(`[Proxy] sing-box crashed on ${req.params.deviceId}. Start response:`, result.data, 'Status:', verify.detail);
      res.json({ success: false, error: 'sing-box crashed sau khi khởi động — có thể do binary không tương thích hoặc TUN interface không tạo được', data: { startResult: result.data, statusAfter: verify.detail } });
    }
  } else {
    res.json({ success: false, data: result.data, error: result.error });
  }
});

// POST /api/proxy/:deviceId/stop
router.post('/:deviceId/stop', verifyDeviceAccess, async (req, res) => {
  const tid = (req as any).deviceTenantId as string;
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/stop');
  if (result.ok) {
    const found = await findDeviceGlobal(req.params.deviceId);
    if (found?.device.proxyConfig) {
      await updateDeviceForTenant(tid, req.params.deviceId, {
        proxyConfig: { ...found.device.proxyConfig, enabled: false },
        proxyStatus: 'stopped',
      });
    } else {
      await updateDeviceForTenant(tid, req.params.deviceId, { proxyStatus: 'stopped' });
    }
  }
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/proxy/:deviceId/spoof
router.post('/:deviceId/spoof', verifyDeviceAccess, async (req, res) => {
  // Enforce GPS spoof feature
  const gpsCheck = await checkFeature(req, 'gpsSpoof');
  if (!gpsCheck.allowed) return res.status(403).json({ success: false, error: gpsCheck.error });

  const tid = (req as any).deviceTenantId as string;
  const { timezone, locale, latitude, longitude, mode } = req.body;

  const found = await findDeviceGlobal(req.params.deviceId);
  if (found?.device.proxyConfig) {
    await updateDeviceForTenant(tid, req.params.deviceId, {
      proxyConfig: {
        ...found.device.proxyConfig,
        ...(mode !== undefined && { mode }),
        ...(timezone !== undefined && { timezone }),
        ...(locale !== undefined && { locale }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    });
  }

  const effectiveMode = mode || found?.device.proxyConfig?.mode || 'none';
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/spoof', {
    mode: effectiveMode, timezone, locale, latitude, longitude,
  });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

export default router;
