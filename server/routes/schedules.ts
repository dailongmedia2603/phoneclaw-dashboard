import { Router } from 'express';
import * as sched from '../services/scheduler';
import { getScriptsForTenant } from '../services/script-engine';
import { findDeviceGlobal, getGroupsForTenant } from '../services/device-manager';
import { getTenantId, getAuthUserId, isAdmin } from '../helpers/get-user';

const router = Router();

// GET /api/schedules
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: await sched.getSchedulesForTenant(tenantId) });
});

// GET /api/schedules/:id
router.get('/:id', async (req, res) => {
  const tenantId = getTenantId(req);
  const schedules = await sched.getSchedulesForTenant(tenantId);
  const schedule = schedules.find(s => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

// POST /api/schedules
router.post('/', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name, scriptId, scriptName, targetType, targetId, targetName, cron, enabled } = req.body;
  if (!name || !scriptId || !cron) {
    return res.status(400).json({ success: false, error: 'name, scriptId, and cron are required' });
  }

  // Verify scriptId thuộc user
  if (!isAdmin(req)) {
    const userScripts = await getScriptsForTenant(userId);
    if (!userScripts.find(s => s.id === scriptId)) {
      return res.status(403).json({ success: false, error: 'Script không thuộc về bạn' });
    }

    // Verify targetId thuộc user
    if (targetType === 'device') {
      const found = await findDeviceGlobal(targetId);
      if (!found || found.tenantId !== userId) {
        return res.status(403).json({ success: false, error: 'Thiết bị không thuộc về bạn' });
      }
    } else if (targetType === 'group') {
      const userGroups = await getGroupsForTenant(userId);
      if (!userGroups.find(g => g.id === targetId)) {
        return res.status(403).json({ success: false, error: 'Nhóm thiết bị không thuộc về bạn' });
      }
    }
  }

  const schedule = await sched.createScheduleForTenant(userId, {
    name,
    scriptId,
    scriptName: scriptName || '',
    targetType: targetType || 'device',
    targetId: targetId || '',
    targetName: targetName || '',
    cron,
    enabled: enabled !== false,
    nextRun: sched.getNextRun(cron),
  });
  res.status(201).json({ success: true, data: schedule });
});

// PUT /api/schedules/:id
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const data = { ...req.body };
  if (data.cron) {
    data.nextRun = sched.getNextRun(data.cron);
  }

  if (isAdmin(req)) {
    // Admin: tìm trong tất cả tenants
    const all = await sched.getSchedulesForTenant(undefined);
    const target = all.find(s => s.id === req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'Schedule not found' });
    const tid = (target as any).__tenantId || userId;
    const schedule = await sched.updateScheduleForTenant(tid, req.params.id, data);
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    return res.json({ success: true, data: schedule });
  }

  const schedule = await sched.updateScheduleForTenant(userId, req.params.id, data);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (isAdmin(req)) {
    const all = await sched.getSchedulesForTenant(undefined);
    const target = all.find(s => s.id === req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'Schedule not found' });
    const tid = (target as any).__tenantId || userId;
    const ok = await sched.deleteScheduleForTenant(tid, req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Schedule not found' });
    return res.json({ success: true });
  }

  const ok = await sched.deleteScheduleForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true });
});

// PUT /api/schedules/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (isAdmin(req)) {
    const all = await sched.getSchedulesForTenant(undefined);
    const target = all.find(s => s.id === req.params.id);
    if (!target) return res.status(404).json({ success: false, error: 'Schedule not found' });
    const tid = (target as any).__tenantId || userId;
    const updated = await sched.updateScheduleForTenant(tid, req.params.id, { enabled: !target.enabled });
    return res.json({ success: true, data: updated });
  }

  const schedules = await sched.getSchedulesForTenant(userId);
  const schedule = schedules.find(s => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  const updated = await sched.updateScheduleForTenant(userId, req.params.id, { enabled: !schedule.enabled });
  res.json({ success: true, data: updated });
});

export default router;
