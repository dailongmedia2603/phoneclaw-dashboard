import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

export default function FAQ() {
  const faqs = [
    {
      num: "01",
      question: "How does it work?",
      answer: "We start with a comprehensive audit of your current social presence, then develop a custom viral strategy. Once approved, our team handles everything from content creation to daily posting and community management."
    },
    {
      num: "02",
      question: "How fast will I see results?",
      answer: "While every brand is different, most of our clients see significant increases in reach and engagement within the first 30 days of implementing our viral strategies."
    },
    {
      num: "03",
      question: "Which platforms do you support?",
      answer: "We specialize in TikTok, Instagram Reels, YouTube Shorts, and Facebook. Our strategies are tailored to the unique algorithms of each platform."
    },
    {
      num: "04",
      question: "Do you offer custom pricing?",
      answer: "Yes, while we have standard packages, we can create custom proposals for enterprise clients with specific needs or multi-brand portfolios."
    },
    {
      num: "05",
      question: "What makes Scrollix different?",
      answer: "Unlike traditional agencies, we focus exclusively on viral, short-form content that drives measurable business results, not just vanity metrics."
    },
    {
      num: "06",
      question: "What results can I expect?",
      answer: "Our clients typically see a 3-5x increase in organic reach, higher engagement rates, and a measurable impact on their bottom line through targeted social campaigns."
    },
    {
      num: "07",
      question: "How often are reports sent?",
      answer: "We provide detailed performance reports on a monthly basis, along with bi-weekly strategy check-ins to ensure we're always optimizing for the best results."
    }
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 bg-white">
      <div className="w-full px-4 md:px-8 lg:px-12 max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wider">FAQ's</p>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            Clear answers for<br/>your brand growth.
          </h2>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="border-b border-gray-200 pb-4"
            >
              <button 
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full flex items-center justify-between py-4 text-left focus:outline-none group"
              >
                <div className="flex items-center gap-4">
                  <span className="text-gray-400 font-mono text-sm">{faq.num}/</span>
                  <span className={`text-lg font-medium transition-colors ${openIndex === idx ? 'text-orange-600' : 'text-gray-900 group-hover:text-orange-600'}`}>
                    {faq.question}
                  </span>
                </div>
                <div className="text-gray-400">
                  {openIndex === idx ? <Minus className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                </div>
              </button>
              
              <AnimatePresence>
                {openIndex === idx && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="text-gray-600 pl-10 pb-4 pr-4">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
