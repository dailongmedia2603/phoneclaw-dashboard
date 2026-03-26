import { useState, useEffect } from 'react';
import {
  Smartphone, Wifi, WifiOff, PlayCircle,
  Cpu, HardDrive, Activity, AlertCircle, CheckCircle2, Info, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { dashboard, devices, settings } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Device, DashboardStats, Notification, VpsStatus } from '../types';

const NOTIFICATION_ICONS: Record<string, typeof Info> = {
  error: AlertCircle,
  warning: WifiOff,
  success: CheckCircle2,
  info: Info,
};

export default function Dashboard() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { data: stats, refresh: refreshStats } = useApi<DashboardStats>(() => dashboard.getStats(), []);
  const { data: notifications } = useApi<Notification[]>(() => dashboard.getNotifications(10), []);
  const { data: deviceList, refresh: refreshDevices } = useApi<Device[]>(() => devices.getAll(), []);
  const { data: vpsStatus } = useApi<VpsStatus>(() => settings.getVpsStatus(), []);
  const { on } = useWebSocket();

  // Listen for real-time device status changes
  useEffect(() => {
    const unsub = on('device:status', () => {
      refreshStats();
      refreshDevices();
    });
    return unsub;
  }, [on, refreshStats, refreshDevices]);

  // Auto refresh thumbnails every 10s
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
      refreshStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  const s = stats || { totalDevices: 0, onlineDevices: 0, offlineDevices: 0, runningScripts: 0, onlineHistory: [], scriptRunHistory: [] };
  const vps = vpsStatus || { cpu: 0, ram: { used: 0, total: 0 }, disk: { used: 0, total: 0 }, bandwidth: { up: 0, down: 0 }, uptime: 0, tailscaleStatus: 'disconnected' as const };
  const ramPercent = vps.ram.total > 0 ? Math.round((vps.ram.used / vps.ram.total) * 100) : 0;
  const thumbDevices = (deviceList || []).slice(0, 6);

  return (
    <div className="h-full overflow-y-auto pr-2 space-y-6 pb-6">
      {/* Header & Quick Stats */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Tổng quan hệ thống</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Smartphone size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Tổng thiết bị</p>
              <h3 className="text-2xl font-bold text-slate-900">{s.totalDevices}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wifi size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Đang Online</p>
              <h3 className="text-2xl font-bold text-slate-900">{s.onlineDevices}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <WifiOff size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Ngoại tuyến</p>
              <h3 className="text-2xl font-bold text-slate-900">{s.offlineDevices}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <PlayCircle size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Đang chạy kịch bản</p>
              <h3 className="text-2xl font-bold text-slate-900">{s.runningScripts}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Charts & VPS */}
        <div className="lg:col-span-2 space-y-6">

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Online Devices Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Thiết bị Online (24h)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={s.onlineHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Scripts Run Chart */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4">Kịch bản đã chạy (7 ngày)</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={s.scriptRunHistory} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* VPS Resources */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Tài nguyên VPS</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Cpu size={16} className="text-blue-500" /> CPU
                  </div>
                  <span className="text-sm font-bold text-slate-900">{vps.cpu}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${vps.cpu}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Activity size={16} className="text-emerald-500" /> RAM
                  </div>
                  <span className="text-sm font-bold text-slate-900">{ramPercent}% ({vps.ram.used}MB / {vps.ram.total}MB)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${ramPercent}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <HardDrive size={16} className="text-purple-500" /> Băng thông
                  </div>
                  <span className="text-sm font-bold text-slate-900">{vps.bandwidth.up + vps.bandwidth.down} MB/s</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-purple-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Thumbnails */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Màn hình thiết bị (Live)</h3>
              <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-refresh
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {thumbDevices.length === 0 && (
                <div className="col-span-6 py-12 text-center text-slate-400">
                  <Smartphone size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Chưa có thiết bị nào. Thêm thiết bị tại tab "Thiết bị".</p>
                </div>
              )}
              {thumbDevices.map((device) => (
                <div key={device.id} className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[9/19]">
                  {device.status === 'offline' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                      <WifiOff size={24} className="mb-2" />
                      <span className="text-xs font-medium">Offline</span>
                    </div>
                  ) : (
                    <>
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:9000'}/api/control/${device.id}/screenshot?t=${refreshKey}`}
                        alt={device.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = ''; (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      {/* Fallback when no screenshot */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 bg-slate-50 -z-10">
                        <Smartphone size={24} className="mb-1" />
                        <span className="text-[10px]">No preview</span>
                      </div>
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          {device.status === 'running' && device.currentScript && (
                            <span className="bg-purple-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <PlayCircle size={10} /> {device.currentScript}
                            </span>
                          )}
                        </div>
                        <div className="text-white text-xs font-medium truncate">
                          {device.name}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Notifications */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-900">Thông báo gần đây</h3>
              <button className="text-xs font-medium text-blue-600 hover:text-blue-700">Xem tất cả</button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {(!notifications || notifications.length === 0) && (
                <div className="text-center py-8 text-slate-400">
                  <Info size={24} className="mx-auto mb-2" />
                  <p className="text-sm">Chưa có thông báo</p>
                </div>
              )}
              {(notifications || []).map((notif) => {
                const Icon = NOTIFICATION_ICONS[notif.type] || Info;
                let bgColor = 'bg-slate-50';
                let iconColor = 'text-slate-500';

                if (notif.type === 'error') {
                  bgColor = 'bg-red-50';
                  iconColor = 'text-red-500';
                } else if (notif.type === 'success') {
                  bgColor = 'bg-emerald-50';
                  iconColor = 'text-emerald-500';
                } else if (notif.type === 'warning') {
                  bgColor = 'bg-amber-50';
                  iconColor = 'text-amber-500';
                } else if (notif.type === 'info') {
                  bgColor = 'bg-blue-50';
                  iconColor = 'text-blue-500';
                }

                const timeAgo = getTimeAgo(notif.timestamp);

                return (
                  <div key={notif.id} className={`flex gap-3 items-start p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 ${!notif.read ? 'bg-blue-50/30' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor} ${iconColor}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800 leading-snug">{notif.message}</p>
                      <p className="text-xs text-slate-500 mt-1">{timeAgo}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}
