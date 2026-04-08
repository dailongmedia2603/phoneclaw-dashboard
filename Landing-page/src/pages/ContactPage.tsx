import { motion } from 'motion/react';
import { ShieldCheck, CheckCircle2, ArrowRight, Target, TrendingUp, Search } from 'lucide-react';

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-20">
      {/* Hero Section - The Offer */}
      <section className="relative px-6 md:px-16 lg:px-24 xl:px-32 py-12 md:py-20 overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-orange-50 to-slate-50 z-0"></div>
        <div className="absolute top-20 right-10 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-40 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-6 border border-orange-200">
              Lời chào hàng Bố già (The Offer)
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight mb-6">
              ĐĂNG KÝ BUỔI TƯ VẤN LỘ TRÌNH SEEDING <span className="text-orange-600">"NHÌN LÀ MUA"</span> TRONG 45 PHÚT
            </h1>
            <div className="inline-block bg-yellow-400 text-slate-900 font-bold px-6 py-2 rounded-lg text-xl md:text-2xl mb-8 transform -rotate-1 shadow-md">
              (TRỊ GIÁ 2.000.000Đ – HOÀN TOÀN MIỄN PHÍ)
            </div>
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Chúng tôi không thể báo giá hay tư vấn giải pháp nếu chưa hiểu rõ "căn bệnh" doanh nghiệp bạn đang gặp phải. Hãy để chúng tôi "chẩn đoán" trước khi "kê đơn".
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 md:px-16 lg:px-24 xl:px-32 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column - Benefits & Guarantee */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-5 flex flex-col gap-8"
          >
            {/* Benefits Card */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
                <Target className="w-6 h-6 text-orange-600" />
                Bạn sẽ nhận được gì?
              </h3>
              <p className="text-slate-600 mb-6">Ngay cả khi bạn không thuê dịch vụ của chúng tôi, trong cuộc gọi này chúng tôi sẽ giúp bạn:</p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Search className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Tìm ra ít nhất <strong>3 lỗ hổng niềm tin</strong> trên fanpage/group của bạn.</span>
                </li>
                <li className="flex items-start gap-3">
                  <TrendingUp className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Phác thảo <strong>kịch bản gieo mầm sơ bộ</strong> cho ngành hàng bạn đang kinh doanh.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="text-slate-700">Xác định mức độ ưu tiên của ngân sách để <strong>tăng chuyển đổi ngay lập tức</strong> mà không lãng phí chi phí marketing.</span>
                </li>
              </ul>
            </div>

            {/* Guarantee Card */}
            <div className="bg-gradient-to-br from-orange-900 to-slate-900 rounded-3xl p-8 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full mix-blend-overlay filter blur-2xl opacity-20"></div>
              
              <ShieldCheck className="w-12 h-12 text-yellow-400 mb-4" />
              <h3 className="text-xl font-bold mb-3">Cam Kết Loại Bỏ Rủi Ro 100%</h3>
              <p className="text-orange-100 leading-relaxed">
                Đây hoàn toàn là một buổi tư vấn chiến lược, không phải một buổi chào hàng gây áp lực. Nếu sau cuộc gọi bạn cảm thấy chúng tôi làm lãng phí thời gian của bạn, chúng tôi sẽ tặng bạn <strong>Bộ tài liệu Checklist Gieo Hạt trị giá 500.000đ</strong> như một lời xin lỗi.
              </p>
            </div>
          </motion.div>

          {/* Right Column - Survey Form */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-3xl p-8 md:p-10 shadow-2xl shadow-orange-900/5 border border-slate-200">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 mb-2">Đơn Đăng Ký Tư Vấn</h2>
                <p className="text-slate-500">Vui lòng điền chi tiết để chúng tôi có thể chẩn đoán chính xác vấn đề của bạn.</p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-semibold text-slate-700">Họ và Tên *</label>
                    <input type="text" id="name" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-slate-50 focus:bg-white" placeholder="Nguyễn Văn A" required />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="phone" className="block text-sm font-semibold text-slate-700">Số điện thoại *</label>
                    <input type="tel" id="phone" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-slate-50 focus:bg-white" placeholder="090xxxxxxx" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="link" className="block text-sm font-semibold text-slate-700">Link Fanpage / Website của bạn</label>
                  <input type="url" id="link" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-slate-50 focus:bg-white" placeholder="https://facebook.com/..." />
                </div>

                <div className="space-y-2">
                  <label htmlFor="q1" className="block text-sm font-semibold text-slate-700">Vấn đề lớn nhất khiến việc mua hàng của bạn hiện tại bị chững lại là gì? *</label>
                  <textarea id="q1" rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none" placeholder="Ví dụ: Chạy quảng cáo ra tin nhắn nhưng khách toàn hỏi giá rồi im lặng..." required></textarea>
                </div>

                <div className="space-y-2">
                  <label htmlFor="q2" className="block text-sm font-semibold text-slate-700">Bạn đã từng thử gieo mầm hay các biện pháp tiếp thị nào khác chưa? Tại sao nó không có hiệu quả? *</label>
                  <textarea id="q2" rows={3} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none" placeholder="Chia sẻ những cách bạn đã làm..." required></textarea>
                </div>

                <div className="space-y-2">
                  <label htmlFor="q3" className="block text-sm font-semibold text-slate-700">Mục tiêu doanh thu / tỉ lệ chuyển đổi bạn muốn đạt được trong 12 tháng tới là bao nhiêu? *</label>
                  <input type="text" id="q3" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-slate-50 focus:bg-white" placeholder="Ví dụ: Tăng x2 doanh thu, hoặc tỷ lệ chốt đơn lên 30%" required />
                </div>

                <div className="space-y-2">
                  <label htmlFor="q4" className="block text-sm font-semibold text-slate-700">Tại sao bạn lại chọn thời điểm này để thay đổi chiến lược? *</label>
                  <textarea id="q4" rows={2} className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all bg-slate-50 focus:bg-white resize-none" placeholder="Động lực lớn nhất của bạn lúc này là gì?" required></textarea>
                </div>

                <button type="button" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg py-4 px-8 rounded-xl transition-all flex items-center justify-center gap-2 group mt-8 shadow-lg shadow-orange-600/30 hover:shadow-orange-600/50 hover:-translate-y-1">
                  GỬI ĐƠN ĐĂNG KÝ TƯ VẤN NGAY
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <p className="text-center text-xs text-slate-500 mt-4">
                  Thông tin của bạn được bảo mật tuyệt đối. Chúng tôi sẽ liên hệ trong vòng 24h làm việc.
                </p>
              </form>
            </div>
          </motion.div>

        </div>
      </div>
    </main>
  );
}
