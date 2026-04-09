/**
 * PostgreSQL Database Layer for PhoneAgent Dashboard.
 *
 * Replaces JSON file-based storage (store.ts) with PostgreSQL.
 * Provides the SAME interface so callers need minimal changes
 * (only adding async/await).
 *
 * Design decisions:
 * - Uses raw `pg` (node-postgres) — no ORM overhead
 * - Connection pool sized for VPS 8GB RAM (max 20)
 * - camelCase ↔ snake_case auto-conversion
 * - Device.proxyConfig flatten/unflatten handled by dedicated mappers
 * - DeviceGroup.deviceIds reconstructed from M2M table
 * - app_settings stored as single JSONB row
 */

import pg from 'pg';
import type {
  Device, DeviceGroup, Script, Schedule, ScheduleHistory,
  ActivityLog, ScreenshotLog, Video, Notification,
  AppSettings, ProxyConfig,
} from '../src/types/index.js';

const { Pool } = pg;
type PoolClient = pg.PoolClient;

// ============================================================
// Connection Pool
// ============================================================

let pool: pg.Pool | null = null;

export async function initDb(): Promise<void> {
  if (pool) return;

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: 5000,
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected pool error:', err.message);
  });

  // Test connection
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    console.log('[DB] PostgreSQL connected successfully');

    // Auto-migrate: create api_tokens + api_audit_logs if not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id              TEXT PRIMARY KEY,
        user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name            TEXT NOT NULL DEFAULT 'Default Token',
        token_hash      TEXT NOT NULL UNIQUE,
        token_prefix    TEXT NOT NULL,
        token_encrypted TEXT,
        last_used_at    TIMESTAMPTZ,
        last_used_ip    TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        revoked_at      TIMESTAMPTZ
      );
      -- Add column if table existed before this migration
      ALTER TABLE api_tokens ADD COLUMN IF NOT EXISTS token_encrypted TEXT;
      CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash) WHERE revoked_at IS NULL;

      CREATE TABLE IF NOT EXISTS api_audit_logs (
        id              TEXT PRIMARY KEY,
        token_id        TEXT REFERENCES api_tokens(id) ON DELETE SET NULL,
        user_id         TEXT REFERENCES users(id) ON DELETE CASCADE,
        method          TEXT NOT NULL,
        path            TEXT NOT NULL,
        status_code     INTEGER,
        ip              TEXT,
        user_agent      TEXT,
        response_time   INTEGER,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON api_audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON api_audit_logs(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_token ON api_audit_logs(token_id);
    `);
    console.log('[DB] API Token tables ensured');

    // Ensure package limit columns exist (added in package-limits feature)
    await client.query(`
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_scripts INTEGER NOT NULL DEFAULT -1;
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_schedules INTEGER NOT NULL DEFAULT -1;
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS proxy_enabled BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS gps_spoof_enabled BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS api_tokens_enabled BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_video_storage_mb INTEGER NOT NULL DEFAULT -1;
    `);
    console.log('[DB] Package limit columns ensured');

    // Auto-migrate: social_accounts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS social_accounts (
        id              TEXT PRIMARY KEY,
        owner_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        username        TEXT NOT NULL,
        password        TEXT NOT NULL,
        email           TEXT DEFAULT '',
        email_password  TEXT DEFAULT '',
        channel         TEXT NOT NULL DEFAULT 'tiktok_vn',
        device_id       TEXT REFERENCES devices(id) ON DELETE SET NULL,
        notes           TEXT DEFAULT '',
        status          TEXT NOT NULL DEFAULT 'active',
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_social_accounts_owner ON social_accounts(owner_id);
      CREATE INDEX IF NOT EXISTS idx_social_accounts_channel ON social_accounts(channel);
    `);
    console.log('[DB] Social accounts table ensured');

    // Gmail OAuth columns for social_accounts
    await client.query(`
      ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT;
      ALTER TABLE social_accounts ADD COLUMN IF NOT EXISTS gmail_authorized BOOLEAN DEFAULT false;
    `);
    console.log('[DB] Social accounts Gmail columns ensured');
  } finally {
    client.release();
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Pool closed');
  }
}

