import { useState, useEffect, useRef, useCallback } from 'react';
import { X, RefreshCw, Crosshair } from 'lucide-react';
import { control } from '../../services/api';

interface CoordinatePickerProps {
  deviceId: string;
  /** Which coordinate fields to pick: 'xy' for tap, 'from'/'to' for swipe, 'fallback' for tap_image */
  mode?: 'xy' | 'from' | 'to' | 'fallback';
  onPick: (x: number, y: number) => void;
  onClose: () => void;
}

export default function CoordinatePicker({ deviceId, mode = 'xy', onPick, onClose }: CoordinatePickerProps) {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchScreenshot = useCallback(async () => {
    setLoading(true);
    try {
      const res = await control.screenshot(deviceId);
      if (res.success && res.data) {
        // data could be base64 string or {data: base64}
        const base64 = typeof res.data === 'string' ? res.data : (res.data as any).data || res.data;
        setScreenshot(typeof base64 === 'string' && !base64.startsWith('data:')
          ? `data:image/jpeg;base64,${base64}`
          : base64);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [deviceId]);

  // Initial load + auto-refresh every 3s
  useEffect(() => {
    fetchScreenshot();
    intervalRef.current = setInterval(fetchScreenshot, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchScreenshot]);

  /** Calculate normalized coords from click/hover, accounting for letterboxing */
  const calcNormalized = useCallback((e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img) return null;

    // Get the actual rendered image area within the element (handles object-fit: contain letterboxing)
    const rect = img.getBoundingClientRect();
    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;

    if (!naturalW || !naturalH) return null;

    // Calculate actual image render area (object-fit: contain)
    const containerRatio = rect.width / rect.height;
    const imageRatio = naturalW / naturalH;

    let renderW: number, renderH: number, offsetX: number, offsetY: number;

    if (imageRatio > containerRatio) {
      // Image wider than container → letterbox top/bottom
      renderW = rect.width;
      renderH = rect.width / imageRatio;
      offsetX = 0;
      offsetY = (rect.height - renderH) / 2;
    } else {
      // Image taller than container → letterbox left/right
      renderH = rect.height;
      renderW = rect.height * imageRatio;
      offsetX = (rect.width - renderW) / 2;
      offsetY = 0;
    }

    const localX = e.clientX - rect.left - offsetX;
    const localY = e.clientY - rect.top - offsetY;

    // Out of image bounds
    if (localX < 0 || localX > renderW || localY < 0 || localY > renderH) return null;

    return {
      x: parseFloat((localX / renderW).toFixed(3)),
      y: parseFloat((localY / renderH).toFixed(3)),
    };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setHover(calcNormalized(e));
  }, [calcNormalized]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const coords = calcNormalized(e);
    if (coords) setPicked(coords);
  }, [calcNormalized]);

  const handleConfirm = () => {
    if (picked) {
      onPick(picked.x, picked.y);
      onClose();
    }
  };

  const modeLabels: Record<string, string> = {
    xy: 'Chọn vị trí tap',
    from: 'Chọn điểm BẮT ĐẦU',
    to: 'Chọn điểm KẾT THÚC',
    fallback: 'Chọn vị trí fallback',
  };
  const modeLabel = modeLabels[mode] || 'Chọn vị trí tap';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Crosshair size={18} className="text-blue-600" />
            <span className="font-semibold text-sm text-slate-800">{modeLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchScreenshot}
              disabled={loading}
              className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
              title="Refresh screenshot"
            >
              <RefreshCw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X size={16} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Screenshot area */}
        <div className="flex-1 relative bg-slate-900 flex items-center justify-center min-h-[400px]">
          {screenshot ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                ref={imgRef}
                src={screenshot}
                alt="Device screen"
                className="max-w-full max-h-[60vh] object-contain cursor-crosshair select-none"
                draggable={false}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHover(null)}
                onClick={handleClick}
              />

              {/* Hover crosshair indicator */}
              {hover && imgRef.current && (
                <div
                  className="absolute pointer-events-none z-10"
                  style={getOverlayStyle(hover, imgRef.current)}
                >
                  {/* Vertical line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/60 -translate-x-1/2" />
                  {/* Horizontal line */}
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/60 -translate-y-1/2" />
                  {/* Center dot */}
                  <div className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full bg-blue-500 border border-white -translate-x-1/2 -translate-y-1/2" />
                </div>
              )}

              {/* Picked point marker */}
              {picked && imgRef.current && (
                <div
                  className="absolute pointer-events-none z-20"
                  style={getOverlayStyle(picked, imgRef.current)}
                >
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-6 h-6 rounded-full border-2 border-red-500 bg-red-500/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-sm">
              {loading ? 'Đang tải screenshot...' : 'Không thể tải screenshot'}
            </div>
          )}
        </div>

        {/* Footer: coordinates + confirm */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="text-xs text-slate-500 space-y-0.5">
            {hover && (
              <div>Cursor: <span className="font-mono text-slate-700">x={hover.x} y={hover.y}</span></div>
            )}
            {picked && (
              <div>Đã chọn: <span className="font-mono text-red-600 font-semibold">x={picked.x} y={picked.y}</span></div>
            )}
            {!hover && !picked && (
              <div>Click vào screenshot để chọn toạ độ</div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleConfirm}
              disabled={!picked}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 rounded-lg transition-colors"
            >
              Xác nhận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Calculate CSS position for the overlay indicator on top of the <img> */
function getOverlayStyle(
  point: { x: number; y: number },
  img: HTMLImageElement,
): React.CSSProperties {
  const rect = img.getBoundingClientRect();
  const parent = img.parentElement!.getBoundingClientRect();
  const naturalW = img.naturalWidth;
  const naturalH = img.naturalHeight;

  const containerRatio = rect.width / rect.height;
  const imageRatio = naturalW / naturalH;

  let renderW: number, renderH: number, offsetX: number, offsetY: number;

  if (imageRatio > containerRatio) {
    renderW = rect.width;
    renderH = rect.width / imageRatio;
    offsetX = 0;
    offsetY = (rect.height - renderH) / 2;
  } else {
    renderH = rect.height;
    renderW = rect.height * imageRatio;
    offsetX = (rect.width - renderW) / 2;
    offsetY = 0;
  }

  return {
    left: rect.left - parent.left + offsetX + point.x * renderW,
    top: rect.top - parent.top + offsetY + point.y * renderH,
    width: 0,
    height: 0,
  };
}
