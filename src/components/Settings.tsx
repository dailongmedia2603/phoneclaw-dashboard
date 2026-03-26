import { useState } from 'react';
import {
  Server, MonitorPlay, Network, Users, Bell, DatabaseBackup, Palette,
  Cpu, HardDrive, Activity, CheckCircle2, AlertCircle, Shield,
  Plus, Edit, Trash2, Save, Upload, Download, Smartphone, Check, X, Loader2
} from 'lucide-react';
import { settings as settingsApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { AppSettings, VpsStatus, Device } from '../types';

const SETTINGS_TABS = [
  { id: 'vps', label: 'Máy chủ (VPS)', icon: Server },
  { id: 'vnc', label: 'VNC Mặc định', icon: MonitorPlay },
  { id: 'tailscale', label: 'Tailscale', icon: Network },
  { id: 'account', label: 'Tài khoản', icon: Users },
  { id: 'notifications', label: 'Thông báo', icon: Bell },
  { id: 'backup', label: 'Sao lưu & Phục hồi', icon: DatabaseBackup },
  { id: 'appearance', label: 'Giao diện', icon: Palette },
];

const MOCK_USERS = [
  { id: 'u1', username: 'admin', role: 'Quản trị viên', lastLogin: 'Hôm nay' },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState('vps');
  const [saving, setSaving] = useState(false);

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

  const handleSaveVnc = async () => {
    setSaving(true);
    await settingsApi.update({
      vncDefaults: { ...cfg.vncDefaults, ...vncForm },
    });
    setSaving(false);
    refreshSettings();
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    await settingsApi.update({
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
    refreshSettings();
  };

  const handleSaveAppearance = async (theme: string, language: string) => {
    await settingsApi.update({ theme: theme as 'dark' | 'light', language: language as 'vi' | 'en' });
    refreshSettings();
  };

  const allDevices = deviceList || [];

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

          {/* ACCOUNT TAB */}
          {activeTab === 'account' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">Đổi mật khẩu Dashboard</h3>
                <p className="text-sm text-slate-500 mb-4">Cập nhật mật khẩu đăng nhập cho tài khoản hiện tại</p>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm">
                    Cập nhật mật khẩu
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Quản lý người dùng</h3>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500">
                        <th className="py-3 px-6">Tên đăng nhập</th>
                        <th className="py-3 px-4">Vai trò</th>
                        <th className="py-3 px-4">Đăng nhập lần cuối</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {MOCK_USERS.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-6 font-medium text-slate-900">{user.username}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                              <Shield size={12} /> {user.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-500">{user.lastLogin}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Bot Token</label>
                      <input type="text" value={notifForm.telegramBotToken} onChange={e => setNotifForm(p => ({ ...p, telegramBotToken: e.target.value }))} placeholder="123456789:ABCdefGHI..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">Chat ID</label>
                      <input type="text" value={notifForm.telegramChatId} onChange={e => setNotifForm(p => ({ ...p, telegramChatId: e.target.value }))} placeholder="-100123456789" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Webhook (Tùy chọn)</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Webhook URL</label>
                    <input type="url" value={notifForm.webhookUrl} onChange={e => setNotifForm(p => ({ ...p, webhookUrl: e.target.value }))} placeholder="https://your-api.com/webhook" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button onClick={handleSaveNotifications} disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Lưu cấu hình
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BACKUP TAB */}
          {activeTab === 'backup' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Sao lưu & Phục hồi</h3>
                <p className="text-sm text-slate-500">Bảo vệ dữ liệu hệ thống</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                    <Download size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Xuất dữ liệu (Backup)</h4>
                  <p className="text-sm text-slate-500 mb-6 flex-1">Tải xuống toàn bộ cấu hình, danh sách thiết bị và kịch bản dưới dạng JSON.</p>
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
                    <Download size={18} /> Tạo file Backup
                  </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                    <Upload size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Nhập dữ liệu (Restore)</h4>
                  <p className="text-sm text-slate-500 mb-6 flex-1">Khôi phục từ file backup JSON. Dữ liệu hiện tại có thể bị ghi đè.</p>
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center mb-6 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <Upload size={24} className="text-slate-400 mb-2" />
                    <p className="text-sm font-medium text-slate-700">Kéo thả file JSON vào đây</p>
                  </div>
                  <button className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors shadow-sm">
                    Phục hồi dữ liệu
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === 'appearance' && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Giao diện & Ngôn ngữ</h3>
                <p className="text-sm text-slate-500">Tùy chỉnh trải nghiệm hiển thị</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-8">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Chủ đề (Theme)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {['light', 'dark'].map(theme => (
                      <label key={theme} className="cursor-pointer">
                        <input type="radio" name="theme" value={theme} className="peer sr-only" checked={cfg.theme === theme} onChange={() => handleSaveAppearance(theme, cfg.language)} />
                        <div className="border-2 border-slate-200 rounded-xl p-4 hover:bg-slate-50 peer-checked:border-blue-600 peer-checked:bg-blue-50 transition-all text-center">
                          <div className={`w-full h-20 rounded-lg border mb-3 flex flex-col gap-2 p-2 ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                            <div className={`w-full h-4 rounded shadow-sm ${theme === 'dark' ? 'bg-slate-700' : 'bg-white'}`}></div>
                            <div className={`w-2/3 h-4 rounded shadow-sm ${theme === 'dark' ? 'bg-slate-700' : 'bg-white'}`}></div>
                          </div>
                          <span className="text-sm font-medium text-slate-700">{theme === 'light' ? 'Sáng (Light)' : 'Tối (Dark)'}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Ngôn ngữ (Language)</h4>
                  <select value={cfg.language} onChange={e => handleSaveAppearance(cfg.theme, e.target.value)} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
