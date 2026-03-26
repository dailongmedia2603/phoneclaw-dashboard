import { Router } from 'express';
import * as sched from '../services/scheduler';

const router = Router();

// GET /api/schedules
router.get('/', (_req, res) => {
  res.json({ success: true, data: sched.getAllSchedules() });
});

// GET /api/schedules/:id
router.get('/:id', (req, res) => {
  const schedule = sched.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

// POST /api/schedules
router.post('/', (req, res) => {
  const { name, scriptId, scriptName, targetType, targetId, targetName, cron, enabled } = req.body;
  if (!name || !scriptId || !cron) {
    return res.status(400).json({ success: false, error: 'name, scriptId, and cron are required' });
  }
  const schedule = sched.createSchedule({
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
router.put('/:id', (req, res) => {
  const data = { ...req.body };
  if (data.cron) {
    data.nextRun = sched.getNextRun(data.cron);
  }
  const schedule = sched.updateSchedule(req.params.id, data);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});

// DELETE /api/schedules/:id
router.delete('/:id', (req, res) => {
  const ok = sched.deleteSchedule(req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true });
});

// PUT /api/schedules/:id/toggle
router.put('/:id/toggle', (req, res) => {
  const schedule = sched.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  const updated = sched.updateSchedule(req.params.id, { enabled: !schedule.enabled });
  res.json({ success: true, data: updated });
});

export default router;
