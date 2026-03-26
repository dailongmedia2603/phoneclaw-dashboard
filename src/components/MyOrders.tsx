import { Search, Bookmark, Filter, LayoutGrid, List, ChevronDown, ChevronLeft, ChevronRight, Apple, Play } from 'lucide-react';
import Timeline from './Timeline';

export default function MyOrders() {
  const tabs = ['All', 'Active', 'Done', 'Canceled'];

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header Section */}
      <div className="px-6 pt-6 pb-4 border-b border-slate-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">My Orders</h1>
        
        {/* Tabs */}
        <div className="flex gap-8 border-b border-slate-200">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`pb-3 text-sm font-medium relative ${
                index === 0 ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
              {index === 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search order"
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Bookmark size={16} className="text-slate-400" />
            Favorites
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Platform Filter */}
          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200">
            <button className="px-3 py-1 text-sm font-medium text-slate-700 bg-white rounded-lg shadow-sm">All</button>
            <button className="px-3 py-1 text-slate-400 hover:text-slate-600"><Apple size={16} /></button>
            <button className="px-3 py-1 text-slate-400 hover:text-slate-600"><Play size={16} /></button>
          </div>

          {/* Country Filter */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
            All Countries
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* Filters */}
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Filter size={16} className="text-slate-400" />
            Filters
            <ChevronDown size={16} className="text-slate-400" />
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-200 ml-2">
            <button className="p-1.5 text-slate-400 hover:text-slate-600"><LayoutGrid size={16} /></button>
            <button className="p-1.5 text-slate-700 bg-white rounded-lg shadow-sm"><List size={16} /></button>
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-hidden">
        <Timeline />
      </div>
    </div>
  );
}
