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
    icon: <Globe className="w-6 h-6 text-blue-500" />,
    title: 'Xây hàng trăm kênh DỄ DÀNG',
    description: 'Mỗi iPhone là một kênh TikTok hoặc Facebook. Nuôi nick, đăng video, lướt FYP đồng loạt — xây dàn kênh affiliate nhanh gấp 10 lần làm tay.',
    bgColor: 'bg-blue-50',
  },
  {
    icon: <Wand2 className="w-6 h-6 text-rose-500" />,
    title: 'Tự tạo kịch bản theo ý muốn',
    description: 'Kéo thả để tạo kịch bản riêng cho mình: mở app, lướt, like, follow, đăng video, chờ, lặp lại — muốn gì làm nấy, không cần biết code.',
    bgColor: 'bg-rose-50',
  },
  {
    icon: <Cpu className="w-6 h-6 text-orange-500" />,
    title: '100 máy, 1 màn hình',
    description: 'Quản lý toàn bộ dàn iPhone từ một màn hình duy nhất. Xem trạng thái, chạy kịch bản, điều khiển từ xa — ngay trên trình duyệt. Không cần ngồi cạnh dàn máy.',
    bgColor: 'bg-orange-50',
  },
  {
    icon: <CalendarDays className="w-6 h-6 text-orange-500" />,
    title: 'Đặt lịch rồi đi ngủ',
    description: 'Hẹn giờ chạy kịch bản theo giờ, ngày, tuần. Máy tự lướt FYP lúc 2h sáng, tự đăng video lúc 6h, tự tương tác lúc 9h. Bạn thức dậy — mọi thứ đã xong.',
    bgColor: 'bg-orange-50',
  },
];

const pains = [
  {
    icon: <MonitorSmartphone className="w-6 h-6 text-rose-600" />,
    text: 'Nuôi 10 nick đã muốn phát điên — mỗi ngày phải lướt FYP từng máy, đăng video từng máy, tương tác từng máy. Thuê thêm người thì chi phí ăn hết lợi nhuận affiliate.',
  },
  {
    icon: <AlertCircle className="w-6 h-6 text-rose-600" />,
    text: 'Nick die hàng loạt vì cùng IP, cùng hành vi — bao nhiêu công nuôi nick mấy tháng trời bay sạch trong 1 đêm. Dùng tool trên PC thì bị phát hiện ngay vì fingerprint ảo.',
  },
  {
    icon: <Clock className="w-6 h-6 text-rose-600" />,
    text: 'Muốn scale lên 50-100 máy nhưng không biết bắt đầu từ đâu. Mỗi máy một kịch bản, mỗi máy một lịch khác nhau — càng nhiều máy càng rối, không có hệ thống.',
  },
];

