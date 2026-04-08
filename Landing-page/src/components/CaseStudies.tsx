import { motion } from 'motion/react';

export default function CaseStudies() {
  const cases = [
    {
      id: "01",
      title: "Velocity",
      tag: "Advertising",
      img: "https://picsum.photos/seed/case1/800/600",
      stats: { reach: "400%", views: "15M+", likes: "25M+" }
    },
    {
      id: "02",
      title: "Nova",
      tag: "Branding",
      img: "https://picsum.photos/seed/case2/800/600",
      stats: { reach: "192%", views: "10M+", likes: "25M+" }
    },
    {
      id: "03",
      title: "Pulse",
      tag: "Content",
      img: "https://picsum.photos/seed/case3/800/600",
      stats: { reach: "120%", views: "50K", likes: "35M+" }
    },
    {
      id: "04",
      title: "Zenith",
      tag: "Advertising",
      img: "https://picsum.photos/seed/case4/800/600",
      stats: { reach: "312%", views: "20K+", likes: "18M+" }
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Case Studies</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            Campaign results that<br/>speak for themselves
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {cases.map((item, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="relative rounded-[2.5rem] overflow-hidden h-[400px] group cursor-pointer"
            >
              <img 
                src={item.img} 
                alt={item.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80"></div>
              
              {/* Top Stats */}
              <div className="absolute top-6 right-6 flex gap-2">
                <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <span className="text-green-400">â</span> {item.stats.reach}
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <span className="text-orange-400">â¶</span> {item.stats.views}
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
                  <span className="text-red-400">â¥</span> {item.stats.likes}
                </div>
              </div>

              {/* Bottom Info */}
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-1">{item.id}. {item.title}</h3>
                </div>
                <div className="bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 text-xs font-medium text-white uppercase tracking-wider">
                  â¢ {item.tag}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
