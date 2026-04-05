import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'motion/react';
import {
  Cpu, Wand2, CalendarDays, Shield, BookOpen, Monitor,
  ChevronDown, Menu, X, Check, ArrowRight, Smartphone,
  Clock, Users, Zap, Star, Quote, MessageCircleHeart,
  AlertCircle, Lightbulb, ShieldCheck, TrendingUp, TrendingDown,
  Sparkles, CheckCircle2, BrainCircuit, MonitorSmartphone,
  Video, ShoppingCart, Megaphone, Briefcase,
  MessageSquare, Bot, Globe, Lock
} from 'lucide-react';

/* ═══════════════════════════════════════
   DATA
   ═══════════════════════════════════════ */

const bullets = [
  {
    icon: <Wand2 className="w-6 h-6 text-rose-500" />,
    title: 'Trình tạo kịch bản kéo thả',
    description: 'Tạo kịch bản tự động chỉ bằng kéo thả: bấm, vuốt, gõ chữ, mở app, chờ, lặp lại — không cần viết một dòng code nào.',
    bgColor: 'bg-rose-50',
  },
  {
    icon: <Cpu className="w-6 h-6 text-orange-500" />,
    title: 'Quản lý đa thiết bị',
    description: 'Theo dõi hàng trăm iPhone cùng lúc. Trạng thái online/offline, pin, nhóm thiết bị — tất cả trên một dashboard duy nhất.',
    bgColor: 'bg-orange-50',
  },
  {
    icon: <CalendarDays className="w-6 h-6 text-orange-500" />,
    title: 'Lịch trình tự động 24/7',
    description: 'Đặt lịch chạy script theo giờ, ngày, tuần. Hệ thống tự chạy ngay cả khi bạn đang ngủ, và báo cáo kết quả qua Telegram.',
    bgColor: 'bg-orange-50',
  },
];

const pains = [
  {
    icon: <MonitorSmartphone className="w-8 h-8 text-rose-600" />,
    text: 'Bạn có đang mệt mỏi vì phải lặp đi lặp lại cùng một thao tác trên từng máy — lướt, like, follow, đăng video — hàng chục lần mỗi ngày?',
  },
  {
    icon: <Clock className="w-8 h-8 text-rose-600" />,
    text: 'Bạn có đang thức đêm để chạy chiến dịch đúng "giờ vàng" vì không có hệ thống lịch trình tự động nào đủ thông minh?',
  },
  {
    icon: <AlertCircle className="w-8 h-8 text-rose-600" />,
    text: 'Tài khoản liên tục bị ban vì dùng chung IP, cùng vị trí cho nhiều máy — và bạn không biết cách đổi địa chỉ mạng hay giả lập vị trí?',
  },
];

const benefits = [
  {
    id: 'script-editor',
    title: 'Trình tạo kịch bản kéo thả',
    desc: 'Tạo kịch bản tự động bằng cách ghép các bước như xếp hình. Hỗ trợ bấm, vuốt, gõ chữ, mở app, chờ, lặp lại, rẽ nhánh điều kiện — không cần viết code.',
    icon: <Wand2 className="w-8 h-8 text-blue-600" />,
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    colSpan: 'md:col-span-2',
    highlight: 'Không cần code',
  },
  {
    id: 'auto-schedule',
    title: 'Lịch trình tự động thông minh',
    desc: 'Đặt lịch chạy kịch bản tự động theo giờ, ngày, tuần. Hệ thống tự chạy 24/7 và gửi thông báo qua Telegram khi hoàn thành.',
    icon: <Zap className="w-8 h-8 text-orange-500" />,
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    colSpan: 'md:col-span-1',
    highlight: 'Tự động 100%',
  },
  {
    id: 'remote-control',
    title: 'Điều khiển từ xa',
    desc: 'Xem màn hình trực tiếp, bấm, vuốt, gõ chữ ngay từ trình duyệt web. Kiểm soát thiết bị ở bất kỳ đâu, bất kỳ lúc nào.',
    icon: <Monitor className="w-8 h-8 text-emerald-600" />,
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    colSpan: 'md:col-span-1',
    highlight: 'Real-time',
  },
  {
    id: 'proxy',
    title: 'Đổi IP & giả lập vị trí',
    desc: 'Mỗi máy một địa chỉ mạng riêng (VN/US). Giả lập vị trí, múi giờ cho từng thiết bị riêng biệt. Bảo vệ tài khoản an toàn.',
    icon: <Shield className="w-8 h-8 text-purple-600" />,
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    colSpan: 'md:col-span-1',
    highlight: 'An toàn tuyệt đối',
  },
  {
    id: 'shared-scripts',
    title: 'Kho kịch bản sẵn',
    desc: 'Thư viện kịch bản được tạo sẵn cho TikTok, Facebook, Instagram. Chỉ cần chọn và chạy ngay lập tức.',
    icon: <BookOpen className="w-8 h-8 text-rose-600" />,
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    colSpan: 'md:col-span-1',
    highlight: 'Chạy ngay',
  },
];

