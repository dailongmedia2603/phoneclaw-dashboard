import { Router } from 'express';
import { getDevicesForTenant } from '../services/device-manager';
import { getExecutionHistoryForTenant } from '../services/script-engine';
import { readCollection, writeCollection, readUserCollection, writeUserCollection, readAllTenantsCollection } from '../store';
import { getTenantId, getAuthUserId, isAdmin } from '../helpers/get-user';
import type { DashboardStats, Notification } from '../../src/types';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', (req, res) => {
  const tenantId = getTenantId(req);
  const devices = getDevicesForTenant(tenantId);
  const history = getExecutionHistoryForTenant(tenantId);

  const now = new Date();

  // Online history (last 24h, hourly)
  const onlineHistory: { time: string; count: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const hourStr = `${hour.getHours().toString().padStart(2, '0')}:00`;
    const count = devices.filter(d => {
      const lastSeen = new Date(d.lastSeen);
      return lastSeen >= new Date(hour.getTime() - 3600000) && lastSeen <= hour;
    }).length;
    onlineHistory.push({ time: hourStr, count: count || devices.filter(d => d.status !== 'offline').length });
  }

  // Script run history (last 7 days)
  const scriptRunHistory: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getTime() - i * 86400000);
    const dateStr = day.toISOString().split('T')[0];
    const count = history.filter(h => h.startedAt.startsWith(dateStr)).length;
    scriptRunHistory.push({ date: dateStr, count });
  }

  const stats: DashboardStats = {
    totalDevices: devices.length,
    onlineDevices: devices.filter(d => d.status === 'online' || d.status === 'running').length,
    offlineDevices: devices.filter(d => d.status === 'offline').length,
    runningScripts: devices.filter(d => d.status === 'running').length,
    onlineHistory,
    scriptRunHistory,
  };

  res.json({ success: true, data: stats });
});

// GET /api/dashboard/notifications
router.get('/notifications', (req, res) => {
  const tenantId = getTenantId(req);
  const limit = parseInt(req.query.limit as string) || 20;

  let notifications: Notification[];
  if (tenantId) {
    // User: đọc từ tenant + shared notifications
    const userNotifs = readUserCollection<Notification>(tenantId, 'notifications');
    const sharedNotifs = readCollection<Notification>('notifications');
    notifications = [...userNotifs, ...sharedNotifs];
  } else {
    // Admin: đọc tất cả tenant notifications + shared
    const allTenantNotifs = readAllTenantsCollection<Notification>('notifications') as Notification[];
    const sharedNotifs = readCollection<Notification>('notifications');
    notifications = [...allTenantNotifs, ...sharedNotifs];
  }

  const sorted = notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
  res.json({ success: true, data: sorted });
});

// PUT /api/dashboard/notifications/:id/read
router.put('/notifications/:id/read', (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  // Tìm notification trong tenant user trước
  const tenantNotifs = readUserCollection<Notification>(userId, 'notifications');
  const tenantIdx = tenantNotifs.findIndex(n => n.id === req.params.id);
  if (tenantIdx !== -1) {
    tenantNotifs[tenantIdx].read = true;
    writeUserCollection(userId, 'notifications', tenantNotifs);
    return res.json({ success: true });
  }

  // Fallback: tìm trong shared notifications
  const sharedNotifs = readCollection<Notification>('notifications');
  const sharedIdx = sharedNotifs.findIndex(n => n.id === req.params.id);
  if (sharedIdx !== -1) {
    sharedNotifs[sharedIdx].read = true;
    writeCollection('notifications', sharedNotifs);
    return res.json({ success: true });
  }

  res.status(404).json({ success: false, error: 'Notification not found' });
});

export default router;
