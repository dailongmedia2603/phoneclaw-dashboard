import { motion } from 'motion/react';
import { Bot, Sparkles, Zap, ShieldCheck, Clock } from 'lucide-react';

export default function SolutionZaca() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 relative order-2 lg:order-1"
          >
            {/* Visual representation of ZACA */}
            <div className="relative w-full aspect-[4/5] max-w-md mx-auto">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-yellow-300 rounded-[3rem] transform -rotate-3 scale-105 opacity-20 blur-xl"></div>
              <div className="absolute inset-0 bg-white rounded-[3rem] shadow-2xl border border-orange-100 overflow-hidden flex flex-col">
                
                {/* Chat Header */}
                <div className="bg-slate-900 p-6 flex items-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl"></div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg relative z-10">
                    <Bot className="w-7 h-7 text-white" />
                  </div>
                  <div className="relative z-10">
                    <h3 className="text-white font-bold text-xl">ZACA AI</h3>
                    <p className="text-orange-200 text-sm flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Siêu nhân viên trực tuyến
                    </p>
                  </div>
                </div>
                
                {/* Chat Body */}
                <div className="flex-1 p-6 bg-slate-50 flex flex-col gap-5 relative">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/circuit-board.png')] opacity-[0.03]"></div>
                  
                  {/* Chat bubbles */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: "bottom right" }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 }}
                    className="self-end bg-orange-100 text-orange-900 p-4 rounded-2xl rounded-tr-sm max-w-[85%] shadow-sm border border-orange-200/50"
                  >
                    <p className="text-sm font-medium">Sản phẩm này giá bao nhiêu và có bảo hành không shop?</p>
                  </motion.div>
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95, transformOrigin: "top left" }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.8 }}
                    className="self-start bg-white border border-gray-200 text-gray-800 p-5 rounded-2xl rounded-tl-sm max-w-[90%] shadow-md relative"
                  >
                    <div className="absolute -left-3 -top-3 w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <p className="text-sm leading-relaxed">Dạ chào anh/chị, sản phẩm có giá <strong className="text-orange-600">1.250.000đ</strong> và được bảo hành chính hãng <strong className="text-orange-600">12 tháng</strong> ạ. Đặc biệt hôm nay bên em đang có chương trình freeship. Anh/chị muốn đặt hàng luôn không ạ?</p>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 1.2 }}
                    className="mt-auto mx-auto bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-sm"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Tư vấn chính xác 100% từ NotebookLM
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-6 order-1 lg:order-2"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm mb-6 uppercase tracking-wider border border-orange-200">
              <Zap className="w-4 h-4" />
              Giải pháp đột phá
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] mb-6">
              Giới thiệu <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">ZACA</span>
            </h2>
            
            <p className="text-2xl text-slate-800 font-bold mb-6 leading-snug">
              Hệ điều hành bán hàng qua Zalo cá nhân thông minh nhất hiện nay.
            </p>
            
            <p className="text-lg text-slate-600 mb-10 leading-relaxed">
              Không chỉ là phần mềm quản lý tin nhắn thông thường, ZACA mang đến một <strong className="text-orange-600 text-xl mx-1">"siêu nhân viên AI"</strong> được đào tạo từ chính dữ liệu chuẩn của doanh nghiệp bạn (thông qua NotebookLM).
            </p>
            
            <div className="space-y-6">
              <div className="flex gap-5 items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-100 transition-colors">
                  <ShieldCheck className="w-7 h-7 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Tư vấn chính xác như chuyên gia</h3>
                  <p className="text-slate-600 leading-relaxed">AI tự động truy xuất dữ liệu từ tài liệu nội bộ, đảm bảo 100% câu trả lời đúng giá, đúng chính sách, không bao giờ "ảo giác".</p>
                </div>
              </div>
              
              <div className="flex gap-5 items-start bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md hover:border-yellow-200 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-yellow-50 flex items-center justify-center flex-shrink-0 group-hover:bg-yellow-100 transition-colors">
                  <Clock className="w-7 h-7 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Tự động chăm sóc đến khi ra đơn</h3>
                  <p className="text-slate-600 leading-relaxed">Hệ thống tự động lên lịch và gửi tin nhắn nhắc nhở theo kịch bản (3 ngày, 7 ngày...) mà không cần nhân viên phải nhớ.</p>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
