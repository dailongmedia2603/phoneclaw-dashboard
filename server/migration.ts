/**
 * Migration: chuyển data từ shared files sang per-user tenant directories.
 *
 * Chạy 1 lần khi server start. Kiểm tra:
 * - Nếu server/data/devices.json TỒN TẠI VÀ CÓ DATA → chưa migrate → thực hiện
 * - Nếu không → đã migrate hoặc cài mới → bỏ qua
 *
 * An toàn:
 * - File cũ được backup thành .bak trước khi xoá
 * - Data không có ownerId → gán cho admin đầu tiên
 * - Nếu không tìm thấy admin → bỏ qua (chưa có user)
 *
 * NOTE: Khi USE_POSTGRES=true, migration này KHÔNG chạy (PG dùng migrate-json-to-pg.ts)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { readCollection, readUserCollection, writeUserCollection, ensureTenantDir, isPostgresMode } from './store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Collections cần migrate sang tenant structure
const TENANT_COLLECTIONS = [
  'devices',
  'device-groups',
  'scripts',
  'schedules',
  'execution-history',
  'activity-logs',
  'screenshots',
  'videos',
  'custom-nodes',
  'notifications',
];

interface MinimalUser {
  id: string;
  role: 'admin' | 'user';
}

interface OwnedItem {
  ownerId?: string;
  userId?: string;
  [key: string]: unknown;
}

export async function migrateToTenantStructure(): Promise<void> {
  // Skip khi dùng PostgreSQL — PG có migration script riêng
  if (isPostgresMode) {
    console.log('[Migration] Skipped — using PostgreSQL mode');
    return;
  }

  // Tìm admin đầu tiên — nếu chưa có user, bỏ qua
  const users = await readCollection<MinimalUser>('users');
  const admin = users.find(u => u.role === 'admin');
  if (!admin) {
    return; // Chưa có user nào, không cần migrate
  }

  // Kiểm tra: có collection nào cần migrate không?
  let needsMigration = false;
  for (const col of TENANT_COLLECTIONS) {
    const filePath = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(filePath)) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      if (content === '[]' || content === '') continue;

      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        needsMigration = true;
        break;
      }
    } catch {
      continue; // File corrupt, bỏ qua
    }
  }

  // Đảm bảo MỌI user đều có tenant dir (LUÔN chạy, bất kể có migration hay không)
  for (const user of users) {
    ensureTenantDir(user.id);
  }

  if (!needsMigration) {
    return; // Không có data cũ, hoặc đã migrate rồi
  }

  console.log('[Migration] Phát hiện data cũ — bắt đầu migrate sang tenant structure...');

  let totalMigrated = 0;

  for (const col of TENANT_COLLECTIONS) {
    const filePath = path.join(DATA_DIR, `${col}.json`);
    if (!fs.existsSync(filePath)) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf-8').trim();
      if (content === '[]' || content === '') continue;

      const data = JSON.parse(content) as OwnedItem[];
      if (!Array.isArray(data) || data.length === 0) continue;

      // Group data theo owner
      // ownerId hoặc userId (cho activity-logs) → nếu không có → gán admin
      const grouped: Record<string, OwnedItem[]> = {};

      for (const item of data) {
        const owner = item.ownerId || item.userId || admin.id;
        if (!grouped[owner]) grouped[owner] = [];
        grouped[owner].push(item);
      }

      // Ghi vào từng tenant directory
      for (const [userId, items] of Object.entries(grouped)) {
        // Merge với data có thể đã tồn tại trong tenant (phòng trường hợp migrate lại)
        await writeUserCollection(userId, col, items);
      }

      // Backup file cũ
      const backupPath = filePath + '.bak';
      fs.renameSync(filePath, backupPath);

      const userCount = Object.keys(grouped).length;
      console.log(`[Migration] ${col}: ${data.length} items → ${userCount} tenant(s)`);
      totalMigrated += data.length;
    } catch (err) {
      console.error(`[Migration] Lỗi migrate ${col}:`, err);
      // Không throw — tiếp tục migrate các collection khác
    }
  }

  if (totalMigrated > 0) {
    console.log(`[Migration] Hoàn tất — ${totalMigrated} items đã migrate. Files cũ backup thành .bak`);
  }

  // Đảm bảo MỌI user đều có tenant dir (kể cả user chưa có data)
  for (const user of users) {
    ensureTenantDir(user.id);
  }

  // Recovery: nếu có .bak files nhưng tenant trống → khôi phục
  for (const col of TENANT_COLLECTIONS) {
    const bakPath = path.join(DATA_DIR, `${col}.json.bak`);
    if (!fs.existsSync(bakPath)) continue;

    // Kiểm tra xem tenant admin đã có data chưa
    const adminData = await readUserCollection<OwnedItem>(admin.id, col);
    if (adminData.length > 0) continue; // Đã có data, bỏ qua

    // Tenant trống nhưng .bak có data → khôi phục vào admin tenant
    try {
      const bakContent = fs.readFileSync(bakPath, 'utf-8').trim();
      if (bakContent === '[]' || bakContent === '') continue;
      const bakData = JSON.parse(bakContent) as OwnedItem[];
      if (!Array.isArray(bakData) || bakData.length === 0) continue;

      await writeUserCollection(admin.id, col, bakData);
      console.log(`[Migration] Recovery: ${col} — ${bakData.length} items từ .bak → admin tenant`);
    } catch {
      // Bỏ qua file corrupt
    }
  }
}
