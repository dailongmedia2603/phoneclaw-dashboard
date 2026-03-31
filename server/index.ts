import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { config } from './config';
import { startHealthChecks, stopHealthChecks } from './services/device-manager';
import { startScheduler, stopScheduler } from './services/scheduler';
import { stopAllProxies } from './services/vnc-proxy';
import { readCollection, writeCollection, generateId, readUserCollection, writeUserCollection } from './store';

import authRoutes, { authMiddleware } from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import devicesRoutes from './routes/devices';
import controlRoutes from './routes/control';
import scriptsRoutes from './routes/scripts';
import schedulesRoutes from './routes/schedules';
import logsRoutes from './routes/logs';
import settingsRoutes from './routes/settings';
import vncViewerRoutes from './routes/vnc-viewer';
import videosRoutes from './routes/videos';
import customNodesRoutes from './routes/custom-nodes';
import sharedScriptsRoutes from './routes/shared-scripts';
import proxyRoutes from './routes/proxy';
import packagesRoutes from './routes/packages';
import { migrateToTenantStructure } from './migration';

import type { Notification, WsMessage } from '../src/types';

const app = express();
const server = http.createServer(app);

// --- WebSocket ---
const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  ws.on('close', () => clients.delete(ws));
  ws.on('error', () => clients.delete(ws));
});

function broadcast(message: WsMessage) {
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

function addNotification(type: Notification['type'], title: string, message: string, userId?: string) {
  const notification: Notification = {
    id: generateId(),
    type,
    title,
    message,
    read: false,
    timestamp: new Date().toISOString(),
    userId,
  };

  if (userId) {
    // User-specific notification → tenant file
    const notifications = readUserCollection<Notification>(userId, 'notifications');
    notifications.push(notification);
    if (notifications.length > 200) notifications.splice(0, notifications.length - 200);
    writeUserCollection(userId, 'notifications', notifications);
  } else {
    // System notification → shared file
    const notifications = readCollection<Notification>('notifications');
    notifications.push(notification);
    if (notifications.length > 200) notifications.splice(0, notifications.length - 200);
    writeCollection('notifications', notifications);
  }

  broadcast({ type: 'notification', payload: notification, timestamp: notification.timestamp });
}

// --- Middleware ---
app.use(express.json({ limit: '500mb' }));

// CORS
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- Auth ---
app.use('/api/auth', authRoutes);
app.use(authMiddleware);

// --- API Routes ---
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/scripts', scriptsRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/vnc-viewer', vncViewerRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/custom-nodes', customNodesRoutes);
app.use('/api/shared-scripts', sharedScriptsRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/packages', packagesRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Migrate data cũ sang tenant structure (chạy 1 lần) ---
migrateToTenantStructure();

// --- Start Services ---
startHealthChecks((device) => {
  broadcast({
    type: 'device:status',
    payload: device,
    timestamp: new Date().toISOString(),
  });

  if (device.status === 'offline') {
    addNotification('warning', 'Device Offline', `${device.name} (${device.tailscaleIp}) went offline`, device.ownerId);
  }
});

startScheduler((execution) => {
  broadcast({
    type: execution.status === 'running' ? 'script:progress' : 'script:complete',
    payload: execution,
    timestamp: new Date().toISOString(),
  });

  if (execution.status === 'error') {
    addNotification('error', 'Script Failed', `${execution.scriptName} failed on ${execution.targetName}: ${execution.error}`, execution.ownerId);
  } else if (execution.status === 'success') {
    addNotification('success', 'Script Complete', `${execution.scriptName} completed on ${execution.targetName}`, execution.ownerId);
  }
});

// --- Graceful Shutdown ---
function shutdown() {
  console.log('Shutting down...');
  stopHealthChecks();
  stopScheduler();
  stopAllProxies();
  server.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// --- Start Server ---
server.listen(config.port, config.host, () => {
  console.log(`PhoneClaw Dashboard Server running at http://${config.host}:${config.port}`);
  console.log(`WebSocket available at ws://${config.host}:${config.port}/ws`);
});

export { app, server, broadcast, addNotification };
