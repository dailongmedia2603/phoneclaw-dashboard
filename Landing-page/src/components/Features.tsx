import { motion } from 'motion/react';
import { ArrowRight, BarChart3, TrendingUp, Users, Sparkles } from 'lucide-react';

export default function Features() {
  return (
    <section className="py-24 bg-gray-50">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-orange-600 mb-2 uppercase tracking-wider">Why Scrollix?</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            Why the fastest growing brands choose us.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Column 1 */}
          <div className="space-y-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-64 flex flex-col justify-between"
            >
              <div className="flex gap-4 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-yellow-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </div>
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Platform Mastery</h3>
                <p className="text-gray-500 text-sm">We lead across major social channels to keep your brand ahead daily.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-64 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <div className="bg-green-100 p-2 rounded-lg text-green-600"><TrendingUp className="w-4 h-4" /></div>
                  <span className="text-sm font-semibold">+85% Reach in 30 days</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><ArrowRight className="w-4 h-4" /></div>
                  <span className="text-sm font-semibold">2x Higher conversion</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                  <div className="bg-purple-100 p-2 rounded-lg text-purple-600"><Sparkles className="w-4 h-4" /></div>
                  <span className="text-sm font-semibold">10x Viral reach</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Fast Growth</h3>
                <p className="text-gray-500 text-sm">Achieve higher engagement, stronger reach, and measurable growth.</p>
              </div>
            </motion.div>
          </div>

          {/* Column 2 */}
          <div className="space-y-6">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-64 flex flex-col justify-between relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-bl-full -z-10"></div>
              <div className="flex justify-center mb-4">
                <div className="relative w-32 h-24 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden">
                  {/* Abstract illustration */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-12 bg-orange-200 rounded-lg shadow-sm"></div>
                    <div className="absolute bottom-2 right-2 w-8 h-8 bg-yellow-200 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Expert Squad</h3>
                <p className="text-gray-500 text-sm">A dedicated creative team aligned perfectly with your marketing goals.</p>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 h-64 flex flex-col justify-between"
            >
              <div className="h-24 flex items-end gap-2 mb-4">
                <div className="w-1/4 bg-orange-100 h-1/4 rounded-t-md"></div>
                <div className="w-1/4 bg-orange-200 h-2/4 rounded-t-md"></div>
                <div className="w-1/4 bg-orange-400 h-3/4 rounded-t-md"></div>
                <div className="w-1/4 bg-orange-600 h-full rounded-t-md relative">
                  <div className="absolute -top-3 -right-2 bg-green-500 w-3 h-3 rounded-full border-2 border-white"></div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Clear Analytics</h3>
                <p className="text-gray-500 text-sm">See real performance insights through clear and transparent reports.</p>
              </div>
            </motion.div>
          </div>

          {/* Column 3 */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gray-900 rounded-3xl relative overflow-hidden h-full min-h-[500px] md:min-h-0"
          >
            <img 
              src="https://picsum.photos/seed/agency/600/800" 
              alt="Expert team" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            
            <div className="absolute bottom-0 left-0 right-0 p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">Scale with our<br/>expert team</h3>
              <p className="text-gray-300 text-sm mb-6">Expert strategies designed to help your brand dominate social.</p>
              
              <div className="space-y-3">
                <button className="w-full bg-white text-gray-900 py-3 rounded-full font-semibold hover:bg-gray-100 transition-colors">
                  Get Started
                </button>
                <button className="w-full bg-white/10 backdrop-blur-sm text-white border border-white/20 py-3 rounded-full font-medium hover:bg-white/20 transition-colors">
                  View Case Studies
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