function getPool(): pg.Pool {
  if (!pool) throw new Error('[DB] Pool not initialized. Call initDb() first.');
  return pool;
}

// ============================================================
// Low-level Query Helpers
// ============================================================

export async function query<T extends pg.QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

/**
 * Execute a function inside a transaction.
 * Auto-commits on success, rolls back on error.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore rollback error */ }
    throw err;
  } finally {
    client.release();
  }
}

// ============================================================
// ID Generation (giữ nguyên format hiện tại)
// ============================================================

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ============================================================
// camelCase ↔ snake_case Conversion
// ============================================================

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Convert a DB row (snake_case columns) → JS object (camelCase properties).
 * Handles Date → ISO string conversion for TIMESTAMPTZ columns.
 */
function rowToJs<T>(row: Record<string, unknown>): T {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = toCamelCase(key);
    // Convert Date objects to ISO strings (matches current JSON behavior)
    if (value instanceof Date) {
      result[camelKey] = value.toISOString();
    } else {
      result[camelKey] = value;
    }
  }
  return result as T;
}

/**
 * Convert a JS object (camelCase) → DB columns (snake_case).
 * Skips undefined values. Converts Date strings to Date objects is NOT needed
 * because pg driver handles ISO strings natively.
 */
function jsToColumns(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    result[toSnakeCase(key)] = value;
  }
  return result;
}

// ============================================================
// Device Mapper — ProxyConfig flatten/unflatten
// ============================================================

/**
 * Convert a DB row → Device object with nested proxyConfig.
 * This reconstructs the ProxyConfig interface from flat DB columns.
 */
export function rowToDevice(row: Record<string, unknown>): Device {
  const device: Record<string, unknown> = {
    id: row.id,
    name: row.name,
    tailscaleIp: row.tailscale_ip,
    vncPort: row.vnc_port,
    httpPort: row.http_port,
    iosVersion: row.ios_version,
    model: row.model,
    status: row.status,
    battery: row.battery,
    uptime: row.uptime,
    group: row.group,
    vncPassword: row.vnc_password,
    account: row.account,
    currentScript: row.current_script || undefined,
    lastSeen: row.last_seen instanceof Date ? row.last_seen.toISOString() : row.last_seen,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    proxyStatus: row.proxy_status || undefined,
    ownerId: row.owner_id,
    heartbeatConfigured: row.heartbeat_configured,
  };

  // Reconstruct proxyConfig nested object only if proxy data exists
  if (row.proxy_ip || row.proxy_enabled) {
    device.proxyConfig = {
      ip: row.proxy_ip || '',
      port: row.proxy_port || 0,
      username: row.proxy_username || '',
      password: row.proxy_password || '',
      enabled: row.proxy_enabled || false,
      mode: (row.proxy_mode as string) || 'none',
      timezone: row.proxy_timezone || undefined,
      locale: row.proxy_locale || undefined,
      latitude: row.proxy_latitude !== null ? row.proxy_latitude : undefined,
      longitude: row.proxy_longitude !== null ? row.proxy_longitude : undefined,
    } as ProxyConfig;
  }

  return device as unknown as Device;
}

/**
 * Flatten a Device input (with nested proxyConfig) → flat DB columns for INSERT/UPDATE.
 * Only includes fields that are explicitly provided (not undefined).
 */