const benefits = [
  {
    id: 'scale',
    title: 'Gấp 10 tài khoản, giữ nguyên 1 người',
    desc: 'Trước cần 5 người ngồi bấm 50 máy. Giờ 1 mình bạn quản lý 100 máy từ laptop. Cắt chi phí nhân sự, giữ nguyên output — thậm chí tốt hơn vì máy không nghỉ.',
    icon: <Users className="w-8 h-8 text-blue-600" />,
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    colSpan: 'md:col-span-2',
    highlight: 'Tiết kiệm 80% chi phí nhân sự',
  },
  {
    id: 'safe',
    title: 'Nick sống lâu, không lo die hàng loạt',
    desc: 'Chạy trên iPhone thật, mỗi máy một IP, một vị trí, hành vi ngẫu nhiên hoá. Nền tảng không thể phân biệt với người dùng bình thường.',
    icon: <Shield className="w-8 h-8 text-orange-500" />,
    bg: 'bg-orange-50',
    border: 'border-orange-100',
    colSpan: 'md:col-span-1',
    highlight: 'Giảm 90% tỷ lệ die nick',
  },
  {
    id: 'auto-247',
    title: 'Máy chạy 24/7, kể cả khi bạn ngủ',
    desc: 'Đặt lịch một lần, máy tự chạy theo giờ bạn muốn. Lướt FYP lúc nửa đêm, đăng video lúc sáng sớm, tương tác suốt ngày. Bạn chỉ cần kiểm tra kết quả.',
    icon: <CalendarDays className="w-8 h-8 text-emerald-600" />,
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    colSpan: 'md:col-span-1',
    highlight: 'Hoạt động 24/7 không nghỉ',
  },
  {
    id: 'scale-no-limit',
    title: 'Scale từ 10 lên 100 máy không vỡ quy trình',
    desc: 'Tạo kịch bản 1 lần, phát cho bao nhiêu máy cũng được. Thêm máy mới — kết nối, gán kịch bản, chạy. Hệ thống thiết kế để scale, không phải để dùng lẻ tẻ.',
    icon: <Zap className="w-8 h-8 text-purple-600" />,
    bg: 'bg-purple-50',
    border: 'border-purple-100',
    colSpan: 'md:col-span-1',
    highlight: 'Scale không giới hạn',
  },
  {
    id: 'monitor',
    title: 'Biết ngay chuyện gì đang xảy ra',
    desc: 'Thông báo Telegram khi kịch bản chạy xong, khi máy gặp lỗi. Xem màn hình từ xa bất cứ lúc nào. Không bao giờ bị "mù" về trạng thái dàn máy.',
    icon: <Monitor className="w-8 h-8 text-rose-600" />,
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    colSpan: 'md:col-span-1',
    highlight: 'Giám sát real-time',
  },
];

