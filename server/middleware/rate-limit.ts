/**
 * In-memory Rate Limiter.
 * Sufficient for single-server (VPS). No Redis needed.
 * Only used for external API routes.
 */

import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(opts: {
  windowMs: number;
  max: number;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  message?: string;
}) {
  const store = new Map<string, RateLimitEntry>();
  const {
    windowMs,
    max,
    keyGenerator = (req) => req.ip || req.socket.remoteAddress || 'unknown',
    skipSuccessfulRequests = false,
    message = 'Too many requests, please try again later',
  } = opts;

  // Cleanup expired entries every minute
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now >= entry.resetAt) store.delete(key);
    }
  }, 60_000);
  cleanupTimer.unref(); // Don't block process shutdown

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();
    let entry = store.get(key);

    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000));

    if (entry.count > max) {
      res.setHeader('Retry-After', Math.ceil((entry.resetAt - now) / 1000));
      return res.status(429).json({ success: false, error: message });
    }

    if (skipSuccessfulRequests) {
      const originalJson = res.json.bind(res);
      res.json = function (body: any) {
        if (res.statusCode < 400) {
          entry!.count = Math.max(0, entry!.count - 1);
        }
        return originalJson(body);
      };
    }

    next();
  };
}

// --- Pre-configured limiters (external API only) ---

/** Tier 1: Per-IP — anti-DDoS */
export const ipRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests from this IP',
});

/** Tier 2: Per-User — anti-abuse (mount AFTER auth middleware) */
export const userRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => (req as any).user?.id || req.ip || 'unknown',
  message: 'Rate limit exceeded for this token',
});

/** Tier 3: Failed auth — anti-brute-force (mount BEFORE auth middleware) */
export const authFailLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 15,
  skipSuccessfulRequests: true,
  message: 'Too many failed authentication attempts. Try again later.',
});
