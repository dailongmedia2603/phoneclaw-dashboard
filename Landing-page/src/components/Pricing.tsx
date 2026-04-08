import { motion } from 'motion/react';
import { Check, Star } from 'lucide-react';

export default function Pricing() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Pricing Plans</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            Flexible pricing plans<br/>for viral brand growth.
          </h2>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center md:items-stretch gap-6 max-w-4xl mx-auto">
          {/* Starter Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="w-full md:w-1/2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <Star className="w-5 h-5" /> Starter
              </div>
              <span className="bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full">Basic</span>
            </div>
            
            <div className="mb-8">
              <span className="text-5xl font-bold text-gray-900">$499</span>
              <span className="text-gray-500 font-medium">/month</span>
              <p className="text-gray-600 mt-2">Launch your viral brand journey.</p>
            </div>

            <ul className="space-y-6 mb-8 flex-1">
              <li className="flex gap-4">
                <div className="bg-gray-100 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-gray-600" /></div>
                <div>
                  <h4 className="font-bold text-gray-900">Social Brand Audit</h4>
                  <p className="text-sm text-gray-500">Find your growth gaps.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-gray-100 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-gray-600" /></div>
                <div>
                  <h4 className="font-bold text-gray-900">Content Forge</h4>
                  <p className="text-sm text-gray-500">Three viral posts every week.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-gray-100 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-gray-600" /></div>
                <div>
                  <h4 className="font-bold text-gray-900">Algorithm Hook Guide</h4>
                  <p className="text-sm text-gray-500">Master the basic feed triggers.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-gray-100 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-gray-600" /></div>
                <div>
                  <h4 className="font-bold text-gray-900">Growth Tracking</h4>
                  <p className="text-sm text-gray-500">Basic metric reports.</p>
                </div>
              </li>
            </ul>

            <button className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-full font-bold transition-colors">
              Get Started Now
            </button>
          </motion.div>

          {/* Professional Plan */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="w-full md:w-1/2 bg-orange-500 rounded-[2.5rem] p-8 shadow-xl flex flex-col text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
            
            <div className="relative z-10 flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 font-bold">
                <Star className="w-5 h-5" /> Professional
              </div>
              <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">Popular</span>
            </div>
            
            <div className="relative z-10 mb-8">
              <span className="text-5xl font-bold">$5K</span>
              <span className="text-orange-100 font-medium">/year</span>
              <p className="text-orange-100 mt-2">Dominate the global digital feed.</p>
            </div>

            <ul className="relative z-10 space-y-6 mb-8 flex-1">
              <li className="flex gap-4">
                <div className="bg-white/20 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-white" /></div>
                <div>
                  <h4 className="font-bold">Elite Viral Strategy</h4>
                  <p className="text-sm text-orange-100">Custom mass growth roadmap.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-white/20 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-white" /></div>
                <div>
                  <h4 className="font-bold">Infinite Production</h4>
                  <p className="text-sm text-orange-100">Infinite high-impact assets.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-white/20 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-white" /></div>
                <div>
                  <h4 className="font-bold">Revenue Scale Pro</h4>
                  <p className="text-sm text-orange-100">Convert your views into cash.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="bg-white/20 p-2 rounded-lg h-max"><Check className="w-5 h-5 text-white" /></div>
                <div>
                  <h4 className="font-bold">Priority Access</h4>
                  <p className="text-sm text-orange-100">Direct expert support.</p>
                </div>
              </li>
            </ul>

            <button className="relative z-10 w-full bg-white text-orange-600 hover:bg-gray-50 py-4 rounded-full font-bold transition-colors">
              Get Started Now
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