const industries = [
  {
    name: 'Affiliate TikTok VN',
    icon: Video,
    problem: 'Nuôi 30-50 nick TikTok VN bằng tay, mỗi ngày mất 6-8 tiếng lướt FYP, đăng video, like, comment. Thuê 2-3 người phụ mà vẫn không đủ, chi phí ăn hết commission.',
    solution: 'Tạo kịch bản "nuôi nick TikTok": tự mở app → lướt FYP 10 phút → like ngẫu nhiên → xem video đến hết → follow → nghỉ → lặp lại. Đặt lịch chạy 3 lần/ngày, mỗi lần cách nhau 4 tiếng.',
    notLose: '6 tiếng/ngày ngồi bấm tay. Chi phí 2-3 nhân sự thao tác thủ công.',
    gain: '50 nick hoạt động tự nhiên 24/7. Thời gian nghiên cứu sản phẩm hot, tối ưu nội dung affiliate.',
  },
  {
    name: 'Affiliate TikTok US',
    icon: Globe,
    problem: 'Muốn làm affiliate TikTok Shop US nhưng cần nick US, IP US, vị trí US. Mua nick ngoài thì không kiểm soát, tự nuôi thì không biết set IP sao cho đúng.',
    solution: 'Giả lập vị trí GPS sang Mỹ + đổi IP US cho từng máy. Kịch bản nuôi nick theo hành vi người Mỹ: lướt content tiếng Anh, follow creator US, tương tác trending US. Nick trust cao, đăng video affiliate lên FYP US.',
    notLose: 'Tiền mua nick US chất lượng kém, nick die liên tục vì hành vi bất thường.',
    gain: 'Dàn nick US tự nuôi, ổn định, sẵn sàng đăng video affiliate hàng xoá trên TikTok Shop.',
  },
  {
    name: 'Affiliate Shopee/Facebook',
    icon: ShoppingCart,
    problem: 'Chạy affiliate Shopee cần nhiều acc Facebook để đăng link, tham gia nhóm, tương tác. Mỗi acc phải hoạt động tự nhiên nếu không muốn bị checkpoint và khoá.',
    solution: 'Nuôi hàng loạt acc Facebook trên iPhone thật. Mỗi acc một IP riêng. Kịch bản: mở Facebook → lướt feed → like vài post → vào nhóm → đăng bài kèm link affiliate → nghỉ. Đặt lịch đăng theo khung giờ vàng.',
    notLose: 'Hàng chục acc Facebook bị checkpoint/khoá mỗi tuần. Thời gian đăng link thủ công.',
    gain: 'Dàn acc Facebook sống lâu, đăng link affiliate Shopee đều đặn, chốt đơn tự động.',
  },
  {
    name: 'TikTok US → Shopify',
    icon: Briefcase,
    problem: 'Muốn xây kênh TikTok nội dung tiếng Anh để kéo traffic về Shopify, nhưng cần nhiều kênh test sản phẩm. Mỗi kênh nuôi riêng, quá mất thời gian.',
    solution: 'Mỗi iPhone là 1 kênh, IP US, vị trí US. Kịch bản: đăng video sản phẩm → pin link Shopify vào bio → lướt FYP để tăng trust → tương tác video cùng niche. Quản lý 20-30 kênh test song song.',
    notLose: 'Hàng tháng test 2-3 kênh bằng tay mà không biết sản phẩm nào ăn.',
    gain: '20-30 kênh test song song, tìm winning product nhanh gấp 10 lần, scale kênh thắng ngay lập tức.',
  },
  {
    name: 'Team & Agency',
    icon: Megaphone,
    problem: 'Agency quản lý dàn máy cho nhiều khách hàng. Mỗi khách một kịch bản, một lịch khác nhau. Nhân viên nghỉ là rối loạn — phụ thuộc vào con người quá lớn.',
    solution: 'Dashboard tập trung: phân nhóm máy theo khách hàng, gán kịch bản riêng, lịch trình riêng. Telegram thông báo khi có lỗi. Mở rộng team mà không cần tuyển thêm người thao tác.',
    notLose: 'Sự phụ thuộc vào nhân sự. Rủi ro sai sót khi quản lý nhiều khách hàng cùng lúc.',
    gain: 'Quy trình chuẩn, nhận thêm khách mà không tăng chi phí vận hành.',
  },
  {
    name: 'Livestream & Seeding',
    icon: Users,
    problem: 'Livestream bán hàng cần người xem, cần comment, cần tương tác để đẩy thuật toán. Mỗi phiên live phải huy động cả team vào seeding — tốn kém và khó kiểm soát.',
    solution: 'Dàn máy tự vào phòng live, tự comment theo kịch bản ngẫu nhiên, tự thả tim, tự chia sẻ. Đặt lịch vào phòng live đúng giờ bắt đầu, thoát khi kết thúc.',
    notLose: 'Chi phí thuê người seeding mỗi phiên live. Tình trạng phòng live "trống trơn" lúc đầu.',
    gain: 'Phòng live luôn sôi động từ phút đầu, thuật toán đẩy lên FYP, viewer thật tăng, chốt đơn nhiều hơn.',
  },
];

const testimonials = [
  {
    name: 'Minh Quân',
    role: 'Affiliate TikTok, 25 điện thoại',
    content: 'Trước tôi thuê 2 đứa em ngồi bấm từng máy, tốn 15 triệu/tháng tiền lương mà vẫn không xuể. Giờ 1 mình quản hết 25 máy, mỗi ngày chỉ mất 30 phút kiểm tra. Tháng đầu tiên đã thu hồi vốn.',
    avatar: 'https://i.pravatar.cc/150?img=11',
  },
  {
    name: 'Hải Long',
    role: 'Team trưởng, dàn 60 máy TikTok US',
    content: 'Làm thị trường US nên cần IP Mỹ, vị trí Mỹ. Phone Agent là tool duy nhất giải quyết được cả 2 cái đó trên iPhone thật. Nick sống lâu hẳn, tỷ lệ die giảm từ 30% xuống dưới 5%.',
    avatar: 'https://i.pravatar.cc/150?img=14',
  },
  {
    name: 'Thu Hằng',
    role: 'CEO agency, quản lý 120 thiết bị',
    content: 'Chúng tôi quản lý dàn máy cho 8 khách hàng khác nhau. Trước dùng 4 nhân viên, giờ chỉ cần 1 người giám sát. Cắt 70% chi phí vận hành mà output còn tốt hơn vì máy chạy 24/7 không nghỉ.',
    avatar: 'https://i.pravatar.cc/150?img=5',
  },
  {
    name: 'Đức Anh',
    role: 'Dropship Shopify US, 40 điện thoại',
    content: 'Tôi xây 40 kênh TikTok test sản phẩm song song. Trước mỗi tháng test 3-4 sản phẩm, giờ test 15-20 cùng lúc. Tìm winning product nhanh hơn hẳn, doanh thu tháng rồi x3.',
    avatar: 'https://i.pravatar.cc/150?img=9',
  },
];

