import { useState } from 'react';
import { LayoutDashboard, Cpu, Sliders, Wand2, CalendarDays, Camera, Settings, Plus, Zap, HelpCircle, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard' },
    { icon: Cpu, label: 'Thiết bị' },
    { icon: Sliders, label: 'Điều khiển' },
    { icon: Wand2, label: 'Kịch bản' },
    { icon: CalendarDays, label: 'Lịch trình' },
    { icon: Camera, label: 'Ảnh chụp & Nhật ký' },
    { icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col relative h-full shrink-0 transition-all duration-300`}>
      {/* Logo */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-6'}`}>
        <div className="text-xl font-bold tracking-tight flex items-center gap-1">
          <span className="text-blue-600">PRO</span>
          {!isCollapsed && <span className="text-slate-800">MOBILE</span>}
        </div>
      </div>

      {/* Collapse Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white border border-slate-200 rounded-full p-1 text-slate-400 hover:text-slate-600 shadow-sm z-10"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.label;
          return (
            <button
              key={index}
              onClick={() => setActiveTab(item.label)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 space-y-4">
        {/* Advanced Mode Card */}
        {!isCollapsed && (
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="text-sm font-semibold text-slate-800">Advanced mode</h4>
            <p className="text-xs text-slate-500 mt-1 mb-3">Coming soon</p>
            <div className="flex items-center justify-between">
              <a href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                Join Waitlist &rarr;
              </a>
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-500">
                <Zap size={16} fill="currentColor" />
              </div>
            </div>
          </div>
        )}

        {/* Help */}
        <a href="#" title={isCollapsed ? "Help" : undefined} className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2 text-sm font-medium text-slate-500 hover:text-slate-900`}>
          <HelpCircle size={20} className="text-slate-400" />
          {!isCollapsed && <span>Help</span>}
        </a>
      </div>
    </aside>
  );
}
