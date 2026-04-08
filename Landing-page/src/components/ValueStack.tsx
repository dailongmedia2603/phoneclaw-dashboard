import { motion } from 'motion/react';
import { Check, ShieldCheck, Flame, Plus } from 'lucide-react';

export default function ValueStack() {
  const stackItems = [
    { name: 'Báo cáo thực chiến từng ngành hàng', value: 50 },
    { name: '45 phút tư vấn chiến lược trực tiếp', value: 200 },
    { name: 'Mẫu kịch bản seeding "như thật" độc quyền', value: 100 },
  ];

  const totalValue = stackItems.reduce((acc, item) => acc + item.value, 0);

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-100/50 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Tổng hợp những gì bạn sẽ <span className="text-orange-600">nhận được</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          
          {/* Left Column: The Value Stack (Receipt Style) */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7"
          >
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden h-full flex flex-col">
              <div className="bg-slate-900 p-6 text-center">
                <h3 className="text-xl font-bold text-white tracking-widest uppercase">Gói Giải Pháp Toàn Diện</h3>
              </div>
              
              <div className="p-8 md:p-10 flex-1 flex flex-col">
                <ul className="space-y-6 mb-8 flex-1">
                  {stackItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-1">
                        <Check className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-dashed border-gray-200 pb-6">
                        <span className="text-lg text-gray-800 font-medium">{item.name}</span>
                        <span className="text-xl font-bold text-gray-400 line-through decoration-rose-400 decoration-2">${item.value}</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="bg-gray-50 rounded-2xl p-6 md:p-8 border border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
                    <span className="text-gray-500 font-medium uppercase tracking-wider">Tổng giá trị</span>
                    <span className="text-3xl font-bold text-gray-400 line-through decoration-rose-500 decoration-4">${totalValue}</span>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
                    <span className="text-gray-900 font-bold text-xl uppercase tracking-wider">Giá của bạn hôm nay</span>
                    <span className="text-5xl md:text-6xl font-black text-emerald-500 drop-shadow-sm">0 VNĐ</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Scarcity & Guarantee */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            
            {/* Scarcity Box */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-rose-50 to-orange-50 rounded-3xl p-8 border border-rose-100 shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-200/50 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center flex-shrink-0 text-rose-600">
                  <Flame className="w-8 h-8 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-rose-900 mb-2">Số lượng có hạn!</h4>
                  <p className="text-rose-800/80 leading-relaxed">
                    Chúng tôi chỉ có thể nhận tư vấn cho <strong className="text-rose-600 text-xl mx-1">5</strong> doanh nghiệp mỗi tuần để đảm bảo chất lượng cao nhất. Đừng để đối thủ cướp mất khách hàng của bạn!
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Guarantee Box */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-900 to-orange-900 rounded-3xl p-8 shadow-xl relative overflow-hidden flex-1 flex flex-col justify-center"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
              
              <div className="flex items-start gap-5 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-orange-800/50 border border-orange-700 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-inner">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-white mb-3">Cam kết rủi ro bằng 0</h4>
                  <p className="text-orange-100/80 leading-relaxed">
                    Nếu buổi tư vấn không giúp bạn tìm ra ít nhất <strong className="text-white">3 lỗ hổng</strong> trong quy trình bán hàng, chúng tôi sẽ tặng bạn thêm <strong className="text-yellow-300">1 tháng sử dụng công cụ hỗ trợ Marketing miễn phí</strong>.
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
