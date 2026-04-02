import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wand2, Plus, Play, Download, Upload, Edit, Trash2,
  Clock, Smartphone, FileJson, Search,
  X, Save, Code, List, ChevronRight, GripVertical,
  MousePointer2, Timer, Repeat, Variable, CheckSquare,
  Copy, Check
} from 'lucide-react';
import { scripts as scriptsApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Script, Device } from '../types';
import { showToast } from './Toast';

const COMMAND_CATEGORIES = [
  {
    id: 'actions',
    name: 'Hành động',
    icon: MousePointer2,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50',
    commands: [
      { name: 'tap(x, y)', desc: 'Tap tại tọa độ (0-1)' },
      { name: 'swipe(x1, y1, x2, y2, t)', desc: 'Vuốt màn hình' },
      { name: 'type("text")', desc: 'Gõ bàn phím' },
      { name: 'key(btn)', desc: 'Nút cứng (home/back/power)' },
      { name: 'launch("id")', desc: 'Mở ứng dụng' },
      { name: 'screenshot()', desc: 'Chụp màn hình' },
      { name: 'clipboard("text")', desc: 'Đặt clipboard' },
    ]
  },
  {
    id: 'time',
    name: 'Thời gian',
    icon: Timer,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50',
    commands: [
      { name: 'wait(s)', desc: 'Đợi N giây' },
      { name: 'wait_random(min, max)', desc: 'Đợi ngẫu nhiên' },
    ]
  },
  {
    id: 'logic',
    name: 'Logic',
    icon: Repeat,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50',
    commands: [
      { name: 'repeat(N)', desc: 'Lặp lại N lần' },
      { name: 'repeat_forever', desc: 'Lặp vô hạn' },
      { name: 'if_screen_match("img")', desc: 'So sánh ảnh mẫu' },
      { name: 'if_elapsed(s)', desc: 'Thoát sau N giây' },
    ]
  },
  {
    id: 'vars',
    name: 'Biến số',
    icon: Variable,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50',
    commands: [
      { name: 'set(name, val)', desc: 'Đặt biến' },
      { name: 'random_text(len)', desc: 'Text ngẫu nhiên' },
      { name: 'random_int(min, max)', desc: 'Số ngẫu nhiên' },
      { name: 'counter++', desc: 'Tăng biến đếm' },
    ]
  }
];

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

