import { Router } from 'express';
import * as se from '../services/script-engine';
import { findDeviceGlobal } from '../services/device-manager';
import { getTenantId, getAuthUserId, isAdmin } from '../helpers/get-user';

const router = Router();

// GET /api/scripts
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: await se.getScriptsForTenant(tenantId) });
});

// GET /api/scripts/:id
router.get('/:id', async (req, res) => {
  const tenantId = getTenantId(req);
  const scripts = await se.getScriptsForTenant(tenantId);
  const script = scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true, data: script });
});

// POST /api/scripts
router.post('/', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name, description, steps, channel, graphData } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  const script = await se.createScriptForTenant(userId, { name, description: description || '', steps: steps || [], channel, graphData });
  res.status(201).json({ success: true, data: script });
});

// PUT /api/scripts/:id
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  // Ownership check: tìm script trong tenant user hoặc admin xem tất cả
  if (isAdmin(req)) {
    // Admin: tìm trong tất cả tenants
    const allScripts = await se.getScriptsForTenant(undefined);
    const target = allScripts.find(s => s.id === req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'Script not found' });
    const tid = (target as any).__tenantId || userId;
    const script = await se.updateScriptForTenant(tid, req.params.id, req.body);
    if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
    return res.json({ success: true, data: script });
  }

  const script = await se.updateScriptForTenant(userId, req.params.id, req.body);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true, data: script });
});

// DELETE /api/scripts/:id
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (isAdmin(req)) {
    const allScripts = await se.getScriptsForTenant(undefined);
    const target = allScripts.find(s => s.id === req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'Script not found' });
    const tid = (target as any).__tenantId || userId;
    const ok = await se.deleteScriptForTenant(tid, req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Script not found' });
    return res.json({ success: true });
  }

  const ok = await se.deleteScriptForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true });
});

// POST /api/scripts/:id/run — run script on a device
router.post('/:id/run', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

  // Check script ownership: script phải thuộc tenant user
  const userScripts = await se.getScriptsForTenant(isAdmin(req) ? undefined : userId);
  const script = userScripts.find(s => s.id === req.params.id);
  if (!script) return res.status(403).json({ success: false, error: 'Không có quyền chạy script này' });

  // Check device ownership: device phải thuộc tenant user
  const found = await findDeviceGlobal(deviceId);
  if (!found) return res.status(404).json({ success: false, error: 'Device not found' });
  if (!isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  // Run in background — truyền userId để execution history lưu đúng tenant
  se.executeScript(req.params.id, deviceId, 'Manual run', undefined, userId).catch(err => {
    console.error('Script execution error:', err);
  });

  res.json({ success: true, data: { executionId: '', status: 'started', scriptName: script.name } });
});

// GET /api/scripts/executions/latest — get latest execution status
router.get('/executions/latest', async (req, res) => {
  const tenantId = getTenantId(req);
  const history = await se.getExecutionHistoryForTenant(tenantId);
  const latest = history.length > 0 ? history[history.length - 1] : null;
  res.json({ success: true, data: latest });
});

// POST /api/scripts/:id/stop
router.post('/:id/stop', (req, res) => {
  const { executionId } = req.body;
  if (!executionId) return res.status(400).json({ success: false, error: 'executionId is required' });
  se.stopExecution(executionId);
  res.json({ success: true });
});

// GET /api/scripts/history/all
router.get('/history/all', async (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: await se.getExecutionHistoryForTenant(tenantId) });
});

export default router;
