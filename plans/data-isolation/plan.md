# Plan: Data Isolation - Admin chi thay du lieu cua chinh minh

## Tong quan
Hien tai admin (via `getTenantId()` tra ve `undefined`) thay TAT CA du lieu cua moi user. Can thay doi de admin chi thay du lieu cua chinh minh, giong nhu user thuong. Ap dung cho: **thiet bi, kich ban, lich trinh, thu vien video, custom nodes, logs, dashboard**.

## Pham vi thay doi

### Anh huong:
- Devices (thiet bi + nhom thiet bi)
- Scripts (kich ban user)
- Schedules (lich trinh)
- Videos (thu vien video)
- Custom Nodes
- Logs (activity logs, screenshots, execution history)
- Dashboard (stats, notifications)

### KHONG anh huong:
- Shared Scripts (kho kich ban) — khong co owner_id, admin tao cho tat ca user dung
- User Management — dung `adminOnly` middleware, khong dung `getTenantId()`
- Settings — khong co tenant scoping
- Packages — global
- Device Heartbeat — khong qua auth
- Proxy — device-specific, da co ownership check
- Scheduler background loop — chay doc lap qua tat ca tenants (khong thay doi)

---

## Phase 1: Core — Thay doi `getTenantId()` (1 file)

**File:** `server/helpers/get-user.ts`

**Thay doi:** `getTenantId()` luon tra ve `user.id` (ke ca admin), bo dong `if (user.role === 'admin') return undefined`.

```typescript
// TRUOC:
export function getTenantId(req: Request): string | undefined {
  const user = (req as any).user as AuthPayload | undefined;
  if (!user) return undefined;
  if (user.role === 'admin') return undefined; // Admin sees all
  return user.id;
}

// SAU:
export function getTenantId(req: Request): string | undefined {
  const user = (req as any).user as AuthPayload | undefined;
  if (!user) return undefined;
  return user.id; // Moi user (ke ca admin) chi thay du lieu cua minh
}
```

**Tac dong tu dong:** Tat ca GET endpoints dung `getTenantId()` se tu dong scope theo user:
- `GET /api/devices` — chi tra devices cua user
- `GET /api/devices/groups/all` — chi tra groups cua user
- `GET /api/scripts` + `GET /api/scripts/:id` — chi tra scripts cua user
- `GET /api/schedules` + `GET /api/schedules/:id` — chi tra schedules cua user
- `GET /api/videos` — chi tra videos cua user
- `GET /api/custom-nodes` — chi tra custom nodes cua user
- `GET /api/logs/activity` — chi tra activity logs cua user
- `GET /api/logs/screenshots` — chi tra screenshots cua user
- `GET /api/logs/executions` — chi tra execution history cua user
- `GET /api/scripts/executions/latest` — chi tra latest execution cua user
- `GET /api/scripts/history/all` — chi tra history cua user
- `GET /api/dashboard/stats` — chi tra stats cua user
- `GET /api/dashboard/notifications` — chi tra notifications cua user

---

## Phase 2: Backend — Xoa admin bypass trong UPDATE/DELETE routes (5 files)

### 2.1 `server/routes/scripts.ts`

**PUT /api/scripts/:id (line 34-54):** Xoa block `if (isAdmin(req))` — admin dung cung code path voi user:
```typescript
// SAU: Gon lai, khong can phan biet admin/user
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const script = await se.updateScriptForTenant(userId, req.params.id, req.body);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true, data: script });
});
```

**DELETE /api/scripts/:id (line 56-74):** Tuong tu — xoa `if (isAdmin(req))` block:
```typescript
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const ok = await se.deleteScriptForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true });
});
```

**POST /api/scripts/:id/run (line 76-102):** Thay doi ownership check — admin phai kiem tra giong user:
```typescript
// Line 85: Bo `isAdmin(req) ? undefined : userId` → luon dung userId
const userScripts = await se.getScriptsForTenant(userId);
// Line 92: Bo `!isAdmin(req) &&` — luon kiem tra ownership
if (found.tenantId !== userId) {
  return res.status(403).json({ ... });
}
```

**Xoa import `isAdmin`** (line 4) — khong con dung trong file nay.

### 2.2 `server/routes/schedules.ts`

