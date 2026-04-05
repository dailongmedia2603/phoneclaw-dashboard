---
title: "Landing Page bán hàng + Routing Restructure"
description: "Thêm trang landing page public tại / và tái cấu trúc routing để tách public vs authenticated routes"
status: pending
priority: P1
effort: 6h
tags: [frontend, routing, marketing, landing-page]
blockedBy: []
blocks: []
created: 2026-04-05
---

# Landing Page bán hàng + Routing Restructure

## Overview

Hiện tại `https://phoneagent.io.vn/` redirect thẳng vào Login. Cần thay đổi để:
1. `/` → Landing page public (giới thiệu sản phẩm, bán hàng)
2. `/login` → Trang đăng nhập riêng biệt
3. `/dashboard` → Trang chính sau đăng nhập (thay vì `/`)
4. Tất cả route authenticated có slug riêng

## Cross-Plan Dependencies

Không có dependency với các plan hiện tại. Plan này chỉ ảnh hưởng routing layer và thêm component mới.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Routing Restructure](./phase-01-routing-restructure.md) | Pending |
| 2 | [Landing Page Component & Content](./phase-02-landing-page.md) | Pending |
| 3 | [Login Page Standalone Route](./phase-03-login-route.md) | Pending |
| 4 | [Polish, SEO & Testing](./phase-04-polish.md) | Pending |

## Dependencies

- Pricing data: tham chiếu từ `plans/pricing-analysis/plan.md` (4 gói: Starter 49K, Basic 99K, Pro 249K, Business 499K)
- Assets: cần logo.png, favico.png (đã có trong /public)
- Libraries có sẵn: Tailwind CSS 4, Motion (animation), Lucide React icons, Recharts

## Key Decisions

- **Dashboard route**: Đổi từ `/` thành `/dashboard`
- **Sidebar navItems**: Cập nhật `to: '/'` → `to: '/dashboard'`
- **Auth redirect**: Sau login → `/dashboard` thay vì `/`
- **Fallback route**: Unauthenticated → `/`, Authenticated → `/dashboard`
- **Landing page design**: Dark gradient theme, modern SaaS style
