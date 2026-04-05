# Phase 2: Swap route / và cleanup

## Overview
- **Priority**: P2
- **Status**: Pending
- **Effort**: 0.5h

Sau khi user approve LandingPageV2 tại `/landing`, swap nó vào route `/` và xóa LandingPage.tsx cũ.

## Implementation Steps

### Step 1: Swap routes trong App.tsx
```tsx
// Đổi:
<Route path="/" element={<LandingPageV2 />} />
// Xóa route /landing
```

### Step 2: Cleanup
- Xóa `src/components/LandingPage.tsx` (bản cũ)
- Rename `LandingPageV2.tsx` → `LandingPage.tsx`
- Update import trong App.tsx

## Success Criteria
- [ ] `/` shows LandingPageV2
- [ ] Build không lỗi
- [ ] Không còn code chết
