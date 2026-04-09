import { useState, useEffect } from 'react';
import {
  Server, MonitorPlay, Network, Users, Bell, Cloud,
  Cpu, HardDrive, Activity, CheckCircle2, AlertCircle, Shield, Key,
  Save, Smartphone, Loader2, Package, Eye, EyeOff,
  RefreshCw, Copy, CheckCircle, Mail
} from 'lucide-react';
import { settings as settingsApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { showToast } from './Toast';
import PackageSettings from './PackageSettings';
import type { AppSettings, VpsStatus, Device, ApiToken } from '../types';

// Admin-only tabs + tabs chung
const ADMIN_TABS = [
  { id: 'vps', label: 'Máy chủ (VPS)', icon: Server },
  { id: 'vnc', label: 'VNC Mặc định', icon: MonitorPlay },
  { id: 'tailscale', label: 'Tailscale', icon: Network },
  { id: 'packages', label: 'Gói phần mềm', icon: Package },
  { id: 'account', label: 'Profile', icon: Users },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'r2', label: 'Cloudflare R2', icon: Cloud },
  { id: 'gmail', label: 'Gmail OAuth', icon: Mail },
];

const USER_TABS = [
  { id: 'account', label: 'Profile', icon: Users },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
];

export default function Settings() {
  const { user: authUser } = useAuth();
  const isAdmin = authUser?.role === 'admin';
  const SETTINGS_TABS = isAdmin ? ADMIN_TABS : USER_TABS;
  const [activeTab, setActiveTab] = useState(isAdmin ? 'vps' : 'account');
  const [saving, setSaving] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // API Token state
  const [apiTokens, setApiTokens] = useState<ApiToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState<string | null>(null); // tokenId to regenerate

  const { data: vpsStatus } = useApi<VpsStatus>(() => settingsApi.getVpsStatus(), []);
  const { data: appSettings, refresh: refreshSettings } = useApi<AppSettings>(() => settingsApi.get(), []);
  const { data: deviceList } = useApi<Device[]>(() => devicesApi.getAll(), []);

  const vps = vpsStatus || { cpu: 0, ram: { used: 0, total: 0 }, disk: { used: 0, total: 0 }, bandwidth: { up: 0, down: 0 }, uptime: 0, tailscaleStatus: 'disconnected' as const };
  const cfg = appSettings || {
    vncDefaults: { port: 5901, httpPort: 8080, password: '', scale: 0.75, fps: 30, clipboardEnabled: true },
    notifications: { alertOnDeviceOffline: true, alertOnScriptError: true, alertOnScriptComplete: false },
    theme: 'light' as const,
    language: 'vi' as const,
    logRetentionDays: 30,
    screenshotRetentionDays: 7,
  };

  const ramPercent = vps.ram.total > 0 ? Math.round((vps.ram.used / vps.ram.total) * 100) : 0;
  const diskPercent = vps.disk.total > 0 ? Math.round((vps.disk.used / vps.disk.total) * 100) : 0;
  const uptimeStr = vps.uptime > 0
    ? `${Math.floor(vps.uptime / 86400)} ngày, ${Math.floor((vps.uptime % 86400) / 3600)} giờ`
    : 'N/A';

  // VNC form state
  const [vncForm, setVncForm] = useState({
    port: cfg.vncDefaults.port,
    password: cfg.vncDefaults.password,
    scale: cfg.vncDefaults.scale,
    fps: cfg.vncDefaults.fps,
  });

  // Notification form state
  const [notifForm, setNotifForm] = useState({
    alertOnDeviceOffline: cfg.notifications.alertOnDeviceOffline,
    alertOnScriptError: cfg.notifications.alertOnScriptError,
    telegramBotToken: cfg.notifications.telegramBotToken || '',
    telegramChatId: cfg.notifications.telegramChatId || '',
    webhookUrl: cfg.notifications.webhookUrl || '',
  });
  const [showBotToken, setShowBotToken] = useState(false);

  // Sync form state khi settings load xong từ API
  useEffect(() => {
    if (appSettings) {
      setVncForm({
        port: appSettings.vncDefaults.port,
        password: appSettings.vncDefaults.password,
        scale: appSettings.vncDefaults.scale,
        fps: appSettings.vncDefaults.fps,
      });
      setNotifForm({
        alertOnDeviceOffline: appSettings.notifications.alertOnDeviceOffline,
        alertOnScriptError: appSettings.notifications.alertOnScriptError,
        telegramBotToken: appSettings.notifications.telegramBotToken || '',
        telegramChatId: appSettings.notifications.telegramChatId || '',
        webhookUrl: appSettings.notifications.webhookUrl || '',
      });
    }
  }, [appSettings]);

  const handleSaveVnc = async () => {
    setSaving(true);
    const res = await settingsApi.update({
      vncDefaults: { ...cfg.vncDefaults, ...vncForm },
    });
    setSaving(false);
    if (res.success) {
      showToast('success', 'Đã lưu cấu hình VNC');
      refreshSettings();
    } else {
      showToast('error', res.error || 'Lưu cấu hình thất bại');
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    const res = await settingsApi.update({
      notifications: {
        ...cfg.notifications,
        alertOnDeviceOffline: notifForm.alertOnDeviceOffline,
        alertOnScriptError: notifForm.alertOnScriptError,
        telegramBotToken: notifForm.telegramBotToken,
        telegramChatId: notifForm.telegramChatId,
        webhookUrl: notifForm.webhookUrl,
      },
    });
    setSaving(false);
    if (res.success) {
      showToast('success', 'Đã lưu cấu hình thông báo');
      refreshSettings();
    } else {
      showToast('error', res.error || 'Lưu cấu hình thất bại');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      showToast('error', 'Vui lòng nhập đầy đủ mật khẩu');
      return;
    }
    if (newPassword.length < 6) {
      showToast('error', 'Mật khẩu mới phải ít nhất 6 ký tự');
      return;
    }
    setChangingPassword(true);
    const { auth: authApi } = await import('../services/api');
    const res = await authApi.changePassword(currentPassword, newPassword);
    setChangingPassword(false);
    if (res.success) {
      showToast('success', 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
    } else {
      showToast('error', res.error || 'Đổi mật khẩu thất bại');
    }
  };

  // --- API Token handlers ---
  const fetchTokens = async () => {
    setLoadingTokens(true);
    try {
      const res = await fetch('/api/auth/tokens', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('phoneclaw_token')}` },
      });
      const data = await res.json();
      if (data.success) setApiTokens(data.data);
    } catch (err) {
      console.error('Failed to fetch tokens:', err);
    } finally {
      setLoadingTokens(false);
    }
  };

  useEffect(() => { fetchTokens(); }, []);

  const handleRegenerateToken = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/auth/tokens/${tokenId}/regenerate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('phoneclaw_token')}` },
      });
      const data = await res.json();
      if (data.success) {
        setCreatedToken(data.data.token);
        showToast('success', 'Token đã được tạo lại');
        fetchTokens();
      }
    } catch {
      showToast('error', 'Tạo lại token thất bại');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const formatTimeAgo = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    return `${Math.floor(seconds / 86400)} ngày trước`;
  };

  const allDevices = deviceList || [];
  const activeTokens = apiTokens
    .filter(t => !t.revokedAt)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="h-full flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Settings Sidebar */}
      <div className="w-64 border-r border-slate-100 bg-slate-50/50 flex flex-col">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Cài đặt</h2>
          <p className="text-sm text-slate-500 mt-1">Cấu hình hệ thống</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {SETTINGS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="w-full p-8">

          {/* VPS TAB */}
          {activeTab === 'vps' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Trạng thái Máy chủ (VPS)</h3>
                <p className="text-sm text-slate-500">Thông tin phần cứng và kết nối của server điều khiển</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Cpu size={18} className="text-blue-500" /> CPU Usage
                    </div>
                    <span className="text-sm font-bold text-slate-900">{vps.cpu}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: `${vps.cpu}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <Activity size={18} className="text-emerald-500" /> RAM Usage
                    </div>
                    <span className="text-sm font-bold text-slate-900">{vps.ram.used} / {vps.ram.total} MB</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${ramPercent}%` }}></div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{ramPercent}% Đã sử dụng</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-700 font-medium">
                      <HardDrive size={18} className="text-purple-500" /> Disk Space
                    </div>
                    <span className="text-sm font-bold text-slate-900">{vps.disk.used} / {vps.disk.total} GB</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${diskPercent}%` }}></div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-500">Uptime</p>
                      <p className="text-lg font-bold text-slate-900">{uptimeStr}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm text-slate-600">Trạng thái Tailscale:</span>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                      vps.tailscaleStatus === 'connected'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${vps.tailscaleStatus === 'connected' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                      {vps.tailscaleStatus === 'connected' ? 'Đang chạy' : 'Ngắt kết nối'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VNC TAB */}
          {activeTab === 'vnc' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Cấu hình VNC Mặc định</h3>
                <p className="text-sm text-slate-500">Thiết lập thông số mặc định khi thêm thiết bị mới</p>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Cổng (Port)</label>
                    <input type="number" value={vncForm.port} onChange={e => setVncForm(p => ({ ...p, port: parseInt(e.target.value) }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu VNC mặc định</label>
                    <input type="password" value={vncForm.password} onChange={e => setVncForm(p => ({ ...p, password: e.target.value }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tỷ lệ thu phóng (Scale)</label>
                    <select value={vncForm.scale} onChange={e => setVncForm(p => ({ ...p, scale: parseFloat(e.target.value) }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      <option value="1.0">1.0 (Gốc)</option>
                      <option value="0.75">0.75 (75%)</option>
                      <option value="0.5">0.5 (50%) - Khuyên dùng</option>
                      <option value="0.25">0.25 (25%)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Tốc độ khung hình (FPS)</label>
                    <select value={vncForm.fps} onChange={e => setVncForm(p => ({ ...p, fps: parseInt(e.target.value) }))} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                      <option value="15">15 FPS</option>
                      <option value="30">30 FPS</option>
                      <option value="60">60 FPS</option>
                    </select>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button onClick={handleSaveVnc} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu cấu hình
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAILSCALE TAB */}
          {activeTab === 'tailscale' && (
            <div>
              <div className="mb-6 flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Quản lý Tailscale</h3>
                  <p className="text-sm text-slate-500">Danh sách thiết bị đã đăng ký trong hệ thống ({allDevices.length})</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500">
                      <th className="py-3 px-6">Tên thiết bị</th>
                      <th className="py-3 px-4">IP Tailscale</th>
                      <th className="py-3 px-4">Lần cuối hoạt động</th>
                      <th className="py-3 px-4">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {allDevices.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Chưa có thiết bị nào</td></tr>
                    )}
                    {allDevices.map((device) => (
                      <tr key={device.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <Smartphone size={16} className="text-slate-400" />
                            <span className="font-medium text-slate-900">{device.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-slate-600">{device.tailscaleIp}</td>
                        <td className="py-3 px-4 text-sm text-slate-500">{device.lastSeen ? new Date(device.lastSeen).toLocaleString('vi-VN') : '-'}</td>
                        <td className="py-3 px-4">
                          {device.status !== 'offline' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đã kết nối
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Ngoại tuyến
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PACKAGES TAB */}
          {activeTab === 'packages' && <PackageSettings />}

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Thông tin tài khoản</h3>
                <p className="text-sm text-slate-500 mb-4">Tài khoản đang đăng nhập</p>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isAdmin ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {isAdmin ? <Shield size={20} /> : <Users size={20} />}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{authUser?.name}</p>
                      <p className="text-sm text-slate-500">{authUser?.email}</p>
                    </div>
                    <span className={`ml-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border ${isAdmin ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {isAdmin ? 'Admin' : 'Người dùng'}
                    </span>
                  </div>
                </div>
              </div>

              {/* API TOKEN SECTION */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">API Token</h3>
                <p className="text-sm text-slate-500 mb-4">Token dùng để tích hợp với phần mềm bên ngoài qua API</p>

                {/* New Token Alert — shown once after regenerate */}
                {createdToken && (
                  <div className="mb-4 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={16} className="text-green-600" />
                      <span className="font-semibold text-green-800 text-sm">Token mới đã được tạo!</span>
                    </div>
                    <p className="text-xs text-green-700 mb-3">
                      Sao chép token này ngay. Bạn sẽ không thể xem lại sau khi đóng.
                    </p>
                    <div className="flex items-center gap-2 bg-white border border-green-200 rounded-lg px-3 py-2">
                      <code className="text-xs font-mono text-slate-800 flex-1 break-all select-all">{createdToken}</code>
                      <button
                        onClick={() => copyToClipboard(createdToken)}
                        className="shrink-0 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors flex items-center gap-1"
                      >
                        {copiedToken ? <><CheckCircle size={12} /> Đã sao chép</> : <><Copy size={12} /> Sao chép</>}
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-mono">
                      Sử dụng trong header: X-API-Token: {createdToken.substring(0, 24)}...
                    </p>
                    <button
                      onClick={() => setCreatedToken(null)}
                      className="mt-2 text-xs text-green-700 hover:text-green-900 underline"
                    >
                      Đã sao chép, đóng thông báo
                    </button>
                  </div>
                )}

                {/* Active Token Display */}
                {loadingTokens ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 size={20} className="animate-spin text-slate-400" />
                  </div>
                ) : activeTokens.length > 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Key size={18} className="text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 text-sm mb-1">Token hiện tại</p>
                        <div className="flex items-center gap-2">
                          <code className="text-xs text-slate-700 font-mono break-all select-all">
                            {showToken && activeTokens[0].tokenValue
                              ? activeTokens[0].tokenValue
                              : `${activeTokens[0].tokenPrefix}${'•'.repeat(52)}`}
                          </code>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setShowToken(!showToken)}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title={showToken ? 'Ẩn token' : 'Hiện token'}
                        >
                          {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                        <button
                          onClick={() => {
                            const val = activeTokens[0].tokenValue;
                            if (val) {
                              navigator.clipboard.writeText(val);
                              setCopiedToken(true);
                              setTimeout(() => setCopiedToken(false), 2000);
                            }
                          }}
                          className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                          title="Sao chép token"
                        >
                          {copiedToken ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pl-12">
                      <span>Tạo: {new Date(activeTokens[0].createdAt).toLocaleDateString('vi-VN')}</span>
                      {activeTokens[0].lastUsedAt ? (
                        <span>Dùng lần cuối: {formatTimeAgo(activeTokens[0].lastUsedAt)}</span>
                      ) : (
                        <span className="text-amber-500">Chưa sử dụng</span>
                      )}
                      {activeTokens[0].lastUsedIp && <span>IP: {activeTokens[0].lastUsedIp}</span>}
                    </div>
                    <div className="pl-12">
                      <button
                        onClick={() => setConfirmRegenerate(activeTokens[0].id)}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                      >
                        <RefreshCw size={13} /> Đổi token mới
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center">
                    <Loader2 size={20} className="mx-auto mb-2 text-slate-400 animate-spin" />
                    <p className="text-sm text-slate-500">Đang tạo token...</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Đổi mật khẩu</h3>
                <p className="text-sm text-slate-500 mb-4">Cập nhật mật khẩu đăng nhập cho tài khoản hiện tại</p>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                    <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới (ít nhất 6 ký tự)</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <button onClick={handleChangePassword} disabled={changingPassword} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
                    {changingPassword && <Loader2 size={16} className="animate-spin" />}
                    <Key size={16} /> Cập nhật mật khẩu
                  </button>
                </div>
              </div>

              {/* Confirm Regenerate Dialog */}
              {confirmRegenerate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                  <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md mx-4 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                        <RefreshCw size={20} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">Đổi token mới?</h3>
                        <p className="text-sm text-slate-500">Token cũ sẽ ngừng hoạt động ngay lập tức</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-6">
                      Tất cả phần mềm đang sử dụng token hiện tại sẽ cần cập nhật sang token mới. Bạn có chắc chắn muốn đổi không?
                    </p>
                    <div className="flex items-center gap-3 justify-end">
                      <button
                        onClick={() => setConfirmRegenerate(null)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => {
                          const tokenId = confirmRegenerate;
                          setConfirmRegenerate(null);
                          setShowToken(false);
                          handleRegenerateToken(tokenId);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors shadow-sm"
                      >
                        Đổi token mới
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === 'notifications' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Cấu hình Cảnh báo & Thông báo</h3>
                <p className="text-sm text-slate-500">Nhận thông báo qua Telegram hoặc Webhook khi có sự cố</p>
              </div>

              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Sự kiện kích hoạt</h4>
                  <div className="space-y-4">
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium text-slate-800">Thiết bị ngoại tuyến (Offline)</p>
                        <p className="text-xs text-slate-500">Gửi cảnh báo khi thiết bị mất kết nối</p>
                      </div>
                      <button
                        onClick={() => setNotifForm(p => ({ ...p, alertOnDeviceOffline: !p.alertOnDeviceOffline }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifForm.alertOnDeviceOffline ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifForm.alertOnDeviceOffline ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </label>
                    <div className="h-px bg-slate-100"></div>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium text-slate-800">Kịch bản lỗi</p>
                        <p className="text-xs text-slate-500">Gửi cảnh báo khi kịch bản chạy thất bại</p>
                      </div>
                      <button
                        onClick={() => setNotifForm(p => ({ ...p, alertOnScriptError: !p.alertOnScriptError }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifForm.alertOnScriptError ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifForm.alertOnScriptError ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </label>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Telegram Bot</h4>
                  <div className="grid grid-cols-2 gap-6 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Bot Token</label>
                      <div className="relative">
                        <input type={showBotToken ? 'text' : 'password'} value={notifForm.telegramBotToken} onChange={e => setNotifForm(p => ({ ...p, telegramBotToken: e.target.value }))} placeholder="123456789:ABCdefGHI..." className="w-full px-4 py-2 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                        <button type="button" onClick={() => setShowBotToken(!showBotToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showBotToken ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Chat ID</label>
                      <input type="text" value={notifForm.telegramChatId} onChange={e => setNotifForm(p => ({ ...p, telegramChatId: e.target.value }))} placeholder="-100123456789" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!notifForm.telegramBotToken || !notifForm.telegramChatId) {
                        showToast('error', 'Vui lòng nhập Bot Token và Chat ID');
                        return;
                      }
                      setSaving(true);
                      const res = await settingsApi.testTelegram(notifForm.telegramBotToken, notifForm.telegramChatId);
                      setSaving(false);
                      if (res.success) {
                        showToast('success', 'Kết nối Telegram thành công! Kiểm tra tin nhắn trong chat.');
                      } else {
                        showToast('error', res.error || 'Kết nối Telegram thất bại');
                      }
                    }}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
                    Kiểm tra kết nối
                  </button>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSaveNotifications} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu cấu hình
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CLOUDFLARE R2 TAB */}
          {activeTab === 'r2' && (
            <R2Settings settings={appSettings} onSave={async (r2) => {
              setSaving(true);
              await settingsApi.update({ r2 });
              refreshSettings();
              setSaving(false);
            }} saving={saving} />
          )}

          {activeTab === 'gmail' && (
            <GmailOAuthSettings settings={appSettings} onSave={async (gmailOAuth) => {
              setSaving(true);
              await settingsApi.update({ gmailOAuth } as any);
              refreshSettings();
              setSaving(false);
              showToast('success', 'Đã lưu cấu hình Gmail OAuth');
            }} saving={saving} />
          )}

        </div>
      </div>
    </div>
  );
}

/** Cloudflare R2 Settings sub-component */
function R2Settings({ settings, onSave, saving }: { settings?: AppSettings | null; onSave: (r2: AppSettings['r2']) => void; saving: boolean }) {
  const r2 = settings?.r2;
  const [accountId, setAccountId] = useState(r2?.accountId || '');
  const [accessKeyId, setAccessKeyId] = useState(r2?.accessKeyId || '');
  const [secretAccessKey, setSecretAccessKey] = useState(r2?.secretAccessKey || '');
  const [bucketName, setBucketName] = useState(r2?.bucketName || '');
  const [publicUrl, setPublicUrl] = useState(r2?.publicUrl || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTest = async () => {
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      setTestResult({ ok: false, msg: 'Vui lòng điền đầy đủ thông tin bắt buộc' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await settingsApi.testR2({ accountId, accessKeyId, secretAccessKey, bucketName });
    setTestResult({ ok: res.success, msg: res.success ? 'Kết nối R2 thành công!' : (res.error || 'Kết nối thất bại') });
    setTesting(false);
  };

  const handleSave = () => {
    onSave({ accountId, accessKeyId, secretAccessKey, bucketName, publicUrl });
  };

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white";

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Cloudflare R2 Storage</h3>
        <p className="text-sm text-slate-500 mt-1">Cấu hình kết nối Cloudflare R2 để lưu trữ ảnh chụp và tệp tin</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex gap-3">
        <Cloud className="shrink-0 mt-0.5" size={18} />
        <div>
          <p className="font-medium mb-1">Hướng dẫn lấy thông tin:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>Đăng nhập Cloudflare Dashboard → R2 Object Storage</li>
            <li>Tạo Bucket mới hoặc chọn bucket có sẵn</li>
            <li>Vào Manage R2 API Tokens → Tạo API Token</li>
            <li>Copy Account ID, Access Key ID, Secret Access Key</li>
          </ol>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Account ID <span className="text-red-500">*</span></label>
          <input type="text" value={accountId} onChange={e => setAccountId(e.target.value)} placeholder="VD: a1b2c3d4e5f6..." className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Access Key ID <span className="text-red-500">*</span></label>
          <input type="text" value={accessKeyId} onChange={e => setAccessKeyId(e.target.value)} placeholder="VD: 1a2b3c4d5e6f..." className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Secret Access Key <span className="text-red-500">*</span></label>
          <input type="password" value={secretAccessKey} onChange={e => setSecretAccessKey(e.target.value)} placeholder="••••••••••••••••" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Bucket Name <span className="text-red-500">*</span></label>
          <input type="text" value={bucketName} onChange={e => setBucketName(e.target.value)} placeholder="VD: phoneclaw-storage" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Public URL <span className="text-slate-400">(tuỳ chọn)</span></label>
          <input type="text" value={publicUrl} onChange={e => setPublicUrl(e.target.value)} placeholder="VD: https://cdn.example.com" className={inputCls} />
          <p className="text-xs text-slate-400 mt-1">URL công khai nếu bucket có custom domain hoặc R2.dev subdomain</p>
        </div>
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium ${testResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {testResult.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {testResult.msg}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          onClick={handleTest}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
        >
          {testing ? <Loader2 size={16} className="animate-spin" /> : <Activity size={16} />}
          Kiểm tra kết nối
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Lưu cấu hình
        </button>
      </div>
    </div>
  );
}

/** Gmail OAuth Settings sub-component */
function GmailOAuthSettings({ settings, onSave, saving }: { settings?: AppSettings | null; onSave: (gmailOAuth: { clientId: string; clientSecret: string }) => void; saving: boolean }) {
  const gmailOAuth = (settings as any)?.gmailOAuth;
  const [clientId, setClientId] = useState(gmailOAuth?.clientId || '');
  const [clientSecret, setClientSecret] = useState(gmailOAuth?.clientSecret || '');
  const redirectUri = `${window.location.origin}/api/gmail-auth/callback`;

  useEffect(() => {
    const cfg = (settings as any)?.gmailOAuth;
    if (cfg) {
      setClientId(cfg.clientId || '');
      setClientSecret(cfg.clientSecret || '');
    }
  }, [settings]);

  const inputCls = 'w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Gmail OAuth</h2>
        <p className="text-sm text-slate-500">Cấu hình Google OAuth2 để đọc email và lấy OTP tự động.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <p className="font-medium mb-1">Hướng dẫn setup:</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-700">
          <li>Vào Google Cloud Console → tạo project mới</li>
          <li>Bật Gmail API trong APIs & Services</li>
          <li>Tạo OAuth 2.0 Client ID (Web application)</li>
          <li>Thêm Redirect URI bên dưới vào Authorized redirect URIs</li>
          <li>Copy Client ID và Client Secret vào đây</li>
        </ol>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Client ID <span className="text-red-500">*</span></label>
          <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxx.apps.googleusercontent.com" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Client Secret <span className="text-red-500">*</span></label>
          <input type="password" value={clientSecret} onChange={e => setClientSecret(e.target.value)} placeholder="GOCSPX-xxx" className={inputCls} />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Redirect URI <span className="text-slate-400">(tự động)</span></label>
          <div className="flex items-center gap-2">
            <input type="text" value={redirectUri} readOnly className={`${inputCls} bg-slate-50 text-slate-500`} />
            <button
              onClick={() => { navigator.clipboard.writeText(redirectUri); showToast('success', 'Đã copy Redirect URI'); }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 shrink-0"
            >
              <Copy size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Thêm URL này vào Google Cloud Console → OAuth Client → Authorized redirect URIs</p>
        </div>
      </div>

      <button
        onClick={() => onSave({ clientId, clientSecret })}
        disabled={saving || !clientId || !clientSecret}
        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition-colors shadow-sm shadow-blue-200 disabled:opacity-50"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Lưu cấu hình
      </button>
    </div>
  );
}
