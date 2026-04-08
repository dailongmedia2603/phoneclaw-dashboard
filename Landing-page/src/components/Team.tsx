import { motion } from 'motion/react';
import { Instagram } from 'lucide-react';

export default function Team() {
  const team = [
    {
      name: "Harley Rose",
      role: "Viral Lead",
      desc: "Turning brand concepts into massive viral trends.",
      img: "https://picsum.photos/seed/team1/400/500"
    },
    {
      name: "Emma Watson",
      role: "Growth Hacker",
      desc: "Designing high-conversion visuals for top-tier brands.",
      img: "https://picsum.photos/seed/team2/400/500"
    },
    {
      name: "Sienna Hart",
      role: "Creative Lead",
      desc: "Leading bold creative concepts for standout brand campaigns.",
      img: "https://picsum.photos/seed/team3/400/500"
    },
    {
      name: "Jack Smith",
      role: "Strategy Director",
      desc: "Scaling organic reach through advanced digital strategies.",
      img: "https://picsum.photos/seed/team4/400/500"
    },
    {
      name: "Oliver Jones",
      role: "Paid Ads Specialist",
      desc: "Optimizing ad spend for maximum brand visibility.",
      img: "https://picsum.photos/seed/team5/400/500"
    },
    {
      name: "Mia Thompson",
      role: "Content Creator",
      desc: "Crafting compelling hooks that stop the scroll.",
      img: "https://picsum.photos/seed/team6/400/500"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">Our Team</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 max-w-2xl mx-auto leading-tight">
            Meet the experts<br/>behind your growth.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {team.map((member, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -5 }}
              className="relative rounded-[2rem] overflow-hidden aspect-[4/5] group"
            >
              <img 
                src={member.img} 
                alt={member.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/40 opacity-80"></div>
              
              <div className="absolute top-6 left-0 right-0 text-center">
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-gray-300 text-sm">{member.role}</p>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <p className="text-gray-200 text-sm max-w-[150px] leading-snug">{member.desc}</p>
                <button className="bg-white/20 backdrop-blur-md hover:bg-white/30 text-white px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors">
                  <Instagram className="w-3 h-3" /> Instagram
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
