import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập email và mật khẩu');
      return;
    }
    setError('');
    setLoading(true);
    const err = await login(email, password);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back to landing */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors">
            <ArrowLeft size={16} />
            Về trang chủ
          </Link>
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Phone Agent" className="h-16 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Hệ thống quản lý & tự động hoá iPhone</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-900">Đăng nhập</h2>
            <p className="text-slate-500 text-sm mt-1">Nhập thông tin để truy cập dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full pl-11 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  className="w-full pl-11 pr-12 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-slate-400 text-xs">
            Phone Agent Dashboard v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
