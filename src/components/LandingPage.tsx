import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import {
  Cpu, Wand2, CalendarDays, Shield, BookOpen, Monitor,
  ChevronDown, Menu, X, Check, ArrowRight, Smartphone,
  FileText, Clock, Users, Zap, Play, Globe, Lock, MessageSquare
} from 'lucide-react';

/* ─────────────────────────────────────
   DATA
   ───────────────────────────────────── */

const stats = [
  { icon: Smartphone, value: 500, suffix: '+', label: 'Thiết bị đang hoạt động' },
  { icon: FileText, value: 1000, suffix: '+', label: 'Kịch bản đã tạo' },
  { icon: Clock, value: 10000, suffix: '+', label: 'Lịch trình tự động' },
  { icon: Users, value: 50, suffix: '+', label: 'Khách hàng tin dùng' },
];

const painPoints = [
  {
    pain: 'Quản lý 10+ điện thoại thủ công mỗi ngày?',
    solution: 'Dashboard tập trung — theo dõi trạng thái, pin, kết nối của tất cả thiết bị real-time.',
  },
  {
    pain: 'Lặp đi lặp lại cùng thao tác trên từng máy?',
    solution: 'Script Editor kéo thả — tạo kịch bản 1 lần, chạy trên hàng trăm máy.',
  },
  {
    pain: 'Phải thức đêm để chạy chiến dịch theo giờ?',
    solution: 'Lịch trình Cron — đặt lịch tự chạy 24/7, nhận thông báo qua Telegram.',
  },
  {
    pain: 'Tài khoản bị ban vì cùng IP/vị trí?',
    solution: 'Proxy + GPS Spoof — mỗi máy một IP khác nhau, giả lập vị trí VN/US.',
  },
];

const features = [
  {
    icon: Cpu,
    title: 'Quản lý thiết bị',
    desc: 'Theo dõi hàng trăm iPhone cùng lúc. Trạng thái online/offline, pin, nhóm thiết bị — tất cả trên một dashboard.',
  },
  {
    icon: Wand2,
    title: 'Script Editor trực quan',
    desc: 'Kéo thả để tạo kịch bản tự động. Tap, swipe, gõ text, mở app, chờ, lặp lại — không cần viết code.',
  },
  {
    icon: CalendarDays,
    title: 'Lịch trình tự động',
    desc: 'Đặt lịch chạy script theo giờ, ngày, tuần. Hệ thống tự chạy 24/7, bạn chỉ cần ngồi theo dõi.',
  },
  {
    icon: Monitor,
    title: 'Điều khiển từ xa',
    desc: 'Xem live screenshot, tap, swipe, gõ text trực tiếp từ trình duyệt. Kiểm soát thiết bị ở bất kỳ đâu.',
  },
  {
    icon: Shield,
    title: 'Proxy & GPS Spoof',
    desc: 'Route traffic qua VN/US. Giả lập GPS, timezone, locale cho từng thiết bị riêng biệt.',
  },
  {
    icon: BookOpen,
    title: 'Kho kịch bản sẵn',
    desc: 'Thư viện kịch bản được tạo sẵn cho TikTok, Facebook, Instagram. Chỉ cần chọn và chạy.',
  },
];

const steps = [
  {
    num: '01',
    title: 'Kết nối thiết bị',
    desc: 'Thêm iPhone vào hệ thống qua Tailscale. Thiết bị tự động xuất hiện trên dashboard.',
  },
  {
    num: '02',
    title: 'Tạo hoặc chọn kịch bản',
    desc: 'Dùng Script Editor kéo thả hoặc chọn kịch bản có sẵn trong kho. Tuỳ chỉnh theo nhu cầu.',
  },
  {
    num: '03',
    title: 'Chạy & theo dõi',
    desc: 'Chạy ngay hoặc đặt lịch tự động. Theo dõi tiến trình real-time, nhận thông báo Telegram.',
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '49.000',
    period: '/tháng',
    features: ['1 thiết bị', '5 kịch bản tự tạo', '2 lịch trình', '500 MB video', 'Kho kịch bản chia sẻ', 'VNC Remote'],
    cta: 'Bắt đầu',
    popular: false,
  },
  {
    name: 'Basic',
    price: '99.000',
    period: '/tháng',
    features: ['3 thiết bị', '15 kịch bản tự tạo', '5 lịch trình', '2 GB video', 'Proxy management', 'Hỗ trợ email'],
    cta: 'Bắt đầu',
    popular: false,
  },
  {
    name: 'Pro',
    price: '249.000',
    period: '/tháng',
    features: ['10 thiết bị', 'Không giới hạn kịch bản', '20 lịch trình', '10 GB video', 'Proxy + GPS Spoof', 'Hỗ trợ ưu tiên'],
    cta: 'Bắt đầu ngay',
    popular: true,
  },
  {
    name: 'Business',
    price: '499.000',
    period: '/tháng',
    features: ['30 thiết bị', 'Không giới hạn kịch bản', 'Không giới hạn lịch trình', '50 GB video', 'API tokens', 'Chat trực tiếp'],
    cta: 'Liên hệ',
    popular: false,
  },
];

