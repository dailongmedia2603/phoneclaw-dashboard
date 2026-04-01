import { Router } from 'express';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { readSingleton, writeSingleton, readCollection, readUserCollection, writeUserCollection, getAllTenantIds, ensureTenantDir } from '../store';
import { getActiveProxies, startProxy, stopProxy } from '../services/vnc-proxy';
import { findDeviceGlobal } from '../services/device-manager';
import { getAuthUserId, isAdmin } from '../helpers/get-user';
import { adminOnly } from './auth';
import type { AppSettings, VpsStatus } from '../../src/types';

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const DATA_DIR = path.join(__dirname2, '..', 'data');

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
router.get('/', async (_req, res) => {
  const settings = await readSingleton<AppSettings>('settings', DEFAULT_SETTINGS);
  res.json({ success: true, data: settings });
});

// PUT /api/settings (admin only)
router.put('/', adminOnly, async (req, res) => {
  const current = await readSingleton<AppSettings>('settings', DEFAULT_SETTINGS);
  const updated = { ...current, ...req.body };
  await writeSingleton('settings', updated);
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
router.post('/vnc-proxy/start', async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

  // Device ownership check
  const userId = getAuthUserId(req);
  const found = await findDeviceGlobal(deviceId);
  if (found && !isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  const proxy = startProxy(deviceId);
  if (!proxy) return res.status(500).json({ success: false, error: 'Failed to start VNC proxy' });
  res.json({ success: true, data: proxy });
});

// POST /api/settings/vnc-proxy/stop
router.post('/vnc-proxy/stop', async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

  // Device ownership check
  const userId = getAuthUserId(req);
  const found = await findDeviceGlobal(deviceId);
  if (found && !isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

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

// POST /api/settings/test-telegram — gửi tin nhắn thử qua Telegram Bot
router.post('/test-telegram', async (req, res) => {
  const { botToken, chatId } = req.body;
  if (!botToken || !chatId) {
    return res.json({ success: false, error: 'Vui lòng nhập Bot Token và Chat ID' });
  }

  try {
    const apiUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: 'PhoneClaw Dashboard: Kết nối Telegram thành công!',
        parse_mode: 'HTML',
      }),
    });
    const data = await response.json();
    if (data.ok) {
      res.json({ success: true });
    } else {
      res.json({ success: false, error: data.description || 'Gửi tin nhắn thất bại' });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Kết nối thất bại';
    res.json({ success: false, error: msg });
  }
});

// GET /api/settings/diagnose — chẩn đoán data migration (admin only)
router.get('/diagnose', adminOnly, async (_req, res) => {
  const COLLECTIONS = ['devices', 'device-groups', 'scripts', 'schedules', 'execution-history', 'activity-logs', 'screenshots', 'videos', 'custom-nodes', 'notifications'];
  const result: Record<string, unknown> = {};

  // Check .bak files
  const bakFiles: Record<string, number> = {};
  for (const col of COLLECTIONS) {
    const bakPath = path.join(DATA_DIR, `${col}.json.bak`);
    if (fs.existsSync(bakPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(bakPath, 'utf-8'));
        bakFiles[col] = Array.isArray(data) ? data.length : 0;
      } catch { bakFiles[col] = -1; }
    }
  }
  result.bakFiles = bakFiles;

  // Check legacy files (chưa migrate)
  const legacyFiles: Record<string, number> = {};
  for (const col of COLLECTIONS) {
    const fp = path.join(DATA_DIR, `${col}.json`);
    if (fs.existsSync(fp)) {
      try {
        const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
        legacyFiles[col] = Array.isArray(data) ? data.length : 0;
      } catch { legacyFiles[col] = -1; }
    }
  }
  result.legacyFiles = legacyFiles;

  // Check tenant dirs
  const tenants: Record<string, Record<string, number>> = {};
  const tenantIds = await getAllTenantIds();
  for (const tid of tenantIds) {
    tenants[tid] = {};
    for (const col of COLLECTIONS) {
      const data = await readUserCollection(tid, col);
      if (data.length > 0) tenants[tid][col] = data.length;
    }
  }
  result.tenants = tenants;
  result.tenantIds = tenantIds;

  // Users info
  const users = await readCollection<{ id: string; name: string; role: string }>('users');
  result.users = users.map(u => ({ id: u.id, name: u.name, role: u.role }));

  res.json({ success: true, data: result });
});

// POST /api/settings/force-recovery — khôi phục data từ .bak vào admin tenant (admin only)
router.post('/force-recovery', adminOnly, async (_req, res) => {
  const COLLECTIONS = ['devices', 'device-groups', 'scripts', 'schedules', 'execution-history', 'activity-logs', 'screenshots', 'videos', 'custom-nodes', 'notifications'];

  const users = await readCollection<{ id: string; role: string }>('users');
  const admin = users.find(u => u.role === 'admin');
  if (!admin) return res.json({ success: false, error: 'Không tìm thấy admin' });

  ensureTenantDir(admin.id);
  const recovered: Record<string, number> = {};

  for (const col of COLLECTIONS) {
    // Source 1: .bak file
    const bakPath = path.join(DATA_DIR, `${col}.json.bak`);
    // Source 2: legacy file vẫn còn
    const legacyPath = path.join(DATA_DIR, `${col}.json`);

    let sourceData: unknown[] = [];
    let source = '';

    if (fs.existsSync(bakPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(bakPath, 'utf-8'));
        if (Array.isArray(data) && data.length > 0) { sourceData = data; source = '.bak'; }
      } catch {}
    }

    if (sourceData.length === 0 && fs.existsSync(legacyPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(legacyPath, 'utf-8'));
        if (Array.isArray(data) && data.length > 0) { sourceData = data; source = 'legacy'; }
      } catch {}
    }

    if (sourceData.length === 0) continue;

    // Merge với existing tenant data (không ghi đè)
    const existing = await readUserCollection<Record<string, unknown>>(admin.id, col);
    const existingIds = new Set(existing.map(item => (item as any).id));
    const newItems = sourceData.filter((item: any) => !existingIds.has(item.id));

    if (newItems.length > 0) {
      await writeUserCollection(admin.id, col, [...existing, ...newItems]);
      recovered[col] = newItems.length;
    }
  }

  res.json({ success: true, data: { adminId: admin.id, recovered } });
});

export default router;
