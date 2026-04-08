import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export default function Testimonials() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Testimonials</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            Stories of massive<br/>social media growth.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Main Testimonial */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between"
          >
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white rounded-full"></div>
                </div>
                <span className="font-bold text-xl">Logoipsum</span>
              </div>
              <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
                "Choosing Scrollix was our best decision; their strategic viral content reached millions worldwide and generated the highest return on investment we've ever seen."
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <img src="https://picsum.photos/seed/test1/100/100" className="w-12 h-12 rounded-full" />
              <div>
                <h4 className="font-bold text-gray-900">Sarah Jenkins</h4>
                <p className="text-sm text-gray-500">CEO at InnovateX</p>
              </div>
            </div>
          </motion.div>

          {/* Video Testimonial 1 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="relative rounded-[2.5rem] overflow-hidden h-full min-h-[300px] group"
          >
            <img src="https://picsum.photos/seed/testvid1/400/600" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/40 transition-colors">
                <Play className="w-5 h-5 text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-6 left-6">
              <div className="flex text-yellow-400 text-xs mb-1">★★★★★ 4.9/5</div>
              <h4 className="font-bold text-white">Elena Rodriguez</h4>
              <p className="text-xs text-gray-200">Marketing Director</p>
            </div>
          </motion.div>

          {/* Text Testimonial */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100"
          >
            <div className="flex text-yellow-400 text-sm mb-4">★★★★★ <span className="text-gray-500 ml-2">4.9/5</span></div>
            <p className="text-gray-700 font-medium mb-8">
              "Scrollix delivered high-performing campaigns that maximized our ROI and dominated our niche."
            </p>
            <div className="flex items-center gap-3">
              <img src="https://picsum.photos/seed/test2/100/100" className="w-10 h-10 rounded-full" />
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Turner</h4>
                <p className="text-xs text-gray-500">Director</p>
              </div>
            </div>
          </motion.div>

          {/* Video Testimonial 2 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 relative rounded-[2.5rem] overflow-hidden h-64 group"
          >
            <img src="https://picsum.photos/seed/testvid2/800/400" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/40 transition-colors">
                <Play className="w-5 h-5 text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-6 left-6">
              <h4 className="font-bold text-white">Mia Thompson</h4>
              <p className="text-xs text-gray-200">CEO at Propertiva</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
