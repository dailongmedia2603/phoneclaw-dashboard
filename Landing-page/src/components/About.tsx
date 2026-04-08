import { motion } from 'motion/react';

export default function About() {
  return (
    <section className="py-24 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative rounded-[2.5rem] overflow-hidden h-[600px] flex items-center justify-center text-center"
        >
          {/* Background Image/Video Placeholder */}
          <div className="absolute inset-0 bg-gray-900">
            <img 
              src="https://picsum.photos/seed/about/1920/1080" 
              alt="About Us Background" 
              className="w-full h-full object-cover opacity-50 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/80"></div>
          </div>

          <div className="relative z-10 max-w-3xl px-6">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white text-sm font-medium mb-6">
              About Us
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-8">
              Our agency transforms ambitious digital brands into viral sensations through expert "Cỗ máy chốt đơn" khiến khách hàng quyết định mua NGAY LẬP TỨC
            </h2>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="bg-white text-gray-900 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                View Case Studies
              </button>
              <button className="bg-transparent border border-white/30 text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-colors">
                Contact us
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
