import { Router, Request, Response } from 'express';
import { readCollection, writeCollection, generateId, readUserCollection } from '../store';
import { adminOnly } from './auth';
import { getAuthUserId } from '../helpers/get-user';
import { getDevicesForTenant } from '../services/device-manager';
import { getScriptsForTenant } from '../services/script-engine';
import { getSchedulesForTenant } from '../services/scheduler';
import type { Notification } from '../../src/types';

const router = Router();

interface Package {
  id: string;
  name: string;
  maxDevices: number;
  maxScripts: number;
  maxSchedules: number;
  proxyEnabled: boolean;
  gpsSpoofEnabled: boolean;
  apiTokensEnabled: boolean;
  maxVideoStorageMb: number;
  createdAt: string;
}

/** Migrate packages cũ (chỉ có maxDevices) sang schema mới */
function migratePackage(pkg: any): Package {
  return {
    id: pkg.id,
    name: pkg.name,
    maxDevices: pkg.maxDevices ?? 1,
    maxScripts: pkg.maxScripts ?? -1,
    maxSchedules: pkg.maxSchedules ?? -1,
    proxyEnabled: pkg.proxyEnabled ?? true,
    gpsSpoofEnabled: pkg.gpsSpoofEnabled ?? true,
    apiTokensEnabled: pkg.apiTokensEnabled ?? true,
    maxVideoStorageMb: pkg.maxVideoStorageMb ?? -1,
    createdAt: pkg.createdAt ?? new Date().toISOString(),
  };
}

async function getPackages(): Promise<Package[]> {
  const raw = await readCollection<any>('packages');
  return raw.map(migratePackage);
}

async function savePackages(packages: Package[]) {
  await writeCollection('packages', packages);
}

// GET /api/packages — list all packages
router.get('/', async (_req: Request, res: Response) => {
  res.json({ success: true, data: await getPackages() });
});

// GET /api/packages/my-limits — user xem giới hạn + usage gói mình
router.get('/my-limits', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const users = await readCollection<{ id: string; packageId?: string }>('users');
  const user = users.find(u => u.id === userId);

  if (!user?.packageId) {
    return res.json({ success: true, data: null }); // no package = no limits
  }

  const packages = await getPackages();
  const pkg = packages.find(p => p.id === user.packageId);
  if (!pkg) return res.json({ success: true, data: null });

  const devices = await getDevicesForTenant(userId);
  const scripts = await getScriptsForTenant(userId);
  const schedules = await getSchedulesForTenant(userId);

  interface VideoItem { size: number }
  const videos = await readUserCollection<VideoItem>(userId, 'videos');
  const videoStorageUsedBytes = videos.reduce((sum, v) => sum + (v.size || 0), 0);

  return res.json({
    success: true,
    data: {
      package: pkg,
      usage: {
        devices: devices.length,
        scripts: scripts.length,
        schedules: schedules.length,
        videoStorageMB: Math.round(videoStorageUsedBytes / (1024 * 1024)),
      },
    },
  });
});

// POST /api/packages — create package
router.post('/', adminOnly, async (req: Request, res: Response) => {
  const { name, maxDevices, maxScripts, maxSchedules, proxyEnabled, gpsSpoofEnabled, apiTokensEnabled, maxVideoStorageMb } = req.body;
  if (!name?.trim() || !maxDevices || maxDevices < 1) {
    return res.status(400).json({ success: false, error: 'Tên gói và số lượng thiết bị tối đa là bắt buộc' });
  }

  const packages = await getPackages();
  const pkg: Package = {
    id: generateId(),
    name: name.trim(),
    maxDevices: Number(maxDevices),
    maxScripts: maxScripts !== undefined ? Number(maxScripts) : -1,
    maxSchedules: maxSchedules !== undefined ? Number(maxSchedules) : -1,
    proxyEnabled: proxyEnabled !== undefined ? Boolean(proxyEnabled) : true,
    gpsSpoofEnabled: gpsSpoofEnabled !== undefined ? Boolean(gpsSpoofEnabled) : true,
    apiTokensEnabled: apiTokensEnabled !== undefined ? Boolean(apiTokensEnabled) : true,
    maxVideoStorageMb: maxVideoStorageMb !== undefined ? Number(maxVideoStorageMb) : -1,
    createdAt: new Date().toISOString(),
  };

  packages.push(pkg);
  await savePackages(packages);
  res.json({ success: true, data: pkg });
});

// PUT /api/packages/:id — update package
router.put('/:id', adminOnly, async (req: Request, res: Response) => {
  const packages = await getPackages();
  const idx = packages.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Gói không tồn tại' });

  const { name, maxDevices, maxScripts, maxSchedules, proxyEnabled, gpsSpoofEnabled, apiTokensEnabled, maxVideoStorageMb } = req.body;

  if (name) packages[idx].name = name.trim();
  if (maxDevices !== undefined && maxDevices >= 1) packages[idx].maxDevices = Number(maxDevices);
  if (maxScripts !== undefined) packages[idx].maxScripts = Number(maxScripts);
  if (maxSchedules !== undefined) packages[idx].maxSchedules = Number(maxSchedules);
  if (proxyEnabled !== undefined) packages[idx].proxyEnabled = Boolean(proxyEnabled);
  if (gpsSpoofEnabled !== undefined) packages[idx].gpsSpoofEnabled = Boolean(gpsSpoofEnabled);
  if (apiTokensEnabled !== undefined) packages[idx].apiTokensEnabled = Boolean(apiTokensEnabled);
  if (maxVideoStorageMb !== undefined) packages[idx].maxVideoStorageMb = Number(maxVideoStorageMb);

  await savePackages(packages);
  res.json({ success: true, data: packages[idx] });
});

// DELETE /api/packages/:id — delete package (check no users assigned)
router.delete('/:id', adminOnly, async (req: Request, res: Response) => {
  const packages = await getPackages();
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ success: false, error: 'Gói không tồn tại' });

  const users = await readCollection<{ id: string; packageId?: string }>('users');
  const usersWithPkg = users.filter(u => u.packageId === req.params.id);
  if (usersWithPkg.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Không thể xoá: có ${usersWithPkg.length} người dùng đang sử dụng gói này`,
    });
  }

  const filtered = packages.filter(p => p.id !== req.params.id);
  await savePackages(filtered);
  res.json({ success: true });
});

// POST /api/packages/upgrade-request — user requests package upgrade
router.post('/upgrade-request', async (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const users = await readCollection<{ id: string; name: string; packageId?: string }>('users');
  const user = users.find(u => u.id === authUser.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  const packages = await getPackages();
  const pkg = user.packageId ? packages.find(p => p.id === user.packageId) : null;

  const pkgInfo = pkg ? `gói ${pkg.name}, ${pkg.maxDevices} phone` : 'không có gói';
  const notifications = await readCollection<Notification>('notifications');
  const notification: Notification = {
    id: generateId(),
    type: 'info',
    title: 'Yêu cầu nâng cấp gói',
    message: `${user.name} yêu cầu nâng cấp gói (hiện tại: ${pkgInfo})`,
    read: false,
    timestamp: new Date().toISOString(),
  };
  notifications.push(notification);
  if (notifications.length > 200) notifications.splice(0, notifications.length - 200);
  await writeCollection('notifications', notifications);

  res.json({ success: true });
});

export default router;