export function deviceToColumns(data: Partial<Device>): Record<string, unknown> {
  const cols: Record<string, unknown> = {};

  // Direct field mappings
  if (data.id !== undefined) cols.id = data.id;
  if (data.name !== undefined) cols.name = data.name;
  if (data.tailscaleIp !== undefined) cols.tailscale_ip = data.tailscaleIp;
  if (data.vncPort !== undefined) cols.vnc_port = data.vncPort;
  if (data.httpPort !== undefined) cols.http_port = data.httpPort;
  if (data.iosVersion !== undefined) cols.ios_version = data.iosVersion;
  if (data.model !== undefined) cols.model = data.model;
  if (data.status !== undefined) cols.status = data.status;
  if (data.battery !== undefined) cols.battery = data.battery;
  if (data.uptime !== undefined) cols.uptime = data.uptime;
  if (data.group !== undefined) cols.group = data.group;
  if (data.vncPassword !== undefined) cols.vnc_password = data.vncPassword;
  if (data.account !== undefined) cols.account = data.account;
  if (data.currentScript !== undefined) cols.current_script = data.currentScript;
  if (data.lastSeen !== undefined) cols.last_seen = data.lastSeen;
  if (data.ownerId !== undefined) cols.owner_id = data.ownerId;
  if (data.proxyStatus !== undefined) cols.proxy_status = data.proxyStatus;
  if (data.heartbeatConfigured !== undefined) cols.heartbeat_configured = data.heartbeatConfigured;

  // Flatten proxyConfig nested object
  if (data.proxyConfig) {
    const pc = data.proxyConfig;
    cols.proxy_ip = pc.ip;
    cols.proxy_port = pc.port;
    cols.proxy_username = pc.username;
    cols.proxy_password = pc.password;
    cols.proxy_enabled = pc.enabled;
    cols.proxy_mode = pc.mode;
    cols.proxy_timezone = pc.timezone ?? null;
    cols.proxy_locale = pc.locale ?? null;
    cols.proxy_latitude = pc.latitude ?? null;
    cols.proxy_longitude = pc.longitude ?? null;
  }

  return cols;
}

// ============================================================
// DeviceGroup Mapper — deviceIds from M2M table
// ============================================================

/**
 * Convert DB row + deviceIds array → DeviceGroup object.
 * deviceIds is populated separately via JOIN or subquery.
 */
export function rowToDeviceGroup(
  row: Record<string, unknown>,
  deviceIds: string[] = []
): DeviceGroup {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    deviceIds,
    ownerId: row.owner_id as string | undefined,
  };
}

/**
 * Get all groups with their deviceIds populated from M2M table.
 * @param ownerId - If provided, filter by owner. If undefined, return all.
 */
export async function getGroupsWithDeviceIds(ownerId?: string): Promise<DeviceGroup[]> {
  const whereClause = ownerId ? 'WHERE g.owner_id = $1' : '';
  const params = ownerId ? [ownerId] : [];

  const { rows } = await query(`
    SELECT
      g.id, g.owner_id, g.name, g.color,
      COALESCE(
        array_agg(dgm.device_id) FILTER (WHERE dgm.device_id IS NOT NULL),
        '{}'
      ) AS device_ids
    FROM device_groups g
    LEFT JOIN device_group_members dgm ON g.id = dgm.group_id
    ${whereClause}
    GROUP BY g.id, g.owner_id, g.name, g.color
  `, params);

  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    deviceIds: row.device_ids || [],
    ownerId: row.owner_id,
  }));
}

/**
 * Get all groups across ALL owners (for admin aggregate view).
 * Each group is annotated with __tenantId for backwards compatibility.
 */
export async function getAllGroupsWithDeviceIds(): Promise<(DeviceGroup & { __tenantId: string })[]> {
  const { rows } = await query(`
    SELECT
      g.id, g.owner_id, g.name, g.color,
      COALESCE(
        array_agg(dgm.device_id) FILTER (WHERE dgm.device_id IS NOT NULL),
        '{}'
      ) AS device_ids
    FROM device_groups g
    LEFT JOIN device_group_members dgm ON g.id = dgm.group_id
    GROUP BY g.id, g.owner_id, g.name, g.color
  `);

  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    color: row.color,
    deviceIds: row.device_ids || [],
    ownerId: row.owner_id,
    __tenantId: row.owner_id,
  }));
}

/**
 * Sync deviceIds for a group — replace all M2M entries.
 * Uses transaction for atomicity.
 */
