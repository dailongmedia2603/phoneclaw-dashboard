# Phase 3: Frontend — UI quản lý gói + hiển thị giới hạn

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 3h

Cập nhật UI tạo/sửa gói với toggle + input cho từng giới hạn. Hiển thị usage cho user.

## Implementation Steps

### Step 1: Cập nhật PackageSettings — Form tạo/sửa gói
**File:** `src/components/PackageSettings.tsx`

Thêm các trường vào modal tạo/sửa gói:

```
┌─────────────────────────────────────┐
│ + Thêm gói                      ✕  │
├─────────────────────────────────────┤
│ Tên gói (Bắt buộc)                 │
│ [__________________________]       │
│                                     │
│ Số phone tối đa (Bắt buộc)         │
│ [__________________________]       │
│                                     │
│ ── Giới hạn tính năng ──           │
│                                     │
│ Số kịch bản tối đa                 │
│ [__5___] ☐ Không giới hạn          │
│                                     │
│ Số lịch trình tối đa               │
│ [__2___] ☐ Không giới hạn          │
│                                     │
│ Dung lượng video (MB)               │
│ [_500__] ☐ Không giới hạn          │
│                                     │
│ ── Bật/tắt tính năng ──            │
│                                     │
│ Proxy (đổi IP)     [🟢 BẬT]       │
│ GPS Spoof (vị trí) [🔴 TẮT]       │
│ API Tokens          [🔴 TẮT]       │
│                                     │
│              [Huỷ] [Tạo gói]       │
└─────────────────────────────────────┘
```

Mỗi trường số lượng có checkbox "Không giới hạn" — khi tick → gửi -1.
Toggle bật/tắt cho proxy, GPS spoof, API tokens — dùng switch style.

### Step 2: Cập nhật bảng danh sách gói
Thêm cột hiển thị giới hạn:

| Tên gói | Devices | Scripts | Schedules | Proxy | GPS | API | Video | Thao tác |
|---------|---------|---------|-----------|-------|-----|-----|-------|----------|

Dùng badge/icon cho compact:
- Số: badge `5` hoặc `∞`
- Toggle: ✅ hoặc ❌

### Step 3: Thêm Usage Bar cho User
**File:** `src/components/Settings.tsx` (tab Tài khoản)

Gọi `GET /api/packages/my-limits` và hiển thị:

```
┌─────────────────────────────────────┐
│ 📦 Gói hiện tại: Pro (249.000đ)    │
│                                     │
│ Thiết bị    ████████░░  8/10       │
│ Kịch bản    ████░░░░░░  12/∞       │
│ Lịch trình  ██████░░░░  14/20      │
│ Video       ██░░░░░░░░  1.2/10 GB  │
│                                     │
│ Proxy: ✅ Bật    GPS: ✅ Bật        │
│ API Tokens: ❌ Tắt                  │
│                                     │
│ [Nâng cấp gói]                     │
└─────────────────────────────────────┘
```

### Step 4: Hiển thị cảnh báo khi gần limit
Khi usage >= 80% limit → hiển thị warning badge trên sidebar hoặc trong component tương ứng.

### Step 5: Hiển thị lỗi 403 thân thiện
Khi server trả 403 quota error → hiển thị toast message với nội dung rõ ràng + nút "Nâng cấp gói".

### Step 6: Cập nhật api.ts
**File:** `src/services/api.ts`

Thêm endpoint:
```typescript
packages: {
  // ...existing
  getMyLimits: () => fetchApi('/api/packages/my-limits'),
}
```

## Success Criteria
- [ ] Modal tạo/sửa gói có đầy đủ 7 trường giới hạn
- [ ] Checkbox "Không giới hạn" gửi -1 đúng
- [ ] Toggle proxy/GPS/API hoạt động đúng
- [ ] Bảng gói hiển thị tất cả giới hạn compact
- [ ] User thấy usage bar trong Settings
- [ ] Lỗi 403 hiển thị toast thân thiện
- [ ] Nút "Nâng cấp gói" hoạt động

## Related Code Files
| File | Action |
|------|--------|
| `src/components/PackageSettings.tsx` | modify — form + table |
| `src/components/Settings.tsx` | modify — usage bar |
| `src/services/api.ts` | modify — thêm endpoint |
| `src/types/index.ts` | modify — Package type |
