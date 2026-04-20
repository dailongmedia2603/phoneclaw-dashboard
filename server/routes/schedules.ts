import { Router } from 'express';
import * as sched from '../services/scheduler';
import { getScriptsForTenant } from '../services/script-engine';
import { findDeviceGlobal, getGroupsForTenant } from '../services/device-manager';
import { getTenantId, getAuthUserId } from '../helpers/get-user';
import { checkQuota } from '../helpers/check-quota';
import { resolveScriptInputs, InputValidationError } from '../services/script-inputs';

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

  // Enforce schedules quota
  const quota = await checkQuota(req, 'schedules');
  if (!quota.allowed) return res.status(403).json({ success: false, error: quota.error });

  const { name, scriptId, scriptName, targetType, targetId, targetName, cron, enabled, variables } = req.body;
  if (!name || !scriptId || !cron) {
    return res.status(400).json({ success: false, error: 'name, scriptId, and cron are required' });
  }

  // Verify scriptId thuộc user
  const userScripts = await getScriptsForTenant(userId);
  const script = userScripts.find(s => s.id === scriptId);
  if (!script) {
    return res.status(403).json({ success: false, error: 'Script không thuộc về bạn' });
  }

  // Validate variables against script.inputs schema (if any)
  if (variables !== undefined) {
    try {
      await resolveScriptInputs(script, variables, userId);
    } catch (err: any) {
      if (err instanceof InputValidationError) {
        return res.status(400).json({ success: false, error: `variables: ${err.message}`, field: err.field });
      }
      throw err;
    }
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
    ...(variables !== undefined ? { variables } : {}),
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

  // If variables provided, validate against script schema
  if (data.variables !== undefined) {
    const schedules = await sched.getSchedulesForTenant(userId);
    const existing = schedules.find(s => s.id === req.params.id);
    const scriptId = data.scriptId || existing?.scriptId;
    if (scriptId) {
      const userScripts = await getScriptsForTenant(userId);
      const script = userScripts.find(s => s.id === scriptId);
      if (script) {
        try {
          await resolveScriptInputs(script, data.variables, userId);
        } catch (err: any) {
          if (err instanceof InputValidationError) {
            return res.status(400).json({ success: false, error: `variables: ${err.message}`, field: err.field });
          }
          throw err;
        }
      }
    }
  }

  const schedule = await sched.updateScheduleForTenant(userId, req.params.id, data);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const ok = await sched.deleteScheduleForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true });
});

// PUT /api/schedules/:id/toggle
router.put('/:id/toggle', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const schedules = await sched.getSchedulesForTenant(userId);
  const schedule = schedules.find(s => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  const updated = await sched.updateScheduleForTenant(userId, req.params.id, { enabled: !schedule.enabled });
  res.json({ success: true, data: updated });
});

export default router;