export async function syncGroupDeviceIds(groupId: string, deviceIds: string[]): Promise<void> {
  await withTransaction(async (client) => {
    // Remove all existing memberships
    await client.query('DELETE FROM device_group_members WHERE group_id = $1', [groupId]);

    // Insert new memberships
    if (deviceIds.length > 0) {
      const values = deviceIds.map((_, i) => `($1, $${i + 2})`).join(', ');
      await client.query(
        `INSERT INTO device_group_members (group_id, device_id) VALUES ${values} ON CONFLICT DO NOTHING`,
        [groupId, ...deviceIds]
      );
    }
  });
}

// ============================================================
// Generic Row Mappers (for simple entities)
// ============================================================

/**
 * Map a user DB row → safe user object (password STRIPPED).
 * The password field is intentionally excluded to prevent accidental leaks.
 * Auth routes that need the password should query the raw row directly.
 */
export function rowToUser(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    email: row.email as string,
    name: row.name as string,
    phone: (row.phone as string) || '',
    role: row.role as string,
    packageId: row.package_id as string | undefined,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at as string,
    // NOTE: password intentionally excluded
  };
}

/**
 * Map a user DB row → FULL user object (INCLUDING password hash).
 * Only used by auth routes for password verification.
 */
export function rowToUserWithPassword(row: Record<string, unknown>): Record<string, unknown> {
  return {
    ...rowToUser(row),
    password: row.password as string,
  };
}

/** Map a notification DB row → Notification interface */
export function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    type: row.type as Notification['type'],
    title: row.title as string,
    message: row.message as string,
    read: row.read as boolean,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp as string,
    userId: (row.user_id as string) || undefined,
  };
}

/** Map a script DB row → Script interface */
export function rowToScript(row: Record<string, unknown>): Script {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) || '',
    channel: row.channel as string | undefined,
    graphData: row.graph_data as Script['graphData'],
    steps: (row.steps as Script['steps']) || [],
    status: row.status as Script['status'],
    lastRun: row.last_run instanceof Date ? row.last_run.toISOString() : (row.last_run as string | undefined),
    runCount: (row.run_count as number) || 0,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at as string,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at as string,
    ownerId: row.owner_id as string | undefined,
  };
}

/** Map a schedule DB row → Schedule interface */
export function rowToSchedule(row: Record<string, unknown>): Schedule {
  return {
    id: row.id as string,
    name: row.name as string,
    scriptId: row.script_id as string,
    scriptName: (row.script_name as string) || '',
    targetType: row.target_type as Schedule['targetType'],
    targetId: row.target_id as string,
    targetName: (row.target_name as string) || '',
    cron: row.cron as string,
    enabled: row.enabled as boolean,
    nextRun: row.next_run instanceof Date ? row.next_run.toISOString() : (row.next_run as string | undefined),
    lastRun: row.last_run instanceof Date ? row.last_run.toISOString() : (row.last_run as string | undefined),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at as string,
    ownerId: row.owner_id as string | undefined,
  };
}

/** Map an execution history DB row → ScheduleHistory interface */
export function rowToExecution(row: Record<string, unknown>): ScheduleHistory {
  return {
    id: row.id as string,
    scheduleId: (row.schedule_id as string) || '',
    scheduleName: (row.schedule_name as string) || '',
    scriptName: row.script_name as string,
    targetName: (row.target_name as string) || '',
    startedAt: row.started_at instanceof Date ? row.started_at.toISOString() : row.started_at as string,
    finishedAt: row.finished_at instanceof Date ? row.finished_at.toISOString() : (row.finished_at as string | undefined),
    status: row.status as ScheduleHistory['status'],
    error: row.error as string | undefined,
    steps: (row.steps as ScheduleHistory['steps']) || [],
    ownerId: row.owner_id as string | undefined,
  };
}

/** Map an activity log DB row → ActivityLog interface */
export function rowToActivityLog(row: Record<string, unknown>): ActivityLog {
  return {
    id: row.id as string,
    type: row.type as ActivityLog['type'],
    action: row.action as string,
    details: (row.details as string) || '',
    deviceId: row.device_id as string | undefined,
    deviceName: row.device_name as string | undefined,
    userId: row.user_id as string | undefined,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp as string,
  };
}

