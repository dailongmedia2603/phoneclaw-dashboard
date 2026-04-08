import { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, ShieldOff, Play, Square, Settings2,
  Globe, MapPin, Clock, Loader2, CheckCircle, XCircle,
  Smartphone, RefreshCw, Wand2, CheckSquare, Square as SquareIcon,
} from 'lucide-react';
import { devices as devicesApi, proxy } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { showToast } from './Toast';
import CustomSelect from './CustomSelect';
import type { Device, ProxyMode } from '../types';

const US_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (New York)' },
  { value: 'America/Chicago', label: 'Central (Chicago)' },
  { value: 'America/Denver', label: 'Mountain (Denver)' },
  { value: 'America/Los_Angeles', label: 'Pacific (Los Angeles)' },
];

const US_LOCATIONS = [
  { value: '40.7128,-74.0060', label: 'New York, NY' },
  { value: '34.0522,-118.2437', label: 'Los Angeles, CA' },
  { value: '41.8781,-87.6298', label: 'Chicago, IL' },
  { value: '29.7604,-95.3698', label: 'Houston, TX' },
  { value: '33.4484,-112.0740', label: 'Phoenix, AZ' },
];

const MODE_OPTIONS: { value: ProxyMode; label: string; desc: string; color: string }[] = [
  { value: 'us', label: 'Proxy US', desc: 'Route traffic qua US + spoof tất cả sang US', color: 'blue' },
  { value: 'vn', label: 'Proxy VN', desc: 'Route traffic qua VN + GPS khớp proxy + WiFi ẩn', color: 'emerald' },
  { value: 'none', label: 'Không proxy', desc: 'Tắt proxy, mọi thứ bình thường', color: 'slate' },
];

// Tìm location gần nhất dựa trên tọa độ
function findNearestLocation(lat: number, lon: number): string {
  let minDist = Infinity;
  let nearest = US_LOCATIONS[0].value;
  for (const loc of US_LOCATIONS) {
    const [locLat, locLon] = loc.value.split(',').map(Number);
    const dist = (lat - locLat) ** 2 + (lon - locLon) ** 2;
    if (dist < minDist) {
      minDist = dist;
      nearest = loc.value;
    }
  }
  return nearest;
}

