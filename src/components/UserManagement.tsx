import { useState } from 'react';
import { Users, Plus, Edit, Trash2, X, Loader2, Shield, User } from 'lucide-react';
import { users as usersApi, packages as packagesApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { showToast } from './Toast';
import CustomSelect from './CustomSelect';
import type { AppUser, Package, Device } from '../types';

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const EMPTY_FORM = { name: '', email: '', password: '', phone: '', role: 'user', packageId: '' };

export default function UserManagement() {
  const { data: userList, loading, refresh } = useApi<AppUser[]>(() => usersApi.getAll(), []);
  const { data: packageList } = useApi<Package[]>(() => packagesApi.getAll(), []);
  const { data: deviceList } = useApi<Device[]>(() => devicesApi.getAll(), []);

  const pkgs = packageList || [];
  const allDevices = deviceList || [];
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<AppUser | null>(null);

  const users = userList || [];

  const openCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setForm({ name: user.name, email: user.email, password: '', phone: user.phone || '', role: user.role, packageId: user.packageId || '' });
    setShowModal(true);
  };

  const getUserDeviceCount = (userId: string) => allDevices.filter(d => d.ownerId === userId).length;
  const getPackageName = (packageId?: string) => {
    if (!packageId) return null;
    return pkgs.find(p => p.id === packageId) || null;
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      showToast('error', 'Tên và email là bắt buộc');
      return;
    }
    if (!editingUser && !form.password) {
      showToast('error', 'Mật khẩu là bắt buộc khi tạo mới');
      return;
    }
    if (form.password && form.password.length < 6) {
      showToast('error', 'Mật khẩu phải ít nhất 6 ký tự');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        const data: any = { name: form.name, email: form.email, phone: form.phone, role: form.role, packageId: form.packageId || '' };
        if (form.password) data.password = form.password;
        const res = await usersApi.update(editingUser.id, data);
        if (!res.success) { showToast('error', res.error || 'Lỗi'); setSaving(false); return; }
        showToast('success', 'Cập nhật thành công');
      } else {
        const res = await usersApi.create({ ...form, packageId: form.packageId || undefined });
        if (!res.success) { showToast('error', res.error || 'Lỗi'); setSaving(false); return; }
        showToast('success', 'Tạo tài khoản thành công');
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
    const res = await usersApi.remove(deleteConfirm.id);
    if (!res.success) { showToast('error', (res as any).error || 'Lỗi'); setDeleteConfirm(null); return; }
    setDeleteConfirm(null);
    refresh();
    showToast('success', 'Đã xoá tài khoản');
  };

  const inputCls = "w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500";

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Quản lý Người dùng</h1>
          <p className="text-sm text-slate-500">{users.length} tài khoản</p>
        </div>
        <button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200">
          <Plus size={18} /> Thêm người dùng
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400"><Loader2 size={24} className="animate-spin mr-2" /> Đang tải...</div>
        ) : (
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
              <th className="py-3 px-6">Người dùng</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Số điện thoại</th>
              <th className="py-3 px-4">Gói</th>
              <th className="py-3 px-4">Quyền</th>
              <th className="py-3 px-4">Ngày tạo</th>
              <th className="py-3 px-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.length === 0 && (
              <tr><td colSpan={7} className="text-center py-16 text-slate-400"><Users size={32} className="mx-auto mb-2" /><p className="text-sm">Chưa có người dùng</p></td></tr>
            )}
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center ${user.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                      {user.role === 'admin' ? <Shield size={16} /> : <User size={16} />}
                    </div>
                    <span className="font-medium text-slate-900">{user.name}</span>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">{user.email}</td>
                <td className="py-4 px-4 text-sm text-slate-600">{user.phone || '-'}</td>
                <td className="py-4 px-4">
                  {(() => {
                    const pkg = getPackageName(user.packageId);
                    if (!pkg) return <span className="text-xs text-slate-400">-</span>;
                    const used = getUserDeviceCount(user.id);
                    const pct = Math.round((used / pkg.maxDevices) * 100);
                    return (
                      <div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {pkg.name} ({used}/{pkg.maxDevices})
                        </span>
                        <div className="w-20 bg-slate-100 rounded-full h-1 mt-1.5">
                          <div className={`h-1 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })()}
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                    user.role === 'admin'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}>
                    {user.role === 'admin' ? 'Admin' : 'Người dùng'}
                  </span>
                </td>
                <td className="py-4 px-4 text-sm text-slate-600">{formatDate(user.createdAt)}</td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(user)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Sửa">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => setDeleteConfirm(user)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xoá">
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
                {editingUser ? <><Edit size={18} className="text-blue-600" /> Sửa người dùng</> : <><Plus size={18} className="text-blue-600" /> Thêm người dùng</>}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tên <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="text" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} placeholder="Nguyễn Văn A" className={inputCls} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email đăng nhập <span className="text-red-500">(Bắt buộc)</span></label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} placeholder="user@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mật khẩu {editingUser ? '(để trống nếu không đổi)' : <span className="text-red-500">(Bắt buộc)</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} placeholder={editingUser ? '••••••' : 'Tối thiểu 6 ký tự'} className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Số điện thoại (tuỳ chọn)</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} placeholder="0901234567" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Phân quyền <span className="text-red-500">(Bắt buộc)</span></label>
                <CustomSelect
                  value={form.role}
                  onChange={v => setForm(p => ({...p, role: v}))}
                  options={[
                    { value: 'admin', label: 'Admin (Toàn quyền)' },
                    { value: 'user', label: 'Người dùng (Giới hạn)' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gói phần mềm</label>
                <CustomSelect
                  value={form.packageId}
                  onChange={v => setForm(p => ({...p, packageId: v}))}
                  options={[
                    { value: '', label: 'Không giới hạn' },
                    ...pkgs.map(p => ({ value: p.id, label: `${p.name} (${p.maxDevices} phone)` })),
                  ]}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-xl">Huỷ</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
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
              <h3 className="text-lg font-bold text-slate-900 mb-2">Xoá tài khoản?</h3>
              <p className="text-sm text-slate-500">Tài khoản <strong>{deleteConfirm.name}</strong> ({deleteConfirm.email}) sẽ bị xoá vĩnh viễn.</p>
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
