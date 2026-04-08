import { motion } from 'motion/react';
import { BrainCircuit, CalendarClock, MonitorSmartphone } from 'lucide-react';

export default function IntrigueBullets() {
  const bullets = [
    {
      icon: <BrainCircuit className="w-6 h-6 text-rose-500" />,
      title: "Chính xác tuyệt đối",
      description: "Làm thế nào để AI của bạn trả lời đúng 100% dữ liệu thực (FAQ, bảng giá) mà không lo bị 'ảo giác' hay tự bịa thông tin?",
      bgColor: "bg-rose-50"
    },
    {
      icon: <CalendarClock className="w-6 h-6 text-orange-500" />,
      title: "Chăm sóc tự động",
      description: "Cách hệ thống tự động kiểm tra và lên lịch chăm sóc cho những khách hàng 'lỡ hẹn' mà không cần con người can thiệp.",
      bgColor: "bg-orange-50"
    },
    {
      icon: <MonitorSmartphone className="w-6 h-6 text-orange-500" />,
      title: "Quản lý tập trung",
      description: "Bí quyết quản lý hàng chục tài khoản Zalo cá nhân và phân quyền nhân viên chỉ trên một màn hình duy nhất.",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
            Những bí mật về <span className="text-orange-600">tự động hóa Zalo</span> bạn sắp khám phá
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {bullets.map((bullet, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              <div className={`w-14 h-14 rounded-2xl ${bullet.bgColor} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                {bullet.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
                {bullet.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {bullet.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
