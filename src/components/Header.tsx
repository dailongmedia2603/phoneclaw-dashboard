import { Clock, Sun, Moon, Bell, Plus } from 'lucide-react';

export default function Header() {
  return (
    <header className="h-20 px-8 flex items-center justify-between bg-[#F8FAFC]">
      <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
        <Clock size={16} />
        <span>13:34 PM UTC+3</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
            <span className="text-sm font-semibold text-slate-700">Starter</span>
          </div>
          <span className="text-sm font-bold text-slate-900">$13,650.25</span>
          <button className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-colors">
            <Plus size={14} />
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-slate-200 shadow-sm">
          <button className="p-1.5 rounded-full text-slate-400 hover:text-slate-600">
            <Sun size={16} />
          </button>
          <button className="p-1.5 rounded-full text-slate-400 hover:text-slate-600">
            <Moon size={16} />
          </button>
        </div>

        <button className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-400 hover:text-slate-600 relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
        </button>

        <button className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 shadow-sm">
          <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User avatar" className="w-full h-full object-cover bg-blue-50" />
        </button>
      </div>
    </header>
  );
}