/** Map a screenshot DB row → ScreenshotLog interface */
export function rowToScreenshot(row: Record<string, unknown>): ScreenshotLog {
  return {
    id: row.id as string,
    deviceId: row.device_id as string,
    deviceName: (row.device_name as string) || '',
    url: row.url as string,
    thumbnail: (row.thumbnail as string) || row.url as string,
    scriptName: row.script_name as string | undefined,
    step: row.step as number | undefined,
    timestamp: row.timestamp instanceof Date ? row.timestamp.toISOString() : row.timestamp as string,
    ownerId: row.owner_id as string | undefined,
  };
}

/** Map a video DB row → Video interface */
export function rowToVideo(row: Record<string, unknown>): Video {
  return {
    id: row.id as string,
    name: row.name as string,
    filename: row.filename as string,
    r2Key: row.r2_key as string,
    url: row.url as string,
    size: Number(row.size) || 0,
    mimeType: (row.mime_type as string) || 'video/mp4',
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : row.uploaded_at as string,
    ownerId: row.owner_id as string | undefined,
  };
}

export function rowToSocialAccount(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id as string,
    username: row.username as string,
    password: row.password as string,
    email: (row.email as string) || '',
    emailPassword: (row.email_password as string) || '',
    channel: (row.channel as string) || 'tiktok_vn',
    deviceId: (row.device_id as string) || undefined,
    notes: (row.notes as string) || '',
    status: (row.status as string) || 'active',
    ownerId: row.owner_id as string,
    gmailRefreshToken: (row.gmail_refresh_token as string) || undefined,
    gmailAuthorized: row.gmail_authorized === true,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at as string,
    updatedAt: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at as string,
  };
}

// ============================================================
// Generic CRUD Helpers
// ============================================================

/**
 * INSERT a row into a table. Returns the inserted row.
 * @param table Table name
 * @param data Object with snake_case column names
 */
export async function insertRow<T extends Record<string, unknown>>(
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  assertValidTable(table);
  const cols = Object.keys(data);
  const vals = Object.values(data);
  const placeholders = cols.map((_, i) => `$${i + 1}`);

  // Quote reserved words like "group", "timestamp", "read"
  const quotedCols = cols.map(quoteIfReserved);

  const { rows } = await query(
    `INSERT INTO ${table} (${quotedCols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`,
    vals
  );
  return rows[0] as T;
}

/**
 * UPDATE a row by ID. Returns the updated row or null if not found.
 */
export async function updateRow<T extends Record<string, unknown>>(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  assertValidTable(table);
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  const sets = entries.map(([key], i) => `${quoteIfReserved(key)} = $${i + 2}`);
  const vals = [id, ...entries.map(([_, v]) => v)];

  const { rows } = await query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $1 RETURNING *`,
    vals
  );
  return (rows[0] as T) || null;
}

/**
 * UPDATE a row by ID + owner_id (tenant-scoped).
 */
export async function updateRowScoped<T extends Record<string, unknown>>(
  table: string,
  id: string,
  ownerId: string,
  data: Record<string, unknown>
): Promise<T | null> {
  assertValidTable(table);
  const entries = Object.entries(data);
  if (entries.length === 0) return null;

  const sets = entries.map(([key], i) => `${quoteIfReserved(key)} = $${i + 3}`);
  const vals = [id, ownerId, ...entries.map(([_, v]) => v)];

  const { rows } = await query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $1 AND owner_id = $2 RETURNING *`,
    vals
  );
  return (rows[0] as T) || null;
}

/**
 * DELETE a row by ID. Returns true if deleted.
 */
