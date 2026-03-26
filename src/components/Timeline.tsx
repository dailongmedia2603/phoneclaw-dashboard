import { ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, PauseCircle, PlayCircle, XCircle, LayoutGrid } from 'lucide-react';

export default function Timeline() {
  const dates = [
    { day: 'Thu', date: '5' },
    { day: 'Thu', date: '6' },
    { day: 'Fri', date: '7' },
    { day: 'Sat', date: '8', isToday: true },
    { day: 'Sun', date: '9' },
    { day: 'Mon', date: '10' },
    { day: 'Tue', date: '11' },
    { day: 'Thu', date: '12' },
    { day: 'Fri', date: '14' },
  ];

  const apps = [
    {
      name: 'Shibaswap',
      icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=Shibaswap&backgroundColor=ffdfbf',
      orders: [
        { id: '#39635', type: 'Reviews', status: 'Done', progress: '120 / 120 (100%)', color: 'bg-[#22c55e]', start: 1, width: 2, row: 0 },
        { id: '#39635', type: 'Search terms', status: 'Paused', progress: '53 / 120 (84%)', color: 'bg-[#f59e0b]', start: 3, width: 1, row: 1 },
      ]
    },
    {
      name: 'AAVE',
      icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=AAVE&backgroundColor=c0aede',
      orders: [
        { id: '#39635', type: 'Search terms', status: 'Active', progress: '83 / 120 (84%)', color: 'bg-[#8b5cf6]', start: 2, width: 2, row: 0 },
      ]
    },
    {
      name: 'OpenOcean',
      icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=OpenOcean&backgroundColor=ffb3b3',
      orders: [
        { id: '#39635', type: 'Ratings', status: 'Ready', progress: '0 / 120 (0%)', color: 'bg-[#e0f2fe]', textColor: 'text-[#0284c7]', start: 5, width: 2, row: 0 },
      ]
    },
    {
      name: 'Pangolin',
      icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=Pangolin&backgroundColor=b3d4ff',
      orders: [
        { id: '#39635', type: 'Search terms', status: 'Canceled', progress: '83 / 120 (84%)', color: 'bg-[#94a3b8]', start: 2, width: 1, row: 0 },
      ]
    },
    {
      name: 'Bancor',
      icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=Bancor&backgroundColor=b3ffb3',
      orders: [
        { id: '#39635', type: 'Search terms', status: 'Active', progress: '83 / 120 (84%)', color: 'bg-[#8b5cf6]', start: 8, width: 1, row: 0 },
      ]
    },
    {
      name: 'Rarible',
      icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=Rarible&backgroundColor=e2e8f0',
      orders: [
        { id: '#39635', type: 'Search terms', status: 'Active', progress: '83 / 120 (84%)', color: 'bg-[#8b5cf6]', start: 4, width: 1, row: 0 },
      ]
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Timeline Header */}
      <div className="flex border-b border-slate-100 bg-white z-20">
        {/* Apps Column Header */}
        <div className="w-48 shrink-0 p-4 flex items-center gap-2 text-sm font-medium text-slate-500 border-r border-slate-100">
          <LayoutGrid className="w-4 h-4" />
          Apps
        </div>

        {/* Dates Header */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">March 2023</h3>
            <div className="flex items-center gap-4 relative">
              <button className="flex items-center gap-1 text-sm font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                Week <ChevronDown size={14} className="text-slate-400" />
              </button>
              
              {/* Dropdown Menu (Static for visual) */}
              <div className="absolute top-full right-24 mt-1 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 z-50">
                <button className="w-full text-left px-4 py-2 text-sm text-blue-600 bg-blue-50/50 font-medium">Week</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Month</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Quarter</button>
                <button className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Year</button>
              </div>

              <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronLeft size={16} /></button>
                Today
                <button className="p-1 hover:bg-slate-50 rounded"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
          <div className="flex">
            {dates.map((d, i) => (
              <div key={i} className={`flex-1 flex flex-col items-center justify-center py-2 border-r border-slate-100 ${d.isToday ? 'bg-blue-50/30' : ''}`}>
                <span className={`text-xs ${d.isToday ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>{d.day}</span>
                <span className={`text-sm ${d.isToday ? 'text-blue-600 font-bold' : 'text-slate-700 font-medium'}`}>{d.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Timeline Body */}
      <div className="flex-1 overflow-y-auto relative bg-white">
        {/* Today Line */}
        <div className="absolute top-0 bottom-0 left-[calc(12rem+44.44%)] w-px bg-blue-400 z-0"></div>

        {apps.map((app, index) => (
          <div key={index} className="flex border-b border-slate-100 relative z-10 hover:bg-slate-50/50 transition-colors">
            {/* App Info */}
            <div className="w-48 shrink-0 p-4 flex items-center gap-3 border-r border-slate-100 bg-white z-20">
              <img src={app.icon} alt={app.name} className="w-6 h-6 rounded-md" />
              <span className="text-sm font-medium text-slate-700">{app.name}</span>
            </div>

            {/* Grid & Bars */}
            <div className="flex-1 relative min-h-[80px] py-4">
              {/* Background Grid */}
              <div className="absolute inset-0 flex">
                {dates.map((_, i) => (
                  <div key={i} className="flex-1 border-r border-slate-100/50"></div>
                ))}
              </div>

              {/* Order Bars */}
              {app.orders.map((order, oIndex) => (
                <div
                  key={oIndex}
                  className="absolute h-8 flex items-center text-xs font-medium z-30"
                  style={{
                    left: `calc(${(order.start / dates.length) * 100}%)`,
                    width: `calc(${(order.width / dates.length) * 100}%)`,
                    top: `${16 + order.row * 44}px`,
                  }}
                >
                  {/* Label tag */}
                  <div className="absolute -left-[100px] w-[90px] bg-blue-50/50 rounded-lg px-2 py-1 flex flex-col items-start justify-center h-full">
                    <span className="text-blue-600 font-bold leading-tight">{order.id}</span>
                    <span className="text-slate-500 text-[10px] leading-tight">{order.type}</span>
                  </div>

                  {/* Main Bar */}
                  <div className={`w-full h-full rounded-lg flex items-center px-3 ${order.color} ${order.textColor || 'text-white'} shadow-sm`}>
                    <span className="truncate w-full text-center">{order.progress}</span>
                  </div>

                  {/* Status Badge */}
                  <div className={`absolute -right-[110px] flex items-center gap-1.5 bg-white rounded-lg px-2.5 py-1.5 shadow-sm border border-slate-100 ${
                    order.status === 'Done' ? 'text-emerald-500 bg-emerald-50/50' :
                    order.status === 'Paused' ? 'text-amber-600 bg-amber-50/50' :
                    order.status === 'Active' ? 'text-purple-600 bg-purple-50/50' :
                    order.status === 'Ready' ? 'text-blue-600 bg-blue-50/50' :
                    'text-slate-500 bg-slate-50'
                  }`}>
                    {order.status === 'Done' && <CheckCircle2 size={14} />}
                    {order.status === 'Paused' && <PauseCircle size={14} />}
                    {order.status === 'Active' && <PlayCircle size={14} />}
                    {order.status === 'Ready' && <PlayCircle size={14} />}
                    {order.status === 'Canceled' && <XCircle size={14} />}
                    <span className="font-medium">{order.status}</span>
                    {['Paused', 'Active', 'Ready'].includes(order.status) && <ChevronDown size={14} className="opacity-50 ml-1" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
