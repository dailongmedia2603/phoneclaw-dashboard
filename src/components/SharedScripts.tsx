import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Play, Download, Upload, Edit, Trash2,
  Clock, Search, List, Loader2, X
} from 'lucide-react';
import { sharedScripts as sharedApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { showToast } from './Toast';
import type { Script, Device } from '../types';

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Vừa xong';
  if (m < 60) return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

const tiktokSvg = <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2 6.34 6.34 0 0 0 9.49 21.5a6.34 6.34 0 0 0 6.34-6.34V8.71a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/></svg>;

export default function SharedScripts() {
  const navigate = useNavigate();
  const [activeAppTab, setActiveAppTab] = useState('tiktok_vn');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: scriptsList, loading, refresh } = useApi<Script[]>(() => sharedApi.getAll(), []);
  const scriptsData = scriptsList || [];

  const APP_TABS = [
    { id: 'tiktok_vn', label: 'TikTok Việt', icon: tiktokSvg, color: 'bg-black text-white' },
    { id: 'tiktok_us', label: 'TikTok US', icon: tiktokSvg, color: 'bg-[#2563eb] text-white' },
    { id: 'facebook', label: 'Facebook', icon: <span className="text-xs font-bold">f</span>, color: 'bg-[#1877f2] text-white' },
  ];

  const filteredScripts = scriptsData.filter(s => {
    if ((s.channel || 'tiktok_vn') !== activeAppTab) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await sharedApi.remove(deleteConfirm);
    setDeleteConfirm(null);
    refresh();
    showToast('success', 'Đã xoá kịch bản');
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Kho kịch bản</h1>
          <p className="text-sm text-slate-500">Kịch bản mẫu có sẵn, chia sẻ cho tất cả người dùng</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <Upload size={18} className="text-slate-400" />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <Download size={18} className="text-slate-400" />
            Export
          </button>
          <button
            onClick={() => navigate('/kho-kich-ban/tao-moi')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
          >
            <Plus size={18} />
            Tạo kịch bản
          </button>
        </div>
      </div>

      {/* App Tabs */}
      <div className="px-6 border-b border-slate-100 flex gap-1 bg-slate-50/30 pt-2">
        {APP_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveAppTab(tab.id)}
            className={`flex items-center gap-2.5 px-5 py-3 text-sm font-medium rounded-t-xl transition-colors ${
              activeAppTab === tab.id
                ? 'bg-white text-slate-900 border border-slate-200 border-b-white -mb-px shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <span className={`w-6 h-6 rounded-lg ${tab.color} flex items-center justify-center`}>
              {tab.icon}
            </span>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeAppTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {scriptsData.filter(s => (s.channel || 'tiktok_vn') === tab.id).length}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm kịch bản..."
            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-72 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            <Loader2 size={24} className="animate-spin mr-2" /> Đang tải...
          </div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
              <th className="py-3 px-6">Tên kịch bản</th>
              <th className="py-3 px-4 max-w-[200px]">Mô tả</th>
              <th className="py-3 px-4 whitespace-nowrap">Số bước</th>
              <th className="py-3 px-4 whitespace-nowrap">Ngày tạo</th>
              <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredScripts.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-16 text-slate-400">
                  <List size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Chưa có kịch bản mẫu nào</p>
                </td>
              </tr>
            )}
            {filteredScripts.map((script) => (
              <tr key={script.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <span className="font-semibold text-slate-900">{script.name}</span>
                </td>
                <td className="py-4 px-4 max-w-[200px]">
                  <span className="text-sm text-slate-600 line-clamp-1">{script.description}</span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <List size={14} className="text-slate-400" /> {script.steps?.length || 0} bước
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" /> {script.createdAt ? getTimeAgo(script.createdAt) : '-'}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Sẵn sàng
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => navigate(`/kho-kich-ban/${script.id}`)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(script.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        )}
      </div>

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Xoá kịch bản mẫu?</h3>
              <p className="text-sm text-slate-500">Kịch bản sẽ bị xoá khỏi kho và không thể hoàn tác.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">
                Huỷ
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl">
                Xác nhận xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
