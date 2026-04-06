# Phase 2: Server Enforcement — Middleware giới hạn

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 4h

Thêm quota check vào TẤT CẢ server routes tạo resource. 100% enforce server-side — frontend chỉ hiển thị.

## Implementation Steps

### Step 1: Enforce Scripts quota
**File:** `server/routes/scripts.ts`

Thêm check trước khi tạo script mới:
```typescript
// POST /api/scripts
const quota = await checkQuota(req, 'scripts');
if (!quota.allowed) return res.status(403).json({ success: false, error: quota.error });
```

### Step 2: Enforce Schedules quota
**File:** `server/routes/schedules.ts`

```typescript
// POST /api/schedules
const quota = await checkQuota(req, 'schedules');
if (!quota.allowed) return res.status(403).json({ success: false, error: quota.error });
```

### Step 3: Enforce Proxy feature toggle
**File:** `server/routes/proxy.ts`

```typescript
// POST /api/proxy/:deviceId/config — khi set proxy config
const proxyCheck = await checkFeature(req, 'proxy');
if (!proxyCheck.allowed) return res.status(403).json({ success: false, error: proxyCheck.error });

// POST /api/proxy/:deviceId/spoof — khi set GPS spoof
const gpsCheck = await checkFeature(req, 'gpsSpoof');
if (!gpsCheck.allowed) return res.status(403).json({ success: false, error: gpsCheck.error });
```

Chỉ check khi mode !== 'none'. Nếu user tắt proxy (mode='none') thì không cần check.

### Step 4: Enforce API tokens feature toggle
**File:** `server/routes/api-tokens.ts`

```typescript
// POST /api/auth/tokens — trước check limit 5
const tokenCheck = await checkFeature(req, 'apiTokens');
if (!tokenCheck.allowed) return res.status(403).json({ success: false, error: tokenCheck.error });
```

### Step 5: Enforce Video storage quota
**File:** `server/routes/videos.ts`

```typescript
// POST /api/videos/upload — sau khi multer parse file
const userId = getAuthUserId(req);
if (!isAdmin(req) && userId) {
  const users = await readCollection('users');
  const user = users.find(u => u.id === userId);
  if (user?.packageId) {
    const packages = await readCollection('packages');
    const pkg = packages.find(p => p.id === user.packageId);
    const maxMB = pkg?.maxVideoStorageMB ?? -1;
    if (maxMB !== -1) {
      const videos = await readUserCollection(userId, 'videos');
      const usedMB = videos.reduce((sum, v) => sum + (v.fileSize || 0), 0) / (1024 * 1024);
      const fileMB = (req.file?.size || 0) / (1024 * 1024);
      if (usedMB + fileMB > maxMB) {
        // Xoá file vừa upload
        if (req.file?.path) fs.unlinkSync(req.file.path);
        return res.status(403).json({
          success: false,
          error: `Dung lượng video đã đạt giới hạn ${maxMB}MB (gói ${pkg.name}). Xoá video cũ hoặc nâng cấp gói.`,
        });
      }
    }
  }
}
```

### Step 6: Cải thiện Device quota check hiện tại
**File:** `server/routes/devices.ts`

Refactor dùng `checkQuota` thay vì code trực tiếp:
```typescript
// POST /api/devices
const quota = await checkQuota(req, 'devices');
if (!quota.allowed) return res.status(403).json({ success: false, error: quota.error });
```

### Step 7: Thêm audit log khi bị chặn
**File:** `server/helpers/check-quota.ts`

Mỗi khi trả `{ allowed: false }`, ghi activity log:
```typescript
await addActivityLog({
  type: 'system',
  action: 'quota_exceeded',
  details: `User ${userId} bị chặn tạo ${resource}: ${error}`,
  userId,
});
```

## Danh sách enforce points (checklist)

| Route | Method | Resource | Check type |
|-------|--------|----------|------------|
| `/api/devices` | POST | devices | checkQuota('devices') |
| `/api/scripts` | POST | scripts | checkQuota('scripts') |
| `/api/schedules` | POST | schedules | checkQuota('schedules') |
| `/api/proxy/:id/config` | POST | proxy | checkFeature('proxy') |
| `/api/proxy/:id/spoof` | POST | gpsSpoof | checkFeature('gpsSpoof') |
| `/api/proxy/batch/config` | POST | proxy | checkFeature('proxy') |
| `/api/proxy/batch/start` | POST | proxy | checkFeature('proxy') |
| `/api/auth/tokens` | POST | apiTokens | checkFeature('apiTokens') |
| `/api/videos/upload` | POST | video | custom storage check |

## Nguyên tắc bảo mật

1. **Không bao giờ check ở frontend** — Frontend chỉ ẩn/hiện UI theo limits
2. **Admin luôn bypass** — `isAdmin(req)` return true → skip check
3. **No package = no limit** — User chưa gán gói → không giới hạn (admin tự quản)
4. **Graceful downgrade** — Hạ gói không xoá data, chỉ chặn tạo mới
5. **Error message rõ ràng** — Luôn nêu tên gói + giới hạn + gợi ý nâng cấp

## Success Criteria
- [ ] POST /api/scripts bị chặn khi vượt maxScripts
- [ ] POST /api/schedules bị chặn khi vượt maxSchedules
- [ ] Proxy config bị chặn khi proxyEnabled=false
- [ ] GPS spoof bị chặn khi gpsSpoofEnabled=false
- [ ] API tokens bị chặn khi apiTokensEnabled=false
- [ ] Video upload bị chặn khi vượt maxVideoStorageMB
- [ ] Admin không bị chặn bởi bất kỳ limit nào
- [ ] User không có gói → không bị limit
- [ ] Activity log ghi nhận mọi quota_exceeded

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Race condition (2 request cùng lúc) | Medium | Đọc count + check trong 1 query (PostgreSQL) hoặc chấp nhận ±1 (JSON mode) |
| Hacker bypass frontend | High | 100% enforce server-side, không tin client |
| Admin quên gán gói → user unlimited | Low | OK theo design: no package = no limit |
