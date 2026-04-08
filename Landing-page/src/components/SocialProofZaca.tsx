import { motion } from 'motion/react';
import { Star, MessageCircleHeart, Quote } from 'lucide-react';

export default function SocialProofZaca() {
  const testimonials = [
    {
      name: "Chị Lan Anh",
      role: "Chủ shop Thời trang nữ",
      content: "Từ ngày dùng ZACA, nhân viên nhàn hẳn. Khách nhắn tin lúc 2h sáng hỏi size, sáng dậy thấy AI đã tư vấn xong và khách chốt luôn 2 bộ. Thật sự bất ngờ với độ thông minh của nó!",
      avatar: "https://i.pravatar.cc/150?img=5",
      time: "Hôm qua lúc 08:30"
    },
    {
      name: "Anh Hoàng Tuấn",
      role: "Giám đốc TT Tiếng Anh",
      content: "Lúc đầu sợ AI trả lời ngáo làm mất khách, nhưng tích hợp NotebookLM xong nó tư vấn khóa học còn chuẩn hơn cả sale cứng của mình. Không sai một chữ về học phí hay lịch học.",
      avatar: "https://i.pravatar.cc/150?img=11",
      time: "2 ngày trước"
    },
    {
      name: "Chị Minh Ngọc",
      role: "Kinh doanh Mỹ phẩm",
      content: "Doanh thu tháng này tăng 40% nhờ cái tính năng tự động nhắc lịch chăm sóc. Khách mua kem dưỡng xong, đúng 30 ngày sau AI tự nhắn hỏi thăm và mời mua lại. Quá đỉnh!",
      avatar: "https://i.pravatar.cc/150?img=9",
      time: "Tuần trước"
    },
    {
      name: "Anh Đức Hải",
      role: "Đại lý Bất động sản",
      content: "Quản lý 5 dự án trên cùng 1 Zalo mà không bị loạn nhờ tính năng phân loại thư mục. Proxy xịn nên nick chạy ầm ầm không lo bị khóa. Rất đáng tiền!",
      avatar: "https://i.pravatar.cc/150?img=14",
      time: "Tuần trước"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02]"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-700 font-bold text-sm mb-6 uppercase tracking-wider"
          >
            <MessageCircleHeart className="w-4 h-4" />
            Bằng chứng thực tế
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Hàng trăm chủ shop đã <span className="text-orange-600">giải phóng</span><br className="hidden md:block" /> thời gian nhờ ZACA
          </motion.h2>
        </div>

        {/* Masonry-style Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {testimonials.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15 }}
              className={`bg-white rounded-3xl p-6 shadow-lg shadow-slate-200/50 border border-slate-100 relative ${idx % 2 !== 0 ? 'lg:mt-12' : ''}`}
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-orange-100 transform rotate-180" />
              
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              <p className="text-slate-700 leading-relaxed mb-6 relative z-10">
                "{item.content}"
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50">
                <img src={item.avatar} alt={item.name} className="w-12 h-12 rounded-full object-cover border-2 border-orange-100" />
                <div>
                  <h4 className="font-bold text-slate-900">{item.name}</h4>
                  <p className="text-xs text-slate-500">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
