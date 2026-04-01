import { readCollection, writeCollection, generateId, readUserCollection, writeUserCollection, readAllTenantsCollection, getAllTenantIds } from '../store';
import { config } from '../config';
import { Agent, setGlobalDispatcher } from 'undici';
import type { Device, DeviceGroup } from '../../src/types';

// ============================================================
// HTTP Keep-Alive: tái sử dụng TCP connections tới phones
// Giảm ~50% latency (bỏ TCP handshake lặp lại mỗi request)
// ============================================================
const keepAliveAgent = new Agent({
  keepAliveTimeout: 30_000,     // Giữ connection 30s (khớp heartbeat interval)
  keepAliveMaxTimeout: 60_000,  // Max idle 60s rồi tự đóng
  connections: 10,              // Max 10 concurrent connections per origin (per phone)
  pipelining: 1,                // Không pipeline (phone API không hỗ trợ)
  connect: {
    timeout: 10_000,            // Connection timeout 10s (khớp deviceApiTimeout)
  },
});
setGlobalDispatcher(keepAliveAgent);

let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let statusChangeCallback: ((device: Device) => void) | null = null;

// --- Device CRUD ---

export async function getAllDevices(): Promise<Device[]> {
  return readCollection<Device>('devices');
}

export async function getDevice(id: string): Promise<Device | undefined> {
  const all = await getAllDevices();
  return all.find(d => d.id === id);
}

