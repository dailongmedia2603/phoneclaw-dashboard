import { Router } from 'express';
import { getDevice, findDeviceGlobal } from '../services/device-manager';
import { getAuthUserId, isAdmin } from '../helpers/get-user';

const router = Router();

// GET /api/vnc-viewer/:deviceId — returns HTML that auto-connects noVNC with password
router.get('/:deviceId', (req, res) => {
  // Tìm device + kiểm tra ownership
  const userId = getAuthUserId(req);
  const found = findDeviceGlobal(req.params.deviceId);
  const device = found?.device ?? getDevice(req.params.deviceId);
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

  if (found && !isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  const vncPath = `vnc/${device.id}/websockify`;
  const password = device.vncPassword || '';

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${device.name} - PhoneClaw VNC</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: 100%; height: 100%; overflow: hidden; background: #0f172a; }
  #screen { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  #screen canvas { max-width: 100% !important; max-height: 100% !important; object-fit: contain !important; }
</style>
</head><body>
<div id="screen"></div>
<script type="module">
import RFB from '/vnc/${device.id}/core/rfb.js';

const host = window.location.hostname;
const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
const url = scheme + '://' + host + (port ? ':' + port : '') + '/${vncPath}';
const password = ${JSON.stringify(password)};

const rfb = new RFB(document.getElementById('screen'), url, {
  credentials: { password: password },
  wsProtocols: ['binary'],
});
rfb.scaleViewport = true;
rfb.clipViewport = false;
rfb.resizeSession = false;
rfb.showDotCursor = false;
rfb.qualityLevel = 5;
rfb.compressionLevel = 6;

rfb.addEventListener('disconnect', (e) => {
  if (!e.detail.clean) {
    setTimeout(() => window.location.reload(), 3000);
  }
});

// Re-scale on container resize
const ro = new ResizeObserver(() => { rfb.scaleViewport = true; });
ro.observe(document.getElementById('screen'));

// --- Pick Mode (for Coordinate Picker) ---
let pickMode = false;
let pickOverlay = null;

window.addEventListener('message', (e) => {
  if (e.data?.type === 'enablePickMode') {
    pickMode = true;
    if (!pickOverlay) {
      pickOverlay = document.createElement('div');
      pickOverlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;cursor:crosshair;';
      document.body.appendChild(pickOverlay);

      pickOverlay.addEventListener('mousemove', (ev) => {
        const coords = canvasCoords(ev);
        if (coords) window.parent.postMessage({ type: 'pickerHover', ...coords }, '*');
      });

      pickOverlay.addEventListener('click', (ev) => {
        const coords = canvasCoords(ev);
        if (coords) window.parent.postMessage({ type: 'pickerClick', ...coords }, '*');
      });
    }
  } else if (e.data?.type === 'disablePickMode') {
    pickMode = false;
    if (pickOverlay) { pickOverlay.remove(); pickOverlay = null; }
  }
});

function canvasCoords(ev) {
  const canvas = document.querySelector('#screen canvas');
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  const y = (ev.clientY - rect.top) / rect.height;
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  return { x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(3)) };
}
</script>
</body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
