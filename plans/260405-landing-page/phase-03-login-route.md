# Phase 3: Login Page Standalone Route

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 0.5h

Chuyển Login component từ full-page conditional render sang route-based `/login`.

## Key Insights

Login.tsx hiện tại nhận `onLogin` prop và được render trực tiếp khi `!user`. Cần chuyển sang sử dụng `useAuth()` hook từ Context (Phase 1) và thêm `useNavigate` để redirect sau login.

## Related Code Files

### Files to Modify
| File | Action | Description |
|------|--------|-------------|
| `src/components/Login.tsx` | modify | Dùng useAuth() thay vì prop, thêm navigate sau login |

## Implementation Steps

### Step 1: Refactor Login.tsx
- Remove `onLogin` prop interface
- Import `useAuth` from hooks
- Import `useNavigate`, `useLocation` from react-router-dom
- Call `useAuth()` to get `login` function
- After successful login: `navigate(location.state?.from?.pathname || '/dashboard')`
- Giữ nguyên toàn bộ UI/styling

```tsx
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... validation
    const err = await login(email, password);
    if (!err) {
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    }
    // ... error handling
  };

  // ... rest of JSX unchanged
}
```

### Step 2: Add "Về trang chủ" link
Thêm link quay về landing page trên trang login:
```tsx
// Trên form, sau logo
<Link to="/" className="text-blue-500 hover:text-blue-400 text-sm">
  ← Về trang chủ
</Link>
```

## Success Criteria

- [ ] `/login` renders Login form
- [ ] Login thành công → redirect `/dashboard`
- [ ] Login thành công từ protected route → redirect về route đó
- [ ] Đã login + vào `/login` → redirect `/dashboard`
- [ ] Link "Về trang chủ" → `/` (landing page)

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Existing Login prop usage breaks | Low | Chỉ dùng ở App.tsx, sẽ remove trong Phase 1 |

## Next Steps
→ Phase 4: Polish & Testing