export async function deleteRow(table: string, id: string): Promise<boolean> {
  assertValidTable(table);
  const { rowCount } = await query(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return (rowCount ?? 0) > 0;
}

/**
 * DELETE a row by ID + owner_id (tenant-scoped).
 */
export async function deleteRowScoped(table: string, id: string, ownerId: string): Promise<boolean> {
  assertValidTable(table);
  const { rowCount } = await query(
    `DELETE FROM ${table} WHERE id = $1 AND owner_id = $2`,
    [id, ownerId]
  );
  return (rowCount ?? 0) > 0;
}

/**
 * Find a single row by ID.
 */
export async function findById<T extends Record<string, unknown>>(
  table: string,
  id: string
): Promise<T | null> {
  assertValidTable(table);
  const { rows } = await query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
  return (rows[0] as T) || null;
}

/**
 * Find all rows belonging to a specific owner.
 */
export async function findByOwner<T extends Record<string, unknown>>(
  table: string,
  ownerId: string
): Promise<T[]> {
  assertValidTable(table);
  const { rows } = await query(`SELECT * FROM ${table} WHERE owner_id = $1`, [ownerId]);
  return rows as T[];
}

/**
 * Find all rows in a table.
 */
export async function findAll<T extends Record<string, unknown>>(
  table: string
): Promise<T[]> {
  assertValidTable(table);
  const { rows } = await query(`SELECT * FROM ${table}`);
  return rows as T[];
}

// ============================================================
// Collection-Compatible Wrappers
// (Match store.ts interface for minimal caller changes)
// ============================================================

/**
 * Table name mapping: collection name → PostgreSQL table.
 * Matches the JSON file names used in store.ts.
 */
const TABLE_MAP: Record<string, string> = {
  'users': 'users',
  'packages': 'packages',
  'notifications': 'notifications',
  'shared-scripts': 'shared_scripts',
  'devices': 'devices',
  'device-groups': 'device_groups',
  'scripts': 'scripts',
  'schedules': 'schedules',
  'execution-history': 'execution_history',
  'activity-logs': 'activity_logs',
  'screenshots': 'screenshots',
  'videos': 'videos',
  'custom-nodes': 'custom_nodes',
  'social-accounts': 'social_accounts',
};

/**
 * Row mapper per table — converts DB row to the correct interface type.
 */
function mapRow(table: string, row: Record<string, unknown>): unknown {
  switch (table) {
    case 'users': return rowToUserWithPassword(row);
    case 'packages': return rowToJs(row);
    case 'devices': return rowToDevice(row);
    case 'scripts':
    case 'shared_scripts': return rowToScript(row);
    case 'schedules': return rowToSchedule(row);
    case 'execution_history': return rowToExecution(row);
    case 'activity_logs': return rowToActivityLog(row);
    case 'screenshots': return rowToScreenshot(row);
    case 'videos': return rowToVideo(row);
    case 'notifications': return rowToNotification(row);
    case 'custom_nodes': return rowToJs(row);
    case 'social_accounts': return rowToSocialAccount(row);
    default: return rowToJs(row);
  }
}

function resolveTable(collection: string): string {
  return TABLE_MAP[collection] || collection;
}

/**
 * Read a global collection (e.g. 'users', 'packages', 'shared-scripts').
 * Equivalent to old readCollection<T>('users').
 */
export async function readCollection<T>(collection: string): Promise<T[]> {
  const table = resolveTable(collection);
  assertValidTable(table);
  const { rows } = await query(`SELECT * FROM ${table}`);
  return rows.map((row: any) => mapRow(table, row) as T);
}

/**
 * Write/replace an entire global collection.
 * WARNING: This is destructive — deletes all existing rows and inserts new ones.
 * Used for backwards compatibility with store.ts pattern where callers
 * read all → modify → write all.
 *
 * For new code, prefer insertRow/updateRow/deleteRow directly.
 */
export async function writeCollection<T extends Record<string, unknown>>(
  collection: string,
  data: T[]
): Promise<void> {
  const table = resolveTable(collection);
  assertValidTable(table);

  await withTransaction(async (client) => {
    await client.query(`DELETE FROM ${table}`);
    for (const item of data) {
      const cols = jsToColumns(item);
      // JSONB fields: stringify objects/arrays for PostgreSQL
      for (const key of Object.keys(cols)) {
        const val = cols[key];
        if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
          cols[key] = JSON.stringify(val);
        }
      }
      const keys = Object.keys(cols);
      const vals = Object.values(cols);
      const placeholders = keys.map((_, i) => `$${i + 1}`);
      const quotedKeys = keys.map(quoteIfReserved);

      await client.query(
        `INSERT INTO ${table} (${quotedKeys.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO NOTHING`,
        vals
      );
    }
  });
}

