import { useState, useMemo } from 'react';
import {
  CalendarDays, Plus, Search, Clock, List, History,
  PlaySquare, CheckCircle2, XCircle, MoreVertical,
  Edit, Trash2, Calendar as CalendarIcon, Filter, X,
  Smartphone, Wand2, ChevronLeft, ChevronRight, Loader2
} from 'lucide-react';
import { schedules as schedulesApi, scripts as scriptsApi, devices as devicesApi, logs as logsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Schedule, Script, Device, ScheduleHistory } from '../types';

function formatDate(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const isTomorrow = d.toDateString() === tomorrow.toDateString();
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (isToday) return `H\u00f4m nay, ${time}`;
  if (isTomorrow) return `Ng\u00e0y mai, ${time}`;
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }) + `, ${time}`;
}

function formatTime(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function formatDuration(startIso?: string, endIso?: string): string {
  if (!startIso || !endIso) return '—';
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 0) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${s}s`;
}

export default function Schedules() {
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'queue' | 'history'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Real API data
  const { data: schedules, loading: schedulesLoading, refresh: refreshSchedules } = useApi<Schedule[]>(() => schedulesApi.getAll(), []);
  const { data: historyData, loading: historyLoading, refresh: refreshHistory } = useApi<ScheduleHistory[]>(() => logsApi.getExecutions(), []);
  const { data: scriptsList } = useApi<Script[]>(() => scriptsApi.getAll(), []);
  const { data: devicesList } = useApi<Device[]>(() => devicesApi.getAll(), []);

  const scheduleList = schedules ?? [];
  const historyList = historyData ?? [];
  const queueList = useMemo(() => historyList.filter(h => h.status === 'running'), [historyList]);

  // Modal form state
  const [formName, setFormName] = useState('');
  const [formScriptId, setFormScriptId] = useState('');
  const [formDeviceId, setFormDeviceId] = useState('');
  const [formFrequency, setFormFrequency] = useState('daily');
  const [formTime, setFormTime] = useState('08:00');
  const [formCron, setFormCron] = useState('0 8 * * *');
  const [saving, setSaving] = useState(false);

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7; // Monday = 0

  const monthLabel = new Date(calendarYear, calendarMonth).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  const goToNextMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));
  const goToToday = () => setCalendarDate(new Date());

  const todayStr = new Date().toDateString();

  const toggleSchedule = async (id: string) => {
    await schedulesApi.toggle(id);
    refreshSchedules();
  };

  const deleteSchedule = async (id: string) => {
    await schedulesApi.remove(id);
    refreshSchedules();
  };

  const openCreateModal = () => {
    setFormName('');
    setFormScriptId(scriptsList?.[0]?.id ?? '');
    setFormDeviceId(devicesList?.[0]?.id ?? '');
    setFormFrequency('daily');
    setFormTime('08:00');
    setFormCron('0 8 * * *');
    setShowCreateModal(true);
  };

  const handleFrequencyChange = (freq: string) => {
    setFormFrequency(freq);
    const [hh, mm] = formTime.split(':');
    switch (freq) {
      case 'once': setFormCron(`${mm} ${hh} * * *`); break;
      case 'hourly': setFormCron(`${mm} * * * *`); break;
      case 'daily': setFormCron(`${mm} ${hh} * * *`); break;
      case 'weekly': setFormCron(`${mm} ${hh} * * 1`); break;
      case 'custom': break; // user edits cron directly
    }
  };

  const handleTimeChange = (time: string) => {
    setFormTime(time);
    if (formFrequency !== 'custom') {
      const [hh, mm] = time.split(':');
      switch (formFrequency) {
        case 'once':
        case 'daily': setFormCron(`${mm} ${hh} * * *`); break;
        case 'hourly': setFormCron(`${mm} * * * *`); break;
        case 'weekly': setFormCron(`${mm} ${hh} * * 1`); break;
      }
    }
  };

  const handleCreateSchedule = async () => {
    if (!formName || !formScriptId || !formDeviceId) return;
    setSaving(true);
    const selectedScript = scriptsList?.find(s => s.id === formScriptId);
    const selectedDevice = devicesList?.find(d => d.id === formDeviceId);
    await schedulesApi.create({
      name: formName,
      scriptId: formScriptId,
      scriptName: selectedScript?.name ?? '',
      targetType: 'device',
      targetId: formDeviceId,
      targetName: selectedDevice?.name ?? '',
      cron: formCron,
      enabled: true,
    });
    setSaving(false);
    setShowCreateModal(false);
    refreshSchedules();
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">L&#7883;ch tr&#236;nh &amp; H&#224;ng &#273;&#7907;i</h1>
          <p className="text-sm text-slate-500">Qu&#7843;n l&#253; th&#7901;i gian ch&#7841;y t&#7921; &#273;&#7897;ng cho c&#225;c k&#7883;ch b&#7843;n tr&#234;n thi&#7871;t b&#7883;</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          T&#7841;o l&#7883;ch tr&#236;nh
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="px-6 border-b border-slate-100 flex gap-6 bg-slate-50/30">
        {[
          { id: 'list', label: 'Danh s\u00e1ch', icon: List },
          { id: 'calendar', label: 'L\u1ecbch bi\u1ec3u', icon: CalendarIcon },
          { id: 'queue', label: 'H\u00e0ng \u0111\u1ee3i', icon: PlaySquare },
          { id: 'history', label: 'L\u1ecbch s\u1eed ch\u1ea1y', icon: History },
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
            {tab.id === 'queue' && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 py-0.5 px-2 rounded-full text-xs">{queueList.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Toolbar (Contextual based on tab) */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="T\u00ecm ki\u1ebfm..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            <Filter size={16} className="text-slate-400" />
            B&#7897; l&#7885;c
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto bg-slate-50/30">

        {/* TAB: LIST */}
        {activeTab === 'list' && (
          schedulesLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="animate-spin mr-2" size={20} /> &#272;ang t&#7843;i...</div>
          ) : (
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
                <th className="py-3 px-6">T&#234;n l&#7883;ch tr&#236;nh</th>
                <th className="py-3 px-4">K&#7883;ch b&#7843;n</th>
                <th className="py-3 px-4">Thi&#7871;t b&#7883; / Nh&#243;m</th>
                <th className="py-3 px-4">T&#7847;n su&#7845;t</th>
                <th className="py-3 px-4">L&#7847;n ch&#7841;y ti&#7871;p</th>
                <th className="py-3 px-4 text-center">B&#7853;t/T&#7855;t</th>
                <th className="py-3 px-6 text-right">Thao t&#225;c</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {scheduleList.map((schedule) => (
                <tr key={schedule.id} className={`hover:bg-slate-50 transition-colors group ${!schedule.enabled ? 'opacity-60' : ''}`}>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${schedule.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                        <CalendarDays size={20} />
                      </div>
                      <span className="font-semibold text-slate-900">{schedule.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-700 font-medium">
                      <Wand2 size={14} className="text-purple-500" /> {schedule.scriptName}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <Smartphone size={14} className="text-slate-400" /> {schedule.targetName}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-sm text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">{schedule.cron}</span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5 text-sm text-blue-600 font-medium">
                      <Clock size={14} /> {formatDate(schedule.nextRun)}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => toggleSchedule(schedule.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${schedule.enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${schedule.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Ch&#7881;nh s&#7917;a">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteSchedule(schedule.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="X&#243;a">
                        <Trash2 size={16} />
                      </button>
                      <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )
        )}

        {/* TAB: CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800" style={{ textTransform: 'capitalize' }}>{monthLabel}</h2>
              <div className="flex items-center gap-2">
                <button onClick={goToPrevMonth} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronLeft size={16} /></button>
                <button onClick={goToToday} className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50">H&#244;m nay</button>
                <button onClick={goToNextMonth} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50"><ChevronRight size={16} /></button>
              </div>
            </div>
            <div className="flex-1 border border-slate-200 rounded-xl overflow-hidden bg-white flex flex-col">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(day => (
                  <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase">{day}</div>
                ))}
              </div>
              <div className="flex-1 grid grid-cols-7 grid-rows-5">
                {Array.from({ length: 35 }).map((_, i) => {
                  const day = i - firstDayOfWeek + 1;
                  const isCurrentMonth = day > 0 && day <= daysInMonth;
                  const cellDate = new Date(calendarYear, calendarMonth, day);
                  const isToday = cellDate.toDateString() === todayStr;

                  // Generate events from active schedules
                  const events: { name: string; time: string; color: string }[] = [];
                  if (isCurrentMonth) {
                    scheduleList.filter(s => s.enabled).forEach((s, sIdx) => {
                      // Simple cron-based display: parse hour/minute from cron
                      const parts = s.cron.split(' ');
                      if (parts.length >= 5) {
                        const cronMin = parts[0];
                        const cronHour = parts[1];
                        const cronDom = parts[2];
                        const cronDow = parts[4];

                        const dayOfWeek = cellDate.getDay(); // 0=Sun
                        let shouldShow = false;

                        // daily: * in dom and dow
                        if (cronDom === '*' && cronDow === '*') shouldShow = true;
                        // specific day of week
                        if (cronDow !== '*') {
                          const dowList = cronDow.split(',').map(Number);
                          if (dowList.includes(dayOfWeek)) shouldShow = true;
                          else shouldShow = false;
                        }
                        // specific day of month
                        if (cronDom !== '*') {
                          const domList = cronDom.split(',').map(Number);
                          if (domList.includes(day)) shouldShow = true;
                          else if (cronDow === '*') shouldShow = false;
                        }

                        if (shouldShow) {
                          const colors = ['blue', 'purple', 'emerald', 'amber', 'rose'];
                          const color = colors[sIdx % colors.length];
                          const timeStr = `${cronHour === '*' ? '**' : cronHour.padStart(2, '0')}:${cronMin === '*' ? '**' : cronMin.padStart(2, '0')}`;
                          events.push({ name: s.name, time: timeStr, color });
                        }
                      }
                    });
                  }

                  // For cells outside the month, show the correct day number
                  let displayDay = day;
                  if (day <= 0) {
                    displayDay = new Date(calendarYear, calendarMonth, day).getDate();
                  } else if (day > daysInMonth) {
                    displayDay = day - daysInMonth;
                  }

                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-700 border-blue-100',
                    purple: 'bg-purple-50 text-purple-700 border-purple-100',
                    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                    amber: 'bg-amber-50 text-amber-700 border-amber-100',
                    rose: 'bg-rose-50 text-rose-700 border-rose-100',
                  };

                  return (
                    <div key={i} className={`border-r border-b border-slate-100 p-2 min-h-[100px] ${!isCurrentMonth ? 'bg-slate-50/50' : ''}`}>
                      <div className={`text-xs font-medium mb-1 ${isToday ? 'w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'}`}>
                        {displayDay}
                      </div>
                      {events.slice(0, 2).map((ev, evIdx) => (
                        <div key={evIdx} className={`mt-1 px-2 py-1 text-[10px] font-medium rounded border truncate ${colorMap[ev.color] ?? colorMap.blue}`}>
                          {ev.time} {ev.name}
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="mt-1 text-[10px] text-slate-400 font-medium">+{events.length - 2} more</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: QUEUE */}
        {activeTab === 'queue' && (
          <div className="p-6">
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                  <PlaySquare size={16} className="text-blue-600" /> K&#7883;ch b&#7843;n &#273;ang ch&#7901; ch&#7841;y
                </h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-md">{queueList.length} trong h&#224;ng &#273;&#7907;i</span>
              </div>
              {historyLoading ? (
                <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="animate-spin mr-2" size={20} /> &#272;ang t&#7843;i...</div>
              ) : queueList.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Kh&#244;ng c&#243; k&#7883;ch b&#7843;n n&#224;o &#273;ang ch&#7841;y</div>
              ) : (
              <div className="divide-y divide-slate-100">
                {queueList.map((item, idx) => (
                  <div key={item.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-mono text-xs font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{item.scriptName}</p>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <Smartphone size={12} /> {item.targetName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs text-slate-500">B&#7855;t &#273;&#7847;u l&#250;c</p>
                        <p className="text-sm font-mono font-medium text-blue-600">{formatTime(item.startedAt)}</p>
                      </div>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="H&#7911;y b&#7887;">
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          historyLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400"><Loader2 className="animate-spin mr-2" size={20} /> &#272;ang t&#7843;i...</div>
          ) : (
          <table className="w-full text-left border-collapse bg-white">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
                <th className="py-3 px-6">K&#7883;ch b&#7843;n</th>
                <th className="py-3 px-4">Thi&#7871;t b&#7883; / Nh&#243;m</th>
                <th className="py-3 px-4">B&#7855;t &#273;&#7847;u</th>
                <th className="py-3 px-4">K&#7871;t th&#250;c</th>
                <th className="py-3 px-4">Th&#7901;i l&#432;&#7907;ng</th>
                <th className="py-3 px-6">Tr&#7841;ng th&#225;i</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyList.map((history) => (
                <tr key={history.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-6 font-medium text-slate-900">{history.scriptName}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{history.targetName}</td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-600">{formatTime(history.startedAt)}</td>
                  <td className="py-3 px-4 text-sm font-mono text-slate-600">{formatTime(history.finishedAt)}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{formatDuration(history.startedAt, history.finishedAt)}</td>
                  <td className="py-3 px-6">
                    {history.status === 'success' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                        <CheckCircle2 size={14} /> Th&#224;nh c&#244;ng
                      </span>
                    ) : history.status === 'running' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                        <Loader2 size={14} className="animate-spin" /> &#272;ang ch&#7841;y
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-medium border border-red-100 w-fit">
                          <XCircle size={14} /> L&#7895;i
                        </span>
                        {history.error && <span className="text-[10px] text-red-500">{history.error}</span>}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )
        )}
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays size={18} className="text-blue-600" /> T&#7841;o l&#7883;ch tr&#236;nh m&#7899;i
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">T&#234;n l&#7883;ch tr&#236;nh</label>
                <input type="text" value={formName} onChange={e => setFormName(e.target.value)} placeholder="V&#237; d&#7909;: C&#224;y view bu&#7893;i t&#7889;i" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ch&#7885;n k&#7883;ch b&#7843;n</label>
                <select value={formScriptId} onChange={e => setFormScriptId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  {(scriptsList ?? []).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Thi&#7871;t b&#7883; / Nh&#243;m th&#7921;c thi</label>
                <select value={formDeviceId} onChange={e => setFormDeviceId(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                  {(devicesList ?? []).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">T&#7847;n su&#7845;t</label>
                  <select value={formFrequency} onChange={e => handleFrequencyChange(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                    <option value="once">Ch&#7841;y 1 l&#7847;n</option>
                    <option value="hourly">H&#224;ng gi&#7901;</option>
                    <option value="daily">H&#224;ng ng&#224;y</option>
                    <option value="weekly">H&#224;ng tu&#7847;n</option>
                    <option value="custom">T&#249;y ch&#7881;nh (Cron)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Th&#7901;i gian b&#7855;t &#273;&#7847;u</label>
                  <input type="time" value={formTime} onChange={e => handleTimeChange(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white" />
                </div>
              </div>

              {/* Advanced Cron Input */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Bi&#7875;u th&#7913;c Cron (N&#226;ng cao)</label>
                <input
                  type="text"
                  value={formCron}
                  onChange={e => setFormCron(e.target.value)}
                  placeholder="0 8 * * *"
                  className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  disabled={formFrequency !== 'custom'}
                />
                <p className="text-[10px] text-slate-400 mt-1">Cron: {formCron}</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl transition-colors">
                H&#7911;y
              </button>
              <button onClick={handleCreateSchedule} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm shadow-blue-200 disabled:opacity-50">
                {saving ? 'Saving...' : 'L\u01b0u l\u1ecbch tr\u00ecnh'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
