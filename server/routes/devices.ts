import { Router } from 'express';
import * as dm from '../services/device-manager';
import { readCollection } from '../store';

const router = Router();

// GET /api/devices
router.get('/', (_req, res) => {
  res.json({ success: true, data: dm.getAllDevices() });
});

// GET /api/devices/:id
router.get('/:id', (req, res) => {
  const device = dm.getDevice(req.params.id);
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true, data: device });
});

// POST /api/devices
router.post('/', (req, res) => {
  const { name, tailscaleIp, vncPort, httpPort, iosVersion, model, group, battery, vncPassword } = req.body;
  if (!name || !tailscaleIp) {
    return res.status(400).json({ success: false, error: 'name and tailscaleIp are required' });
  }

  // Enforce device limit for non-admin users
  const authUser = (req as any).user;
  if (authUser && authUser.role !== 'admin') {
    const users = readCollection<{ id: string; packageId?: string }>('users');
    const user = users.find(u => u.id === authUser.id);
    if (user?.packageId) {
      const packages = readCollection<{ id: string; name: string; maxDevices: number }>('packages');
      const pkg = packages.find(p => p.id === user.packageId);
      if (pkg) {
        const allDevices = dm.getAllDevices();
        const userDeviceCount = allDevices.filter(d => d.ownerId === authUser.id).length;
        if (userDeviceCount >= pkg.maxDevices) {
          return res.status(403).json({
            success: false,
            error: `Đã đạt giới hạn ${pkg.maxDevices} thiết bị (gói ${pkg.name})`,
          });
        }
      }
    }
  }

  const device = dm.createDevice({
    name,
    tailscaleIp,
    vncPort: vncPort || 5901,
    httpPort: httpPort || 8080,
    iosVersion: iosVersion || 'Unknown',
    model: model || 'iPhone',
    group: group || '',
    battery: battery || 0,
    vncPassword: vncPassword || '',
    ownerId: authUser?.id,
  });
  res.status(201).json({ success: true, data: device });
});

// PUT /api/devices/:id
router.put('/:id', (req, res) => {
  const device = dm.updateDevice(req.params.id, req.body);
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true, data: device });
});

// DELETE /api/devices/:id
router.delete('/:id', (req, res) => {
  const ok = dm.deleteDevice(req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true });
});

// --- Groups ---

// GET /api/devices/groups/all
router.get('/groups/all', (_req, res) => {
  res.json({ success: true, data: dm.getAllGroups() });
});

// POST /api/devices/groups
router.post('/groups', (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  const group = dm.createGroup(name, color || '#6366f1');
  res.status(201).json({ success: true, data: group });
});

// PUT /api/devices/groups/:id
router.put('/groups/:id', (req, res) => {
  const group = dm.updateGroup(req.params.id, req.body);
  if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
  res.json({ success: true, data: group });
});

// DELETE /api/devices/groups/:id
router.delete('/groups/:id', (req, res) => {
  const ok = dm.deleteGroup(req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Group not found' });
  res.json({ success: true });
});

export default router;
