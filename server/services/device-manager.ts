import { readCollection, writeCollection, generateId, readUserCollection, writeUserCollection, readAllTenantsCollection, getAllTenantIds } from '../store';
import { config } from '../config';
import type { Device, DeviceGroup } from '../../src/types';

let healthCheckTimer: ReturnType<typeof setInterval> | null = null;
let statusChangeCallback: ((device: Device) => void) | null = null;

// --- Device CRUD ---

export function getAllDevices(): Device[] {
  return readCollection<Device>('devices');
}

export function getDevice(id: string): Device | undefined {
  return getAllDevices().find(d => d.id === id);
}

export function createDevice(data: Omit<Device, 'id' | 'status' | 'uptime' | 'lastSeen' | 'createdAt'>): Device {
  const devices = getAllDevices();
  const device: Device = {
    ...data,
    id: generateId(),
    status: 'connecting',
    uptime: 0,
    lastSeen: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  devices.push(device);
  writeCollection('devices', devices);
  // Trigger immediate health check for new device
  checkDeviceHealth(device).then(result => {
    const updates: Partial<Device> = {
      status: result.status,
      lastSeen: result.status !== 'offline' ? new Date().toISOString() : device.lastSeen,
    };
    if (result.info?.systemVersion) updates.iosVersion = String(result.info.systemVersion);
    if (result.info?.model) updates.model = String(result.info.model);
    updateDevice(device.id, updates);
  });
  return device;
}

export function updateDevice(id: string, data: Partial<Device>): Device | null {
  const devices = getAllDevices();
  const idx = devices.findIndex(d => d.id === id);
  if (idx === -1) return null;
  devices[idx] = { ...devices[idx], ...data };
  writeCollection('devices', devices);
  return devices[idx];
}

export function deleteDevice(id: string): boolean {
  const devices = getAllDevices();
  const filtered = devices.filter(d => d.id !== id);
  if (filtered.length === devices.length) return false;
  writeCollection('devices', filtered);
  return true;
}

// --- Device Groups ---

export function getAllGroups(): DeviceGroup[] {
  return readCollection<DeviceGroup>('device-groups');
}

export function createGroup(name: string, color: string): DeviceGroup {
  const groups = getAllGroups();
  const group: DeviceGroup = { id: generateId(), name, color, deviceIds: [] };
  groups.push(group);
  writeCollection('device-groups', groups);
  return group;
}

export function updateGroup(id: string, data: Partial<DeviceGroup>): DeviceGroup | null {
  const groups = getAllGroups();
  const idx = groups.findIndex(g => g.id === id);
  if (idx === -1) return null;
  groups[idx] = { ...groups[idx], ...data };
  writeCollection('device-groups', groups);
  return groups[idx];
}

export function deleteGroup(id: string): boolean {
  const groups = getAllGroups();
  const filtered = groups.filter(g => g.id !== id);
  if (filtered.length === groups.length) return false;
  writeCollection('device-groups', filtered);
  return true;
}

// ============================================================
// Tenant-scoped CRUD — per-user data isolation
// ============================================================

/**
 * Lấy devices cho 1 tenant hoặc TẤT CẢ (admin).
 * tenantId = undefined → admin → aggregate tất cả tenants
 * tenantId = string → user cụ thể
 */
export function getDevicesForTenant(tenantId?: string): Device[] {
  if (!tenantId) {
    return readAllTenantsCollection<Device>('devices');
  }
  return readUserCollection<Device>(tenantId, 'devices');
}

export function getGroupsForTenant(tenantId?: string): DeviceGroup[] {
  if (!tenantId) {
    return readAllTenantsCollection<DeviceGroup>('device-groups');
  }
  return readUserCollection<DeviceGroup>(tenantId, 'device-groups');
}

export function createDeviceForTenant(userId: string, data: Omit<Device, 'id' | 'status' | 'uptime' | 'lastSeen' | 'createdAt'>): Device {
  const devices = readUserCollection<Device>(userId, 'devices');
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
  writeUserCollection(userId, 'devices', devices);

  // Register in IP lookup map
  ipDeviceMap.set(device.tailscaleIp, { deviceId: device.id, tenantId: userId });

  // Trigger immediate health check (logic giữ nguyên)
  checkDeviceHealth(device).then(result => {
    const updates: Partial<Device> = {
      status: result.status,
      lastSeen: result.status !== 'offline' ? new Date().toISOString() : device.lastSeen,
    };
    if (result.info?.systemVersion) updates.iosVersion = String(result.info.systemVersion);
    if (result.info?.model) updates.model = String(result.info.model);
    updateDeviceForTenant(userId, device.id, updates);
  });
  return device;
}

export function updateDeviceForTenant(userId: string, id: string, data: Partial<Device>): Device | null {
  const devices = readUserCollection<Device>(userId, 'devices');
  const idx = devices.findIndex(d => d.id === id);
  if (idx === -1) return null;

  // Update IP lookup map if tailscaleIp changed
  if (data.tailscaleIp && data.tailscaleIp !== devices[idx].tailscaleIp) {
    ipDeviceMap.delete(devices[idx].tailscaleIp);
    ipDeviceMap.set(data.tailscaleIp, { deviceId: id, tenantId: userId });
  }

  devices[idx] = { ...devices[idx], ...data };
  writeUserCollection(userId, 'devices', devices);
  return devices[idx];
}

export function deleteDeviceForTenant(userId: string, id: string): boolean {
  const devices = readUserCollection<Device>(userId, 'devices');
  const device = devices.find(d => d.id === id);
  const filtered = devices.filter(d => d.id !== id);
  if (filtered.length === devices.length) return false;
  writeUserCollection(userId, 'devices', filtered);

  // Remove from IP lookup map
  if (device) {
    ipDeviceMap.delete(device.tailscaleIp);
  }

  return true;
}

export function createGroupForTenant(userId: string, name: string, color: string): DeviceGroup {
  const groups = readUserCollection<DeviceGroup>(userId, 'device-groups');
  const group: DeviceGroup = { id: generateId(), name, color, deviceIds: [] };
  groups.push(group);
  writeUserCollection(userId, 'device-groups', groups);
  return group;
}

export function updateGroupForTenant(userId: string, id: string, data: Partial<DeviceGroup>): DeviceGroup | null {
  const groups = readUserCollection<DeviceGroup>(userId, 'device-groups');
  const idx = groups.findIndex(g => g.id === id);
  if (idx === -1) return null;
  groups[idx] = { ...groups[idx], ...data };
  writeUserCollection(userId, 'device-groups', groups);
  return groups[idx];
}

export function deleteGroupForTenant(userId: string, id: string): boolean {
  const groups = readUserCollection<DeviceGroup>(userId, 'device-groups');
  const filtered = groups.filter(g => g.id !== id);
  if (filtered.length === groups.length) return false;
  writeUserCollection(userId, 'device-groups', filtered);
  return true;
}

/**
 * Tìm device theo ID — scan tất cả tenants.
 * Trả về { device, tenantId } để biết device thuộc user nào.
 * Dùng cho ownership verification và cross-tenant lookups.
 */
export function findDeviceGlobal(id: string): { device: Device; tenantId: string } | null {
  for (const tid of getAllTenantIds()) {
    const devices = readUserCollection<Device>(tid, 'devices');
    const device = devices.find(d => d.id === id);
    if (device) return { device, tenantId: tid };
  }
  return null;
}

// ============================================================
// IP Lookup Map — O(1) device resolution for heartbeat
// ============================================================

/**
 * In-memory map: tailscaleIp → { deviceId, tenantId }
 * Built on server start via rebuildIpMap(), updated on device create/delete/update.
 */
const ipDeviceMap = new Map<string, { deviceId: string; tenantId: string }>();

export function rebuildIpMap(): void {
  ipDeviceMap.clear();
  for (const tenantId of getAllTenantIds()) {
    const devices = readUserCollection<Device>(tenantId, 'devices');
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

/**
 * Process heartbeat from phone.
 *
 * Preserves ALL existing features:
 * 1. Status transition (offline→online, connecting→online)
 * 2. Device info update (iosVersion, model, battery)
 * 3. proxyStatus monitoring
 * 4. Auto-apply proxy on offline→online
 * 5. WebSocket broadcast via statusChangeCallback
 * 6. lastSeen update
 * 7. Does NOT override 'running' status (script in progress)
 */
export function handleHeartbeat(payload: HeartbeatPayload): Device | null {
  // 1. O(1) lookup by IP
  const mapping = ipDeviceMap.get(payload.tailscaleIp);
  if (!mapping) return null;

  const { deviceId, tenantId } = mapping;

  // 2. Read current device from disk
  const devices = readUserCollection<Device>(tenantId, 'devices');
  const device = devices.find(d => d.id === deviceId);
  if (!device) return null;

  // 3. Do NOT override 'running' status — script-engine manages this
  // Equivalent to old line 228: device.currentScript ? null : await checkDeviceHealth()
  if (device.currentScript) {
    // Only update lastSeen, keep status as 'running'
    updateDeviceForTenant(tenantId, deviceId, { lastSeen: new Date().toISOString() });
    return device;
  }

  // 4. Capture previous status for transition detection
  const previousStatus = device.status;

  // 5. Build update payload — equivalent to old lines 232-251
  const updateData: Partial<Device> = {
    status: 'online',
    lastSeen: new Date().toISOString(),
  };

  // Update device info from heartbeat payload
  if (payload.systemVersion) updateData.iosVersion = String(payload.systemVersion);
  if (payload.model) updateData.model = String(payload.model);
  if (payload.battery !== undefined) updateData.battery = payload.battery;

  // Update proxy status — equivalent to old lines 246-251
  if (payload.proxyStatus === 'running' || payload.proxyStatus === 'stopped') {
    updateData.proxyStatus = payload.proxyStatus;
  }

  // 6. Write to disk
  const updated = updateDeviceForTenant(tenantId, deviceId, updateData);

  // 7. Broadcast if status changed — equivalent to old lines 255-257
  if (updated && statusChangeCallback && previousStatus !== 'online') {
    statusChangeCallback(updated);
  }

  // 8. Auto-apply proxy on offline→online — equivalent to old lines 260-264
  if (previousStatus === 'offline' && device.proxyConfig?.enabled) {
    autoApplyProxy(device, tenantId).catch(err => {
      console.log(`[Heartbeat] Auto-apply proxy failed for ${device.name}:`, err);
    });
  }

  return updated;
}

// ============================================================
// Staleness Checker — lightweight replacement for polling loop
// ============================================================

/**
 * Scan all devices, mark offline if no heartbeat received within threshold.
 *
 * Old runHealthChecks(): N HTTP requests + N disk reads + N disk writes every 15s
 * New runStalenessCheck(): N disk reads + ZERO HTTP + writes only on status change
 */
function runStalenessCheck() {
  const threshold = config.heartbeatStaleThreshold;
  const now = Date.now();

  for (const tenantId of getAllTenantIds()) {
    const devices = readUserCollection<Device>(tenantId, 'devices');

    for (const device of devices) {
      // Skip already offline devices
      if (device.status === 'offline') continue;

      // Skip devices running scripts — script-engine manages their lifecycle
      // Equivalent to old line 228: device.currentScript ? null : ...
      if (device.currentScript) continue;

      // Check staleness
      const lastSeenTime = new Date(device.lastSeen).getTime();
      const isStale = (now - lastSeenTime) > threshold;

      if (isStale) {
        const updated = updateDeviceForTenant(tenantId, device.id, { status: 'offline' });

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
// Device Monitor — start/stop (replaces old health check loop)
// ============================================================

export function startDeviceMonitor(onStatusChange?: (device: Device) => void) {
  if (onStatusChange) statusChangeCallback = onStatusChange;
  if (healthCheckTimer) clearInterval(healthCheckTimer);

  // Build IP map for heartbeat lookups
  rebuildIpMap();

  // Run staleness check immediately (equivalent to old line 276)
  runStalenessCheck();

  // Start staleness checker interval
  healthCheckTimer = setInterval(runStalenessCheck, config.stalenessCheckInterval);

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

// --- Proxy Auto-Apply ---

async function autoApplyProxy(device: Device, tenantId?: string) {
  if (!device.proxyConfig) return;
  const { ip, port, username, password, mode, timezone, locale, latitude, longitude } = device.proxyConfig;

  // Skip if mode is "none"
  if (!mode || mode === 'none') return;

  console.log(`[HealthCheck] Auto-applying proxy for ${device.name} (mode=${mode})`);

  // Step 1: Push proxy config (include mode)
  const configResult = await callDeviceApi(device.id, 'POST', '/api/proxy/config', {
    ip, port, username, password, mode,
  });
  if (!configResult.ok) {
    console.log(`[HealthCheck] Failed to push proxy config to ${device.name}: ${configResult.error}`);
    return;
  }

  // Step 2: Start proxy tunnel
  const startResult = await callDeviceApi(device.id, 'POST', '/api/proxy/start');
  if (startResult.ok) {
    if (tenantId) {
      updateDeviceForTenant(tenantId, device.id, { proxyStatus: 'running' });
    } else {
      updateDevice(device.id, { proxyStatus: 'running' });
    }
    console.log(`[HealthCheck] Proxy auto-started on ${device.name}`);
  } else {
    console.log(`[HealthCheck] Failed to start proxy on ${device.name}: ${startResult.error}`);
    return;
  }

  // Step 3: Apply spoof based on mode
  const spoofParams: Record<string, unknown> = { mode };
  if (mode === 'us') {
    // US mode: apply full spoofing
    if (timezone) spoofParams.timezone = timezone;
    if (locale) spoofParams.locale = locale;
    if (latitude !== undefined && longitude !== undefined) {
      spoofParams.latitude = latitude;
      spoofParams.longitude = longitude;
    }
  }
  // For "vn" mode: spoofParams only has mode="vn" → device will disable all spoofing
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
  const found = findDeviceGlobal(deviceId);
  const device = found?.device ?? getDevice(deviceId);
  if (!device) return { ok: false, error: 'Device not found' };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.deviceApiTimeout);
    // API runs on httpPort + 1 (default 8081)
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
    // Only treat connection-closed-early as success for quick action endpoints
    // (tap/swipe/key/launch/type) where the device received the command but closed before responding.
    // For proxy/config endpoints, connection errors ARE real failures.
    const actionEndpoints = ['/api/tap', '/api/swipe', '/api/key', '/api/launch', '/api/type'];
    const isAction = actionEndpoints.some(a => endpoint.startsWith(a));
    if (isAction && (msg.includes('terminated') || msg.includes('ECONNRESET') || msg.includes('empty'))) {
      return { ok: true, data: { ok: true, note: 'Command sent (connection closed early)' } };
    }
    return { ok: false, error: msg };
  }
}
