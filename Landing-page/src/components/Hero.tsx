import { motion } from 'motion/react';
import { FileText, Users, MessageSquare, Bot, Zap } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-[#f97316] to-[#c2410c]">
      {/* Background abstract shapes */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-20 right-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>

      <div className="w-full px-4 md:px-8 lg:px-12 relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-5 py-2 text-sm md:text-base font-semibold text-white mb-8 shadow-sm"
        >
          <span className="flex text-yellow-400">
            <Zap className="w-5 h-5 fill-current" />
          </span>
          GỬI CÁC CHỦ DOANH NGHIỆP ĐANG BÁN HÀNG VÀ CHĂM SÓC KHÁCH HÀNG QUA ZALO CÁ NHÂN
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight mb-8 max-w-6xl mx-auto"
        >
          Bí mật đằng sau hệ thống AI <span className="text-yellow-400">"không bao giờ biết bịa đặt"</span> giúp bạn chốt đơn 24/7 và đảm bảo <span className="bg-white text-orange-600 px-4 py-1 rounded-md inline-block mt-2 md:mt-0 shadow-sm">KHÔNG BAO GIỜ</span> bỏ sót bất kỳ khách hàng nào trên Zalo<br className="hidden lg:block" />
          <span className="text-3xl md:text-4xl lg:text-5xl font-medium opacity-90 block mt-4">— Ngay cả khi nhân viên của bạn đang ngủ!</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-orange-50 mb-12 max-w-5xl mx-auto leading-relaxed font-medium"
        >
          <strong className="text-yellow-300">ZACA:</strong> Giải pháp AI toàn diện tích hợp NotebookLM giúp tự động hóa 100% quy trình tư vấn chính xác và nhắc lịch chăm sóc khách hàng theo kịch bản chuẩn, biến Zalo cá nhân thành cỗ máy in tiền tự động.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button className="w-full sm:w-auto bg-yellow-400 text-orange-900 hover:bg-yellow-300 px-8 py-4 rounded-full text-lg font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 flex items-center justify-center gap-2">
            <Bot className="w-6 h-6" />
            Trải nghiệm AI ngay
          </button>
          <button className="w-full sm:w-auto bg-white/10 backdrop-blur-sm border border-white/30 text-white hover:bg-white/20 px-8 py-4 rounded-full text-lg font-medium transition-all flex items-center justify-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Tư vấn giải pháp
          </button>
        </motion.div>
      </div>
    </section>
  );
}
