import { useState, useEffect } from 'react';
import {
  Shield, ShieldCheck, ShieldOff, Play, Square, Settings2,
  Globe, MapPin, Clock, Loader2, CheckCircle, XCircle,
  Smartphone, RefreshCw,
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
  { value: 'us', label: 'Proxy US', desc: 'Route traffic qua US + spoof tat ca sang US', color: 'blue' },
  { value: 'vn', label: 'Proxy VN', desc: 'Chi route traffic qua VN, khong spoof', color: 'emerald' },
  { value: 'none', label: 'Khong proxy', desc: 'Tat proxy, moi thu binh thuong', color: 'slate' },
];

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

  // Spoof settings (only used when mode=us)
  const [timezone, setTimezone] = useState('America/New_York');
  const [locale] = useState('en_US');
  const [selectedLocation, setSelectedLocation] = useState('40.7128,-74.0060');

  // Selection
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});

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

  const setDeviceLoading = (id: string, val: boolean) => {
    setLoading(prev => ({ ...prev, [id]: val }));
  };

  // Apply config to single device
  const applyConfig = async (deviceId: string) => {
    if (proxyMode !== 'none' && (!proxyIp || !proxyPort)) {
      showToast('error', 'Vui long nhap IP va Port');
      return;
    }
    setDeviceLoading(deviceId, true);
    const res = await proxy.setConfig(deviceId, {
      ip: proxyIp, port: Number(proxyPort), username: proxyUser, password: proxyPass, mode: proxyMode,
    });
    if (res.success) showToast('success', 'Config da luu');
    else showToast('error', res.error || 'Loi');
    setDeviceLoading(deviceId, false);
  };

  // Start proxy on device
  const startProxy = async (deviceId: string) => {
    setDeviceLoading(deviceId, true);
    const res = await proxy.start(deviceId);
    if (res.success) {
      showToast('success', 'Proxy da bat');
      refreshDevices();
    } else {
      showToast('error', res.error || 'Loi khi bat proxy');
    }
    setDeviceLoading(deviceId, false);
  };

  // Stop proxy on device
  const stopProxy = async (deviceId: string) => {
    setDeviceLoading(deviceId, true);
    const res = await proxy.stop(deviceId);
    if (res.success) {
      showToast('success', 'Proxy da tat');
      refreshDevices();
    } else {
      showToast('error', res.error || 'Loi khi tat proxy');
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
      if (res.success) showToast('success', 'US spoof da ap dung');
      else showToast('error', res.error || 'Loi');
    } else {
      // mode=vn or none → disable spoofing
      const res = await proxy.setSpoof(deviceId, { mode: proxyMode });
      if (res.success) showToast('success', 'Spoof da tat');
      else showToast('error', res.error || 'Loi');
    }
    setDeviceLoading(deviceId, false);
  };

  // Batch operations
  const batchApplyAndStart = async () => {
    if (!selectedDevices.length) { showToast('error', 'Chon thiet bi truoc'); return; }
    if (proxyMode !== 'none' && (!proxyIp || !proxyPort)) { showToast('error', 'Nhap IP va Port'); return; }

    for (const id of selectedDevices) setDeviceLoading(id, true);

    if (proxyMode === 'none') {
      // Stop proxy on all selected devices
      await proxy.batchStop(selectedDevices);
      // Disable spoofing on all
      for (const deviceId of selectedDevices) {
        await proxy.setSpoof(deviceId, { mode: 'none' });
      }
    } else {
      // Config
      await proxy.batchConfig(selectedDevices, {
        ip: proxyIp, port: Number(proxyPort), username: proxyUser, password: proxyPass, mode: proxyMode,
      });
      // Start
      await proxy.batchStart(selectedDevices);
      // Spoof based on mode
      if (proxyMode === 'us') {
        const [lat, lon] = selectedLocation.split(',').map(Number);
        for (const deviceId of selectedDevices) {
          await proxy.setSpoof(deviceId, { mode: 'us', timezone, locale, latitude: lat, longitude: lon });
        }
      } else {
        // vn mode → disable spoofing
        for (const deviceId of selectedDevices) {
          await proxy.setSpoof(deviceId, { mode: 'vn' });
        }
      }
    }

    for (const id of selectedDevices) setDeviceLoading(id, false);
    showToast('success', `Da ap dung ${proxyMode === 'none' ? 'tat proxy' : `proxy ${proxyMode.toUpperCase()}`} cho ${selectedDevices.length} thiet bi`);
    refreshDevices();
  };

  const batchStop = async () => {
    if (!selectedDevices.length) { showToast('error', 'Chon thiet bi truoc'); return; }
    for (const id of selectedDevices) setDeviceLoading(id, true);
    await proxy.batchStop(selectedDevices);
    for (const id of selectedDevices) setDeviceLoading(id, false);
    showToast('success', `Da tat proxy cho ${selectedDevices.length} thiet bi`);
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
            Quan ly Proxy & Anti-detection cho TikTok
          </p>
        </div>
        <button onClick={() => refreshDevices()} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">
          <RefreshCw size={16} /> Lam moi
        </button>
      </div>

      {/* Mode Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings2 size={18} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Che do hoat dong</span>
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
            <label className="text-xs font-medium text-slate-500 mb-1 block">Dan nhanh (ip:port:user:pass)</label>
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
          <h2 className="text-lg font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <Settings2 size={20} /> Anti-Detection (US Spoof)
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <Clock size={12} /> Timezone
              </label>
              <select
                value={timezone} onChange={e => setTimezone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {US_TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                <MapPin size={12} /> Vi tri GPS
              </label>
              <select
                value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {US_LOCATIONS.map(loc => (
                  <option key={loc.value} value={loc.value}>{loc.label}</option>
                ))}
              </select>
            </div>

            <div className="pt-2 text-xs text-slate-400">
              <p>Locale: en_US | WiFi BSSID: an | Cell: US (310/260)</p>
              <p>DNS: DoH qua proxy (1.1.1.1) - Tu dong</p>
              <p>Tailscale: Loai tru khoi tunnel - Tu dong</p>
            </div>
          </div>
        </div>
        ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center justify-center">
          <div className="text-center text-slate-400">
            <Globe size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">Proxy VN</p>
            <p className="text-xs mt-1">Chi route traffic, khong spoof.<br/>Moi thu giu nguyen trang thai tu nhien.</p>
          </div>
        </div>
        )}
      </div>
      )}

      {/* Batch Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 flex-wrap">
        <button onClick={selectAll}
          className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50">
          {selectedDevices.length === onlineDevices.length && onlineDevices.length > 0 ? 'Bo chon tat ca' : 'Chon tat ca'}
        </button>

        <button onClick={batchApplyAndStart}
          disabled={!selectedDevices.length || (proxyMode !== 'none' && !proxyIp)}
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
            Da chon {selectedDevices.length} thiet bi
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
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Thiet bi</th>
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Trang thai</th>
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Proxy</th>
              <th className="px-4 py-3 text-left text-slate-600 font-medium">Proxy Status</th>
              <th className="px-4 py-3 text-right text-slate-600 font-medium">Hanh dong</th>
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
                    <span className="text-slate-300">Chua cau hinh</span>
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
                          title="Apply Config"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50">
                          <Settings2 size={16} />
                        </button>
                        {device.proxyStatus === 'running' ? (
                          <button onClick={() => stopProxy(device.id)}
                            title="Stop Proxy"
                            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50">
                            <XCircle size={16} />
                          </button>
                        ) : (
                          <button onClick={() => startProxy(device.id)}
                            title="Start Proxy"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50">
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button onClick={() => applySpoof(device.id)}
                          title="Apply Spoof"
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
                  Chua co thiet bi nao
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