**PUT /api/schedules/:id (line 69-93):** Xoa block `if (isAdmin(req))`:
```typescript
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const data = { ...req.body };
  if (data.cron) data.nextRun = sched.getNextRun(data.cron);
  const schedule = await sched.updateScheduleForTenant(userId, req.params.id, data);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true, data: schedule });
});
```

**DELETE /api/schedules/:id (line 95-113):** Xoa block `if (isAdmin(req))`:
```typescript
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const ok = await sched.deleteScheduleForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Schedule not found' });
  res.json({ success: true });
});
```

**PUT /api/schedules/:id/toggle (line 115-134):** Xoa block `if (isAdmin(req))`:
```typescript
router.put('/:id/toggle', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const schedules = await sched.getSchedulesForTenant(userId);
  const schedule = schedules.find(s => s.id === req.params.id);
  if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
  const updated = await sched.updateScheduleForTenant(userId, req.params.id, { enabled: !schedule.enabled });
  res.json({ success: true, data: updated });
});
```

**POST /api/schedules (line 24-67):** Xoa `if (!isAdmin(req))` guard — admin cung phai verify ownership:
```typescript
// Bo dong 35: `if (!isAdmin(req))` — luon kiem tra
const userScripts = await getScriptsForTenant(userId);
if (!userScripts.find(s => s.id === scriptId)) { ... }
// Luon kiem tra targetId ownership
```

**Xoa import `isAdmin`** — khong con dung.

### 2.3 `server/routes/videos.ts`

**GET /api/videos (line 23-31):** Da tu dong fix boi Phase 1 (`getTenantId` tra ve userId).
Nhung can don gian hoa code:
```typescript
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const videos = await readUserCollection<Video>(tenantId, 'videos');
  videos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json({ success: true, data: videos });
});
```

**DELETE /api/videos/:id (line 72-97):** Xoa block `if (isAdmin(req))`:
```typescript
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const videos = await readUserCollection<Video>(userId, 'videos');
  const video = videos.find(v => v.id === req.params.id);
  if (!video) return res.json({ success: false, error: 'Video khong ton tai' });
  try { await deleteFromR2(video.r2Key); } catch { /* ignore */ }
  await writeUserCollection(userId, 'videos', videos.filter(v => v.id !== req.params.id));
  res.json({ success: true });
});
```

**POST /api/videos/:id/send-to-device (line 99-169):** Xoa admin bypass:
```typescript
// Line 108: Luon dung userId
const videos = await readUserCollection<Video>(userId, 'videos');
// Line 118: Bo `!isAdmin(req) &&`
if (found.tenantId !== userId) { ... }
```

**Xoa import `isAdmin`, `readAllTenantsCollection`** — khong con dung.

### 2.4 `server/routes/devices.ts`

**GET /api/devices/:id (line 14-32):** Xoa admin bypass:
```typescript
// Line 27: Bo `!isAdmin(req) &&`
if (found.tenantId !== userId) {
  return res.status(403).json({ ... });
}
```

**PUT /api/devices/:id (line 77-96):** Xoa admin bypass:
```typescript
// Line 89: Bo `!isAdmin(req) &&`
if (found.tenantId !== userId) {
  return res.status(403).json({ ... });
}
```

**DELETE /api/devices/:id (line 98-117):** Tuong tu:
```typescript
// Line 110: Bo `!isAdmin(req) &&`
if (found.tenantId !== userId) { ... }
```

**PUT /api/devices/groups/:id (line 138-159):** Don gian hoa — chi update group cua user:
```typescript
router.put('/groups/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const group = await dm.updateGroupForTenant(userId, req.params.id, req.body);
  if (!group) return res.status(404).json({ success: false, error: 'Group not found' });
  res.json({ success: true, data: group });
});
```

**DELETE /api/devices/groups/:id (line 161-180):** Don gian hoa:
```typescript
router.delete('/groups/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const ok = await dm.deleteGroupForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Group not found' });
  res.json({ success: true });
});
```

**Xoa import `isAdmin`** — khong con dung.
**Xoa import `getAllTenantIds`** — khong con dung.

### 2.5 `server/routes/custom-nodes.ts`

