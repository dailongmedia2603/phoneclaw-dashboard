import { useState, useEffect, useRef } from 'react';
import {
  Shield, ShieldCheck, ShieldOff, Play, Square, Settings2,
  Globe, MapPin, Clock, Loader2, CheckCircle, XCircle,
  Smartphone, RefreshCw, ChevronDown, Wand2,
} from 'lucide-react';
import { devices as devicesApi, proxy } from '../services/api';
import { useApi } from '../hooks/useApi';
import { useWebSocket } from '../hooks/useWebSocket';
import { showToast } from './Toast';
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

// Custom dropdown component thay thế native <select>
function CustomSelect({ value, onChange, options }: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-left flex items-center justify-between bg-white hover:border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
      >
        <span className="text-slate-700">{selected?.label || 'Chọn...'}</span>
        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-auto">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-3 py-2 text-sm text-left flex items-center gap-2 transition-colors ${
                opt.value === value
                  ? 'text-blue-600 bg-blue-50 font-medium'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.value === value && <CheckCircle size={14} className="shrink-0" />}
              <span className={opt.value === value ? '' : 'pl-[22px]'}>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

  useEffect(() => {
    const unsub = on('device:status', () => refreshDevices());
    return unsub;
  }, [on, refreshDevices]);

  const allDevices = deviceList || [];
  const onlineDevices = allDevices.filter(d => d.status !== 'offline');

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
          // US mode: map to fixed US timezone/location lists
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
          // VN mode: dùng trực tiếp tọa độ từ geolocate, không cần danh sách
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
      // mode=vn → GPS khớp proxy VN + WiFi ẩn
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
      // mode=none → disable spoofing
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
        // Step 1: Config — gửi proxy config tới các thiết bị
        const configRes = await proxy.batchConfig(selectedDevices, {
          ip: proxyIp, port: Number(proxyPort), username: proxyUser, password: proxyPass, mode: proxyMode,
        });
        if (!configRes.success) {
          const { errors } = countResults(configRes.data);
          showToast('error', errors[0] || configRes.error || 'Không gửi được config tới thiết bị');
          for (const id of selectedDevices) setDeviceLoading(id, false);
          refreshDevices();
          return; // Dừng — không start nếu config thất bại
        }

        // Step 2: Start — khởi động proxy tunnel (server tự verify sing-box)
        const startRes = await proxy.batchStart(selectedDevices);
        if (!startRes.success) {
          const { errors } = countResults(startRes.data);
          showToast('error', errors[0] || startRes.error || 'Proxy không khởi động được (sing-box failed)');
          hasError = true;
        }

        // Step 3: Spoof — chỉ chạy nếu start thành công
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
            // VN spoof: dùng tọa độ đã detect, hoặc geolocate nếu chưa detect
            let vnLat = vnDetected?.lat;
            let vnLon = vnDetected?.lon;
            if (vnLat == null || vnLon == null) {
              const geoRes = await proxy.geolocate(proxyIp);
              if (geoRes.success) {
                vnLat = geoRes.data.lat;
                vnLon = geoRes.data.lon;
              }
            }
            for (const deviceId of selectedDevices) {
              const spoofRes = await proxy.setSpoof(deviceId, {
                mode: 'vn',
                latitude: vnLat,
                longitude: vnLon,
              });
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
    refreshDevices();
  };

  const batchStop = async () => {
    if (!selectedDevices.length) { showToast('error', 'Chọn thiết bị trước'); return; }
    for (const id of selectedDevices) setDeviceLoading(id, true);
    const res = await proxy.batchStop(selectedDevices);
    for (const id of selectedDevices) setDeviceLoading(id, false);
    if (res.success) {
      showToast('success', `Đã tắt proxy cho ${selectedDevices.length} thiết bị`);
    } else {
      const { fail, errors } = countResults(res.data);
      showToast('error', `${fail} thiết bị không tắt được: ${errors[0] || 'Lỗi'}`);
    }
    refreshDevices();
  };

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield size={28} /> Proxy Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý Proxy & Anti-detection cho TikTok
          </p>
        </div>
        <button onClick={() => refreshDevices()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      {/* Mode Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
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

      {/* Config Panel - only show when mode is not "none" */}
      {proxyMode !== 'none' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proxy Config */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <Globe size={20} /> Proxy Config ({proxyMode.toUpperCase()})
          </h2>

          {/* Quick paste */}
          <div className="mb-4">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Dán nhanh (ip:port:user:pass)</label>
            <input
              type="text"
              placeholder="1.2.3.4:8080:username:password"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onPaste={(e) => {
                e.preventDefault();
                handleParseProxy(e.clipboardData.getData('text'));
              }}
              onChange={(e) => handleParseProxy(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">IP Address</label>
              <input
                type="text" value={proxyIp} onChange={e => setProxyIp(e.target.value)}
                placeholder="1.2.3.4"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Port</label>
              <input
                type="number" value={proxyPort} onChange={e => setProxyPort(e.target.value)}
                placeholder="8080"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Username</label>
              <input
                type="text" value={proxyUser} onChange={e => setProxyUser(e.target.value)}
                placeholder="user"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Password</label>
              <input
                type="password" value={proxyPass} onChange={e => setProxyPass(e.target.value)}
                placeholder="pass"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Anti-Detection / Spoof Config — only shown for US mode */}
        {proxyMode === 'us' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Settings2 size={20} /> Anti-Detection (US Spoof)
            </h2>
            <button
              onClick={autoDetectFromIp}
              disabled={autoDetecting || !proxyIp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {autoDetecting ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
              Tự động phát hiện
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Clock size={12} /> Timezone
              </label>
              <CustomSelect
                value={timezone}
                onChange={setTimezone}
                options={US_TIMEZONES}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <MapPin size={12} /> Vị trí GPS
              </label>
              <CustomSelect
                value={selectedLocation}
                onChange={setSelectedLocation}
                options={US_LOCATIONS}
              />
            </div>

            <div className="pt-2 text-xs text-slate-400">
              <p>Locale: en_US | WiFi BSSID: ẩn | Cell: US (310/260)</p>
              <p>DNS: DoH qua proxy (1.1.1.1) - Tự động</p>
              <p>Tailscale: Loại trừ khỏi tunnel - Tự động</p>
            </div>
          </div>
        </div>
        ) : proxyMode === 'vn' ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
              <Settings2 size={20} /> Anti-Detection (VN Spoof)
            </h2>
            <button
              onClick={autoDetectFromIp}
              disabled={autoDetecting || !proxyIp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
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
              <p className="text-xs text-emerald-600 mt-1">
                GPS: {vnDetected.lat.toFixed(4)}, {vnDetected.lon.toFixed(4)}
              </p>
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
        ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Globe size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Không proxy</p>
            <p className="text-xs mt-1">Tắt proxy, mọi thứ bình thường.</p>
          </div>
        </div>
        )}
      </div>
      )}

      {/* Batch Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 flex-wrap">
        <button onClick={selectAll}
          className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
          {selectedDevices.length === onlineDevices.length && onlineDevices.length > 0 ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
        </button>

        <button onClick={batchApplyAndStart}
          disabled={!selectedDevices.length || (proxyMode !== 'none' && !proxyIp) || selectedDevices.some(id => allDevices.find(d => d.id === id)?.proxyStatus === 'running')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <Play size={16} /> {proxyMode === 'none' ? 'Stop All' : `Apply ${proxyMode.toUpperCase()} & Start`} ({selectedDevices.length})
        </button>

        <button onClick={batchStop}
          disabled={!selectedDevices.length}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed">
          <Square size={16} /> Stop ({selectedDevices.length})
        </button>

        {selectedDevices.length > 0 && (
          <span className="text-sm text-slate-500">
            Đã chọn {selectedDevices.length} thiết bị
          </span>
        )}
      </div>

      {/* Device List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input type="checkbox" checked={selectedDevices.length === onlineDevices.length && onlineDevices.length > 0}
                  onChange={selectAll} className="rounded" />
              </th>
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Thiết bị</th>
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Trạng thái</th>
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Proxy</th>
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Proxy Status</th>
              <th className="px-4 py-3 text-right text-slate-600 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allDevices.map(device => (
              <tr key={device.id} className={`hover:bg-slate-50 ${device.status === 'offline' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selectedDevices.includes(device.id)}
                    onChange={() => toggleSelect(device.id)}
                    disabled={device.status === 'offline'} className="rounded" />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-slate-400" />
                    <div>
                      <p className="font-medium text-slate-700">{device.name}</p>
                      <p className="text-xs text-slate-400">{device.tailscaleIp}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    device.status === 'online' ? 'bg-emerald-50 text-emerald-600' :
                    device.status === 'running' ? 'bg-blue-50 text-blue-600' :
                    device.status === 'connecting' ? 'bg-amber-50 text-amber-600' :
                    'bg-slate-100 text-slate-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      device.status === 'online' ? 'bg-emerald-500' :
                      device.status === 'running' ? 'bg-blue-500' :
                      device.status === 'connecting' ? 'bg-amber-500' :
                      'bg-slate-300'
                    }`} />
                    {device.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {device.proxyConfig?.ip ? (
                    <span>{device.proxyConfig.ip}:{device.proxyConfig.port}</span>
                  ) : (
                    <span className="text-slate-300">Chưa cấu hình</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {device.proxyStatus === 'running' ? (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                      <ShieldCheck size={14} /> Running
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400">
                      <ShieldOff size={14} /> Stopped
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {loading[device.id] ? (
                      <Loader2 size={16} className="animate-spin text-blue-500" />
                    ) : device.status !== 'offline' ? (
                      <>
                        <button onClick={() => applyConfig(device.id)}
                          title="Áp dụng Config"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50">
                          <Settings2 size={16} />
                        </button>
                        {device.proxyStatus === 'running' ? (
                          <button onClick={() => stopProxy(device.id)}
                            title="Dừng Proxy"
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50">
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <button onClick={() => startProxy(device.id)}
                            title="Bật Proxy"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => applySpoof(device.id)}
                          title="Áp dụng Spoof"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-500 hover:bg-purple-50">
                          <MapPin size={16} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
            {allDevices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                  Chưa có thiết bị nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
