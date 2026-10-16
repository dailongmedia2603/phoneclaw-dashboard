/**
 * WireGuard hub — thay thế Tailscale.
 *
 * App Phone Agent trên iPhone tự mang WireGuard (PacketTunnel extension).
 * Server là "control plane": cấp IP 10.88.x.x cho từng máy, cấp mã ghép cặp,
 * và ghi danh sách peer ra `peers.json` trong volume dùng chung với container
 * `wireguard` (network_mode: host) — container đó tạo interface wgpa0 và
 * `wg syncconf` mỗi khi file đổi.
 *
 * IP tunnel được lưu vào field `tailscaleIp` của Device (giữ nguyên schema),
 * nên VNC proxy, callDeviceApi, heartbeat và sing-box exit node chạy y như cũ.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config';

export interface WgPeer {
  publicKey: string;
  ip: string;
  deviceId: string;
  tenantId: string;
  name: string;
  createdAt: string;
}

export interface PairingCode {
  code: string;
  tenantId: string;
  name: string;
  group: string;
  createdAt: number;
  expiresAt: number;
  deviceId?: string;
  publicKey?: string;
  usedAt?: number;
}

export interface PeerStatus {
  endpoint: string | null;
  latestHandshake: number; // unix seconds, 0 = never
  rxBytes: number;
  txBytes: number;
}

const PAIRING_TTL_MS = 30 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // bỏ 0/O/1/I dễ nhầm

const dataDir = () => config.wgDataDir;
const peersFile = () => path.join(dataDir(), 'peers.json');
const codesFile = () => path.join(dataDir(), 'pairing-codes.json');

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

// Ghi atomic để container wireguard không đọc phải file ghi dở.
function writeJson(file: string, data: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

// Mọi thao tác ghi đi qua 1 hàng đợi → không bao giờ cấp trùng IP.
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => T | Promise<T>): Promise<T> {
  const next = queue.then(fn, fn);
  queue = next.catch(() => undefined);
  return next;
}

export function isWireGuardIp(ip?: string): boolean {
  return !!ip && ip.startsWith(config.wgIpPrefix);
}

export function isEnabled(): boolean {
  return fs.existsSync(path.join(dataDir(), 'server.pub'));
}

export function getServerPublicKey(): string | null {
  try {
    return fs.readFileSync(path.join(dataDir(), 'server.pub'), 'utf8').trim() || null;
  } catch {
    return null;
  }
}

export function listPeers(): WgPeer[] {
  return readJson<WgPeer[]>(peersFile(), []);
}

function isValidPublicKey(key: string): boolean {
  try {
    return Buffer.from(key, 'base64').length === 32 && /^[A-Za-z0-9+/]{43}=$/.test(key);
  } catch {
    return false;
  }
}

function allocateIp(peers: WgPeer[]): string | null {
  const used = new Set(peers.map(p => p.ip));
  // 10.88.0.1 là server; dùng 10.88.0.2 → 10.88.255.254
  for (let i = 2; i < 65535; i++) {
    const ip = `${config.wgIpPrefix}${Math.floor(i / 256)}.${i % 256}`;
    if (i % 256 === 0 || i % 256 === 255) continue;
    if (!used.has(ip)) return ip;
  }
  return null;
}

// ------------------------------------------------------------
// Pairing codes
// ------------------------------------------------------------

function loadCodes(): PairingCode[] {
  const now = Date.now();
  // Giữ code đã dùng thêm 1 ngày để app gọi lại enroll (idempotent) không lỗi
  return readJson<PairingCode[]>(codesFile(), []).filter(c =>
    c.usedAt ? now - c.usedAt < 24 * 3600 * 1000 : c.expiresAt > now,
  );
}

export function normalizeCode(code: string): string {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function createPairingCode(tenantId: string, name: string, group: string): Promise<PairingCode> {
  return serialized(() => {
    const codes = loadCodes();
    let code = '';
    do {
      code = Array.from(crypto.randomBytes(6), b => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('');
    } while (codes.some(c => c.code === code));
    const entry: PairingCode = {
      code,
      tenantId,
      name: name.trim(),
      group: group || '',
      createdAt: Date.now(),
      expiresAt: Date.now() + PAIRING_TTL_MS,
    };
    codes.push(entry);
    writeJson(codesFile(), codes);
    return entry;
  });
}

export function getPairingCode(code: string): PairingCode | undefined {
  return loadCodes().find(c => c.code === normalizeCode(code));
}

/**
 * Đổi mã ghép lấy chỗ trong mạng WireGuard.
 * `createDevice` chỉ được gọi lần đầu; gọi lại với cùng publicKey trả về
 * đúng peer cũ (app có thể retry khi mạng chập chờn).
 */