/**
 * Read a singleton config (e.g. 'settings').
 * Stored in app_settings table as JSONB.
 */
export async function readSingleton<T>(collection: string, fallback: T): Promise<T> {
  if (collection === 'settings') {
    const { rows } = await query('SELECT data FROM app_settings WHERE id = 1');
    if (rows.length === 0) return fallback;
    return rows[0].data as T;
  }
  // For non-settings singletons, fallback to reading as collection
  // (not expected in current codebase, but safe)
  const all = await readCollection<T>(collection);
  return all.length > 0 ? all[0] : fallback;
}

/**
 * Write a singleton config.
 */
export async function writeSingleton<T>(collection: string, data: T): Promise<void> {
  if (collection === 'settings') {
    await query(
      'INSERT INTO app_settings (id, data) VALUES (1, $1) ON CONFLICT (id) DO UPDATE SET data = $1',
      [JSON.stringify(data)]
    );
    return;
  }
  // Fallback — not expected
  await writeCollection(collection, [data as any]);
}

/**
 * Read a tenant-scoped collection.
 * Equivalent to old readUserCollection<T>(userId, 'devices').
 */
export async function readUserCollection<T>(userId: string, collection: string): Promise<T[]> {
  const table = resolveTable(collection);
  assertValidTable(table);

  // Notifications: user_id field (not owner_id)
  if (table === 'notifications') {
    const { rows } = await query(
      `SELECT * FROM ${table} WHERE user_id = $1 ORDER BY "timestamp" DESC`,
      [userId]
    );
    return rows.map((row: any) => mapRow(table, row) as T);
  }

  // device_groups needs special handling for deviceIds
  if (table === 'device_groups') {
    const groups = await getGroupsWithDeviceIds(userId);
    return groups as unknown as T[];
  }

  const { rows } = await query(
    `SELECT * FROM ${table} WHERE owner_id = $1`,
    [userId]
  );
  return rows.map((row: any) => mapRow(table, row) as T);
}

/**
 * Write/replace a tenant-scoped collection.
 * WARNING: Destructive — deletes all rows for this user and inserts new ones.
 * For new code, prefer insertRow/updateRow/deleteRow directly.
 */
