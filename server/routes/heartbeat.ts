import { Router } from 'express';
import { handleHeartbeat } from '../services/device-manager';
import { isWireGuardIp } from '../services/wireguard';

const router = Router();

/**
 * POST /api/heartbeat
 *
 * Receives heartbeat from phone (PhoneAgent.tipa).
 * No JWT required — phone authenticates via Tailscale network.
 * Registered BEFORE authMiddleware in index.ts.
 */
router.post('/', async (req, res) => {
  const { tailscaleIp, systemVersion, model, proxyStatus, battery } = req.body;

  if (!tailscaleIp || typeof tailscaleIp !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'tailscaleIp is required',
    });
  }

  // Máy WireGuard: heartbeat đi trong tunnel nên IP nguồn chính là IP tunnel.
  // Chặn máy này giả heartbeat của máy khác trong cùng mạng 10.88.x.x.
  const remote = (req.socket.remoteAddress || '').replace(/^::ffff:/, '');
  if (isWireGuardIp(remote) && remote !== tailscaleIp.trim()) {
    return res.status(403).json({ success: false, error: 'IP không khớp tunnel' });
  }

  const result = await handleHeartbeat({
    tailscaleIp: tailscaleIp.trim(),
    systemVersion,
    model,
    proxyStatus,
    battery: typeof battery === 'number' ? battery : undefined,
  });

  if (!result) {
    return res.status(404).json({
      success: false,
      error: 'Device not registered',
    });
  }

  res.json({
    success: true,
    data: {
      deviceId: result.id,
      status: result.status,
    },
  });
});

export default router;
