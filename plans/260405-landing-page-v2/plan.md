---
title: "Landing Page V2 — Áp dụng template design ZACA"
description: "Thay thế LandingPage.tsx bằng phiên bản mới theo phong cách thiết kế template ZACA (light theme, orange gradient, rounded cards) với nội dung Phone Agent"
status: pending
priority: P1
effort: 4h
tags: [frontend, landing-page, ui-redesign]
blockedBy: []
blocks: []
created: 2026-04-05
---

# Landing Page V2 — Áp dụng template design ZACA

## Overview

Template ZACA có thiết kế đẹp (light theme, orange gradient hero, rounded-3xl cards, bento grid, tabbed use cases, masonry testimonials). Cần giữ nguyên phong cách visual nhưng thay toàn bộ nội dung sang Phone Agent.

**Approach**: Viết lại LandingPage.tsx theo cấu trúc section giống template, map route `/landing` để preview, sau khi ok thì thay thế route `/`.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Tạo LandingPageV2 + Route /landing](./phase-01-landing-v2.md) | Pending |
| 2 | [Swap route / và cleanup](./phase-02-swap-route.md) | Pending |

## Phân tích template → Phone Agent mapping

### Design System (GIỮ NGUYÊN từ template)
- **Color**: Orange gradient hero (#f97316 → #c2410c), bg-gray-50/white sections, rose/emerald/blue accents
- **Typography**: font-black headings (4xl-6xl), font-medium body
- **Cards**: rounded-3xl, shadow-lg, border-slate-100, hover:-translate-y-1
- **Animations**: motion whileInView fade-in-up, stagger delays
- **Spacing**: py-24, max-w-7xl, px-4/8/12
- **Navbar**: Floating pill (rounded-full, bg-white/80 backdrop-blur-md)
- **Blobs**: Animated gradient blobs (mix-blend-screen, blur-3xl)
- **Badges**: rounded-full, uppercase tracking-wider

### Section Mapping (Template → Phone Agent)

| # | Template Section | Phone Agent Adaptation |
|---|------------------|----------------------|
| 1 | **Navbar** (floating pill) | Logo Phone Agent + nav: Tính năng, Bảng giá, FAQ + Đăng nhập + CTA |
| 2 | **Hero** (orange gradient + badge + headline + 2 CTAs) | Badge: "Nền tảng #1 tự động hoá iPhone tại VN" / H1: "Quản lý hàng trăm iPhone từ một màn hình duy nhất" / Sub: automation copy / CTAs: Dùng thử + Xem demo |
| 3 | **IntrigueBullets** (3 cards grid, icon + title + desc) | 3 USPs: Script kéo thả / Quản lý hàng trăm máy / Lịch trình 24/7 |
| 4 | **PainPoints** (left pain list + right stat card) | 3 pain points của người quản lý iPhone thủ công + stat card "90% thời gian lãng phí vào thao tác lặp" |
| 5 | **Solution** (left: chat mockup, right: text + 2 feature cards) | Left: Dashboard mockup (CSS), Right: Giới thiệu Phone Agent + 2 key features (Script Editor + Điều khiển từ xa) |
| 6 | **Credibility** (orange gradient band + tech logos) | "Phone Agent tự hào tích hợp..." + logos: Tailscale VPN, Node.js, WebSocket Real-time |
| 7 | **Benefits** (bento grid 5 cards) | 5 benefits: Script Editor / Auto Schedule / Device Control / Proxy Spoof / Shared Scripts |
| 8 | **UseCases** (tabbed 11 industries) | 6 use cases: TikTok Agency / Dropshipper / MMO Freelancer / Livestream / Marketing Agency / E-commerce |
| 9 | **SocialProof** (4 testimonial cards, masonry) | 4 testimonials phù hợp target audience |
| 10 | **Pricing** (4 plans grid) | 4 plans: Starter 49K / Basic 99K / Pro 249K / Business 499K |
| 11 | **Footer** (dark bg, columns) | Phone Agent info + links |

### Key Files

**Modify:**
- `src/App.tsx` — thêm route `/landing` → LandingPageV2

**Create:**
- `src/components/LandingPageV2.tsx` — component mới

**Keep:**
- `src/components/LandingPage.tsx` — giữ nguyên ở route `/` cho đến Phase 2

## Dependencies
- Motion library (đã có)
- Lucide icons (đã có) 
- Tailwind CSS 4 (đã có)
- Cần thêm CSS keyframes cho animate-blob (thêm vào index.css)
