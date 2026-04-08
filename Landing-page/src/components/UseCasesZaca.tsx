import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Megaphone, GraduationCap, Building2, Sparkles, 
  ShoppingCart, Home, LineChart, Plane, Users, 
  Dumbbell, Store, AlertCircle, Lightbulb, 
  ShieldCheck, TrendingUp, Briefcase 
} from 'lucide-react';

const industries = [
  {
    name: "Agency (Truyền thông/Quảng cáo)",
    icon: Megaphone,
    problem: "Hàng nghìn khách hàng cũ đã từng hỏi giá nhưng không chốt, nằm \"đắp chiếu\" trong danh sách bạn bè Zalo vì nhân viên không đủ thời gian bám đuổi.",
    solution: "ZACA AI CSKH tự động quét lại toàn bộ lịch sử chat, gửi tin nhắn chăm sóc theo kịch bản cá nhân hóa để hâm nóng mối quan hệ.",
    notLose: "Bạn không bỏ lỡ bất kỳ đồng doanh thu nào từ những khách hàng cũ đã tốn tiền quảng cáo mới có được.",
    gain: "Có một \"cỗ máy in tiền\" từ chính tệp khách hàng tưởng chừng đã mất."
  },
  {
    name: "E-Learning (Đào tạo trực tuyến)",
    icon: GraduationCap,
    problem: "Thầy cô bị quá tải bởi hàng trăm câu hỏi giống hệt nhau mỗi ngày về bài giảng, tài liệu, cách đăng nhập...",
    solution: "Tích hợp NotebookLM với toàn bộ giáo trình. AI của ZACA sẽ trực tiếp trả lời học viên trên Zalo cá nhân của Thầy/Cô với độ chính xác 100% như một trợ lý chuyên nghiệp.",
    notLose: "Thầy cô không còn phải trực Zalo 24/7 hay thuê đội ngũ support đông đảo.",
    gain: "Có thêm 60% thời gian để tập trung vào việc nghiên cứu và nâng cao chất lượng bài giảng."
  },
  {
    name: "Doanh nghiệp (Đào tạo & Vận hành)",
    icon: Building2,
    problem: "Nhân viên mới liên tục hỏi quy trình thủ tục, nhân sự cũ thì quên quy định, làm gián đoạn công việc của các cấp quản lý.",
    solution: "Upload toàn bộ quy định, văn hóa doanh nghiệp lên NotebookLM. ZACA biến Zalo quản lý thành một \"Từ điển bách khoa nội bộ\" trả lời nhân viên ngay lập tức.",
    notLose: "Không còn sự sai lệch thông tin hoặc mất thời gian đào tạo đi đào tạo lại những thứ căn bản.",
    gain: "Một hệ thống vận hành tự động, giải phóng lãnh đạo khỏi những \"việc vặt vãnh\" để tập trung vào chiến lược."
  },
  {
    name: "Spa / Thẩm mỹ viện / Nha khoa",
    icon: Sparkles,
    problem: "Khách hàng đặt lịch rồi quên, hoặc hỏi đi hỏi lại về quy trình hậu phẫu, kiêng khem sau dịch vụ.",
    solution: "AI tự động lên lịch nhắc hẹn định kỳ và trả lời các thắc mắc chuyên môn dựa trên data quy chuẩn của cơ sở đã nạp vào NotebookLM.",
    notLose: "Không còn tình trạng trống lịch do khách quên hẹn hoặc mất khách vì tư vấn chậm trễ.",
    gain: "Xây dựng được vị thế chuyên gia trong lòng khách hàng nhờ sự chăm sóc tận tâm và chính xác."
  },
  {
    name: "E-commerce (Sản phẩm giá trị cao)",
    icon: ShoppingCart,
    problem: "Khách hỏi mua đồ nội thất, máy móc... cần suy nghĩ 3-7 ngày mới chốt, nhưng nhân viên thường quên \"remind\" sau ngày thứ 2.",
    solution: "Cơ chế tự động kiểm tra khách chưa có lịch hẹn để tự lên kịch bản bám đuổi (follow-up) đến khi ra đơn.",
    notLose: "Không để đối thủ cướp mất khách chỉ vì bạn chậm trễ trong khâu bám đuổi.",
    gain: "Tăng tỷ lệ chuyển đổi đơn hàng lên gấp 2-3 lần trên cùng một lượng traffic."
  },
  {
    name: "Bất động sản (Dự án & Môi giới)",
    icon: Home,
    problem: "Một dự án có hàng trăm trang tài liệu pháp lý, bảng giá, tiến độ... môi giới rất dễ nhớ nhầm thông tin khi tư vấn cho khách.",
    solution: "Nạp toàn bộ file PDF dự án vào NotebookLM. ZACA AI sẽ trả lời chuẩn xác từng con số, diện tích, vị trí căn cho khách trên Zalo.",
    notLose: "Không mất uy tín vì cung cấp thông tin sai lệch hay ảo giác AI.",
    gain: "Trở thành \"Môi giới đáng tin cậy nhất\" mà khách hàng luôn ưu tiên lựa chọn."
  },
  {
    name: "Tài chính / Bảo hiểm / Chứng khoán",
    icon: LineChart,
    problem: "Thị trường biến động liên tục, khách hàng hỏi về các chỉ số, lãi suất, điều khoản hợp đồng phức tạp vào bất cứ lúc nào.",
    solution: "AI học dữ liệu thị trường và điều khoản sản phẩm để tư vấn 24/7. Tự động nhắc lịch khách hàng đóng phí hoặc tái tục hợp đồng.",
    notLose: "Không bỏ lỡ \"thời điểm vàng\" để chốt hợp đồng hoặc gia hạn dịch vụ.",
    gain: "Một hệ thống chăm sóc khách hàng bền vững, gia tăng LTV (giá trị trọn đời của khách hàng)."
  },
  {
    name: "Dịch vụ Du lịch / Visa / Tour",
    icon: Plane,
    problem: "Khách hàng luôn hỏi về thủ tục giấy tờ, lịch trình chi tiết... đòi hỏi sự phản hồi nhanh để chốt tour.",
    solution: "ZACA trả lời chính xác mọi câu hỏi về thủ tục visa và lịch trình dựa trên tài liệu chuẩn. Tự động gửi thông tin nhắc nhở khách chuẩn bị hành lý trước chuyến đi.",
    notLose: "Không mất khách vào tay các sàn du lịch trực tuyến nhờ tốc độ phản hồi \"ngay lập tức\" trên Zalo cá nhân.",
    gain: "Quy trình phục vụ khách hàng chuẩn 5 sao mà không tốn thêm nhân sự."
  },
  {
    name: "Tuyển dụng / Headhunter",
    icon: Users,
    problem: "Ứng viên hỏi những câu trùng lặp về lương, chế độ, địa điểm phỏng vấn làm mất thời gian của chuyên viên tuyển dụng.",
    solution: "AI tự động sàng lọc ứng viên qua các câu hỏi cơ bản trên Zalo và cung cấp thông tin về công ty từ NotebookLM.",
    notLose: "Không tốn thời gian cho những ứng viên không phù hợp.",
    gain: "Tập trung được vào các ứng viên tiềm năng (Power 4%) để nâng cao chất lượng tuyển dụng."
  },
  {
    name: "Phòng tập Gym / Yoga / Fitness",
    icon: Dumbbell,
    problem: "Hội viên nghỉ tập giữa chừng, quên lịch tập với PT, hoặc hỏi về chế độ dinh dưỡng.",
    solution: "AI tự động nhắc lịch tập, gửi kiến thức dinh dưỡng chuẩn từ NotebookLM cho từng hội viên trên Zalo.",
    notLose: "Không mất đi nguồn thu từ việc tái tục thẻ tập.",
    gain: "Một cộng đồng hội viên trung thành nhờ cảm giác được quan tâm cá nhân hóa."
  },
  {
    name: "Bán lẻ đa chi nhánh (Proxy)",
    icon: Store,
    problem: "Dùng nhiều máy tính/điện thoại để đăng nhập Zalo từng cửa hàng rất dễ bị khóa tài khoản vì spam hoặc đăng nhập bất thường.",
    solution: "ZACA sử dụng hệ thống Proxy tối ưu giúp quản lý hàng chục tài khoản Zalo tập trung trên một màn hình mà vẫn đảm bảo an toàn tuyệt đối cho tài khoản.",
    notLose: "Không lo bị \"die\" tài khoản Zalo - tài sản quý giá nhất của cửa hàng.",
    gain: "Một trung tâm điều hành bán hàng đa điểm mượt mà và an toàn."
  }
];

