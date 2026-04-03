/**
 * API Token Authentication Middleware.
 *
 * TÁCH BIỆT hoàn toàn với authMiddleware (JWT) của dashboard.
 * Chỉ dùng cho external API routes (/api/v1/external/*).
 *
 * Accepts token via:
 * - Header: X-API-Token: pa_live_xxx (recommended)
 * - Header: Authorization: Bearer pa_live_xxx (fallback)
 */

import type { Request, Response, NextFunction } from 'express';
import { verifyToken, updateTokenUsage } from '../services/api-token';

export async function apiTokenAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const apiToken = extractApiToken(req);

    if (!apiToken) {
      return res.status(401).json({
        success: false,
        error: 'API token required. Use header: X-API-Token: pa_live_xxx',
      });
    }

    if (!apiToken.startsWith('pa_live_')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format. Token must start with pa_live_',
      });
    }

    const result = await verifyToken(apiToken);

    if (!result) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or revoked API token',
      });
    }

    // Set req.user with same shape as JWT payload
    // → getTenantId(req), getAuthUserId(req), isAdmin(req) all work
    (req as any).user = {
      id: result.userId,
      email: result.email,
      role: result.role,
      authMethod: 'api_token',
      tokenId: result.tokenId,
    };

    // Update usage stats (fire and forget)
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    updateTokenUsage(result.tokenId, ip).catch(() => {});

    next();
  } catch (err) {
    console.error('[API Token Auth] Error:', err);
    return res.status(500).json({
      success: false,
      error: 'Authentication service error',
    });
  }
}

function extractApiToken(req: Request): string | null {
  // Priority 1: X-API-Token header
  const xApiToken = req.headers['x-api-token'] as string;
  if (xApiToken) return xApiToken;

  // Priority 2: Authorization: Bearer pa_live_xxx
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer pa_live_')) {
    return authHeader.slice(7);
  }

  return null;
}
