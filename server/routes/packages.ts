import { Router, Request, Response } from 'express';
import { readCollection, writeCollection, generateId } from '../store';
import type { Notification } from '../../src/types';

const router = Router();

interface Package {
  id: string;
  name: string;
  maxDevices: number;
  createdAt: string;
}

function getPackages(): Package[] {
  return readCollection<Package>('packages');
}

function savePackages(packages: Package[]) {
  writeCollection('packages', packages);
}

// GET /api/packages — list all packages
router.get('/', (_req: Request, res: Response) => {
  res.json({ success: true, data: getPackages() });
});

// POST /api/packages — create package
router.post('/', (req: Request, res: Response) => {
  const { name, maxDevices } = req.body;
  if (!name?.trim() || !maxDevices || maxDevices < 1) {
    return res.status(400).json({ success: false, error: 'Tên gói và số lượng thiết bị tối đa là bắt buộc' });
  }

  const packages = getPackages();
  const pkg: Package = {
    id: generateId(),
    name: name.trim(),
    maxDevices: Number(maxDevices),
    createdAt: new Date().toISOString(),
  };

  packages.push(pkg);
  savePackages(packages);
  res.json({ success: true, data: pkg });
});

// PUT /api/packages/:id — update package
router.put('/:id', (req: Request, res: Response) => {
  const { name, maxDevices } = req.body;
  const packages = getPackages();
  const idx = packages.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Gói không tồn tại' });

  if (name) packages[idx].name = name.trim();
  if (maxDevices && maxDevices >= 1) packages[idx].maxDevices = Number(maxDevices);

  savePackages(packages);
  res.json({ success: true, data: packages[idx] });
});

// DELETE /api/packages/:id — delete package (check no users assigned)
router.delete('/:id', (req: Request, res: Response) => {
  const packages = getPackages();
  const pkg = packages.find(p => p.id === req.params.id);
  if (!pkg) return res.status(404).json({ success: false, error: 'Gói không tồn tại' });

  // Check if any users are using this package
  const users = readCollection<{ id: string; packageId?: string }>('users');
  const usersWithPkg = users.filter(u => u.packageId === req.params.id);
  if (usersWithPkg.length > 0) {
    return res.status(400).json({
      success: false,
      error: `Không thể xoá: có ${usersWithPkg.length} người dùng đang sử dụng gói này`,
    });
  }

  const filtered = packages.filter(p => p.id !== req.params.id);
  savePackages(filtered);
  res.json({ success: true });
});

// POST /api/packages/upgrade-request — user requests package upgrade
router.post('/upgrade-request', (req: Request, res: Response) => {
  const authUser = (req as any).user;
  if (!authUser) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const users = readCollection<{ id: string; name: string; packageId?: string }>('users');
  const user = users.find(u => u.id === authUser.id);
  if (!user) return res.status(404).json({ success: false, error: 'User not found' });

  const packages = getPackages();
  const pkg = user.packageId ? packages.find(p => p.id === user.packageId) : null;

  // Create notification for admin
  const pkgInfo = pkg ? `gói ${pkg.name}, ${pkg.maxDevices} phone` : 'không có gói';
  const notifications = readCollection<Notification>('notifications');
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
  writeCollection('notifications', notifications);

  res.json({ success: true });
});

export default router;
