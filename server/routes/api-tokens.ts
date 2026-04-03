/**
 * Token Management Routes — used from Dashboard (JWT auth).
 *
 * POST   /api/auth/tokens              → Create token
 * GET    /api/auth/tokens              → List tokens
 * DELETE /api/auth/tokens/:id          → Revoke token
 * POST   /api/auth/tokens/:id/regenerate → Regenerate token
 */

import { Router, Request, Response } from 'express';
import { createToken, listTokens, revokeToken, regenerateToken } from '../services/api-token';

const router = Router();

function getUserId(req: Request): string | undefined {
  return (req as any).user?.id;
}

// GET /api/auth/tokens
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const tokens = await listTokens(userId);
    res.json({ success: true, data: tokens });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/tokens
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name } = req.body;
  const tokenName = name?.trim() || 'API Token';

  try {
    // Max 5 active tokens per user
    const existing = await listTokens(userId);
    const activeTokens = existing.filter((t: any) => !t.revokedAt);
    if (activeTokens.length >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Tối đa 5 token đang hoạt động. Hãy thu hồi token cũ trước.',
      });
    }

    const result = await createToken(userId, tokenName);
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/auth/tokens/:id
router.delete('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const revoked = await revokeToken(req.params.id, userId);
    if (!revoked) {
      return res.status(404).json({ success: false, error: 'Token không tồn tại hoặc đã thu hồi' });
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/tokens/:id/regenerate
router.post('/:id/regenerate', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const result = await regenerateToken(req.params.id, userId);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Token không tồn tại' });
    }
    res.json({ success: true, data: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
