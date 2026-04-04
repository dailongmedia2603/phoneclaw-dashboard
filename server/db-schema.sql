-- ============================================================
-- PhoneAgent Dashboard — PostgreSQL Schema
-- Migrated from JSON file-based storage
-- ============================================================
-- Run: psql -U phoneagent -d phoneagent -f server/db-schema.sql
-- ============================================================

BEGIN;

-- ============================================================
-- 1. PACKAGES (no FK dependencies — create first)
-- ============================================================

CREATE TABLE IF NOT EXISTS packages (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    max_devices INTEGER NOT NULL DEFAULT 1,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    password    TEXT NOT NULL,               -- bcrypt hash
    name        TEXT NOT NULL,
    phone       TEXT DEFAULT '',
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    package_id  TEXT REFERENCES packages(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================
-- 3. DEVICES
--    ProxyConfig flattened as columns (was nested JSON object)
-- ============================================================

CREATE TABLE IF NOT EXISTS devices (
    id                    TEXT PRIMARY KEY,
    owner_id              TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name                  TEXT NOT NULL,
    tailscale_ip          TEXT NOT NULL,
    vnc_port              INTEGER NOT NULL DEFAULT 5901,
    http_port             INTEGER NOT NULL DEFAULT 8080,
    ios_version           TEXT DEFAULT 'Unknown',
    model                 TEXT DEFAULT 'iPhone',
    status                TEXT NOT NULL DEFAULT 'connecting'
                            CHECK (status IN ('online', 'offline', 'running', 'connecting')),
    battery               INTEGER DEFAULT 0,
    uptime                INTEGER DEFAULT 0,
    "group"               TEXT DEFAULT '',
    vnc_password          TEXT DEFAULT '',
    account               TEXT DEFAULT '',
    current_script        TEXT,
    last_seen             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Proxy config (flattened from ProxyConfig interface)
    proxy_ip              TEXT,
    proxy_port            INTEGER,
    proxy_username        TEXT,
    proxy_password        TEXT,
    proxy_enabled         BOOLEAN DEFAULT FALSE,
    proxy_mode            TEXT DEFAULT 'none'
                            CHECK (proxy_mode IN ('none', 'vn', 'us')),
    proxy_timezone        TEXT,
    proxy_locale          TEXT,
    proxy_latitude        DOUBLE PRECISION,
    proxy_longitude       DOUBLE PRECISION,
    -- Status fields
    proxy_status          TEXT CHECK (proxy_status IS NULL OR proxy_status IN ('running', 'stopped', 'error')),
    heartbeat_configured  BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_tailscale_ip ON devices(tailscale_ip);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices(status);

-- ============================================================
-- 4. DEVICE GROUPS
-- ============================================================

CREATE TABLE IF NOT EXISTS device_groups (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    color       TEXT DEFAULT '#6366f1'
);

CREATE INDEX IF NOT EXISTS idx_device_groups_owner ON device_groups(owner_id);

-- Many-to-many: devices <-> groups
-- Replaces DeviceGroup.deviceIds: string[] array
CREATE TABLE IF NOT EXISTS device_group_members (
    group_id    TEXT NOT NULL REFERENCES device_groups(id) ON DELETE CASCADE,
    device_id   TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, device_id)
);

CREATE INDEX IF NOT EXISTS idx_dgm_device ON device_group_members(device_id);

-- ============================================================
-- 5. SCRIPTS (user-owned)
--    steps and graphData stored as JSONB (nested tree structure)
-- ============================================================

CREATE TABLE IF NOT EXISTS scripts (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    channel     TEXT,                       -- 'tiktok_vn' | 'tiktok_us' | 'facebook'
    graph_data  JSONB,                      -- { nodes: [], edges: [] } for visual editor
    steps       JSONB NOT NULL DEFAULT '[]'::jsonb,  -- ScriptStep[] tree with nested children
    status      TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('active', 'idle', 'draft')),
    last_run    TIMESTAMPTZ,
    run_count   INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scripts_owner ON scripts(owner_id);

-- ============================================================
-- 6. SHARED SCRIPTS (admin-created, no owner, global access)
-- ============================================================

CREATE TABLE IF NOT EXISTS shared_scripts (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    channel     TEXT,
    graph_data  JSONB,
    steps       JSONB NOT NULL DEFAULT '[]'::jsonb,
    status      TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'idle', 'draft')),
    last_run    TIMESTAMPTZ,
    run_count   INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 7. SCHEDULES
-- ============================================================

CREATE TABLE IF NOT EXISTS schedules (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    script_id   TEXT NOT NULL,              -- May reference scripts or shared_scripts
    script_name TEXT DEFAULT '',
    target_type TEXT NOT NULL DEFAULT 'device'
                  CHECK (target_type IN ('device', 'group')),
    target_id   TEXT NOT NULL,
    target_name TEXT DEFAULT '',
    cron        TEXT NOT NULL,
    enabled     BOOLEAN DEFAULT TRUE,
    next_run    TIMESTAMPTZ,
    last_run    TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schedules_owner ON schedules(owner_id);
CREATE INDEX IF NOT EXISTS idx_schedules_enabled ON schedules(enabled) WHERE enabled = TRUE;

-- ============================================================
-- 8. EXECUTION HISTORY
--    steps stored as JSONB array (ExecutionStep[])
-- ============================================================

CREATE TABLE IF NOT EXISTS execution_history (
    id            TEXT PRIMARY KEY,
    owner_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
    schedule_id   TEXT DEFAULT '',
    schedule_name TEXT DEFAULT '',
    script_name   TEXT NOT NULL,
    target_name   TEXT DEFAULT '',
    started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at   TIMESTAMPTZ,
    status        TEXT NOT NULL DEFAULT 'running'
                    CHECK (status IN ('running', 'success', 'error')),
    error         TEXT,
    steps         JSONB NOT NULL DEFAULT '[]'::jsonb  -- ExecutionStep[] array
);

CREATE INDEX IF NOT EXISTS idx_exec_history_owner ON execution_history(owner_id);
CREATE INDEX IF NOT EXISTS idx_exec_history_started ON execution_history(owner_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_exec_history_status ON execution_history(status) WHERE status = 'running';

-- ============================================================
-- 9. ACTIVITY LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_logs (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    type        TEXT NOT NULL DEFAULT 'system'
                  CHECK (type IN ('device', 'script', 'schedule', 'system', 'user')),
    action      TEXT NOT NULL,
    details     TEXT DEFAULT '',
    device_id   TEXT,
    device_name TEXT,
    user_id     TEXT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_owner ON activity_logs(owner_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON activity_logs(owner_id, type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_ts ON activity_logs(owner_id, "timestamp" DESC);

-- ============================================================
-- 10. SCREENSHOTS
-- ============================================================

CREATE TABLE IF NOT EXISTS screenshots (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    device_id   TEXT NOT NULL,
    device_name TEXT DEFAULT '',
    url         TEXT NOT NULL,
    thumbnail   TEXT DEFAULT '',
    script_name TEXT,
    step        INTEGER,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screenshots_owner ON screenshots(owner_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_device ON screenshots(owner_id, device_id);
CREATE INDEX IF NOT EXISTS idx_screenshots_ts ON screenshots(owner_id, "timestamp" DESC);

-- ============================================================
-- 11. VIDEOS
-- ============================================================

CREATE TABLE IF NOT EXISTS videos (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    filename    TEXT NOT NULL,
    r2_key      TEXT NOT NULL,
    url         TEXT NOT NULL,
    size        BIGINT DEFAULT 0,
    mime_type   TEXT DEFAULT 'video/mp4',
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_videos_owner ON videos(owner_id);
CREATE INDEX IF NOT EXISTS idx_videos_uploaded ON videos(owner_id, uploaded_at DESC);

-- ============================================================
-- 12. CUSTOM NODES
-- ============================================================

CREATE TABLE IF NOT EXISTS custom_nodes (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_nodes_owner ON custom_nodes(owner_id);

-- ============================================================
-- 13. NOTIFICATIONS
--     user_id IS NULL → system notification (visible to all)
--     user_id = 'xxx' → user-specific notification
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT PRIMARY KEY,
    user_id     TEXT REFERENCES users(id) ON DELETE CASCADE,  -- NULL = system
    type        TEXT NOT NULL DEFAULT 'info'
                  CHECK (type IN ('info', 'warning', 'error', 'success')),
    title       TEXT NOT NULL,
    message     TEXT NOT NULL,
    "read"      BOOLEAN DEFAULT FALSE,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_ts ON notifications(user_id, "timestamp" DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_system ON notifications("timestamp" DESC)
    WHERE user_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id)
    WHERE "read" = FALSE;

-- ============================================================
-- 14. APP SETTINGS (Singleton — single row, id always = 1)
--     Stored as JSONB for schema flexibility
-- ============================================================

CREATE TABLE IF NOT EXISTS app_settings (
    id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- Force single row
    data        JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- Insert default settings (matches DEFAULT_SETTINGS in settings.ts)
INSERT INTO app_settings (id, data)
VALUES (1, '{
    "vncDefaults": {
        "port": 5901,
        "httpPort": 8080,
        "password": "",
        "scale": 0.75,
        "fps": 30,
        "clipboardEnabled": true
    },
    "notifications": {
        "alertOnDeviceOffline": true,
        "alertOnScriptError": true,
        "alertOnScriptComplete": false
    },
    "theme": "light",
    "language": "vi",
    "logRetentionDays": 30,
    "screenshotRetentionDays": 7
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 15. API TOKENS
--     Mỗi user có thể có nhiều API token cho external integrations.
--     Token lưu dạng SHA-256 hash (không plaintext).
-- ============================================================

CREATE TABLE IF NOT EXISTS api_tokens (
    id              TEXT PRIMARY KEY,
    user_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL DEFAULT 'Default Token',
    token_hash      TEXT NOT NULL UNIQUE,     -- SHA-256 hash of full token
    token_prefix    TEXT NOT NULL,            -- First 20 chars for display: "pa_live_xxxxxxxxxxxx"
    token_encrypted TEXT,                    -- AES-256-GCM encrypted full token (for user viewing)
    last_used_at    TIMESTAMPTZ,
    last_used_ip    TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at      TIMESTAMPTZ              -- NULL = active, non-NULL = revoked
);

CREATE INDEX IF NOT EXISTS idx_api_tokens_user ON api_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tokens_hash ON api_tokens(token_hash) WHERE revoked_at IS NULL;

-- ============================================================
-- 16. API AUDIT LOGS
--     Logs mỗi API call từ external integration.
-- ============================================================

CREATE TABLE IF NOT EXISTS api_audit_logs (
    id              TEXT PRIMARY KEY,
    token_id        TEXT REFERENCES api_tokens(id) ON DELETE SET NULL,
    user_id         TEXT REFERENCES users(id) ON DELETE CASCADE,
    method          TEXT NOT NULL,            -- GET, POST, PUT, DELETE
    path            TEXT NOT NULL,            -- /api/v1/external/devices
    status_code     INTEGER,
    ip              TEXT,
    user_agent      TEXT,
    response_time   INTEGER,                 -- milliseconds
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON api_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON api_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_token ON api_audit_logs(token_id);

COMMIT;
