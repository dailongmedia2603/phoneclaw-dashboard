import { spawn, ChildProcess } from 'child_process';
import { config } from '../config';
import { getAllDevices, findDeviceGlobal } from './device-manager';
import type { VncProxy } from '../../src/types';

const proxies = new Map<string, { process: ChildProcess; port: number }>();
let nextPort = config.vncProxyPortStart;

export async function getActiveProxies(): Promise<VncProxy[]> {
  const result: VncProxy[] = [];

  for (const [deviceId, proxy] of proxies.entries()) {
    const found = await findDeviceGlobal(deviceId);
    const device = found?.device;
    result.push({
      deviceId,
      deviceName: device?.name || 'Unknown',
      wsPort: proxy.port,
      targetIp: device?.tailscaleIp || '',
      targetVncPort: device?.vncPort || 5901,
      status: 'running',
    });
  }

  return result;
}

export async function getProxyForDevice(deviceId: string): Promise<VncProxy | undefined> {
  return (await getActiveProxies()).find(p => p.deviceId === deviceId);
}

export async function startProxy(deviceId: string): Promise<VncProxy | null> {
  // Already running
  if (proxies.has(deviceId)) {
    return (await getProxyForDevice(deviceId)) || null;
  }

  // Use tenant-scoped lookup (findDeviceGlobal) instead of legacy getAllDevices
  const found = await findDeviceGlobal(deviceId);
  const device = found?.device;
  if (!device) return null;

  const port = nextPort++;
  const target = `${device.tailscaleIp}:${device.vncPort}`;

  try {
    // websockify wsPort targetHost:targetPort
    const proc = spawn('websockify', [
      '--web', '/opt/novnc',
      port.toString(),
      target,
    ], {
      stdio: 'pipe',
      detached: false,
    });

    proc.on('error', (err) => {
      console.error(`VNC proxy error for ${device.name}:`, err.message);
      proxies.delete(deviceId);
    });

    proc.on('exit', () => {
      proxies.delete(deviceId);
    });

    proxies.set(deviceId, { process: proc, port });

    return {
      deviceId,
      deviceName: device.name,
      wsPort: port,
      targetIp: device.tailscaleIp,
      targetVncPort: device.vncPort,
      status: 'running',
    };
  } catch (err) {
    console.error(`Failed to start VNC proxy for ${device.name}:`, err);
    return null;
  }
}

export function stopProxy(deviceId: string): boolean {
  const proxy = proxies.get(deviceId);
  if (!proxy) return false;

  try {
    proxy.process.kill();
  } catch { /* ignore */ }

  proxies.delete(deviceId);
  return true;
}

export function stopAllProxies() {
  for (const [deviceId] of proxies) {
    stopProxy(deviceId);
  }
}
