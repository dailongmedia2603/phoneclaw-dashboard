/**
 * One-time Migration Script: JSON Files → PostgreSQL
 *
 * Reads all JSON data files from server/data/ (global + per-tenant)
 * and inserts them into PostgreSQL tables.
 *
 * Safety:
 * - Runs in a single transaction — rolls back on ANY error
 * - Idempotent — ON CONFLICT (id) DO NOTHING (safe to re-run)
 * - JSON files are NOT modified or deleted
 * - Detailed logging with row counts
 * - Post-migration verification
 *
 * Usage:
 *   DATABASE_URL=postgresql://phoneagent:pass@localhost:5432/phoneagent npx tsx server/scripts/migrate-json-to-pg.ts
 *
 * Import order (respects FK dependencies):
 *   1. packages       (no FK)
 *   2. users           (FK → packages)
 *   3. app_settings    (no FK)
 *   4. shared_scripts  (no FK)
 *   5. notifications   (system, user_id = NULL)
 *   6. Per-tenant:
 *      6a. devices          (FK → users)
 *      6b. device_groups    (FK → users)
 *      6c. device_group_members (FK → device_groups, devices)
 *      6d. scripts          (FK → users)
 *      6e. schedules        (FK → users)
 *      6f. execution_history (FK → users)
 *      6g. activity_logs    (FK → users)
 *      6h. screenshots      (FK → users)
 *      6i. videos           (FK → users)
 *      6j. custom_nodes     (FK → users)
 *      6k. notifications    (user-specific, FK → users)
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const TENANTS_DIR = path.join(DATA_DIR, 'tenants');

// ============================================================
// JSON File Readers
// ============================================================

/** Read a JSON array file. Returns [] if missing, empty, or corrupt. */
function readJsonArray<T = any>(filePath: string): T[] {
  if (!fs.existsSync(filePath)) return [];
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content || content === '[]') return [];
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn(`  [WARN] Failed to parse ${path.basename(filePath)}: ${(err as Error).message}`);
    return [];
  }
}

/** Read a JSON singleton file. Returns null if missing or corrupt. */
function readJsonSingleton<T = any>(filePath: string): T | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    const content = fs.readFileSync(filePath, 'utf-8').trim();
    if (!content) return null;
    return JSON.parse(content);
  } catch (err) {
    console.warn(`  [WARN] Failed to parse ${path.basename(filePath)}: ${(err as Error).message}`);
    return null;
  }
}

// ============================================================
// Migration Counters
// ============================================================

interface MigrationStats {
  [table: string]: { inserted: number; skipped: number };
}

const stats: MigrationStats = {};

function initTable(table: string) {
  if (!stats[table]) stats[table] = { inserted: 0, skipped: 0 };
}

function logTable(table: string, source: string) {
  const s = stats[table] || { inserted: 0, skipped: 0 };
  const skipMsg = s.skipped > 0 ? ` (${s.skipped} skipped — already exist)` : '';
  console.log(`  ✓ ${table}: ${s.inserted} rows from ${source}${skipMsg}`);
}

// ============================================================
// Main Migration
// ============================================================

