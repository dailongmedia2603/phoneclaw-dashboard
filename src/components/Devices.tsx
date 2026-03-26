import { useState, useEffect } from 'react';
import {
  Search, Filter, Plus, Smartphone, Battery, BatteryMedium, BatteryLow,
  Wifi, WifiOff, MoreVertical, CheckSquare, Square, Play, RefreshCw, Camera, FolderPlus, X, ChevronRight,
  MonitorPlay, TerminalSquare, Loader2
} from 'lucide-react';
import { devices as devicesApi, control } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Device, DeviceGroup } from '../types';

export default function Devices() {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: '', tailscaleIp: '', group: '', vncPassword: '' });
  const [adding, setAdding] = useState(false);

  const { data: deviceList, refresh: refreshDevices } = useApi<Device[]>(() => devicesApi.getAll(), []);
  const { data: groupList } = useApi<DeviceGroup[]>(() => devicesApi.getGroups(), []);
  const { on } = useWebSocket();

  useEffect(() => {
    const unsub = on('device:status', () => refreshDevices());
    return unsub;
  }, [on, refreshDevices]);

  const allDevices = deviceList || [];
  const groups = ['Tất cả', ...(groupList || []).map(g => g.name), 'Chưa phân nhóm'];

  const filtered = allDevices.filter(d => {
    if (activeGroup !== 'Tất cả') {
      if (activeGroup === 'Chưa phân nhóm' ? d.group : d.group !== activeGroup) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.tailscaleIp.includes(q);
    }
    return true;
  });

  const toggleSelectAll = () => {
    setSelectedDevices(selectedDevices.length === filtered.length ? [] : filtered.map(d => d.id));
  };

  const toggleSelect = (id: string) => {
    setSelectedDevices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getBatteryIcon = (level: number, status: string) => {
    if (status === 'offline') return <Battery className="text-slate-300" size={16} />;
    if (level <= 20) return <BatteryLow className="text-red-500" size={16} />;
    if (level <= 50) return <BatteryMedium className="text-amber-500" size={16} />;
    return <Battery className="text-emerald-500" size={16} />;
  };

  const formatUptime = (seconds: number) => {
    if (!seconds) return '-';
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  };

  const handleAddDevice = async () => {
    if (!addForm.name || !addForm.tailscaleIp) return;
    setAdding(true);
    await devicesApi.create({
      name: addForm.name,
      tailscaleIp: addForm.tailscaleIp,
      group: addForm.group || '',
      vncPassword: addForm.vncPassword || '',
      vncPort: 5901,
      httpPort: 8080,
    });
    setAdding(false);
    setShowAddModal(false);
    setAddForm({ name: '', tailscaleIp: '', group: '', vncPassword: '' });
    refreshDevices();
  };

  const handleDeleteDevice = async (id: string) => {
    await devicesApi.remove(id);
    setShowDetailModal(null);
    refreshDevices();
  };

  const handleBulkScreenshot = async () => {
    for (const id of selectedDevices) {
      await control.screenshot(id);
    }
  };

  const detailDevice = allDevices.find(d => d.id === showDetailModal);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Quản lý Thiết bị</h1>
          <p className="text-sm text-slate-500">{allDevices.length} thiết bị | {allDevices.filter(d => d.status !== 'offline').length} online</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          Thêm thiết bị
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm thiết bị, IP..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 shadow-sm"
            />
          </div>

          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm overflow-x-auto">
            {groups.map(group => (
              <button
                key={group}
                onClick={() => setActiveGroup(group)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeGroup === group ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            <FolderPlus size={16} className="text-slate-400" />
            Quản lý Nhóm
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDevices.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
              Đã chọn {selectedDevices.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 shadow-sm">
              <MonitorPlay size={14} /> Mở App
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 shadow-sm">
              <TerminalSquare size={14} /> Chạy Kịch bản
            </button>
            <button
              onClick={handleBulkScreenshot}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 shadow-sm"
            >
              <Camera size={14} /> Chụp ảnh
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
              <th className="py-3 pl-6 pr-4 w-12">
                <button onClick={toggleSelectAll} className="text-slate-400 hover:text-blue-600">
                  {selectedDevices.length === filtered.length && filtered.length > 0 ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                </button>
              </th>
              <th className="py-3 px-4">Tên thiết bị</th>
              <th className="py-3 px-4">IP Tailscale</th>
              <th className="py-3 px-4">iOS Version</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Pin</th>
              <th className="py-3 px-4">Uptime</th>
              <th className="py-3 px-4 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-12 text-slate-400">
                  <Smartphone size={32} className="mx-auto mb-2" />
                  <p className="text-sm">{allDevices.length === 0 ? 'Chưa có thiết bị nào' : 'Không tìm thấy thiết bị phù hợp'}</p>
                </td>
              </tr>
            )}
            {filtered.map((device) => (
              <tr
                key={device.id}
                className={`hover:bg-slate-50 transition-colors group cursor-pointer ${selectedDevices.includes(device.id) ? 'bg-blue-50/30' : ''}`}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  setShowDetailModal(device.id);
                }}
              >
                <td className="py-3 pl-6 pr-4">
                  <button onClick={() => toggleSelect(device.id)} className="text-slate-300 hover:text-blue-600">
                    {selectedDevices.includes(device.id) ? <CheckSquare size={18} className="text-blue-600" /> : <Square size={18} />}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${device.status !== 'offline' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{device.name}</div>
                      <div className="text-xs text-slate-500">{device.group || 'Chưa phân nhóm'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="font-mono text-sm text-slate-600">{device.tailscaleIp}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-600">iOS {device.iosVersion}</span>
                </td>
                <td className="py-3 px-4">
                  {device.status === 'online' ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                      <Wifi size={12} /> Online
                    </div>
                  ) : device.status === 'running' ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                      <Play size={12} /> Running
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 text-slate-600 text-xs font-medium border border-slate-200">
                      <WifiOff size={12} /> Offline
                    </div>
                  )}
                  {device.currentScript && (
                    <div className="mt-1 text-[10px] text-blue-600 font-medium flex items-center gap-1">
                      <Play size={10} /> {device.currentScript}
                    </div>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    {getBatteryIcon(device.battery, device.status)}
                    {device.status !== 'offline' ? `${device.battery}%` : '-'}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm text-slate-600">{formatUptime(device.uptime)}</span>
                </td>
                <td className="py-3 px-4 text-right pr-6">
                  <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Device Modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Thêm thiết bị mới</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên thiết bị</label>
                <input
                  type="text"
                  placeholder="Ví dụ: iPhone 13 Pro - 01"
                  value={addForm.name}
                  onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">IP Tailscale</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 100.96.65.5"
                  value={addForm.tailscaleIp}
                  onChange={e => setAddForm(p => ({ ...p, tailscaleIp: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nhóm (tuỳ chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: TikTok Farm"
                  value={addForm.group}
                  onChange={e => setAddForm(p => ({ ...p, group: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu VNC (tuỳ chọn)</label>
                <input
                  type="password"
                  placeholder="Mật khẩu truy cập thiết bị"
                  value={addForm.vncPassword}
                  onChange={e => setAddForm(p => ({ ...p, vncPassword: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-xs text-slate-400 mt-1">Mật khẩu Full-access trong PhoneClaw VNC trên thiết bị</p>
              </div>
              <button
                onClick={handleAddDevice}
                disabled={adding || !addForm.name || !addForm.tailscaleIp}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {adding && <Loader2 size={16} className="animate-spin" />}
                Thêm thiết bị
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Details Modal */}
      {showDetailModal && detailDevice && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Smartphone size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{detailDevice.name}</h2>
                  <div className="flex items-center gap-2 text-xs font-medium">
                    {detailDevice.status !== 'offline' ? (
                      <span className="text-emerald-600 flex items-center gap-1"><Wifi size={12} /> Online</span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1"><WifiOff size={12} /> Offline</span>
                    )}
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-500">{detailDevice.group || 'Chưa phân nhóm'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left: Live VNC Screen */}
              <div className="w-[360px] border-r border-slate-100 bg-slate-900 flex flex-col">
                {detailDevice.status !== 'offline' ? (
                  <>
                    <iframe
                      src={`/vnc/${detailDevice.id}/vnc_lite.html?autoconnect=true&resize=scale&reconnect=true&path=vnc/${detailDevice.id}/websockify${detailDevice.vncPassword ? '&password=' + encodeURIComponent(detailDevice.vncPassword) : ''}`}
                      className="flex-1 w-full border-0"
                      allow="clipboard-read; clipboard-write"
                    />
                    <div className="bg-slate-800 px-3 py-2 flex items-center justify-between">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MonitorPlay size={12} className="text-emerald-400" /> Live VNC
                      </p>
                      <a
                        href={`/vnc/${detailDevice.id}/vnc.html?autoconnect=true&path=vnc/${detailDevice.id}/websockify${detailDevice.vncPassword ? '&password=' + encodeURIComponent(detailDevice.vncPassword) : ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:text-blue-300"
                      >
                        Mở toàn màn hình
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                    <WifiOff size={32} className="mb-2" />
                    <span className="text-sm">Thiết bị offline</span>
                  </div>
                )}
              </div>

              {/* Right: Info & Controls */}
              <div className="flex-1 p-6 overflow-y-auto">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Thông tin hệ thống</h3>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">IP Tailscale</p>
                    <p className="font-mono text-sm font-medium text-slate-900">{detailDevice.tailscaleIp}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Phiên bản iOS</p>
                    <p className="text-sm font-medium text-slate-900">{detailDevice.iosVersion}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Pin</p>
                    <p className="text-sm font-medium text-slate-900 flex items-center gap-1.5">
                      {getBatteryIcon(detailDevice.battery, detailDevice.status)}
                      {detailDevice.battery}%
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Uptime</p>
                    <p className="text-sm font-medium text-slate-900">{formatUptime(detailDevice.uptime)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Model</p>
                    <p className="text-sm font-medium text-slate-900">{detailDevice.model}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">VNC Port</p>
                    <p className="font-mono text-sm font-medium text-slate-900">{detailDevice.vncPort}</p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Điều khiển thiết bị</h3>
                <div className="grid grid-cols-2 gap-3 mb-8">
                  <button
                    onClick={() => control.key(detailDevice.id, 'home')}
                    className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                  >
                    <MonitorPlay size={18} className="text-blue-500" /> Nút Home
                  </button>
                  <button
                    onClick={() => control.screenshot(detailDevice.id)}
                    className="flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                  >
                    <Camera size={18} className="text-emerald-500" /> Chụp màn hình
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleDeleteDevice(detailDevice.id)}
                    className="text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    Xoá thiết bị khỏi hệ thống
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
