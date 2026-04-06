# Phase 1: Database & API — Mở rộng Package schema

## Overview
- **Priority**: P1 — Tất cả phase khác phụ thuộc
- **Status**: Pending
- **Effort**: 3h

Mở rộng Package schema thêm các trường giới hạn mới. Migration data cũ. Cập nhật API routes.

## Implementation Steps

### Step 1: Cập nhật types
**File:** `src/types/index.ts`

```typescript
interface Package {
  id: string;
  name: string;
  maxDevices: number;
  maxScripts: number;         // -1 = không giới hạn
  maxSchedules: number;       // -1 = không giới hạn
  proxyEnabled: boolean;
  gpsSpoofEnabled: boolean;
  apiTokensEnabled: boolean;
  maxVideoStorageMB: number;  // -1 = không giới hạn
  createdAt: string;
}
```

### Step 2: Migration — Thêm default cho packages cũ
**File:** `server/routes/packages.ts`

Khi đọc packages, nếu thiếu field mới → gán default:
```typescript
function migratePackage(pkg: any): Package {
  return {
    ...pkg,
    maxScripts: pkg.maxScripts ?? -1,
    maxSchedules: pkg.maxSchedules ?? -1,
    proxyEnabled: pkg.proxyEnabled ?? true,
    gpsSpoofEnabled: pkg.gpsSpoofEnabled ?? true,
    apiTokensEnabled: pkg.apiTokensEnabled ?? true,
    maxVideoStorageMB: pkg.maxVideoStorageMB ?? -1,
  };
}
```

### Step 3: Cập nhật PostgreSQL schema
**File:** `server/db-schema.sql`

```sql
ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_scripts INTEGER NOT NULL DEFAULT -1;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_schedules INTEGER NOT NULL DEFAULT -1;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS proxy_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS gps_spoof_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS api_tokens_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE packages ADD COLUMN IF NOT EXISTS max_video_storage_mb INTEGER NOT NULL DEFAULT -1;
```

### Step 4: Cập nhật Package API routes
**File:** `server/routes/packages.ts`

- POST/PUT validate tất cả fields mới
- Thêm endpoint `GET /api/packages/my-limits` cho user xem giới hạn gói mình

```typescript
// GET /api/packages/my-limits
router.get('/my-limits', async (req, res) => {
  const userId = getAuthUserId(req);
  const users = await readCollection<User>('users');
  const user = users.find(u => u.id === userId);
  
  if (!user?.packageId) {
    return res.json({ success: true, data: null }); // no package = no limits
  }
  
  const packages = await readCollection<Package>('packages');
  const pkg = packages.find(p => p.id === user.packageId);
  if (!pkg) return res.json({ success: true, data: null });

  // Count current usage
  const devices = await getDevicesForTenant(userId);
  const scripts = await readUserCollection(userId, 'scripts');
  const schedules = await readUserCollection(userId, 'schedules');
  const videos = await readUserCollection(userId, 'videos');
  const videoStorageUsed = videos.reduce((sum, v) => sum + (v.fileSize || 0), 0);

  return res.json({
    success: true,
    data: {
      package: migratePackage(pkg),
      usage: {
        devices: devices.length,
        scripts: scripts.length,
        schedules: schedules.length,
        videoStorageMB: Math.round(videoStorageUsed / (1024 * 1024)),
      }
    }
  });
});
```

### Step 5: Tạo helper function checkQuota
**File:** `server/helpers/check-quota.ts` (mới)

```typescript
import { getAuthUserId, isAdmin } from './get-user';
import { readCollection, readUserCollection } from '../store';

interface QuotaResult {
  allowed: boolean;
  error?: string;
  limit?: number;
  current?: number;
}

export async function checkQuota(
  req: Request,
  resource: 'scripts' | 'schedules' | 'devices',
): Promise<QuotaResult> {
  if (isAdmin(req)) return { allowed: true };
  
  const userId = getAuthUserId(req);
  if (!userId) return { allowed: false, error: 'Unauthorized' };
  
  const users = await readCollection<any>('users');
  const user = users.find((u: any) => u.id === userId);
  if (!user?.packageId) return { allowed: true }; // no package = no limit
  
  const packages = await readCollection<any>('packages');
  const pkg = packages.find((p: any) => p.id === user.packageId);
  if (!pkg) return { allowed: true };
  
  const limitMap = {
    scripts: pkg.maxScripts ?? -1,
    schedules: pkg.maxSchedules ?? -1,
    devices: pkg.maxDevices ?? -1,
  };
  
  const limit = limitMap[resource];
  if (limit === -1) return { allowed: true };
  
  const items = resource === 'devices'
    ? await getDevicesForTenant(userId)
    : await readUserCollection(userId, resource);
  
  if (items.length >= limit) {
    const nameMap = { scripts: 'kịch bản', schedules: 'lịch trình', devices: 'thiết bị' };
    return {
      allowed: false,
      error: `Đã đạt giới hạn ${limit} ${nameMap[resource]} (gói ${pkg.name}). Nâng cấp gói để mở rộng.`,
      limit,
      current: items.length,
    };
  }
  
  return { allowed: true, limit, current: items.length };
}

export async function checkFeature(
  req: Request,
  feature: 'proxy' | 'gpsSpoof' | 'apiTokens',
): Promise<QuotaResult> {
  if (isAdmin(req)) return { allowed: true };
  
  const userId = getAuthUserId(req);
  if (!userId) return { allowed: false, error: 'Unauthorized' };
  
  const users = await readCollection<any>('users');
  const user = users.find((u: any) => u.id === userId);
  if (!user?.packageId) return { allowed: true };
  
  const packages = await readCollection<any>('packages');
  const pkg = packages.find((p: any) => p.id === user.packageId);
  if (!pkg) return { allowed: true };
  
  const featureMap = {
    proxy: pkg.proxyEnabled ?? true,
    gpsSpoof: pkg.gpsSpoofEnabled ?? true,
    apiTokens: pkg.apiTokensEnabled ?? true,
  };
  
  if (!featureMap[feature]) {
    const nameMap = { proxy: 'Proxy', gpsSpoof: 'GPS Spoof', apiTokens: 'API Tokens' };
    return {
      allowed: false,
      error: `${nameMap[feature]} không khả dụng trong gói ${pkg.name}. Nâng cấp gói để sử dụng.`,
    };
  }
  
  return { allowed: true };
}
```

## Success Criteria
- [ ] Package có đầy đủ 7 trường giới hạn
- [ ] Packages cũ được migrate tự động (default = không giới hạn)
- [ ] API `GET /api/packages/my-limits` trả đúng usage + limits
- [ ] Helper `checkQuota` + `checkFeature` sẵn sàng dùng
- [ ] PostgreSQL migration chạy không lỗi

## Related Code Files
| File | Action |
|------|--------|
| `src/types/index.ts` | modify — thêm fields Package |
| `server/routes/packages.ts` | modify — migration + API mới |
| `server/helpers/check-quota.ts` | create — quota check helper |
| `server/db-schema.sql` | modify — ALTER TABLE |
