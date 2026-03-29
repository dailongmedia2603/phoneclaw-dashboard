import { Router } from 'express';
import { callDeviceApi, getDevice, getAllDevices, updateDevice } from '../services/device-manager';
import type { ProxyConfig } from '../../src/types';

const router = Router();

// Helper: verify proxy is actually running on device after start
async function verifyProxyRunning(deviceId: string): Promise<{ running: boolean; error?: string }> {
  const statusResult = await callDeviceApi(deviceId, 'GET', '/api/proxy/status');
  if (!statusResult.ok) return { running: false, error: 'Cannot reach device for verification' };
  const data = statusResult.data as Record<string, unknown>;
  return { running: data?.proxyStatus === 'running' };
}

// GET /api/proxy/:deviceId/status
router.get('/:deviceId/status', async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'GET', '/api/proxy/status');
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/proxy/:deviceId/config
router.post('/:deviceId/config', async (req, res) => {
  const { ip, port, username, password, mode } = req.body;
  if (!ip || !port) {
    return res.json({ success: false, error: 'Missing ip or port' });
  }

  // Save config locally on dashboard
  const device = getDevice(req.params.deviceId);
  if (!device) return res.json({ success: false, error: 'Device not found' });

  const proxyConfig: ProxyConfig = {
    ip, port: Number(port), username: username || '', password: password || '',
    enabled: device.proxyConfig?.enabled ?? false,
    mode: mode || device.proxyConfig?.mode || 'none',
    timezone: req.body.timezone || device.proxyConfig?.timezone,
    locale: req.body.locale || device.proxyConfig?.locale,
    latitude: req.body.latitude ?? device.proxyConfig?.latitude,
    longitude: req.body.longitude ?? device.proxyConfig?.longitude,
  };
  updateDevice(device.id, { proxyConfig });

  // Push to device (include mode)
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/config', {
    ip, port: Number(port), username: username || '', password: password || '', mode: mode || 'none',
  });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/proxy/:deviceId/start
router.post('/:deviceId/start', async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/start');
  if (result.ok) {
    // Verify proxy is actually running on device
    const verify = await verifyProxyRunning(req.params.deviceId);
    if (verify.running) {
      const device = getDevice(req.params.deviceId);
      if (device?.proxyConfig) {
        updateDevice(req.params.deviceId, {
          proxyConfig: { ...device.proxyConfig, enabled: true },
          proxyStatus: 'running',
        });
      } else {
        updateDevice(req.params.deviceId, { proxyStatus: 'running' });
      }
      res.json({ success: true, data: result.data });
    } else {
      // Device says it started but verification shows it's not running
      updateDevice(req.params.deviceId, { proxyStatus: 'stopped' });
      res.json({ success: false, error: 'Proxy started but crashed immediately (sing-box failed)', data: result.data });
    }
  } else {
    res.json({ success: false, data: result.data, error: result.error });
  }
});

