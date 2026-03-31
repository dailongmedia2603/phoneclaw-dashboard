import { Router } from 'express';
import * as dm from '../services/device-manager';
import { readCollection, getAllTenantIds } from '../store';
import { getTenantId, getAuthUserId, isAdmin } from '../helpers/get-user';

const router = Router();

// GET /api/devices
router.get('/', (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: dm.getDevicesForTenant(tenantId) });
});

// GET /api/devices/:id
router.get('/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const found = dm.findDeviceGlobal(req.params.id);

  if (!found) {
    // Fallback legacy (trước migration)
    const device = dm.getDevice(req.params.id);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
    return res.json({ success: true, data: device });
  }

  // Ownership check: user chỉ xem device mình, admin xem tất cả
  if (!isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  res.json({ success: true, data: found.device });
});

// POST /api/devices
router.post('/', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name, tailscaleIp, vncPort, httpPort, iosVersion, model, group, battery, vncPassword } = req.body;
  if (!name || !tailscaleIp) {
    return res.status(400).json({ success: false, error: 'name and tailscaleIp are required' });
  }

  // Enforce device limit for non-admin users
  if (!isAdmin(req)) {
    const users = readCollection<{ id: string; packageId?: string }>('users');
    const user = users.find(u => u.id === userId);
    if (user?.packageId) {
      const packages = readCollection<{ id: string; name: string; maxDevices: number }>('packages');
      const pkg = packages.find(p => p.id === user.packageId);
      if (pkg) {
        const userDevices = dm.getDevicesForTenant(userId);
        if (userDevices.length >= pkg.maxDevices) {
          return res.status(403).json({
            success: false,
            error: `Đã đạt giới hạn ${pkg.maxDevices} thiết bị (gói ${pkg.name})`,
          });
        }
      }
    }
  }

  const device = dm.createDeviceForTenant(userId, {
    name,
    tailscaleIp,
    vncPort: vncPort || 5901,
    httpPort: httpPort || 8080,
    iosVersion: iosVersion || 'Unknown',
    model: model || 'iPhone',
    group: group || '',
    battery: battery || 0,
    vncPassword: vncPassword || '',
  });
  res.status(201).json({ success: true, data: device });
});

// PUT /api/devices/:id
router.put('/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const found = dm.findDeviceGlobal(req.params.id);

  if (!found) {
    // Fallback legacy
    const device = dm.updateDevice(req.params.id, req.body);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
    return res.json({ success: true, data: device });
  }

  if (!isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền sửa thiết bị này' });
  }

  const device = dm.updateDeviceForTenant(found.tenantId, req.params.id, req.body);
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true, data: device });
});

// DELETE /api/devices/:id
router.delete('/:id', (req, res) => {
  const userId = getAuthUserId(req);
  const found = dm.findDeviceGlobal(req.params.id);

  if (!found) {
    // Fallback legacy
    const ok = dm.deleteDevice(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Device not found' });
    return res.json({ success: true });
  }

  if (!isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền xoá thiết bị này' });
  }

  const ok = dm.deleteDeviceForTenant(found.tenantId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true });
});

// --- Groups ---

// GET /api/devices/groups/all
router.get('/groups/all', (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: dm.getGroupsForTenant(tenantId) });
});

// POST /api/devices/groups
router.post('/groups', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name, color } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  const group = dm.createGroupForTenant(userId, name, color || '#6366f1');
  res.status(201).json({ success: true, data: group });
});

// PUT /api/devices/groups/:id
router.put('/groups/:id', (req, res) => {
  const userId = getAuthUserId(req);

  // Tìm group trong tất cả tenants
  for (const tid of dm.getGroupsForTenant(undefined).map(g => (g as any).__tenantId).filter(Boolean)) {
    // Nếu admin hoặc chủ sở hữu
    if (isAdmin(req) || tid === userId) {
      const group = dm.updateGroupForTenant(tid as string, req.params.id, req.body);
      if (group) return res.json({ success: true, data: group });
    }
  }

  // Fallback: thử update trực tiếp trong tenant của user
  if (userId) {
    const group = dm.updateGroupForTenant(userId, req.params.id, req.body);
    if (group) return res.json({ success: true, data: group });
  }

  res.status(404).json({ success: false, error: 'Group not found' });
});

// DELETE /api/devices/groups/:id
router.delete('/groups/:id', (req, res) => {
  const userId = getAuthUserId(req);

  if (userId) {
    // User xoá group của mình
    const ok = dm.deleteGroupForTenant(userId, req.params.id);
    if (ok) return res.json({ success: true });
  }

  // Admin fallback: tìm group trong mọi tenant
  if (isAdmin(req)) {
    for (const tid of getAllTenantIds()) {
      const ok = dm.deleteGroupForTenant(tid, req.params.id);
      if (ok) return res.json({ success: true });
    }
  }

  res.status(404).json({ success: false, error: 'Group not found' });
});

export default router;
