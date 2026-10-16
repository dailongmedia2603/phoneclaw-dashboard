/**
 * sing-box Config Manager
 *
 * Manages per-device proxy routing on VPS via sing-box tproxy.
 * Each device is identified by its Tailscale IP and can have an independent
 * proxy mode (US proxy, VN direct, or none).
 *
 * Config is persisted to disk and sing-box is reloaded via docker compose.
 */

import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SINGBOX_CONFIG_PATH = process.env.SINGBOX_CONFIG_PATH
  || path.resolve(__dirname, '../../singbox/config.json');

const SINGBOX_STATE_PATH = SINGBOX_CONFIG_PATH.replace('.json', '-state.json');

export interface DeviceProxy {
  tailscaleIp: string;
  mode: 'us' | 'vn' | 'none';
  proxyIp?: string;
  proxyPort?: number;
  proxyUser?: string;
  proxyPass?: string;
}

// In-memory state, persisted to state file
const deviceProxies: Map<string, DeviceProxy> = new Map();

/**
 * Generate sing-box config.json from device proxy map.
 * Uses tproxy inbound — iptables redirects Tailscale exit node traffic here.
 * Routes per source Tailscale IP to different outbound proxies.
 */
function generateConfig(): Record<string, unknown> {
  const outbounds: Record<string, unknown>[] = [
    { type: 'direct', tag: 'direct' },
    { type: 'block', tag: 'block' },
    { type: 'dns', tag: 'dns-out' },
  ];

  const routeRules: Record<string, unknown>[] = [
    { protocol: 'dns', outbound: 'dns-out' },
    { ip_is_private: true, outbound: 'direct' },
    { ip_cidr: ['100.64.0.0/10'], outbound: 'direct' },
  ];

  const dnsServers: Record<string, unknown>[] = [
    { tag: 'local-dns', address: '8.8.8.8', detour: 'direct' },
    { tag: 'direct-dns', address: 'https://1.1.1.1/dns-query', address_resolver: 'local-dns', detour: 'direct' },
  ];

  for (const [, device] of deviceProxies) {
    const sanitizedIp = device.tailscaleIp.replace(/\./g, '-');

    // Both US and VN modes use HTTP proxy if proxyIp is provided
    if ((device.mode === 'us' || device.mode === 'vn') && device.proxyIp && device.proxyPort) {
      const outboundTag = `${device.mode}-proxy-${sanitizedIp}`;

      // HTTP proxy outbound for this device
      const outbound: Record<string, unknown> = {
        type: 'http',
        tag: outboundTag,
        server: device.proxyIp,
        server_port: device.proxyPort,
      };
      if (device.proxyUser) outbound.username = device.proxyUser;
      if (device.proxyPass) outbound.password = device.proxyPass;
      outbounds.push(outbound);

      // DNS via proxy for this device
      dnsServers.push({
        tag: `proxy-dns-${sanitizedIp}`,
        address: 'https://1.1.1.1/dns-query',
        address_resolver: 'local-dns',
        detour: outboundTag,
      });

      // Route: source IP → proxy
      routeRules.push({
        source_ip_cidr: [`${device.tailscaleIp}/32`],
        outbound: outboundTag,
      });
    } else if (device.mode === 'vn') {
      // VN mode without proxy: direct exit via VPS IP (VN)
      routeRules.push({
        source_ip_cidr: [`${device.tailscaleIp}/32`],
        outbound: 'direct',
      });
    }
    // mode === 'none': no rule added → traffic not proxied
  }

  return {
    log: { level: 'info', timestamp: true },
    dns: {
      servers: dnsServers,
      rules: [{ outbound: 'any', server: 'local-dns' }],
      final: 'direct-dns',
      strategy: 'ipv4_only',
    },
    inbounds: [{
      type: 'tproxy',
      tag: 'tproxy-in',
      listen: '0.0.0.0',
      listen_port: 12345,
      sniff: true,
      sniff_override_destination: true,
      domain_strategy: 'ipv4_only',
    }],
    outbounds,
    route: {
      rules: routeRules,
      final: 'direct',
      auto_detect_interface: true,
    },
  };
}

/**
 * Restart sing-box container via Docker socket API.
 * Uses /var/run/docker.sock mounted into app container.
 */
async function restartSingboxContainer(): Promise<{ ok: boolean; error?: string }> {
  const http = await import('http');
  const containerName = process.env.SINGBOX_CONTAINER_NAME || 'phoneclaw-dashboard-singbox-1';

  return new Promise((resolve) => {
    const req = http.request({
      socketPath: '/var/run/docker.sock',
      path: `/containers/${containerName}/restart?t=3`,
      method: 'POST',
      timeout: 15000,
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode === 204) {
          console.log('[SingboxManager] sing-box container restarted via docker.sock');
          resolve({ ok: true });
        } else {
          resolve({ ok: false, error: `Docker API ${res.statusCode}: ${body}` });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ ok: false, error: `Docker socket error: ${err.message}` });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, error: 'Docker restart timeout' });
    });

    req.end();
  });
}

/**
 * Write config to disk and restart sing-box container.
 */
export async function updateAndReload(): Promise<{ ok: boolean; error?: string }> {
  try {
    const config = generateConfig();
    writeFileSync(SINGBOX_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log(`[SingboxManager] Config written to ${SINGBOX_CONFIG_PATH}`);

    const result = await restartSingboxContainer();
    if (!result.ok) {
      console.error('[SingboxManager] Restart failed:', result.error);
    }
    return result;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[SingboxManager] updateAndReload error:', msg);
    return { ok: false, error: msg };
  }
}

export function setDeviceProxy(config: DeviceProxy): void {
  deviceProxies.set(config.tailscaleIp, config);
}

export function removeDeviceProxy(tailscaleIp: string): void {
  deviceProxies.delete(tailscaleIp);
}

export function getDeviceProxies(): DeviceProxy[] {
  return Array.from(deviceProxies.values());
}

export function getDeviceProxy(tailscaleIp: string): DeviceProxy | undefined {
  return deviceProxies.get(tailscaleIp);
}

/**
 * Load persisted device proxy state from disk.
 * Called at server startup.
 */
export function loadPersistedState(): void {
  if (existsSync(SINGBOX_STATE_PATH)) {
    try {
      const raw = readFileSync(SINGBOX_STATE_PATH, 'utf-8');
      const state = JSON.parse(raw) as { devices?: DeviceProxy[] };
      for (const device of state.devices || []) {
        if (device.tailscaleIp) {
          deviceProxies.set(device.tailscaleIp, device);
        }
      }
      console.log(`[SingboxManager] Loaded ${deviceProxies.size} device proxy configs from state`);
    } catch (err) {
      console.warn('[SingboxManager] Failed to load persisted state:', err);
    }
  }
}

/**
 * Persist current device proxy state to disk.
 */
export function persistState(): void {
  try {
    const state = { devices: Array.from(deviceProxies.values()), updatedAt: new Date().toISOString() };
    writeFileSync(SINGBOX_STATE_PATH, JSON.stringify(state, null, 2));
  } catch (err) {
    console.error('[SingboxManager] Failed to persist state:', err);
  }
}
