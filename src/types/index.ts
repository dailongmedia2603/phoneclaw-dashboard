// ============================================================
// PhoneClaw VNC Dashboard - Shared Types
// ============================================================

// --- Proxy ---
export type ProxyMode = 'none' | 'vn' | 'us';

export interface ProxyConfig {
  ip: string;
  port: number;
  username: string;
  password: string;
  enabled: boolean;
  mode: ProxyMode;         // "none" = no proxy, "vn" = VN proxy (no spoof), "us" = US proxy (full spoof)
  timezone?: string;       // e.g., "America/New_York" (only used when mode=us)
  locale?: string;         // e.g., "en_US" (only used when mode=us)
  latitude?: number;       // GPS spoof (only used when mode=us)
  longitude?: number;      // GPS spoof (only used when mode=us)
}

// --- Device ---
export interface AppUser {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'user';
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  tailscaleIp: string;
  vncPort: number;
  httpPort: number;
  iosVersion: string;
  model: string;
  status: 'online' | 'offline' | 'running' | 'connecting';
  battery: number;
  uptime: number; // seconds
  group: string;
  vncPassword?: string;
  account?: string;
  currentScript?: string;
  lastSeen: string; // ISO date
  createdAt: string;
  proxyConfig?: ProxyConfig;
  proxyStatus?: 'running' | 'stopped' | 'error';
}

export interface DeviceGroup {
  id: string;
  name: string;
  color: string;
  deviceIds: string[];
}

// --- Script ---
export type ScriptStepType =
  | 'tap' | 'double_tap' | 'tap_image' | 'swipe' | 'type' | 'key' | 'launch' | 'screenshot' | 'clipboard' | 'send_file' | 'select_video' | 'clear_photos'
  | 'wait' | 'wait_random'
  | 'repeat' | 'repeat_forever' | 'if_screen_match' | 'if_elapsed'
  | 'set' | 'random_text' | 'random_int' | 'counter';

export interface ScriptStep {
  id: string;
  type: ScriptStepType;
  params: Record<string, unknown>;
  children?: ScriptStep[]; // for repeat, if blocks
}

export interface Script {
  id: string;
  name: string;
  description: string;
  channel?: string; // 'tiktok_vn' | 'tiktok_us' | 'facebook'
  graphData?: { nodes: unknown[]; edges: unknown[] };
  steps: ScriptStep[];
  status: 'active' | 'idle' | 'draft';
  lastRun?: string;
  runCount: number;
  createdAt: string;
  updatedAt: string;
}

// --- Schedule ---
export interface Schedule {
  id: string;
  name: string;
  scriptId: string;
  scriptName: string;
  targetType: 'device' | 'group';
  targetId: string;
  targetName: string;
  cron: string;
  enabled: boolean;
  nextRun?: string;
  lastRun?: string;
  createdAt: string;
}

export interface ScheduleHistory {
  id: string;
  scheduleId: string;
  scheduleName: string;
  scriptName: string;
  targetName: string;
  startedAt: string;
  finishedAt?: string;
  status: 'running' | 'success' | 'error';
  error?: string;
  steps: ExecutionStep[];
}

export interface ExecutionStep {
  index: number;
  type: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error';
  startedAt?: string;
  finishedAt?: string;
  screenshotUrl?: string;
  error?: string;
}

// --- Logs ---
export interface ActivityLog {
  id: string;
  type: 'device' | 'script' | 'schedule' | 'system' | 'user';
  action: string;
  details: string;
  deviceId?: string;
  deviceName?: string;
  userId?: string;
  timestamp: string;
}

export interface ScreenshotLog {
  id: string;
  deviceId: string;
  deviceName: string;
  url: string;
  thumbnail: string;
  scriptName?: string;
  step?: number;
  timestamp: string;
}

// --- Settings ---
export interface VpsStatus {
  cpu: number;
  ram: { used: number; total: number };
  disk: { used: number; total: number };
  bandwidth: { up: number; down: number };
  uptime: number;
  tailscaleStatus: 'connected' | 'disconnected';
}

export interface VncDefaults {
  port: number;
  httpPort: number;
  password: string;
  scale: number;
  fps: number;
  clipboardEnabled: boolean;
}

export interface NotificationConfig {
  telegramBotToken?: string;
  telegramChatId?: string;
  webhookUrl?: string;
  alertOnDeviceOffline: boolean;
  alertOnScriptError: boolean;
  alertOnScriptComplete: boolean;
}

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

export interface Video {
  id: string;
  name: string;
  filename: string;
  r2Key: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface AppSettings {
  vncDefaults: VncDefaults;
  notifications: NotificationConfig;
  r2?: R2Config;
  theme: 'dark' | 'light';
  language: 'vi' | 'en';
  logRetentionDays: number;
  screenshotRetentionDays: number;
}

// --- Notification ---
export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
}

// --- Dashboard Stats ---
export interface DashboardStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  runningScripts: number;
  onlineHistory: { time: string; count: number }[];
  scriptRunHistory: { date: string; count: number }[];
}

// --- API Response ---
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// --- VNC Proxy ---
export interface VncProxy {
  deviceId: string;
  deviceName: string;
  wsPort: number;
  targetIp: string;
  targetVncPort: number;
  status: 'running' | 'stopped';
}

// --- WebSocket Events ---
export type WsEventType =
  | 'device:status'
  | 'device:screenshot'
  | 'script:progress'
  | 'script:complete'
  | 'notification'
  | 'vps:stats';

export interface WsMessage {
  type: WsEventType;
  payload: unknown;
  timestamp: string;
}
