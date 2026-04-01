import { Router, Request, Response } from 'express';
import { readCollection, writeCollection, generateId } from '../store';
import { adminOnly } from './auth';
import type { Notification } from '../../src/types';

const router = Router();

interface Package {
  id: string;
  name: string;
  maxDevices: number;
  createdAt: string;
}

async function getPackages(): Promise<Package[]> {
  return await readCollection<Package>('packages');
}

async function savePackages(packages: Package[]) {
  await writeCollection('packages', packages);
}

// GET /api/packages — list all packages
router.get('/', async (_req: Request, res: Response) => {
  res.json({ success: true, data: await getPackages() });
});

// POST /api/packages — create package
router.post('/', adminOnly, async (req: Request, res: Response) => {
  const { name, maxDevices } = req.body;
  if (!name?.trim() || !maxDevices || maxDevices < 1) {
    return res.status(400).json({ success: false, error: 'Tên gói và số lượng thiết bị tối đa là bắt buộc' });
  }

  const packages = await getPackages();
  const pkg: Package = {
    id: generateId(),
    name: name.trim(),
    maxDevices: Number(maxDevices),
    createdAt: new Date().toISOString(),
  };

  packages.push(pkg);
  await savePackages(packages);
  res.json({ success: true, data: pkg });
});

// PUT /api/packages/:id — update package
router.put('/:id', adminOnly, async (req: Request, res: Response) => {
  const { name, maxDevices } = req.body;
  const packages = await getPackages();
  const idx = packages.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Gói không tồn tại' });

  if (name) packages[idx].name = name.trim();
  if (maxDevices && maxDevices >= 1) packages[idx].maxDevices = Number(maxDevices);

  await savePackages(packages);
  res.json({ success: true, data: packages[idx] });
});

// DELETE /api/packages/:id — delete package (check no users assigned)
router.delete('/:id', adminOnly, async (req: Request, res: Response) => {
  const packages = await getPackages();
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ success: false, error: 'Gói không tồn tại' });

  // Check if any users are using this package
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

  // Create notification for admin
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