export async function createDevice(data: Omit<Device, 'id' | 'status' | 'uptime' | 'lastSeen' | 'createdAt'>): Promise<Device> {
  const devices = await getAllDevices();
  const device: Device = {
    ...data,
    id: generateId(),
    status: 'connecting',
    uptime: 0,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  devices.push(device);
  await writeCollection('devices', devices);
  // Trigger immediate health check for new device
  checkDeviceHealth(device).then(async result => {
    const updates: Partial<Device> = {
      status: result.status,
      lastSeen: result.status !== 'offline' ? new Date().toISOString() : device.lastSeen,
    };
    if (result.info?.systemVersion) updates.iosVersion = String(result.info.systemVersion);
    if (result.info?.model) updates.model = String(result.info.model);
    await updateDevice(device.id, updates);
  });
  return device;
}

export async function updateDevice(id: string, data: Partial<Device>): Promise<Device | null> {
  const devices = await getAllDevices();
  const idx = devices.findIndex(d => d.id === id);
  if (idx === -1) return null;
  devices[idx] = { ...devices[idx], ...data };
  await writeCollection('devices', devices);
  return devices[idx];
}

export async function deleteDevice(id: string): Promise<boolean> {
  const devices = await getAllDevices();
  const filtered = devices.filter(d => d.id !== id);
  if (filtered.length === devices.length) return false;
  await writeCollection('devices', filtered);
  return true;
}

// --- Device Groups ---

export async function getAllGroups(): Promise<DeviceGroup[]> {
  return readCollection<DeviceGroup>('device-groups');
}

export async function createGroup(name: string, color: string): Promise<DeviceGroup> {
  const groups = await getAllGroups();
  const group: DeviceGroup = { id: generateId(), name, color, deviceIds: [] };
  groups.push(group);
  await writeCollection('device-groups', groups);
  return group;
}

export async function updateGroup(id: string, data: Partial<DeviceGroup>): Promise<DeviceGroup | null> {
  const groups = await getAllGroups();
  const idx = groups.findIndex(g => g.id === id);
  if (idx === -1) return null;
  groups[idx] = { ...groups[idx], ...data };
  await writeCollection('device-groups', groups);
  return groups[idx];
}

export async function deleteGroup(id: string): Promise<boolean> {
  const groups = await getAllGroups();
  const filtered = groups.filter(g => g.id !== id);
  if (filtered.length === groups.length) return false;
  await writeCollection('device-groups', filtered);
  return true;
}

// ============================================================
// Tenant-scoped CRUD — per-user data isolation
// ============================================================

export async function getDevicesForTenant(tenantId?: string): Promise<Device[]> {
  if (!tenantId) {
    return readAllTenantsCollection<Device>('devices');
  }
  return readUserCollection<Device>(tenantId, 'devices');
}

export async function getGroupsForTenant(tenantId?: string): Promise<DeviceGroup[]> {
  if (!tenantId) {
    return readAllTenantsCollection<DeviceGroup>('device-groups');
  }
  return readUserCollection<DeviceGroup>(tenantId, 'device-groups');
}

export async function createDeviceForTenant(userId: string, data: Omit<Device, 'id' | 'status' | 'uptime' | 'lastSeen' | 'createdAt'>): Promise<Device> {
  const devices = await readUserCollection<Device>(userId, 'devices');
  const device: Device = {
    ...data,
    id: generateId(),
    ownerId: userId,
    status: 'connecting',
    uptime: 0,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  devices.push(device);
  await writeUserCollection(userId, 'devices', devices);

  // Register in IP lookup map
  ipDeviceMap.set(device.tailscaleIp, { deviceId: device.id, tenantId: userId });

  // Trigger immediate health check (logic giữ nguyên)
  checkDeviceHealth(device).then(async result => {
    const updates: Partial<Device> = {
      status: result.status,
      lastSeen: result.status !== 'offline' ? new Date().toISOString() : device.lastSeen,
    };
    if (result.info?.systemVersion) updates.iosVersion = String(result.info.systemVersion);
    if (result.info?.model) updates.model = String(result.info.model);
    await updateDeviceForTenant(userId, device.id, updates);

    // Push heartbeat config to phone so it starts sending heartbeats
    if (result.status === 'online') {
      pushHeartbeatConfig(device.id);
    }
  });
  return device;
}

export async function updateDeviceForTenant(userId: string, id: string, data: Partial<Device>): Promise<Device | null> {
  const devices = await readUserCollection<Device>(userId, 'devices');
  const idx = devices.findIndex(d => d.id === id);
  if (idx === -1) return null;

  // Update IP lookup map if tailscaleIp changed
  if (data.tailscaleIp && data.tailscaleIp !== devices[idx].tailscaleIp) {
    ipDeviceMap.delete(devices[idx].tailscaleIp);
    ipDeviceMap.set(data.tailscaleIp, { deviceId: id, tenantId: userId });
  }

  devices[idx] = { ...devices[idx], ...data };
  await writeUserCollection(userId, 'devices', devices);
  return devices[idx];
}

export async function deleteDeviceForTenant(userId: string, id: string): Promise<boolean> {
  const devices = await readUserCollection<Device>(userId, 'devices');
  const device = devices.find(d => d.id === id);
  const filtered = devices.filter(d => d.id !== id);
  if (filtered.length === devices.length) return false;
  await writeUserCollection(userId, 'devices', filtered);

  // Remove from IP lookup map
  if (device) {
    ipDeviceMap.delete(device.tailscaleIp);
  }

  return true;
}

export async function createGroupForTenant(userId: string, name: string, color: string): Promise<DeviceGroup> {
  const groups = await readUserCollection<DeviceGroup>(userId, 'device-groups');
  const group: DeviceGroup = { id: generateId(), name, color, deviceIds: [] };
  groups.push(group);
  await writeUserCollection(userId, 'device-groups', groups);
  return group;
}

export async function updateGroupForTenant(userId: string, id: string, data: Partial<DeviceGroup>): Promise<DeviceGroup | null> {
  const groups = await readUserCollection<DeviceGroup>(userId, 'device-groups');
  const idx = groups.findIndex(g => g.id === id);
  if (idx === -1) return null;
  groups[idx] = { ...groups[idx], ...data };
  await writeUserCollection(userId, 'device-groups', groups);
  return groups[idx];
}

export async function deleteGroupForTenant(userId: string, id: string): Promise<boolean> {
  const groups = await readUserCollection<DeviceGroup>(userId, 'device-groups');
  const filtered = groups.filter(g => g.id !== id);
  if (filtered.length === groups.length) return false;
  await writeUserCollection(userId, 'device-groups', filtered);
  return true;
}

/**
 * Tìm device theo ID — scan tất cả tenants.
 * Trả về { device, tenantId } để biết device thuộc user nào.
 */
export async function findDeviceGlobal(id: string): Promise<{ device: Device; tenantId: string } | null> {
  const tenantIds = await getAllTenantIds();
  for (const tid of tenantIds) {
    const devices = await readUserCollection<Device>(tid, 'devices');
    const device = devices.find(d => d.id === id);
    if (device) return { device, tenantId: tid };
  }
  return null;
}

// ============================================================
// IP Lookup Map — O(1) device resolution for heartbeat
// ============================================================

const ipDeviceMap = new Map<string, { deviceId: string; tenantId: string }>();

export async function rebuildIpMap(): Promise<void> {
  ipDeviceMap.clear();
  const tenantIds = await getAllTenantIds();
  for (const tenantId of tenantIds) {
    const devices = await readUserCollection<Device>(tenantId, 'devices');
    for (const device of devices) {
      ipDeviceMap.set(device.tailscaleIp, { deviceId: device.id, tenantId });
    }
  }
  console.log(`[DeviceMonitor] IP map built: ${ipDeviceMap.size} devices`);
}

// ============================================================
// Initial Health Check — used ONLY for new device creation
// ============================================================

async function checkDeviceHealth(device: Device): Promise<{ status: 'online' | 'offline'; info?: Record<string, unknown> }> {
  const apiPort = device.httpPort + 1;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.deviceApiTimeout);
    const res = await fetch(`http://${device.tailscaleIp}:${apiPort}/api/status`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      try {
        const data = await res.json();
        return { status: 'online', info: data };
      } catch {
        return { status: 'online' };
      }
    }
    if (res.status > 0) return { status: 'online' };
  } catch { /* device unreachable */ }

  return { status: 'offline' };
}

