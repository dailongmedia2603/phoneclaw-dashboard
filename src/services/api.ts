import type {
  Device, DeviceGroup, Script, Schedule, ScheduleHistory,
  ActivityLog, ScreenshotLog, DashboardStats, Notification,
  AppSettings, VpsStatus, VncProxy, ApiResponse, Video, AppUser, Package,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '';

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    return await res.json();
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

function get<T>(path: string) {
  return request<T>(path);
}

function post<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined });
}

function put<T>(path: string, body?: unknown) {
  return request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined });
}

function del<T>(path: string) {
  return request<T>(path, { method: 'DELETE' });
}

// ============================================================
// Dashboard
// ============================================================
export const dashboard = {
  getStats: () => get<DashboardStats>('/api/dashboard/stats'),
  getNotifications: (limit = 20) => get<Notification[]>(`/api/dashboard/notifications?limit=${limit}`),
  markNotificationRead: (id: string) => put<void>(`/api/dashboard/notifications/${id}/read`),
};

// ============================================================
// Devices
// ============================================================
export const devices = {
  getAll: () => get<Device[]>('/api/devices'),
  getOne: (id: string) => get<Device>(`/api/devices/${id}`),
  create: (data: Partial<Device>) => post<Device>('/api/devices', data),
  update: (id: string, data: Partial<Device>) => put<Device>(`/api/devices/${id}`, data),
  remove: (id: string) => del<void>(`/api/devices/${id}`),

  // Groups
  getGroups: () => get<DeviceGroup[]>('/api/devices/groups/all'),
  createGroup: (name: string, color: string) => post<DeviceGroup>('/api/devices/groups', { name, color }),
  updateGroup: (id: string, data: Partial<DeviceGroup>) => put<DeviceGroup>(`/api/devices/groups/${id}`, data),
  removeGroup: (id: string) => del<void>(`/api/devices/groups/${id}`),
};

// ============================================================
// Control (Device HTTP API Proxy)
// ============================================================
export const control = {
  tap: (deviceId: string, x: number, y: number) =>
    post(`/api/control/${deviceId}/tap`, { x, y }),
  swipe: (deviceId: string, fromX: number, fromY: number, toX: number, toY: number, duration = 0.3) =>
    post(`/api/control/${deviceId}/swipe`, { fromX, fromY, toX, toY, duration }),
  type: (deviceId: string, text: string) =>
    post(`/api/control/${deviceId}/type`, { text }),
  key: (deviceId: string, key: string) =>
    post(`/api/control/${deviceId}/key`, { key }),
  launch: (deviceId: string, bundleId: string) =>
    post(`/api/control/${deviceId}/launch`, { bundleId }),
  screenshot: (deviceId: string) =>
    get<string>(`/api/control/${deviceId}/screenshot?t=${Date.now()}`),
  /** Live screenshot: triggers VNC connection to get fresh screen capture */
  screenshotLive: (deviceId: string) =>
    get<string>(`/api/control/${deviceId}/screenshot?live=true&t=${Date.now()}`),
  getClipboard: (deviceId: string) =>
    get<string>(`/api/control/${deviceId}/clipboard`),
  setClipboard: (deviceId: string, text: string) =>
    post(`/api/control/${deviceId}/clipboard`, { text }),
  getStatus: (deviceId: string) =>
    get(`/api/control/${deviceId}/status`),
};

// ============================================================
// Scripts
// ============================================================
export const scripts = {
  getAll: () => get<Script[]>('/api/scripts'),
  getOne: (id: string) => get<Script>(`/api/scripts/${id}`),
  create: (data: Partial<Script>) => post<Script>('/api/scripts', data),
  update: (id: string, data: Partial<Script>) => put<Script>(`/api/scripts/${id}`, data),
  remove: (id: string) => del<void>(`/api/scripts/${id}`),
  run: (scriptId: string, deviceId: string) => post<{ executionId: string; status: string }>(`/api/scripts/${scriptId}/run`, { deviceId }),
  stop: (scriptId: string, executionId: string) => post(`/api/scripts/${scriptId}/stop`, { executionId }),
  getHistory: () => get<ScheduleHistory[]>('/api/scripts/history/all'),
  getLatestExecution: () => get<ScheduleHistory>('/api/scripts/executions/latest'),
};

// ============================================================
// Schedules
// ============================================================
export const schedules = {
  getAll: () => get<Schedule[]>('/api/schedules'),
  getOne: (id: string) => get<Schedule>(`/api/schedules/${id}`),
  create: (data: Partial<Schedule>) => post<Schedule>('/api/schedules', data),
  update: (id: string, data: Partial<Schedule>) => put<Schedule>(`/api/schedules/${id}`, data),
  remove: (id: string) => del<void>(`/api/schedules/${id}`),
  toggle: (id: string) => put<Schedule>(`/api/schedules/${id}/toggle`),
};

// ============================================================
// Logs
// ============================================================
export const logs = {
  getActivity: (params?: { type?: string; deviceId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.type) qs.set('type', params.type);
    if (params?.deviceId) qs.set('deviceId', params.deviceId);
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<ActivityLog[]>(`/api/logs/activity?${qs}`);
  },
  getScreenshots: (params?: { deviceId?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.deviceId) qs.set('deviceId', params.deviceId);
    if (params?.limit) qs.set('limit', String(params.limit));
    return get<ScreenshotLog[]>(`/api/logs/screenshots?${qs}`);
  },
  getExecutions: () => get<ScheduleHistory[]>('/api/logs/executions'),
  cleanup: (days: number) => post('/api/logs/cleanup', { days }),
  cleanupAll: () => post('/api/logs/cleanup-all'),
};