export default function ProxyManager() {
  const { data: deviceList, refresh: refreshDevices } = useApi<Device[]>(() => devicesApi.getAll(), []);
  const { on } = useWebSocket();

  // Mode selection
  const [proxyMode, setProxyMode] = useState<ProxyMode>('us');

  // Proxy config form
  const [proxyIp, setProxyIp] = useState('');
  const [proxyPort, setProxyPort] = useState('');
  const [proxyUser, setProxyUser] = useState('');
  const [proxyPass, setProxyPass] = useState('');

  // Spoof settings (US mode)
  const [timezone, setTimezone] = useState('America/New_York');
  const [locale] = useState('en_US');
  const [selectedLocation, setSelectedLocation] = useState('40.7128,-74.0060');

  // VN detected location (from geolocate)
  const [vnDetected, setVnDetected] = useState<{ city: string; region: string; lat: number; lon: number } | null>(null);

  // Selection
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);
  const [batchStopping, setBatchStopping] = useState(false);

  useEffect(() => {
    const unsub = on('device:status', () => refreshDevices());
    return unsub;
  }, [on, refreshDevices]);

  const allDevices = deviceList || [];
  const onlineDevices = allDevices.filter(d => d.status !== 'offline');
  const runningProxyCount = allDevices.filter(d => d.proxyStatus === 'running').length;

  const toggleSelect = (id: string) => {
    setSelectedDevices(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const selectAll = () => {
    setSelectedDevices(
      selectedDevices.length === onlineDevices.length ? [] : onlineDevices.map(d => d.id)
    );
  };

  // Parse proxy string format: ip:port:user:pass
  const handleParseProxy = (input: string) => {
    const parts = input.trim().split(':');
    if (parts.length >= 2) {
      setProxyIp(parts[0]);
      setProxyPort(parts[1]);
      if (parts.length >= 3) setProxyUser(parts[2]);
      if (parts.length >= 4) setProxyPass(parts.slice(3).join(':'));
    }
  };

  // Auto-detect timezone & GPS từ proxy IP (hỗ trợ cả US và VN)
  const autoDetectFromIp = async () => {
    if (!proxyIp) {
      showToast('error', 'Vui lòng nhập IP proxy trước');
      return;
    }
    setAutoDetecting(true);
    try {
      const res = await proxy.geolocate(proxyIp);
      if (res.success && res.data) {
        const { timezone: detectedTz, lat, lon, city, regionName } = res.data;

        if (proxyMode === 'us') {
          const matchedTz = US_TIMEZONES.find(tz => tz.value === detectedTz);
          if (matchedTz) {
            setTimezone(matchedTz.value);
          } else {
            showToast('error', `Timezone "${detectedTz}" không nằm trong danh sách US`);
          }
          const nearest = findNearestLocation(lat, lon);
          setSelectedLocation(nearest);
          const nearestLabel = US_LOCATIONS.find(l => l.value === nearest)?.label;
          showToast('success', `Đã phát hiện: ${matchedTz?.label || detectedTz} — ${nearestLabel}`);
        } else {
          setVnDetected({ city: city || 'Unknown', region: regionName || '', lat, lon });
          showToast('success', `Đã phát hiện: ${city}, ${regionName} (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
        }
      } else {
        showToast('error', res.error || 'Không thể xác định vị trí từ IP');
      }
    } catch {
      showToast('error', 'Lỗi khi tra cứu IP');
    }
    setAutoDetecting(false);
  };

  const setDeviceLoading = (id: string, val: boolean) => {
    setLoading(prev => ({ ...prev, [id]: val }));
  };

  // Apply config to single device
  const applyConfig = async (deviceId: string) => {
    if (proxyMode !== 'none' && (!proxyIp || !proxyPort)) {
      showToast('error', 'Vui lòng nhập IP và Port');
      return;
    }
    setDeviceLoading(deviceId, true);
    const res = await proxy.setConfig(deviceId, {
      ip: proxyIp, port: Number(proxyPort), username: proxyUser, password: proxyPass, mode: proxyMode,
    });
    if (res.success) showToast('success', 'Config đã lưu');
    else showToast('error', res.error || 'Lỗi');
    setDeviceLoading(deviceId, false);
  };

  // Start proxy on device
  const startProxy = async (deviceId: string) => {
    setDeviceLoading(deviceId, true);
    const res = await proxy.start(deviceId);
    if (res.success) {
      showToast('success', 'Proxy đã bật');
      refreshDevices();
    } else {
      showToast('error', res.error || 'Lỗi khi bật proxy');
    }
    setDeviceLoading(deviceId, false);
  };

  // Stop proxy on device
  const stopProxy = async (deviceId: string) => {
    setDeviceLoading(deviceId, true);
    const res = await proxy.stop(deviceId);
    if (res.success) {
      showToast('success', 'Proxy đã tắt');
      refreshDevices();
    } else {
      showToast('error', res.error || 'Lỗi khi tắt proxy');
    }
    setDeviceLoading(deviceId, false);
  };

  // Apply spoof to device (mode-aware)
  const applySpoof = async (deviceId: string) => {
    setDeviceLoading(deviceId, true);
    if (proxyMode === 'us') {
      const [lat, lon] = selectedLocation.split(',').map(Number);
      const res = await proxy.setSpoof(deviceId, {
        mode: 'us', timezone, locale, latitude: lat, longitude: lon,
      });
      if (res.success) showToast('success', 'US spoof đã áp dụng');
      else showToast('error', res.error || 'Lỗi');
    } else if (proxyMode === 'vn') {
      let vnLat = vnDetected?.lat;
      let vnLon = vnDetected?.lon;
      if (vnLat == null || vnLon == null) {
        const geoRes = await proxy.geolocate(proxyIp);
        if (geoRes.success) { vnLat = geoRes.data.lat; vnLon = geoRes.data.lon; }
      }
      const res = await proxy.setSpoof(deviceId, {
        mode: 'vn', latitude: vnLat, longitude: vnLon,
      });
      if (res.success) showToast('success', 'VN spoof đã áp dụng (GPS + WiFi ẩn)');
      else showToast('error', res.error || 'Lỗi');
    } else {
      const res = await proxy.setSpoof(deviceId, { mode: proxyMode });
      if (res.success) showToast('success', 'Spoof đã tắt');
      else showToast('error', res.error || 'Lỗi');
    }
    setDeviceLoading(deviceId, false);
  };

  // Helper: count successes/failures from batch response data
  const countResults = (data?: unknown) => {
    if (!data || typeof data !== 'object') return { ok: 0, fail: 0, errors: [] as string[] };
    const entries = Object.entries(data as Record<string, { ok: boolean; error?: string }>);
    const ok = entries.filter(([, r]) => r.ok).length;
    const fail = entries.length - ok;
    const errors = entries.filter(([, r]) => !r.ok).map(([id, r]) => {
      const dev = allDevices.find(d => d.id === id);
      return `${dev?.name || id}: ${r.error || 'Lỗi không xác định'}`;
    });
    return { ok, fail, errors };
  };

  // Batch operations
  const batchApplyAndStart = async () => {
    if (!selectedDevices.length) { showToast('error', 'Chọn thiết bị trước'); return; }
    if (proxyMode !== 'none' && (!proxyIp || !proxyPort)) { showToast('error', 'Nhập IP và Port'); return; }

    setBatchApplying(true);
    for (const id of selectedDevices) setDeviceLoading(id, true);
    let hasError = false;

    try {
      if (proxyMode === 'none') {
        const stopRes = await proxy.batchStop(selectedDevices);
        if (!stopRes.success) { showToast('error', stopRes.error || 'Lỗi khi tắt proxy'); hasError = true; }
        for (const deviceId of selectedDevices) {
          await proxy.setSpoof(deviceId, { mode: 'none' });
        }
      } else {
        // Step 1: Config
        const configRes = await proxy.batchConfig(selectedDevices, {
          ip: proxyIp, port: Number(proxyPort), username: proxyUser, password: proxyPass, mode: proxyMode,
        });
        if (!configRes.success) {
          const { errors } = countResults(configRes.data);
          showToast('error', errors[0] || configRes.error || 'Không gửi được config tới thiết bị');
          for (const id of selectedDevices) setDeviceLoading(id, false);
          refreshDevices();
          return;
        }

        // Step 2: Start
        const startRes = await proxy.batchStart(selectedDevices);
        if (!startRes.success) {
          const { errors } = countResults(startRes.data);
          showToast('error', errors[0] || startRes.error || 'Proxy không khởi động được (sing-box failed)');
          hasError = true;
        }

        // Step 3: Spoof
        if (!hasError) {
          if (proxyMode === 'us') {
            const [lat, lon] = selectedLocation.split(',').map(Number);
            for (const deviceId of selectedDevices) {
              const spoofRes = await proxy.setSpoof(deviceId, { mode: 'us', timezone, locale, latitude: lat, longitude: lon });
              if (!spoofRes.success) {
                const dev = allDevices.find(d => d.id === deviceId);
                showToast('error', `${dev?.name}: Lỗi spoof — ${spoofRes.error || 'Không xác định'}`);
                hasError = true;
              }
            }
          } else if (proxyMode === 'vn') {
            let vnLat = vnDetected?.lat;
            let vnLon = vnDetected?.lon;
            if (vnLat == null || vnLon == null) {
              const geoRes = await proxy.geolocate(proxyIp);
              if (geoRes.success) { vnLat = geoRes.data.lat; vnLon = geoRes.data.lon; }
            }
            for (const deviceId of selectedDevices) {
              const spoofRes = await proxy.setSpoof(deviceId, { mode: 'vn', latitude: vnLat, longitude: vnLon });
              if (!spoofRes.success) {
                const dev = allDevices.find(d => d.id === deviceId);
                showToast('error', `${dev?.name}: Lỗi VN spoof — ${spoofRes.error || 'Không xác định'}`);
                hasError = true;
              }
            }
          }
        }
      }

      if (!hasError) {
        showToast('success', `Đã áp dụng ${proxyMode === 'none' ? 'tắt proxy' : `proxy ${proxyMode.toUpperCase()}`} cho ${selectedDevices.length} thiết bị`);
      }
    } catch (err) {
      showToast('error', `Lỗi: ${err instanceof Error ? err.message : 'Không xác định'}`);
    }

    for (const id of selectedDevices) setDeviceLoading(id, false);
    setBatchApplying(false);
    refreshDevices();
  };

  const batchStop = async () => {
    if (!selectedDevices.length) { showToast('error', 'Chọn thiết bị trước'); return; }
    setBatchStopping(true);
    for (const id of selectedDevices) setDeviceLoading(id, true);
    const res = await proxy.batchStop(selectedDevices);
    for (const id of selectedDevices) setDeviceLoading(id, false);
    if (res.success) {
      showToast('success', `Đã tắt proxy cho ${selectedDevices.length} thiết bị`);
    } else {
      const { fail, errors } = countResults(res.data);
      showToast('error', `${fail} thiết bị không tắt được: ${errors[0] || 'Lỗi'}`);
    }
    setBatchStopping(false);
    refreshDevices();
  };

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header — same style as Devices */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Proxy Manager</h1>
          <p className="text-sm text-slate-500">{allDevices.length} thiết bị | {onlineDevices.length} online | {runningProxyCount} proxy running</p>
        </div>
        <button
          onClick={() => refreshDevices()}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          <RefreshCw size={16} className="text-slate-400" /> Làm mới
        </button>
      </div>

      {/* Content — scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Mode Selector */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-3">
            <Settings2 size={18} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Chế độ hoạt động</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {MODE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setProxyMode(opt.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  proxyMode === opt.value
                    ? opt.color === 'blue' ? 'border-blue-500 bg-blue-50'
                      : opt.color === 'emerald' ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-400 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className={`text-sm font-semibold ${
                  proxyMode === opt.value
                    ? opt.color === 'blue' ? 'text-blue-700'
                      : opt.color === 'emerald' ? 'text-emerald-700'
                      : 'text-slate-700'
                    : 'text-slate-600'
                }`}>{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Config Panels — only show when mode is not "none" */}
        {proxyMode !== 'none' && (
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Proxy Config */}
            <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
              <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
                <Globe size={16} /> Proxy Config ({proxyMode.toUpperCase()})
              </h2>

              {/* Quick paste */}
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-500 mb-1 block">Dán nhanh (ip:port:user:pass)</label>
                <input
                  type="text"
                  placeholder="1.2.3.4:8080:username:password"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  onPaste={(e) => { e.preventDefault(); handleParseProxy(e.clipboardData.getData('text')); }}
                  onChange={(e) => handleParseProxy(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">IP Address</label>
                  <input type="text" value={proxyIp} onChange={e => setProxyIp(e.target.value)} placeholder="1.2.3.4"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Port</label>
                  <input type="number" value={proxyPort} onChange={e => setProxyPort(e.target.value)} placeholder="8080"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Username</label>
                  <input type="text" value={proxyUser} onChange={e => setProxyUser(e.target.value)} placeholder="user"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Password</label>
                  <input type="password" value={proxyPass} onChange={e => setProxyPass(e.target.value)} placeholder="pass"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm" />
                </div>
              </div>
            </div>

            {/* Anti-Detection / Spoof Config */}
            {proxyMode === 'us' ? (
            <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Settings2 size={16} /> Anti-Detection (US Spoof)
                </h2>
                <button onClick={autoDetectFromIp} disabled={autoDetecting || !proxyIp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {autoDetecting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  Tự động phát hiện
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Clock size={12} /> Timezone</label>
                  <CustomSelect value={timezone} onChange={setTimezone} options={US_TIMEZONES} />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><MapPin size={12} /> Vị trí GPS</label>
                  <CustomSelect value={selectedLocation} onChange={setSelectedLocation} options={US_LOCATIONS} />
                </div>
                <div className="pt-2 text-xs text-slate-400">
                  <p>Locale: en_US | WiFi BSSID: ẩn | Cell: US (310/260)</p>
                  <p>DNS: DoH qua proxy (1.1.1.1) - Tự động</p>
                  <p>Tailscale: Loại trừ khỏi tunnel - Tự động</p>
                </div>
              </div>
            </div>
            ) : proxyMode === 'vn' ? (
            <div className="bg-slate-50/80 rounded-xl border border-slate-100 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Settings2 size={16} /> Anti-Detection (VN Spoof)
                </h2>
                <button onClick={autoDetectFromIp} disabled={autoDetecting || !proxyIp}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  {autoDetecting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
                  Tự động phát hiện
                </button>
              </div>
              {vnDetected ? (
              <div className="space-y-3">
                <div className="bg-emerald-50 rounded-lg p-3">
                  <p className="text-sm font-medium text-emerald-700 flex items-center gap-1">
                    <MapPin size={14} /> {vnDetected.city}, {vnDetected.region}
                  </p>
                  <p className="text-xs text-emerald-600 mt-1">GPS: {vnDetected.lat.toFixed(4)}, {vnDetected.lon.toFixed(4)}</p>
                </div>
                <div className="pt-1 text-xs text-slate-400">
                  <p>GPS: Khớp vị trí proxy | WiFi BSSID: ẩn</p>
                  <p>Timezone/Locale/Cell: Giữ VN tự nhiên</p>
                </div>
              </div>
              ) : (
              <div className="text-center text-slate-400 py-4">
                <MapPin size={24} className="mx-auto mb-2 opacity-50" />
                <p className="text-xs">Bấm &quot;Tự động phát hiện&quot; để xác định vị trí proxy</p>
              </div>
              )}
            </div>
            ) : null}
          </div>
        </div>
        )}

        {/* Batch Actions — toolbar style */}
        <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 flex-wrap">
          <button onClick={selectAll}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            {selectedDevices.length === onlineDevices.length && onlineDevices.length > 0
              ? <><CheckSquare size={16} className="text-blue-600" /> Bỏ chọn tất cả</>
              : <><SquareIcon size={16} className="text-slate-400" /> Chọn tất cả</>}
          </button>

          <button onClick={batchApplyAndStart}
            disabled={batchApplying || !selectedDevices.length || (proxyMode !== 'none' && !proxyIp) || selectedDevices.some(id => allDevices.find(d => d.id === id)?.proxyStatus === 'running')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {batchApplying ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {batchApplying ? 'Đang áp dụng...' : `${proxyMode === 'none' ? 'Stop All' : `Apply ${proxyMode.toUpperCase()} & Start`} (${selectedDevices.length})`}
          </button>

          <button onClick={batchStop}
            disabled={batchStopping || !selectedDevices.length}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm">
            {batchStopping ? <Loader2 size={16} className="animate-spin" /> : <Square size={16} />}
            {batchStopping ? 'Đang dừng...' : `Stop (${selectedDevices.length})`}
          </button>

          {selectedDevices.length > 0 && (
            <span className="text-sm text-slate-500">Đã chọn {selectedDevices.length} thiết bị</span>
          )}
        </div>

        {/* Device Table — same style as Devices page */}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
              <th className="py-3 pl-6 pr-4 w-12">
                <button onClick={selectAll} className="text-slate-400 hover:text-blue-600">
                  {selectedDevices.length === onlineDevices.length && onlineDevices.length > 0
                    ? <CheckSquare size={18} className="text-blue-600" />
                    : <SquareIcon size={18} />}
                </button>
              </th>
              <th className="py-3 px-4">Thiết bị</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Proxy</th>
              <th className="py-3 px-4">Proxy Status</th>
              <th className="py-3 px-4 text-right pr-6">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allDevices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  <Smartphone size={32} className="mx-auto mb-2" />
                  <p className="text-sm">Chưa có thiết bị nào</p>
                </td>
              </tr>
            )}
            {allDevices.map(device => (
              <tr key={device.id} className={`hover:bg-slate-50 transition-colors group ${device.status === 'offline' ? 'opacity-50' : ''} ${selectedDevices.includes(device.id) ? 'bg-blue-50/30' : ''}`}>
                <td className="py-3 pl-6 pr-4">
                  <button onClick={() => toggleSelect(device.id)} disabled={device.status === 'offline'} className="text-slate-300 hover:text-blue-600">
                    {selectedDevices.includes(device.id) ? <CheckSquare size={18} className="text-blue-600" /> : <SquareIcon size={18} />}
                  </button>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${device.status !== 'offline' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                      <Smartphone size={16} />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{device.name}</div>
                      <div className="text-xs text-slate-500">{device.tailscaleIp}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${
                    device.status === 'online' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    device.status === 'running' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    device.status === 'connecting' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      device.status === 'online' ? 'bg-emerald-500' :
                      device.status === 'running' ? 'bg-blue-500' :
                      device.status === 'connecting' ? 'bg-amber-500' :
                      'bg-slate-300'
                    }`} />
                    {device.status}
                  </div>
                </td>
                <td className="py-3 px-4 text-xs text-slate-500">
                  {device.proxyConfig?.ip ? (
                    <span className="font-mono">{device.proxyConfig.ip}:{device.proxyConfig.port}</span>
                  ) : (
                    <span className="text-slate-300">Chưa cấu hình</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  {device.proxyStatus === 'running' ? (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                      <ShieldCheck size={14} /> Running
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-slate-50 text-slate-600 border border-slate-200">
                      <ShieldOff size={14} /> Stopped
                    </div>
                  )}
                </td>
                <td className="py-3 px-4 text-right pr-6">
                  <div className="flex items-center justify-end gap-1">
                    {loading[device.id] ? (
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                    ) : device.status !== 'offline' ? (
                      device.proxyStatus === 'running' ? (
                        <button onClick={() => stopProxy(device.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100">
                          <XCircle size={14} /> Dừng
                        </button>
                      ) : (
                        <button onClick={() => startProxy(device.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-colors opacity-0 group-hover:opacity-100">
                          <CheckCircle size={14} /> Kích hoạt
                        </button>
                      )
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