const faqs = [
  {
    q: 'Phone Agent hoạt động như thế nào?',
    a: 'Phone Agent kết nối với iPhone thật qua mạng nội bộ Tailscale. Bạn tạo kịch bản trên web, hệ thống gửi lệnh đến từng thiết bị để thực hiện thao tác tự động.',
  },
  {
    q: 'Có cần jailbreak iPhone không?',
    a: 'Cần cài đặt một ứng dụng automation trên iPhone để nhận lệnh từ server. Chi tiết hướng dẫn sẽ được cung cấp sau khi đăng ký.',
  },
  {
    q: 'Tôi có thể quản lý bao nhiêu thiết bị?',
    a: 'Tuỳ gói — từ 1 (Starter) đến 30 (Business). Cần nhiều hơn? Liên hệ để được tư vấn gói Enterprise.',
  },
  {
    q: 'Dữ liệu có an toàn không?',
    a: 'Toàn bộ kết nối qua Tailscale VPN (mã hoá end-to-end). Dữ liệu lưu trên VPS riêng, không chia sẻ với bên thứ 3.',
  },
  {
    q: 'Có hỗ trợ API không?',
    a: 'Có. Gói Business bao gồm API tokens để tích hợp với hệ thống của bạn qua REST API.',
  },
  {
    q: 'Tôi có được dùng thử không?',
    a: 'Có! Đăng ký gói Starter miễn phí 7 ngày để trải nghiệm trước khi quyết định.',
  },
];

/* ─────────────────────────────────────
   HELPER: Counter animation
   ───────────────────────────────────── */

function AnimatedCounter({ target, suffix }: { target: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString('vi-VN')}{suffix}
    </span>
  );
}

/* ─────────────────────────────────────
   SECTIONS
   ───────────────────────────────────── */

