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
  checkDeviceHealth(device).then(newStatus => {
    updateDevice(device.id, {
      status: newStatus,
      lastSeen: newStatus !== 'offline' ? new Date().toISOString() : device.lastSeen,
    });
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

async function checkDeviceHealth(device: Device): Promise<'online' | 'offline'> {
  // Try HTTP port first (works if HTTP server enabled)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.deviceApiTimeout);
    const res = await fetch(`http://${device.tailscaleIp}:${device.httpPort}/`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok || res.status > 0) return 'online';
  } catch { /* fall through to VNC check */ }

  // Fallback: check VNC port via TCP connect
  try {
    return await new Promise<'online' | 'offline'>((resolve) => {
      const net = require('net');
      const socket = new net.Socket();
      socket.setTimeout(config.deviceApiTimeout);
      socket.on('connect', () => { socket.destroy(); resolve('online'); });
      socket.on('timeout', () => { socket.destroy(); resolve('offline'); });
      socket.on('error', () => { socket.destroy(); resolve('offline'); });
      socket.connect(device.vncPort, device.tailscaleIp);
    });
  } catch {
    return 'offline';
  }
}

async function runHealthChecks() {
  const devices = getAllDevices();
  for (const device of devices) {
    const newStatus = device.currentScript ? 'running' : await checkDeviceHealth(device);
    if (newStatus !== device.status) {
      const updated = updateDevice(device.id, {
        status: newStatus,
        lastSeen: newStatus !== 'offline' ? new Date().toISOString() : device.lastSeen,
      });
      if (updated && statusChangeCallback) {
        statusChangeCallback(updated);
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
    return { ok: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}
