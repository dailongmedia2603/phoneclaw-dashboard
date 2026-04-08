import { useState } from 'react';
import { UserCircle, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, Copy, Search } from 'lucide-react';
import { socialAccounts as socialAccountsApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { showToast } from './Toast';
import type { SocialAccount, SocialChannel, Device } from '../types';

// ============================================================
// Config
// ============================================================

const CHANNEL_CONFIG: Record<SocialChannel, { label: string; color: string }> = {
  facebook: { label: 'Facebook', color: 'bg-blue-100 text-blue-700' },
  tiktok_vn: { label: 'TikTok VN', color: 'bg-red-100 text-red-700' },
  tiktok_us: { label: 'TikTok US', color: 'bg-purple-100 text-purple-700' },
  instagram: { label: 'Instagram', color: 'bg-pink-100 text-pink-700' },
  youtube: { label: 'YouTube', color: 'bg-orange-100 text-orange-700' },
  other: { label: 'Khác', color: 'bg-slate-100 text-slate-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Hoạt động', color: 'bg-green-100 text-green-700' },
  locked: { label: 'Khoá', color: 'bg-yellow-100 text-yellow-700' },
  banned: { label: 'Cấm', color: 'bg-red-100 text-red-700' },
};

const EMPTY_FORM = {
  username: '',
  password: '',
  email: '',
  emailPassword: '',
  channel: 'tiktok_vn' as SocialChannel,
  deviceId: '',
  notes: '',
  status: 'active',
};

// ============================================================
// Helpers
// ============================================================

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).then(
    () => showToast('success', 'Đã sao chép'),
    () => showToast('error', 'Không thể sao chép'),
  );
}

// ============================================================
// Password Cell — toggle show/hide per row
// ============================================================

