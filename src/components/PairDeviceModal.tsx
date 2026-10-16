import { useState, useEffect } from 'react';
import { X, Loader2, Copy, CheckCircle2, Smartphone, RefreshCw } from 'lucide-react';
import { wireguard } from '../services/api';
import { showToast } from './Toast';
import type { Device, DeviceGroup } from '../types';
import CustomSelect from './CustomSelect';

interface Props {
  groups: DeviceGroup[];
  devices: Device[];
  onClose: () => void;
  onPaired: () => void;
}

type Step = 'form' | 'code' | 'done';

const SERVER_URL = typeof window !== 'undefined' ? window.location.origin : 'https://phoneagent.io.vn';

/**
 * Thêm thiết bị bằng mã ghép (WireGuard, không cần Tailscale):
 * dashboard tạo mã → nhập mã trong app Phone Agent → server tự cấp IP + tạo thiết bị.
 */
export default function PairDeviceModal({ groups, devices, onClose, onPaired }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [creating, setCreating] = useState(false);
  const [code, setCode] = useState('');
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [now, setNow] = useState(Date.now());
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const pairedDevice = deviceId ? devices.find(d => d.id === deviceId) : undefined;
  const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));

  const createCode = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await wireguard.createPairingCode(name.trim(), group);
    setCreating(false);
    if (!res.success || !res.data) {
      showToast('error', res.error || 'Không tạo được mã ghép');
      return;
    }
    setCode(res.data.code);
    setExpiresAt(new Date(res.data.expiresAt).getTime());
    setStep('code');
  };

  // Chờ điện thoại nhập mã
  useEffect(() => {
    if (step !== 'code' || !code) return;
    const timer = setInterval(async () => {
      setNow(Date.now());
      const res = await wireguard.getPairingStatus(code);
      if (res.success && res.data?.status === 'used' && res.data.deviceId) {
        setDeviceId(res.data.deviceId);
        setStep('done');
        onPaired();
      } else if (res.success && res.data?.status === 'expired') {
        setStep('form');
        setCode('');
        showToast('error', 'Mã ghép đã hết hạn — hãy tạo mã mới');
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [step, code, onPaired]);

  // Sau khi ghép: refresh danh sách tới khi máy online
  useEffect(() => {
    if (step !== 'done' || pairedDevice?.status === 'online') return;
    const timer = setInterval(onPaired, 3000);
    return () => clearInterval(timer);
  }, [step, pairedDevice?.status, onPaired]);

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => showToast('success', `Đã copy ${label}`));
  };

  const formattedCode = code ? `${code.slice(0, 3)} ${code.slice(3)}` : '';

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col max-h-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-900">Kết nối thiết bị bằng mã ghép</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full">
            <X size={20} />
          </button>
        </div>

        {step === 'form' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            <p className="text-sm text-slate-500">
              Không cần Tailscale. Tạo mã rồi nhập vào app <b>Phone Agent</b> trên iPhone — máy sẽ tự kết nối.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên thiết bị <span className="text-red-500">(Bắt buộc)</span></label>
              <input
                type="text"
                placeholder="Ví dụ: iPhone 7 - 01"
                value={name}
                onChange={e => setName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && createCode()}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Nhóm (tuỳ chọn)</label>
              <CustomSelect
                value={group}
                onChange={setGroup}
                options={[{ value: '', label: 'Chưa phân nhóm' }, ...groups.map(g => ({ value: g.name, label: g.name }))]}
                placeholder="Chọn nhóm..."
              />
            </div>
            <button
              onClick={createCode}
              disabled={creating || !name.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {creating && <Loader2 size={16} className="animate-spin" />}
              Tạo mã ghép
            </button>
          </div>
        )}

        {step === 'code' && (
          <div className="p-6 space-y-5 overflow-y-auto">
            <div className="text-center">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Mã ghép cho “{name}”</p>
              <button
                onClick={() => copy(code, 'mã ghép')}
                className="font-mono text-4xl font-bold tracking-[0.25em] text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 hover:bg-slate-100 inline-flex items-center gap-3"
                title="Bấm để copy"
              >
                {formattedCode}
                <Copy size={18} className="text-slate-400" />
              </button>
              <p className="text-xs text-slate-400 mt-2">
                Hết hạn sau {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
              </p>
            </div>

            <ol className="text-sm text-slate-600 space-y-2 bg-blue-50/60 border border-blue-100 rounded-xl p-4 list-decimal list-inside">
              <li>Mở app <b>Phone Agent</b> trên iPhone → bấm <b>Kết nối Server</b></li>
              <li>
                Server: <button onClick={() => copy(SERVER_URL, 'địa chỉ server')} className="font-mono text-blue-700 hover:underline">{SERVER_URL}</button>
              </li>
              <li>Nhập mã <b className="font-mono">{formattedCode}</b> → bấm <b>Kết nối</b></li>
              <li>Lần đầu iOS hỏi “Thêm cấu hình VPN” → bấm <b>Cho phép</b></li>
            </ol>

            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin" />
              Đang chờ điện thoại nhập mã...
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="p-6 space-y-5 overflow-y-auto text-center">
            {pairedDevice?.status === 'online' ? (
              <>
                <CheckCircle2 size={48} className="mx-auto text-green-500" />
                <div>
                  <p className="text-lg font-bold text-slate-900">{pairedDevice.name} đã kết nối</p>
                  <p className="text-sm text-slate-500 mt-1">
                    IP <span className="font-mono">{pairedDevice.tailscaleIp}</span> · {pairedDevice.model} · iOS {pairedDevice.iosVersion}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Smartphone size={44} className="mx-auto text-blue-500" />
                <div>
                  <p className="text-lg font-bold text-slate-900">Đã ghép mã thành công</p>
                  <p className="text-sm text-slate-500 mt-1 flex items-center justify-center gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    Đang chờ tunnel lên và thiết bị online{pairedDevice ? ` (${pairedDevice.tailscaleIp})` : ''}...
                  </p>
                  <p className="text-xs text-slate-400 mt-3">
                    Nếu iOS hỏi “Thêm cấu hình VPN” trên điện thoại, hãy bấm Cho phép.
                  </p>
                </div>
              </>
            )}
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl text-sm font-medium transition-colors"
            >
              Xong
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
