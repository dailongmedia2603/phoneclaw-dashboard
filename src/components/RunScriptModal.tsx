import { useState } from 'react';
import { X, Play, Loader2 } from 'lucide-react';
import type { Script, Device, ScriptInput } from '../types';
import VariableField from './VariableField';

interface Props {
  script: Script;
  devices: Device[];
  onRun: (deviceIds: string[], variables: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
}

export default function RunScriptModal({ script, devices, onRun, onClose }: Props) {
  const inputs = script.inputs ?? [];
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const onlineDevices = devices.filter((d) => d.status === 'online' || d.status === 'running');

  const validateField = (spec: ScriptInput, v: unknown): string | null => {
    if (spec.required && (v === undefined || v === null || v === '')) return 'Bắt buộc';
    if (v === undefined || v === null || v === '') return null;
    if (spec.type === 'number') {
      const n = Number(v);
      if (Number.isNaN(n)) return 'Không phải số';
      if (spec.min !== undefined && n < spec.min) return `< ${spec.min}`;
      if (spec.max !== undefined && n > spec.max) return `> ${spec.max}`;
    }
    if (spec.type === 'url') {
      try {
        const u = new URL(String(v));
        if (!/^https?:$/.test(u.protocol)) return 'Chỉ cho phép http/https';
      } catch {
        return 'URL không hợp lệ';
      }
    }
    if ((spec.type === 'string' || spec.type === 'text') && spec.maxLength !== undefined) {
      if (String(v).length > spec.maxLength) return `Vượt ${spec.maxLength} ký tự`;
    }
    if (spec.type === 'enum' && !spec.options?.includes(String(v))) {
      return 'Giá trị không hợp lệ';
    }
    return null;
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (selectedDevices.length === 0) errs._device = 'Chọn ít nhất 1 thiết bị';
    for (const spec of inputs) {
      const v = values[spec.name] ?? spec.default;
      const e = validateField(spec, v);
      if (e) errs[spec.name] = e;
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const toggleDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId],
    );
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onRun(selectedDevices, values);
      onClose();
    } catch (err: any) {
      if (err?.field) {
        setErrors((prev) => ({ ...prev, [err.field]: err.message || 'Lỗi' }));
      } else {
        setErrors((prev) => ({ ...prev, _submit: err?.message || 'Chạy thất bại' }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Chạy: {script.name}</h3>
            {script.description && (
              <p className="text-xs text-slate-500 mt-0.5">{script.description}</p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Thiết bị <span className="text-red-500">*</span>
            </label>
            {onlineDevices.length === 0 ? (
              <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                Không có thiết bị nào online
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                {onlineDevices.map((d) => (
                  <label
                    key={d.id}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDevices.includes(d.id)}
                      onChange={() => toggleDevice(d.id)}
                    />
                    <span className="flex-1">{d.name}</span>
                    <span className="text-xs text-green-600">● {d.status}</span>
                  </label>
                ))}
              </div>
            )}
            {errors._device && <p className="text-xs text-red-600 mt-1">{errors._device}</p>}
          </div>

          {inputs.length > 0 && (
            <div className="space-y-3 border-t border-slate-200 pt-4">
              <h4 className="text-sm font-semibold text-slate-700">Biến đầu vào</h4>
              {inputs.map((spec) => (
                <VariableField
                  key={spec.name}
                  spec={spec}
                  value={values[spec.name]}
                  error={errors[spec.name]}
                  onChange={(v) => setValues({ ...values, [spec.name]: v })}
                />
              ))}
            </div>
          )}

          {errors._submit && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
              {errors._submit}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end p-4 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Huỷ
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg text-sm font-medium"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} fill="currentColor" />}
            Chạy ngay
          </button>
        </div>
      </div>
    </div>
  );
}