export default function UseCasesZaca() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 text-orange-700 font-bold text-sm mb-6 uppercase tracking-wider"
          >
            <Briefcase className="w-4 h-4" />
            Giải pháp chuyên biệt
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-6"
          >
            Ứng dụng thực tế trong <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-500">Đa Ngành</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 max-w-2xl mx-auto"
          >
            Dù bạn kinh doanh trong lĩnh vực nào, ZACA đều có kịch bản và giải pháp tối ưu hóa lợi nhuận dành riêng cho bạn.
          </motion.p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left: Tab Navigation */}
          <div className="w-full lg:w-[35%] flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 snap-x hide-scrollbar">
            {industries.map((ind, idx) => {
              const Icon = ind.icon;
              const isActive = activeTab === idx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-2xl text-left transition-all duration-300 snap-start whitespace-nowrap lg:whitespace-normal flex-shrink-0 lg:flex-shrink ${
                    isActive 
                      ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg shadow-orange-500/20 scale-[1.02]' 
                      : 'bg-slate-50 text-slate-600 hover:bg-orange-50 hover:text-orange-600 border border-slate-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-700'}`} />
                  </div>
                  <span className="font-bold text-sm md:text-base">{ind.name}</span>
                </button>
              );
            })}
          </div>

          {/* Right: Tab Content */}
          <div className="w-full lg:w-[65%]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-50 rounded-[2rem] p-6 md:p-10 border border-slate-100 h-full"
              >
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-200">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                    {(() => {
                      const ActiveIcon = industries[activeTab].icon;
                      return <ActiveIcon className="w-8 h-8 text-white" />;
                    })()}
                  </div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-900">
                    {industries[activeTab].name}
                  </h3>
                </div>

                <div className="flex flex-col gap-6">
                  {/* Problem - Full width */}
                  <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-red-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-red-400"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Vấn đề</h4>
                    </div>
                    <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                      {industries[activeTab].problem}
                    </p>
                  </div>

                  {/* Solution - Full width, highlighted */}
                  <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/80 rounded-2xl p-6 md:p-8 shadow-sm border border-blue-200 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-blue-600" />
                      </div>
                      <h4 className="text-xl font-bold text-slate-900">Giải pháp ZACA</h4>
                    </div>
                    <p className="text-slate-800 text-base md:text-lg leading-relaxed font-medium">
                      {industries[activeTab].solution}
                    </p>
                  </div>

                  {/* Bottom Grid for the other two */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Not Lose */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-orange-100">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="w-5 h-5 text-orange-500" />
                        <h4 className="font-bold text-slate-900">Không làm mất</h4>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {industries[activeTab].notLose}
                      </p>
                    </div>

                    {/* Gain */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-emerald-100">
                      <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                        <h4 className="font-bold text-slate-900">Làm gì có gì</h4>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed">
                        {industries[activeTab].gain}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
