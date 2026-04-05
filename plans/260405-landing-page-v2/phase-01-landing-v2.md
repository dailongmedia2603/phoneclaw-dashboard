# Phase 1: Tạo LandingPageV2 + Route /landing

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 3.5h

Viết LandingPageV2.tsx theo phong cách template ZACA (light theme, orange gradient, rounded cards) với nội dung Phone Agent. Mount tại `/landing` để preview.

## Implementation Steps

### Step 1: Thêm CSS keyframes cho animate-blob
Thêm vào `src/index.css`:
```css
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}
```

### Step 2: Tạo LandingPageV2.tsx
Component gồm 11 sections, mỗi section là inline function.

**Section 1 — Navbar (floating pill)**
- Design: `bg-white/80 backdrop-blur-md rounded-full` floating ở top
- Logo Phone Agent (trái) + Nav links (giữa) + Đăng nhập + CTA (phải)
- Mobile: hamburger menu

**Section 2 — Hero (orange gradient)**
- Design: `bg-gradient-to-b from-[#f97316] to-[#c2410c]` + animated blobs
- Badge: "Nền tảng #1 tự động hoá iPhone tại Việt Nam"
- H1: "Quản lý hàng trăm iPhone từ một màn hình duy nhất"
- Sub: "Tự động hoá mọi thao tác — từ lướt TikTok, đăng video, đến quản lý hàng loạt tài khoản. Không cần code. Chạy 24/7."
- CTA1: "Dùng thử miễn phí" (yellow-400 button)
- CTA2: "Xem demo" (white/10 border button)

**Section 3 — IntrigueBullets (3 cards)**
- Design: `bg-gray-50`, 3-col grid, white cards rounded-3xl
- Heading: "Những tính năng bạn sẽ yêu thích"
- Card 1: Wand2 icon, "Script Editor trực quan", "Kéo thả để tạo kịch bản tự động..."
- Card 2: Cpu icon, "Quản lý đa thiết bị", "Theo dõi hàng trăm iPhone cùng lúc..."
- Card 3: CalendarDays icon, "Lịch trình tự động 24/7", "Đặt lịch chạy script..."

**Section 4 — PainPoints (2 cols: pain list + stat card)**
- Design: `bg-slate-50`, glow blobs, 7-col + 5-col grid
- H2: "Sự thật về việc quản lý iPhone thủ công"
- Pain 1: "Bạn có đang mệt mỏi vì phải lặp đi lặp lại cùng thao tác trên từng máy?"
- Pain 2: "Bạn có đang thức đêm để chạy chiến dịch đúng giờ vì không có lịch trình tự động?"
- Pain 3: "Tài khoản liên tục bị ban vì dùng chung IP, cùng vị trí cho nhiều máy?"
- Stat card: "90% thời gian lãng phí vào thao tác lặp đi lặp lại" + progress bar animation

**Section 5 — Solution (chat mockup + text)**
- Design: white bg, 2 cols (6+6)
- Left: Dashboard mockup (CSS) — browser frame với stats row + device list
- Right: Badge "Giải pháp đột phá" + H2: "Giới thiệu Phone Agent" + subtitle + 2 feature cards:
  - "Script Editor kéo thả" — ShieldCheck icon, desc
  - "Lịch trình Cron 24/7" — Clock icon, desc

**Section 6 — Credibility (orange gradient band)**
- Design: full-width orange gradient
- Quote: "Phone Agent tự hào sử dụng công nghệ hàng đầu..."
- 3 tech badges: Tailscale VPN / WebSocket Real-time / End-to-End Encryption

**Section 7 — Benefits (bento grid 5 cards)**
- Design: white bg, 3-col bento grid
- H2: "Biến tính năng thành hiệu quả"
- Card 1 (2-col): Wand2, "Script Editor trực quan", "Kéo thả node-based...", badge "Không cần code"
- Card 2: Zap, "Tự động phản hồi 24/7", badge "x3 Hiệu suất"
- Card 3: CalendarDays, "Lịch trình thông minh", badge "Tự động 100%"
- Card 4: Monitor, "Điều khiển từ xa", badge "Real-time"
- Card 5: Shield, "Proxy & GPS Spoof", badge "An toàn"

**Section 8 — UseCases (tabbed)**
- Design: white bg, left tabs + right content panel
- 6 tabs: TikTok Agency / Dropshipper / MMO Freelancer / Livestream / Marketing / E-commerce
- Each tab: Problem card (red border) + Solution card (blue bg) + 2 bottom cards (Not Lose + Gain)

**Section 9 — SocialProof (4 testimonial cards)**
- Design: slate-50 bg, masonry grid (alternate offset)
- 4 testimonials with avatar (pravatar), name, role, content, 5 stars

**Section 10 — Pricing (4 plans)**
- Design: slate-50 bg, 4-col grid
- Starter 49K / Basic 99K / Pro 249K (highlighted) / Business 499K
- Features list per plan matching pricing-analysis
- CTA buttons: "Bắt đầu" / "Bắt đầu ngay" (highlighted) / "Liên hệ"

**Section 11 — Footer (dark)**
- Design: bg-gray-900, multi-column
- Logo + desc + social icons
- Columns: Sản phẩm / Tính năng / Pháp lý
- Copyright

### Step 3: Add route /landing in App.tsx
```tsx
import LandingPageV2 from './components/LandingPageV2';
// ...
<Route path="/landing" element={<LandingPageV2 />} />
```

## Success Criteria
- [ ] `/landing` renders LandingPageV2 với phong cách giống template ZACA
- [ ] Nội dung hoàn toàn về Phone Agent
- [ ] Responsive trên mobile/tablet/desktop
- [ ] Animations smooth (motion whileInView)
- [ ] All CTAs link to /login
- [ ] Build không lỗi

## Related Code Files
| File | Action | Description |
|------|--------|-------------|
| `src/components/LandingPageV2.tsx` | create | Component mới |
| `src/App.tsx` | modify | Thêm route /landing |
| `src/index.css` | modify | Thêm animate-blob keyframes |
