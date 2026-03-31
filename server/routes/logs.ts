import { Router } from 'express';
import { readUserCollection, writeUserCollection, readAllTenantsCollection, getAllTenantIds, generateId } from '../store';
import { getExecutionHistoryForTenant } from '../services/script-engine';
import { getTenantId, getAuthUserId, isAdmin } from '../helpers/get-user';
import type { ActivityLog, ScreenshotLog } from '../../src/types';

const router = Router();

// --- Activity Logs ---

// GET /api/logs/activity
router.get('/activity', (req, res) => {
  const tenantId = getTenantId(req);
  const logs = tenantId
    ? readUserCollection<ActivityLog>(tenantId, 'activity-logs')
    : readAllTenantsCollection<ActivityLog>('activity-logs');

  const { type, deviceId, limit } = req.query;

  let filtered = logs as ActivityLog[];
  if (type) filtered = filtered.filter(l => l.type === type);
  if (deviceId) filtered = filtered.filter(l => l.deviceId === deviceId);

  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (limit) filtered = filtered.slice(0, parseInt(limit as string));
  res.json({ success: true, data: filtered });
});

// POST /api/logs/activity
router.post('/activity', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { type, action, details, deviceId, deviceName } = req.body;
  const logs = readUserCollection<ActivityLog>(userId, 'activity-logs');
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
  if (logs.length > 1000) logs.splice(0, logs.length - 1000);
  writeUserCollection(userId, 'activity-logs', logs);
  res.status(201).json({ success: true, data: log });
});

// --- Screenshots ---

// GET /api/logs/screenshots
router.get('/screenshots', (req, res) => {
  const tenantId = getTenantId(req);
  const screenshots = tenantId
    ? readUserCollection<ScreenshotLog>(tenantId, 'screenshots')
    : readAllTenantsCollection<ScreenshotLog>('screenshots');

  const { deviceId, limit } = req.query;

  let filtered = screenshots as ScreenshotLog[];
  if (deviceId) filtered = filtered.filter(s => s.deviceId === deviceId);

  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  if (limit) filtered = filtered.slice(0, parseInt(limit as string));
  res.json({ success: true, data: filtered });
});

// POST /api/logs/screenshots
router.post('/screenshots', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { deviceId, deviceName, url, thumbnail, scriptName, step } = req.body;
  const screenshots = readUserCollection<ScreenshotLog>(userId, 'screenshots');
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
  if (screenshots.length > 500) screenshots.splice(0, screenshots.length - 500);
  writeUserCollection(userId, 'screenshots', screenshots);
  res.status(201).json({ success: true, data: screenshot });
});

// --- Execution History ---

// GET /api/logs/executions
router.get('/executions', (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: getExecutionHistoryForTenant(tenantId) });
});

// --- Cleanup ---

// POST /api/logs/cleanup
router.post('/cleanup', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { days } = req.body;
  const cutoff = new Date(Date.now() - (days || 30) * 86400000).toISOString();

  if (isAdmin(req)) {
    // Admin: cleanup tất cả tenants
    let totalRemoved = { executions: 0, logs: 0, screenshots: 0 };
    for (const tid of getAllTenantIds()) {
      totalRemoved.executions += cleanupTenantCollection(tid, 'execution-history', cutoff, 'startedAt');
      totalRemoved.logs += cleanupTenantCollection(tid, 'activity-logs', cutoff, 'timestamp');
      totalRemoved.screenshots += cleanupTenantCollection(tid, 'screenshots', cutoff, 'timestamp');
    }
    return res.json({ success: true, data: { executionsRemoved: totalRemoved.executions, logsRemoved: totalRemoved.logs, screenshotsRemoved: totalRemoved.screenshots } });
  }

  // User: cleanup chỉ tenant mình
  const execRemoved = cleanupTenantCollection(userId, 'execution-history', cutoff, 'startedAt');
  const logsRemoved = cleanupTenantCollection(userId, 'activity-logs', cutoff, 'timestamp');
  const ssRemoved = cleanupTenantCollection(userId, 'screenshots', cutoff, 'timestamp');
  res.json({ success: true, data: { executionsRemoved: execRemoved, logsRemoved: logsRemoved, screenshotsRemoved: ssRemoved } });
});

// POST /api/logs/cleanup-all
router.post('/cleanup-all', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (isAdmin(req)) {
    for (const tid of getAllTenantIds()) {
      writeUserCollection(tid, 'execution-history', []);
      writeUserCollection(tid, 'activity-logs', []);
      writeUserCollection(tid, 'screenshots', []);
    }
  } else {
    writeUserCollection(userId, 'execution-history', []);
    writeUserCollection(userId, 'activity-logs', []);
    writeUserCollection(userId, 'screenshots', []);
  }

  res.json({ success: true, data: { message: 'All logs cleared' } });
});

// Helper: cleanup a tenant collection by date field, return count removed
function cleanupTenantCollection(userId: string, collection: string, cutoff: string, dateField: string): number {
  const items = readUserCollection<Record<string, unknown>>(userId, collection);
  const filtered = items.filter(item => (item[dateField] as string) > cutoff);
  const removed = items.length - filtered.length;
  if (removed > 0) writeUserCollection(userId, collection, filtered);
  return removed;
}

export default router;