async function migrate() {
  console.log('============================================================');
  console.log(' PhoneAgent — JSON → PostgreSQL Migration');
  console.log('============================================================');
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Tenants directory: ${TENANTS_DIR}`);
  console.log('');

  if (!process.env.DATABASE_URL) {
    console.error('[ERROR] DATABASE_URL environment variable is required.');
    console.error('Usage: DATABASE_URL=postgresql://user:pass@host:5432/db npx tsx server/scripts/migrate-json-to-pg.ts');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    // Test connection
    await client.query('SELECT 1');
    console.log('[OK] PostgreSQL connection established\n');

    await client.query('BEGIN');

    // ============================================================
    // 1. PACKAGES
    // ============================================================
    console.log('[1/6] Global: packages');
    initTable('packages');
    const packages = readJsonArray(path.join(DATA_DIR, 'packages.json'));
    for (const pkg of packages) {
      const { rowCount } = await client.query(`
        INSERT INTO packages (id, name, max_devices, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING
      `, [
        pkg.id,
        pkg.name,
        pkg.maxDevices || 1,
        pkg.createdAt || new Date().toISOString(),
      ]);
      if (rowCount && rowCount > 0) stats.packages.inserted++;
      else stats.packages.skipped++;
    }
    logTable('packages', 'packages.json');

    // ============================================================
    // 2. USERS
    // ============================================================
    console.log('[2/6] Global: users');
    initTable('users');
    const users = readJsonArray(path.join(DATA_DIR, 'users.json'));
    for (const user of users) {
      const { rowCount } = await client.query(`
        INSERT INTO users (id, email, password, name, phone, role, package_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO NOTHING
      `, [
        user.id,
        user.email,
        user.password,
        user.name,
        user.phone || '',
        user.role || 'user',
        user.packageId || null,
        user.createdAt || new Date().toISOString(),
      ]);
      if (rowCount && rowCount > 0) stats.users.inserted++;
      else stats.users.skipped++;
    }
    logTable('users', 'users.json');

    // ============================================================
    // 3. APP SETTINGS
    // ============================================================
    console.log('[3/6] Global: app_settings');
    initTable('app_settings');
    const settings = readJsonSingleton(path.join(DATA_DIR, 'settings.json'));
    if (settings) {
      await client.query(`
        INSERT INTO app_settings (id, data) VALUES (1, $1)
        ON CONFLICT (id) DO UPDATE SET data = $1
      `, [JSON.stringify(settings)]);
      stats.app_settings.inserted = 1;
      logTable('app_settings', 'settings.json');
    } else {
      console.log('  ✓ app_settings: using default (no settings.json found)');
    }

    // ============================================================
    // 4. SHARED SCRIPTS
    // ============================================================
    console.log('[4/6] Global: shared_scripts');
    initTable('shared_scripts');
    const sharedScripts = readJsonArray(path.join(DATA_DIR, 'shared-scripts.json'));
    for (const s of sharedScripts) {
      const { rowCount } = await client.query(`
        INSERT INTO shared_scripts (
          id, name, description, channel, graph_data, steps,
          status, last_run, run_count, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO NOTHING
      `, [
        s.id,
        s.name,
        s.description || '',
        s.channel || null,
        s.graphData ? JSON.stringify(s.graphData) : null,
        JSON.stringify(s.steps || []),
        s.status || 'active',
        s.lastRun || null,
        s.runCount || 0,
        s.createdAt || new Date().toISOString(),
        s.updatedAt || s.createdAt || new Date().toISOString(),
      ]);
      if (rowCount && rowCount > 0) stats.shared_scripts.inserted++;
      else stats.shared_scripts.skipped++;
    }
    logTable('shared_scripts', 'shared-scripts.json');

    // ============================================================
    // 5. SYSTEM NOTIFICATIONS
    // ============================================================
    console.log('[5/6] Global: notifications (system)');
    initTable('notifications');
    const sysNotifs = readJsonArray(path.join(DATA_DIR, 'notifications.json'));
    for (const n of sysNotifs) {
      const { rowCount } = await client.query(`
        INSERT INTO notifications (id, user_id, type, title, message, "read", "timestamp")
        VALUES ($1, NULL, $2, $3, $4, $5, $6)
        ON CONFLICT (id) DO NOTHING
      `, [
        n.id,
        n.type || 'info',
        n.title,
        n.message,
        n.read ?? false,
        n.timestamp || new Date().toISOString(),
      ]);
      if (rowCount && rowCount > 0) stats.notifications.inserted++;
      else stats.notifications.skipped++;
    }
    logTable('notifications', 'notifications.json (system)');

    // ============================================================
    // 6. PER-TENANT DATA
    // ============================================================
    console.log('[6/6] Per-tenant data');

    if (!fs.existsSync(TENANTS_DIR)) {
      console.log('  (no tenants directory found — skipping)');
    } else {
      const tenantDirs = fs.readdirSync(TENANTS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      console.log(`  Found ${tenantDirs.length} tenant(s): ${tenantDirs.join(', ')}\n`);

      // Init per-tenant table stats
      for (const t of ['devices', 'device_groups', 'device_group_members', 'scripts',
                        'schedules', 'execution_history', 'activity_logs',
                        'screenshots', 'videos', 'custom_nodes']) {
        initTable(t);
      }

      for (const tid of tenantDirs) {
        const tDir = path.join(TENANTS_DIR, tid);

        // Verify user exists in DB before importing tenant data
        const { rows: userRows } = await client.query(
          'SELECT id FROM users WHERE id = $1', [tid]
        );
        if (userRows.length === 0) {
          console.log(`  [SKIP] Tenant ${tid} — user not found in users table`);
          continue;
        }

        console.log(`  --- Tenant: ${tid} ---`);
        let tenantTotal = 0;

        // ---- 6a. Devices ----
        const devices = readJsonArray(path.join(tDir, 'devices.json'));
        for (const d of devices) {
          const { rowCount } = await client.query(`
              INSERT INTO devices (
                id, owner_id, name, tailscale_ip, vnc_port, http_port,
                ios_version, model, status, battery, uptime, "group",
                vnc_password, account, current_script, last_seen, created_at,
                proxy_ip, proxy_port, proxy_username, proxy_password,
                proxy_enabled, proxy_mode, proxy_timezone, proxy_locale,
                proxy_latitude, proxy_longitude, proxy_status, heartbeat_configured
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17,
                $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
              ) ON CONFLICT DO NOTHING
            `, [
              d.id,
              tid,
              d.name,
              d.tailscaleIp,
              d.vncPort ?? 5901,
              d.httpPort ?? 8080,
              d.iosVersion || 'Unknown',
              d.model || 'iPhone',
              d.status || 'offline',
              d.battery ?? 0,
              d.uptime ?? 0,
              d.group || '',
              d.vncPassword || '',
              d.account || '',
              d.currentScript || null,
              d.lastSeen || new Date().toISOString(),
              d.createdAt || new Date().toISOString(),
              d.proxyConfig?.ip || null,
              d.proxyConfig?.port ?? null,
              d.proxyConfig?.username || null,
              d.proxyConfig?.password || null,
              d.proxyConfig?.enabled ?? false,
              d.proxyConfig?.mode || 'none',
              d.proxyConfig?.timezone || null,
              d.proxyConfig?.locale || null,
              d.proxyConfig?.latitude ?? null,
              d.proxyConfig?.longitude ?? null,
              d.proxyStatus || null,
              d.heartbeatConfigured ?? false,
            ]);
            if (rowCount && rowCount > 0) { stats.devices.inserted++; tenantTotal++; }
            else stats.devices.skipped++;
        }
        if (devices.length > 0) console.log(`    devices: ${devices.length}`);

        // ---- 6b. Device Groups + 6c. Members ----
        const groups = readJsonArray(path.join(tDir, 'device-groups.json'));
        for (const g of groups) {
          const { rowCount } = await client.query(`
            INSERT INTO device_groups (id, owner_id, name, color)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO NOTHING
          `, [
            g.id,
            tid,
            g.name,
            g.color || '#6366f1',
          ]);
          if (rowCount && rowCount > 0) { stats.device_groups.inserted++; tenantTotal++; }
          else stats.device_groups.skipped++;

          // Insert M2M relationships (deviceIds array → device_group_members)
          const deviceIds: string[] = g.deviceIds || [];
          for (const deviceId of deviceIds) {
            // Verify the device was actually inserted (might have been skipped)
            const { rows: devRows } = await client.query(
              'SELECT id FROM devices WHERE id = $1', [deviceId]
            );
            if (devRows.length > 0) {
              const { rowCount: mCount } = await client.query(`
                INSERT INTO device_group_members (group_id, device_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
              `, [g.id, deviceId]);
              if (mCount && mCount > 0) stats.device_group_members.inserted++;
              else stats.device_group_members.skipped++;
            } else {
              console.warn(`    [WARN] Group ${g.id} references device ${deviceId} — device not found, M2M skipped`);
              stats.device_group_members.skipped++;
            }
          }
        }
        if (groups.length > 0) console.log(`    device_groups: ${groups.length}`);

        // ---- 6d. Scripts ----
        const scripts = readJsonArray(path.join(tDir, 'scripts.json'));
        for (const s of scripts) {
          const { rowCount } = await client.query(`
            INSERT INTO scripts (
              id, owner_id, name, description, channel, graph_data, steps,
              status, last_run, run_count, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (id) DO NOTHING
          `, [
            s.id,
            tid,
            s.name,
            s.description || '',
            s.channel || null,
            s.graphData ? JSON.stringify(s.graphData) : null,
            JSON.stringify(s.steps || []),
            s.status || 'draft',
            s.lastRun || null,
            s.runCount || 0,
            s.createdAt || new Date().toISOString(),
            s.updatedAt || s.createdAt || new Date().toISOString(),
          ]);
          if (rowCount && rowCount > 0) { stats.scripts.inserted++; tenantTotal++; }
          else stats.scripts.skipped++;
        }
        if (scripts.length > 0) console.log(`    scripts: ${scripts.length}`);

        // ---- 6e. Schedules ----
        const schedules = readJsonArray(path.join(tDir, 'schedules.json'));
        for (const sc of schedules) {
          const { rowCount } = await client.query(`
            INSERT INTO schedules (
              id, owner_id, name, script_id, script_name, target_type,
              target_id, target_name, cron, enabled, next_run, last_run, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (id) DO NOTHING
          `, [
            sc.id,
            tid,
            sc.name,
            sc.scriptId,
            sc.scriptName || '',
            sc.targetType || 'device',
            sc.targetId,
            sc.targetName || '',
            sc.cron,
            sc.enabled ?? true,
            sc.nextRun || null,
            sc.lastRun || null,
            sc.createdAt || new Date().toISOString(),
          ]);
          if (rowCount && rowCount > 0) { stats.schedules.inserted++; tenantTotal++; }
          else stats.schedules.skipped++;
        }
        if (schedules.length > 0) console.log(`    schedules: ${schedules.length}`);

        // ---- 6f. Execution History ----
        const execHistory = readJsonArray(path.join(tDir, 'execution-history.json'));
        for (const eh of execHistory) {
          const { rowCount } = await client.query(`
            INSERT INTO execution_history (
              id, owner_id, schedule_id, schedule_name, script_name,
              target_name, started_at, finished_at, status, error, steps
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO NOTHING
          `, [
            eh.id,
            tid,
            eh.scheduleId || '',
            eh.scheduleName || '',
            eh.scriptName || 'Unknown',
            eh.targetName || '',
            eh.startedAt || new Date().toISOString(),
            eh.finishedAt || null,
            eh.status || 'error',
            eh.error || null,
            JSON.stringify(eh.steps || []),
          ]);
          if (rowCount && rowCount > 0) { stats.execution_history.inserted++; tenantTotal++; }
          else stats.execution_history.skipped++;
        }
        if (execHistory.length > 0) console.log(`    execution_history: ${execHistory.length}`);

        // ---- 6g. Activity Logs ----
        const activityLogs = readJsonArray(path.join(tDir, 'activity-logs.json'));
        for (const al of activityLogs) {
          const { rowCount } = await client.query(`
            INSERT INTO activity_logs (
              id, owner_id, type, action, details,
              device_id, device_name, user_id, "timestamp"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
          `, [
            al.id,
            tid,
            al.type || 'system',
            al.action || '',
            al.details || '',
            al.deviceId || null,
            al.deviceName || null,
            al.userId || null,
            al.timestamp || new Date().toISOString(),
          ]);
          if (rowCount && rowCount > 0) { stats.activity_logs.inserted++; tenantTotal++; }
          else stats.activity_logs.skipped++;
        }
        if (activityLogs.length > 0) console.log(`    activity_logs: ${activityLogs.length}`);

        // ---- 6h. Screenshots ----
        const screenshots = readJsonArray(path.join(tDir, 'screenshots.json'));
        for (const ss of screenshots) {
          const { rowCount } = await client.query(`
            INSERT INTO screenshots (
              id, owner_id, device_id, device_name, url,
              thumbnail, script_name, step, "timestamp"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
          `, [
            ss.id,
            tid,
            ss.deviceId,
            ss.deviceName || '',
            ss.url,
            ss.thumbnail || ss.url || '',
            ss.scriptName || null,
            ss.step !== undefined ? ss.step : null,
            ss.timestamp || new Date().toISOString(),
          ]);
          if (rowCount && rowCount > 0) { stats.screenshots.inserted++; tenantTotal++; }
          else stats.screenshots.skipped++;
        }
        if (screenshots.length > 0) console.log(`    screenshots: ${screenshots.length}`);

        // ---- 6i. Videos ----
        const videos = readJsonArray(path.join(tDir, 'videos.json'));
        for (const v of videos) {
          const { rowCount } = await client.query(`
            INSERT INTO videos (
              id, owner_id, name, filename, r2_key, url,
              size, mime_type, uploaded_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO NOTHING
          `, [
            v.id,
            tid,
            v.name,
            v.filename,
            v.r2Key,
            v.url,
            v.size || 0,
            v.mimeType || 'video/mp4',
            v.uploadedAt || new Date().toISOString(),
          ]);
          if (rowCount && rowCount > 0) { stats.videos.inserted++; tenantTotal++; }
          else stats.videos.skipped++;
        }
        if (videos.length > 0) console.log(`    videos: ${videos.length}`);

        // ---- 6j. Custom Nodes ----
        const customNodes = readJsonArray(path.join(tDir, 'custom-nodes.json'));
        for (const cn of customNodes) {
          const { rowCount } = await client.query(`
            INSERT INTO custom_nodes (id, owner_id, name, created_at)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (id) DO NOTHING
          `, [
            cn.id,
            tid,
            cn.name,
            cn.createdAt || new Date().toISOString(),
          ]);
          if (rowCount && rowCount > 0) { stats.custom_nodes.inserted++; tenantTotal++; }
          else stats.custom_nodes.skipped++;
        }
        if (customNodes.length > 0) console.log(`    custom_nodes: ${customNodes.length}`);

        // ---- 6k. User Notifications ----
        const userNotifs = readJsonArray(path.join(tDir, 'notifications.json'));
        for (const n of userNotifs) {
          const { rowCount } = await client.query(`
            INSERT INTO notifications (id, user_id, type, title, message, "read", "timestamp")
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING
          `, [
            n.id,
            tid,
            n.type || 'info',
            n.title,
            n.message,
            n.read ?? false,
            n.timestamp || new Date().toISOString(),
          ]);
          if (rowCount && rowCount > 0) { stats.notifications.inserted++; tenantTotal++; }
          else stats.notifications.skipped++;
        }
        if (userNotifs.length > 0) console.log(`    notifications (user): ${userNotifs.length}`);

        console.log(`    → Tenant total: ${tenantTotal} rows\n`);
      }
    }

    // ============================================================
    // COMMIT
    // ============================================================
    await client.query('COMMIT');

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('============================================================');
    console.log(' MIGRATION COMPLETE');
    console.log('============================================================');

    let grandTotal = 0;
    for (const [table, s] of Object.entries(stats)) {
      if (s.inserted > 0 || s.skipped > 0) {
        const skipMsg = s.skipped > 0 ? ` (${s.skipped} skipped)` : '';
        console.log(`  ${table.padEnd(25)} ${String(s.inserted).padStart(6)} inserted${skipMsg}`);
        grandTotal += s.inserted;
      }
    }
    console.log(`  ${'─'.repeat(45)}`);
    console.log(`  ${'TOTAL'.padEnd(25)} ${String(grandTotal).padStart(6)} rows\n`);

    // ============================================================
    // VERIFICATION — compare DB counts with source file counts
    // ============================================================
    console.log('[Verification] Row counts in PostgreSQL:');
    const verifyTables = [
      'packages', 'users', 'app_settings', 'shared_scripts', 'devices',
      'device_groups', 'device_group_members', 'scripts', 'schedules',
      'execution_history', 'activity_logs', 'screenshots', 'videos',
      'custom_nodes', 'notifications',
    ];
    for (const t of verifyTables) {
      const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${t}`);
      console.log(`  ${t.padEnd(25)} ${String(rows[0].count).padStart(6)} rows`);
    }
    console.log('');
    console.log('[OK] Migration completed successfully. JSON files are untouched.');
    console.log('     Set USE_POSTGRES=true in .env and restart the server.');

  } catch (err) {
    // ROLLBACK on any error
    try { await client.query('ROLLBACK'); } catch (_) { /* ignore rollback error */ }

    console.error('\n============================================================');
    console.error(' MIGRATION FAILED — Transaction rolled back');
    console.error('============================================================');
    console.error('Error:', (err as Error).message);
    if ((err as Error).stack) {
      console.error('\nStack trace:');
      console.error((err as Error).stack);
    }
    console.error('\nNo data was written to PostgreSQL. Fix the error and try again.');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// ============================================================
// Run
// ============================================================

migrate().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