const plans = [
  {
    name: 'Starter',
    desc: 'Dùng thử, cảm nhận sức mạnh tự động hoá.',
    price: '49.000',
    period: '/ tháng',
    features: ['1 thiết bị', '5 kịch bản tuỳ chỉnh', '2 lịch trình tự động', 'Điều khiển từ xa', 'Kho kịch bản mẫu TikTok & Facebook', 'Thông báo Telegram'],
    highlight: false,
  },
  {
    name: 'Basic',
    desc: 'Bắt đầu scale, nuôi nick nghiêm túc.',
    price: '99.000',
    period: '/ tháng',
    features: ['3 thiết bị', '15 kịch bản tuỳ chỉnh', '5 lịch trình tự động', 'Đổi IP cho từng thiết bị', 'Kho kịch bản mẫu TikTok & Facebook', 'Thông báo Telegram'],
    highlight: false,
  },
  {
    name: 'Pro',
    badge: 'Phổ biến nhất',
    desc: 'Lựa chọn số 1 của dân affiliate chuyên nghiệp.',
    price: '249.000',
    period: '/ tháng',
    features: ['10 thiết bị', 'Không giới hạn kịch bản', '20 lịch trình tự động', 'Đổi IP + giả lập vị trí (VN/US)', 'Kịch bản rẽ nhánh nâng cao', 'Hỗ trợ ưu tiên 1-1'],
    highlight: true,
  },
  {
    name: 'Business',
    desc: 'Dành cho team và agency muốn kiểm soát toàn bộ.',
    price: '499.000',
    period: '/ tháng',
    features: ['30 thiết bị', 'Không giới hạn kịch bản & lịch trình', 'Đổi IP + giả lập vị trí (VN/US)', 'API tokens tích hợp hệ thống', 'Hỗ trợ 1-1 + setup ban đầu', 'Tư vấn quy trình cho team'],
    highlight: false,
  },
];

