import { useState } from 'react';
import { UserCircle, Plus, Pencil, Trash2, X, Loader2, Eye, EyeOff, Copy, Search, Edit, Zap, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { socialAccounts as socialAccountsApi, devices as devicesApi } from '../services/api';
import { useApi } from '../hooks/useApi';
import { showToast } from './Toast';
import CustomSelect from './CustomSelect';
import type { SocialAccount, SocialChannel, Device } from '../types';

// ============================================================
// Config
// ============================================================

const CHANNEL_CONFIG: Record<SocialChannel, { label: string; color: string; border: string }> = {
  facebook: { label: 'Facebook', color: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
  tiktok_vn: { label: 'TikTok VN', color: 'bg-red-50 text-red-700', border: 'border-red-100' },
  tiktok_us: { label: 'TikTok US', color: 'bg-purple-50 text-purple-700', border: 'border-purple-100' },
  instagram: { label: 'Instagram', color: 'bg-pink-50 text-pink-700', border: 'border-pink-100' },
  youtube: { label: 'YouTube', color: 'bg-orange-50 text-orange-700', border: 'border-orange-100' },
  other: { label: 'Khác', color: 'bg-slate-50 text-slate-600', border: 'border-slate-200' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  active: { label: 'Hoạt động', color: 'bg-emerald-50 text-emerald-700', border: 'border-emerald-100' },
  locked: { label: 'Khoá', color: 'bg-yellow-50 text-yellow-700', border: 'border-yellow-100' },
  banned: { label: 'Cấm', color: 'bg-red-50 text-red-700', border: 'border-red-100' },
};

const CHANNEL_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  ...Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => ({ key, label: cfg.label })),
];

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
  const allAccounts = accounts || [];

  // UI state
  const [search, setSearch] = useState('');
  const [activeChannel, setActiveChannel] = useState('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<SocialAccount | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<SocialAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Test OTP
  const [otpTestAccount, setOtpTestAccount] = useState<SocialAccount | null>(null);
  const [otpTesting, setOtpTesting] = useState(false);
  const [otpTestResult, setOtpTestResult] = useState<{
    success: boolean;
    otpCode?: string;
    elapsedSeconds?: number;
    email?: { from: string; subject: string; internalDate: string; snippet: string };
    attempts?: Array<{
      pollIdx: number;
      candidates: number;
      checked: Array<{ id: string; from: string; subject: string; internalDate: string; tooOld: boolean; matched: string | null }>;
      error?: string;
    }>;
    error?: string;
    gmailError?: string;
  } | null>(null);
  const [otpMaxAgeMinutes, setOtpMaxAgeMinutes] = useState<number>(1440); // 24h default

  // --------------------------------------------------------
  // Filtering
  // --------------------------------------------------------

  const filtered = allAccounts.filter((a) => {
    if (search) {
      const q = search.toLowerCase();
      if (!a.username.toLowerCase().includes(q) && !a.email.toLowerCase().includes(q)) return false;
    }
    if (activeChannel !== 'all' && a.channel !== activeChannel) return false;
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

  const handleTestOtp = async (account: SocialAccount, ageMinutes?: number) => {
    if (!account.gmailAuthorized) {
      showToast('error', 'Tài khoản chưa authorize Gmail');
      return;
    }
    setOtpTestAccount(account);
    setOtpTestResult(null);
    setOtpTesting(true);
    try {
      const res = await socialAccountsApi.testOtp(account.id, {
        waitTimeout: 60,
        maxAgeMinutes: ageMinutes ?? otpMaxAgeMinutes,
      });
      const raw = res as any;
      if (res.success && res.data) {
        setOtpTestResult({ success: true, ...res.data });
        showToast('success', `Đã lấy OTP: ${res.data.otpCode}`);
      } else {
        setOtpTestResult({
          success: false,
          error: res.error,
          attempts: raw.attempts,
          gmailError: raw.gmailError,
        });
        showToast('error', res.error || 'Không lấy được OTP');
      }
    } catch (err: any) {
      setOtpTestResult({ success: false, error: err?.message || 'Lỗi không xác định' });
      showToast('error', 'Lỗi kết nối server');
    }
    setOtpTesting(false);
  };

  const handleAuthorizeGmail = async (accountId: string) => {
    try {
      const res = await fetch(`/api/gmail-auth/generate-link?accountId=${accountId}`, {
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.open(data.data.url, '_blank');
        showToast('success', 'Link authorize đã mở. Đăng nhập Google và cho phép.');
      } else {
        showToast('error', data.error || 'Không tạo được link authorize');
      }
    } catch {
      showToast('error', 'Lỗi kết nối server');
    }
  };

  // --------------------------------------------------------
  // Render
  // --------------------------------------------------------

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header — same as Devices */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Quản lý Tài khoản</h1>
          <p className="text-sm text-slate-500">{allAccounts.length} tài khoản | {allAccounts.filter(a => a.status === 'active').length} hoạt động</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-sm shadow-blue-200"
        >
          <Plus size={18} />
          Thêm tài khoản
        </button>
      </div>

      {/* Toolbar — same style as Devices */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64 shadow-sm"
            />
          </div>

          {/* Channel tabs — same style as device group tabs */}
          <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-sm overflow-x-auto">
            {CHANNEL_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveChannel(tab.key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${
                  activeChannel === tab.key ? 'bg-slate-100 text-slate-800' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-40">
            <CustomSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
              ]}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-500 sticky top-0 z-10">
              <th className="py-3 pl-6 px-4">Tài khoản</th>
              <th className="py-3 px-4">Mật khẩu</th>
              <th className="py-3 px-4">Kênh</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Pass mail</th>
              <th className="py-3 px-4">Thiết bị</th>
              <th className="py-3 px-4">Trạng thái</th>
              <th className="py-3 px-4">Gmail</th>
              <th className="py-3 px-4 text-right pr-6">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  <Loader2 size={24} className="mx-auto mb-2 animate-spin" />
                  <p className="text-sm">Đang tải...</p>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-slate-400">
                  <UserCircle size={32} className="mx-auto mb-2" strokeWidth={1.5} />
                  <p className="text-sm">
                    {allAccounts.length > 0 ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có tài khoản nào'}
                  </p>
                </td>
              </tr>
            ) : filtered.map((account) => {
              const channelCfg = CHANNEL_CONFIG[account.channel] || CHANNEL_CONFIG.other;
              const statusCfg = STATUS_CONFIG[account.status] || STATUS_CONFIG.active;
              return (
                <tr key={account.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="py-3 pl-6 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600">
                        <UserCircle size={16} />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{account.username}</div>
                        <div className="text-xs text-slate-500">{channelCfg.label}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4"><PasswordCell value={account.password} /></td>
                  <td className="py-3 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${channelCfg.color} ${channelCfg.border}`}>
                      {channelCfg.label}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {account.email ? (
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        {account.email}
                        <button onClick={() => copyToClipboard(account.email)} className="text-slate-400 hover:text-slate-600" title="Sao chép">
                          <Copy size={14} />
                        </button>
                      </span>
                    ) : <span className="text-sm text-slate-400">-</span>}
                  </td>
                  <td className="py-3 px-4"><PasswordCell value={account.emailPassword} /></td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-slate-600">{account.deviceName || '-'}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${statusCfg.color} ${statusCfg.border}`}>
                      {statusCfg.label}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {account.gmailAuthorized ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        ✓ Đã kết nối
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleAuthorizeGmail(account.id); }}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors"
                      >
                        Kết nối
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right pr-6">
                    <div className="flex items-center justify-end gap-1">
                      {account.gmailAuthorized && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleTestOtp(account); }}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors opacity-0 group-hover:opacity-100"
                          title="Test lấy OTP từ Gmail"
                        >
                          <Zap size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(account)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Sửa"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(account)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        title="Xoá"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ============================================================ */}
      {/* Add/Edit Modal */}
      {/* ============================================================ */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <h2 className="text-lg font-bold text-slate-900">
                {editingAccount ? 'Sửa tài khoản' : 'Thêm tài khoản'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 scrollbar-thin">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tài khoản <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  placeholder="Tên đăng nhập"
                />
              </div>
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  placeholder="Mật khẩu tài khoản"
                />
              </div>
              {/* Channel */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Kênh</label>
                <CustomSelect
                  value={form.channel}
                  onChange={(v) => setForm({ ...form, channel: v as SocialChannel })}
                  options={Object.entries(CHANNEL_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
                />
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                  type="text"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  placeholder="Email liên kết"
                />
              </div>
              {/* Email Password */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mail</label>
                <input
                  type="text"
                  value={form.emailPassword}
                  onChange={(e) => setForm({ ...form, emailPassword: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm"
                  placeholder="Mật khẩu email"
                />
              </div>
              {/* Device */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Thiết bị</label>
                <CustomSelect
                  value={form.deviceId}
                  onChange={(v) => setForm({ ...form, deviceId: v })}
                  placeholder="— Không chọn —"
                  options={[
                    { value: '', label: '— Không chọn —' },
                    ...deviceOptions.map((d) => ({ value: d.id, label: `${d.name} (${d.tailscaleIp})` })),
                  ]}
                />
              </div>
              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Trạng thái</label>
                <CustomSelect
                  value={form.status}
                  onChange={(v) => setForm({ ...form, status: v })}
                  options={Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))}
                />
              </div>
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Ghi chú</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-sm resize-none"
                  rows={3}
                  placeholder="Ghi chú thêm (tuỳ chọn)"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 shrink-0">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Huỷ
              </button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm shadow-blue-200">
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
            <div className="flex items-center gap-3 p-4 border-t border-slate-100">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                Huỷ
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50">
                {deleting && <Loader2 className="animate-spin" size={16} />}
                Xoá
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* Test OTP Modal */}
      {/* ============================================================ */}
      {otpTestAccount && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => { if (!otpTesting) { setOtpTestAccount(null); setOtpTestResult(null); } }}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Zap className="text-amber-600" size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Test lấy OTP từ Gmail</h2>
                  <p className="text-xs text-slate-500">{otpTestAccount.email || otpTestAccount.username}</p>
                </div>
              </div>
              <button
                onClick={() => { if (!otpTesting) { setOtpTestAccount(null); setOtpTestResult(null); } }}
                disabled={otpTesting}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-6 py-5 space-y-4">
              {/* Window picker */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <Clock size={16} className="text-slate-500 shrink-0" />
                <span className="text-xs font-medium text-slate-600 shrink-0">Tìm email trong:</span>
                <select
                  value={otpMaxAgeMinutes}
                  onChange={(e) => setOtpMaxAgeMinutes(Number(e.target.value))}
                  disabled={otpTesting}
                  className="flex-1 text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50"
                >
                  <option value={10}>10 phút gần nhất (flow kịch bản thật)</option>
                  <option value={60}>1 giờ gần nhất</option>
                  <option value={360}>6 giờ gần nhất</option>
                  <option value={1440}>24 giờ gần nhất (mặc định test)</option>
                  <option value={-1}>Không giới hạn — toàn bộ inbox</option>
                </select>
              </div>

              {otpTesting && !otpTestResult && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="animate-spin text-amber-500 mb-4" size={40} />
                  <p className="text-sm font-medium text-slate-700">Đang poll Gmail (tối đa 60s)…</p>
                  <p className="text-xs text-slate-500 mt-1">Tìm email có OTP từ TikTok/verification</p>
                </div>
              )}

              {otpTestResult?.success && (
                <>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-900">Lấy OTP thành công!</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Mất {otpTestResult.elapsedSeconds}s
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 mb-1">MÃ OTP</p>
                    <div className="flex items-center gap-3">
                      <div className="text-3xl font-mono font-bold tracking-widest text-slate-900">
                        {otpTestResult.otpCode}
                      </div>
                      <button
                        onClick={() => copyToClipboard(otpTestResult.otpCode || '')}
                        className="p-2 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        title="Sao chép"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {otpTestResult.email && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email nguồn</p>
                      <div className="text-sm">
                        <div className="text-slate-500">From:</div>
                        <div className="text-slate-900 font-medium break-all">{otpTestResult.email.from}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-slate-500">Subject:</div>
                        <div className="text-slate-900 font-medium">{otpTestResult.email.subject}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-slate-500">Thời gian nhận:</div>
                        <div className="text-slate-900 font-medium">{new Date(otpTestResult.email.internalDate).toLocaleString('vi-VN')}</div>
                      </div>
                      <div className="text-sm">
                        <div className="text-slate-500">Snippet:</div>
                        <div className="text-slate-700 italic">{otpTestResult.email.snippet}</div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {otpTestResult && !otpTestResult.success && (
                <>
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
                    <XCircle className="text-red-600 shrink-0 mt-0.5" size={24} />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-900">Không lấy được OTP</p>
                      <p className="text-xs text-red-700 mt-1 break-words">{otpTestResult.error}</p>
                      {otpTestResult.gmailError && (
                        <p className="text-xs text-red-600 mt-2 font-mono break-words">
                          Gmail error: {otpTestResult.gmailError}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {otpTestResult?.attempts && otpTestResult.attempts.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Clock size={14} />
                    Chi tiết {otpTestResult.attempts.length} lần poll
                  </p>
                  <div className="space-y-3">
                    {otpTestResult.attempts.map((a, i) => (
                      <div key={i} className="text-xs border-l-2 border-slate-300 pl-3">
                        <div className="font-medium text-slate-700">
                          Poll #{a.pollIdx} — Gmail trả {a.candidates} email
                          {a.error && <span className="text-red-600 ml-2">LỖI: {a.error}</span>}
                        </div>
                        {a.checked.length > 0 && (
                          <ul className="mt-1 space-y-1 text-slate-600">
                            {a.checked.map((c, j) => (
                              <li key={j} className="flex items-start gap-2">
                                <span className={c.matched ? 'text-emerald-600' : c.tooOld ? 'text-slate-400' : 'text-slate-500'}>
                                  {c.matched ? '✓' : c.tooOld ? '⊘' : '✗'}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <div className="truncate"><span className="text-slate-500">from:</span> {c.from}</div>
                                  <div className="truncate"><span className="text-slate-500">subject:</span> {c.subject}</div>
                                  {c.matched && <div className="text-emerald-700 font-mono">→ Matched: {c.matched}</div>}
                                  {c.tooOld && <div className="text-slate-400">→ Ngoài cửa sổ thời gian (thử mở rộng ở trên)</div>}
                                  {!c.matched && !c.tooOld && <div className="text-slate-500">→ Không parse được OTP từ subject/body</div>}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 border-t border-slate-100 shrink-0">
              <button
                onClick={() => { setOtpTestResult(null); handleTestOtp(otpTestAccount); }}
                disabled={otpTesting}
                className="flex-1 flex items-center justify-center gap-2 bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {otpTesting && <Loader2 className="animate-spin" size={16} />}
                <Zap size={16} />
                Thử lại
              </button>
              <button
                onClick={() => { if (!otpTesting) { setOtpTestAccount(null); setOtpTestResult(null); } }}
                disabled={otpTesting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
