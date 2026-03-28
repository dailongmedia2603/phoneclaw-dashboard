import { Router } from 'express';
import { readCollection, writeCollection, generateId } from '../store';
import { getExecutionHistory } from '../services/script-engine';
import type { ActivityLog, ScreenshotLog, ScheduleHistory } from '../../src/types';

const router = Router();

// --- Activity Logs ---

// GET /api/logs/activity
router.get('/activity', (req, res) => {
  const logs = readCollection<ActivityLog>('activity-logs');
  const { type, deviceId, limit } = req.query;

  let filtered = logs;
  if (type) filtered = filtered.filter(l => l.type === type);
  if (deviceId) filtered = filtered.filter(l => l.deviceId === deviceId);

  // Sort newest first
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (limit) filtered = filtered.slice(0, parseInt(limit as string));
  res.json({ success: true, data: filtered });
});

// POST /api/logs/activity
router.post('/activity', (req, res) => {
  const { type, action, details, deviceId, deviceName, userId } = req.body;
  const logs = readCollection<ActivityLog>('activity-logs');
  const log: ActivityLog = {
    id: generateId(),
    type: type || 'system',
    action,
    details: details || '',
    deviceId,
    deviceName,
    userId,
    timestamp: new Date().toISOString(),
  };
  logs.push(log);
  // Keep last 1000
  if (logs.length > 1000) logs.splice(0, logs.length - 1000);
  writeCollection('activity-logs', logs);
  res.status(201).json({ success: true, data: log });
});

// --- Screenshots ---

// GET /api/logs/screenshots
router.get('/screenshots', (req, res) => {
  const screenshots = readCollection<ScreenshotLog>('screenshots');
  const { deviceId, limit } = req.query;

  let filtered = screenshots;
  if (deviceId) filtered = filtered.filter(s => s.deviceId === deviceId);

  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (limit) filtered = filtered.slice(0, parseInt(limit as string));

  res.json({ success: true, data: filtered });
});

// POST /api/logs/screenshots
router.post('/screenshots', (req, res) => {
  const { deviceId, deviceName, url, thumbnail, scriptName, step } = req.body;
  const screenshots = readCollection<ScreenshotLog>('screenshots');
  const screenshot: ScreenshotLog = {
    id: generateId(),
    deviceId,
    deviceName,
    url,
    thumbnail: thumbnail || url,
    scriptName,
    step,
    timestamp: new Date().toISOString(),
  };
  screenshots.push(screenshot);
  // Keep last 500
  if (screenshots.length > 500) screenshots.splice(0, screenshots.length - 500);
  writeCollection('screenshots', screenshots);
  res.status(201).json({ success: true, data: screenshot });
});

// --- Execution History ---

// GET /api/logs/executions
router.get('/executions', (_req, res) => {
  const history = getExecutionHistory();
  res.json({ success: true, data: history });
});

// --- Cleanup ---

// POST /api/logs/cleanup
router.post('/cleanup', (req, res) => {
  const { days } = req.body;
  const cutoff = new Date(Date.now() - (days || 30) * 86400000).toISOString();

  // Clean execution history (nhật ký kịch bản)
  const executions = readCollection<ScheduleHistory>('execution-history');
  const filteredExecs = executions.filter(e => e.startedAt > cutoff);
  writeCollection('execution-history', filteredExecs);

  // Also clean activity logs and screenshots
  const logs = readCollection<ActivityLog>('activity-logs');
  const filteredLogs = logs.filter(l => l.timestamp > cutoff);
  writeCollection('activity-logs', filteredLogs);

  const screenshots = readCollection<ScreenshotLog>('screenshots');
  const filteredScreenshots = screenshots.filter(s => s.timestamp > cutoff);
  writeCollection('screenshots', filteredScreenshots);

  res.json({
    success: true,
    data: {
      executionsRemoved: executions.length - filteredExecs.length,
      logsRemoved: logs.length - filteredLogs.length,
      screenshotsRemoved: screenshots.length - filteredScreenshots.length,
    },
  });
});

// POST /api/logs/cleanup-all — xoá toàn bộ nhật ký
router.post('/cleanup-all', (_req, res) => {
  writeCollection('execution-history', []);
  writeCollection('activity-logs', []);
  writeCollection('screenshots', []);
  res.json({ success: true, data: { message: 'All logs cleared' } });
});

export default router;