// ============================================================
// Settings
// ============================================================
export const settings = {
  get: () => get<AppSettings>('/api/settings'),
  update: (data: Partial<AppSettings>) => put<AppSettings>('/api/settings', data),
  getVpsStatus: () => get<VpsStatus>('/api/settings/vps-status'),
  getVncProxies: () => get<VncProxy[]>('/api/settings/vnc-proxies'),
  startVncProxy: (deviceId: string) => post<VncProxy>('/api/settings/vnc-proxy/start', { deviceId }),
  stopVncProxy: (deviceId: string) => post('/api/settings/vnc-proxy/stop', { deviceId }),
  testR2: (config: { accountId: string; accessKeyId: string; secretAccessKey: string; bucketName: string }) =>
    post('/api/settings/test-r2', config),
};

// ============================================================
// Videos
// ============================================================
export const videos = {
  getAll: () => get<Video[]>('/api/videos'),
  upload: async (file: File, name?: string): Promise<ApiResponse<Video>> => {
    const formData = new FormData();
    formData.append('video', file);
    if (name) formData.append('name', name);
    try {
      const res = await fetch(`${API_BASE}/api/videos/upload`, {
        method: 'POST',
        body: formData,
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Upload failed' };
    }
  },
  remove: (id: string) => del<void>(`/api/videos/${id}`),
  sendToDevice: (videoId: string, deviceId: string) =>
    post(`/api/videos/${videoId}/send-to-device`, { deviceId }),
};

// ============================================================
// Proxy Management
// ============================================================
export const proxy = {
  getStatus: (deviceId: string) =>
    get(`/api/proxy/${deviceId}/status`),
  setConfig: (deviceId: string, config: { ip: string; port: number; username: string; password: string; mode: string }) =>
    post(`/api/proxy/${deviceId}/config`, config),
  start: (deviceId: string) =>
    post(`/api/proxy/${deviceId}/start`),
  stop: (deviceId: string) =>
    post(`/api/proxy/${deviceId}/stop`),
  setSpoof: (deviceId: string, spoof: { mode: string; timezone?: string; locale?: string; latitude?: number; longitude?: number }) =>
    post(`/api/proxy/${deviceId}/spoof`, spoof),
  batchConfig: (deviceIds: string[], config: { ip: string; port: number; username: string; password: string; mode: string }) =>
    post('/api/proxy/batch/config', { deviceIds, ...config }),
  batchStart: (deviceIds: string[]) =>
    post('/api/proxy/batch/start', { deviceIds }),
  batchStop: (deviceIds: string[]) =>
    post('/api/proxy/batch/stop', { deviceIds }),
  geolocate: (ip: string) =>
    get<{ country: string; regionName: string; city: string; lat: number; lon: number; timezone: string }>(`/api/proxy/geolocate/${ip}`),
};

// ============================================================
// Packages
// ============================================================
export const packages = {
  getAll: () => get<Package[]>('/api/packages'),
  create: (data: { name: string; maxDevices: number }) => post<Package>('/api/packages', data),
  update: (id: string, data: Partial<Package>) => put<Package>(`/api/packages/${id}`, data),
  remove: (id: string) => del<void>(`/api/packages/${id}`),
  requestUpgrade: () => post<void>('/api/packages/upgrade-request'),
};

// ============================================================
// Users (Admin Only)
// ============================================================
export const users = {
  getAll: () => get<AppUser[]>('/api/auth/users'),
  create: (data: { name: string; email: string; password: string; phone?: string; role: string; packageId?: string }) =>
    post<AppUser>('/api/auth/users', data),
  update: (id: string, data: Partial<{ name: string; email: string; phone: string; role: string; password: string; packageId: string }>) =>
    put<AppUser>(`/api/auth/users/${id}`, data),
  remove: (id: string) => del<void>(`/api/auth/users/${id}`),
};

// ============================================================
// Shared Scripts (Kho kịch bản)
// ============================================================
export const sharedScripts = {
  getAll: () => get<Script[]>('/api/shared-scripts'),
  getOne: (id: string) => get<Script>(`/api/shared-scripts/${id}`),
  create: (data: Partial<Script>) => post<Script>('/api/shared-scripts', data),
  update: (id: string, data: Partial<Script>) => put<Script>(`/api/shared-scripts/${id}`, data),
  remove: (id: string) => del<void>(`/api/shared-scripts/${id}`),
  run: (scriptId: string, deviceId: string) =>
    post<{ executionId: string }>(`/api/shared-scripts/${scriptId}/run`, { deviceId }),
};

// ============================================================
// Custom Nodes
// ============================================================
export const customNodes = {
  getAll: () => get<{ id: string; name: string; createdAt: string }[]>('/api/custom-nodes'),
  create: (name: string) => post<{ id: string; name: string }>('/api/custom-nodes', { name }),
  update: (id: string, name: string) => put<{ id: string; name: string }>(`/api/custom-nodes/${id}`, { name }),
  remove: (id: string) => del<void>(`/api/custom-nodes/${id}`),
};