export default function Scripts() {
  const navigate = useNavigate();
  const [activeAppTab, setActiveAppTab] = useState('tiktok_vn');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [showRunModal, setShowRunModal] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [editorName, setEditorName] = useState('');
  const [editorDescription, setEditorDescription] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [deviceDropdownOpen, setDeviceDropdownOpen] = useState(false);
  const [runLoading, setRunLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [runningExecution, setRunningExecution] = useState<any>(null);
  const [pollingTimer, setPollingTimer] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportSelected, setExportSelected] = useState<string[]>([]);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [importLoading, setImportLoading] = useState(false);

  const { data: scriptsList, loading, error, refresh } = useApi<Script[]>(() => scriptsApi.getAll(), []);
  const { data: devicesList } = useApi<Device[]>(() => devicesApi.getAll(), []);

  const scriptsData = scriptsList || [];
  const devicesData = devicesList || [];

  const tiktokSvg = <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2 6.34 6.34 0 0 0 9.49 21.5a6.34 6.34 0 0 0 6.34-6.34V8.71a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.14z"/></svg>;

  const APP_TABS = [
    { id: 'tiktok_vn', label: 'TikTok Việt', icon: tiktokSvg, color: 'bg-black text-white', bundleId: 'com.ss.iphone.ugc.Ame' },
    { id: 'tiktok_us', label: 'TikTok US', icon: tiktokSvg, color: 'bg-[#2563eb] text-white', bundleId: 'com.zhiliaoapp.musically' },
    { id: 'facebook', label: 'Facebook', icon: <span className="text-xs font-bold">f</span>, color: 'bg-[#1877f2] text-white', bundleId: 'com.facebook.Facebook' },
  ];

  // Filter by channel + search query
  const filteredScripts = scriptsData.filter(s => {
    if ((s.channel || 'tiktok_vn') !== activeAppTab) return false;
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleCreateNew = () => {
    navigate('/kich-ban/tao-moi');
  };

  const handleEdit = (script: Script) => {
    navigate(`/kich-ban/${script.id}`);
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      if (editingScript) {
        await scriptsApi.update(editingScript.id, { name: editorName, description: editorDescription });
      } else {
        await scriptsApi.create({ name: editorName, description: editorDescription, steps: [], status: 'draft' });
      }
      setShowEditor(false);
      setEditingScript(null);
      refresh();
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await scriptsApi.remove(id);
    refresh();
  };

  const stopPolling = () => {
    if (pollingTimer) { clearInterval(pollingTimer); setPollingTimer(null); }
  };

  const startPolling = () => {
    stopPolling();
    const timer = setInterval(async () => {
      const res = await scriptsApi.getLatestExecution();
      if (res.success && res.data) {
        setRunningExecution(res.data);
        if (res.data.status !== 'running') {
          stopPolling();
          setRunLoading(false);
          refresh();
        }
      }
    }, 2000);
    setPollingTimer(timer);
  };

  const handleRun = async () => {
    if (!showRunModal || selectedDeviceIds.length === 0) return;
    setRunLoading(true);
    setRunningExecution(null);
    for (const deviceId of selectedDeviceIds) {
      await scriptsApi.run(showRunModal, deviceId);
    }
    // Start polling for execution status
    startPolling();
  };

  const handleStop = async () => {
    if (!showRunModal || !runningExecution?.id) return;
    await scriptsApi.stop(showRunModal, runningExecution.id);
    stopPolling();
    setRunLoading(false);
    setRunningExecution(null);
    showToast('success', 'Đã dừng kịch bản');
  };

  const handleOpenRunModal = (scriptId: string) => {
    setSelectedDeviceIds([]);
    setDeviceDropdownOpen(false);
    setShowRunModal(scriptId);
  };

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
  };

  // --- Export ---
  const handleExport = () => {
    const selected = scriptsData.filter(s => exportSelected.includes(s.id));
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      scripts: selected.map(s => ({
        name: s.name,
        description: s.description,
        channel: s.channel,
        graphData: s.graphData,
        steps: s.steps,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phoneclaw-scripts-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    setExportSelected([]);
    showToast('success', `Đã export ${selected.length} kịch bản`);
  };

  const toggleExportSelect = (id: string) => {
    setExportSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleExportAll = () => {
    setExportSelected(prev => prev.length === scriptsData.length ? [] : scriptsData.map(s => s.id));
  };

  // --- Import ---
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImportLoading(true);
      try {
        const text = await file.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          showToast('error', 'File không đúng định dạng JSON');
          return;
        }

        if (!data.version || !Array.isArray(data.scripts) || data.scripts.length === 0) {
          showToast('error', 'File không đúng định dạng PhoneClaw hoặc không có kịch bản nào');
          return;
        }

        for (const s of data.scripts) {
          if (!s.name || !Array.isArray(s.steps)) {
            showToast('error', `Kịch bản "${s.name || 'không tên'}" không hợp lệ`);
            return;
          }
        }

        let created = 0;
        for (const s of data.scripts) {
          await scriptsApi.create({
            name: s.name,
            description: s.description || '',
            channel: s.channel || 'tiktok_vn',
            graphData: s.graphData,
            steps: s.steps,
          });
          created++;
        }

        showToast('success', `Đã import ${created} kịch bản thành công`);
        refresh();
      } catch (err) {
        showToast('error', 'Lỗi import: ' + (err instanceof Error ? err.message : 'Không xác định'));
      } finally {
        setImportLoading(false);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Quản lý Kịch bản</h1>
          <p className="text-sm text-slate-500">Tạo, chỉnh sửa và phân bổ kịch bản tự động hóa cho thiết bị</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleImport}
            disabled={importLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
          >
            <Upload size={18} className="text-slate-400" />
            {importLoading ? 'Đang import...' : 'Import'}
          </button>
          <button
            onClick={() => { setExportSelected([]); setShowExportModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
          >
            <Download size={18} className="text-slate-400" />
            Export
          </button>
          <button
            onClick={handleCreateNew}
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

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
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
          <div className="flex items-center justify-center h-full text-slate-400">Đang tải...</div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-red-500">{error}</div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
              <th className="py-3 px-6">Tên kịch bản</th>
              <th className="py-3 px-4 max-w-[200px]">Mô tả</th>
              <th className="py-3 px-4 whitespace-nowrap">Số bước</th>
              <th className="py-3 px-4 whitespace-nowrap">Chạy gần nhất</th>
              <th className="py-3 px-4 whitespace-nowrap">Trạng thái</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredScripts.map((script) => (
              <tr key={script.id} className="hover:bg-slate-50 transition-colors group">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Wand2 size={20} />
                    </div>
                    <span className="font-semibold text-slate-900">{script.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 max-w-[200px]">
                  <span className="text-sm text-slate-600 line-clamp-1">{script.description}</span>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <List size={14} className="text-slate-400" /> {script.steps.length} bước
                  </div>
                </td>
                <td className="py-4 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" /> {script.lastRun ? getTimeAgo(script.lastRun) : 'Chưa chạy'}
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
                      onClick={() => handleOpenRunModal(script.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Play size={14} fill="currentColor" /> Chạy
                    </button>
                    <button
                      onClick={() => handleEdit(script)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(script.id)}
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

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full h-full max-w-7xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Editor Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <Wand2 size={20} />
                </div>
                <div>
                  <input
                    type="text"
                    value={editorName}
                    onChange={(e) => setEditorName(e.target.value)}
                    placeholder="Tên kịch bản"
                    className="text-lg font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-64"
                  />
                  <input
                    type="text"
                    value={editorDescription}
                    onChange={(e) => setEditorDescription(e.target.value)}
                    placeholder="Mô tả kịch bản"
                    className="text-sm text-slate-500 bg-transparent border-none focus:outline-none focus:ring-0 p-0 w-96 mt-0.5"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-200/50 p-1 rounded-lg mr-4">
                  <button
                    onClick={() => setEditorMode('visual')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editorMode === 'visual' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <List size={16} /> Visual
                  </button>
                  <button
                    onClick={() => setEditorMode('code')}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${editorMode === 'code' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Code size={16} /> Code
                  </button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
                  <FileJson size={16} /> Xuất JSON
                </button>
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm disabled:opacity-50"
                >
                  <Save size={16} /> {saveLoading ? 'Đang lưu...' : 'Lưu kịch bản'}
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button onClick={() => { setShowEditor(false); setEditingScript(null); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Editor Body */}
            <div className="flex-1 flex overflow-hidden">
              {/* Left Sidebar: Commands Palette */}
              <div className="w-72 border-r border-slate-200 bg-slate-50/50 flex flex-col">
                <div className="p-4 border-b border-slate-200 font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Plus size={16} className="text-blue-600" /> Thêm hành động
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {COMMAND_CATEGORIES.map(category => (
                    <div key={category.id}>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
                        <category.icon size={12} /> {category.name}
                      </h3>
                      <div className="space-y-1">
                        {category.commands.map((cmd, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col p-2 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all group"
                          >
                            <span className={`text-sm font-mono font-medium ${category.color}`}>{cmd.name}</span>
                            <span className="text-xs text-slate-500 mt-0.5">{cmd.desc}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Area: Workspace */}
              <div className="flex-1 bg-slate-100/50 overflow-y-auto p-6">
                {editorMode === 'visual' ? (
                  <div className="max-w-3xl mx-auto space-y-3">
                    {/* Visual Builder Mock */}
                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex">
                      <div className="w-10 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-3 text-slate-400 cursor-grab">
                        <GripVertical size={16} />
                        <span className="text-xs font-mono mt-2">1</span>
                      </div>
                      <div className="flex-1 p-4 flex items-center gap-3">
                        <div className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md font-mono text-sm font-semibold">launch</div>
                        <span className="text-slate-400 text-sm">app:</span>
                        <input type="text" defaultValue="com.zhiliaoapp.musically" className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex">
                      <div className="w-10 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-3 text-slate-400 cursor-grab">
                        <GripVertical size={16} />
                        <span className="text-xs font-mono mt-2">2</span>
                      </div>
                      <div className="flex-1 p-4 flex items-center gap-3">
                        <div className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md font-mono text-sm font-semibold">wait</div>
                        <span className="text-slate-400 text-sm">seconds:</span>
                        <input type="number" defaultValue="3" className="w-20 bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-blue-500" />
                      </div>
                    </div>

                    {/* Block Loop */}
                    <div className="bg-white border border-purple-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
                      <div className="flex border-b border-purple-100 bg-purple-50/30">
                        <div className="w-10 bg-purple-50 border-r border-purple-100 flex flex-col items-center py-3 text-purple-400 cursor-grab">
                          <GripVertical size={16} />
                          <span className="text-xs font-mono mt-2">3</span>
                        </div>
                        <div className="flex-1 p-4 flex items-center gap-3">
                          <div className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-md font-mono text-sm font-semibold">repeat</div>
                          <span className="text-slate-400 text-sm">times:</span>
                          <input type="number" defaultValue="50" className="w-20 bg-white border border-purple-200 rounded-md px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-purple-500" />
                        </div>
                      </div>

                      {/* Nested Steps */}
                      <div className="pl-14 pr-4 py-4 space-y-3 bg-purple-50/10 border-l-4 border-purple-300 ml-10 my-2">
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex items-center p-3 gap-3">
                          <div className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-mono text-xs font-semibold">swipe</div>
                          <input type="text" defaultValue="0.5, 0.8, 0.5, 0.2, 0.3" className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-sm font-mono focus:outline-none focus:border-blue-500" />
                          <span className="text-xs text-slate-400 italic">// lướt video</span>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex items-center p-3 gap-3">
                          <div className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md font-mono text-xs font-semibold">wait_random</div>
                          <input type="text" defaultValue="3, 8" className="w-32 bg-slate-50 border border-slate-200 rounded-md px-3 py-1 text-sm font-mono focus:outline-none focus:border-blue-500" />
                          <span className="text-xs text-slate-400 italic">// xem video 3-8s</span>
                        </div>

                        {/* Nested If */}
                        <div className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
                          <div className="flex items-center p-3 gap-3 bg-amber-50/30 border-b border-amber-100">
                            <div className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-mono text-xs font-semibold">if</div>
                            <input type="text" defaultValue="random_int(1, 5) == 1" className="flex-1 bg-white border border-amber-200 rounded-md px-3 py-1 text-sm font-mono focus:outline-none focus:border-amber-500" />
                            <span className="text-xs text-slate-400 italic">// 20% xác suất like</span>
                          </div>
                          <div className="pl-6 pr-3 py-3 space-y-2 bg-amber-50/10 border-l-2 border-amber-300 ml-4 my-2">
                            <div className="bg-white border border-slate-200 rounded-lg flex items-center p-2 gap-2">
                              <div className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-mono text-xs font-semibold">tap</div>
                              <input type="text" defaultValue="0.95, 0.45" className="w-32 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none" />
                            </div>
                            <div className="bg-white border border-slate-200 rounded-lg flex items-center p-2 gap-2">
                              <div className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded font-mono text-xs font-semibold">wait</div>
                              <input type="text" defaultValue="0.5" className="w-20 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono focus:outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex">
                      <div className="w-10 bg-slate-50 border-r border-slate-100 flex flex-col items-center py-3 text-slate-400 cursor-grab">
                        <GripVertical size={16} />
                        <span className="text-xs font-mono mt-2">4</span>
                      </div>
                      <div className="flex-1 p-4 flex items-center gap-3">
                        <div className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-md font-mono text-sm font-semibold">screenshot</div>
                        <span className="text-slate-400 text-sm italic">// Chụp và lưu ảnh</span>
                      </div>
                    </div>

                    {/* Add Step Button */}
                    <button className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                      <Plus size={18} /> Thêm bước mới
                    </button>
                  </div>
                ) : (
                  <div className="h-full bg-[#1E1E1E] rounded-xl p-4 overflow-hidden flex flex-col shadow-inner">
                    <div className="flex items-center justify-between mb-2 px-2">
                      <span className="text-slate-400 text-xs font-mono">script.pro</span>
                      <button className="text-slate-400 hover:text-white transition-colors"><Copy size={14} /></button>
                    </div>
                    <textarea
                      className="flex-1 w-full bg-transparent text-slate-300 font-mono text-sm resize-none focus:outline-none leading-relaxed"
                      defaultValue={`launch("com.zhiliaoapp.musically")
wait(3)
repeat(50) {
  swipe(0.5, 0.8, 0.5, 0.2, 0.3)   // lướt video
  wait_random(3, 8)                // xem video 3-8 giây
  if random_int(1, 5) == 1 {       // 20% xác suất like
    tap(0.95, 0.45)                // tap nút like
    wait(0.5)
  }
}
screenshot()`}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-visible">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Download size={18} className="text-blue-600" /> Export Kịch bản
              </h2>
              <button onClick={() => { setShowExportModal(false); setExportDropdownOpen(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Multi-select dropdown */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Chọn kịch bản</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                    className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                  >
                    <span className={exportSelected.length > 0 ? 'text-slate-900' : 'text-slate-400'}>
                      {exportSelected.length === 0
                        ? 'Chọn kịch bản để export...'
                        : exportSelected.length === scriptsData.length
                          ? `Tất cả (${scriptsData.length} kịch bản)`
                          : `${exportSelected.length} kịch bản đã chọn`}
                    </span>
                    <ChevronRight size={16} className={`text-slate-400 transition-transform ${exportDropdownOpen ? 'rotate-90' : ''}`} />
                  </button>

                  {exportDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                      {/* Select All option */}
                      <div
                        onClick={toggleExportAll}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                      >
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          exportSelected.length === scriptsData.length && scriptsData.length > 0
                            ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                        }`}>
                          {exportSelected.length === scriptsData.length && scriptsData.length > 0 && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-sm font-medium text-slate-700">Chọn tất cả</span>
                      </div>

                      {/* Script options */}
                      <div className="max-h-52 overflow-y-auto">
                        {scriptsData.length === 0 ? (
                          <div className="px-3 py-4 text-center text-sm text-slate-400">Chưa có kịch bản nào</div>
                        ) : (
                          scriptsData.map(script => {
                            const isSelected = exportSelected.includes(script.id);
                            const channelLabel = APP_TABS.find(t => t.id === (script.channel || 'tiktok_vn'))?.label || script.channel;
                            return (
                              <div
                                key={script.id}
                                onClick={() => toggleExportSelect(script.id)}
                                className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors ${
                                  isSelected ? 'bg-blue-50/50' : ''
                                }`}
                              >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-900 truncate">{script.name}</p>
                                  <p className="text-xs text-slate-500">{channelLabel} · {script.steps.length} bước</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected tags */}
              {exportSelected.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {scriptsData.filter(s => exportSelected.includes(s.id)).map(s => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium"
                    >
                      {s.name}
                      <button
                        onClick={() => toggleExportSelect(s.id)}
                        className="hover:text-blue-900 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => { setShowExportModal(false); setExportDropdownOpen(false); }}
                className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Huỷ
              </button>
              <button
                onClick={() => { handleExport(); setExportDropdownOpen(false); }}
                disabled={exportSelected.length === 0}
                className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download size={16} />
                Export ({exportSelected.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Script Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-visible">
            <div className="px-6 py-4 border-b border-slate-100 rounded-t-2xl flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play size={18} className="text-blue-600" fill="currentColor" /> Chạy kịch bản
              </h2>
              <button onClick={() => { stopPolling(); setShowRunModal(null); setSelectedDeviceIds([]); setDeviceDropdownOpen(false); setRunningExecution(null); setRunLoading(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-6">
              {/* Script info */}
              <div className="mb-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Wand2 size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{scriptsData.find(s => s.id === showRunModal)?.name}</p>
                    <p className="text-xs text-slate-500">{scriptsData.find(s => s.id === showRunModal)?.steps.length} bước</p>
                  </div>
                </div>
              </div>

              {/* Device selection dropdown (hide when running) */}
              {!runLoading && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Chọn thiết bị</p>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setDeviceDropdownOpen(!deviceDropdownOpen)}
                      className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    >
                      <span className={selectedDeviceIds.length > 0 ? 'text-slate-900' : 'text-slate-400'}>
                        {selectedDeviceIds.length === 0
                          ? 'Chọn thiết bị...'
                          : selectedDeviceIds.length === devicesData.length
                            ? `Tất cả (${devicesData.length} thiết bị)`
                            : `${selectedDeviceIds.length} thiết bị đã chọn`}
                      </span>
                      <ChevronRight size={16} className={`text-slate-400 transition-transform ${deviceDropdownOpen ? 'rotate-90' : ''}`} />
                    </button>

                    {deviceDropdownOpen && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-10 overflow-hidden">
                        {devicesData.length > 1 && (
                          <div
                            onClick={() => setSelectedDeviceIds(prev => prev.length === devicesData.length ? [] : devicesData.map(d => d.id))}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 cursor-pointer border-b border-slate-100"
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              selectedDeviceIds.length === devicesData.length ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                            }`}>
                              {selectedDeviceIds.length === devicesData.length && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-sm font-medium text-slate-700">Chọn tất cả</span>
                          </div>
                        )}
                        <div className="max-h-52 overflow-y-auto">
                          {devicesData.map(device => {
                            const isSelected = selectedDeviceIds.includes(device.id);
                            return (
                              <div
                                key={device.id}
                                onClick={() => toggleDeviceSelection(device.id)}
                                className={`flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                              >
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  isSelected ? 'bg-blue-600 border-blue-600' : 'border-slate-300'
                                }`}>
                                  {isSelected && <Check size={10} className="text-white" />}
                                </div>
                                <Smartphone size={14} className="text-slate-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-slate-900 truncate">{device.name}</p>
                                  <p className="text-xs text-slate-500">{device.tailscaleIp}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected device tags */}
                  {selectedDeviceIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {devicesData.filter(d => selectedDeviceIds.includes(d.id)).map(d => (
                        <span key={d.id} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                          <Smartphone size={10} />
                          {d.name}
                          <button onClick={() => toggleDeviceSelection(d.id)} className="hover:text-blue-900"><X size={12} /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Execution Log (show when running) */}
              {runLoading && runningExecution && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">Tiến trình thực thi</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      runningExecution.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      runningExecution.status === 'success' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {runningExecution.status === 'running' ? '⏳ Đang chạy' : runningExecution.status === 'success' ? '✅ Hoàn thành' : '❌ Lỗi'}
                    </span>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-1.5">
                    {runningExecution.steps?.map((step: any, i: number) => (
                      <div key={i} className={`flex items-start gap-2 ${
                        step.status === 'success' ? 'text-emerald-400' :
                        step.status === 'error' ? 'text-red-400' :
                        step.status === 'running' ? 'text-blue-400' :
                        'text-slate-500'
                      }`}>
                        <span className="shrink-0 w-4 text-right">
                          {step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : step.status === 'running' ? '►' : '·'}
                        </span>
                        <span>{step.description}</span>
                        {step.error && <span className="text-red-400 ml-2">— {step.error}</span>}
                      </div>
                    ))}
                    {runningExecution.steps?.length === 0 && (
                      <div className="text-blue-400 flex items-center gap-2">
                        <span className="animate-pulse">►</span> Đang khởi tạo...
                      </div>
                    )}
                    {runningExecution.error && (
                      <div className="text-red-400 mt-2 pt-2 border-t border-slate-700">
                        Lỗi: {runningExecution.error}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading state before first poll */}
              {runLoading && !runningExecution && (
                <div className="mb-4 bg-slate-50 rounded-xl p-6 flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-slate-600">Đang gửi lệnh đến thiết bị...</p>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                {!runLoading ? (
                  <>
                    <button onClick={() => { stopPolling(); setShowRunModal(null); setSelectedDeviceIds([]); }} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                      Huỷ
                    </button>
                    <button onClick={handleRun} disabled={selectedDeviceIds.length === 0} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                      <Play size={16} fill="currentColor" /> Chạy ngay
                    </button>
                  </>
                ) : (
                  <div className="flex gap-3 w-full">
                    {runningExecution?.status === 'running' && (
                      <button onClick={handleStop} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        Dừng
                      </button>
                    )}
                    <button onClick={() => { stopPolling(); setShowRunModal(null); setRunLoading(false); setRunningExecution(null); }} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                      {runningExecution?.status === 'running' ? 'Chạy nền' : 'Đóng'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
