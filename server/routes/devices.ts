import { Router } from 'express';
import * as dm from '../services/device-manager';
import { readCollection } from '../store';
import { getTenantId, getAuthUserId, isAdmin } from '../helpers/get-user';
import { checkQuota } from '../helpers/check-quota';

const router = Router();

// GET /api/devices
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: await dm.getDevicesForTenant(tenantId) });
});

// GET /api/devices/:id
router.get('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  const found = await dm.findDeviceGlobal(req.params.id);

  if (!found) {
    // Fallback legacy (trước migration)
    const device = await dm.getDevice(req.params.id);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
    return res.json({ success: true, data: device });
  }

  // Ownership check: mỗi user chỉ xem device của mình
  if (found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  res.json({ success: true, data: found.device });
});

// POST /api/devices
router.post('/', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name, tailscaleIp, vncPort, httpPort, iosVersion, model, group, battery, vncPassword } = req.body;
  if (!name || !tailscaleIp) {
    return res.status(400).json({ success: false, error: 'name and tailscaleIp are required' });
  }

  // Enforce device limit
  const quota = await checkQuota(req, 'devices');
  if (!quota.allowed) return res.status(403).json({ success: false, error: quota.error });

  const device = await dm.createDeviceForTenant(userId, {
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
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  const found = await dm.findDeviceGlobal(req.params.id);

  if (!found) {
    // Fallback legacy
    const device = await dm.updateDevice(req.params.id, req.body);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
    return res.json({ success: true, data: device });
  }

  if (found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền sửa thiết bị này' });
  }

  const device = await dm.updateDeviceForTenant(found.tenantId, req.params.id, req.body);
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true, data: device });
});

// DELETE /api/devices/:id
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  const found = await dm.findDeviceGlobal(req.params.id);

  if (!found) {
    // Fallback legacy
    const ok = await dm.deleteDevice(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Device not found' });
    return res.json({ success: true });
  }

  if (found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền xoá thiết bị này' });
  }

  const ok = await dm.deleteDeviceForTenant(found.tenantId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Device not found' });
  res.json({ success: true });
});

// --- Groups ---

// GET /api/devices/groups/all
router.get('/groups/all', async (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: await dm.getGroupsForTenant(tenantId) });
});

// POST /api/devices/groups
router.post('/groups', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name, color } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  const group = await dm.createGroupForTenant(userId, name, color || '#6366f1');
  res.status(201).json({ success: true, data: group });
});

// PUT /api/devices/groups/:id
router.put('/groups/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const group = await dm.updateGroupForTenant(userId, req.params.id, req.body);
  if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
  res.json({ success: true, data: group });
});

// DELETE /api/devices/groups/:id
router.delete('/groups/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const ok = await dm.deleteGroupForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Group not found' });
  res.json({ success: true });
});

export default router;
