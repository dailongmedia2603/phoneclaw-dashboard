import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Cpu, Wand2, CalendarDays, ScrollText, Settings, ChevronLeft, ChevronRight, LogOut, User } from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
  userName?: string;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
  { icon: Cpu, label: 'Thiết bị', to: '/thiet-bi' },
  { icon: Wand2, label: 'Kịch bản', to: '/kich-ban' },
  { icon: CalendarDays, label: 'Lịch trình', to: '/lich-trinh' },
  { icon: ScrollText, label: 'Nhật ký', to: '/nhat-ky' },
  { icon: Settings, label: 'Cài đặt', to: '/cai-dat' },
];

export default function Sidebar({ onLogout, userName }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-slate-200 flex flex-col relative h-full shrink-0 transition-all duration-300`}>
      {/* Logo */}
      <div className={`h-20 flex items-center ${isCollapsed ? 'justify-center' : 'px-4'}`}>
        {isCollapsed ? (
          <img src="/favico.png" alt="Phone Agent" className="w-10 h-10 object-contain" />
        ) : (
          <img src="/logo.png" alt="Phone Agent" className="h-12 object-contain" />
        )}
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
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative group w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  {!isCollapsed && <span>{item.label}</span>}
                  {isCollapsed && (
                    <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 shadow-lg pointer-events-none">
                      {item.label}
                      <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                    </div>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="p-4 space-y-3">
        {userName && (
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-3'} py-2`}>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{userName}</p>
              </div>
            )}
          </div>
        )}

        {onLogout && (
          <button
            onClick={onLogout}
            title={isCollapsed ? "Đăng xuất" : undefined}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors`}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>Đăng xuất</span>}
          </button>
        )}
      </div>
    </aside>
  );
}
