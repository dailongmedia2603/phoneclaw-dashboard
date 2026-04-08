import { motion } from 'motion/react';
import { AlertTriangle, Clock, MessageSquareX, TrendingDown } from 'lucide-react';

export default function PainPointsZalo() {
  const pains = [
    {
      icon: <MessageSquareX className="w-8 h-8 text-rose-600" />,
      text: "Bạn có đang mệt mỏi vì nhân viên trả lời sai giá, nhầm quy trình làm mất lòng tin của khách?"
    },
    {
      icon: <Clock className="w-8 h-8 text-rose-600" />,
      text: "Bạn có đang để tiền rơi vì tin nhắn Zalo quá tải, khách hỏi nhưng 2 tiếng sau mới thấy, và rồi họ đã sang đối thủ mua hàng?"
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-rose-600" />,
      text: "Hầu hết khách hàng không mua ngay lần đầu. Nhưng bạn và nhân viên của bạn có thực sự đủ kỷ luật để nhắc lịch chăm sóc họ sau 3 ngày, 7 ngày, hay 30 ngày không?"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-200/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-200/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

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
              Sự thật <span className="text-rose-600">tàn nhẫn</span> về việc bán hàng qua Zalo cá nhân
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
                  <p className="text-lg md:text-xl text-slate-700 leading-relaxed pt-1 font-medium">
                    {pain.text}
                  </p>
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
            <div className="absolute inset-0 bg-gradient-to-br from-rose-200 to-orange-200 rounded-[3rem] transform rotate-3 scale-105 -z-10 blur-xl opacity-60"></div>
            <div className="bg-white border border-rose-100 rounded-[3rem] p-10 md:p-12 shadow-2xl shadow-rose-900/10 relative overflow-hidden h-full flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full"></div>
              
              <TrendingDown className="w-16 h-16 text-rose-500 mb-8" />
              
              <p className="text-2xl md:text-3xl font-medium text-slate-900 leading-relaxed mb-10">
                "Đó là lý do tại sao <span className="text-rose-600 font-bold">90%</span> doanh nghiệp dùng Zalo cá nhân đang lãng phí ít nhất <span className="text-rose-600 font-bold">50%</span> doanh thu tiềm năng."
              </p>
              
              <div className="mt-auto">
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <motion.div 
                    initial={{ width: 0 }}
                    whileInView={{ width: "50%" }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20"></div>
                  </motion.div>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-500 uppercase tracking-wider">
                  <span>Doanh thu thực tế</span>
                  <span className="text-rose-600">Bị bỏ lỡ (50%)</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
