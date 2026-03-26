import { Router } from 'express';
import { getDevice } from '../services/device-manager';

const router = Router();

// GET /api/vnc-viewer/:deviceId — returns HTML that auto-connects noVNC with password
router.get('/:deviceId', (req, res) => {
  const device = getDevice(req.params.deviceId);
  if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

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
rfb.qualityLevel = 6;
rfb.compressionLevel = 2;

rfb.addEventListener('disconnect', (e) => {
  if (!e.detail.clean) {
    setTimeout(() => window.location.reload(), 3000);
  }
});

// Re-scale on container resize
const ro = new ResizeObserver(() => { rfb.scaleViewport = true; });
ro.observe(document.getElementById('screen'));
</script>
</body></html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;
