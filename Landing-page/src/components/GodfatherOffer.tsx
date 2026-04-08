import { motion } from 'motion/react';
import { Gift, Clock, CalendarCheck, Sparkles } from 'lucide-react';

export default function GodfatherOffer() {
  return (
    <section className="py-24 bg-gray-50 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-[0.03]"></div>
      
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-gray-100 relative"
        >
          {/* Left side: The Offer Details */}
          <div className="p-8 md:p-12 lg:p-16 flex-1 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-bold text-sm mb-8 uppercase tracking-wider">
                <Gift className="w-4 h-4" />
                Lời chào hàng không thể từ chối
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Buổi tư vấn chiến lược Seeding <span className="text-orange-600 relative whitespace-nowrap">
                  "Độc quyền"
                  <Sparkles className="absolute -top-6 -right-6 w-8 h-8 text-yellow-400 animate-pulse" />
                </span>
              </h2>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-lg font-medium">
                  <Clock className="w-5 h-5 text-orange-600" />
                  45 Phút
                </div>
                <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-lg font-medium">
                  <CalendarCheck className="w-5 h-5 text-emerald-600" />
                  1-on-1 Trực tiếp
                </div>
              </div>
              
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                Chúng tôi sẽ trực tiếp soi xét quy trình bán hàng của bạn và vẽ ra một lộ trình seeding cụ thể để <strong className="text-gray-900">"khách hỏi là mua"</strong>. Không lý thuyết suông, chỉ có chiến lược thực chiến áp dụng ngay.
              </p>
              
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                  Phân tích lỗ hổng niềm tin trong phễu bán hàng hiện tại.
                </li>
                <li className="flex items-center gap-3 text-gray-700">
                  <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                  Đề xuất kịch bản seeding phù hợp nhất với ngành hàng của bạn.
                </li>
              </ul>
            </div>
          </div>

          {/* Right side: The Ticket Stub */}
          <div className="bg-gradient-to-br from-[#f97316] to-[#c2410c] p-8 md:p-12 flex flex-col justify-center items-center text-white relative md:w-[380px] border-t-2 md:border-t-0 md:border-l-2 border-dashed border-white/40">
            {/* Cutouts for ticket effect */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-gray-50 rounded-full hidden md:block shadow-inner"></div>
            <div className="absolute -bottom-6 -left-6 w-12 h-12 bg-gray-50 rounded-full hidden md:block shadow-inner"></div>
            
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none"></div>
            
            <div className="text-center relative z-10 w-full">
              <p className="text-orange-200 font-medium mb-3 uppercase tracking-[0.2em] text-sm">Giá trị thực tế</p>
              <div className="relative inline-block mb-4">
                <span className="text-6xl font-black text-white/40">$200</span>
                <div className="absolute top-1/2 left-[-10%] right-[-10%] h-1.5 bg-rose-500 transform -rotate-12"></div>
              </div>
              
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-4 px-6 mb-8 transform -rotate-2">
                <p className="text-4xl font-black text-yellow-300 drop-shadow-lg">MIỄN PHÍ</p>
                <p className="text-sm text-orange-100 mt-1">Dành cho 10 người đăng ký sớm nhất</p>
              </div>
              
              <button className="w-full bg-white text-orange-700 font-black text-lg py-5 px-8 rounded-2xl hover:bg-yellow-300 hover:text-orange-900 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(253,224,71,0.5)] transform hover:-translate-y-1">
                NHẬN NGAY
              </button>
              <p className="text-xs text-orange-200 mt-4 opacity-80">Không yêu cầu thẻ tín dụng</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
