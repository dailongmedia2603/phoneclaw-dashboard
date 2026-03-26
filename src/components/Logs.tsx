import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon, Activity, FileText, Download, Settings,
  Search, Filter, Calendar, Smartphone, ChevronRight, ChevronDown, X,
  CheckCircle2, XCircle, Clock, Trash2, Archive, FileJson, FileSpreadsheet,
  Loader2, AlertCircle, ImageOff
} from 'lucide-react';
import { logs as logsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { ActivityLog, ScreenshotLog, ScheduleHistory } from '../types';

export default function Logs() {
  const [activeTab, setActiveTab] = useState<'gallery' | 'activity' | 'scripts'>('gallery');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; device: string; timestamp: string; script?: string | null } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  const screenshotDaysRef = useRef<HTMLInputElement>(null);
  const activityDaysRef = useRef<HTMLInputElement>(null);
  const scriptDaysRef = useRef<HTMLInputElement>(null);

  // Real API calls
  const { data: screenshots, loading: screenshotsLoading, error: screenshotsError } = useApi<ScreenshotLog[]>(
    () => logsApi.getScreenshots({ limit: 50 }), []
  );
  const { data: activityLogs, loading: activityLoading, error: activityError } = useApi<ActivityLog[]>(
    () => logsApi.getActivity({ limit: 50 }), []
  );
  const { data: scriptLogs, loading: scriptLogsLoading, error: scriptLogsError } = useApi<ScheduleHistory[]>(
    () => logsApi.getExecutions(), []
  );

  const handleCleanup = async () => {
    const days = Math.min(
      Number(screenshotDaysRef.current?.value || 7),
      Number(activityDaysRef.current?.value || 30),
      Number(scriptDaysRef.current?.value || 14),
    );
    setCleaningUp(true);
    try {
      await logsApi.cleanup(days);
    } finally {
      setCleaningUp(false);
    }
  };

  // Helper to format duration from two ISO timestamps
  const formatDuration = (startedAt: string, finishedAt?: string): string => {
    if (!finishedAt) return 'Đang chạy...';
    const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rs = s % 60;
    return `${m}m ${rs}s`;
  };

  // Helper to format ISO timestamp for display
  const formatTimestamp = (iso: string): string => {
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
    } catch {
      return iso;
    }
  };

  const formatTime = (iso: string): string => {
    try {
      const d = new Date(iso);
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    } catch {
      return iso;
    }
  };

  // Loading spinner component
  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Loader2 size={32} className="animate-spin mb-3" />
      <p className="text-sm">Đang tải dữ liệu...</p>
    </div>
  );

  // Error state component
  const ErrorState = ({ message }: { message: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-red-400">
      <AlertCircle size={32} className="mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );

  // Empty state component
  const EmptyState = ({ icon: Icon, message }: { icon: React.ElementType; message: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
      <Icon size={40} className="mb-3 text-slate-300" />
      <p className="text-sm">{message}</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Ảnh chụp & Nhật ký</h1>
          <p className="text-sm text-slate-500">Quản lý hình ảnh, theo dõi hoạt động và lịch sử chạy kịch bản</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Settings size={18} className="text-slate-400" />
            Tự động dọn
          </button>

          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
            >
              <Download size={18} />
              Export
              <ChevronDown size={16} className="ml-1 opacity-70" />
            </button>

            {showExportMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 transition-colors">
                  <FileSpreadsheet size={16} className="text-emerald-600" /> Xuất Log (CSV)
                </button>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 transition-colors">
                  <FileJson size={16} className="text-amber-600" /> Xuất Log (JSON)
                </button>
                <div className="h-px bg-slate-100 my-1"></div>
                <button className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 text-slate-700 transition-colors">
                  <Archive size={16} className="text-blue-600" /> Tải Ảnh (ZIP)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 border-b border-slate-100 flex gap-6 bg-slate-50/30">
        {[
          { id: 'gallery', label: 'Thư viện ảnh', icon: ImageIcon },
          { id: 'activity', label: 'Nhật ký hoạt động', icon: Activity },
          { id: 'scripts', label: 'Nhật ký kịch bản', icon: FileText },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
            <Calendar size={16} className="text-slate-400 mr-2" />
            <span className="text-slate-600">25/10/2023 - Hôm nay</span>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            <Filter size={16} className="text-slate-400" />
            Bộ lọc
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50/30">

        {/* TAB: GALLERY */}
        {activeTab === 'gallery' && (
          <div className="p-6">
            {screenshotsLoading ? (
              <LoadingState />
            ) : screenshotsError ? (
              <ErrorState message={screenshotsError} />
            ) : !screenshots || screenshots.length === 0 ? (
              <EmptyState icon={ImageOff} message="Chưa có ảnh chụp màn hình nào" />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {screenshots.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setLightboxImage({ url: img.url, device: img.deviceName, timestamp: img.timestamp, script: img.scriptName })}
                    className="group relative aspect-[9/16] bg-slate-200 rounded-xl overflow-hidden cursor-pointer border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    <img src={img.url} alt="Screenshot" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                      <p className="text-white text-xs font-medium truncate">{img.deviceName}</p>
                      <p className="text-slate-300 text-[10px] font-mono mt-0.5">{formatTime(img.timestamp)}</p>
                      {img.scriptName && (
                        <span className="mt-1.5 inline-block bg-blue-500/80 text-white text-[9px] px-1.5 py-0.5 rounded truncate">
                          {img.scriptName}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: ACTIVITY LOG */}
        {activeTab === 'activity' && (
          <>
            {activityLoading ? (
              <LoadingState />
            ) : activityError ? (
              <ErrorState message={activityError} />
            ) : !activityLogs || activityLogs.length === 0 ? (
              <EmptyState icon={Activity} message="Chưa có nhật ký hoạt động nào" />
            ) : (
              <table className="w-full text-left border-collapse bg-white">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
                    <th className="py-3 px-6">Thời gian</th>
                    <th className="py-3 px-4">Người dùng/Hệ thống</th>
                    <th className="py-3 px-4">Thiết bị</th>
                    <th className="py-3 px-6">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activityLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 text-sm font-mono text-slate-600">{formatTimestamp(log.timestamp)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          log.type === 'system' || log.type === 'script' || log.type === 'schedule'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {log.type === 'user' ? 'Admin' : 'System'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-slate-700">{log.deviceName || '-'}</td>
                      <td className="py-3 px-6 text-sm text-slate-600">{log.action}{log.details ? `: ${log.details}` : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* TAB: SCRIPT LOGS */}
        {activeTab === 'scripts' && (
          <div className="p-6 max-w-5xl mx-auto space-y-4">
            {scriptLogsLoading ? (
              <LoadingState />
            ) : scriptLogsError ? (
              <ErrorState message={scriptLogsError} />
            ) : !scriptLogs || scriptLogs.length === 0 ? (
              <EmptyState icon={FileText} message="Chưa có nhật ký kịch bản nào" />
            ) : (
              scriptLogs.map((log) => {
                const isExpanded = expandedLog === log.id;
                return (
                  <div key={log.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                    {/* Log Header (Clickable) */}
                    <div
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="px-4 py-3 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-slate-400">
                          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{log.scriptName}</span>
                            {log.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <CheckCircle2 size={12} /> Thành công
                              </span>
                            ) : log.status === 'running' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                <Loader2 size={12} className="animate-spin" /> Đang chạy
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100">
                                <XCircle size={12} /> Lỗi
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                            <span className="flex items-center gap-1"><Smartphone size={12} /> {log.targetName}</span>
                            <span className="flex items-center gap-1"><Calendar size={12} /> {formatTimestamp(log.startedAt)}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(log.startedAt, log.finishedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Log Details (Steps) */}
                    {isExpanded && log.steps && log.steps.length > 0 && (
                      <div className="border-t border-slate-100 p-4 bg-slate-50/30">
                        <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[19px] before:w-px before:bg-slate-200">
                          {log.steps.map((step, idx) => (
                            <div key={idx} className="relative flex gap-4">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-4 border-white z-10 ${
                                step.status === 'success' ? 'bg-emerald-100 text-emerald-600'
                                : step.status === 'error' ? 'bg-red-100 text-red-600'
                                : step.status === 'running' ? 'bg-blue-100 text-blue-600'
                                : 'bg-slate-100 text-slate-400'
                              }`}>
                                {step.status === 'success' ? <CheckCircle2 size={16} />
                                : step.status === 'error' ? <XCircle size={16} />
                                : step.status === 'running' ? <Loader2 size={16} className="animate-spin" />
                                : <Clock size={16} />}
                              </div>
                              <div className="flex-1 bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-semibold text-slate-500 uppercase">Bước {step.index}</span>
                                    {step.startedAt && <span className="text-xs font-mono text-slate-400">{formatTime(step.startedAt)}</span>}
                                  </div>
                                  <p className="text-sm font-mono font-medium text-slate-800">{step.description}</p>
                                  {step.error && (
                                    <p className="text-xs text-red-600 mt-1 bg-red-50 p-2 rounded border border-red-100">
                                      Lỗi: {step.error}
                                    </p>
                                  )}
                                </div>
                                {step.screenshotUrl && (
                                  <div
                                    onClick={(e) => { e.stopPropagation(); setLightboxImage({ url: step.screenshotUrl!, device: log.targetName, timestamp: step.startedAt || log.startedAt, script: log.scriptName }); }}
                                    className="w-12 h-20 bg-slate-200 rounded-md overflow-hidden cursor-pointer border border-slate-200 hover:border-blue-400 transition-colors shrink-0"
                                  >
                                    <img src={step.screenshotUrl} alt="Step screenshot" className="w-full h-full object-cover" />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4" onClick={() => setLightboxImage(null)}>
          <button className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-black/50 p-2 rounded-full">
            <X size={24} />
          </button>

          <div className="max-h-full max-w-4xl flex flex-col items-center" onClick={e => e.stopPropagation()}>
            <img
              src={lightboxImage.url}
              alt="Enlarged screenshot"
              className="max-h-[80vh] object-contain rounded-lg shadow-2xl"
            />
            <div className="mt-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 text-white w-full max-w-md">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">{lightboxImage.device}</h3>
                <span className="font-mono text-sm text-white/70">{formatTimestamp(lightboxImage.timestamp)}</span>
              </div>
              {lightboxImage.script && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-white/50 uppercase tracking-wider">Kịch bản:</span>
                  <span className="bg-blue-500/30 border border-blue-400/30 px-2 py-0.5 rounded text-sm">{lightboxImage.script}</span>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Download size={16} /> Tải xuống
                </button>
                <button className="flex-1 bg-red-500/20 hover:bg-red-500/40 text-red-200 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Trash2 size={16} /> Xóa ảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Auto-cleanup Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Settings size={18} className="text-blue-600" /> Cấu hình dọn dẹp tự động
              </h2>
              <button onClick={() => setShowSettings(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 text-blue-800 text-sm">
                <Archive className="shrink-0 mt-0.5" size={18} />
                <p>Hệ thống sẽ tự động xóa các dữ liệu cũ để giải phóng dung lượng lưu trữ. Hành động này không thể hoàn tác.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Ảnh chụp màn hình</p>
                    <p className="text-xs text-slate-500">Xóa ảnh cũ hơn số ngày chỉ định</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={screenshotDaysRef} type="number" defaultValue="7" className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:border-blue-500" />
                    <span className="text-sm text-slate-600">ngày</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Nhật ký hoạt động</p>
                    <p className="text-xs text-slate-500">Xóa log cũ hơn số ngày chỉ định</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={activityDaysRef} type="number" defaultValue="30" className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:border-blue-500" />
                    <span className="text-sm text-slate-600">ngày</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Nhật ký kịch bản</p>
                    <p className="text-xs text-slate-500">Bao gồm cả ảnh chụp trong các bước</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input ref={scriptDaysRef} type="number" defaultValue="14" className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-center text-sm focus:outline-none focus:border-blue-500" />
                    <span className="text-sm text-slate-600">ngày</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
              <button
                onClick={handleCleanup}
                disabled={cleaningUp}
                className="text-sm font-medium text-red-600 hover:text-red-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {cleaningUp ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />} Dọn dẹp ngay
              </button>
              <div className="flex gap-3">
                <button onClick={() => setShowSettings(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                  Hủy
                </button>
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-blue-200">
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