function PasswordCell({ value }: { value: string }) {
  const [visible, setVisible] = useState(false);
  if (!value) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono text-xs">{visible ? value : '••••••••'}</span>
      <button onClick={() => setVisible(!visible)} className="text-slate-400 hover:text-slate-600" title={visible ? 'Ẩn' : 'Hiện'}>
        {visible ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
      <button onClick={() => copyToClipboard(value)} className="text-slate-400 hover:text-slate-600" title="Sao chép">
        <Copy size={14} />
      </button>
    </span>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function SocialAccounts() {
  // Data
  const { data: accounts, loading, refresh } = useApi<SocialAccount[]>(() => socialAccountsApi.getAll(), []);
  const { data: deviceList } = useApi<Device[]>(() => devicesApi.getAll(), []);
  const deviceOptions = deviceList || [];

  // UI state
  const [search, setSearch] = useState('');
  const [filterChannel, setFilterChannel] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<SocialAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --------------------------------------------------------
  // Filtering
  // --------------------------------------------------------

  const filtered = (accounts || []).filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.username.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    }
    if (filterChannel !== 'all' && a.channel !== filterChannel) return false;
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    return true;
  });

  // --------------------------------------------------------
  // CRUD handlers
  // --------------------------------------------------------

  const openCreate = () => {
    setEditingAccount(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (account: SocialAccount) => {
    setEditingAccount(account);
    setForm({
      username: account.username,
      password: account.password,
      email: account.email,
      emailPassword: account.emailPassword,
      channel: account.channel,
      deviceId: account.deviceId || '',
      notes: account.notes || '',
      status: account.status,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.username.trim()) {
      showToast('error', 'Tên tài khoản là bắt buộc');
      return;
    }
    setSaving(true);
    try {
      if (editingAccount) {
        const res = await socialAccountsApi.update(editingAccount.id, {
          username: form.username,
          password: form.password,
          email: form.email,
          emailPassword: form.emailPassword,
          channel: form.channel,
          deviceId: form.deviceId || undefined,
          notes: form.notes,
          status: form.status as SocialAccount['status'],
        });
        if (!res.success) { showToast('error', res.error || 'Lỗi cập nhật'); setSaving(false); return; }
        showToast('success', 'Cập nhật thành công');
      } else {
        const res = await socialAccountsApi.create({
          username: form.username,
          password: form.password,
          email: form.email,
          emailPassword: form.emailPassword,
          channel: form.channel,
          deviceId: form.deviceId || undefined,
          notes: form.notes,
          status: form.status as SocialAccount['status'],
        });
        if (!res.success) { showToast('error', res.error || 'Lỗi tạo tài khoản'); setSaving(false); return; }
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
    setDeleting(true);
    try {
      const res = await socialAccountsApi.remove(deleteConfirm.id);
      if (!res.success) { showToast('error', res.error || 'Lỗi xoá'); setDeleting(false); return; }
      showToast('success', 'Đã xoá tài khoản');
      setDeleteConfirm(null);
      refresh();
    } catch {
      showToast('error', 'Lỗi không xác định');
    }
    setDeleting(false);
  };

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <UserCircle className="text-blue-600" size={28} />
            Tài khoản
          </h1>
          <p className="text-sm text-slate-500 mt-1">Quản lý tài khoản mạng xã hội (TikTok, Facebook...)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Thêm tài khoản
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 shrink-0 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên tài khoản hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả kênh</option>
          {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Tất cả trạng thái</option>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.label}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">{filtered.length} tài khoản</span>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto bg-white rounded-xl border border-slate-200">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <UserCircle size={48} strokeWidth={1} />
            <p className="mt-3 text-sm">
              {accounts && accounts.length > 0 ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có tài khoản nào. Nhấn "Thêm tài khoản" để bắt đầu.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0 z-10">
              <tr className="text-left text-slate-500 font-medium">
                <th className="px-4 py-3">Tài khoản</th>
                <th className="px-4 py-3">Mật khẩu</th>
                <th className="px-4 py-3">Kênh</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Pass mail</th>
                <th className="px-4 py-3">Thiết bị</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((account) => {
                const channelCfg = CHANNEL_CONFIG[account.channel] || CHANNEL_CONFIG.other;
                const statusCfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.active;
                return (
                  <tr key={account.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{account.username}</td>
                    <td className="px-4 py-3"><PasswordCell value={account.password} /></td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${channelCfg.color}`}>
                        {channelCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {account.email ? (
                        <span className="inline-flex items-center gap-1">
                          {account.email}
                          <button onClick={() => copyToClipboard(account.email)} className="text-slate-400 hover:text-slate-600" title="Sao chép">
                            <Copy size={14} />
                          </button>
                        </span>
                      ) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3"><PasswordCell value={account.emailPassword} /></td>
                    <td className="px-4 py-3 text-slate-600">{account.deviceName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => openEdit(account)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Sửa">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteConfirm(account)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Xoá">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ============================================================ */}
      {/* Add/Edit Modal */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tài khoản <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên đăng nhập"
                />
              </div>
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mật khẩu tài khoản"
                />
              </div>
              {/* Channel */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kênh</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value as SocialChannel })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email liên kết"
                />
              </div>
              {/* Email Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu mail</label>
                <input
                  type="text"
                  value={form.emailPassword}
                  onChange={(e) => setForm({ ...form, emailPassword: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mật khẩu email"
                />
              </div>
              {/* Device */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Thiết bị</label>
                <select
                  value={form.deviceId}
                  onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">— Không chọn —</option>
                  {deviceOptions.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.tailscaleIp})</option>
                  ))}
                </select>
              </div>
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                    <option key={key} value={key}>{cfg.label}</option>
                  ))}
                </select>
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Huỷ
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                {saving && <Loader2 className="animate-spin" size={16} />}
                {editingAccount ? 'Lưu' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Delete Confirmation Modal */}
      {/* ============================================================ */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Xoá tài khoản?</h3>
              <p className="text-sm text-slate-500 mb-1">
                Bạn có chắc muốn xoá tài khoản <strong>{deleteConfirm.username}</strong>?
              </p>
              <p className="text-xs text-slate-400">Hành động này không thể hoàn tác.</p>
            </div>
            <div className="flex items-center gap-3 p-4 border-t border-slate-200">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting && <Loader2 className="animate-spin" size={16} />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
