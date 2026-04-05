# Phase 2: Landing Page Component & Content

## Overview
- **Priority**: P1 — Core deliverable
- **Status**: Pending
- **Effort**: 3.5h

Tạo trang landing page bán hàng hoàn chỉnh với nội dung copywriting chuyên nghiệp và thiết kế UI/UX chuẩn SaaS.

## Key Insights

### Phân tích sản phẩm
Phone Agent là nền tảng quản lý & tự động hoá iPhone hàng loạt, target audience:
- **Agency social media**: quản lý hàng chục tài khoản TikTok/Facebook
- **Dropshipper/E-commerce**: tự động hoá livestream, đăng sản phẩm
- **Freelancer MMO**: farm nhiều tài khoản, chạy script tự động
- **Doanh nghiệp**: quản lý đội ngũ điện thoại cho chiến dịch marketing

### USP (Unique Selling Propositions)
1. **Node-based Script Editor** — Kéo thả, không cần code, ai cũng dùng được
2. **Multi-device control** — 1 dashboard quản lý hàng trăm iPhone cùng lúc
3. **Cron Scheduling** — Đặt lịch tự chạy 24/7, không cần giám sát
4. **Proxy + GPS Spoof** — Giả lập vị trí VN/US, tránh ban
5. **Real-time monitoring** — Theo dõi live screenshot, nhận thông báo Telegram
6. **Shared Script Library** — Kho kịch bản sẵn cho TikTok, Facebook, Instagram

## Requirements

### Functional
- 10 sections từ trên xuống dưới (con đường mua hàng)
- Header cố định với nút Đăng nhập
- Responsive: mobile, tablet, desktop
- Smooth scroll navigation giữa các sections
- Animation khi scroll vào viewport (Motion library)

### Non-functional
- First Contentful Paint < 1.5s (no heavy images)
- Accessible: semantic HTML, proper contrast
- No external dependencies — chỉ dùng Tailwind + Motion + Lucide

## Architecture

### Component Structure
```
LandingPage.tsx (main component, ~800-1000 lines)
├── LandingHeader — Fixed header with nav + CTA
├── HeroSection — Headline + subheadline + CTA buttons
├── StatsBar — Social proof numbers
├── PainPointSection — Problems → Solutions
├── FeaturesSection — 6 feature cards with icons
├── HowItWorksSection — 3-step process
├── DemoSection — Visual showcase / screenshots
├── PricingSection — 4 pricing tiers
├── TestimonialsSection — Customer quotes
├── FAQSection — Accordion FAQ
└── FooterCTA + Footer — Final conversion + links
```

Single file component (LandingPage.tsx) — không tách nhỏ vì chỉ dùng ở 1 nơi.

## Related Code Files

### Files to Create
| File | Description |
|------|-------------|
| `src/components/LandingPage.tsx` | Full landing page component |

### Assets Needed
- Logo: `/public/logo.png` (đã có)
- Favicon: `/public/favico.png` (đã có)
- Screenshots: có thể dùng CSS gradient/illustration thay thế

## Content Strategy & Copywriting

