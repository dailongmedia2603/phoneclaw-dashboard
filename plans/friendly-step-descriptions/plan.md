# Plan: Mo ta buoc thuc thi than thien nguoi dung

## Tong quan
Thay doi ham `describeStep()` trong `server/services/script-engine.ts` tu mo ta ky thuat (tieng Anh) sang mo ta than thien (tieng Viet), dua theo ten node trong nodeDefinitions.

## Hien trang

### `describeStep()` hien tai (script-engine.ts:458-476):
```
tap → "Tap at (0.5, 0.5)"
launch → "Launch app: com.ss.iphone.ugc.Ame"
swipe → "Swipe from (0.5,0.8) to (0.5,0.2)"
wait → "Wait 5s"
```

### Mong muon:
```
tap → "Tap toa do (0.5, 0.5)" hoac ten custom node
launch → "Mo TikTok VN" / "Mo TikTok US" / "Mo Facebook"
swipe → "Luot len" / "Luot xuong" / "Vuot toa do"
wait → "Cho 5 giay"
repeat → "Lap lai 5 lan"
```

## Giai phap

**1 file duy nhat:** `server/services/script-engine.ts`

Thay doi ham `describeStep()` — thay cac chuoi tieng Anh bang tieng Viet, dung logic tuong tu `findNodeType` de nhan dien node cu the.

### Mapping cu the:

| step.type | Dieu kien | Mo ta moi |
|-----------|-----------|-----------|
| tap | - | `Tap toạ độ (x, y)` |
| double_tap | - | `Double tap (x, y)` |
| tap_image | - | `Tap hình ảnh: {templateName}` |
| swipe | match swipe_up defaults | `Lướt lên` |
| swipe | match swipe_down defaults | `Lướt xuống` |
| swipe | match swipe_left defaults | `Lướt trái` |
| swipe | match swipe_right defaults | `Lướt phải` |
| swipe | otherwise | `Vuốt toạ độ` |
| type | - | `Gõ text: "{text}"` |
| key | home | `Nút Home` |
| key | other | `Phím: {key}` |
| launch | com.ss.iphone.ugc.Ame | `Mở TikTok VN` |
| launch | com.zhiliaoapp.musically | `Mở TikTok US` |
| launch | com.facebook.Facebook | `Mở Facebook` |
| launch | other | `Mở app: {bundleId}` |
| screenshot | - | `Chụp ảnh màn hình` |
| clipboard | text set | `Đặt clipboard: "{text}"` |
| clipboard | read | `Đọc clipboard` |
| wait | - | `Chờ {seconds} giây` |
| wait_random | - | `Chờ ngẫu nhiên {min}-{max} giây` |
| repeat | - | `Lặp lại {count} lần` |
| repeat_forever | - | `Lặp vô hạn` |
| send_file | - | `Truyền file video` |
| select_video | - | `Chọn video` |
| clear_photos | - | `Xoá Photos` |

### Code:

```typescript
function describeStep(step: ScriptStep): string {
  const p = step.params;
  switch (step.type) {
    case 'tap': return `Tap toạ độ (${p.x}, ${p.y})`;
    case 'double_tap': return `Double tap (${p.x}, ${p.y})`;
    case 'tap_image': return `Tap hình ảnh: ${p.templateName}`;
    case 'swipe': {
      if (p.fromY === 0.8 && p.toY === 0.2) return 'Lướt lên';
      if (p.fromY === 0.35 && p.toY === 0.85) return 'Lướt xuống';
      if (p.fromX === 0.95 && p.toX === 0.05) return 'Lướt trái';
      if (p.fromX === 0.05 && p.toX === 0.95) return 'Lướt phải';
      return 'Vuốt toạ độ';
    }
    case 'type': return `Gõ text: "${p.text}"`;
    case 'key': {
      if (p.key === 'home') return 'Nút Home';
      return `Phím: ${p.key}`;
    }
    case 'launch': {
      const APP_NAMES: Record<string, string> = {
        'com.ss.iphone.ugc.Ame': 'Mở TikTok VN',
        'com.zhiliaoapp.musically': 'Mở TikTok US',
        'com.facebook.Facebook': 'Mở Facebook',
      };
      return APP_NAMES[p.bundleId as string] || `Mở app: ${p.bundleId}`;
    }
    case 'screenshot': return 'Chụp ảnh màn hình';
    case 'clipboard': return p.text ? `Đặt clipboard: "${p.text}"` : 'Đọc clipboard';
    case 'send_file': return 'Truyền file video';
    case 'select_video': return 'Chọn video';
    case 'clear_photos': return 'Xoá Photos';
    case 'wait': return `Chờ ${p.seconds} giây`;
    case 'wait_random': return `Chờ ngẫu nhiên ${p.min}-${p.max} giây`;
    case 'repeat': return `Lặp lại ${p.count} lần`;
    case 'repeat_forever': return 'Lặp vô hạn';
    default: return step.type;
  }
}
```

## Pham vi anh huong

- **Thay doi:** 1 ham duy nhat `describeStep()` trong `script-engine.ts`
- **Ap dung tu dong cho:** tien trinh thuc thi (popup chay kich ban) + nhat ky (execution history/logs)
- **Khong anh huong:** logic chay script, luu tru, API, frontend — chi thay doi chuoi mo ta

## Swipe detection logic

Dua theo default params tu nodeDefinitions.ts:
- swipe_up: fromY=0.8, toY=0.2
- swipe_down: fromY=0.35, toY=0.85
- swipe_left: fromX=0.95, toX=0.05
- swipe_right: fromX=0.05, toX=0.95

So sanh tuong doi (Number(p.fromY) dung de handle string vs number).
