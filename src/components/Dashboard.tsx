import { useEffect } from 'react';
import {
  Smartphone, Wifi, WifiOff, PlayCircle, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { dashboard } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import type { DashboardStats, Notification } from '../types';

const NOTIFICATION_ICONS: Record<string, typeof Info> = {
  error: AlertCircle,
  warning: WifiOff,
  success: CheckCircle2,
  info: Info,
};

export default function Dashboard() {
  const { data: stats, refresh: refreshStats } = useApi<DashboardStats>(() => dashboard.getStats(), []);
  const { data: notifications } = useApi<Notification[]>(() => dashboard.getNotifications(10), []);
  const { on } = useWebSocket();

  // Listen for real-time device status changes
  useEffect(() => {
    const unsub = on('device:status', () => {
      refreshStats();
    });
    return unsub;
  }, [on, refreshStats]);

  const s = stats || { totalDevices: 0, onlineDevices: 0, offlineDevices: 0, runningScripts: 0, onlineHistory: [], scriptRunHistory: [] };

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
        {/* Online Devices Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-4">Thiết bị Online (24h)</h3>
          <div className="h-56">
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
          <div className="h-56">
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

        {/* Notifications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Thông báo gần đây</h3>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-700">Xem tất cả</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-64">
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
