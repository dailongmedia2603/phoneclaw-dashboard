import { describe, it, expect } from 'vitest';
import { vietnameseToTelex, hasNonAscii } from '../helpers/vietnamese-telex';

describe('vietnameseToTelex', () => {
  it('passes ASCII through unchanged', () => {
    expect(vietnameseToTelex('Hello world!')).toBe('Hello world!');
    expect(vietnameseToTelex('123 abc')).toBe('123 abc');
  });

  it('returns empty for empty input', () => {
    expect(vietnameseToTelex('')).toBe('');
  });

  it('converts đ → dd', () => {
    expect(vietnameseToTelex('đêm')).toBe('ddeem');
    expect(vietnameseToTelex('Đẹp')).toBe('Ddejp');
  });

  it('converts vowel modifiers (â/ă/ê/ô/ơ/ư)', () => {
    expect(vietnameseToTelex('âu')).toBe('aau');
    expect(vietnameseToTelex('ăn')).toBe('awn');
    expect(vietnameseToTelex('ếch')).toBe('eesch');
    expect(vietnameseToTelex('ông')).toBe('oong');
    expect(vietnameseToTelex('ơi')).toBe('owi');
    expect(vietnameseToTelex('ưu')).toBe('uwu');
  });

  it('converts tones (sắc/huyền/hỏi/ngã/nặng)', () => {
    expect(vietnameseToTelex('má')).toBe('mas'); // sắc
    expect(vietnameseToTelex('mà')).toBe('maf'); // huyền
    expect(vietnameseToTelex('mả')).toBe('mar'); // hỏi
    expect(vietnameseToTelex('mã')).toBe('max'); // ngã
    expect(vietnameseToTelex('mạ')).toBe('maj'); // nặng
  });

  it('combines modifier + tone correctly', () => {
    expect(vietnameseToTelex('ấn')).toBe('aasn');     // â + sắc
    expect(vietnameseToTelex('ầm')).toBe('aafm');     // â + huyền
    expect(vietnameseToTelex('ốc')).toBe('oosc');     // ô + sắc
    expect(vietnameseToTelex('ồn')).toBe('oofn');     // ô + huyền
    expect(vietnameseToTelex('ỡ')).toBe('owx');       // ơ + ngã
    expect(vietnameseToTelex('ự')).toBe('uwj');       // ư + nặng
  });

  it('handles real-world phrases', () => {
    expect(vietnameseToTelex('đẹp quá')).toBe('ddejp quas');
    expect(vietnameseToTelex('ngon lành luôn')).toBe('ngon lafnh luoon');
    // Tone goes RIGHT AFTER the vowel char in our mapping; iOS Telex IM smart-input
    // handles this correctly (a → af = à, then o appended → chào).
    expect(vietnameseToTelex('xin chào')).toBe('xin chafo');
    expect(vietnameseToTelex('Việt Nam')).toBe('Vieejt Nam');
    expect(vietnameseToTelex('Tôi yêu em')).toBe('Tooi yeeu em');
  });

  it('preserves uppercase base char', () => {
    expect(vietnameseToTelex('Đẹp')).toBe('Ddejp');
    expect(vietnameseToTelex('Đường')).toBe('Dduwowfng');
    expect(vietnameseToTelex('XIN CHÀO')).toBe('XIN CHAfO');
  });

  it('passes punctuation and digits through', () => {
    expect(vietnameseToTelex('Hello, đẹp! 123')).toBe('Hello, ddejp! 123');
    expect(vietnameseToTelex('giá $5.99')).toBe('gias $5.99');
  });

  it('preserves emoji and other unicode (will fallback gracefully)', () => {
    // Emoji not in Vietnamese map → pass through (will fail at iOS HID, but that's
    // acceptable; user should know emoji isn't Vietnamese-typeable via Telex)
    expect(vietnameseToTelex('hot 🔥 đẹp')).toBe('hot 🔥 ddejp');
  });

  it('handles complex words (multi-modifier)', () => {
    expect(vietnameseToTelex('người')).toBe('nguwowfi');     // ng + ư + ờ + i
    expect(vietnameseToTelex('được')).toBe('dduwowjc');      // đ + ư + ợ + c
    expect(vietnameseToTelex('những')).toBe('nhuwxng');      // nh + ữ + ng
    expect(vietnameseToTelex('mượn')).toBe('muwowjn');       // m + ư + ợ + n
  });

  it('handles caption with newlines and emoji', () => {
    const input = 'Video hôm nay\nCực đẹp 🔥\n#fyp';
    const expected = 'Video hoom nay\nCucwj ddejp 🔥\n#fyp';
    // Note: 'Cực' = C + ự + c → C + uwj + c = 'Cucwj' — wait that's wrong order.
    // Actually 'ự' is in the map as 'uwj' so 'Cực' → 'C' + 'uwj' + 'c' = 'Cuwjc'
    // Let me re-check expected
    expect(vietnameseToTelex(input)).toBe('Video hoom nay\nCuwjc ddejp 🔥\n#fyp');
  });
});

describe('hasNonAscii', () => {
  it('detects Vietnamese chars', () => {
    expect(hasNonAscii('đẹp')).toBe(true);
    expect(hasNonAscii('hello đẹp')).toBe(true);
  });

  it('returns false for pure ASCII', () => {
    expect(hasNonAscii('Hello world!')).toBe(false);
    expect(hasNonAscii('')).toBe(false);
    expect(hasNonAscii('123 abc XYZ')).toBe(false);
  });

  it('detects emoji', () => {
    expect(hasNonAscii('🔥')).toBe(true);
  });
});
