import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Devices from './components/Devices';
import Scripts from './components/Scripts';
import Schedules from './components/Schedules';
import Logs from './components/Logs';
import Settings from './components/Settings';
import VideoLibrary from './components/VideoLibrary';
import ProxyManager from './components/ProxyManager';
import SharedScripts from './components/SharedScripts';
import UserManagement from './components/UserManagement';
import Login from './components/Login';
import ToastContainer from './components/Toast';
import ScriptEditorPage from './components/ScriptEditor/ScriptEditorPage';
import { useAuth } from './hooks/useAuth';
import { Loader2 } from 'lucide-react';

function Layout({ onLogout, userName, userRole }: { onLogout: () => void; userName: string; userRole: string }) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <Sidebar onLogout={onLogout} userName={userName} userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/thiet-bi" element={<Devices />} />
            <Route path="/proxy" element={<ProxyManager />} />
            <Route path="/kich-ban" element={<Scripts />} />
            <Route path="/kho-kich-ban" element={<SharedScripts />} />
            <Route path="/lich-trinh" element={<Schedules />} />
            <Route path="/nhat-ky" element={<Logs />} />
            <Route path="/thu-vien-video" element={<VideoLibrary />} />
            <Route path="/nguoi-dung" element={<UserManagement />} />
            <Route path="/cai-dat" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={login} />;
  }

  return (
    <Routes>
      {/* Script editor: full-screen, no sidebar */}
      <Route path="/kich-ban/tao-moi" element={<><ScriptEditorPage /><ToastContainer /></>} />
      <Route path="/kich-ban/:scriptId" element={<><ScriptEditorPage /><ToastContainer /></>} />
      {/* Shared script editor */}
      <Route path="/kho-kich-ban/tao-moi" element={<><ScriptEditorPage apiType="shared" /><ToastContainer /></>} />
      <Route path="/kho-kich-ban/:scriptId" element={<><ScriptEditorPage apiType="shared" /><ToastContainer /></>} />
      {/* All other pages: sidebar layout */}
      <Route path="/*" element={<Layout onLogout={logout} userName={user.name} userRole={user.role} />} />
    </Routes>
  );
}
