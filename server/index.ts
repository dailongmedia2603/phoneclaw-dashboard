import express from 'express';
import http from 'http';
import net from 'net';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { config } from './config';
import { startDeviceMonitor, stopDeviceMonitor } from './services/device-manager';
import { startScheduler, stopScheduler } from './services/scheduler';
import { stopAllProxies } from './services/vnc-proxy';
import { readCollection, writeCollection, generateId, readUserCollection, writeUserCollection, readSingleton, initDb, closeDb } from './store';

import authRoutes, { authMiddleware, seedDefaultAdmin } from './routes/auth';
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
import heartbeatRoutes from './routes/heartbeat';
import apiTokenRoutes from './routes/api-tokens';
import externalApiRoutes from './routes/external-api';
import socialAccountsRoutes from './routes/social-accounts';
import gmailAuthRoutes from './routes/gmail-auth';
import pixelCheckerRoutes from './routes/pixel-checker';
import exitNodeRoutes from './routes/exit-node';
import { apiTokenAuthMiddleware } from './middleware/api-token-auth';
import { ipRateLimiter, userRateLimiter, authFailLimiter } from './middleware/rate-limit';
import { auditLogMiddleware } from './middleware/audit-log';
import { migrateToTenantStructure } from './migration';

import type { Notification, WsMessage, AppSettings } from '../src/types';

const app = express();
const server = http.createServer(app);

// --- WebSocket ---
const wss = new WebSocketServer({ noServer: true }); // Manual upgrade handling (see server.on('upgrade'))
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

async function addNotification(type: Notification['type'], title: string, message: string, userId?: string) {
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
    const notifications = await readUserCollection<Notification>(userId, 'notifications');
    notifications.push(notification);
    if (notifications.length > 200) notifications.splice(0, notifications.length - 200);
    await writeUserCollection(userId, 'notifications', notifications);
  } else {
    // System notification → shared file
    const notifications = await readCollection<Notification>('notifications');
    notifications.push(notification);
    if (notifications.length > 200) notifications.splice(0, notifications.length - 200);
    await writeCollection('notifications', notifications);
  }

  broadcast({ type: 'notification', payload: notification, timestamp: notification.timestamp });

  // Send Telegram notification if configured
  try {
    const settings = await readSingleton<AppSettings>('settings', {} as AppSettings);
    const nc = settings.notifications;
    if (nc?.telegramBotToken && nc?.telegramChatId) {
      const shouldSend =
        (type === 'warning' && nc.alertOnDeviceOffline) ||
        (type === 'error' && nc.alertOnScriptError) ||
        (type === 'success' && nc.alertOnScriptComplete);

      if (shouldSend) {
        const emoji = type === 'error' ? '🔴' : type === 'warning' ? '⚠️' : '✅';
        fetch(`https://api.telegram.org/bot${nc.telegramBotToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: nc.telegramChatId,
            text: `${emoji} <b>${title}</b>\n${message}`,
            parse_mode: 'HTML',
          }),
        }).catch(err => console.error('[Telegram] Send failed:', err.message));
      }
    }
  } catch {
    // Silently ignore — Telegram is optional
  }
}

// --- VNC WebSocket Proxy ---
import { findDeviceGlobal } from './services/device-manager';

const vncWss = new WebSocketServer({ noServer: true });

vncWss.on('connection', async (ws, req) => {
  const url = req.url || '';
  const match = url.match(/^\/vnc\/([^/]+)\/websockify/);
  if (!match) { ws.close(); return; }

  const deviceId = match[1];
  const found = await findDeviceGlobal(deviceId);
  const device = found?.device;
  if (!device) { ws.close(1008, 'Device not found'); return; }

  // Connect raw TCP to phone's VNC server
  const vncSocket = net.connect(device.vncPort, device.tailscaleIp);

  vncSocket.on('connect', () => {
    console.log(`[VNC Proxy] Connected to ${device.name} (${device.tailscaleIp}:${device.vncPort})`);
  });

  // Browser → VNC: WebSocket binary message → raw TCP
  ws.on('message', (data: Buffer) => {
    if (vncSocket.writable) vncSocket.write(data);
  });

  // VNC → Browser: raw TCP → WebSocket binary message
  vncSocket.on('data', (data: Buffer) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data, { binary: true });
    }
  });

  ws.on('close', () => vncSocket.destroy());
  ws.on('error', () => vncSocket.destroy());
  vncSocket.on('close', () => ws.close());
  vncSocket.on('error', (err) => {
    console.error(`[VNC Proxy] ${device.name}: ${err.message}`);
    ws.close(1011, 'VNC connection failed');
  });
});

server.on('upgrade', (req, socket, head) => {
  const url = req.url || '';

  if (url === '/ws') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else if (url.match(/^\/vnc\/[^/]+\/websockify/)) {
    vncWss.handleUpgrade(req, socket, head, (ws) => {
      vncWss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

// --- Middleware ---
app.use(express.json({ limit: '500mb' }));

// CORS
app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Token');
  if (_req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// --- Auth ---
app.use('/api/auth', authRoutes);
app.use('/api/heartbeat', heartbeatRoutes); // Before auth — phones use Tailscale network auth
// Gmail OAuth — all endpoints before authMiddleware (start/callback are public, generate-link verifies JWT internally)
app.use('/api/gmail-auth', gmailAuthRoutes);

// --- External API v1 (mount BEFORE authMiddleware — uses own API Token auth) ---
app.use('/api/v1/external',
  authFailLimiter,
  ipRateLimiter,
  apiTokenAuthMiddleware,
  userRateLimiter,
  auditLogMiddleware,
  externalApiRoutes
);

// --- Dashboard Auth (UNCHANGED) ---
app.use(authMiddleware);

// --- Token Management (needs JWT auth from above) ---
app.use('/api/auth/tokens', apiTokenRoutes);

// --- API Routes (UNCHANGED) ---
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
app.use('/api/social-accounts', socialAccountsRoutes);
app.use('/api/pixel-checker', pixelCheckerRoutes);
app.use('/api/exit-node', exitNodeRoutes);

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve noVNC static files — /vnc/:deviceId/core/rfb.js → /opt/novnc/core/rfb.js
// noVNC library is installed at /opt/novnc on VPS (or ../TrollVNC/novnc locally)
const novncPath = process.env.NOVNC_PATH || '/opt/novnc';
app.use('/vnc/:deviceId', express.static(novncPath));

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Async Server Startup ---
async function main() {
  // 1. Initialize database (no-op if USE_POSTGRES=false)
  await initDb();

  // 2. Seed default admin if no users exist
  await seedDefaultAdmin();

  // 3. Migrate data cũ sang tenant structure (chạy 1 lần, skip khi PG mode)
  await migrateToTenantStructure();

  // 3a. Load sing-box exit node state
  const { loadPersistedState } = await import('./services/singbox-manager');
  loadPersistedState();

  // 3. Start Services
  await startDeviceMonitor((device) => {
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

  // 4. Start HTTP server
  server.listen(config.port, config.host, () => {
    console.log(`PhoneClaw Dashboard Server running at http://${config.host}:${config.port}`);
    console.log(`WebSocket available at ws://${config.host}:${config.port}/ws`);
  });
}

// --- Graceful Shutdown ---
async function shutdown() {
  console.log('Shutting down...');
  stopDeviceMonitor();
  stopScheduler();
  stopAllProxies();
  await closeDb();
  server.close();
  process.exit(0);
}
process.on('SIGINT', () => { shutdown(); });
process.on('SIGTERM', () => { shutdown(); });

// --- Start ---
main().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { app, server, broadcast, addNotification };