const industries = [
  {
    name: 'TikTok Agency',
    icon: Video,
    problem: 'Quản lý hàng chục tài khoản TikTok trên nhiều máy, phải thủ công lướt, like, follow từng cái một. Nhân viên không đủ để vận hành 24/7.',
    solution: 'Phone Agent tự động hoá toàn bộ: lướt FYP, like video, follow theo kịch bản, đăng video tự động. Chạy song song trên hàng trăm máy cùng lúc.',
    notLose: 'Không bỏ lỡ "giờ vàng" đăng bài hay thời điểm tương tác cao nhất trong ngày.',
    gain: 'Gấp 10x năng suất vận hành TikTok với cùng số nhân viên.',
  },
  {
    name: 'Dropshipper',
    icon: ShoppingCart,
    problem: 'Phải đăng sản phẩm thủ công lên nhiều tài khoản, lặp đi lặp lại cùng thao tác hàng trăm lần mỗi ngày trên từng điện thoại.',
    solution: 'Tạo script đăng sản phẩm một lần, chạy trên tất cả thiết bị. Đặt lịch đăng tự động theo giờ, Phone Agent làm hết phần còn lại.',
    notLose: 'Không mất thời gian đăng bài thủ công — dành thời gian cho chiến lược và chốt đơn.',
    gain: 'Đăng sản phẩm trên 50+ tài khoản chỉ trong vài phút thay vì cả ngày.',
  },
  {
    name: 'MMO Freelancer',
    icon: Globe,
    problem: 'Farm nhiều tài khoản cần thao tác khác nhau trên từng máy, dễ bị ban vì hành vi giống nhau hoặc trùng IP.',
    solution: 'Phone Agent + đổi IP & giả lập vị trí: mỗi máy một địa chỉ mạng riêng, vị trí riêng, thao tác ngẫu nhiên hoá. Kịch bản tự tạo hành vi tự nhiên, khó bị phát hiện.',
    notLose: 'Không mất tài khoản đã nuôi lâu vì bị phát hiện dùng tool.',
    gain: 'Scale số lượng tài khoản gấp 5-10 lần mà vẫn an toàn.',
  },
  {
    name: 'Livestream',
    icon: Users,
    problem: 'Cần "đổ view" và tương tác cho nhiều phiên live cùng lúc, nhưng không đủ người để thao tác trên từng máy.',
    solution: 'Kịch bản tự động vào live, bình luận, thả tim, ở lại phiên live. Chạy đồng thời trên hàng chục thiết bị với nội dung bình luận random.',
    notLose: 'Không để phiên live "ế" vì thiếu tương tác ban đầu.',
    gain: 'Tạo hiệu ứng đám đông ngay từ những phút đầu tiên của mỗi phiên live.',
  },
  {
    name: 'Marketing Agency',
    icon: Megaphone,
    problem: 'Chạy chiến dịch seeding, tạo buzz trên nhiều nền tảng đòi hỏi nhân sự vận hành lớn và chi phí cao.',
    solution: 'Tự động hoá seeding: like, comment, share theo kịch bản trên hàng trăm tài khoản. Đặt lịch chạy theo timeline chiến dịch.',
    notLose: 'Không tốn chi phí thuê nhân sự thủ công cho các chiến dịch lặp đi lặp lại.',
    gain: 'Giảm 80% chi phí vận hành seeding với hiệu quả tương đương.',
  },
  {
    name: 'E-commerce',
    icon: Briefcase,
    problem: 'Quản lý nhiều shop trên các sàn TMĐT, phải đăng nhập từng tài khoản, cập nhật giá, trả lời chat thủ công.',
    solution: 'Phone Agent quản lý tất cả thiết bị đăng nhập các shop. Script tự động cập nhật sản phẩm, respond chat, check đơn hàng.',
    notLose: 'Không bỏ lỡ đơn hàng hay chat khách vì phản hồi chậm.',
    gain: 'Vận hành 10+ shop online chỉ với 1-2 nhân viên giám sát.',
  },
];

