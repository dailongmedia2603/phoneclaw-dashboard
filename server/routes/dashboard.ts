import { Router } from 'express';
import { getAllDevices } from '../services/device-manager';
import { getExecutionHistory } from '../services/script-engine';
import { readCollection } from '../store';
import type { DashboardStats, Notification } from '../../src/types';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', (_req, res) => {
  const devices = getAllDevices();
  const history = getExecutionHistory();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  // Online history (last 24h, hourly)
  const onlineHistory: { time: string; count: number }[] = [];
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 3600000);
    const hourStr = `${hour.getHours().toString().padStart(2, '0')}:00`;
    // Count devices that were seen in that hour
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
  const notifications = readCollection<Notification>('notifications');
  const limit = parseInt(req.query.limit as string) || 20;
  const sorted = notifications
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
  res.json({ success: true, data: sorted });
});

// PUT /api/dashboard/notifications/:id/read
router.put('/notifications/:id/read', (req, res) => {
  const notifications = readCollection<Notification>('notifications');
  const idx = notifications.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Notification not found' });
  notifications[idx].read = true;
  const { writeCollection } = require('../store');
  writeCollection('notifications', notifications);
  res.json({ success: true });
});

export default router;
