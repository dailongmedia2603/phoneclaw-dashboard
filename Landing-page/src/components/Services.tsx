import { motion } from 'motion/react';
import { TrendingUp, Users, Target, Zap, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Services() {
  const services = [
    {
      id: "01",
      title: "Seeding Đa Nền Tảng",
      category: "SOCIAL MEDIA",
      image: "https://picsum.photos/seed/ocean/1200/800",
      showStats: false,
      description: "Phủ sóng thương hiệu trên mọi mặt trận Facebook, TikTok, Instagram với hàng ngàn bình luận tự nhiên, tạo hiệu ứng FOMO mạnh mẽ."
    },
    {
      id: "02",
      title: "Xử Lý Khủng Hoảng",
      category: "PR & BRANDING",
      image: "https://picsum.photos/seed/sunset/1200/800",
      showStats: false,
      description: "Kiểm soát thông tin tiêu cực, điều hướng dư luận và bảo vệ uy tín thương hiệu trong thời gian thực với kịch bản khéo léo."
    },
    {
      id: "03",
      title: "Kịch Bản Chuyển Đổi",
      category: "CONTENT",
      image: "https://picsum.photos/seed/city/1200/800",
      showStats: true,
      stats: [
        { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, value: "120%" },
        { icon: <Users className="w-4 h-4 text-orange-400" />, value: "50K" },
        { icon: <Target className="w-4 h-4 text-rose-400" />, value: "35M+" }
      ],
      description: "Xây dựng kịch bản seeding bám sát tâm lý khách hàng, kích thích nhu cầu và thúc đẩy chốt sale tự nhiên không gượng ép."
    },
    {
      id: "04",
      title: "Tối Ưu Hội Thoại",
      category: "CONSULTING",
      image: "https://picsum.photos/seed/forest/1200/800",
      showStats: true,
      stats: [
        { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, value: "312%" },
        { icon: <Users className="w-4 h-4 text-orange-400" />, value: "20K+" },
        { icon: <Target className="w-4 h-4 text-rose-400" />, value: "18M+" }
      ],
      description: "Đào tạo đội ngũ trực page cách trả lời comment/inbox kết hợp seeding để không bỏ lọt bất kỳ khách hàng tiềm năng nào."
    }
  ];

  return (
    <section id="services" className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 font-semibold text-sm mb-6">
              <Zap className="w-4 h-4" />
              Giải pháp của chúng tôi
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-2xl leading-tight">
              Dịch vụ <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-300">đột phá</span><br/>
              cho doanh nghiệp của bạn.
            </h2>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <Link 
              to="/services"
              className="bg-white hover:bg-orange-50 text-orange-900 px-8 py-4 rounded-full font-bold transition-colors flex items-center gap-2 group"
            >
              Xem tất cả dịch vụ
              <ArrowUpRight className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service, index) => (
            <motion.div 
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative h-[350px] md:h-[450px] rounded-[2rem] overflow-hidden group cursor-pointer shadow-2xl"
            >
              {/* Background Image */}
              <img 
                src={service.image} 
                alt={service.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                referrerPolicy="no-referrer"
              />
              
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-black/90 group-hover:from-orange-900/70 group-hover:to-orange-900/95 transition-colors duration-500"></div>

              {/* Top Content */}
              <div className="absolute top-8 left-8 right-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-3xl md:text-4xl font-bold text-white drop-shadow-lg flex items-center gap-3">
                  <span className="text-orange-400 font-black">{service.id}.</span> 
                  {service.title}
                </h3>
                
                {/* Tags/Stats */}
                <div className="flex flex-wrap gap-2">
                  {service.showStats && service.stats ? (
                    service.stats.map((stat, i) => (
                      <div key={i} className="bg-white/20 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white text-sm font-bold shadow-lg">
                        {stat.icon}
                        <span>{stat.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white/20 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-white text-sm font-bold tracking-wider uppercase shadow-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-400"></div>
                      {service.category}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Content */}
              <div className="absolute bottom-8 left-8 right-8 translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                <div className="w-12 h-1 bg-orange-500 rounded-full mb-4"></div>
                <p className="text-orange-50 text-lg md:text-xl leading-relaxed max-w-lg">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
