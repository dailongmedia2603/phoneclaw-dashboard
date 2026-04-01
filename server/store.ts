/**
 * Data Store Facade — Dual-mode: JSON files OR PostgreSQL.
 *
 * Controlled by USE_POSTGRES environment variable:
 * - USE_POSTGRES=true  → delegates to db.ts (PostgreSQL)
 * - USE_POSTGRES=false → uses original file-based storage (default)
 *
 * ALL data functions are async (return Promises) to support both modes.
 * Callers must use async/await.
 *
 * generateId() and ensureTenantDir() remain synchronous.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const TENANTS_DIR = path.join(DATA_DIR, 'tenants');

// ============================================================
// Feature Flag
// ============================================================

const USE_POSTGRES = process.env.USE_POSTGRES === 'true';

if (USE_POSTGRES) {
  console.log('[Store] Mode: PostgreSQL');
} else {
  console.log('[Store] Mode: JSON files');
}

// ============================================================
// File-based helpers (used when USE_POSTGRES=false)
// ============================================================

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

function tenantDir(userId: string): string {
  return path.join(TENANTS_DIR, userId);
}

function tenantFilePath(userId: string, collection: string): string {
  return path.join(tenantDir(userId), `${collection}.json`);
}

// ============================================================
// ID Generation (always sync, no DB needed)
// ============================================================

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ============================================================
// Tenant Directory (sync — no-op in PG mode)
// ============================================================

/**
 * Tạo thư mục tenant cho user nếu chưa tồn tại.
 * No-op khi USE_POSTGRES=true (PG không cần directories).
 */
export function ensureTenantDir(userId: string): void {
  if (USE_POSTGRES) return; // No-op
  const dir = tenantDir(userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ============================================================
// Global Collections (users, packages, shared-scripts, etc.)
// ============================================================

/**
 * Đọc toàn bộ collection (global).
 * VD: readCollection<User>('users')
 */
export async function readCollection<T>(collection: string): Promise<T[]> {
  if (USE_POSTGRES) {
    return db.readCollection<T>(collection);
  }
  // File-based
  ensureDir();
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]', 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

/**
 * Ghi toàn bộ collection (global).
 * VD: writeCollection('users', usersArray)
 */
export async function writeCollection<T>(collection: string, data: T[]): Promise<void> {
  if (USE_POSTGRES) {
    return db.writeCollection(collection, data as any);
  }
  // File-based
  ensureDir();
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
// Singleton (settings)
// ============================================================

/**
 * Đọc singleton config.
 * VD: readSingleton<AppSettings>('settings', DEFAULT_SETTINGS)
 */
export async function readSingleton<T>(collection: string, fallback: T): Promise<T> {
  if (USE_POSTGRES) {
    return db.readSingleton<T>(collection, fallback);
  }
  // File-based
  ensureDir();
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

/**
 * Ghi singleton config.
 * VD: writeSingleton('settings', updatedSettings)
 */
export async function writeSingleton<T>(collection: string, data: T): Promise<void> {
  if (USE_POSTGRES) {
    return db.writeSingleton(collection, data);
  }
  // File-based
  ensureDir();
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2), 'utf-8');
}

// ============================================================
// Tenant-scoped Collections
// ============================================================

/**
 * Đọc collection của 1 user cụ thể.
 * Trả về [] nếu user chưa có data.
 */
export async function readUserCollection<T>(userId: string, collection: string): Promise<T[]> {
  if (USE_POSTGRES) {
    return db.readUserCollection<T>(userId, collection);
  }
  // File-based
  ensureTenantDir(userId);
  const fp = tenantFilePath(userId, collection);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]', 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

/**
 * Ghi collection cho 1 user cụ thể.
 */
export async function writeUserCollection<T>(userId: string, collection: string, data: T[]): Promise<void> {
  if (USE_POSTGRES) {
    return db.writeUserCollection(userId, collection, data as any);
  }
  // File-based
  ensureTenantDir(userId);
  fs.writeFileSync(tenantFilePath(userId, collection), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Đọc collection từ TẤT CẢ tenants (cho admin aggregate view).
 * Mỗi item được gắn thêm __tenantId để biết thuộc user nào.
 */
export async function readAllTenantsCollection<T>(collection: string): Promise<(T & { __tenantId: string })[]> {
  if (USE_POSTGRES) {
    return db.readAllTenantsCollection<T>(collection);
  }
  // File-based
  if (!fs.existsSync(TENANTS_DIR)) return [];

  const result: (T & { __tenantId: string })[] = [];
  const userDirs = fs.readdirSync(TENANTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const userId of userDirs) {
    const fp = tenantFilePath(userId, collection);
    if (fs.existsSync(fp)) {
      try {
        const items = JSON.parse(fs.readFileSync(fp, 'utf-8')) as T[];
        for (const item of items) {
          result.push({ ...item, __tenantId: userId });
        }
      } catch {
        // Corrupt file — skip silently
      }
    }
  }
  return result;
}

/**
 * Lấy danh sách tất cả tenant user IDs.
 */
export async function getAllTenantIds(): Promise<string[]> {
  if (USE_POSTGRES) {
    return db.getAllTenantIds();
  }
  // File-based
  if (!fs.existsSync(TENANTS_DIR)) return [];
  return fs.readdirSync(TENANTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

// ============================================================
// Database Lifecycle (only used in PG mode)
// ============================================================

/**
 * Initialize database connection pool.
 * Call during server startup BEFORE any data operations.
 * No-op when USE_POSTGRES=false.
 */
export async function initDb(): Promise<void> {
  if (USE_POSTGRES) {
    return db.initDb();
  }
  // File-based: nothing to initialize
}

/**
 * Close database connection pool.
 * Call during graceful shutdown.
 * No-op when USE_POSTGRES=false.
 */
export async function closeDb(): Promise<void> {
  if (USE_POSTGRES) {
    return db.closeDb();
  }
}

// ============================================================
// Re-exports from db.ts (for direct DB access when needed)
// ============================================================

export {
  // Low-level query (only available in PG mode)
  query,
  getClient,
  withTransaction,
  // Row mappers
  rowToDevice,
  rowToScript,
  rowToSchedule,
  rowToExecution,
  rowToActivityLog,
  rowToScreenshot,
  rowToVideo,
  rowToNotification,
  rowToUser,
  rowToUserWithPassword,
  // Device-specific
  deviceToColumns,
  rowToDeviceGroup,
  // DeviceGroup M2M
  getGroupsWithDeviceIds,
  getAllGroupsWithDeviceIds,
  syncGroupDeviceIds,
  // Generic CRUD
  insertRow,
  updateRow,
  updateRowScoped,
  deleteRow,
  deleteRowScoped,
  findById,
  findByOwner,
  findAll,
} from './db.js';

/**
 * Whether PostgreSQL mode is active.
 * Use this to conditionally branch logic that differs between modes.
 */
export const isPostgresMode = USE_POSTGRES;
