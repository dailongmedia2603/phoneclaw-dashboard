import { useState } from 'react';
import {
  Wand2, Plus, Play, Download, Upload, Edit, Trash2,
  Clock, Smartphone, FileJson, Search, MoreVertical,
  X, Save, Code, List, ChevronRight, GripVertical,
  MousePointer2, Timer, Repeat, Variable, CheckSquare,
  Copy
} from 'lucide-react';
import { scripts as scriptsApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Script, Device } from '../types';

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
  const [activeAppTab, setActiveAppTab] = useState('tiktok_vn');
  const [showEditor, setShowEditor] = useState(false);
  const [editingScript, setEditingScript] = useState<Script | null>(null);
  const [showRunModal, setShowRunModal] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<'visual' | 'code'>('visual');
  const [editorName, setEditorName] = useState('');
  const [editorDescription, setEditorDescription] = useState('');
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [runLoading, setRunLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [runningExecution, setRunningExecution] = useState<any>(null);
  const [pollingTimer, setPollingTimer] = useState<ReturnType<typeof setInterval> | null>(null);

  const { data: scriptsList, loading, error, refresh } = useApi<Script[]>(() => scriptsApi.getAll(), []);
  const { data: devicesList } = useApi<Device[]>(() => devicesApi.getAll(), []);

  const scriptsData = scriptsList || [];
  const devicesData = devicesList || [];

  const APP_TABS = [
    { id: 'tiktok_vn', label: 'TikTok Việt', icon: '♪', color: 'bg-black text-white', bundleId: 'com.ss.iphone.ugc.Ame' },
    { id: 'tiktok_us', label: 'TikTok US', icon: '♪', color: 'bg-blue-600 text-white', bundleId: 'com.zhiliaoapp.musically' },
    { id: 'facebook', label: 'Facebook', icon: 'f', color: 'bg-blue-500 text-white', bundleId: 'com.facebook.Facebook' },
  ] as const;

  // Scripts are categorized by name containing tab keyword or by a tag field
  const filteredScripts = scriptsData.filter(s => {
    const name = s.name.toLowerCase();
    const desc = s.description.toLowerCase();
    if (activeAppTab === 'tiktok_vn') return name.includes('tiktok vi') || name.includes('tiktok việt') || desc.includes('tiktok vi') || desc.includes('tiktok việt') || (!name.includes('tiktok us') && !name.includes('facebook') && (name.includes('tiktok') || desc.includes('tiktok')));
    if (activeAppTab === 'tiktok_us') return name.includes('tiktok us') || desc.includes('tiktok us') || name.includes('trill');
    if (activeAppTab === 'facebook') return name.includes('facebook') || name.includes('fb') || desc.includes('facebook');
    return true;
  });

  const handleCreateNew = () => {
    setEditingScript(null);
    setEditorName('');
    setEditorDescription('');
    setShowEditor(true);
  };

  const handleEdit = (script: Script) => {
    setEditingScript(script);
    setEditorName(script.name);
    setEditorDescription(script.description);
    setShowEditor(true);
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

  const handleOpenRunModal = (scriptId: string) => {
    setSelectedDeviceIds([]);
    setShowRunModal(scriptId);
  };

  const toggleDeviceSelection = (deviceId: string) => {
    setSelectedDeviceIds(prev =>
      prev.includes(deviceId) ? prev.filter(id => id !== deviceId) : [...prev, deviceId]
    );
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
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
            <Upload size={18} className="text-slate-400" />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors">
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
            <span className={`w-6 h-6 rounded-lg ${tab.color} flex items-center justify-center text-xs font-bold`}>
              {tab.icon}
            </span>
            {tab.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              activeAppTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {scriptsData.filter(s => {
                const n = s.name.toLowerCase(); const d = s.description.toLowerCase();
                if (tab.id === 'tiktok_vn') return n.includes('tiktok vi') || n.includes('tiktok việt') || d.includes('tiktok vi') || d.includes('tiktok việt') || (!n.includes('tiktok us') && !n.includes('facebook') && (n.includes('tiktok') || d.includes('tiktok')));
                if (tab.id === 'tiktok_us') return n.includes('tiktok us') || d.includes('tiktok us') || n.includes('trill');
                if (tab.id === 'facebook') return n.includes('facebook') || n.includes('fb') || d.includes('facebook');
                return false;
              }).length}
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
              <th className="py-3 px-4">Mô tả</th>
              <th className="py-3 px-4">Số bước</th>
              <th className="py-3 px-4">Lần chạy gần nhất</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-6 text-right">Thao tác</th>
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
                <td className="py-4 px-4">
                  <span className="text-sm text-slate-600 line-clamp-1">{script.description}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <List size={14} className="text-slate-400" /> {script.steps.length} bước
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" /> {script.lastRun ? getTimeAgo(script.lastRun) : 'Chưa chạy'}
                  </div>
                </td>
                <td className="py-4 px-4">
                  {script.status === 'active' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Đang chạy
                    </span>
                  )}
                  {script.status === 'idle' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                      Sẵn sàng
                    </span>
                  )}
                  {script.status === 'draft' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                      Bản nháp
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
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
                    <button className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical size={16} />
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

      {/* Run Script Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play size={18} className="text-blue-600" fill="currentColor" /> Chạy kịch bản
              </h2>
              <button onClick={() => { stopPolling(); setShowRunModal(null); setSelectedDeviceIds([]); setRunningExecution(null); setRunLoading(false); }} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
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

              {/* Device selection (hide when running) */}
              {!runLoading && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-slate-700 mb-2">Chọn thiết bị:</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {devicesData.map((device) => (
                      <label key={device.id} className="flex items-center gap-3 p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" checked={selectedDeviceIds.includes(device.id)} onChange={() => toggleDeviceSelection(device.id)} />
                        <Smartphone size={14} className="text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">{device.name}</span>
                      </label>
                    ))}
                  </div>
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
                  <button onClick={() => { stopPolling(); setShowRunModal(null); setRunLoading(false); setRunningExecution(null); }} className="flex-1 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium hover:bg-slate-50 transition-colors">
                    {runningExecution?.status === 'running' ? 'Chạy nền' : 'Đóng'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