export function redeemPairingCode(
  rawCode: string,
  publicKey: string,
  createDevice: (code: PairingCode, ip: string) => Promise<{ id: string; name: string }>,
): Promise<{ peer: WgPeer; reused: boolean }> {
  return serialized(async () => {
    if (!isValidPublicKey(publicKey)) throw new Error('publicKey không hợp lệ');
    const codes = loadCodes();
    const entry = codes.find(c => c.code === normalizeCode(rawCode));
    if (!entry) throw new Error('Mã ghép không đúng hoặc đã hết hạn');

    const peers = listPeers();
    if (entry.usedAt) {
      const peer = peers.find(p => p.deviceId === entry.deviceId);
      if (entry.publicKey === publicKey && peer) return { peer, reused: true };
      throw new Error('Mã ghép đã được dùng cho thiết bị khác — hãy tạo mã mới');
    }

    // Khoá đã gắn với peer khác (hiếm — app sinh khoá mới mỗi lần ghép):
    // thay peer đó, nhưng cấp IP mới vì device cũ vẫn giữ IP cũ (unique).
    const others = peers.filter(p => p.publicKey !== publicKey);
    const ip = allocateIp(peers);
    if (!ip) throw new Error('Hết địa chỉ IP trong mạng WireGuard');

    const device = await createDevice(entry, ip);
    const peer: WgPeer = {
      publicKey,
      ip,
      deviceId: device.id,
      tenantId: entry.tenantId,
      name: device.name,
      createdAt: new Date().toISOString(),
    };
    writeJson(peersFile(), [...others, peer]);

    entry.usedAt = Date.now();
    entry.deviceId = device.id;
    entry.publicKey = publicKey;
    writeJson(codesFile(), codes);
    return { peer, reused: false };
  });
}

export function removePeerForDevice(deviceId: string): Promise<boolean> {
  return serialized(() => {
    const peers = listPeers();
    const kept = peers.filter(p => p.deviceId !== deviceId);
    if (kept.length === peers.length) return false;
    writeJson(peersFile(), kept);
    return true;
  });
}

// ------------------------------------------------------------
// Live status (container wireguard ghi `wg show wgpa0 dump` ra status.txt)
// ------------------------------------------------------------

export function getPeerStatuses(): Map<string, PeerStatus> {
  const result = new Map<string, PeerStatus>();
  let text = '';
  try {
    text = fs.readFileSync(path.join(dataDir(), 'status.txt'), 'utf8');
  } catch {
    return result;
  }
  // dump: dòng 1 là interface; mỗi peer:
  // pubkey  psk  endpoint  allowed-ips  latest-handshake  rx  tx  keepalive
  for (const line of text.split('\n').slice(1)) {
    const f = line.trim().split('\t');
    if (f.length < 7) continue;
    result.set(f[0], {
      endpoint: f[2] === '(none)' ? null : f[2],
      latestHandshake: Number(f[4]) || 0,
      rxBytes: Number(f[5]) || 0,
      txBytes: Number(f[6]) || 0,
    });
  }
  return result;
}

export function getClientConfig(peer: WgPeer) {
  return {
    address: peer.ip,
    peerAddress: config.wgServerIp,
    subnet: config.wgSubnet,
    serverPublicKey: getServerPublicKey(),
    endpoint: config.wgEndpoint,
    dns: config.wgDns,
    mtu: 1280,
    keepalive: 25,
    fullTunnel: config.wgFullTunnel,
    heartbeatUrl: config.wgHeartbeatUrl,
  };
}
