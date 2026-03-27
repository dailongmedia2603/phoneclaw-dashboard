import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Crosshair, MousePointerClick, Loader2 } from 'lucide-react';
import { control, settings } from '../../services/api';

interface CoordinatePickerProps {
  deviceId: string;
  mode?: 'xy' | 'from' | 'to' | 'fallback';
  onPick: (x: number, y: number) => void;
  onClose: () => void;
}

export default function CoordinatePicker({ deviceId, mode = 'xy', onPick, onClose }: CoordinatePickerProps) {
  const [vncReady, setVncReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [picked, setPicked] = useState<{ x: number; y: number } | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Start VNC proxy on mount
  useEffect(() => {
    setLoading(true);
    setError(null);
    settings.startVncProxy(deviceId).then(res => {
      if (res.success) {
        setVncReady(true);
      } else {
        setError(res.error || 'Không thể khởi động VNC proxy');
      }
      setLoading(false);
    }).catch(() => {
      setError('Lỗi kết nối server');
      setLoading(false);
    });
  }, [deviceId]);

  /** Calculate normalized coords from click on the overlay */
  const calcNormalized = useCallback((e: React.MouseEvent) => {
    const overlay = overlayRef.current;
    if (!overlay) return null;

    const rect = overlay.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    if (x < 0 || x > 1 || y < 0 || y > 1) return null;

    return {
      x: parseFloat(x.toFixed(3)),
      y: parseFloat(y.toFixed(3)),
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

  const handleTestTap = async () => {
    if (!picked) return;
    setTestResult(`Đang tap ${picked.x}, ${picked.y}...`);
    const res = await control.tap(deviceId, picked.x, picked.y);
    setTestResult(`Tap ${picked.x},${picked.y} → ${res.success ? 'OK' : res.error}`);
  };

  const modeLabels: Record<string, string> = {
    xy: 'Chọn vị trí tap',
    from: 'Chọn điểm BẮT ĐẦU',
    to: 'Chọn điểm KẾT THÚC',
    fallback: 'Chọn vị trí fallback',
  };
  const modeLabel = modeLabels[mode] || 'Chọn vị trí tap';

  const token = localStorage.getItem('phoneclaw_token') || '';
  const vncUrl = `/api/vnc-viewer/${deviceId}?token=${token}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
           style={{ width: 400, height: '85vh', maxHeight: 900 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            <Crosshair size={18} className="text-blue-600" />
            <span className="font-semibold text-sm text-slate-800">{modeLabel}</span>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
            <X size={16} className="text-slate-500" />
          </button>
        </div>

        {/* Live VNC area */}
        <div className="flex-1 relative bg-slate-900 overflow-hidden">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Loader2 size={24} className="animate-spin text-blue-400 mb-2" />
              <div>Đang kết nối VNC...</div>
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 text-sm px-8 text-center">
              <div>{error}</div>
            </div>
          ) : vncReady ? (
            <>
              {/* noVNC iframe - same as device detail page */}
              <iframe
                ref={iframeRef}
                src={vncUrl}
                className="w-full h-full border-0"
                allow="clipboard-read; clipboard-write"
              />

              {/* Transparent overlay to intercept clicks for coordinate picking */}
              <div
                ref={overlayRef}
                className="absolute inset-0 cursor-crosshair z-10"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => setHover(null)}
                onClick={handleClick}
              >
                {/* Hover crosshair */}
                {hover && (
                  <>
                    <div className="absolute top-0 bottom-0 w-px bg-cyan-400/50 pointer-events-none"
                         style={{ left: `${hover.x * 100}%` }} />
                    <div className="absolute left-0 right-0 h-px bg-cyan-400/50 pointer-events-none"
                         style={{ top: `${hover.y * 100}%` }} />
                    <div className="absolute w-3 h-3 rounded-full bg-cyan-400 border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                         style={{ left: `${hover.x * 100}%`, top: `${hover.y * 100}%` }} />
                  </>
                )}

                {/* Picked point marker */}
                {picked && (
                  <div className="absolute w-7 h-7 rounded-full border-2 border-red-500 bg-red-500/20 pointer-events-none -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                       style={{ left: `${picked.x * 100}%`, top: `${picked.y * 100}%` }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Debug / test result */}
        {testResult && (
          <div className="px-4 py-1 border-t border-slate-100 bg-slate-50 text-[10px] font-mono text-orange-500">
            {testResult}
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="text-xs text-slate-500 space-y-0.5">
            {hover && (
              <div>Cursor: <span className="font-mono text-slate-700">x={hover.x} y={hover.y}</span></div>
            )}
            {picked && (
              <div>Đã chọn: <span className="font-mono text-red-600 font-semibold">x={picked.x} y={picked.y}</span></div>
            )}
            {!hover && !picked && (
              <div>Click vào màn hình để chọn toạ độ</div>
            )}
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <button
              onClick={handleTestTap}
              disabled={!picked}
              className="px-3 py-1.5 text-sm font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:bg-slate-100 disabled:text-slate-400 rounded-lg transition-colors flex items-center gap-1"
              title="Gửi tap thử tới thiết bị"
            >
              <MousePointerClick size={14} /> Test
            </button>
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
