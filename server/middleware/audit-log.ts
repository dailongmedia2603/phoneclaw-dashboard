/**
 * API Audit Log Middleware.
 * Logs every external API call for audit trail.
 * Only logs requests authenticated via API Token.
 */

import type { Request, Response, NextFunction } from 'express';
import { generateId, isPostgresMode } from '../store';

export function auditLogMiddleware(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user || user.authMethod !== 'api_token') return next();

  const startTime = Date.now();

  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    const responseTime = Date.now() - startTime;

    // Fire and forget — never slow down the response
    saveAuditLog({
      id: generateId(),
      tokenId: user.tokenId || null,
      userId: user.id,
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      ip: req.ip || req.socket.remoteAddress || '',
      userAgent: req.headers['user-agent'] || '',
      responseTime,
      createdAt: new Date().toISOString(),
    }).catch(err => {
      console.error('[Audit] Save failed:', err.message);
    });

    return originalJson(body);
  };

  next();
}

async function saveAuditLog(log: any) {
  if (isPostgresMode) {
    const { query } = await import('../store.js');
    await query(
      `INSERT INTO api_audit_logs (id, token_id, user_id, method, path, status_code, ip, user_agent, response_time, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [log.id, log.tokenId, log.userId, log.method, log.path, log.statusCode, log.ip, log.userAgent, log.responseTime, log.createdAt]
    );
  } else {
    const { readCollection, writeCollection } = await import('../store.js');
    const logs = await readCollection<any>('api-audit-logs');
    logs.push(log);
    if (logs.length > 1000) logs.splice(0, logs.length - 1000);
    await writeCollection('api-audit-logs', logs);
  }
}
