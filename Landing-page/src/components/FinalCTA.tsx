import { motion } from 'motion/react';
import { Send, AlertCircle, ArrowRight } from 'lucide-react';

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="rounded-[3rem] bg-gradient-to-br from-[#f97316] to-[#c2410c] overflow-hidden shadow-2xl shadow-orange-900/20 relative">
          
          {/* Abstract Background Elements */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-400/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-400/30 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 relative z-10">
            
            {/* Left Column: P.S. and Motivation */}
            <div className="p-10 md:p-16 lg:p-20 flex flex-col justify-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-8 leading-tight"
              >
                Sẵn sàng thống lĩnh <br />
                <span className="text-yellow-300">thị trường?</span>
              </motion.h2>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 relative"
              >
                <div className="absolute -top-5 -left-5 w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg rotate-12">
                  <span className="text-orange-900 font-black text-xl">P.S</span>
                </div>
                <p className="text-xl text-orange-50 leading-relaxed font-medium">
                  Đừng để chi phí quảng cáo tiếp tục <span className="text-yellow-300 font-bold">"đốt sạch"</span> lợi nhuận của bạn mỗi ngày. 
                </p>
                <div className="w-12 h-1 bg-white/20 my-6 rounded-full"></div>
                <p className="text-lg text-orange-100/90 leading-relaxed">
                  Hãy áp dụng chiến lược seeding hiệu quả ngay hôm nay trước khi thị trường trở nên bão hòa và đối thủ bỏ xa bạn.
                </p>
              </motion.div>
            </div>

            {/* Right Column: The Form */}
            <div className="p-6 md:p-10 lg:p-16 flex items-center justify-center">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl relative"
              >
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Đăng ký nhận tư vấn</h3>
                  <p className="text-gray-500">Điền thông tin để giữ chỗ ngay hôm nay!</p>
                </div>

                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Họ và tên</label>
                    <input 
                      type="text" 
                      id="name" 
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                      placeholder="Nhập họ và tên của bạn"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Số điện thoại</label>
                    <input 
                      type="tel" 
                      id="phone" 
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1.5">Ngành hàng kinh doanh</label>
                    <input 
                      type="text" 
                      id="industry" 
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all outline-none"
                      placeholder="VD: Thời trang, Mỹ phẩm, F&B..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 group mt-4"
                  >
                    NHẬN TƯ VẤN MIỄN PHÍ
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Thông tin của bạn được bảo mật tuyệt đối
                  </p>
                </form>
              </motion.div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
