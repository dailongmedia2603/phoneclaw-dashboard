import { useState, useEffect } from 'react';
import {
  Search, Plus, Smartphone, Battery, BatteryMedium, BatteryLow,
  Wifi, WifiOff, CheckSquare, Square, Play, Camera, FolderPlus, X,
  MonitorPlay, TerminalSquare, Loader2, Edit, Trash2, ArrowUpCircle
} from 'lucide-react';
import { devices as devicesApi, control, packages as packagesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import { showToast } from './Toast';
import type { Device, DeviceGroup, Package } from '../types';
import CustomSelect from './CustomSelect';

export default function Devices() {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [activeGroup, setActiveGroup] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ name: '', tailscaleIp: '', group: '', vncPassword: '', account: '' });
  const [adding, setAdding] = useState(false);
  const [showEditModal, setShowEditModal] = useState<Device | null>(null);
  const [editForm, setEditForm] = useState({ name: '', tailscaleIp: '', group: '', vncPassword: '', account: '' });
  const [editing, setEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Device | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showAddGroupModal, setShowAddGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [addingGroup, setAddingGroup] = useState(false);

  const { user: authUser } = useAuth();
  const { data: deviceList, refresh: refreshDevices } = useApi<Device[]>(() => devicesApi.getAll(), []);
  const { data: groupList, refresh: refreshGroups } = useApi<DeviceGroup[]>(() => devicesApi.getGroups(), []);
  const { data: packageList } = useApi<Package[]>(() => packagesApi.getAll(), []);
  const { on } = useWebSocket();

  const allPackages = packageList || [];
  const currentPkg = authUser?.packageId ? allPackages.find(p => p.id === authUser.packageId) : null;
  const userDeviceCount = (deviceList || []).length;
  const isAtLimit = !!(currentPkg && userDeviceCount >= currentPkg.maxDevices);

  useEffect(() => {
    const unsub = on('device:status', () => refreshDevices());
    return unsub;
  }, [on, refreshDevices]);

  const allDevices = deviceList || [];
  const groups = ['Tất cả', ...(groupList || []).map(g => g.name), 'Chưa phân nhóm'];

  const filtered = allDevices.filter(d => {
    if (activeGroup !== 'Tất cả') {
      if (activeGroup === 'Chưa phân nhóm') {
        if (d.group && d.group !== '') return false;
      } else {
        if (d.group !== activeGroup) return false;
      }
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

  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;
    setAddingGroup(true);
    await devicesApi.createGroup(newGroupName.trim(), '#f86a06');
    refreshGroups();
    setShowAddGroupModal(false);
    setAddingGroup(false);
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
    try {
      await devicesApi.create({
        name: addForm.name,
        tailscaleIp: addForm.tailscaleIp,
        group: addForm.group || '',
        vncPassword: addForm.vncPassword || '',
        account: addForm.account || '',
        vncPort: 5901,
        httpPort: 8080,
      });
      setShowAddModal(false);
      setAddForm({ name: '', tailscaleIp: '', group: '', vncPassword: '', account: '' });
      refreshDevices();
      showToast('success', 'Thêm thiết bị thành công');
      // Auto-refresh after 5s to update connecting → online/offline
      setTimeout(() => refreshDevices(), 5000);
    } catch {
      showToast('error', 'Thêm thiết bị thất bại');
    }
    setAdding(false);
  };

  const handleOpenEdit = (device: Device) => {
    setEditForm({
      name: device.name,
      tailscaleIp: device.tailscaleIp,
      group: device.group,
      vncPassword: device.vncPassword || '',
      account: device.account || '',
    });
    setShowEditModal(device);
  };

  const handleEditDevice = async () => {
    if (!showEditModal || !editForm.name || !editForm.tailscaleIp) return;
    setEditing(true);
    try {
      await devicesApi.update(showEditModal.id, {
        name: editForm.name,
        tailscaleIp: editForm.tailscaleIp,
        group: editForm.group,
        vncPassword: editForm.vncPassword,
        account: editForm.account,
      });
      setShowEditModal(null);
      refreshDevices();
      showToast('success', 'Cập nhật thiết bị thành công');
    } catch {
      showToast('error', 'Cập nhật thiết bị thất bại');
    }
    setEditing(false);
  };

  const handleDeleteDevice = async () => {
    if (!showDeleteConfirm) return;
    setDeleting(true);
    try {
      await devicesApi.remove(showDeleteConfirm.id);
      setShowDeleteConfirm(null);
      setShowDetailModal(null);
      refreshDevices();
      showToast('success', 'Xoá thiết bị thành công');
    } catch {
      showToast('error', 'Xoá thiết bị thất bại');
    }
    setDeleting(false);
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

      {/* Quota Banner (user with package) */}
      {currentPkg && (
        <div className="px-6 py-3 border-b border-blue-100 bg-blue-50/80 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-blue-700">{currentPkg.name} — {currentPkg.maxDevices} thiết bị</p>
              <p className="text-xs text-blue-500">Đã kết nối: {userDeviceCount}/{currentPkg.maxDevices}</p>
            </div>
            <div className="w-24 bg-blue-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${isAtLimit ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${Math.min(Math.round((userDeviceCount / currentPkg.maxDevices) * 100), 100)}%` }}
              />
            </div>
          </div>
          {isAtLimit && (
            <button
              onClick={async () => {
                const res = await packagesApi.requestUpgrade();
                if (res.success) showToast('success', 'Đã gửi yêu cầu nâng cấp tới admin');
                else showToast('error', 'Gửi yêu cầu thất bại');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <ArrowUpCircle size={14} /> Yêu cầu nâng cấp
            </button>
          )}
        </div>
      )}

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
          <button
            onClick={() => { setShowAddGroupModal(true); setNewGroupName(''); }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
          >
            <FolderPlus size={16} className="text-slate-400" />
            Thêm nhóm
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
              <th className="py-3 px-4">Tài khoản</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
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
                  <span className="text-sm text-slate-600">{device.account || '-'}</span>
                </td>
                <td className="py-3 px-4">
                  {device.status === 'connecting' ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-medium border border-blue-100">
                      <Loader2 size={12} className="animate-spin" /> Đang kết nối
                    </div>
                  ) : device.status === 'online' ? (
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
                  {device.proxyStatus === 'running' && (
                    <div className="mt-1 text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                      <Wifi size={10} /> Proxy US
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenEdit(device); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(device); }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xoá"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
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
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên thiết bị <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="text" placeholder="Ví dụ: iPhone 13 Pro - 01" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">IP Tailscale <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="text" placeholder="Ví dụ: 100.96.65.5" value={addForm.tailscaleIp} onChange={e => setAddForm(p => ({ ...p, tailscaleIp: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu VNC <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="password" placeholder="Mật khẩu truy cập thiết bị" value={addForm.vncPassword} onChange={e => setAddForm(p => ({ ...p, vncPassword: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
                <p className="text-xs text-slate-400 mt-1">Mật khẩu Full-access trong Phone Agent trên thiết bị</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tài khoản (tuỳ chọn)</label>
                <input type="text" placeholder="Ví dụ: @tiktok_user_01" value={addForm.account || ''} onChange={e => setAddForm(p => ({ ...p, account: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nhóm (tuỳ chọn)</label>
                <CustomSelect
                  value={addForm.group}
                  onChange={v => setAddForm(p => ({ ...p, group: v }))}
                  options={[{ value: '', label: 'Chưa phân nhóm' }, ...(groupList || []).map(g => ({ value: g.name, label: g.name }))]}
                  placeholder="Chọn nhóm..."
                />
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
                      src={`/api/vnc-viewer/${detailDevice.id}?token=${localStorage.getItem('phoneclaw_token') || ''}`}
                      className="flex-1 w-full border-0"
                      allow="clipboard-read; clipboard-write"
                    />
                    <div className="bg-slate-800 px-3 py-2 flex items-center justify-between">
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MonitorPlay size={12} className="text-emerald-400" /> Live VNC
                      </p>
                      <a
                        href={`/api/vnc-viewer/${detailDevice.id}?token=${localStorage.getItem('phoneclaw_token') || ''}`}
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
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f86a06" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                      IP Tailscale
                    </p>
                    <p className="font-mono text-sm font-medium text-slate-900">{detailDevice.tailscaleIp}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f86a06" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      Phiên bản iOS
                    </p>
                    <p className="text-sm font-medium text-slate-900">{detailDevice.iosVersion}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f86a06" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      Model
                    </p>
                    <p className="text-sm font-medium text-slate-900">{detailDevice.model}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f86a06" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                      VNC Port
                    </p>
                    <p className="font-mono text-sm font-medium text-slate-900">{detailDevice.vncPort}</p>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Điều khiển thiết bị</h3>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <button
                    onClick={() => control.key(detailDevice.id, 'home')}
                    className="flex flex-col items-center gap-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><circle cx="12" cy="16" r="1.5"/></svg>
                    Home
                  </button>
                  <button
                    onClick={() => control.swipe(detailDevice.id, 0.5, 0.0, 0.5, 0.8, 0.5)}
                    className="flex flex-col items-center gap-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                    Trên xuống
                  </button>
                  <button
                    onClick={() => control.swipe(detailDevice.id, 0.5, 0.999, 0.5, 0.2, 0.8)}
                    className="flex flex-col items-center gap-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>
                    Dưới lên
                  </button>
                  <button
                    onClick={() => control.swipe(detailDevice.id, 0.95, 0.5, 0.05, 0.5, 0.3)}
                    className="flex flex-col items-center gap-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Lướt trái
                  </button>
                  <button
                    onClick={() => control.swipe(detailDevice.id, 0.05, 0.5, 0.95, 0.5, 0.3)}
                    className="flex flex-col items-center gap-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    Lướt phải
                  </button>
                  <button
                    onClick={() => control.screenshot(detailDevice.id)}
                    className="flex flex-col items-center gap-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-600 transition-colors"
                  >
                    <Camera size={18} />
                    Chụp ảnh
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => handleOpenEdit(detailDevice)}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    <Edit size={14} /> Sửa thông tin
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(detailDevice)}
                    className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 font-medium"
                  >
                    <Trash2 size={14} /> Xoá thiết bị
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Edit Device Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900">Sửa thiết bị</h2>
              <button onClick={() => setShowEditModal(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên thiết bị <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">IP Tailscale <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="text" value={editForm.tailscaleIp} onChange={e => setEditForm(p => ({ ...p, tailscaleIp: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu VNC <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="password" value={editForm.vncPassword} onChange={e => setEditForm(p => ({ ...p, vncPassword: e.target.value }))} placeholder="Để trống nếu không đổi" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tài khoản (tuỳ chọn)</label>
                <input type="text" value={editForm.account} onChange={e => setEditForm(p => ({ ...p, account: e.target.value }))} placeholder="VD: @tiktok_user_01" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Nhóm (tuỳ chọn)</label>
                <CustomSelect
                  value={editForm.group}
                  onChange={v => setEditForm(p => ({ ...p, group: v }))}
                  options={[{ value: '', label: 'Chưa phân nhóm' }, ...(groupList || []).map(g => ({ value: g.name, label: g.name }))]}
                  placeholder="Chọn nhóm..."
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowEditModal(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                  Huỷ
                </button>
                <button onClick={handleEditDevice} disabled={editing || !editForm.name || !editForm.tailscaleIp} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  {editing && <Loader2 size={16} className="animate-spin" />}
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-6">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Xoá thiết bị?</h3>
              <p className="text-sm text-slate-500 mb-1">
                Bạn có chắc muốn xoá <span className="font-semibold text-slate-700">{showDeleteConfirm.name}</span>?
              </p>
              <p className="text-xs text-slate-400">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                Huỷ
              </button>
              <button onClick={handleDeleteDevice} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {deleting && <Loader2 size={16} className="animate-spin" />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Group Modal */}
      {showAddGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus size={18} className="text-blue-600" /> Thêm nhóm
              </h2>
              <button onClick={() => setShowAddGroupModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên nhóm</label>
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                placeholder="VD: TikTok Farm, Facebook Team..."
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowAddGroupModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl">
                Huỷ
              </button>
              <button
                onClick={handleAddGroup}
                disabled={addingGroup || !newGroupName.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors"
              >
                {addingGroup ? 'Đang lưu...' : 'Tạo nhóm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
