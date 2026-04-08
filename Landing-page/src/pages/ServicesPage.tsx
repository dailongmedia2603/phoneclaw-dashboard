import { motion } from 'motion/react';
import { TrendingUp, Users, Target, Zap, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import CTA from '../components/CTA';

export default function ServicesPage() {
  const services = [
    {
      id: "01",
      title: "Seeding Đa Nền Tảng (Facebook, TikTok, Threads)",
      category: "SOCIAL PROOF",
      image: "https://picsum.photos/seed/social/1200/800",
      showStats: true,
      stats: [
        { icon: <TrendingUp className="w-4 h-4 text-emerald-400" />, value: "Tăng 200% chốt đơn" },
      ],
      description: "Xây dựng chứng chỉ xã hội – Tạo ra hàng trăm khách hàng thực sự đánh giá về sản phẩm, giúp tăng tỉ lệ chốt đơn lên 200%.",
      features: [
        "Khách hàng tin tưởng ngay từ cái nhìn đầu tiên",
        "Tạo hiệu ứng đám đông (FOMO) tự nhiên",
        "Đánh bay sự hoài nghi về sản phẩm/dịch vụ",
        "Rút ngắn thời gian ra quyết định mua hàng"
      ]
    },
    {
      id: "02",
      title: "Tư Vấn Lộ Trình Seeding Theo Ngành Hàng",
      category: "STRATEGY",
      image: "https://picsum.photos/seed/strategy/1200/800",
      showStats: false,
      description: "Thiết kế kịch bản gieo hạt 'như thật' – Đảm bảo nội dung đi đúng tâm lý khách hàng và không bị admin khóa bài.",
      features: [
        "Kịch bản chạm đúng 'nỗi đau' của khách hàng",
        "Luồn lách khéo léo, an toàn 100% không lo khóa bài",
        "Định hướng dư luận theo hướng có lợi nhất",
        "Biến người đọc thành người mua một cách vô thức"
      ]
    }
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-orange-100 selection:text-orange-900">
      {/* Page Header */}
      <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-b from-[#f97316] to-[#c2410c]">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-20 right-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
        </div>
        
        <div className="w-full px-6 md:px-16 lg:px-24 xl:px-32 relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white font-semibold text-sm mb-8 shadow-lg shadow-orange-900/20"
          >
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            Giải pháp Seeding toàn diện
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 tracking-tight leading-tight"
          >
            Danh sách <br className="md:hidden" />
            <span className="inline-block bg-white text-[#ea580c] px-6 py-2 rounded-2xl rotate-[-2deg] shadow-xl mt-2 md:mt-0">Dịch Vụ</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-orange-50 max-w-2xl mx-auto font-medium"
          >
            Khám phá các giải pháp seeding và marketing đột phá giúp doanh nghiệp của bạn bứt phá doanh thu và thống lĩnh thị trường.
          </motion.p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50 relative z-10 border-b border-gray-200">
        <div className="w-full px-6 md:px-16 lg:px-24 xl:px-32">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
              Bạn đang gặp tình trạng: Chạy quảng cáo rất nhiều nhưng khách hàng chỉ vào xem rồi <span className="text-red-500">yên lặng rời đi?</span>
            </h2>
            <div className="w-24 h-1 bg-orange-600 mx-auto mb-8"></div>
            <p className="text-xl text-gray-700 leading-relaxed font-medium">
              Sự thật là: Khách hàng <span className="font-bold text-gray-900">không còn tin</span> vào những gì bạn tự nói về mình nữa. Họ đang đi tìm những người "như họ" để xin lời khuyên trước khi rút ví.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services List */}
      <section className="py-24 relative z-10 bg-white">
        <div className="w-full px-6 md:px-16 lg:px-24 xl:px-32">
          <div className="flex flex-col gap-24">
            {services.map((service, index) => (
              <motion.div 
                key={service.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                className={`flex flex-col ${index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}
              >
                {/* Image Side */}
                <div className="w-full lg:w-1/2 relative">
                  {/* Decorative background shape for image */}
                  <div className={`absolute inset-0 bg-orange-50 rounded-[3rem] ${index % 2 !== 0 ? 'rotate-3' : '-rotate-3'} scale-105 transition-transform group-hover:rotate-0 duration-500`}></div>
                  <div className="relative h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-orange-900/10 border-4 border-white bg-gray-100">
                    <img 
                      src={service.image} 
                      alt={service.title}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#c2410c]/90 via-[#c2410c]/20 to-transparent mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-transparent to-transparent"></div>
                    
                    <div className="absolute bottom-8 left-8 right-8">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.showStats && service.stats ? (
                          service.stats.map((stat, i) => (
                            <div key={i} className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-2 flex items-center gap-2 text-white text-sm font-bold shadow-lg">
                              {stat.icon}
                              <span className="text-base">{stat.value}</span>
                            </div>
                          ))
                        ) : (
                          <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-5 py-2 flex items-center gap-2 text-white text-sm font-bold tracking-wider uppercase shadow-lg">
                            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                            {service.category}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Side */}
                <div className="w-full lg:w-1/2 flex flex-col justify-center relative">
                  <div className={`absolute -top-10 ${index % 2 !== 0 ? '-right-10 text-right' : '-left-10 text-left'} text-gray-100 font-black text-[150px] leading-none select-none pointer-events-none z-0`}>
                    {service.id}
                  </div>
                  <div className="relative z-10">
                    <div className="inline-block border-b-2 border-orange-600 pb-1 mb-4">
                      <span className="text-orange-600 font-black text-xl tracking-widest">DỊCH VỤ {service.id}</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">{service.title}</h2>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">
                      {service.description}
                    </p>
                    
                    <div className="space-y-4 mb-10">
                      {service.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 hover:bg-orange-50 hover:border-orange-100 transition-colors group/feature">
                          <CheckCircle2 className="w-6 h-6 text-orange-600 shrink-0 mt-0.5 group-hover/feature:scale-110 transition-transform" />
                          <span className="text-gray-700 font-medium text-lg">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div>
                      <button className="bg-[#ea580c] hover:bg-orange-700 text-white px-8 py-4 rounded-full font-bold transition-all flex items-center gap-2 group w-fit shadow-xl shadow-orange-600/20 hover:shadow-2xl hover:shadow-orange-600/40 hover:-translate-y-1 text-lg">
                        Tư vấn dịch vụ này
                        <ArrowUpRight className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 bg-slate-50 relative z-10 overflow-hidden border-t border-slate-200">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        
        <div className="w-full px-6 md:px-16 lg:px-24 xl:px-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight text-slate-900">
              Chúng tôi đã giúp hơn <span className="text-orange-600 text-6xl">500+</span> doanh nghiệp
            </h2>
            <p className="text-2xl text-slate-600 mb-12 font-medium">
              Giảm <span className="text-white font-bold bg-orange-600 px-3 py-1 rounded-lg shadow-md">30%</span> chi phí CPL (giá mỗi khách hàng tiềm năng) nhờ tăng niềm tin khách hàng thông qua gieo hạt.
            </p>
            
            {/* Visual feedback/icons */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <TrendingUp className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-2">+200%</h3>
                <p className="text-slate-500 font-medium">Tỷ lệ chốt đơn</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-2">500+</h3>
                <p className="text-slate-500 font-medium">Khách hàng tin tưởng</p>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target className="w-8 h-8 text-rose-600" />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-2">-30%</h3>
                <p className="text-slate-500 font-medium">Chi phí CPL</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTA />
    </main>
  );
}
