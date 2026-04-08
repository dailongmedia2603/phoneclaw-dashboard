export default function Logos() {
  const logos = [
    <div key="1" className="text-2xl font-bold font-serif whitespace-nowrap">OSLO.</div>,
    <div key="2" className="text-2xl font-bold italic whitespace-nowrap">Thea</div>,
    <div key="3" className="text-2xl font-bold tracking-tighter whitespace-nowrap">Berlin.</div>,
    <div key="4" className="text-xl font-bold flex items-center gap-1 whitespace-nowrap">
      <span className="w-4 h-4 rounded-full bg-black"></span> U-Turn
    </div>,
    <div key="5" className="text-2xl font-bold tracking-tighter whitespace-nowrap">Berlin.</div>,
    <div key="6" className="flex gap-1 whitespace-nowrap">
      <div className="w-2 h-6 bg-black"></div>
      <div className="w-2 h-4 bg-black mt-2"></div>
      <div className="w-2 h-8 bg-black -mt-2"></div>
    </div>,
    <div key="7" className="text-2xl font-bold font-mono whitespace-nowrap">NEXUS</div>,
    <div key="8" className="text-2xl font-bold tracking-widest whitespace-nowrap">AURA</div>,
    <div key="9" className="text-2xl font-bold italic whitespace-nowrap">Vortex</div>,
    <div key="10" className="text-2xl font-bold tracking-tighter whitespace-nowrap">Zenith</div>,
  ];

  return (
    <section className="py-12 bg-white border-b border-gray-100">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="relative flex overflow-hidden w-full opacity-60 grayscale">
          <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
            <div className="flex items-center gap-16 px-8">
              {logos}
            </div>
            <div className="flex items-center gap-16 px-8">
              {logos}
            </div>
            <div className="flex items-center gap-16 px-8">
              {logos}
            </div>
            <div className="flex items-center gap-16 px-8">
              {logos}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
