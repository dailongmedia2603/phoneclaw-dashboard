import { motion } from 'motion/react';
import { CheckCircle2, ShieldCheck, Clock } from 'lucide-react';

export default function CTA() {
  return (
    <section className="py-24 bg-slate-50">
      <div className="w-full px-6 md:px-16 lg:px-24 xl:px-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-[#f97316] to-[#c2410c] rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl"
        >
          {/* Abstract background elements */}
          <div className="absolute top-0 left-0 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center px-6 py-2 rounded-full bg-yellow-400 text-orange-900 text-sm font-bold tracking-wider uppercase mb-8 shadow-lg">
              Ưu đãi đặc biệt giới hạn
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-8">
              NHẬN MIỄN PHÍ: Phiên "Bắt bệnh quy trình bán hàng" trong 45 phút
              <span className="block text-2xl md:text-3xl text-yellow-400 mt-4 font-bold">(Trị giá 5.000.000đ)</span>
            </h2>
            
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 mb-10 text-left">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">Bạn sẽ nhận được gì trong 45 phút này?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                  <p className="text-orange-50 text-lg">Phân tích chi tiết <strong className="text-white">3 lỗ hổng niềm tin</strong> khiến khách hàng rời đi.</p>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                  <p className="text-orange-50 text-lg"><strong className="text-white">Bản kế hoạch gieo mầm sơ bộ</strong> được thiết kế riêng cho ngành hàng của bạn.</p>
                </div>
              </div>
            </div>

            <div className="bg-orange-900/50 border border-orange-400/30 rounded-2xl p-6 mb-12 flex flex-col md:flex-row items-center gap-6 text-left">
              <ShieldCheck className="w-16 h-16 text-yellow-400 shrink-0" />
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Cam Kết Loại Bỏ Rủi Ro 100%</h4>
                <p className="text-orange-100">
                  Chúng tôi cam kết giúp bạn tìm ra ít nhất 3 cách để tăng cường mua hàng ngay trong cuộc gọi đầu tiên, hoặc chúng tôi sẽ tặng bạn thêm <strong>1 bộ danh sách kiểm tra (checklist) gieo hạt trị giá 1.000.000đ</strong> như một lời xin lỗi vì đã làm mất thời gian của bạn.
                </p>
              </div>
            </div>

            <button className="w-full md:w-auto bg-yellow-400 hover:bg-yellow-300 text-orange-900 px-10 py-5 rounded-full font-black text-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 mb-12">
              ĐIỀN THÔNG TIN TƯ VẤN CHIẾN LƯỢC NGAY
            </button>

            <div className="border-t border-white/20 pt-8 mt-4 text-left flex items-start gap-4">
              <Clock className="w-8 h-8 text-orange-300 shrink-0 mt-1" />
              <p className="text-orange-100 text-lg italic">
                <strong className="text-white not-italic">PS:</strong> Mỗi ngày trôi qua bạn không áp dụng hiệu quả gieo hạt giống là một ngày đối thủ đang cướp khách hàng của bạn ngay trên mạng xã hội. Đừng lãng phí thêm một đồng quảng cáo nào nữa. Đăng ký tư vấn ngay hôm nay.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
