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

/** Max display constraints for the screenshot image */
const MAX_IMG_WIDTH = 440;
const MAX_IMG_HEIGHT_VH = 0.65; // 65% of viewport height

export default function CoordinatePicker({ deviceId, mode = 'xy', onPick, onClose }: CoordinatePickerProps) {
  const [screenshotSrc, setScreenshotSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<{ x: number; y: number } | null>(null);
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const fetchScreenshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await control.screenshotLive(deviceId);
      if (res.success && res.data) {
        const base64 = typeof res.data === 'string' ? res.data : (res.data as any).data || res.data;
        setScreenshotSrc(typeof base64 === 'string' && !base64.startsWith('data:')
          ? `data:image/jpeg;base64,${base64}`
          : base64);
      } else {
        setError(res.error || 'Không thể chụp screenshot');
      }
    } catch {
      setError('Lỗi kết nối server');
    }
    setLoading(false);
  }, [deviceId]);

  // Load screenshot once on mount
  useEffect(() => {
    fetchScreenshot();
  }, [fetchScreenshot]);

  /** When image loads, compute explicit display dimensions (no object-fit guessing) */
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    const naturalW = img.naturalWidth;
    const naturalH = img.naturalHeight;
    if (!naturalW || !naturalH) return;

    const maxH = window.innerHeight * MAX_IMG_HEIGHT_VH;
    const scale = Math.min(MAX_IMG_WIDTH / naturalW, maxH / naturalH, 1);

    setImgSize({
      w: Math.round(naturalW * scale),
      h: Math.round(naturalH * scale),
    });
  }, []);

  /** Simple coordinate calculation: click position / image display size */
  const calcNormalized = useCallback((e: React.MouseEvent) => {
    const img = imgRef.current;
    if (!img || !imgSize) return null;

    const rect = img.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Clamp to 0-1
    if (x < 0 || x > 1 || y < 0 || y > 1) return null;

    return {
      x: parseFloat(x.toFixed(3)),
      y: parseFloat(y.toFixed(3)),
    };
  }, [imgSize]);

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
      <div className="bg-white rounded-2xl shadow-2xl max-w-[500px] max-h-[90vh] flex flex-col overflow-hidden">
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
        <div className="relative bg-slate-900 flex items-center justify-center p-2"
             style={{ minHeight: 300 }}>
          {screenshotSrc ? (
            <div className="relative" style={imgSize ? { width: imgSize.w, height: imgSize.h } : undefined}>
              <img
                ref={imgRef}
                src={screenshotSrc}
                alt="Device screen"
                onLoad={handleImageLoad}
                draggable={false}
                className="cursor-crosshair select-none block"
                style={imgSize ? { width: imgSize.w, height: imgSize.h } : { maxWidth: MAX_IMG_WIDTH, maxHeight: '65vh' }}
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHover(null)}
                onClick={handleClick}
              />

              {/* Hover crosshair */}
              {hover && imgSize && (
                <>
                  {/* Vertical line */}
                  <div className="absolute top-0 bottom-0 w-px bg-cyan-400/50 pointer-events-none"
                       style={{ left: hover.x * imgSize.w }} />
                  {/* Horizontal line */}
                  <div className="absolute left-0 right-0 h-px bg-cyan-400/50 pointer-events-none"
                       style={{ top: hover.y * imgSize.h }} />
                  {/* Center dot */}
                  <div className="absolute w-3 h-3 rounded-full bg-cyan-400 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                       style={{ left: hover.x * imgSize.w, top: hover.y * imgSize.h }} />
                </>
              )}

              {/* Picked point marker */}
              {picked && imgSize && (
                <div className="absolute w-7 h-7 rounded-full border-2 border-red-500 bg-red-500/20 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                     style={{ left: picked.x * imgSize.w, top: picked.y * imgSize.h }}>
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          ) : (
            <div className="text-slate-400 text-sm text-center px-8 py-16">
              {loading ? (
                <div className="space-y-2">
                  <RefreshCw size={24} className="animate-spin mx-auto text-blue-400" />
                  <div>Đang kết nối VNC và chụp màn hình...</div>
                  <div className="text-xs text-slate-500">Có thể mất 2-3 giây</div>
                </div>
              ) : error ? (
                <div className="space-y-2">
                  <div className="text-red-400">{error}</div>
                  <button onClick={fetchScreenshot} className="text-blue-400 hover:text-blue-300 underline text-xs">
                    Thử lại
                  </button>
                </div>
              ) : (
                'Không thể tải screenshot'
              )}
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
