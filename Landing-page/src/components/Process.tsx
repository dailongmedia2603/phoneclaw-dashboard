import { motion } from 'motion/react';

export default function Process() {
  const steps = [
    {
      num: "01",
      title: "Audit your social brand",
      desc: "We analyze your current digital presence in detail thoroughly today.",
      tags: ["Audit Report", "Data First"],
      img: "https://picsum.photos/seed/process1/600/400"
    },
    {
      num: "02",
      title: "Design your viral plan",
      desc: "Our team creates high-impact social hooks that convert effectively fast.",
      tags: ["Strategy", "Content Roadmap"],
      img: "https://picsum.photos/seed/process2/600/400"
    },
    {
      num: "03",
      title: "Launch your global campaign",
      desc: "We deploy content across all major platforms consistently daily.",
      tags: ["Live Deployment", "Presence"],
      img: "https://picsum.photos/seed/process3/600/400"
    },
    {
      num: "04",
      title: "Scale your business results",
      desc: "We optimize data for maximum measurable business growth efficiently.",
      tags: ["Scaling", "Analytics"],
      img: "https://picsum.photos/seed/process4/600/400"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Our Process</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            From initial audit to<br/>global brand success.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="relative rounded-3xl overflow-hidden h-80 group"
            >
              <img 
                src={step.img} 
                alt={step.title} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors"></div>
              
              <div className="absolute inset-0 p-8 flex flex-col justify-center items-center text-center">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white font-bold mb-4 border border-white/30">
                  {step.num}
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-200 text-sm max-w-sm mb-6">{step.desc}</p>
                
                <div className="flex flex-wrap justify-center gap-2">
                  {step.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
