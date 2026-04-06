import { useState } from 'react';
import { Package as PackageIcon, Plus, Edit, Trash2, X, Loader2, Check, Minus, Shield, Globe, Zap } from 'lucide-react';
import { packages as packagesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { showToast } from './Toast';
import type { Package } from '../types';

const EMPTY_FORM = {
  name: '',
  maxDevices: '',
  maxScripts: '',
  maxScriptsUnlimited: false,
  maxSchedules: '',
  maxSchedulesUnlimited: false,
  proxyEnabled: true,
  gpsSpoofEnabled: true,
  apiTokensEnabled: true,
  maxVideoStorageMB: '',
  maxVideoUnlimited: false,
};

type FormState = typeof EMPTY_FORM;

function pkgToForm(pkg: Package): FormState {
  return {
    name: pkg.name,
    maxDevices: String(pkg.maxDevices),
    maxScripts: pkg.maxScripts === -1 ? '' : String(pkg.maxScripts),
    maxScriptsUnlimited: pkg.maxScripts === -1,
    maxSchedules: pkg.maxSchedules === -1 ? '' : String(pkg.maxSchedules),
    maxSchedulesUnlimited: pkg.maxSchedules === -1,
    proxyEnabled: pkg.proxyEnabled,
    gpsSpoofEnabled: pkg.gpsSpoofEnabled,
    apiTokensEnabled: pkg.apiTokensEnabled,
    maxVideoStorageMB: pkg.maxVideoStorageMB === -1 ? '' : String(pkg.maxVideoStorageMB),
    maxVideoUnlimited: pkg.maxVideoStorageMB === -1,
  };
}

function formToPayload(form: FormState) {
  return {
    name: form.name,
    maxDevices: parseInt(form.maxDevices) || 1,
    maxScripts: form.maxScriptsUnlimited ? -1 : (parseInt(form.maxScripts) || 5),
    maxSchedules: form.maxSchedulesUnlimited ? -1 : (parseInt(form.maxSchedules) || 2),
    proxyEnabled: form.proxyEnabled,
    gpsSpoofEnabled: form.gpsSpoofEnabled,
    apiTokensEnabled: form.apiTokensEnabled,
    maxVideoStorageMB: form.maxVideoUnlimited ? -1 : (parseInt(form.maxVideoStorageMB) || 500),
  };
}

function LimitBadge({ value, unit }: { value: number; unit?: string }) {
  if (value === -1) return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">∞</span>;
  return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">{value}{unit ? ` ${unit}` : ''}</span>;
}

function ToggleBadge({ enabled }: { enabled: boolean }) {
  return enabled
    ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100"><Check size={10} />Bật</span>
    : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200"><Minus size={10} />Tắt</span>;
}

export default function PackageSettings() {
  const { data: packageList, loading, refresh } = useApi<Package[]>(() => packagesApi.getAll(), []);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Package | null>(null);

  const packages = packageList || [];

  const openCreate = () => { setEditingPkg(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (pkg: Package) => { setEditingPkg(pkg); setForm(pkgToForm(pkg)); setShowModal(true); };
  const set = (key: keyof FormState, val: string | boolean) => setForm(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) { showToast('error', 'Tên gói là bắt buộc'); return; }
    const maxDevices = parseInt(form.maxDevices);
    if (!maxDevices || maxDevices < 1) { showToast('error', 'Số phone tối đa phải lớn hơn 0'); return; }

    setSaving(true);
    try {
      const payload = formToPayload(form);
      if (editingPkg) {
        const res = await packagesApi.update(editingPkg.id, payload);
        if (!res.success) { showToast('error', res.error || 'Lỗi'); setSaving(false); return; }
        showToast('success', 'Cập nhật gói thành công');
      } else {
        const res = await packagesApi.create(payload);
        if (!res.success) { showToast('error', res.error || 'Lỗi'); setSaving(false); return; }
        showToast('success', 'Tạo gói thành công');
      }
      setShowModal(false);
      refresh();
    } catch { showToast('error', 'Lỗi không xác định'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const res = await packagesApi.remove(deleteConfirm.id);
    if (!res.success) { showToast('error', (res as any).error || 'Lỗi'); setDeleteConfirm(null); return; }
    setDeleteConfirm(null); refresh(); showToast('success', 'Đã xoá gói');
  };

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gói phần mềm</h3>
          <p className="text-sm text-slate-500">Quản lý gói giới hạn tính năng cho từng người dùng</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
          <Plus size={18} /> Thêm gói
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin mr-2" /> Đang tải...</div>
        ) : (
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-500">
                <th className="py-3 px-4">Tên gói</th>
                <th className="py-3 px-3 text-center">Phone</th>
                <th className="py-3 px-3 text-center">Kịch bản</th>
                <th className="py-3 px-3 text-center">Lịch trình</th>
                <th className="py-3 px-3 text-center">Proxy</th>
                <th className="py-3 px-3 text-center">GPS</th>
                <th className="py-3 px-3 text-center">API</th>
                <th className="py-3 px-3 text-center">Video</th>
                <th className="py-3 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.length === 0 && (
                <tr><td colSpan={9} className="text-center py-16 text-slate-400"><PackageIcon size={32} className="mx-auto mb-2" /><p className="text-sm">Chưa có gói nào</p></td></tr>
              )}
              {packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0"><PackageIcon size={14} /></div>
                      <span className="font-medium text-slate-900 text-sm">{pkg.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center"><LimitBadge value={pkg.maxDevices} /></td>
                  <td className="py-3 px-3 text-center"><LimitBadge value={pkg.maxScripts ?? -1} /></td>
                  <td className="py-3 px-3 text-center"><LimitBadge value={pkg.maxSchedules ?? -1} /></td>
                  <td className="py-3 px-3 text-center"><ToggleBadge enabled={pkg.proxyEnabled ?? true} /></td>
                  <td className="py-3 px-3 text-center"><ToggleBadge enabled={pkg.gpsSpoofEnabled ?? true} /></td>
                  <td className="py-3 px-3 text-center"><ToggleBadge enabled={pkg.apiTokensEnabled ?? true} /></td>
                  <td className="py-3 px-3 text-center"><LimitBadge value={pkg.maxVideoStorageMB ?? -1} unit="MB" /></td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(pkg)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa"><Edit size={15} /></button>
                      <button onClick={() => setDeleteConfirm(pkg)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xoá"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingPkg ? <><Edit size={18} className="text-blue-600" /> Sửa gói</> : <><Plus size={18} className="text-blue-600" /> Thêm gói</>}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Tên gói + Số phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên gói <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="VD: Starter" className={inputCls} autoFocus />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Số phone tối đa <span className="text-red-500">*</span></label>
                  <input type="number" min="1" value={form.maxDevices} onChange={e => set('maxDevices', e.target.value)} placeholder="VD: 10" className={inputCls} />
                </div>
              </div>

              {/* Giới hạn số lượng */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><Zap size={14} className="text-blue-500" /> Giới hạn số lượng</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Kịch bản tối đa</label>
                      <input type="number" min="1" value={form.maxScripts} onChange={e => set('maxScripts', e.target.value)} placeholder="VD: 5" className={`${inputCls} ${form.maxScriptsUnlimited ? 'opacity-40' : ''}`} disabled={form.maxScriptsUnlimited} />
                    </div>
                    <label className="flex items-center gap-1.5 mt-5 cursor-pointer shrink-0">
                      <input type="checkbox" checked={form.maxScriptsUnlimited} onChange={e => set('maxScriptsUnlimited', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-slate-600">Không giới hạn</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Lịch trình tối đa</label>
                      <input type="number" min="1" value={form.maxSchedules} onChange={e => set('maxSchedules', e.target.value)} placeholder="VD: 2" className={`${inputCls} ${form.maxSchedulesUnlimited ? 'opacity-40' : ''}`} disabled={form.maxSchedulesUnlimited} />
                    </div>
                    <label className="flex items-center gap-1.5 mt-5 cursor-pointer shrink-0">
                      <input type="checkbox" checked={form.maxSchedulesUnlimited} onChange={e => set('maxSchedulesUnlimited', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-slate-600">Không giới hạn</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Dung lượng video (MB)</label>
                      <input type="number" min="1" value={form.maxVideoStorageMB} onChange={e => set('maxVideoStorageMB', e.target.value)} placeholder="VD: 500" className={`${inputCls} ${form.maxVideoUnlimited ? 'opacity-40' : ''}`} disabled={form.maxVideoUnlimited} />
                    </div>
                    <label className="flex items-center gap-1.5 mt-5 cursor-pointer shrink-0">
                      <input type="checkbox" checked={form.maxVideoUnlimited} onChange={e => set('maxVideoUnlimited', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                      <span className="text-xs text-slate-600">Không giới hạn</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bật/tắt tính năng */}
              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2"><Shield size={14} className="text-blue-500" /> Bật / tắt tính năng</h4>
                <div className="space-y-3">
                  {([
                    { key: 'proxyEnabled' as const, label: 'Đổi IP (Proxy)', desc: 'Cho phép đổi IP cho từng thiết bị' },
                    { key: 'gpsSpoofEnabled' as const, label: 'Giả lập vị trí (GPS)', desc: 'Cho phép giả lập GPS, timezone' },
                    { key: 'apiTokensEnabled' as const, label: 'API Tokens', desc: 'Cho phép tạo API token tích hợp' },
                  ]).map(item => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => set(item.key, !form[item.key])}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[item.key] ? 'bg-blue-600' : 'bg-slate-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form[item.key] ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl">Huỷ</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingPkg ? 'Lưu thay đổi' : 'Tạo gói'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4"><Trash2 size={24} /></div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Xoá gói?</h3>
              <p className="text-sm text-slate-500">Gói <strong>{deleteConfirm.name}</strong> ({deleteConfirm.maxDevices} phone) sẽ bị xoá vĩnh viễn.</p>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl">Huỷ</button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl">Xác nhận xoá</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
