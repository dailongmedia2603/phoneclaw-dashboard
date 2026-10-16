import { Router } from 'express';
import * as wg from '../services/wireguard';
import { createDeviceForTenant, configureNewTunnelDevice, getDevicesForTenant } from '../services/device-manager';
import { getAuthUserId } from '../helpers/get-user';
import { checkQuota } from '../helpers/check-quota';
import { createRateLimiter } from '../middleware/rate-limit';

// Sau nginx: lấy IP thật của điện thoại từ X-Forwarded-For
const clientIp = (req: any) =>
  String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

const enrollLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  max: 30,
  keyGenerator: clientIp,
  message: 'Thử ghép quá nhiều lần, đợi 10 phút rồi thử lại',
});

// ------------------------------------------------------------
// Public — app trên iPhone gọi (mã ghép chính là xác thực)
// ------------------------------------------------------------
export const wireguardPublicRoutes = Router();

/**
 * POST /api/wireguard/enroll
 * Body: { code, publicKey, name?, model?, iosVersion?, vncPassword?, vncPort?, httpPort? }
 */
wireguardPublicRoutes.post('/enroll', enrollLimiter, async (req, res) => {
  if (!wg.isEnabled()) {
    return res.status(503).json({ success: false, error: 'Server chưa bật WireGuard' });
  }
  const { code, publicKey, model, iosVersion, vncPassword, vncPort, httpPort } = req.body || {};
  if (!code || !publicKey) {
    return res.status(400).json({ success: false, error: 'Thiếu mã ghép hoặc publicKey' });
  }

  try {
    const { peer, reused } = await wg.redeemPairingCode(String(code), String(publicKey).trim(), async (entry, ip) => {
      const device = await createDeviceForTenant(entry.tenantId, {
        name: entry.name || String(req.body.name || model || 'iPhone'),
        tailscaleIp: ip,
        vncPort: Number(vncPort) || 5901,
        httpPort: Number(httpPort) || 8080,
        iosVersion: iosVersion ? String(iosVersion) : 'Unknown',
        model: model ? String(model) : 'iPhone',
        group: entry.group || '',
        battery: 0,
        vncPassword: vncPassword ? String(vncPassword) : '',
      });
      return { id: device.id, name: device.name };
    });

    if (!reused) configureNewTunnelDevice(peer.tenantId, peer.deviceId);
    console.log(`[WireGuard] ${reused ? 'Re-enroll' : 'Enroll'} ${peer.name} → ${peer.ip} (from ${clientIp(req)})`);

    res.json({
      success: true,
      data: { deviceId: peer.deviceId, name: peer.name, ...wg.getClientConfig(peer) },
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err instanceof Error ? err.message : 'Ghép thất bại' });
  }
});

// ------------------------------------------------------------
// Dashboard (JWT)
// ------------------------------------------------------------
export const wireguardRoutes = Router();

// POST /api/wireguard/pairing-codes  { name, group? }
wireguardRoutes.post('/pairing-codes', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!wg.isEnabled()) {
    return res.status(503).json({ success: false, error: 'Server chưa bật WireGuard (container wireguard chưa chạy)' });
  }

  const name = String(req.body?.name || '').trim();
  if (!name) return res.status(400).json({ success: false, error: 'Cần đặt tên thiết bị' });

  const quota = await checkQuota(req, 'devices');
  if (!quota.allowed) return res.status(403).json({ success: false, error: quota.error });

  const entry = await wg.createPairingCode(userId, name, String(req.body?.group || ''));
  res.status(201).json({
    success: true,
    data: { code: entry.code, name: entry.name, expiresAt: new Date(entry.expiresAt).toISOString() },
  });
});

// GET /api/wireguard/pairing-codes/:code — dashboard poll chờ điện thoại ghép
wireguardRoutes.get('/pairing-codes/:code', async (req, res) => {
  const userId = getAuthUserId(req);
  const entry = wg.getPairingCode(req.params.code);
  if (!entry || entry.tenantId !== userId) {
    return res.json({ success: true, data: { status: 'expired' } });
  }
  if (!entry.deviceId) {
    return res.json({ success: true, data: { status: 'pending', expiresAt: new Date(entry.expiresAt).toISOString() } });
  }
  const device = (await getDevicesForTenant(userId)).find(d => d.id === entry.deviceId);
  res.json({ success: true, data: { status: 'used', deviceId: entry.deviceId, device } });
});

// GET /api/wireguard/status — trạng thái tunnel của các máy WireGuard của user
wireguardRoutes.get('/status', async (req, res) => {
  const userId = getAuthUserId(req);
  const statuses = wg.getPeerStatuses();
  const now = Math.floor(Date.now() / 1000);
  const peers = wg.listPeers()
    .filter(p => p.tenantId === userId)
    .map(p => {
      const s = statuses.get(p.publicKey);
      return {
        deviceId: p.deviceId,
        ip: p.ip,
        endpoint: s?.endpoint ?? null,
        lastHandshakeSecondsAgo: s?.latestHandshake ? now - s.latestHandshake : null,
        rxBytes: s?.rxBytes ?? 0,
        txBytes: s?.txBytes ?? 0,
      };
    });
  res.json({ success: true, data: { enabled: wg.isEnabled(), peers } });
});