// ============================================================
// Heartbeat Handler — receives push from phone
// ============================================================

interface HeartbeatPayload {
  tailscaleIp: string;
  systemVersion?: string;
  model?: string;
  proxyStatus?: string;
  battery?: number;
}

export async function handleHeartbeat(payload: HeartbeatPayload): Promise<Device | null> {
  // 1. O(1) lookup by IP
  const mapping = ipDeviceMap.get(payload.tailscaleIp);
  if (!mapping) return null;

  const { deviceId, tenantId } = mapping;

  // 2. Read current device from disk
  const devices = await readUserCollection<Device>(tenantId, 'devices');
  const device = devices.find(d => d.id === deviceId);
  if (!device) return null;

  // 3. Do NOT override 'running' status — script-engine manages this
  if (device.currentScript) {
    await updateDeviceForTenant(tenantId, deviceId, { lastSeen: new Date().toISOString() });
    return device;
  }

  // 4. Capture previous status for transition detection
  const previousStatus = device.status;

  // 5. Build update payload
  const updateData: Partial<Device> = {
    status: 'online',
    lastSeen: new Date().toISOString(),
  };

  if (payload.systemVersion) updateData.iosVersion = String(payload.systemVersion);
  if (payload.model) updateData.model = String(payload.model);
  if (payload.battery !== undefined) updateData.battery = payload.battery;

  if (payload.proxyStatus === 'running' || payload.proxyStatus === 'stopped') {
    updateData.proxyStatus = payload.proxyStatus;
  }

  // 6. Write to disk
  const updated = await updateDeviceForTenant(tenantId, deviceId, updateData);

  console.log(
    `[Heartbeat] ← ${device.name} (${payload.tailscaleIp}) | ` +
    `status=${previousStatus}→online | battery=${payload.battery ?? '?'}% | ` +
    `proxy=${payload.proxyStatus ?? '?'} | iOS=${payload.systemVersion ?? '?'}`
  );

  // 7. Broadcast if status changed
  if (updated && statusChangeCallback && previousStatus !== 'online') {
    statusChangeCallback(updated);
  }

  // 8. Auto-apply proxy on offline→online
  if (previousStatus === 'offline' && device.proxyConfig?.enabled) {
    autoApplyProxy(device, tenantId).catch(err => {
      console.log(`[Heartbeat] Auto-apply proxy failed for ${device.name}:`, err);
    });
  }

  // 9. Auto-push heartbeat URL nếu phone chưa được cấu hình
  if (!device.heartbeatConfigured && config.heartbeatUrl) {
    pushHeartbeatConfig(device.id).then(async ok => {
      if (ok) {
        await updateDeviceForTenant(tenantId, deviceId, { heartbeatConfigured: true });
        console.log(`[Heartbeat] Auto-configured ${device.name} — sẽ không push lại nữa`);
      }
    }).catch(() => {});
  }

  return updated;
}

// ============================================================
// Staleness Checker
// ============================================================

async function runStalenessCheck() {
  const threshold = config.heartbeatStaleThreshold;
  const now = Date.now();

  const tenantIds = await getAllTenantIds();
  for (const tenantId of tenantIds) {
    const devices = await readUserCollection<Device>(tenantId, 'devices');

    for (const device of devices) {
      if (device.status === 'offline') continue;
      if (device.currentScript) continue;

      const lastSeenTime = new Date(device.lastSeen).getTime();
      const isStale = (now - lastSeenTime) > threshold;

      if (isStale) {
        const updated = await updateDeviceForTenant(tenantId, device.id, { status: 'offline' });

        if (updated && statusChangeCallback) {
          statusChangeCallback(updated);
        }

        console.log(
          `[StalenessCheck] ${device.name} marked offline ` +
          `(last seen ${Math.round((now - lastSeenTime) / 1000)}s ago)`
        );
      }
    }
  }
}

// ============================================================
// Device Monitor — start/stop
// ============================================================