function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-slate-900/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="shrink-0">
            <img src="/logo.png" alt="Phone Agent" className="h-9 md:h-11 object-contain brightness-0 invert" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo('features')} className="text-sm text-slate-300 hover:text-white transition-colors">
              Tính năng
            </button>
            <button onClick={() => scrollTo('pricing')} className="text-sm text-slate-300 hover:text-white transition-colors">
              Bảng giá
            </button>
            <button onClick={() => scrollTo('faq')} className="text-sm text-slate-300 hover:text-white transition-colors">
              FAQ
            </button>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-slate-300 hover:text-white border border-white/20 hover:border-white/40 rounded-lg transition-all"
            >
              Đăng nhập
            </Link>
            <Link
              to="/login"
              className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors font-medium"
            >
              Dùng thử miễn phí
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden text-white p-2"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-white/10">
            <nav className="flex flex-col gap-2 pt-4">
              <button onClick={() => scrollTo('features')} className="text-left px-3 py-2 text-sm text-slate-300 hover:text-white">
                Tính năng
              </button>
              <button onClick={() => scrollTo('pricing')} className="text-left px-3 py-2 text-sm text-slate-300 hover:text-white">
                Bảng giá
              </button>
              <button onClick={() => scrollTo('faq')} className="text-left px-3 py-2 text-sm text-slate-300 hover:text-white">
                FAQ
              </button>
              <div className="flex flex-col gap-2 pt-2 px-3">
                <Link to="/login" className="text-center px-4 py-2.5 text-sm text-white border border-white/20 rounded-lg">
                  Đăng nhập
                </Link>
                <Link to="/login" className="text-center px-4 py-2.5 text-sm text-white bg-blue-600 rounded-lg font-medium">
                  Dùng thử miễn phí
                </Link>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
            <Zap size={14} />
            Nền tảng #1 tự động hoá iPhone tại Việt Nam
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
        >
          Quản lý hàng trăm iPhone
          <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            từ một màn hình duy nhất
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          Tự động hoá mọi thao tác — từ lướt TikTok, đăng video, đến quản lý hàng loạt tài khoản.
          Không cần code. Chạy 24/7.
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.45 }}
        >
          <Link
            to="/login"
            className="group inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 text-base"
          >
            Bắt đầu miễn phí
            <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <button
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center gap-2 px-8 py-3.5 text-slate-300 hover:text-white border border-white/15 hover:border-white/30 rounded-xl transition-all text-base"
          >
            <Play size={18} />
            Xem demo
          </button>
        </motion.div>

        {/* Dashboard mockup */}
        <motion.div
          className="mt-16 sm:mt-20 relative mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.6 }}
        >
          <div className="rounded-xl border border-white/10 bg-slate-800/50 backdrop-blur-sm p-1.5 shadow-2xl shadow-black/50">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/60" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                <div className="w-3 h-3 rounded-full bg-green-500/60" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs text-slate-500 bg-slate-700/50 px-4 py-1 rounded-md">phoneagent.io.vn/dashboard</span>
              </div>
            </div>
            {/* Mock dashboard content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['Thiết bị online', 'Đang chạy', 'Lịch trình', 'Kịch bản'].map((label, i) => (
                  <div key={label} className="bg-slate-700/40 rounded-lg p-3 text-center">
                    <div className="text-xl sm:text-2xl font-bold text-white">{[24, 8, 15, 42][i]}</div>
                    <div className="text-xs text-slate-400 mt-1">{label}</div>
                  </div>
                ))}
              </div>
              {/* Device list mockup */}
              <div className="bg-slate-700/30 rounded-lg p-3 space-y-2">
                {[
                  { name: 'iPhone 15 Pro #1', status: 'online', script: 'TikTok Auto Scroll' },
                  { name: 'iPhone 14 #3', status: 'running', script: 'FB Auto Post' },
                  { name: 'iPhone 13 #7', status: 'online', script: '—' },
                ].map((d) => (
                  <div key={d.name} className="flex items-center justify-between px-3 py-2 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${d.status === 'running' ? 'bg-blue-400 animate-pulse' : 'bg-green-400'}`} />
                      <span className="text-sm text-slate-300">{d.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">{d.script}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Glow effect */}
          <div className="absolute -inset-px rounded-xl bg-gradient-to-b from-blue-500/20 to-transparent opacity-50 blur-sm -z-10" />
        </motion.div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="relative py-16 bg-slate-900 border-y border-white/5">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={i}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Icon size={24} className="mx-auto text-blue-400 mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-white">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-sm text-slate-400 mt-1">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PainPointSection() {
  return (
    <section className="relative py-20 md:py-28 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Bạn đang gặp những vấn đề này?
          </h2>
          <p className="text-slate-400 mt-3 text-lg">Phone Agent giải quyết tất cả.</p>
        </motion.div>

        <div className="space-y-6">
          {painPoints.map((pp, i) => (
            <motion.div
              key={i}
              className="grid md:grid-cols-2 gap-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {/* Pain */}
              <div className="flex items-start gap-3 p-5 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="shrink-0 w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center mt-0.5">
                  <X size={16} className="text-red-400" />
                </div>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{pp.pain}</p>
              </div>
              {/* Solution */}
              <div className="flex items-start gap-3 p-5 rounded-xl bg-green-500/5 border border-green-500/10">
                <div className="shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center mt-0.5">
                  <Check size={16} className="text-green-400" />
                </div>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{pp.solution}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="relative py-20 md:py-28 bg-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Mọi thứ bạn cần để scale
          </h2>
          <p className="text-slate-400 mt-3 text-lg">Một nền tảng duy nhất thay thế hàng chục công cụ</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-blue-500/30 hover:bg-white/[0.05] transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 group-hover:bg-blue-500/20 transition-colors">
                  <Icon size={22} className="text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="relative py-20 md:py-28 bg-slate-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Bắt đầu trong 3 phút
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line — desktop only */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

          {steps.map((s, i) => (
            <motion.div
              key={i}
              className="relative text-center"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
            >
              <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/30 relative z-10">
                {s.num}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DemoSection() {
  const [activeTab, setActiveTab] = useState(0);
  const tabs = ['Dashboard', 'Script Editor', 'Điều khiển'];

  return (
    <section id="demo" className="relative py-20 md:py-28 bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Trải nghiệm trực quan
          </h2>
          <p className="text-slate-400 mt-3 text-lg">Giao diện thân thiện, dễ sử dụng</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-8">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === i
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                  : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Mockup area */}
        <motion.div
          className="rounded-xl border border-white/10 bg-slate-800/40 p-1.5 shadow-2xl shadow-black/40"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Browser chrome */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </div>

          <div className="p-4 sm:p-6 min-h-[300px] sm:min-h-[380px]">
            {/* Tab 0: Dashboard */}
            {activeTab === 0 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Online', val: '24', color: 'text-green-400' },
                    { label: 'Running', val: '8', color: 'text-blue-400' },
                    { label: 'Offline', val: '3', color: 'text-slate-500' },
                    { label: 'Tổng', val: '35', color: 'text-white' },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-700/40 rounded-lg p-4 text-center">
                      <div className={`text-2xl font-bold ${s.color}`}>{s.val}</div>
                      <div className="text-xs text-slate-500 mt-1">{s.label}</div>
                    </div>
                  ))}
                </div>
                {/* Chart mockup */}
                <div className="bg-slate-700/30 rounded-lg p-4 h-32 sm:h-44 flex items-end gap-1.5 sm:gap-2">
                  {[40, 55, 35, 70, 45, 80, 60, 90, 50, 75, 85, 65].map((h, i) => (
                    <div key={i} className="flex-1 bg-blue-500/40 rounded-t" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            )}

            {/* Tab 1: Script Editor */}
            {activeTab === 1 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="flex gap-4">
                  {/* Node palette */}
                  <div className="hidden sm:block w-40 bg-slate-700/30 rounded-lg p-3 space-y-2">
                    {['Tap', 'Swipe', 'Wait', 'Launch App', 'Type Text', 'Repeat'].map((n) => (
                      <div key={n} className="px-3 py-1.5 bg-slate-600/40 rounded text-xs text-slate-300 hover:bg-slate-600/60 cursor-pointer">
                        {n}
                      </div>
                    ))}
                  </div>
                  {/* Flow area */}
                  <div className="flex-1 bg-slate-700/20 rounded-lg p-4 relative min-h-[240px] sm:min-h-[300px]">
                    {/* Nodes */}
                    <div className="absolute top-6 left-6 sm:left-12 w-32 sm:w-36 bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-2">
                      <div className="text-xs text-blue-400 font-medium">Launch App</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">TikTok VN</div>
                    </div>
                    <div className="absolute top-6 left-6 sm:left-12 top-24 w-32 sm:w-36 bg-green-600/20 border border-green-500/30 rounded-lg px-3 py-2">
                      <div className="text-xs text-green-400 font-medium">Swipe</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Lướt lên</div>
                    </div>
                    <div className="absolute top-6 left-6 sm:left-12 top-[168px] w-32 sm:w-36 bg-yellow-600/20 border border-yellow-500/30 rounded-lg px-3 py-2">
                      <div className="text-xs text-yellow-400 font-medium">Wait</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">3 giây</div>
                    </div>
                    {/* Connection lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ left: '20px' }}>
                      <line x1="72" y1="52" x2="72" y2="88" stroke="rgba(59,130,246,0.3)" strokeWidth="2" />
                      <line x1="72" y1="128" x2="72" y2="162" stroke="rgba(59,130,246,0.3)" strokeWidth="2" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Control */}
            {activeTab === 2 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div key={n} className="bg-slate-700/30 rounded-lg p-2 sm:p-3 aspect-[9/16] max-h-[140px] sm:max-h-[180px] flex flex-col">
                      <div className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${n <= 4 ? 'bg-green-400' : 'bg-slate-600'}`} />
                        iPhone {n}
                      </div>
                      <div className="flex-1 bg-slate-800/60 rounded flex items-center justify-center">
                        <Smartphone size={20} className="text-slate-600" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="relative py-20 md:py-28 bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Bảng giá đơn giản, minh bạch
          </h2>
          <p className="text-slate-400 mt-3 text-lg">Chọn gói phù hợp. Nâng cấp bất cứ lúc nào.</p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.popular
                  ? 'bg-blue-600/10 border-2 border-blue-500/50 shadow-lg shadow-blue-500/10'
                  : 'bg-white/[0.03] border border-white/[0.06]'
              }`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-lg">
                  PHỔ BIẾN NHẤT
                </div>
              )}

              <div className="mb-5">
                <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">{plan.price}</span>
                  <span className="text-sm text-slate-400">đ{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <Check size={16} className="shrink-0 mt-0.5 text-blue-400" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                  plan.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/25'
                    : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                {plan.cta} <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <section id="faq" className="relative py-20 md:py-28 bg-slate-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Câu hỏi thường gặp
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              className="border border-white/[0.06] rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-white hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-sm sm:text-base font-medium pr-4">{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-slate-400 transition-transform duration-300 ${open.has(i) ? 'rotate-180' : ''}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  open.has(i) ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="px-5 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className="relative py-20 md:py-28 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 overflow-hidden">
      {/* Decorative */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Sẵn sàng tự động hoá?
          </h2>
          <p className="text-blue-100/80 mt-4 text-lg">
            Bắt đầu miễn phí. Không cần thẻ tín dụng.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 px-8 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-colors shadow-lg text-base"
            >
              Tạo tài khoản miễn phí
              <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <p className="text-blue-200/60 text-sm mt-6">
            Hoặc liên hệ tư vấn: <span className="text-white/80 font-medium">support@phoneagent.io.vn</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 bg-slate-950 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favico.png" alt="Phone Agent" className="w-7 h-7 object-contain brightness-0 invert opacity-60" />
            <span className="text-sm text-slate-500">&copy; 2026 Phone Agent. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Điều khoản</a>
            <a href="#" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-white overflow-x-hidden">
      <Header />
      <HeroSection />
      <StatsSection />
      <PainPointSection />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSection />
      <PricingSection />
      <FAQSection />
      <FooterCTA />
      <Footer />
    </div>
  );
}
