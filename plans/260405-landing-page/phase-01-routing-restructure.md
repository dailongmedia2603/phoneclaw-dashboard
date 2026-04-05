# Phase 1: Routing Restructure

## Overview
- **Priority**: P1 — Phải làm trước, tất cả phase khác phụ thuộc
- **Status**: Pending
- **Effort**: 1h

Tái cấu trúc routing để tách public routes (landing, login) khỏi authenticated routes (dashboard, thiết bị, ...).

## Key Insights

Hiện tại `App.tsx` dùng pattern: `!user → <Login />`, `user → <Routes>`. Cần đổi thành pattern: public routes luôn render, authenticated routes wrap trong guard component.

## Requirements

### Functional
- `/` render LandingPage (public, không cần auth)
- `/login` render Login (public, redirect /dashboard nếu đã login)
- `/dashboard` render Dashboard (auth required)
- Tất cả route khác giữ nguyên path nhưng yêu cầu auth
- Wildcard: unauthenticated → `/`, authenticated → `/dashboard`

### Non-functional
- Không break existing navigation
- Sidebar navItems cập nhật path tương ứng

## Architecture

```
BrowserRouter
├── / → LandingPage (public)
├── /login → Login (public, redirect if authed)
├── /dashboard → RequireAuth → Layout → Dashboard
├── /thiet-bi → RequireAuth → Layout → Devices
├── /proxy → RequireAuth → Layout → ProxyManager
├── /kich-ban → RequireAuth → Layout → Scripts
├── /kich-ban/tao-moi → RequireAuth → ScriptEditor (fullscreen)
├── /kich-ban/:id → RequireAuth → ScriptEditor (fullscreen)
├── /kho-kich-ban → RequireAuth → Layout → SharedScripts
├── /kho-kich-ban/tao-moi → RequireAuth → ScriptEditor (fullscreen)
├── /kho-kich-ban/:id → RequireAuth → ScriptEditor (fullscreen)
├── /lich-trinh → RequireAuth → Layout → Schedules
├── /nhat-ky → RequireAuth → Layout → Logs
├── /thu-vien-video → RequireAuth → Layout → VideoLibrary
├── /nguoi-dung → RequireAuth → Layout → UserManagement
├── /cai-dat → RequireAuth → Layout → Settings
└── * → redirect (/ if unauthed, /dashboard if authed)
```

## Related Code Files

### Files to Modify
| File | Action | Description |
|------|--------|-------------|
| `src/App.tsx` | modify | Tái cấu trúc Routes: thêm public routes, wrap auth routes trong RequireAuth |
| `src/components/Sidebar.tsx` | modify | Đổi Dashboard navItem `to: '/'` → `to: '/dashboard'` |
| `src/hooks/useAuth.ts` | modify | Export AuthContext để RequireAuth có thể dùng |

### Files to Create
| File | Description |
|------|-------------|
| `src/components/RequireAuth.tsx` | Guard component: redirect to /login nếu chưa auth |
| `src/components/LandingPage.tsx` | Landing page component (Phase 2) |

## Implementation Steps

### Step 1: Create RequireAuth component
```tsx
// src/components/RequireAuth.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Loader2 } from 'lucide-react';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### Step 2: Refactor useAuth to use Context
Hiện tại `useAuth()` gọi trực tiếp trong mỗi component → mỗi lần gọi tạo state riêng. Cần wrap trong Context để share state.

```tsx
// src/hooks/useAuth.ts — thêm AuthProvider context
const AuthContext = createContext<ReturnType<typeof useAuthInternal> | null>(null);

export function AuthProvider({ children }) {
  const auth = useAuthInternal(); // rename current useAuth → useAuthInternal
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be within AuthProvider');
  return ctx;
}
```

### Step 3: Wrap App with AuthProvider
```tsx
// src/main.tsx
<BrowserRouter>
  <AuthProvider>
    <App />
  </AuthProvider>
</BrowserRouter>
```

### Step 4: Refactor App.tsx routes
```tsx
export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />

      {/* Authenticated fullscreen routes */}
      <Route path="/kich-ban/tao-moi" element={<RequireAuth><ScriptEditorPage /><ToastContainer /></RequireAuth>} />
      <Route path="/kich-ban/:scriptId" element={<RequireAuth><ScriptEditorPage /><ToastContainer /></RequireAuth>} />
      <Route path="/kho-kich-ban/tao-moi" element={<RequireAuth><ScriptEditorPage apiType="shared" /><ToastContainer /></RequireAuth>} />
      <Route path="/kho-kich-ban/:scriptId" element={<RequireAuth><ScriptEditorPage apiType="shared" /><ToastContainer /></RequireAuth>} />

      {/* Authenticated sidebar layout */}
      <Route path="/*" element={
        <RequireAuth>
          <Layout />
        </RequireAuth>
      } />
    </Routes>
  );
}
```

### Step 5: Update Layout routes
```tsx
function Layout() {
  const { logout, user } = useAuth();
  return (
    <div className="flex h-screen ...">
      <Sidebar onLogout={logout} userName={user!.name} userRole={user!.role} />
      <main>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/thiet-bi" element={<Devices />} />
          {/* ... all other routes ... */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}
```

### Step 6: Update Sidebar navItems
```tsx
// src/components/Sidebar.tsx
const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/dashboard' }, // was '/'
  // ... rest unchanged
];
```

### Step 7: Update Login redirect
After successful login, redirect to `/dashboard` instead of just clearing loading state:
```tsx
// In Login component or useAuth, after login:
navigate('/dashboard');
```

## Success Criteria

- [ ] `https://phoneagent.io.vn/` → Landing page (public)
- [ ] `https://phoneagent.io.vn/login` → Login form
- [ ] `https://phoneagent.io.vn/dashboard` → Dashboard (requires auth)
- [ ] Đã login + vào `/login` → redirect `/dashboard`
- [ ] Chưa login + vào `/dashboard` → redirect `/login`
- [ ] Sidebar Dashboard link trỏ đúng `/dashboard`
- [ ] Tất cả navigation trong app hoạt động bình thường

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Break existing bookmarks/links to `/` | Medium | `/` giờ là landing page — user đã login vẫn truy cập dashboard qua sidebar |
| useAuth state duplication | High | Phải dùng Context, không gọi useAuth() nhiều lần |
| Server-side routing (Nginx/Vite) | Low | SPA fallback — Nginx đã config `try_files $uri /index.html` |

## Next Steps
→ Phase 2: Tạo LandingPage component
