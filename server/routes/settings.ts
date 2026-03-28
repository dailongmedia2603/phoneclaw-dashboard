import { Router } from 'express';
import os from 'os';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readSingleton, writeSingleton } from '../store';
import { getActiveProxies, startProxy, stopProxy } from '../services/vnc-proxy';
import type { AppSettings, VpsStatus } from '../../src/types';

const router = Router();

const DEFAULT_SETTINGS: AppSettings = {
  vncDefaults: {
    port: 5901,
    httpPort: 8080,
    password: '',
    scale: 0.75,
    fps: 30,
    clipboardEnabled: true,
  },
  notifications: {
    alertOnDeviceOffline: true,
    alertOnScriptError: true,
    alertOnScriptComplete: false,
  },
  theme: 'light',
  language: 'vi',
  logRetentionDays: 30,
  screenshotRetentionDays: 7,
};

// GET /api/settings
router.get('/', (_req, res) => {
  const settings = readSingleton<AppSettings>('settings', DEFAULT_SETTINGS);
  res.json({ success: true, data: settings });
});

// PUT /api/settings
router.put('/', (req, res) => {
  const current = readSingleton<AppSettings>('settings', DEFAULT_SETTINGS);
  const updated = { ...current, ...req.body };
  writeSingleton('settings', updated);
  res.json({ success: true, data: updated });
});

// GET /api/settings/vps-status
router.get('/vps-status', (_req, res) => {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const uptime = os.uptime();

  // CPU usage (approximation from load average)
  const loadAvg = os.loadavg()[0]; // 1-minute load average
  const cpuPercent = Math.min(100, Math.round((loadAvg / cpus.length) * 100));

  const status: VpsStatus = {
    cpu: cpuPercent,
    ram: {
      used: Math.round((totalMem - freeMem) / 1024 / 1024),
      total: Math.round(totalMem / 1024 / 1024),
    },
    disk: { used: 0, total: 0 }, // Would need `df` command for real values
    bandwidth: { up: 0, down: 0 },
    uptime,
    tailscaleStatus: 'connected', // Would check `tailscale status` for real value
  };

  res.json({ success: true, data: status });
});

// --- VNC Proxy Management ---

// GET /api/settings/vnc-proxies
router.get('/vnc-proxies', (_req, res) => {
  res.json({ success: true, data: getActiveProxies() });
});

// POST /api/settings/vnc-proxy/start
router.post('/vnc-proxy/start', (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });
  const proxy = startProxy(deviceId);
  if (!proxy) return res.status(500).json({ success: false, error: 'Failed to start VNC proxy' });
  res.json({ success: true, data: proxy });
});

// POST /api/settings/vnc-proxy/stop
router.post('/vnc-proxy/stop', (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });
  stopProxy(deviceId);
  res.json({ success: true });
});

// POST /api/settings/test-r2 — kiểm tra kết nối Cloudflare R2
router.post('/test-r2', async (req, res) => {
  const { accountId, accessKeyId, secretAccessKey, bucketName } = req.body;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return res.json({ success: false, error: 'Vui lòng điền đầy đủ thông tin' });
  }

  try {
    const client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    await client.send(new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 1,
    }));

    res.json({ success: true, data: { message: 'Kết nối R2 thành công!' } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kết nối thất bại';
    res.json({ success: false, error: msg });
  }
});

export default router;
