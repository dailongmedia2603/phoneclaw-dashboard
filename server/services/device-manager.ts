import { readCollection, writeCollection, generateId } from '../store';
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

// --- Health Check ---

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

async function runHealthChecks() {
  const devices = getAllDevices();
  for (const device of devices) {
    const healthResult = device.currentScript ? null : await checkDeviceHealth(device);
    const newStatus: Device['status'] = device.currentScript ? 'running' : (healthResult?.status || 'offline');

    // Build update payload
    const updateData: Partial<Device> = {
      status: newStatus,
      lastSeen: newStatus !== 'offline' ? new Date().toISOString() : device.lastSeen,
    };

    // Update device info only if not yet known
    const needsInfo = !device.iosVersion || device.iosVersion === 'Unknown' || !device.model || device.model === 'iPhone';
    if (needsInfo && healthResult?.info) {
      const info = healthResult.info;
      if (info.systemVersion) updateData.iosVersion = String(info.systemVersion);
      if (info.model) updateData.model = String(info.model);
    }

    // Update proxy status from device response
    if (healthResult?.info?.proxyStatus) {
      const ps = String(healthResult.info.proxyStatus);
      if (ps === 'running' || ps === 'stopped') {
        updateData.proxyStatus = ps;
      }
    }

    if (newStatus !== device.status || updateData.iosVersion || updateData.model || updateData.proxyStatus !== device.proxyStatus) {
      const updated = updateDevice(device.id, updateData);
      if (updated && statusChangeCallback && newStatus !== device.status) {
        statusChangeCallback(updated);
      }

      // Auto-apply proxy when device comes online with enabled proxy config
      if (device.status === 'offline' && newStatus === 'online' && device.proxyConfig?.enabled) {
        autoApplyProxy(device).catch(err => {
          console.log(`[HealthCheck] Auto-apply proxy failed for ${device.name}:`, err);
        });
      }
    } else if (newStatus !== 'offline') {
      updateDevice(device.id, { lastSeen: new Date().toISOString() });
    }
  }
}

export function startHealthChecks(onStatusChange?: (device: Device) => void) {
  if (onStatusChange) statusChangeCallback = onStatusChange;
  if (healthCheckTimer) clearInterval(healthCheckTimer);
  // Run immediately, then on interval
  runHealthChecks();
  healthCheckTimer = setInterval(runHealthChecks, config.healthCheckInterval);
}

export function stopHealthChecks() {
  if (healthCheckTimer) {
    clearInterval(healthCheckTimer);
    healthCheckTimer = null;
  }
}

// --- Proxy Auto-Apply ---

async function autoApplyProxy(device: Device) {
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
    updateDevice(device.id, { proxyStatus: 'running' });
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
  const device = getDevice(deviceId);
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
