import { motion } from 'motion/react';
import { Download, FileText, CheckCircle2 } from 'lucide-react';

export default function HVCO() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="bg-orange-50 rounded-[3rem] p-8 md:p-12 lg:p-16 relative">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '4s' }}></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-pulse" style={{ animationDuration: '5s' }}></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-semibold text-sm mb-6">
                <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>
                TẢI MIỄN PHÍ BÁO CÁO ĐẶC BIỆT
              </div>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Hồ sơ thực chiến Seeding 2026
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Bí quyết tăng tỉ lệ mua hàng cho từng ngành hàng. Chúng tôi tiết lộ chính xác cách các doanh nghiệp top đầu ngành của bạn đang <span className="font-semibold text-orange-600">"thâu tóm"</span> tâm lý khách hàng như thế nào.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  "Chiến lược seeding tự nhiên không phản cảm",
                  "Kịch bản chốt sale từ comment dạo",
                  "Case study thực tế từ 50+ ngành hàng"
                ].map((item, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              
              <form className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Nhập email của bạn..." 
                  className="px-6 py-4 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent flex-1"
                  required
                />
                <button 
                  type="submit"
                  className="px-8 py-4 bg-orange-600 text-white font-bold rounded-2xl hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shadow-lg shadow-orange-600/30"
                >
                  <Download className="w-5 h-5" />
                  Tải Báo Cáo Ngay
                </button>
              </form>
              <p className="text-xs text-gray-400 mt-4">
                * Chúng tôi cam kết bảo mật thông tin của bạn. Không spam.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative lg:ml-auto"
            >
              {/* Mockup of a report/book */}
              <div className="relative w-full max-w-md mx-auto aspect-[3/4] bg-white rounded-r-3xl rounded-l-md shadow-2xl border-l-8 border-orange-600 transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500 flex flex-col">
                <div className="p-8 flex-1 flex flex-col">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                    <FileText className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight mb-4 uppercase">
                    Hồ Sơ Thực Chiến<br/>
                    <span className="text-orange-600">Seeding 2026</span>
                  </h3>
                  <div className="w-16 h-1 bg-orange-600 mb-6"></div>
                  <p className="text-gray-500 text-sm mb-auto">
                    Bí quyết tăng tỉ lệ mua hàng & thâu tóm tâm lý khách hàng cho từng ngành hàng.
                  </p>
                  <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Scrollix Agency</span>
                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">PDF REPORT</span>
                  </div>
                </div>
                
                {/* Book spine effect */}
                <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent"></div>
                {/* Book pages effect */}
                <div className="absolute top-2 bottom-2 right-[-4px] w-1 bg-gray-200 rounded-r shadow-sm"></div>
                <div className="absolute top-4 bottom-4 right-[-8px] w-1 bg-gray-100 rounded-r shadow-sm"></div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Download className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">10,000+</p>
                    <p className="text-xs text-gray-500">Lượt tải xuống</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
