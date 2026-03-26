import { useState, useEffect } from 'react';
import {
  ChevronDown, Monitor, Grid2X2, Grid3X3, LayoutGrid,
  Home, ArrowLeft, Camera, Keyboard, Clipboard,
  Send, Download, Smartphone, Check, Maximize2, X
} from 'lucide-react';
import { devices as devicesApi, control, settings as settingsApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import type { Device } from '../types';

const APPS = [
  { id: 'tiktok', name: 'TikTok', bundleId: 'com.zhiliaoapp.musically', color: 'bg-black', icon: '♪' },
  { id: 'facebook', name: 'Facebook', bundleId: 'com.facebook.Facebook', color: 'bg-blue-600', icon: 'f' },
  { id: 'zalo', name: 'Zalo', bundleId: 'com.vng.zalo', color: 'bg-blue-500', icon: 'Z' },
  { id: 'youtube', name: 'YouTube', bundleId: 'com.google.ios.youtube', color: 'bg-red-600', icon: '▶' },
  { id: 'instagram', name: 'Instagram', bundleId: 'com.burbn.instagram', color: 'bg-pink-600', icon: '📷' },
  { id: 'shopee', name: 'Shopee', bundleId: 'com.beeasy.shopee', color: 'bg-orange-500', icon: '🛒' },
];

export default function Control() {
  const [layout, setLayout] = useState<1 | 4 | 9 | 16>(4);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
  const [activeDevice, setActiveDevice] = useState<string | null>(null);
  const [showDeviceDropdown, setShowDeviceDropdown] = useState(false);
  const [clipboardText, setClipboardText] = useState('');
  const [typeText, setTypeText] = useState('');
  const [showTypeInput, setShowTypeInput] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: deviceList } = useApi<Device[]>(() => devicesApi.getAll(), []);
  const onlineDevices = (deviceList || []).filter(d => d.status !== 'offline');

  // Auto-select first devices on load
  useEffect(() => {
    if (onlineDevices.length > 0 && selectedDeviceIds.length === 0) {
      const initial = onlineDevices.slice(0, Math.min(layout, onlineDevices.length)).map(d => d.id);
      setSelectedDeviceIds(initial);
      setActiveDevice(initial[0] || null);
    }
  }, [onlineDevices.length]);

  // Auto refresh screenshots
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey(k => k + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  const toggleDevice = (id: string) => {
    if (selectedDeviceIds.includes(id)) {
      setSelectedDeviceIds(prev => prev.filter(d => d !== id));
      if (activeDevice === id) setActiveDevice(selectedDeviceIds.find(d => d !== id) || null);
    } else if (selectedDeviceIds.length < layout) {
      setSelectedDeviceIds(prev => [...prev, id]);
      if (!activeDevice) setActiveDevice(id);
    }
  };

  const getGridClass = () => {
    switch (layout) {
      case 1: return 'grid-cols-1';
      case 4: return 'grid-cols-2';
      case 9: return 'grid-cols-3';
      case 16: return 'grid-cols-4';
      default: return 'grid-cols-2';
    }
  };

  const handleAction = async (action: string) => {
    if (!activeDevice) return;
    switch (action) {
      case 'home': await control.key(activeDevice, 'home'); break;
      case 'back': await control.key(activeDevice, 'back'); break;
      case 'screenshot': await control.screenshot(activeDevice); setRefreshKey(k => k + 1); break;
    }
  };

  const handleLaunchApp = async (bundleId: string) => {
    if (!activeDevice) return;
    await control.launch(activeDevice, bundleId);
  };

  const handleSendClipboard = async () => {
    if (!activeDevice || !clipboardText) return;
    await control.setClipboard(activeDevice, clipboardText);
  };

  const handleReceiveClipboard = async () => {
    if (!activeDevice) return;
    const res = await control.getClipboard(activeDevice);
    if (res.success && res.data) setClipboardText(String(res.data));
  };

  const handleTypeText = async () => {
    if (!activeDevice || !typeText) return;
    await control.type(activeDevice, typeText);
    setTypeText('');
    setShowTypeInput(false);
  };

  const activeDeviceInfo = (deviceList || []).find(d => d.id === activeDevice);

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900">Điều khiển thiết bị</h1>
          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          {/* Device Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDeviceDropdown(!showDeviceDropdown)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
            >
              <Smartphone size={16} className="text-blue-600" />
              Chọn thiết bị ({selectedDeviceIds.length}/{layout})
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {showDeviceDropdown && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-3 pb-2 mb-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Thiết bị online ({onlineDevices.length})</p>
                </div>
                {onlineDevices.map(device => (
                  <button
                    key={device.id}
                    onClick={() => toggleDevice(device.id)}
                    disabled={!selectedDeviceIds.includes(device.id) && selectedDeviceIds.length >= layout}
                    className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                      !selectedDeviceIds.includes(device.id) && selectedDeviceIds.length >= layout ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="font-medium text-slate-700">{device.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{device.tailscaleIp}</span>
                    </div>
                    {selectedDeviceIds.includes(device.id) && <Check size={16} className="text-blue-600" />}
                  </button>
                ))}
                {onlineDevices.length === 0 && (
                  <p className="text-center py-4 text-sm text-slate-400">Không có thiết bị online</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Layout Selector */}
        <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm">
          {([
            { id: 1, icon: Monitor },
            { id: 4, icon: Grid2X2 },
            { id: 9, icon: Grid3X3 },
            { id: 16, icon: LayoutGrid },
          ] as const).map(l => (
            <button
              key={l.id}
              onClick={() => {
                setLayout(l.id);
                setSelectedDeviceIds(prev => prev.slice(0, l.id));
              }}
              className={`p-2 rounded-lg transition-colors ${
                layout === l.id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <l.icon size={18} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Multi-view Grid */}
        <div className="flex-1 p-6 bg-slate-100/50 overflow-y-auto">
          {selectedDeviceIds.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Monitor size={48} className="mb-4 opacity-20" />
              <p className="text-lg font-medium text-slate-600">Chưa chọn thiết bị nào</p>
              <p className="text-sm">Chọn thiết bị từ menu để bắt đầu điều khiển</p>
            </div>
          ) : (
            <div className={`grid ${getGridClass()} gap-4 h-full auto-rows-fr`}>
              {selectedDeviceIds.map(deviceId => {
                const device = (deviceList || []).find(d => d.id === deviceId);
                const isActive = activeDevice === deviceId;

                return (
                  <div
                    key={deviceId}
                    onClick={() => setActiveDevice(deviceId)}
                    className={`relative bg-black rounded-2xl overflow-hidden shadow-sm border-4 transition-all cursor-pointer group flex flex-col ${
                      isActive ? 'border-blue-500 shadow-blue-500/20 shadow-lg' : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Header overlay */}
                    <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-10 flex justify-between items-start opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                        <p className="text-xs font-medium text-white">{device?.name}</p>
                        <p className="text-[10px] text-slate-300 font-mono">{device?.tailscaleIp}</p>
                      </div>
                      <button className="p-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/10 text-white hover:bg-white/20 transition-colors">
                        <Maximize2 size={14} />
                      </button>
                    </div>

                    {/* noVNC / Screenshot view */}
                    <div className="flex-1 relative bg-slate-900 flex items-center justify-center">
                      <img
                        src={`/api/control/${deviceId}/screenshot?t=${refreshKey}&token=${localStorage.getItem('phoneclaw_token') || ''}`}
                        alt="Device screen"
                        className="w-full h-full object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0'; }}
                      />
                      {/* Fallback */}
                      <div className="absolute inset-0 flex items-center justify-center -z-0">
                        <div className="text-slate-600 text-center">
                          <Smartphone size={32} className="mx-auto mb-2" />
                          <p className="text-xs">Đang kết nối...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {Array.from({ length: layout - selectedDeviceIds.length }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-slate-200/50 rounded-2xl border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <span className="text-slate-400 text-sm font-medium">Trống</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Control Panel */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <h2 className="font-bold text-slate-800">Bảng điều khiển</h2>
            <p className="text-xs text-slate-500 mt-1">
              Đang điều khiển: <span className="font-semibold text-blue-600">{activeDeviceInfo?.name || 'Chưa chọn'}</span>
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* Basic Actions */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Thao tác cơ bản</h3>
              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => handleAction('home')} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl border border-slate-100 transition-colors">
                  <Home size={20} />
                  <span className="text-[10px] font-medium">Home</span>
                </button>
                <button onClick={() => handleAction('back')} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl border border-slate-100 transition-colors">
                  <ArrowLeft size={20} />
                  <span className="text-[10px] font-medium">Back</span>
                </button>
                <button onClick={() => handleAction('screenshot')} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl border border-slate-100 transition-colors">
                  <Camera size={20} />
                  <span className="text-[10px] font-medium">Chụp ảnh</span>
                </button>
                <button onClick={() => setShowTypeInput(!showTypeInput)} className="flex flex-col items-center justify-center gap-1.5 p-3 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-xl border border-slate-100 transition-colors">
                  <Keyboard size={20} />
                  <span className="text-[10px] font-medium">Gõ text</span>
                </button>
              </div>

              {/* Type text input */}
              {showTypeInput && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={typeText}
                    onChange={e => setTypeText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleTypeText()}
                    placeholder="Nhập text..."
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    autoFocus
                  />
                  <button onClick={handleTypeText} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
                    <Send size={14} />
                  </button>
                </div>
              )}
            </div>

            {/* Apps */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Mở ứng dụng nhanh</h3>
              <div className="grid grid-cols-3 gap-3">
                {APPS.map(app => (
                  <button key={app.id} onClick={() => handleLaunchApp(app.bundleId)} className="flex flex-col items-center gap-2 group">
                    <div className={`w-12 h-12 rounded-2xl ${app.color} text-white flex items-center justify-center text-xl shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all`}>
                      {app.icon}
                    </div>
                    <span className="text-xs font-medium text-slate-600">{app.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clipboard */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Clipboard size={14} /> Đồng bộ Clipboard
              </h3>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden focus-within:border-blue-500 transition-all">
                <textarea
                  value={clipboardText}
                  onChange={e => setClipboardText(e.target.value)}
                  placeholder="Nhập văn bản để gửi đến thiết bị..."
                  className="w-full h-24 p-3 bg-transparent text-sm resize-none focus:outline-none"
                />
                <div className="flex border-t border-slate-200">
                  <button onClick={handleSendClipboard} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                    <Send size={14} /> Gửi đến ĐT
                  </button>
                  <div className="w-px bg-slate-200"></div>
                  <button onClick={handleReceiveClipboard} className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors">
                    <Download size={14} /> Lấy từ ĐT
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