const faqs = [
  { q: 'Phone Agent có phải giả lập không? Có bị nền tảng phát hiện không?', a: 'Không. Phone Agent chạy trực tiếp trên iPhone thật, không phải giả lập. Mỗi máy có IP riêng, vị trí riêng, fingerprint thiết bị thật. Hành vi được ngẫu nhiên hoá nên nền tảng rất khó phân biệt với người dùng bình thường. Đây là lý do tỷ lệ die nick thấp hơn hẳn so với bot trên máy tính.' },
  { q: 'Tôi không biết code, có dùng được không?', a: 'Hoàn toàn được. Toàn bộ kịch bản tạo bằng cách kéo thả — giống xếp lego. Ngoài ra có sẵn kho kịch bản mẫu cho TikTok và Facebook, chỉ cần chọn và chỉnh nhẹ là dùng được ngay. Đa số anh em tạo kịch bản đầu tiên trong vòng 15 phút.' },
  { q: 'Cần loại iPhone nào? iPhone cũ có chạy được không?', a: 'iPhone đời cũ (6s trở lên) vẫn chạy tốt cho các tác vụ nuôi nick, lướt FYP, đăng bài. Bạn không cần mua iPhone đời mới — dàn iPhone cũ giá 1-2 triệu/máy là đủ dùng.' },
  { q: 'Tôi muốn làm thị trường US, có hỗ trợ IP và vị trí Mỹ không?', a: 'Có. Từ gói Pro trở lên, bạn có thể đổi IP sang US và giả lập vị trí GPS ở bất kỳ tiểu bang nào của Mỹ cho từng thiết bị riêng biệt. Nick TikTok US, Facebook US nuôi trên Phone Agent sẽ có vị trí và IP hoàn toàn giống người dùng tại Mỹ.' },
  { q: 'Nếu dàn máy nhiều hơn 30 thiết bị thì sao?', a: 'Gói Business hỗ trợ 30 thiết bị. Nếu cần nhiều hơn, liên hệ đội ngũ để nhận báo giá Enterprise tuỳ chỉnh — hỗ trợ lên đến hàng trăm thiết bị với giá ưu đãi theo số lượng và setup chuyên biệt cho team.' },
  { q: 'Tôi có thể huỷ bất cứ lúc nào không?', a: 'Có, huỷ bất cứ lúc nào không cần lý do. Kịch bản và dữ liệu vẫn được lưu 30 ngày sau khi huỷ để bạn có thể quay lại. Không khoá dữ liệu, không phí huỷ, không cam kết dài hạn.' },
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
          HƠN 500+ ANH EM AFFILIATE ĐANG DÙNG MỖI NGÀY
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-8 max-w-6xl mx-auto"
        >
          Biến 1 người thành
          <br />
          <span className="bg-white text-orange-600 px-4 py-1 rounded-md inline-block mt-3 shadow-sm">đội quân 100 điện thoại</span>
          <span className="text-3xl md:text-4xl lg:text-5xl font-medium opacity-90 block mt-4">
            — chạy affiliate 24/7 không cần chạm tay
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-orange-50 mb-12 max-w-4xl mx-auto leading-relaxed font-medium"
        >
          <strong className="text-yellow-300">Phone Agent</strong> giúp bạn nuôi nick, đăng video, lướt FYP, tương tác tự động trên hàng trăm iPhone thật cùng lúc. Ngồi 1 chỗ, quản lý tất cả từ trình duyệt. Không cần code. Không cần thuê thêm người.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Link to="/login" className="w-full sm:w-auto bg-yellow-400 text-orange-900 hover:bg-yellow-300 px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
            <Bot className="w-6 h-6" />
            Dùng thử miễn phí ngay
          </Link>
          <button
            onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-full text-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            Xem demo 2 phút
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
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
            Tại sao dân affiliate dùng <span className="text-orange-600">Phone Agent</span>?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 leading-tight mb-8">
              Làm affiliate mà cứ phải <span className="text-rose-600">ngồi bấm tay</span> từng máy... bao giờ mới scale?
            </h2>

            <div className="space-y-5">
              {pains.map((pain, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.15 + 0.3 }}
                  className="flex gap-4 items-start group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-50 transition-colors shadow-md shadow-rose-900/5">
                    {pain.icon}
                  </div>
                  <p className="text-sm md:text-base text-slate-700 leading-relaxed pt-0.5 font-medium">{pain.text}</p>
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
                "<span className="text-rose-600 font-bold">73%</span> anh em affiliate nói rằng họ mất hơn <span className="text-rose-600 font-bold">5 tiếng mỗi ngày</span> chỉ để thao tác thủ công — thời gian đáng ra dùng để nghiên cứu sản phẩm và scale doanh thu."
              </p>
              <div className="mt-auto">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '73%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full"
                  />
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <span>Thời gian hiệu quả</span>
                  <span className="text-rose-600">Thao tác thủ công (73%)</span>
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
              Giải pháp cho dân affiliate chuyên nghiệp
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6">
              Giới thiệu{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">
                Phone Agent
              </span>
            </h2>

            <p className="text-2xl text-slate-800 font-bold mb-6 leading-snug">
              Tự động hoá mọi thao tác trên iPhone thật. Quản lý tập trung. Scale không giới hạn.
            </p>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Phone Agent không phải giả lập, không phải bot trên PC. Đây là nền tảng chạy trực tiếp trên <strong className="text-orange-600 text-xl mx-1">iPhone thật</strong> — mỗi máy một IP riêng, hành vi như người dùng thật. Tạo kịch bản kéo thả, đặt lịch 24/7, nhận thông báo Telegram khi xong.
            </p>

            <div className="space-y-6">
              <div className="flex gap-5 items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                  <Wand2 className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Kịch bản kéo thả — ai cũng tạo được</h3>
                  <p className="text-slate-600 leading-relaxed">Giao diện trực quan, kéo thả các bước: mở TikTok → lướt FYP → like → follow → lặp lại. Có sẵn kho kịch bản mẫu cho TikTok, Facebook — chỉ cần chỉnh nhẹ là dùng.</p>
                </div>
              </div>

              <div className="flex gap-5 items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-yellow-200 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-100 transition-colors">
                  <CalendarDays className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Mỗi máy một "nhân dạng" riêng</h3>
                  <p className="text-slate-600 leading-relaxed">Đổi IP và giả lập vị trí GPS cho từng iPhone. Máy 1 ở Hà Nội, máy 2 ở Sài Gòn, máy 3 ở Texas — nền tảng thấy mỗi máy là một người dùng hoàn toàn khác nhau.</p>
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
            "Phone Agent chạy trên <span className="font-bold text-yellow-300">iPhone thật, IP thật, vị trí thật</span> — không phải giả lập.<br className="hidden lg:block" /> Đây là lý do nick <span className="font-bold text-orange-200">sống lâu hơn bất kỳ tool nào</span> trên thị trường."
          </h2>

          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <Smartphone className="w-8 h-8 text-emerald-300" />
              <span className="font-bold text-white text-xl tracking-tight">Chạy trên iPhone thật</span>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <Lock className="w-8 h-8 text-yellow-300" />
              <span className="font-bold text-white text-xl tracking-tight">Mã hoá đầu cuối</span>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-bold text-white text-xl tracking-tight">API mở & Webhook</span>
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
            Không phải tính năng. Đây là thứ bạn <span className="text-orange-600">THẬT SỰ được</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Mỗi tính năng của Phone Agent đều quy về một thứ: giúp bạn kiếm nhiều hơn, làm ít hơn.
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
            Anh em đang dùng Phone Agent để{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">làm gì?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            6 cách kiếm tiền phổ biến nhất với Phone Agent — chọn cái phù hợp với bạn.
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
            Anh em trong nghề <span className="text-orange-600">nói gì?</span>
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
            Đầu tư ít hơn <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">một bữa cà phê mỗi ngày</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Tính nhanh: 1 nhân sự thao tác tốn ít nhất 7-8 triệu/tháng. Phone Agent quản lý 30 máy chỉ 499K. Bạn tiết kiệm hơn 90%.
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

function FooterCTA() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-br from-[#f97316] via-[#ea580c] to-[#c2410c] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-yellow-400/20 rounded-full mix-blend-screen filter blur-[100px] opacity-50 pointer-events-none" />
      <div className="max-w-3xl mx-auto px-4 md:px-8 lg:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-6">
            Mỗi ngày bạn chưa dùng Phone Agent là một ngày đối thủ chạy trước bạn 100 máy
          </h2>
          <p className="text-orange-100/90 text-lg mb-10">
            Đăng ký ngay hôm nay. 5 phút setup. Chạy kịch bản đầu tiên trong 15 phút. Không cần thẻ tín dụng.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-white text-orange-700 hover:bg-orange-50 px-10 py-4 rounded-full text-lg font-bold transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
          >
            <Bot className="w-6 h-6" />
            Bắt đầu miễn phí — Không cần thẻ
          </Link>
        </motion.div>
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
              Nền tảng tự động hoá iPhone cho dân affiliate. Nuôi nick, đăng video, lướt FYP, tương tác — tất cả chạy tự động trên iPhone thật.
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
      <FooterCTA />
      <FooterSection />
    </div>
  );
}
