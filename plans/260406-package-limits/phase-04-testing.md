# Phase 4: Testing — Kiểm thử toàn diện

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 2h

Test manual + test cases đảm bảo mọi giới hạn hoạt động đúng cho user hiện tại và tương lai.

## Test Matrix

### A. Quota Enforcement Tests

| # | Scenario | Expected | Route |
|---|----------|----------|-------|
| 1 | User gói Starter tạo script thứ 6 | 403 + thông báo | POST /api/scripts |
| 2 | User gói Starter tạo script thứ 5 | 200 OK | POST /api/scripts |
| 3 | User gói Pro tạo script thứ 100 | 200 OK (unlimited) | POST /api/scripts |
| 4 | User gói Starter tạo schedule thứ 3 | 403 | POST /api/schedules |
| 5 | User gói Business tạo schedule thứ 100 | 200 OK (unlimited) | POST /api/schedules |
| 6 | User gói Starter tạo device thứ 2 | 403 | POST /api/devices |
| 7 | Admin tạo script/schedule/device | 200 OK (always) | Tất cả POST |
| 8 | User chưa gán gói tạo resource | 200 OK (no limit) | Tất cả POST |

### B. Feature Toggle Tests

| # | Scenario | Expected |
|---|----------|----------|
| 9 | User gói Starter set proxy | 403 (proxyEnabled=false) |
| 10 | User gói Basic set proxy | 200 OK |
| 11 | User gói Starter set GPS spoof | 403 |
| 12 | User gói Pro set GPS spoof | 200 OK |
| 13 | User gói Starter tạo API token | 403 |
| 14 | User gói Business tạo API token | 200 OK |

### C. Video Storage Tests

| # | Scenario | Expected |
|---|----------|----------|
| 15 | User gói Starter upload 400MB (total < 500MB) | 200 OK |
| 16 | User gói Starter upload 200MB (total > 500MB) | 403 |
| 17 | User gói Pro upload 5GB (total < 10GB) | 200 OK |

### D. Edge Case Tests

| # | Scenario | Expected |
|---|----------|----------|
| 18 | User bị hạ gói (Pro → Starter) nhưng có 10 scripts | Scripts cũ giữ nguyên, không tạo mới được |
| 19 | User bị hạ gói nhưng có proxy đang chạy | Proxy tiếp tục chạy, không config mới được |
| 20 | User bị xoá packageId | Không bị giới hạn (no package = no limit) |
| 21 | Package bị xoá nhưng user vẫn reference | User không bị giới hạn (package not found = no limit) |
| 22 | 2 request tạo script đồng thời khi ở limit-1 | Tối đa 1 request thành công |
| 23 | User sửa script/schedule cũ khi đã vượt limit | 200 OK (sửa cho phép, chỉ chặn tạo mới) |

### E. Security Tests

| # | Scenario | Expected |
|---|----------|----------|
| 24 | Client gửi request POST /api/scripts không qua UI | 403 nếu vượt limit |
| 25 | Client fake JWT với role=admin | JWT verify fail (wrong secret) |
| 26 | Client gửi packageId trong body request | Server ignore, chỉ đọc từ DB |

### F. UI Tests

| # | Scenario | Expected |
|---|----------|----------|
| 27 | Admin tạo gói với maxScripts=5, proxyEnabled=false | Gói lưu đúng |
| 28 | Admin sửa gói từ 5 scripts → 10 scripts | Gói cập nhật đúng |
| 29 | Admin tick "Không giới hạn" cho scripts | maxScripts = -1 |
| 30 | User xem Settings → Usage bar | Hiển thị đúng usage/limit |
| 31 | User bị 403 → toast message | Thông báo rõ ràng + gợi ý nâng cấp |
| 32 | Bảng gói hiển thị 7 cột giới hạn | Icons/badges đúng |

## Quy trình test

### Test thủ công (Manual)
1. Tạo 4 gói theo bảng giá landing page (Starter/Basic/Pro/Business)
2. Tạo 4 user, mỗi user gán 1 gói
3. Đăng nhập từng user, thử tạo resource đến khi vượt limit
4. Verify 403 error + toast message
5. Verify proxy/GPS/API toggle
6. Verify video storage
7. Đổi gói (upgrade/downgrade) → verify behavior
8. Test admin bypass

### Test script (cURL)
Viết script cURL test các API endpoints:
```bash
#!/bin/bash
TOKEN="<user_token>"
BASE="https://phoneagent.io.vn/api"

# Test tạo script khi đã vượt limit
for i in $(seq 1 10); do
  curl -s -X POST "$BASE/scripts" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test '$i'","steps":[],"description":"test"}' \
    | jq '.success, .error'
done
```

## Success Criteria
- [ ] Tất cả 32 test cases pass
- [ ] Không có cách nào bypass limit từ client
- [ ] Admin luôn bypass thành công
- [ ] Downgrade không xoá data
- [ ] Error messages rõ ràng và helpful
- [ ] Activity log ghi nhận quota_exceeded events
