import { motion } from 'motion/react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function CredibilityZaca() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#f97316] to-[#c2410c]">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-orange-400/30 rounded-full mix-blend-screen filter blur-[100px] opacity-50 animate-blob pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-400/30 rounded-full mix-blend-screen filter blur-[80px] opacity-50 animate-blob animation-delay-2000 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative z-10 max-w-6xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-sm mb-10 shadow-lg">
            <Sparkles className="w-4 h-4 text-yellow-300" />
            Đơn vị tiên phong công nghệ
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-medium text-white leading-[1.4] mb-14">
            "ZACA tự hào là đơn vị tiên phong tích hợp công nghệ <span className="font-bold text-yellow-300">NotebookLM từ Google</span><br className="hidden lg:block" /> giúp AI học và phản hồi <span className="font-bold text-orange-200">chuẩn xác 100%</span> theo data thực của doanh nghiệp."
          </h2>

          {/* Tech Logos / Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                <span className="text-blue-600 font-black text-xl">G</span>
              </div>
              <span className="font-bold text-white text-xl tracking-tight">NotebookLM</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shadow-sm border-2 border-white">
                <span className="text-white font-black text-sm">Zalo</span>
              </div>
              <span className="font-bold text-white text-xl tracking-tight">Integration</span>
            </div>

            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-8 py-4 rounded-2xl shadow-lg border border-white/20 hover:bg-white/20 transition-colors">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span className="font-bold text-white text-xl tracking-tight">100% Data Security</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
