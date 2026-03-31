import { Router } from 'express';
import { handleHeartbeat } from '../services/device-manager';

const router = Router();

/**
 * POST /api/heartbeat
 *
 * Receives heartbeat from phone (PhoneAgent.tipa).
 * No JWT required — phone authenticates via Tailscale network.
 * Registered BEFORE authMiddleware in index.ts.
 */
router.post('/', (req, res) => {
  const { tailscaleIp, systemVersion, model, proxyStatus, battery } = req.body;

  if (!tailscaleIp || typeof tailscaleIp !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'tailscaleIp is required',
    });
  }

  const result = handleHeartbeat({
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
