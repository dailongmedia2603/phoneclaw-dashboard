import { motion } from 'motion/react';
import { Zap, CheckCircle2, Check, Star } from 'lucide-react';

export default function OfferZaca() {
  const plans = [
    {
      name: "Trải nghiệm",
      badge: "Khuyên dùng",
      desc: "Gói trải nghiệm dịch vụ chuyên sâu full tính năng.",
      price: "49.000",
      period: "/ 1 tuần",
      zaloCount: "1",
      duration: "1 tuần",
      highlight: true
    },
    {
      name: "Cá nhân",
      desc: "Dành cho cá nhân có 1 tài khoản & không giới hạn nhân viên & Quản lý.",
      price: "199.000",
      period: "/ 1 tháng",
      zaloCount: "1",
      duration: "1 tháng",
      highlight: false
    },
    {
      name: "Team",
      desc: "Dành cho Team có nhiều tài khoản Zalo & không giới hạn nhân viên & Quản lý.",
      price: "499.000",
      period: "/ 1 tháng",
      zaloCount: "3",
      duration: "1 tháng",
      highlight: false
    },
    {
      name: "Doanh nghiệp",
      desc: "Dành cho doanh nghiệp có nhiều tài khoản Zalo & không giới hạn nhân viên & Quản lý.",
      price: "999.000",
      period: "/ 1 tháng",
      zaloCount: "5",
      duration: "1 tháng",
      highlight: false
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-orange-100/50 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl lg:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Sở hữu ngay hệ thống ZACA với trọn bộ tính năng <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">'Bá đạo'</span> nhất thị trường.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Chọn gói dịch vụ phù hợp với quy mô kinh doanh của bạn. Nâng cấp hoặc hủy bất kỳ lúc nào.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`relative flex flex-col bg-white rounded-3xl p-6 md:p-8 transition-all duration-300 ${
                plan.highlight 
                  ? 'ring-2 ring-orange-500 shadow-2xl shadow-orange-900/10 scale-100 lg:scale-105 z-10' 
                  : 'border border-slate-200 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 shadow-md whitespace-nowrap">
                  <Star className="w-4 h-4 fill-white" />
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <p className="text-sm text-slate-500 min-h-[60px]">{plan.desc}</p>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4 text-center mb-8 border border-orange-100/50">
                <div className="flex items-center justify-center gap-1">
                  <span className="text-3xl lg:text-4xl font-black text-orange-600">{plan.price}</span>
                  <span className="text-xl font-bold text-orange-600 underline decoration-2 underline-offset-4">đ</span>
                </div>
                <div className="text-sm text-slate-500 font-medium mt-1">{plan.period}</div>
              </div>

              <ul className="space-y-4 mb-8 flex-grow">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Zap className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <span className="text-slate-700"><span className="font-bold">{plan.zaloCount}</span> tài khoản Zalo</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <span className="text-slate-700">Thời hạn <span className="font-bold">{plan.duration}</span></span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-slate-700">Full tính năng</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-slate-700">Không giới hạn nhân viên</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <span className="text-slate-700">Không giới hạn quản lý</span>
                </li>
              </ul>

              <button 
                className={`w-full py-3.5 rounded-xl font-bold transition-all duration-300 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Đăng ký ngay
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
