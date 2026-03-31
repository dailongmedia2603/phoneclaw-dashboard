import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function filePath(collection: string): string {
  return path.join(DATA_DIR, `${collection}.json`);
}

export function readCollection<T>(collection: string): T[] {
  ensureDir();
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, '[]', 'utf-8');
    return [];
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function writeCollection<T>(collection: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2), 'utf-8');
}

export function readSingleton<T>(collection: string, fallback: T): T {
  ensureDir();
  const fp = filePath(collection);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, JSON.stringify(fallback, null, 2), 'utf-8');
    return fallback;
  }
  return JSON.parse(fs.readFileSync(fp, 'utf-8'));
}

export function writeSingleton<T>(collection: string, data: T): void {
  ensureDir();
  fs.writeFileSync(filePath(collection), JSON.stringify(data, null, 2), 'utf-8');
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// ============================================================
// Tenant-scoped storage — per-user data isolation
// ============================================================

const TENANTS_DIR = path.join(DATA_DIR, 'tenants');

function tenantDir(userId: string): string {
  return path.join(TENANTS_DIR, userId);
}

function tenantFilePath(userId: string, collection: string): string {
  return path.join(tenantDir(userId), `${collection}.json`);
}

/**
 * Tạo thư mục tenant cho user nếu chưa tồn tại.
 * Gọi khi tạo user mới hoặc khi cần đọc/ghi tenant data.
 */
export function ensureTenantDir(userId: string): void {
  const dir = tenantDir(userId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Đọc collection của 1 user cụ thể.
 * Trả về [] nếu user chưa có file.
 */
export function readUserCollection<T>(userId: string, collection: string): T[] {
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
export function writeUserCollection<T>(userId: string, collection: string, data: T[]): void {
  ensureTenantDir(userId);
  fs.writeFileSync(tenantFilePath(userId, collection), JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Đọc collection từ TẤT CẢ tenants (cho admin aggregate view).
 * Mỗi item được gắn thêm __tenantId để biết thuộc user nào.
 */
export function readAllTenantsCollection<T>(collection: string): (T & { __tenantId: string })[] {
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
export function getAllTenantIds(): string[] {
  if (!fs.existsSync(TENANTS_DIR)) return [];
  return fs.readdirSync(TENANTS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}