export async function writeUserCollection<T extends Record<string, unknown>>(
  userId: string,
  collection: string,
  data: T[]
): Promise<void> {
  const table = resolveTable(collection);
  assertValidTable(table);

  await withTransaction(async (client) => {
    // Delete existing rows for this user
    if (table === 'notifications') {
      await client.query(`DELETE FROM ${table} WHERE user_id = $1`, [userId]);
    } else if (table === 'device_groups') {
      // Special: also clean M2M entries (CASCADE handles this)
      await client.query(`DELETE FROM ${table} WHERE owner_id = $1`, [userId]);
    } else {
      await client.query(`DELETE FROM ${table} WHERE owner_id = $1`, [userId]);
    }

    // Insert all items
    for (const item of data) {
      const raw = item as Record<string, unknown>;

      if (table === 'devices') {
        // Flatten proxyConfig for devices
        const cols = deviceToColumns(raw as Partial<Device>);
        if (!cols.owner_id) cols.owner_id = userId;
        const keys = Object.keys(cols);
        const vals = Object.values(cols);
        const placeholders = keys.map((_, i) => `$${i + 1}`);
        const quotedKeys = keys.map(quoteIfReserved);
        await client.query(
          `INSERT INTO ${table} (${quotedKeys.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO NOTHING`,
          vals
        );
      } else if (table === 'device_groups') {
        // Insert group + M2M entries
        const deviceIds = (raw.deviceIds as string[]) || [];
        await client.query(
          `INSERT INTO device_groups (id, owner_id, name, color) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING`,
          [raw.id, userId, raw.name, raw.color || '#6366f1']
        );
        for (const deviceId of deviceIds) {
          await client.query(
            `INSERT INTO device_group_members (group_id, device_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [raw.id, deviceId]
          );
        }
      } else if (table === 'notifications') {
        const cols = jsToColumns(raw);
        cols.user_id = userId;
        delete cols.owner_id;
        const keys = Object.keys(cols);
        const vals = Object.values(cols);
        const placeholders = keys.map((_, i) => `$${i + 1}`);
        const quotedKeys = keys.map(quoteIfReserved);
        await client.query(
          `INSERT INTO ${table} (${quotedKeys.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO NOTHING`,
          vals
        );
      } else {
        const cols = jsToColumns(raw);
        if (!cols.owner_id) cols.owner_id = userId;
        // JSONB fields: steps, graph_data, steps (execution) need to be stringified
        for (const key of Object.keys(cols)) {
          const val = cols[key];
          if (val !== null && typeof val === 'object' && !(val instanceof Date)) {
            cols[key] = JSON.stringify(val);
          }
        }
        const keys = Object.keys(cols);
        const vals = Object.values(cols);
        const placeholders = keys.map((_, i) => `$${i + 1}`);
        const quotedKeys = keys.map(quoteIfReserved);
        await client.query(
          `INSERT INTO ${table} (${quotedKeys.join(', ')}) VALUES (${placeholders.join(', ')}) ON CONFLICT (id) DO NOTHING`,
          vals
        );
      }
    }
  });
}

/**
 * Read a collection across ALL tenants (for admin aggregate view).
 * Each item is annotated with __tenantId for backwards compatibility.
 */
export async function readAllTenantsCollection<T>(
  collection: string
): Promise<(T & { __tenantId: string })[]> {
  const table = resolveTable(collection);
  assertValidTable(table);

  // device_groups needs special handling
  if (table === 'device_groups') {
    return getAllGroupsWithDeviceIds() as unknown as (T & { __tenantId: string })[];
  }

  // notifications uses user_id, not owner_id
  const ownerCol = table === 'notifications' ? 'user_id' : 'owner_id';

  const { rows } = await query(`SELECT * FROM ${table} WHERE ${ownerCol} IS NOT NULL`);
  return rows.map((row: any) => {
    const mapped = mapRow(table, row) as T & { __tenantId: string };
    (mapped as any).__tenantId = row[ownerCol];
    return mapped;
  });
}

/**
 * Get all tenant (user) IDs that have data.
 * In PostgreSQL, this is all user IDs.
 */
export async function getAllTenantIds(): Promise<string[]> {
  const { rows } = await query('SELECT id FROM users ORDER BY id');
  return rows.map((r: any) => r.id);
}

/**
 * No-op — PostgreSQL doesn't need tenant directories.
 * Kept for backwards compatibility with callers that call ensureTenantDir().
 */
export function ensureTenantDir(_userId: string): void {
  // No-op
}

// ============================================================
// Utility: SQL Reserved Word Quoting
// ============================================================

const RESERVED_WORDS = new Set([
  'group', 'timestamp', 'read', 'user', 'order', 'table', 'index',
  'select', 'insert', 'update', 'delete', 'from', 'where', 'check',
  'type',
]);

// ============================================================
// Table Name Validation (SQL Injection Prevention)
// ============================================================

/**
 * Allow-list of valid table names.
 * ONLY these tables can be used in dynamic SQL.
 * Prevents SQL injection through table name interpolation.
 */
const VALID_TABLES = new Set([
  'users', 'packages', 'devices', 'device_groups', 'device_group_members',
  'scripts', 'shared_scripts', 'schedules', 'execution_history',
  'activity_logs', 'screenshots', 'videos', 'custom_nodes',
  'notifications', 'app_settings', 'social_accounts',
]);

function assertValidTable(table: string): void {
  if (!VALID_TABLES.has(table)) {
    throw new Error(`[DB] Invalid table name: "${table}". Allowed: ${[...VALID_TABLES].join(', ')}`);
  }
}

function quoteIfReserved(col: string): string {
  if (RESERVED_WORDS.has(col.toLowerCase())) {
    return `"${col}"`;
  }
  return col;
}
