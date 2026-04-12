import Jimp from 'jimp';

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/** Parse hex color string (#RGB, #RRGGBB, with/without hash) → RGB. null if invalid. */
export function parseHexColor(hex: string): RGB | null {
  if (!hex || typeof hex !== 'string') return null;
  let h = hex.trim().replace(/^#/, '').toLowerCase();
  if (h.length === 3) {
    h = h.split('').map(c => c + c).join('');
  }
  if (h.length !== 6 || !/^[0-9a-f]{6}$/.test(h)) return null;
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

/** Format RGB → hex string. */
export function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Compare 2 colors with per-channel tolerance (Chebyshev distance).
 * Returns true if MAX(|dr|, |dg|, |db|) <= tolerance.
 */
export function compareColor(a: RGB, b: RGB, tolerance: number): boolean {
  const t = Math.max(0, tolerance);
  return (
    Math.abs(a.r - b.r) <= t &&
    Math.abs(a.g - b.g) <= t &&
    Math.abs(a.b - b.b) <= t
  );
}

/** Decode base64 JPEG → Jimp image instance. Throws on decode failure. */
export async function decodeJpegBase64(base64: string): Promise<typeof Jimp.prototype> {
  if (!base64 || typeof base64 !== 'string') {
    throw new Error('decodeJpegBase64: input rỗng hoặc không phải string');
  }
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length < 10) {
    throw new Error(`decodeJpegBase64: buffer quá nhỏ (${buffer.length} bytes)`);
  }
  const img = await Jimp.read(buffer);
  return img;
}

/**
 * Get pixel RGB at normalized (0-1) coordinates.
 * Clamps if out of range. Throws if image null.
 */
export function getPixelAt(img: any, nx: number, ny: number): RGB {
  if (!img || !img.bitmap) throw new Error('getPixelAt: image null hoặc không có bitmap');
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  if (w <= 0 || h <= 0) throw new Error(`getPixelAt: image size invalid (${w}x${h})`);

  const cx = Math.max(0, Math.min(1, nx));
  const cy = Math.max(0, Math.min(1, ny));
  const px = Math.min(w - 1, Math.floor(cx * w));
  const py = Math.min(h - 1, Math.floor(cy * h));

  const pixelInt = img.getPixelColor(px, py);
  const { r, g, b } = Jimp.intToRGBA(pixelInt);
  return { r, g, b };
}

/**
 * Convenience: from base64 screenshot → decode → get pixel → hex.
 * Used by API endpoint sample-color.
 */
export async function sampleColorFromScreenshot(
  screenshotBase64: string,
  pixelX: number,
  pixelY: number
): Promise<{ color: string; rgb: RGB }> {
  const img = await decodeJpegBase64(screenshotBase64);
  const rgb = getPixelAt(img, pixelX, pixelY);
  return { color: rgbToHex(rgb), rgb };
}
