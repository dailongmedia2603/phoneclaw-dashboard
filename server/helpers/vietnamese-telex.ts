/**
 * Convert Vietnamese text → Telex ASCII sequence.
 *
 * Used so that when sent via HID keyboard events to an iPhone running with
 * "Vietnamese - Telex" keyboard active, the iOS Input Method (UIKeyboardImpl +
 * TIInputManager) converts the ASCII keystrokes back to Vietnamese text in
 * real-time — exactly like a human typing on the iPhone keyboard.
 *
 * This avoids UIPasteboard entirely → no "Pasted from X" banner, no auto-spacing
 * artefacts, and the typing looks natural to the receiving app (TikTok, etc.).
 *
 * Telex rules used:
 *   Vowel modifiers (typed AFTER the base vowel):
 *     â = aa,  ă = aw,  ê = ee,  ô = oo,  ơ = ow,  ư = uw,  đ = dd
 *   Tones (typed AFTER the modified vowel):
 *     sắc  (´) = s
 *     huyền (`) = f
 *     hỏi  (ˀ) = r
 *     ngã  (˜) = x
 *     nặng (.) = j
 *
 * Example:
 *   "Đẹp quá!" → "DDejp quas!"
 *   "Xin chào em yêu" → "Xin chaof em yeeu"
 *   "đường" → "dduwowfng"  (đ + ư + ờ + n + g; ờ = ow + f huyền)
 *
 * iOS Telex IM with smart-input handles tone reordering automatically.
 *
 * Note: ASCII chars and punctuation pass through unchanged.
 */

// Map: Vietnamese char → Telex sequence (vowel base + modifier letter + tone letter)
const VN_TO_TELEX: Record<string, string> = {
  // a family
  'a': 'a', 'á': 'as', 'à': 'af', 'ả': 'ar', 'ã': 'ax', 'ạ': 'aj',
  'ă': 'aw', 'ắ': 'aws', 'ằ': 'awf', 'ẳ': 'awr', 'ẵ': 'awx', 'ặ': 'awj',
  'â': 'aa', 'ấ': 'aas', 'ầ': 'aaf', 'ẩ': 'aar', 'ẫ': 'aax', 'ậ': 'aaj',
  // e family
  'e': 'e', 'é': 'es', 'è': 'ef', 'ẻ': 'er', 'ẽ': 'ex', 'ẹ': 'ej',
  'ê': 'ee', 'ế': 'ees', 'ề': 'eef', 'ể': 'eer', 'ễ': 'eex', 'ệ': 'eej',
  // i family
  'i': 'i', 'í': 'is', 'ì': 'if', 'ỉ': 'ir', 'ĩ': 'ix', 'ị': 'ij',
  // o family
  'o': 'o', 'ó': 'os', 'ò': 'of', 'ỏ': 'or', 'õ': 'ox', 'ọ': 'oj',
  'ô': 'oo', 'ố': 'oos', 'ồ': 'oof', 'ổ': 'oor', 'ỗ': 'oox', 'ộ': 'ooj',
  'ơ': 'ow', 'ớ': 'ows', 'ờ': 'owf', 'ở': 'owr', 'ỡ': 'owx', 'ợ': 'owj',
  // u family
  'u': 'u', 'ú': 'us', 'ù': 'uf', 'ủ': 'ur', 'ũ': 'ux', 'ụ': 'uj',
  'ư': 'uw', 'ứ': 'uws', 'ừ': 'uwf', 'ử': 'uwr', 'ữ': 'uwx', 'ự': 'uwj',
  // y family
  'y': 'y', 'ý': 'ys', 'ỳ': 'yf', 'ỷ': 'yr', 'ỹ': 'yx', 'ỵ': 'yj',
  // d/đ
  'd': 'd', 'đ': 'dd',
};

// Same map for uppercase. iOS Telex IM is case-insensitive for modifier letters
// (typing "Aa" gives "Â", "AA" gives "Â", etc.) — we preserve case of the BASE letter
// and use lowercase modifiers, which IM accepts.
function mapUpperVowel(ch: string): string {
  const lower = ch.toLowerCase();
  const telex = VN_TO_TELEX[lower];
  if (!telex) return ch;
  // Capitalise first character of telex sequence (the base vowel/consonant)
  return telex.charAt(0).toUpperCase() + telex.slice(1);
}

/**
 * Convert Vietnamese (or mixed) text to Telex ASCII.
 * Non-Vietnamese chars (ASCII letters, digits, punctuation, emoji) pass through.
 */
export function vietnameseToTelex(text: string): string {
  if (!text) return text;
  let result = '';
  for (const ch of text) {
    const lower = ch.toLowerCase();
    if (VN_TO_TELEX[lower]) {
      result += (ch === lower ? VN_TO_TELEX[lower] : mapUpperVowel(ch));
    } else {
      // Non-Vietnamese (English letters, digits, punctuation, emoji) — pass through
      result += ch;
    }
  }
  return result;
}

/**
 * Returns true if text contains any non-ASCII (likely Vietnamese / emoji) chars.
 */
export function hasNonAscii(text: string): boolean {
  return /[^\x00-\x7F]/.test(text);
}
