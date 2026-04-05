# Phase 4: Polish, SEO & Testing

## Overview
- **Priority**: P2
- **Status**: Pending
- **Effort**: 1h

SEO meta tags, OG tags, performance tuning, responsive testing.

## Implementation Steps

### Step 1: SEO Meta Tags
Update `index.html`:
```html
<title>Phone Agent — Nền tảng tự động hoá iPhone #1 Việt Nam</title>
<meta name="description" content="Quản lý hàng trăm iPhone từ một dashboard. Tự động hoá TikTok, Facebook, Instagram. Script editor kéo thả, lịch trình 24/7, proxy & GPS spoof." />

<!-- Open Graph -->
<meta property="og:title" content="Phone Agent — Tự động hoá iPhone hàng loạt" />
<meta property="og:description" content="Quản lý & tự động hoá hàng trăm iPhone từ một màn hình. Không cần code." />
<meta property="og:image" content="https://phoneagent.io.vn/og-image.png" />
<meta property="og:url" content="https://phoneagent.io.vn/" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
```

### Step 2: Vite config for SPA routing
Ensure `vite.config.ts` has history fallback (for dev):
```ts
server: {
  // ... existing config
}
```
Production: Nginx `try_files $uri /index.html` (likely already configured).

### Step 3: Performance checklist
- [ ] No external font loading (use system fonts)
- [ ] No external images (CSS mockups only)
- [ ] Lazy load below-fold sections (optional — page is single component)
- [ ] Motion animations use GPU-accelerated properties only (transform, opacity)
- [ ] No layout shifts during scroll animations

### Step 4: Responsive testing
Test breakpoints:
- 375px (iPhone SE)
- 390px (iPhone 14)
- 768px (iPad)
- 1024px (iPad landscape)
- 1280px (Desktop)
- 1536px (Large desktop)

### Step 5: Accessibility check
- [ ] Heading hierarchy: h1 (hero) → h2 (sections) → h3 (cards)
- [ ] Color contrast: white text on dark bg > 4.5:1
- [ ] Focus states on all interactive elements
- [ ] Alt text on any images
- [ ] Keyboard navigation for FAQ accordion

## Success Criteria

- [ ] Lighthouse Performance > 90
- [ ] Lighthouse SEO > 90
- [ ] Lighthouse Accessibility > 90
- [ ] OG tags render correctly when sharing URL
- [ ] All breakpoints render correctly
- [ ] No console errors or warnings

## Next Steps
→ Deploy and verify on https://phoneagent.io.vn/
