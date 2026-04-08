import { motion } from 'motion/react';
import { ArrowRight, BarChart3, Building2, CheckCircle2, Quote, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 pb-20">
      {/* Phần 1: Tiêu đề định vị */}
      <section className="relative px-6 md:px-16 lg:px-24 xl:px-32 pt-32 pb-16 md:pt-40 md:pb-24 overflow-hidden text-center">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-orange-200/40 rounded-full blur-[100px] -z-0 pointer-events-none"></div>
        <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-yellow-200/30 rounded-full blur-[80px] -z-0 pointer-events-none"></div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-7xl mx-auto"
        >
          {/* Badge */}
          <div className="inline-flex items-center justify-center px-6 py-2.5 rounded-full bg-orange-100/80 text-orange-700 font-semibold text-sm md:text-base mb-8 shadow-sm border border-orange-200/50">
            Năng lực cốt lõi (Core Competence)
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl md:text-5xl lg:text-[3.5rem] xl:text-[4.25rem] font-black text-slate-900 leading-[1.2] uppercase tracking-tight mb-6">
            <span className="block lg:whitespace-nowrap">HỆ THỐNG SEEDING ĐÃ GIÚP HƠN</span>
            <span className="inline-block bg-white text-orange-600 px-6 py-2 md:px-8 md:py-3 rounded-[2rem] shadow-xl shadow-orange-900/10 my-4 md:my-6 border border-orange-50 transform -rotate-2">
              500 DOANH NGHIỆP
            </span>
            <span className="block lg:whitespace-nowrap">SỬ DỤNG NIỀM TIN KHÁCH HÀNG</span>
          </h1>

          {/* Yellow Highlight Box */}
          <div className="inline-block bg-yellow-400 text-slate-900 px-8 py-3 md:px-10 md:py-4 rounded-2xl font-black text-2xl md:text-4xl uppercase tracking-tight shadow-md transform rotate-1 mb-10">
            VÀ TỐI ƯU HÓA DOANH THU
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
            Chúng tôi không chỉ tạo ra những bình luận. Chúng tôi xây dựng những cuộc hội thoại mang lại giá trị chuyển đổi thực tế trên mạng xã hội.
          </p>
        </motion.div>
      </section>

      {/* Phần 2: Chứng minh bằng con số thực tế */}
      <section className="px-6 md:px-16 lg:px-24 xl:px-32 py-12 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Building2, num: "500+", label: "Doanh nghiệp đã phục vụ", color: "text-orange-600", bg: "bg-orange-100" },
              { icon: CheckCircle2, num: "2,500+", label: "Chiến dịch thành công", color: "text-emerald-600", bg: "bg-emerald-100" },
              { icon: TrendingUp, num: "150%", label: "Tăng trưởng chuyển đổi trung bình", color: "text-amber-600", bg: "bg-amber-100" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 text-center group hover:-translate-y-2 transition-transform duration-300"
              >
                <div className={`w-16 h-16 mx-auto rounded-2xl ${stat.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
                <h3 className="text-4xl font-black text-slate-900 mb-2">{stat.num}</h3>
                <p className="text-slate-600 font-medium">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Phần 3: Bằng chứng xã hội - Logo các Thương hiệu */}
      <section className="px-6 md:px-16 lg:px-24 xl:px-32 py-16 bg-white border-y border-slate-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">
            Những đối tác đã tin tưởng giao phó thương hiệu của họ cho chúng tôi
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Placeholder Logos */}
            <div className="text-2xl font-black text-slate-800 flex items-center gap-2"><div className="w-8 h-8 bg-orange-600 rounded-lg"></div> Brand A</div>
            <div className="text-2xl font-black text-slate-800 flex items-center gap-2"><div className="w-8 h-8 bg-emerald-500 rounded-full"></div> TechCorp</div>
            <div className="text-2xl font-black text-slate-800 flex items-center gap-2"><div className="w-8 h-8 bg-rose-500 rotate-45"></div> Beauty VN</div>
            <div className="text-2xl font-black text-slate-800 flex items-center gap-2"><div className="w-8 h-8 bg-amber-500 rounded-tl-xl rounded-br-xl"></div> EduPro</div>
            <div className="text-2xl font-black text-slate-800 flex items-center gap-2"><div className="w-8 h-8 bg-orange-500 rounded-full border-4 border-orange-200"></div> FinTech</div>
          </div>
        </div>
      </section>

      {/* Phần 4: Nghiên cứu trường hợp thực chiến */}
      <section className="px-6 md:px-16 lg:px-24 xl:px-32 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Chứng minh bằng kết quả thực tế</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Chúng tôi không tự nói mình giỏi, chúng tôi để kết quả của khách hàng lên tiếng.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Case Study 1 */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 border border-slate-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
              <div className="relative z-10">
                <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 font-semibold text-sm rounded-full mb-6">
                  Ngành Mỹ Phẩm
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Vấn đề của khách hàng:
                    </h4>
                    <p className="text-slate-600">Thương hiệu A sụt giảm đơn hàng nghiêm trọng do thiếu niềm tin người dùng khi ra mắt dòng sản phẩm mới. Khách hàng hỏi giá rồi im lặng.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Giải pháp:
                    </h4>
                    <p className="text-slate-600">Triển khai kịch bản "gieo hạt ma trận" trên 20 nhóm mục tiêu làm đẹp, tạo ra các cuộc thảo luận tự nhiên về trải nghiệm sử dụng sản phẩm.</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kết quả:
                    </h4>
                    <p className="text-emerald-800 font-medium">Tăng 200% tỷ lệ chốt đơn từ inbox và giảm 30% chi phí quảng cáo (CPA) chỉ sau 2 tuần triển khai.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Case Study 2 */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-lg shadow-slate-200/50 border border-slate-200 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-0"></div>
              <div className="relative z-10">
                <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-700 font-semibold text-sm rounded-full mb-6">
                  Ngành Giáo Dục
                </div>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500"></span> Vấn đề của khách hàng:
                    </h4>
                    <p className="text-slate-600">Trung tâm tiếng Anh B gặp khó khăn trong việc tuyển sinh khóa mới do cạnh tranh cao và thiếu review chân thực từ học viên cũ.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> Giải pháp:
                    </h4>
                    <p className="text-slate-600">Xây dựng chuỗi câu chuyện thành công (Success Stories) và lan truyền tự nhiên trong các cộng đồng học tập, group phụ huynh.</p>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <h4 className="font-bold text-emerald-900 flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kết quả:
                    </h4>
                    <p className="text-emerald-800 font-medium">Lấp đầy 100% sĩ số 5 lớp học mới trong vòng 1 tháng, chi phí thu hút 1 học viên (CAC) giảm 45%.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Phần 6: Lời cam kết từ Founder */}
      <section className="px-6 md:px-16 lg:px-24 xl:px-32 py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-orange-50 rounded-full blur-3xl -z-10"></div>
        <div className="max-w-4xl mx-auto text-center">
          <Quote className="w-16 h-16 text-orange-200 mx-auto mb-8 rotate-180" />
          <h2 className="text-3xl md:text-4xl font-medium text-slate-900 leading-relaxed mb-10 italic">
            "Chúng tôi không bán dịch vụ gieo mầm, chúng tôi bán <span className="text-orange-600 font-bold">giải pháp tăng doanh thu</span> dựa trên niềm tin thật."
          </h2>
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-slate-200 rounded-full overflow-hidden">
              <img src="https://picsum.photos/seed/founder/200/200" alt="Founder" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-900 text-lg">Nguyễn Văn A</p>
              <p className="text-slate-500">Founder & CEO Scrollix</p>
            </div>
          </div>
        </div>
      </section>

      {/* Phần 6: Lời kêu gọi hành động (CTA) */}
      <section className="px-6 md:px-16 lg:px-24 xl:px-32 py-12 pb-24">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-[#f97316] to-[#ea580c] rounded-[3rem] p-8 md:p-16 shadow-2xl shadow-orange-900/20 relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white opacity-10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-400 opacity-20 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline */}
            <div className="lg:col-span-6 text-left">
              <h2 className="text-5xl md:text-6xl lg:text-[5rem] font-black text-white leading-[1.1] tracking-tight mb-6">
                Sẵn sàng <br />
                thống lĩnh <br />
                <span className="text-yellow-400">thị trường?</span>
              </h2>
            </div>

            {/* Right Column: Glass Card */}
            <div className="lg:col-span-6 relative mt-8 lg:mt-0">
              {/* P.S Badge */}
              <div className="absolute -top-6 -left-6 w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center font-black text-orange-900 text-xl z-20 transform -rotate-12 shadow-lg border-4 border-[#f97316]">
                P.S
              </div>
              
              {/* Inner Card */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 md:p-10 relative z-10 shadow-2xl">
                <p className="text-2xl md:text-3xl text-white font-bold mb-6 leading-snug">
                  Đừng để chi phí quảng cáo tiếp tục <span className="text-yellow-400">"đốt sạch"</span> lợi nhuận của bạn mỗi ngày.
                </p>
                
                <div className="w-16 h-1 bg-white/20 rounded-full mb-6"></div>
                
                <p className="text-orange-50 text-lg md:text-xl mb-10 leading-relaxed font-medium">
                  Hãy áp dụng chiến lược seeding hiệu quả ngay hôm nay trước khi thị trường trở nên bão hòa và đối thủ bỏ xa bạn.
                </p>
                
                <Link 
                  to="/contact" 
                  className="inline-flex w-full justify-center items-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-bold text-base md:text-lg px-8 py-4 rounded-2xl transition-all transform hover:-translate-y-1 shadow-xl shadow-yellow-400/30"
                >
                  ĐIỀN FORM TƯ VẤN NGAY
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
