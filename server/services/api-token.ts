/**
 * API Token Service — generate, hash, verify, CRUD.
 *
 * Token format: pa_live_<64 hex chars> (32 bytes random = 256-bit entropy)
 * Storage: SHA-256 hash in DB (never plaintext)
 * Supports both PostgreSQL and JSON file mode.
 */

import crypto from 'crypto';
import { readUserCollection, writeUserCollection, readCollection, generateId, isPostgresMode, getAllTenantIds } from '../store';

// --- Constants ---
const TOKEN_PREFIX = 'pa_live_';
const TOKEN_BYTES = 32; // 256-bit entropy

// --- Stored Token Shape (internal, file-based mode) ---
interface StoredToken {
  id: string;
  userId: string;
  name: string;
  tokenHash: string;
  tokenPrefix: string;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  createdAt: string;
  revokedAt: string | null;
}

// --- Token Generation ---

/**
 * Generate a new API token.
 * Format: pa_live_<64 hex chars>
 */
export function generateApiToken(): { token: string; tokenHash: string; tokenPrefix: string } {
  const randomPart = crypto.randomBytes(TOKEN_BYTES).toString('hex');
  const token = `${TOKEN_PREFIX}${randomPart}`;
  const tokenHash = hashToken(token);
  const tokenPrefix = token.substring(0, 20); // "pa_live_" (8) + 12 hex chars
  return { token, tokenHash, tokenPrefix };
}

/**
 * Hash token with SHA-256.
 * SHA-256 is sufficient because tokens have 256-bit entropy (brute force infeasible).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// --- CRUD Operations ---

/**
 * Create a new API token for a user.
 * Returns token WITH plaintext (displayed once only).
 */
export async function createToken(userId: string, name: string = 'Default Token') {
  const { token, tokenHash, tokenPrefix } = generateApiToken();
  const id = `tok_${generateId()}`;
  const now = new Date().toISOString();

  if (isPostgresMode) {
    const { query } = await import('../store.js');
    await query(
      `INSERT INTO api_tokens (id, user_id, name, token_hash, token_prefix, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, name, tokenHash, tokenPrefix, now]
    );
  } else {
    const stored: StoredToken = {
      id, userId, name, tokenHash, tokenPrefix,
      lastUsedAt: null, lastUsedIp: null,
      createdAt: now, revokedAt: null,
    };
    const tokens = await readUserCollection<StoredToken>(userId, 'api-tokens');
    tokens.push(stored);
    await writeUserCollection(userId, 'api-tokens', tokens);
  }

  return { id, userId, name, token, tokenPrefix, createdAt: now };
}

/**
 * Ensure a user has at least one active token.
 * If no active token exists, auto-create one.
 * Returns the active token (without plaintext).
 */
export async function ensureUserToken(userId: string): Promise<void> {
  const tokens = await listTokens(userId);
  const active = tokens.filter((t: any) => !t.revokedAt);
  if (active.length === 0) {
    await createToken(userId, 'API Token');
    console.log(`[API Token] Auto-generated token for user ${userId}`);
  }
}

/**
 * List tokens for a user (NO plaintext/hash returned).
 */
export async function listTokens(userId: string) {
  if (isPostgresMode) {
    const { query } = await import('../store.js');
    const result = await query(
      `SELECT id, user_id, name, token_prefix, last_used_at, last_used_ip, created_at, revoked_at
       FROM api_tokens WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      name: r.name,
      tokenPrefix: r.token_prefix,
      lastUsedAt: r.last_used_at?.toISOString?.() || r.last_used_at || null,
      lastUsedIp: r.last_used_ip,
      createdAt: r.created_at?.toISOString?.() || r.created_at,
      revokedAt: r.revoked_at?.toISOString?.() || r.revoked_at || null,
    }));
  } else {
    const tokens = await readUserCollection<StoredToken>(userId, 'api-tokens');
    return tokens.map(({ tokenHash: _hash, ...rest }) => rest);
  }
}

