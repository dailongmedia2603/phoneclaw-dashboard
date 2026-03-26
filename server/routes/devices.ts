import { Router } from 'express';
import * as dm from '../services/device-manager';

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
  const { name, tailscaleIp, vncPort, httpPort, iosVersion, model, group, battery } = req.body;
  if (!name || !tailscaleIp) {
    return res.status(400).json({ success: false, error: 'name and tailscaleIp are required' });
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
