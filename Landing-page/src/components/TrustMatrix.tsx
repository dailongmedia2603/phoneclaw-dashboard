import { motion } from 'motion/react';
import { ShieldCheck, Target, Zap } from 'lucide-react';

export default function TrustMatrix() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Khám phá chiến lược <br />
              <span className="text-orange-600">"Ma trận niềm tin"</span>
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Giúp bạn chiếm trọn lòng tin của khách hàng bằng những review chân thực nhất, khiến họ xuống tiền ngay khi nhìn thấy sản phẩm mà không cần do dự.
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Phá vỡ sự hoài nghi</h3>
                  <p className="text-gray-600">Xóa bỏ mọi rào cản tâm lý của khách hàng bằng những minh chứng thực tế và thuyết phục nhất.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Target className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Đánh trúng tâm lý</h3>
                  <p className="text-gray-600">Xây dựng kịch bản seeding tự nhiên, chạm đúng nỗi đau và mong muốn thầm kín của khách hàng.</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-100 to-orange-50 rounded-3xl transform rotate-3 scale-105 -z-10"></div>
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">Tỷ lệ chuyển đổi</p>
                    <p className="text-sm text-gray-500">Sau khi áp dụng Ma Trận</p>
                  </div>
                </div>
                <span className="text-2xl font-black text-orange-600">+300%</span>
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0">
                      <img src={`https://picsum.photos/seed/avatar${i}/100/100`} alt="Avatar" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded-full w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded-full w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