**PUT /api/custom-nodes/:id (line 38-65):** Xoa block `if (isAdmin(req))`:
```typescript
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { name } = req.body;
  if (!name?.trim()) return res.json({ success: false, error: 'Ten node khong duoc trong' });
  const nodes = await readUserCollection<CustomNode>(userId, 'custom-nodes');
  const idx = nodes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.json({ success: false, error: 'Node khong ton tai' });
  nodes[idx].name = name.trim();
  await writeUserCollection(userId, 'custom-nodes', nodes);
  res.json({ success: true, data: nodes[idx] });
});
```

**DELETE /api/custom-nodes/:id (line 67-89):** Tuong tu — xoa admin block.

**Xoa import `isAdmin`, `readAllTenantsCollection`** — khong con dung.

---

## Phase 3: Backend — Logs cleanup (1 file)

**File:** `server/routes/logs.ts`

**POST /api/logs/cleanup (line 104-128):** Admin chi cleanup tenant cua minh:
```typescript
router.post('/cleanup', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const { days } = req.body;
  const cutoff = new Date(Date.now() - (days || 30) * 86400000).toISOString();
  // Moi user (ke ca admin) chi cleanup du lieu cua minh
  const execRemoved = await cleanupTenantCollection(userId, 'execution-history', cutoff, 'startedAt');
  const logsRemoved = await cleanupTenantCollection(userId, 'activity-logs', cutoff, 'timestamp');
  const ssRemoved = await cleanupTenantCollection(userId, 'screenshots', cutoff, 'timestamp');
  res.json({ success: true, data: { executionsRemoved: execRemoved, logsRemoved, screenshotsRemoved: ssRemoved } });
});
```

**POST /api/logs/cleanup-all (line 130-148):** Tuong tu:
```typescript
router.post('/cleanup-all', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  await writeUserCollection(userId, 'execution-history', []);
  await writeUserCollection(userId, 'activity-logs', []);
  await writeUserCollection(userId, 'screenshots', []);
  res.json({ success: true, data: { message: 'All logs cleared' } });
});
```

**Xoa import `isAdmin`, `getAllTenantIds`** — khong con dung.

---

## Phase 4: Frontend — Xoa admin-specific filtering (1 file)

**File:** `src/components/Devices.tsx`

**Line 40-42:** Xoa `isNonAdmin` check vi gio backend da tra dung du lieu:
```typescript
// TRUOC:
const isNonAdmin = authUser?.role !== 'admin';
const userDeviceCount = authUser ? (deviceList || []).filter(d => d.ownerId === authUser.id).length : 0;

// SAU: Gio deviceList da la cua user roi, khong can filter
const userDeviceCount = (deviceList || []).length;
```

**Line 195:** Xoa `{isNonAdmin && ...}` guard — quota banner hien cho tat ca user co package:
```typescript
// TRUOC: {isNonAdmin && currentPkg && (
// SAU:   {currentPkg && (
```

---

## Risk Assessment

### An toan (khong bi anh huong):
1. **Shared Scripts** — dung bang rieng `shared_scripts`, khong co `getTenantId()`
2. **User Management** — dung `adminOnly` middleware rieng
3. **Settings** — khong dung tenant scoping
4. **Device Heartbeat** — endpoint rieng `/api/heartbeat`, khong qua auth
5. **Scheduler background loop** — dung `getAllTenantIds()` doc lap, khong dung `getTenantId()`
6. **WebSocket** — broadcast theo device status, khong anh huong

### Can chu y:
1. **Admin device limit**: Hien tai admin khong co device limit (`!isAdmin(req)` guard on POST). Can quyet dinh: admin co gioi han device khong? → Giu nguyen logic hien tai: admin khong bi limit.
2. **Dashboard notifications**: Sau thay doi, admin chi thay notifications cua minh + shared. Day la hanh vi dung.
3. **findDeviceGlobal()**: Van duoc dung trong heartbeat va scheduler. Khong bi anh huong vi chung khong dung `getTenantId()`.

---

## Implementation Order

1. Phase 1 (core) — 1 file, thay doi 1 dong
2. Phase 2 (routes) — 5 files, xoa admin bypass blocks
3. Phase 3 (logs) — 1 file, don gian hoa cleanup
4. Phase 4 (frontend) — 1 file, xoa isNonAdmin guard

**Tong: 8 files can sua**
