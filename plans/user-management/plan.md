# Plan: Quản lý Người dùng + Phân quyền

## Tổng quan
Thêm menu "Người dùng" cho admin quản lý tài khoản. Admin cấp tài khoản → user đăng nhập.

## Hiện trạng
- Auth: JWT + bcrypt ✅
- User type: `{ id, email, password, name, role: 'admin'|'manager' }` ✅
- Lưu trữ: `users.json` (JSON file) ✅
- Default admin seed khi chưa có user ✅
- **CHƯA CÓ**: CRUD user endpoints, RBAC enforcement, UI quản lý

## Thay đổi role
- `'admin' | 'manager'` → `'admin' | 'user'` (theo yêu cầu user)

## Phân quyền

| Quyền | Admin | User |
|-------|:-----:|:----:|
| Xem tất cả menu | ✅ | ✅ |
| Quản lý thiết bị | ✅ | Chỉ xem |
| Tạo/sửa/xoá kịch bản | ✅ | ✅ |
| Quản lý người dùng | ✅ | ❌ |
| Cài đặt hệ thống | ✅ | ❌ |
| Kho kịch bản | ✅ | Chỉ xem |
| Chạy kịch bản | ✅ | ✅ |

## Files cần sửa/tạo

### Backend
1. `server/routes/auth.ts` — thêm CRUD: GET users, POST create, PUT update, DELETE
2. `server/routes/auth.ts` — role guard middleware

### Frontend
3. `src/types/index.ts` — thêm User type
4. `src/services/api.ts` — thêm users API methods
5. `src/components/UserManagement.tsx` — trang quản lý người dùng (NEW)
6. `src/components/Sidebar.tsx` — thêm menu (chỉ hiện cho admin)
7. `src/App.tsx` — thêm route
8. `src/hooks/useAuth.ts` — expose role cho components

## Phase 1: Backend API (auth.ts)

### Endpoints mới:
- `GET /api/auth/users` — danh sách users (admin only)
- `POST /api/auth/users` — tạo user mới (admin only)
- `PUT /api/auth/users/:id` — sửa user (admin only)
- `DELETE /api/auth/users/:id` — xoá user (admin only)

### Role guard:
```typescript
function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({...});
  next();
}
```

## Phase 2: Frontend

### UserManagement.tsx:
- Bảng danh sách users: Tên, Email, SĐT, Quyền, Ngày tạo
- Popup thêm user: Tên, SĐT, Email, Mật khẩu, Quyền (dropdown)
- Popup sửa user: sửa thông tin + reset mật khẩu
- Popup xoá: xác nhận

### Sidebar: menu "Người dùng" (icon Users) chỉ hiện khi role = admin