// POST /api/proxy/:deviceId/stop
router.post('/:deviceId/stop', async (req, res) => {
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/stop');
  if (result.ok) {
    const device = getDevice(req.params.deviceId);
    if (device?.proxyConfig) {
      updateDevice(req.params.deviceId, {
        proxyConfig: { ...device.proxyConfig, enabled: false },
        proxyStatus: 'stopped',
      });
    } else {
      updateDevice(req.params.deviceId, { proxyStatus: 'stopped' });
    }
  }
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/proxy/:deviceId/spoof
router.post('/:deviceId/spoof', async (req, res) => {
  const { timezone, locale, latitude, longitude, mode } = req.body;

  // Save spoof settings locally
  const device = getDevice(req.params.deviceId);
  if (device?.proxyConfig) {
    updateDevice(req.params.deviceId, {
      proxyConfig: {
        ...device.proxyConfig,
        ...(mode !== undefined && { mode }),
        ...(timezone !== undefined && { timezone }),
        ...(locale !== undefined && { locale }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
    });
  }

  // Push to device — include mode so device knows whether to spoof or not
  const effectiveMode = mode || device?.proxyConfig?.mode || 'none';
  const result = await callDeviceApi(req.params.deviceId, 'POST', '/api/proxy/spoof', {
    mode: effectiveMode, timezone, locale, latitude, longitude,
  });
  res.json({ success: result.ok, data: result.data, error: result.error });
});

// POST /api/proxy/batch/config - Apply proxy config to multiple devices
router.post('/batch/config', async (req, res) => {
  const { deviceIds, ip, port, username, password, mode } = req.body;
  if (!deviceIds?.length || !ip || !port) {
    return res.json({ success: false, error: 'Missing deviceIds, ip, or port' });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};
  for (const deviceId of deviceIds) {
    const proxyConfig: ProxyConfig = {
      ip, port: Number(port), username: username || '', password: password || '',
      enabled: false, mode: mode || 'none',
    };
    updateDevice(deviceId, { proxyConfig });

    const result = await callDeviceApi(deviceId, 'POST', '/api/proxy/config', {
      ip, port: Number(port), username: username || '', password: password || '', mode: mode || 'none',
    });
    results[deviceId] = { ok: result.ok, error: result.error };
  }
  const allOk = Object.values(results).every(r => r.ok);
  res.json({ success: allOk, data: results, ...(allOk ? {} : { error: 'Một số thiết bị không nhận được config' }) });
});

// POST /api/proxy/batch/start - Start proxy on multiple devices
router.post('/batch/start', async (req, res) => {
  const { deviceIds } = req.body;
  if (!deviceIds?.length) {
    return res.json({ success: false, error: 'Missing deviceIds' });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};
  for (const deviceId of deviceIds) {
    const result = await callDeviceApi(deviceId, 'POST', '/api/proxy/start');
    if (result.ok) {
      // Verify proxy is actually running
      const verify = await verifyProxyRunning(deviceId);
      if (verify.running) {
        const device = getDevice(deviceId);
        if (device?.proxyConfig) {
          updateDevice(deviceId, {
            proxyConfig: { ...device.proxyConfig, enabled: true },
            proxyStatus: 'running',
          });
        }
        results[deviceId] = { ok: true };
      } else {
        updateDevice(deviceId, { proxyStatus: 'stopped' });
        results[deviceId] = { ok: false, error: 'Proxy started but crashed (sing-box failed)' };
      }
    } else {
      results[deviceId] = { ok: false, error: result.error };
    }
  }
  const allOk = Object.values(results).every(r => r.ok);
  res.json({ success: allOk, data: results, ...(allOk ? {} : { error: 'Một số thiết bị không bật được proxy' }) });
});

// POST /api/proxy/batch/stop - Stop proxy on multiple devices
router.post('/batch/stop', async (req, res) => {
  const { deviceIds } = req.body;
  if (!deviceIds?.length) {
    return res.json({ success: false, error: 'Missing deviceIds' });
  }

  const results: Record<string, { ok: boolean; error?: string }> = {};
  for (const deviceId of deviceIds) {
    const result = await callDeviceApi(deviceId, 'POST', '/api/proxy/stop');
    if (result.ok) {
      const device = getDevice(deviceId);
      if (device?.proxyConfig) {
        updateDevice(deviceId, {
          proxyConfig: { ...device.proxyConfig, enabled: false },
          proxyStatus: 'stopped',
        });
      }
    }
    results[deviceId] = { ok: result.ok, error: result.error };
  }
  const allOk = Object.values(results).every(r => r.ok);
  res.json({ success: allOk, data: results });
});

// GET /api/proxy/geolocate/:ip — Tra cứu vị trí địa lý từ IP
router.get('/geolocate/:ip', async (req, res) => {
  try {
    const response = await fetch(
      `http://ip-api.com/json/${req.params.ip}?fields=status,country,regionName,city,lat,lon,timezone`
    );
    const data = await response.json();
    if (data.status === 'success') {
      res.json({ success: true, data });
    } else {
      res.json({ success: false, error: 'Không thể xác định vị trí từ IP' });
    }
  } catch {
    res.json({ success: false, error: 'Lỗi khi tra cứu IP' });
  }
});

export default router;
