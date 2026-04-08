import { motion } from 'motion/react';
import { BrainCircuit, Zap, CalendarClock, FolderTree, ShieldCheck } from 'lucide-react';

export default function BenefitsZaca() {
  const benefits = [
    {
      id: "notebooklm",
      title: "Tích hợp NotebookLM",
      desc: "Không còn nỗi lo AI 'nói nhảm'. AI học đúng bảng giá, FAQ để trả lời khách chuẩn xác từng chữ.",
      icon: <BrainCircuit className="w-8 h-8 text-blue-600" />,
      bg: "bg-blue-50",
      border: "border-blue-100",
      colSpan: "md:col-span-2",
      highlight: "Chuẩn xác 100%"
    },
    {
      id: "auto-reply",
      title: "Tự động phản hồi tin nhắn",
      desc: "Phục vụ khách hàng ngay tức thì 24/7, tăng tỷ lệ chuyển đổi lên gấp 3 lần vì khách không phải chờ đợi.",
      icon: <Zap className="w-8 h-8 text-orange-500" />,
      bg: "bg-orange-50",
      border: "border-orange-100",
      colSpan: "md:col-span-1",
      highlight: "x3 Chuyển đổi"
    },
    {
      id: "auto-schedule",
      title: "AI tự lên lịch chăm sóc",
      desc: "Đảm bảo mọi khách hàng đều được 'theo đuổi' theo kịch bản. Bạn không cần nhớ lịch, AI sẽ làm thay bạn.",
      icon: <CalendarClock className="w-8 h-8 text-emerald-600" />,
      bg: "bg-emerald-50",
      border: "border-emerald-100",
      colSpan: "md:col-span-1",
      highlight: "Tự động 100%"
    },
    {
      id: "folder-chat",
      title: "Phân loại chat theo thư mục",
      desc: "Quản lý nhiều dòng sản phẩm trên cùng một Zalo mà không bị loạn.",
      icon: <FolderTree className="w-8 h-8 text-purple-600" />,
      bg: "bg-purple-50",
      border: "border-purple-100",
      colSpan: "md:col-span-1",
      highlight: "Gọn gàng"
    },
    {
      id: "proxy",
      title: "Proxy tối ưu",
      desc: "Bảo vệ tài khoản Zalo của bạn an toàn, hạn chế tối đa rủi ro bị khóa tài khoản (die nick).",
      icon: <ShieldCheck className="w-8 h-8 text-rose-600" />,
      bg: "bg-rose-50",
      border: "border-rose-100",
      colSpan: "md:col-span-1",
      highlight: "An toàn tuyệt đối"
    }
  ];

  return (
    <section className="py-24 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Biến tính năng thành <span className="text-orange-600">lợi nhuận</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            ZACA không chỉ là công cụ, mà là một cỗ máy tối ưu hóa quy trình bán hàng của bạn từ A đến Z.
          </motion.p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {benefits.map((benefit, idx) => (
            <motion.div
              key={benefit.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`${benefit.colSpan} ${benefit.bg} border ${benefit.border} rounded-3xl p-8 relative overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
            >
              {/* Decorative background element */}
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/40 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                    {benefit.icon}
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/60 text-slate-700 text-xs font-bold backdrop-blur-sm border border-white/80 shadow-sm">
                    {benefit.highlight}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
                <p className="text-slate-700 leading-relaxed font-medium mt-auto">
                  {benefit.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
