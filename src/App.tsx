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
import LandingPage from './components/LandingPage';
import RequireAuth from './components/RequireAuth';
import ToastContainer from './components/Toast';
import ScriptEditorPage from './components/ScriptEditor/ScriptEditorPage';
import { useAuth } from './hooks/useAuth';

function Layout() {
  const { logout, user } = useAuth();

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-800 overflow-hidden">
      <Sidebar onLogout={logout} userName={user!.name} userRole={user!.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-hidden p-6">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/thiet-bi" element={<Devices />} />
            <Route path="/proxy" element={<ProxyManager />} />
            <Route path="/kich-ban" element={<Scripts />} />
            <Route path="/kho-kich-ban" element={<SharedScripts userRole={user!.role} />} />
            <Route path="/lich-trinh" element={<Schedules />} />
            <Route path="/nhat-ky" element={<Logs />} />
            <Route path="/thu-vien-video" element={<VideoLibrary />} />
            <Route path="/nguoi-dung" element={<UserManagement />} />
            <Route path="/cai-dat" element={<Settings />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Authenticated fullscreen routes (no sidebar) */}
      <Route path="/kich-ban/tao-moi" element={<RequireAuth><ScriptEditorPage /><ToastContainer /></RequireAuth>} />
      <Route path="/kich-ban/:scriptId" element={<RequireAuth><ScriptEditorPage /><ToastContainer /></RequireAuth>} />
      <Route path="/kho-kich-ban/tao-moi" element={<RequireAuth><ScriptEditorPage apiType="shared" /><ToastContainer /></RequireAuth>} />
      <Route path="/kho-kich-ban/:scriptId" element={<RequireAuth><ScriptEditorPage apiType="shared" /><ToastContainer /></RequireAuth>} />

      {/* Authenticated sidebar layout (all other routes) */}
      <Route path="/*" element={
        <RequireAuth>
          <Layout />
        </RequireAuth>
      } />
    </Routes>
  );
}
