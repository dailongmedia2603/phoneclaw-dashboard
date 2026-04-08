import { motion } from 'motion/react';
import { MessageCircleQuestion, TrendingDown, Wallet, Search, AlertOctagon } from 'lucide-react';

export default function TheProblem() {
  const problems = [
    {
      icon: <TrendingDown className="w-6 h-6 text-rose-500" />,
      bgColor: "bg-rose-50",
      title: "Chi phí tăng, chuyển đổi giảm",
      description: "Bạn đang chi ngày càng nhiều tiền cho quảng cáo nhưng tỷ lệ chuyển đổi ngày càng thấp?"
    },
    {
      icon: <MessageCircleQuestion className="w-6 h-6 text-orange-500" />,
      bgColor: "bg-orange-50",
      title: "Hỏi giá rồi... mất hút",
      description: "Khách hàng nhắn tin hỏi thông tin, tư vấn nhiệt tình rồi im lặng không một lời từ biệt?"
    },
    {
      icon: <Wallet className="w-6 h-6 text-amber-500" />,
      bgColor: "bg-amber-50",
      title: "Lợi nhuận bị bào mòn",
      description: "Bạn lo sợ chi phí Marketing sẽ nuốt chửng toàn bộ lợi nhuận của doanh nghiệp?"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-orange-100/50 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-rose-100/50 blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-semibold text-sm mb-6"
          >
            <AlertOctagon className="w-4 h-4" />
            Thực trạng đáng báo động
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight"
          >
            Vấn đề <span className="text-rose-500">không phải</span> ở sản phẩm của bạn...
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Problems List */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {problems.map((problem, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
              >
                <div className="flex gap-5 items-start">
                  <div className={`w-14 h-14 rounded-2xl ${problem.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    {problem.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{problem.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{problem.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Column: The Truth Highlight */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="h-full rounded-[2.5rem] bg-gradient-to-b from-[#f97316] to-[#c2410c] p-8 md:p-12 text-white flex flex-col justify-center relative overflow-hidden shadow-2xl shadow-orange-900/20">
              {/* Abstract shapes matching Hero section */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-30"></div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20">
                  <Search className="w-8 h-8 text-white" />
                </div>
                
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                  Sự thật là: Khách hàng <br className="hidden md:block" />
                  <span className="text-yellow-300">không còn tin</span> vào quảng cáo nữa.
                </h3>
                
                <div className="w-20 h-1 bg-white/30 rounded-full mb-8"></div>
                
                <p className="text-lg md:text-xl text-orange-50 leading-relaxed mb-8">
                  Họ đang đi tìm review từ những người <span className="font-bold text-white bg-white/20 px-3 py-1 rounded-lg mx-1">"giống họ"</span> trên các Group Facebook, TikTok trước khi quyết định rút ví.
                </p>
                
                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                  <p className="text-white font-medium text-lg">
                    💡 Nếu bạn không có mặt ở đó với những lời khen chân thực, bạn đã nhường khách hàng cho đối thủ.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