/**
 * Verify an API token.
 * Returns user info if valid, null if invalid or revoked.
 */
export async function verifyToken(plainToken: string): Promise<{
  userId: string;
  tokenId: string;
  role: string;
  email: string;
} | null> {
  if (!plainToken.startsWith(TOKEN_PREFIX)) return null;

  const hash = hashToken(plainToken);

  if (isPostgresMode) {
    const { query } = await import('../store.js');
    const result = await query(
      `SELECT t.id AS token_id, t.user_id, u.role, u.email
       FROM api_tokens t
       JOIN users u ON u.id = t.user_id
       WHERE t.token_hash = $1 AND t.revoked_at IS NULL`,
      [hash]
    );
    if (result.rows.length === 0) return null;
    const row = result.rows[0];
    return { userId: row.user_id, tokenId: row.token_id, role: row.role, email: row.email };
  } else {
    // File mode: scan all tenants
    const tenantIds = await getAllTenantIds();
    for (const tid of tenantIds) {
      const tokens = await readUserCollection<StoredToken>(tid, 'api-tokens');
      const found = tokens.find(t => t.tokenHash === hash && !t.revokedAt);
      if (found) {
        const users = await readCollection<any>('users');
        const user = users.find((u: any) => u.id === found.userId);
        if (!user) return null;
        return { userId: found.userId, tokenId: found.id, role: user.role, email: user.email };
      }
    }
    return null;
  }
}

/**
 * Update last_used_at and last_used_ip for a token.
 * Fire-and-forget — errors are silently ignored.
 */
export async function updateTokenUsage(tokenId: string, ip: string) {
  try {
    if (isPostgresMode) {
      const { query } = await import('../store.js');
      await query(
        'UPDATE api_tokens SET last_used_at = NOW(), last_used_ip = $1 WHERE id = $2',
        [ip, tokenId]
      );
    } else {
      // File mode: find token across tenants and update
      const tenantIds = await getAllTenantIds();
      for (const tid of tenantIds) {
        const tokens = await readUserCollection<StoredToken>(tid, 'api-tokens');
        const token = tokens.find(t => t.id === tokenId);
        if (token) {
          token.lastUsedAt = new Date().toISOString();
          token.lastUsedIp = ip;
          await writeUserCollection(tid, 'api-tokens', tokens);
          break;
        }
      }
    }
  } catch {
    // Silent — usage tracking should never fail requests
  }
}

/**
 * Revoke (soft delete) a token.
 */
export async function revokeToken(tokenId: string, userId: string): Promise<boolean> {
  if (isPostgresMode) {
    const { query } = await import('../store.js');
    const result = await query(
      'UPDATE api_tokens SET revoked_at = NOW() WHERE id = $1 AND user_id = $2 AND revoked_at IS NULL',
      [tokenId, userId]
    );
    return (result.rowCount ?? 0) > 0;
  } else {
    const tokens = await readUserCollection<StoredToken>(userId, 'api-tokens');
    const token = tokens.find(t => t.id === tokenId && !t.revokedAt);
    if (!token) return false;
    token.revokedAt = new Date().toISOString();
    await writeUserCollection(userId, 'api-tokens', tokens);
    return true;
  }
}

/**
 * Regenerate: revoke old token + create new one with same name.
 * Returns new token WITH plaintext.
 */
export async function regenerateToken(tokenId: string, userId: string) {
  // Get old token name
  let name = 'API Token';

  if (isPostgresMode) {
    const { query } = await import('../store.js');
    const old = await query('SELECT name FROM api_tokens WHERE id = $1 AND user_id = $2', [tokenId, userId]);
    if (old.rows.length === 0) return null;
    name = old.rows[0].name;
  } else {
    const tokens = await readUserCollection<StoredToken>(userId, 'api-tokens');
    const old = tokens.find(t => t.id === tokenId);
    if (!old) return null;
    name = old.name;
  }

  // Revoke old
  await revokeToken(tokenId, userId);

  // Create new with same name
  return createToken(userId, name);
}
