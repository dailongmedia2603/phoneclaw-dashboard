import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Devices from './components/Devices';
import Control from './components/Control';
import Scripts from './components/Scripts';
import Schedules from './components/Schedules';
import Logs from './components/Logs';
import Settings from './components/Settings';
import Login from './components/Login';
import ToastContainer from './components/Toast';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const { user, loading, login, logout } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Not logged in → show login page
  if (!user) {
    return <Login onLogin={login} />;
  }

  // Logged in → show dashboard
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={logout} userName={user.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden p-6">
          {activeTab === 'Dashboard' && <Dashboard />}
          {activeTab === 'Thiết bị' && <Devices />}
          {activeTab === 'Điều khiển' && <Control />}
          {activeTab === 'Kịch bản' && <Scripts />}
          {activeTab === 'Lịch trình' && <Schedules />}
          {activeTab === 'Ảnh chụp & Nhật ký' && <Logs />}
          {activeTab === 'Cài đặt' && <Settings />}
          {activeTab !== 'Dashboard' && activeTab !== 'Thiết bị' && activeTab !== 'Điều khiển' && activeTab !== 'Kịch bản' && activeTab !== 'Lịch trình' && activeTab !== 'Ảnh chụp & Nhật ký' && activeTab !== 'Cài đặt' && (
            <div className="h-full flex items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-700 mb-2">{activeTab}</h2>
                <p className="text-slate-500">Tính năng đang được phát triển</p>
              </div>
            </div>
          )}
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
