import { motion } from 'motion/react';
import { Rocket, Users, Target, CheckCircle2 } from 'lucide-react';

export default function CredentialsBenefits() {
  const benefits = [
    {
      icon: <Rocket className="w-8 h-8 text-orange-600" />,
      title: "Tăng hiệu quả quảng cáo",
      description: "Nhân bản sức mạnh của mọi chiến dịch Ads hiện tại lên gấp nhiều lần mà không cần tăng thêm ngân sách.",
      bgColor: "bg-orange-50",
      iconBg: "bg-orange-100"
    },
    {
      icon: <Target className="w-8 h-8 text-emerald-600" />,
      title: "Khách hàng khao khát",
      description: "Biến những khách hàng đang do dự, so sánh giá thành những người mua hàng khao khát sản phẩm của bạn.",
      bgColor: "bg-emerald-50",
      iconBg: "bg-emerald-100"
    },
    {
      icon: <Users className="w-8 h-8 text-purple-600" />,
      title: "Đè bẹp đối thủ",
      description: "Tạo ra hiệu ứng đám đông (Bandwagon effect) áp đảo, khiến đối thủ cạnh tranh hoàn toàn lu mờ trong mắt khách hàng.",
      bgColor: "bg-purple-50",
      iconBg: "bg-purple-100"
    }
  ];

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Credentials (Now using the Hero gradient) */}
          <div className="lg:col-span-5">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="rounded-[2.5rem] bg-gradient-to-b from-[#f97316] to-[#c2410c] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl shadow-orange-900/20"
            >
              {/* Abstract shapes matching Hero section */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-pulse"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-400 rounded-full mix-blend-screen filter blur-3xl opacity-30"></div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium text-orange-50 mb-8 backdrop-blur-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Uy tín đã được kiểm chứng
                </div>
                
                <h2 className="text-7xl md:text-8xl font-black text-white mb-4 tracking-tight drop-shadow-md">
                  500+
                </h2>
                
                <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-orange-50">
                  Doanh nghiệp đã <br />tối ưu chi phí.
                </h3>
                
                <p className="text-orange-100 text-lg leading-relaxed mb-10">
                  Chúng tôi đã triển khai chiến dịch seeding thành công cho hơn 500 doanh nghiệp lớn nhỏ, giúp họ tối ưu chi phí Marketing đáng kể và thống lĩnh thị trường ngách của mình.
                </p>

                <div className="flex items-center gap-4">
                  <div className="flex -space-x-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="w-12 h-12 rounded-full border-2 border-orange-600 overflow-hidden bg-white">
                        <img src={`https://picsum.photos/seed/client${i}/100/100`} alt="Client" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                    <div className="w-12 h-12 rounded-full border-2 border-orange-600 bg-white flex items-center justify-center text-sm font-bold text-orange-600 shadow-sm">
                      +495
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Benefits (Light theme cards) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className={`relative overflow-hidden rounded-3xl bg-white border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 group`}
              >
                {/* Subtle background highlight on hover */}
                <div className={`absolute inset-0 ${benefit.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                
                <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                  <div className={`w-16 h-16 rounded-2xl ${benefit.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                    {benefit.icon}
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-3">{benefit.title}</h4>
                    <p className="text-gray-600 leading-relaxed text-lg">{benefit.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
