import { useState } from 'react';
import { Package as PackageIcon, Plus, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { packages as packagesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { showToast } from './Toast';
import type { Package } from '../types';

const EMPTY_FORM = { name: '', maxDevices: '' };

export default function PackageSettings() {
  const { data: packageList, loading, refresh } = useApi<Package[]>(() => packagesApi.getAll(), []);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<Package | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Package | null>(null);

  const packages = packageList || [];

  const openCreate = () => {
    setEditingPkg(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (pkg: Package) => {
    setEditingPkg(pkg);
    setForm({ name: pkg.name, maxDevices: String(pkg.maxDevices) });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('error', 'Tên gói là bắt buộc');
      return;
    }
    const maxDevices = parseInt(form.maxDevices);
    if (!maxDevices || maxDevices < 1) {
      showToast('error', 'Số phone tối đa phải lớn hơn 0');
      return;
    }

    setSaving(true);
    try {
      if (editingPkg) {
        const res = await packagesApi.update(editingPkg.id, { name: form.name, maxDevices });
        if (!res.success) { showToast('error', res.error || 'Lỗi'); setSaving(false); return; }
        showToast('success', 'Cập nhật gói thành công');
      } else {
        const res = await packagesApi.create({ name: form.name, maxDevices });
        if (!res.success) { showToast('error', res.error || 'Lỗi'); setSaving(false); return; }
        showToast('success', 'Tạo gói thành công');
      }
      setShowModal(false);
      refresh();
    } catch {
      showToast('error', 'Lỗi không xác định');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    const res = await packagesApi.remove(deleteConfirm.id);
    if (!res.success) { showToast('error', (res as any).error || 'Lỗi'); setDeleteConfirm(null); return; }
    setDeleteConfirm(null);
    refresh();
    showToast('success', 'Đã xoá gói');
  };

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div>
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Gói phần mềm</h3>
          <p className="text-sm text-slate-500">Quản lý gói giới hạn số lượng thiết bị cho từng người dùng</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
          <Plus size={18} /> Thêm gói
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 size={24} className="animate-spin mr-2" /> Đang tải...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500">
                <th className="py-3 px-6">Tên gói</th>
                <th className="py-3 px-4">Số phone tối đa</th>
                <th className="py-3 px-4">Ngày tạo</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {packages.length === 0 && (
                <tr><td colSpan={4} className="text-center py-16 text-slate-400"><PackageIcon size={32} className="mx-auto mb-2" /><p className="text-sm">Chưa có gói nào</p></td></tr>
              )}
              {packages.map(pkg => (
                <tr key={pkg.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <PackageIcon size={16} />
                      </div>
                      <span className="font-medium text-slate-900">{pkg.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {pkg.maxDevices} phone
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {new Date(pkg.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(pkg)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => setDeleteConfirm(pkg)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xoá">
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingPkg ? <><Edit size={18} className="text-blue-600" /> Sửa gói</> : <><Plus size={18} className="text-blue-600" /> Thêm gói</>}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên gói <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Ví dụ: Gói 5 Phone" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Số phone tối đa <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="number" min="1" value={form.maxDevices} onChange={e => setForm(p => ({ ...p, maxDevices: e.target.value }))} placeholder="Ví dụ: 5" className={inputCls} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
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