### Design System
- **Color Palette**: Dark gradient (slate-900 → slate-950) + Blue accent (#3B82F6 → #2563EB)
- **Typography**: System font (Inter/SF Pro via Tailwind default)
- **Spacing**: 8px grid, section padding py-20 md:py-32
- **Border Radius**: rounded-2xl cho cards, rounded-full cho badges
- **Glassmorphism**: bg-white/5 backdrop-blur cho cards trên dark background

---

## SECTION-BY-SECTION CONTENT & DESIGN

### Section 1: Landing Header (Fixed)
**Design**: Sticky top, bg-slate-900/80 backdrop-blur, border-b border-white/10
**Layout**: Logo (left) — Nav links (center) — CTA buttons (right)

```
Nav links: Tính năng | Bảng giá | FAQ
Buttons: [Đăng nhập] (ghost) | [Dùng thử miễn phí →] (primary blue)
```

Mobile: Hamburger menu → slide-down nav

---

### Section 2: Hero Section
**Design**: Full viewport height, dark gradient background, animated floating elements
**Layout**: Center-aligned text + 2 CTA buttons + hero illustration below

**Content:**
```
Badge: "Nền tảng #1 tự động hoá iPhone tại Việt Nam"

Headline (h1):
"Quản lý hàng trăm iPhone
từ một màn hình duy nhất"

Subheadline:
"Tự động hoá mọi thao tác — từ lướt TikTok, đăng video, đến quản lý
hàng loạt tài khoản. Không cần code. Chạy 24/7."

CTA Primary: [Bắt đầu miễn phí →] → /login
CTA Secondary: [Xem demo ↓] → scroll to #demo

Below: Hero image/dashboard mockup (CSS-rendered dashboard preview)
```

**Animation**: Headline fade-in-up, subheadline delay 0.2s, CTAs delay 0.4s

---

### Section 3: Stats Bar (Social Proof)
**Design**: bg-slate-800/50, horizontal row, 4 stats with icons
**Layout**: Grid 4 cols, center-aligned numbers

```
📱 500+ Thiết bị đang hoạt động
📜 1,000+ Kịch bản đã tạo
⏰ 10,000+ Lịch trình tự động
👥 50+ Khách hàng tin dùng
```

**Animation**: Count-up animation khi scroll vào viewport

---

### Section 4: Pain Points → Solutions
**Design**: 2-column layout, left = pain (red tint), right = solution (green tint)
**Headline**: "Bạn đang gặp những vấn đề này?"

```
Pain 1: "Quản lý 10+ điện thoại thủ công mỗi ngày?"
→ Solution: "Dashboard tập trung — theo dõi trạng thái, pin, kết nối của tất cả thiết bị real-time"

Pain 2: "Lặp đi lặp lại cùng thao tác trên từng máy?"
→ Solution: "Script Editor kéo thả — tạo kịch bản 1 lần, chạy trên hàng trăm máy"

Pain 3: "Phải thức đêm để chạy chiến dịch theo giờ?"
→ Solution: "Lịch trình Cron — đặt lịch tự chạy 24/7, nhận thông báo qua Telegram"

Pain 4: "Tài khoản bị ban vì cùng IP/vị trí?"
→ Solution: "Proxy + GPS Spoof — mỗi máy một IP khác nhau, giả lập vị trí VN/US"
```

**Animation**: Slide-in-left (pain), slide-in-right (solution)

---

### Section 5: Features Showcase
**Design**: 6 feature cards, grid 3x2 (desktop), glassmorphism cards
**Headline**: "Mọi thứ bạn cần để scale"
**Subheadline**: "Một nền tảng duy nhất thay thế hàng chục công cụ"

```
Feature 1: Quản lý thiết bị
Icon: Cpu
"Theo dõi hàng trăm iPhone cùng lúc. Trạng thái online/offline, 
pin, nhóm thiết bị — tất cả trên một dashboard."

Feature 2: Script Editor trực quan
Icon: Wand2
"Kéo thả để tạo kịch bản tự động. Tap, swipe, gõ text, 
mở app, chờ, lặp lại — không cần viết code."

Feature 3: Lịch trình tự động
Icon: CalendarDays
"Đặt lịch chạy script theo giờ, ngày, tuần. 
Hệ thống tự chạy 24/7, bạn chỉ cần ngồi theo dõi."

Feature 4: Điều khiển từ xa
Icon: Monitor
"Xem live screenshot, tap, swipe, gõ text trực tiếp từ 
trình duyệt. Kiểm soát thiết bị ở bất kỳ đâu."

Feature 5: Proxy & GPS Spoof  
Icon: Shield
"Route traffic qua VN/US. Giả lập GPS, timezone, locale 
cho từng thiết bị riêng biệt."

Feature 6: Kho kịch bản sẵn
Icon: BookOpen
"Thư viện kịch bản được tạo sẵn cho TikTok, Facebook, 
Instagram. Chỉ cần chọn và chạy."
```

**Animation**: Stagger cards fade-in-up, 0.1s delay each

---

### Section 6: How It Works
**Design**: 3 steps horizontal timeline, numbered circles
**Headline**: "Bắt đầu trong 3 phút"

```
Step 1: Kết nối thiết bị
"Thêm iPhone vào hệ thống qua Tailscale. 
Thiết bị tự động xuất hiện trên dashboard."

Step 2: Tạo hoặc chọn kịch bản
"Dùng Script Editor kéo thả hoặc chọn kịch bản 
có sẵn trong kho. Tuỳ chỉnh theo nhu cầu."

Step 3: Chạy & theo dõi
"Chạy ngay hoặc đặt lịch tự động. Theo dõi 
tiến trình real-time, nhận thông báo Telegram."
```

**Animation**: Steps appear sequentially with connecting line animation

---

### Section 7: Demo Section (Visual Showcase)
**Design**: Dark card with browser mockup frame, tabs to switch views
**Headline**: "Trải nghiệm trực quan"

```
Tab 1: "Dashboard" — CSS mockup of dashboard overview
Tab 2: "Script Editor" — CSS mockup of node editor
Tab 3: "Điều khiển" — CSS mockup of device control grid
```

Dùng CSS gradients + shapes để tạo mockup dashboard thay vì ảnh thật (giữ nhẹ).

**Animation**: Tab switching with crossfade

---

### Section 8: Pricing Section
**Design**: 4 pricing cards, "Pro" highlighted as recommended
**Headline**: "Bảng giá đơn giản, minh bạch"
**Subheadline**: "Chọn gói phù hợp. Nâng cấp bất cứ lúc nào."

```
Starter — 49.000đ/tháng
- 1 thiết bị
- 5 kịch bản tự tạo
- 2 lịch trình
- 500 MB video
- Kho kịch bản chia sẻ
- VNC Remote
[Bắt đầu →]

Basic — 99.000đ/tháng
- 3 thiết bị
- 15 kịch bản tự tạo
- 5 lịch trình
- 2 GB video
- Proxy management
- Hỗ trợ email
[Bắt đầu →]

Pro — 249.000đ/tháng ⭐ PHỔ BIẾN NHẤT
- 10 thiết bị
- Không giới hạn kịch bản
- 20 lịch trình
- 10 GB video
- Proxy + GPS Spoof
- Hỗ trợ ưu tiên
[Bắt đầu ngay →]

Business — 499.000đ/tháng
- 30 thiết bị
- Không giới hạn kịch bản
- Không giới hạn lịch trình
- 50 GB video
- API tokens
- Chat trực tiếp
[Liên hệ →]
```

**Animation**: Cards scale-in with stagger

---

### Section 9: FAQ Section
**Design**: Accordion, max-w-3xl centered
**Headline**: "Câu hỏi thường gặp"

```
Q: Phone Agent hoạt động như thế nào?
A: Phone Agent kết nối với iPhone thật qua mạng nội bộ Tailscale. 
   Bạn tạo kịch bản trên web, hệ thống gửi lệnh đến từng thiết bị 
   để thực hiện thao tác tự động.

Q: Có cần jailbreak iPhone không?
A: Cần cài đặt một ứng dụng automation trên iPhone để nhận lệnh 
   từ server. Chi tiết hướng dẫn sẽ được cung cấp sau khi đăng ký.

Q: Tôi có thể quản lý bao nhiêu thiết bị?
A: Tuỳ gói — từ 1 (Starter) đến 30 (Business). Cần nhiều hơn? 
   Liên hệ để được tư vấn gói Enterprise.

Q: Dữ liệu có an toàn không?
A: Toàn bộ kết nối qua Tailscale VPN (mã hoá end-to-end). 
   Dữ liệu lưu trên VPS riêng, không chia sẻ với bên thứ 3.

Q: Có hỗ trợ API không?
A: Có. Gói Business bao gồm API tokens để tích hợp với 
   hệ thống của bạn qua REST API.

Q: Tôi có được dùng thử không?
A: Có! Đăng ký gói Starter miễn phí 7 ngày để trải nghiệm 
   trước khi quyết định.
```

**Animation**: Accordion open/close with height transition

---

### Section 10: Final CTA + Footer
**Design**: Gradient bg (blue-600 → blue-800), center-aligned

**CTA Content:**
```
Headline: "Sẵn sàng tự động hoá?"
Subheadline: "Bắt đầu miễn phí. Không cần thẻ tín dụng."
Button: [Tạo tài khoản miễn phí →] → /login
Secondary: "Hoặc liên hệ tư vấn: 0xxx.xxx.xxx"
```

**Footer:**
```
Logo | © 2026 Phone Agent | Điều khoản | Chính sách bảo mật
```

---

## Implementation Steps

### Step 1: Create LandingPage.tsx skeleton
- Import React, useState, useEffect, motion
- Import Lucide icons: Cpu, Wand2, CalendarDays, Shield, BookOpen, Monitor, ChevronDown, ChevronRight, Menu, X, Check, Zap, Clock, Users, Play, ArrowRight
- Import Link from react-router-dom
- Define section component functions inline

### Step 2: Implement LandingHeader
- Fixed positioning, z-50
- Scroll detection: bg becomes opaque after 50px scroll
- Mobile hamburger menu with slide-down
- Smooth scroll to section IDs

### Step 3: Implement HeroSection
- Animated gradient background (CSS @keyframes)
- motion.div for fade-in animations
- Responsive typography: text-4xl md:text-6xl lg:text-7xl

### Step 4: Implement StatsBar
- useEffect + IntersectionObserver for count-up trigger
- Counter animation: 0 → target over 2 seconds

### Step 5: Implement PainPointSection
- Grid layout: 1 col mobile, 2 col desktop
- Red/green accent colors for pain/solution contrast

### Step 6: Implement FeaturesSection
- Grid: 1 col mobile, 2 col tablet, 3 col desktop
- Glassmorphism cards: bg-white/5 backdrop-blur-sm border border-white/10
- Hover: scale(1.02) + border-blue-500/30

### Step 7: Implement HowItWorksSection
- Flex row with connecting line (hidden on mobile)
- Numbered circles: bg-blue-600 text-white rounded-full

### Step 8: Implement DemoSection
- Tab state management
- CSS-only dashboard mockup (rounded rects, dots, lines)
- Crossfade animation between tabs

### Step 9: Implement PricingSection
- Pricing data array with tier details
- Highlighted "Pro" card: ring-2 ring-blue-500, scale slightly larger
- "PHỔ BIẾN NHẤT" badge on Pro card

### Step 10: Implement FAQSection
- Accordion state: Set<number> for open indices
- ChevronDown rotation animation
- Height transition: max-height + overflow-hidden

### Step 11: Implement FooterCTA + Footer
- Gradient background section
- Simple footer with links

### Step 12: Add scroll animations
- Use Motion library's `motion.div` with `whileInView`
- `viewport={{ once: true, amount: 0.3 }}`
- Stagger children where appropriate

## Success Criteria

- [ ] All 10 sections render correctly
- [ ] Responsive on mobile (375px), tablet (768px), desktop (1280px)
- [ ] Smooth scroll navigation from header links
- [ ] All CTAs link to /login
- [ ] Pricing matches pricing-analysis plan (4 tiers)
- [ ] Animations smooth at 60fps
- [ ] Page loads under 1.5s (no external images)
- [ ] Accessible: proper heading hierarchy, contrast ratios

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Page too heavy (long component) | Medium | Single file ok — 800-1000 lines is manageable for a landing page |
| Animation jank on mobile | Medium | Use `will-change: transform`, limit simultaneous animations |
| Content not compelling | High | Copywriting follows AIDA + PAS frameworks, tested pain points |
| Screenshots/demo section looks fake | Medium | Use CSS mockups that resemble actual dashboard, not placeholder images |

## Next Steps
→ Phase 3: Login page standalone route
→ Phase 4: Polish & testing