const testimonials = [
  {
    name: 'Anh Minh Đức',
    role: 'Chủ Agency TikTok',
    content: 'Từ ngày dùng Phone Agent, đội ngũ 3 người quản được 80 máy. Trước phải thuê 10 người làm thủ công. Trình tạo kịch bản kéo thả quá tiện, nhân viên mới vào 1 ngày là dùng được.',
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
  {
    name: 'Chị Thu Hằng',
    role: 'Dropshipper TikTok Shop',
    content: 'Đăng sản phẩm lên 30 tài khoản mỗi ngày giờ chỉ mất 5 phút thay vì cả buổi sáng. Tính năng đặt lịch tự động là "vũ khí bí mật" — đặt lịch đăng lúc 7h tối rồi đi ngủ.',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    name: 'Anh Hoàng Nam',
    role: 'Freelancer MMO',
    content: 'Tính năng đổi IP + giả lập vị trí cứu tài khoản mình nhiều lần. Trước nuôi 20 nick bị khoá hết, giờ chạy 50 nick ổn định nhờ mỗi máy 1 địa chỉ mạng riêng. Rất đáng tiền gói Pro!',
    avatar: 'https://i.pravatar.cc/150?img=14',
  },
  {
    name: 'Chị Ngọc Ánh',
    role: 'Marketing Manager',
    content: 'Chạy chiến dịch seeding cho khách hàng giờ nhẹ nhàng hơn nhiều. Kho kịch bản sẵn cho TikTok và Facebook giúp tiết kiệm cả tuần setup. Recommend cho mọi agency!',
    avatar: 'https://i.pravatar.cc/150?img=9',
  },
];

const plans = [
  {
    name: 'Starter',
    desc: 'Gói trải nghiệm cho cá nhân mới bắt đầu.',
    price: '49.000',
    period: '/ tháng',
    features: ['1 thiết bị', '5 kịch bản tự tạo', '2 lịch trình', '500 MB video', 'Kho kịch bản chia sẻ', 'VNC Remote'],
    highlight: false,
  },
  {
    name: 'Basic',
    desc: 'Dành cho cá nhân cần quản lý nhiều thiết bị hơn.',
    price: '99.000',
    period: '/ tháng',
    features: ['3 thiết bị', '15 kịch bản tự tạo', '5 lịch trình', '2 GB video', 'Đổi IP cho thiết bị', 'Hỗ trợ email'],
    highlight: false,
  },
  {
    name: 'Pro',
    badge: 'Phổ biến nhất',
    desc: 'Gói tối ưu cho team và freelancer chuyên nghiệp.',
    price: '249.000',
    period: '/ tháng',
    features: ['10 thiết bị', 'Không giới hạn kịch bản', '20 lịch trình', '10 GB video', 'Đổi IP + giả lập vị trí', 'Hỗ trợ ưu tiên'],
    highlight: true,
  },
  {
    name: 'Business',
    desc: 'Dành cho doanh nghiệp và agency quy mô lớn.',
    price: '499.000',
    period: '/ tháng',
    features: ['30 thiết bị', 'Không giới hạn kịch bản', 'Không giới hạn lịch trình', '50 GB video', 'API tokens', 'Chat trực tiếp'],
    highlight: false,
  },
];

const faqs = [
  { q: 'Phone Agent hoạt động như thế nào?', a: 'Phone Agent kết nối với iPhone thật qua mạng nội bộ Tailscale. Bạn tạo kịch bản trên web, hệ thống gửi lệnh đến từng thiết bị để thực hiện thao tác tự động.' },
  { q: 'Có cần jailbreak iPhone không?', a: 'Cần cài đặt một ứng dụng automation trên iPhone để nhận lệnh từ server. Chi tiết hướng dẫn sẽ được cung cấp sau khi đăng ký.' },
  { q: 'Tôi có thể quản lý bao nhiêu thiết bị?', a: 'Tuỳ gói — từ 1 (Starter) đến 30 (Business). Cần nhiều hơn? Liên hệ để được tư vấn gói Enterprise.' },
  { q: 'Dữ liệu có an toàn không?', a: 'Toàn bộ kết nối qua Tailscale VPN (mã hoá end-to-end). Dữ liệu lưu trên VPS riêng, không chia sẻ với bên thứ 3.' },
  { q: 'Có hỗ trợ API không?', a: 'Có. Gói Business bao gồm API tokens để tích hợp với hệ thống của bạn qua REST API.' },
  { q: 'Tôi có được dùng thử không?', a: 'Có! Đăng ký gói Starter và trải nghiệm 7 ngày miễn phí trước khi quyết định.' },
];

/* ═══════════════════════════════════════
   SECTIONS
   ═══════════════════════════════════════ */

function Navbar() {
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
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-4">
      <div className={`backdrop-blur-md border shadow-sm rounded-full px-6 py-3 flex items-center justify-between w-full mx-4 md:mx-8 lg:mx-12 transition-all duration-300 ${
        scrolled ? 'bg-white/90 border-gray-200 shadow-md' : 'bg-white/80 border-white/20'
      }`}>
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Phone Agent" className="h-9 object-contain" />
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <button onClick={() => scrollTo('features')} className="hover:text-gray-900 transition-colors">Tính năng</button>
          <button onClick={() => scrollTo('pricing')} className="hover:text-gray-900 transition-colors">Bảng giá</button>
          <button onClick={() => scrollTo('faq')} className="hover:text-gray-900 transition-colors">FAQ</button>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">Đăng nhập</Link>
          <Link to="/login" className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors">
            Dùng thử miễn phí
          </Link>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 md:hidden">
          <div className="flex flex-col gap-2">
            <button onClick={() => scrollTo('features')} className="text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">Tính năng</button>
            <button onClick={() => scrollTo('pricing')} className="text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">Bảng giá</button>
            <button onClick={() => scrollTo('faq')} className="text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 rounded-xl">FAQ</button>
            <hr className="my-2 border-gray-100" />
            <Link to="/login" className="text-center px-4 py-2.5 text-sm text-gray-700 font-medium">Đăng nhập</Link>
            <Link to="/login" className="text-center px-4 py-2.5 text-sm bg-orange-500 text-white rounded-xl font-medium">Dùng thử miễn phí</Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-[#f97316] to-[#c2410c]">
      {/* Animated blobs */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" />
      <div className="absolute top-20 right-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '2s' }} />
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob" style={{ animationDelay: '4s' }} />

      <div className="w-full px-4 md:px-8 lg:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-5 py-2 text-sm md:text-base font-semibold text-white mb-8 shadow-sm"
        >
          <Zap className="w-5 h-5 text-yellow-400 fill-current" />
          NỀN TẢNG #1 TỰ ĐỘNG HOÁ iPHONE TẠI VIỆT NAM
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-8 max-w-5xl mx-auto"
        >
          Quản lý hàng trăm iPhone{' '}
          <span className="bg-white text-orange-600 px-4 py-1 rounded-md inline-block mt-2 md:mt-0 shadow-sm">từ một màn hình</span>{' '}
          duy nhất
          <span className="text-3xl md:text-4xl lg:text-5xl font-medium opacity-90 block mt-4">
            — Tự động hoá mọi thao tác, chạy 24/7
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-orange-50 mb-12 max-w-4xl mx-auto leading-relaxed font-medium"
        >
          Từ lướt TikTok, đăng video, farm tài khoản đến quản lý hàng loạt thiết bị — <strong className="text-yellow-300">Phone Agent</strong> biến điện thoại của bạn thành đội quân tự động. Không cần code. Không cần giám sát.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link to="/login" className="w-full sm:w-auto bg-yellow-400 text-orange-900 hover:bg-yellow-300 px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
            <Bot className="w-6 h-6" />
            Dùng thử miễn phí
          </Link>
          <button
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-full text-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Xem demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function IntrigueBulletsSection() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
            Những tính năng bạn sẽ <span className="text-orange-600">yêu thích</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bullets.map((bullet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className={`w-14 h-14 rounded-2xl ${bullet.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {bullet.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug">{bullet.title}</h3>
              <p className="text-gray-600 leading-relaxed">{bullet.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PainPointsSection() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-200/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-200/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-7"
          >
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-10">
              Sự thật <span className="text-rose-600">đau lòng</span> về việc quản lý iPhone thủ công
            </h2>

            <div className="space-y-8">
              {pains.map((pain, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 + 0.3 }}
                  className="flex gap-6 items-start group"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white border border-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-50 transition-colors shadow-lg shadow-rose-900/5">
                    {pain.icon}
                  </div>
                  <p className="text-lg md:text-xl text-slate-700 leading-relaxed pt-1 font-medium">{pain.text}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-5 relative mt-10 lg:mt-0"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-orange-200 rounded-[3rem] transform rotate-3 scale-105 -z-10 blur-xl opacity-60" />
            <div className="bg-white border border-rose-100 rounded-[3rem] p-10 md:p-12 shadow-2xl shadow-rose-900/10 relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full" />
              <TrendingDown className="w-16 h-16 text-rose-500 mb-8" />
              <p className="text-2xl md:text-3xl font-medium text-slate-900 leading-relaxed mb-10">
                "Đó là lý do tại sao <span className="text-rose-600 font-bold">90%</span> thời gian của bạn đang bị lãng phí vào những <span className="text-rose-600 font-bold">thao tác lặp đi lặp lại</span>."
              </p>
              <div className="mt-auto">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '90%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <span>Thời gian hiệu quả</span>
                  <span className="text-rose-600">Lãng phí (90%)</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  return (
    <section id="demo" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          {/* Left: SVG Illustration */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 relative order-2 lg:order-1"
          >
            <div className="relative w-full max-w-lg mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-yellow-300 rounded-[3rem] transform -rotate-3 scale-105 opacity-20 blur-xl" />
              <svg viewBox="0 0 520 480" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto relative z-10 drop-shadow-xl">
                {/* Background card */}
                <rect x="10" y="10" width="500" height="460" rx="32" fill="white" stroke="#fed7aa" strokeWidth="1.5"/>

                {/* Central monitor */}
                <rect x="130" y="50" width="260" height="170" rx="16" fill="#1e293b"/>
                <rect x="142" y="62" width="236" height="134" rx="8" fill="#0f172a"/>
                {/* Monitor stand */}
                <rect x="230" y="220" width="60" height="16" rx="2" fill="#94a3b8"/>
                <rect x="210" y="232" width="100" height="8" rx="4" fill="#cbd5e1"/>

                {/* Screen content — stats */}
                <rect x="154" y="74" width="64" height="36" rx="6" fill="#1e3a5f"/>
                <text x="186" y="95" textAnchor="middle" fill="#34d399" fontSize="16" fontWeight="bold">24</text>
                <text x="186" y="106" textAnchor="middle" fill="#94a3b8" fontSize="7">Online</text>

                <rect x="226" y="74" width="64" height="36" rx="6" fill="#1e3a5f"/>
                <text x="258" y="95" textAnchor="middle" fill="#60a5fa" fontSize="16" fontWeight="bold">8</text>
                <text x="258" y="106" textAnchor="middle" fill="#94a3b8" fontSize="7">Đang chạy</text>

                <rect x="298" y="74" width="64" height="36" rx="6" fill="#1e3a5f"/>
                <text x="330" y="95" textAnchor="middle" fill="#fb923c" fontSize="16" fontWeight="bold">15</text>
                <text x="330" y="106" textAnchor="middle" fill="#94a3b8" fontSize="7">Kịch bản</text>

                {/* Screen content — device rows */}
                {[
                  { y: 120, name: 'iPhone 15 Pro #1', color: '#60a5fa', status: 'TikTok Auto' },
                  { y: 142, name: 'iPhone 14 #3', color: '#34d399', status: 'FB Post' },
                  { y: 164, name: 'iPhone 13 #7', color: '#34d399', status: 'Chờ lệnh' },
                ].map((d) => (
                  <g key={d.name}>
                    <rect x="154" y={d.y} width="210" height="18" rx="4" fill="#1e3a5f" opacity="0.6"/>
                    <circle cx="164" cy={d.y + 9} r="3" fill={d.color}>
                      {d.color === '#60a5fa' && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>}
                    </circle>
                    <text x="174" y={d.y + 13} fill="#e2e8f0" fontSize="8" fontWeight="500">{d.name}</text>
                    <text x="354" y={d.y + 13} textAnchor="end" fill="#94a3b8" fontSize="7">{d.status}</text>
                  </g>
                ))}

                {/* Phones around — Left column */}
                {[
                  { x: 30, y: 80, label: '#1', color: '#34d399' },
                  { x: 30, y: 190, label: '#2', color: '#60a5fa' },
                  { x: 30, y: 300, label: '#3', color: '#34d399' },
                ].map((p, i) => (
                  <g key={`left-${i}`}>
                    <rect x={p.x} y={p.y} width="52" height="84" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
                    <rect x={p.x + 4} y={p.y + 10} width="44" height="58" rx="4" fill="#f1f5f9"/>
                    <circle cx={p.x + 26} cy={p.y + 76} r="4" fill="#e2e8f0"/>
                    <circle cx={p.x + 42} cy={p.y + 6} r="2.5" fill={p.color}>
                      <animate attributeName="opacity" values="1;0.3;1" dur={`${2 + i * 0.5}s`} repeatCount="indefinite"/>
                    </circle>
                    <text x={p.x + 26} y={p.y + 44} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">{p.label}</text>
                    {/* Connection line to center */}
                    <line x1={p.x + 52} y1={p.y + 42} x2="130" y2="135" stroke="#fdba74" strokeWidth="1" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="strokeDashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite"/>
                    </line>
                  </g>
                ))}

                {/* Phones around — Right column */}
                {[
                  { x: 438, y: 80, label: '#4', color: '#34d399' },
                  { x: 438, y: 190, label: '#5', color: '#fb923c' },
                  { x: 438, y: 300, label: '#6', color: '#34d399' },
                ].map((p, i) => (
                  <g key={`right-${i}`}>
                    <rect x={p.x} y={p.y} width="52" height="84" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1.5"/>
                    <rect x={p.x + 4} y={p.y + 10} width="44" height="58" rx="4" fill="#f1f5f9"/>
                    <circle cx={p.x + 26} cy={p.y + 76} r="4" fill="#e2e8f0"/>
                    <circle cx={p.x + 42} cy={p.y + 6} r="2.5" fill={p.color}>
                      <animate attributeName="opacity" values="1;0.3;1" dur={`${2.2 + i * 0.4}s`} repeatCount="indefinite"/>
                    </circle>
                    <text x={p.x + 26} y={p.y + 44} textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="bold">{p.label}</text>
                    {/* Connection line to center */}
                    <line x1={p.x} y1={p.y + 42} x2="390" y2="135" stroke="#fdba74" strokeWidth="1" strokeDasharray="4 3" opacity="0.5">
                      <animate attributeName="strokeDashoffset" from="0" to="-14" dur="2s" repeatCount="indefinite"/>
                    </line>
                  </g>
                ))}

                {/* Bottom section — command flow */}
                <rect x="100" y="270" width="320" height="80" rx="16" fill="#fff7ed" stroke="#fed7aa" strokeWidth="1"/>

                {/* Flow steps */}
                <rect x="118" y="286" width="72" height="48" rx="10" fill="white" stroke="#fdba74" strokeWidth="1"/>
                <text x="154" y="306" textAnchor="middle" fill="#ea580c" fontSize="8" fontWeight="bold">Tạo kịch bản</text>
                <text x="154" y="318" textAnchor="middle" fill="#9ca3af" fontSize="7">Kéo & thả</text>

                {/* Arrow 1 */}
                <path d="M194 310 L212 310" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#arrowOrange)"/>

                <rect x="216" y="286" width="72" height="48" rx="10" fill="white" stroke="#fdba74" strokeWidth="1"/>
                <text x="252" y="306" textAnchor="middle" fill="#ea580c" fontSize="8" fontWeight="bold">Đặt lịch</text>
                <text x="252" y="318" textAnchor="middle" fill="#9ca3af" fontSize="7">Tự động 24/7</text>

                {/* Arrow 2 */}
                <path d="M292 310 L310 310" stroke="#fb923c" strokeWidth="1.5" markerEnd="url(#arrowOrange)"/>

                <rect x="314" y="286" width="88" height="48" rx="10" fill="white" stroke="#fdba74" strokeWidth="1"/>
                <text x="358" y="306" textAnchor="middle" fill="#ea580c" fontSize="8" fontWeight="bold">Chạy tự động</text>
                <text x="358" y="318" textAnchor="middle" fill="#9ca3af" fontSize="7">Trên hàng trăm máy</text>

                {/* Bottom label */}
                <rect x="160" y="370" width="200" height="32" rx="16" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1"/>
                <text x="260" y="391" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="bold">Kết nối bảo mật qua VPN</text>

                {/* Pulsing signal rings from center monitor */}
                <circle cx="260" cy="135" r="30" fill="none" stroke="#fb923c" strokeWidth="0.8" opacity="0.3">
                  <animate attributeName="r" values="30;60;30" dur="3s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="260" cy="135" r="30" fill="none" stroke="#fb923c" strokeWidth="0.5" opacity="0.2">
                  <animate attributeName="r" values="30;80;30" dur="3s" begin="0.5s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.2;0;0.2" dur="3s" begin="0.5s" repeatCount="indefinite"/>
                </circle>

                {/* Arrow marker definition */}
                <defs>
                  <marker id="arrowOrange" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
                    <path d="M0,0 L8,3 L0,6" fill="#fb923c"/>
                  </marker>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Right: Text */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm mb-6 uppercase tracking-wider border border-orange-200">
              <Zap className="w-4 h-4" />
              Giải pháp đột phá
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6">
              Giới thiệu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                Phone Agent
              </span>
            </h2>

            <p className="text-2xl text-slate-800 font-bold mb-6 leading-snug">
              Nền tảng quản lý & tự động hoá iPhone mạnh mẽ nhất hiện nay.
            </p>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Không chỉ là công cụ quản lý thiết bị, Phone Agent mang đến một <strong className="text-orange-600 text-xl mx-1">"trung tâm điều khiển"</strong> toàn diện: tạo kịch bản kéo thả, đặt lịch tự động, đổi IP thông minh — tất cả trên một màn hình duy nhất.
            </p>

            <div className="space-y-6">
              <div className="flex gap-5 items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                  <Wand2 className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Tạo kịch bản kéo thả</h3>
                  <p className="text-slate-600 leading-relaxed">Tạo kịch bản tự động chỉ bằng kéo thả. Bấm, vuốt, gõ chữ, mở app, chờ, lặp lại — ai cũng dùng được, không cần biết code.</p>
                </div>
              </div>

              <div className="flex gap-5 items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-yellow-200 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-100 transition-colors">
                  <CalendarDays className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Đặt lịch tự động 24/7</h3>
                  <p className="text-slate-600 leading-relaxed">Đặt lịch tự chạy theo giờ, ngày, tuần. Hệ thống tự vận hành ngay cả khi bạn đang ngủ, và báo cáo kết quả qua Telegram.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function CredibilitySection() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#f97316] to-[#c2410c]">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-400/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-400/30 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-blob pointer-events-none" style={{ animationDelay: '2s' }} />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-6xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-sm mb-10 shadow-lg">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Công nghệ hàng đầu
          </div>

          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-medium text-white leading-[1.4] mb-14">
            "Phone Agent sử dụng các công nghệ <span className="font-bold text-yellow-300">bảo mật và hiệu suất cao</span><br className="hidden lg:block" /> đảm bảo thiết bị của bạn luôn <span className="font-bold text-orange-200">an toàn và ổn định</span>."
          </h2>

          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <Lock className="w-8 h-8 text-emerald-300" />
              <span className="font-bold text-white text-xl tracking-tight">Tailscale VPN</span>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <Zap className="w-8 h-8 text-yellow-300" />
              <span className="font-bold text-white text-xl tracking-tight">WebSocket Real-time</span>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-bold text-white text-xl tracking-tight">E2E Encryption</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section id="features" className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Biến tính năng thành <span className="text-orange-600">hiệu quả</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Phone Agent không chỉ là công cụ, mà là một hệ thống tối ưu hóa toàn bộ quy trình vận hành iPhone của bạn.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((b, idx) => (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`${b.colSpan} ${b.bg} border ${b.border} rounded-3xl p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    {b.icon}
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/60 text-slate-700 text-xs font-bold backdrop-blur-sm border border-white/80 shadow-sm">
                    {b.highlight}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{b.title}</h3>
                <p className="text-slate-700 leading-relaxed font-medium mt-auto">{b.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function UseCasesSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm mb-6 uppercase tracking-wider"
          >
            <Briefcase className="w-4 h-4" />
            Giải pháp chuyên biệt
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Ứng dụng thực tế trong{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Đa Ngành</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Dù bạn kinh doanh trong lĩnh vực nào, Phone Agent đều có kịch bản và giải pháp tối ưu dành riêng cho bạn.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left tabs */}
          <div className="w-full lg:w-[30%] flex lg:flex-col gap-1.5 overflow-x-auto pb-4 lg:pb-0 snap-x">
            {industries.map((ind, idx) => {
              const Icon = ind.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-left transition-all duration-300 snap-start whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20'
                      : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-100'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-700'}`} />
                  </div>
                  <span className="font-semibold text-sm">{ind.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right content */}
          <div className="w-full lg:w-[70%]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-50 rounded-[2rem] p-6 md:p-10 border border-slate-100 h-full"
              >
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    {(() => { const Icon = industries[activeTab].icon; return <Icon className="w-8 h-8 text-white" />; })()}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900">{industries[activeTab].name}</h3>
                </div>

                <div className="flex flex-col gap-6">
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Vấn đề</h4>
                    </div>
                    <p className="text-slate-600 text-base md:text-lg leading-relaxed">{industries[activeTab].problem}</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-6 md:p-8 shadow-sm border border-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Giải pháp Phone Agent</h4>
                    </div>
                    <p className="text-slate-800 text-base md:text-lg leading-relaxed font-medium">{industries[activeTab].solution}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-5 h-5 text-orange-500" />
                        <h4 className="font-bold text-slate-900">Không còn mất</h4>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{industries[activeTab].notLose}</p>
                    </div>
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <h4 className="font-bold text-slate-900">Bạn sẽ có</h4>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">{industries[activeTab].gain}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

function SocialProofSection() {
  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-bold text-sm mb-6 uppercase tracking-wider"
          >
            <MessageCircleHeart className="w-4 h-4" />
            Bằng chứng thực tế
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Hàng trăm người đã <span className="text-orange-600">tiết kiệm thời gian</span>
            <br className="hidden md:block" /> nhờ Phone Agent
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className={`bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 relative ${idx % 2 !== 0 ? 'lg:mt-12' : ''}`}
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-orange-100 transform rotate-180" />
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed mb-6 relative z-10">"{item.content}"</p>
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover border-2 border-orange-100" />
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-orange-100/50 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Bảng giá <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">đơn giản, minh bạch</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Chọn gói dịch vụ phù hợp với quy mô của bạn. Nâng cấp hoặc hủy bất kỳ lúc nào.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex flex-col bg-white rounded-3xl p-6 md:p-8 transition-all duration-300 ${
                plan.highlight
                  ? 'ring-2 ring-orange-500 shadow-2xl shadow-orange-900/10 scale-100 lg:scale-105 z-10'
                  : 'border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {plan.highlight && plan.badge && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-md whitespace-nowrap">
                  <Star className="w-4 h-4 fill-white" />
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 min-h-[40px]">{plan.desc}</p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4 text-center mb-8 border border-orange-100/50">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl lg:text-4xl font-black text-orange-600">{plan.price}</span>
                  <span className="text-xl font-bold text-orange-600 underline decoration-2 underline-offset-4">đ</span>
                </div>
                <div className="text-sm text-slate-500 font-medium mt-1">{plan.period}</div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-orange-500" />
                    </div>
                    <span className="text-slate-700">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/login"
                className={`block text-center w-full py-3.5 rounded-xl font-bold transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {plan.highlight ? 'Bắt đầu ngay' : plan.name === 'Business' ? 'Liên hệ' : 'Bắt đầu'}
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
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight"
          >
            Câu hỏi thường gặp
          </motion.h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-100/50 transition-colors"
              >
                <span className="text-base font-bold text-slate-900 pr-4">{faq.q}</span>
                <ChevronDown className={`shrink-0 w-5 h-5 text-slate-400 transition-transform duration-300 ${open.has(i) ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${open.has(i) ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                <p className="px-6 pb-5 text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterSection() {
  return (
    <footer className="bg-gray-900 text-white pt-24 pb-12">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <img src="/logo.png" alt="Phone Agent" className="h-10 object-contain brightness-0 invert" />
            </div>
            <p className="text-gray-400 mb-8 max-w-sm">
              Nền tảng quản lý & tự động hoá iPhone hàng đầu Việt Nam. Tạo kịch bản kéo thả, đặt lịch tự động 24/7, đổi IP thông minh.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Sản phẩm</h4>
            <ul className="space-y-4">
              <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-400 hover:text-white transition-colors">Tính năng</button></li>
              <li><button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-400 hover:text-white transition-colors">Bảng giá</button></li>
              <li><button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="text-gray-400 hover:text-white transition-colors">FAQ</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-6">Liên hệ</h4>
            <ul className="space-y-4">
              <li><span className="text-gray-400">support@phoneagent.io.vn</span></li>
              <li><Link to="/login" className="text-gray-400 hover:text-white transition-colors">Đăng nhập</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">&copy; {new Date().getFullYear()} Phone Agent. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Điều khoản</a>
            <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════ */

export default function LandingPageV2() {
  // Scroll to top on mount
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900">
      <Navbar />
      <HeroSection />
      <IntrigueBulletsSection />
      <PainPointsSection />
      <SolutionSection />
      <CredibilitySection />
      <BenefitsSection />
      <UseCasesSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <FooterSection />
    </div>
  );
}