export async function startDeviceMonitor(onStatusChange?: (device: Device) => void) {
  if (onStatusChange) statusChangeCallback = onStatusChange;
  if (healthCheckTimer) clearInterval(healthCheckTimer);

  // Build IP map for heartbeat lookups
  await rebuildIpMap();

  // Run staleness check immediately
  await runStalenessCheck();

  // Start staleness checker interval
  healthCheckTimer = setInterval(() => {
    runStalenessCheck().catch(err => console.error('[StalenessCheck] Error:', err));
  }, config.stalenessCheckInterval);

  console.log(
    `[DeviceMonitor] Started — staleness check every ${config.stalenessCheckInterval / 1000}s, ` +
    `stale threshold ${config.heartbeatStaleThreshold / 1000}s`
  );
}

export function stopDeviceMonitor() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
  console.log('[DeviceMonitor] Stopped');
}

// Backward-compatible aliases for index.ts
export const startHealthChecks = startDeviceMonitor;
export const stopHealthChecks = stopDeviceMonitor;

// --- Heartbeat Config Push ---

async function pushHeartbeatConfig(deviceId: string): Promise<boolean> {
  if (!config.heartbeatUrl) return false;
  const result = await callDeviceApi(deviceId, 'POST', '/api/heartbeat/config', {
    url: config.heartbeatUrl,
  });
  if (result.ok) {
    console.log(`[Heartbeat] Config pushed to device ${deviceId}: ${config.heartbeatUrl}`);
    return true;
  }
  console.log(`[Heartbeat] Failed to push config to device ${deviceId}: ${result.error}`);
  return false;
}

// --- Proxy Auto-Apply ---

async function autoApplyProxy(device: Device, tenantId?: string) {
  if (!device.proxyConfig) return;
  const { ip, port, username, password, mode, timezone, locale, latitude, longitude } = device.proxyConfig;

  if (!mode || mode === 'none') return;

  console.log(`[HealthCheck] Auto-applying proxy for ${device.name} (mode=${mode})`);

  const configResult = await callDeviceApi(device.id, 'POST', '/api/proxy/config', {
    ip, port, username, password, mode,
  });
  if (!configResult.ok) {
    console.log(`[HealthCheck] Failed to push proxy config to ${device.name}: ${configResult.error}`);
    return;
  }

  const startResult = await callDeviceApi(device.id, 'POST', '/api/proxy/start');
  if (startResult.ok) {
    if (tenantId) {
      await updateDeviceForTenant(tenantId, device.id, { proxyStatus: 'running' });
    } else {
      await updateDevice(device.id, { proxyStatus: 'running' });
    }
    console.log(`[HealthCheck] Proxy auto-started on ${device.name}`);
  } else {
    console.log(`[HealthCheck] Failed to start proxy on ${device.name}: ${startResult.error}`);
    return;
  }

  const spoofParams: Record<string, unknown> = { mode };
  if (mode === 'us') {
    if (timezone) spoofParams.timezone = timezone;
    if (locale) spoofParams.locale = locale;
    if (latitude !== undefined && longitude !== undefined) {
      spoofParams.latitude = latitude;
      spoofParams.longitude = longitude;
    }
  }
  await callDeviceApi(device.id, 'POST', '/api/proxy/spoof', spoofParams);
  console.log(`[HealthCheck] Spoof settings applied to ${device.name} (mode=${mode})`);
}

// --- Device HTTP API Proxy ---

export async function callDeviceApi(
  deviceId: string,
  method: 'GET' | 'POST',
  endpoint: string,
  body?: Record<string, unknown>
): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  // Tìm device từ tenant storage trước, fallback sang legacy storage
  const found = await findDeviceGlobal(deviceId);
  const device = found?.device ?? await getDevice(deviceId);
  if (!device) return { ok: false, error: 'Device not found' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.deviceApiTimeout);
    const apiPort = device.httpPort + 1;
    const url = `http://${device.tailscaleIp}:${apiPort}${endpoint}`;

    const res = await fetch(url, {
      method,
      signal: controller.signal,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    clearTimeout(timeout);

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('image')) {
      const buffer = await res.arrayBuffer();
      return { ok: true, data: Buffer.from(buffer).toString('base64') };
    }

    const text = await res.text();
    try {
      return { ok: res.ok, data: JSON.parse(text) };
    } catch {
      return { ok: res.ok, data: text };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    const actionEndpoints = ['/api/tap', '/api/swipe', '/api/key', '/api/launch', '/api/type'];
    const isAction = actionEndpoints.some(a => endpoint.startsWith(a));
    if (isAction && (msg.includes('terminated') || msg.includes('ECONNRESET') || msg.includes('empty'))) {
      return { ok: true, data: { ok: true, note: 'Command sent (connection closed early)' } };
    }
    return { ok: false, error: msg };
  }
}
