---
title: "Hệ thống giới hạn gói phần mềm (Package Limits)"
description: "Thêm cơ chế giới hạn toàn diện cho từng gói: scripts, schedules, proxy, API tokens, video storage — với enforcement server-side"
status: pending
priority: P1
effort: 12h
tags: [backend, frontend, security, packages]
blockedBy: []
blocks: []
created: 2026-04-06
---

# Hệ thống giới hạn gói phần mềm (Package Limits)

## Overview

Hiện tại hệ thống chỉ giới hạn **số thiết bị** theo gói. Cần mở rộng để giới hạn thêm: scripts, schedules, proxy, GPS spoof, API tokens, video storage — tất cả enforce server-side để chống hack.

## Hiện trạng

| Feature | Giới hạn hiện tại | Enforce |
|---------|-------------------|---------|
| Thiết bị | maxDevices trong Package | Server (chỉ khi tạo mới) |
| Scripts | Không giới hạn | Không |
| Schedules | Không giới hạn | Không |
| Proxy | Không giới hạn | Không |
| GPS Spoof | Không giới hạn | Không |
| API tokens | 5 (hardcode) | Server |
| Video storage | 500MB/file (hardcode) | Server |

## Thiết kế Package mới

```typescript
interface Package {
  id: string;
  name: string;
  maxDevices: number;
  maxScripts: number;         // -1 = không giới hạn
  maxSchedules: number;       // -1 = không giới hạn
  proxyEnabled: boolean;      // bật/tắt proxy
  gpsSpoofEnabled: boolean;   // bật/tắt GPS spoof
  apiTokensEnabled: boolean;  // bật/tắt API tokens
  maxVideoStorageMB: number;  // MB, -1 = không giới hạn
  createdAt: string;
}
```

## Mapping gói Landing Page → Package config

| Gói | Devices | Scripts | Schedules | Proxy | GPS | API | Video |
|-----|---------|---------|-----------|-------|-----|-----|-------|
| Starter (49K) | 1 | 5 | 2 | OFF | OFF | OFF | 500 MB |
| Basic (99K) | 3 | 15 | 5 | ON | OFF | OFF | 2048 MB |
| Pro (249K) | 10 | -1 | 20 | ON | ON | OFF | 10240 MB |
| Business (499K) | 30 | -1 | -1 | ON | ON | ON | 51200 MB |

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Database & API — Mở rộng Package schema](./phase-01-schema.md) | Pending |
| 2 | [Server Enforcement — Middleware giới hạn](./phase-02-enforcement.md) | Pending |
| 3 | [Frontend — UI quản lý gói + hiển thị giới hạn](./phase-03-frontend.md) | Pending |
| 4 | [Testing — Kiểm thử toàn diện](./phase-04-testing.md) | Pending |

## Nguyên tắc bảo mật

1. **Enforce 100% server-side** — Frontend chỉ hiển thị, không validate
2. **Không tin client** — Mọi request tạo/sửa resource phải check quota server-side
3. **Atomic check** — Đọc count + check limit trong cùng transaction (tránh race condition)
4. **Admin exempt** — Admin không bị giới hạn (giữ nguyên logic hiện tại)
5. **Graceful downgrade** — Khi hạ gói, không xoá data cũ, chỉ chặn tạo mới
6. **Audit log** — Ghi log khi user bị chặn bởi quota

## Dependencies

- Package storage: global collection (không phải tenant-scoped)
- User.packageId: FK tới Package.id
- Tất cả enforcement dựa vào middleware/helper function dùng chung
