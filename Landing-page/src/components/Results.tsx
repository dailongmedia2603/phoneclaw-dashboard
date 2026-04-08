import { motion } from 'motion/react';
import { Play } from 'lucide-react';

export default function Results() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Client Results</p>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
              Real time data<br/>driven brand results.
            </h2>
            <p className="text-gray-600 text-lg max-w-md">
              Achieve total market dominance with our unique framework built for rapid scaling & investment returns.
            </p>
            
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-4">
                <img src="https://picsum.photos/seed/user1/100/100" className="w-12 h-12 rounded-full border-2 border-white" />
                <img src="https://picsum.photos/seed/user2/100/100" className="w-12 h-12 rounded-full border-2 border-white" />
                <img src="https://picsum.photos/seed/user3/100/100" className="w-12 h-12 rounded-full border-2 border-white" />
                <div className="w-12 h-12 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">+1k</div>
              </div>
              <div>
                <div className="flex text-yellow-400 text-sm">★★★★★</div>
                <p className="text-sm text-gray-600 font-medium">4.9/5 rating</p>
                <p className="text-xs text-gray-500">Trusted by 1k+ businesses</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Card 1 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between h-64"
            >
              <div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">50M+</h3>
                <p className="text-gray-500 text-sm">Organic Reach</p>
              </div>
              <p className="text-gray-400 text-xs">We scaled their organic presence across all platforms.</p>
            </motion.div>

            {/* Card 2 (Image) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-orange-100 rounded-3xl overflow-hidden relative h-64"
            >
              <img src="https://picsum.photos/seed/result1/400/400" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
                <span className="text-red-500">â¥</span> 15K+
              </div>
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2">
                <Play className="w-4 h-4 text-gray-900" />
              </div>
            </motion.div>

            {/* Card 3 (Image) */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-orange-100 rounded-3xl overflow-hidden relative h-64"
            >
              <img src="https://picsum.photos/seed/result2/400/400" className="w-full h-full object-cover mix-blend-multiply opacity-80" />
              <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-sm rounded-full p-2">
                <Play className="w-4 h-4 text-gray-900" />
              </div>
            </motion.div>

            {/* Card 4 */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-orange-500 rounded-3xl p-6 shadow-sm flex flex-col justify-end h-64 text-white"
            >
              <h3 className="text-2xl font-bold mb-2">New leads</h3>
              <p className="text-orange-100 text-sm">Targeted social campaigns that drove massive user acquisition.</p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
