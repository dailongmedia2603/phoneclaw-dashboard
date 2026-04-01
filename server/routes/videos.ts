import { Router } from 'express';
import multer from 'multer';
import { readUserCollection, writeUserCollection, readAllTenantsCollection, generateId } from '../store';
import { uploadToR2, deleteFromR2 } from '../services/r2-storage';
import { findDeviceGlobal } from '../services/device-manager';
import { getTenantId, getAuthUserId, isAdmin } from '../helpers/get-user';

interface Video {
  id: string;
  name: string;
  filename: string;
  r2Key: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  ownerId?: string;
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max

// GET /api/videos — list videos for tenant
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  const videos = tenantId
    ? await readUserCollection<Video>(tenantId, 'videos')
    : await readAllTenantsCollection<Video>('videos');
  (videos as Video[]).sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json({ success: true, data: videos });
});

// POST /api/videos/upload — upload video to R2
router.post('/upload', upload.single('video'), async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const file = req.file;
  if (!file) return res.json({ success: false, error: 'Không có file được chọn' });

  const ext = file.originalname.split('.').pop() || 'mp4';
  const id = generateId();
  const r2Key = `videos/${id}.${ext}`;
  const name = (req.body.name || file.originalname.replace(/\.[^.]+$/, '')).trim();

  try {
    const url = await uploadToR2(file.buffer, r2Key, file.mimetype);

    const video: Video = {
      id,
      name,
      filename: file.originalname,
      r2Key,
      url,
      size: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      ownerId: userId,
    };

    const videos = await readUserCollection<Video>(userId, 'videos');
    videos.push(video);
    await writeUserCollection(userId, 'videos', videos);

    res.json({ success: true, data: video });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload thất bại';
    res.json({ success: false, error: msg });
  }
});

// DELETE /api/videos/:id — delete video from R2 + metadata
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (isAdmin(req)) {
    // Admin: tìm trong tất cả tenants
    const all = await readAllTenantsCollection<Video>('videos');
    const target = all.find(v => v.id === req.params.id);
    if (!target) return res.json({ success: false, error: 'Video không tồn tại' });
    const tid = (target as any).__tenantId;
    try { await deleteFromR2(target.r2Key); } catch { /* ignore */ }
    const videos = await readUserCollection<Video>(tid, 'videos');
    await writeUserCollection(tid, 'videos', videos.filter(v => v.id !== req.params.id));
    return res.json({ success: true });
  }

  // User: chỉ xoá trong tenant mình
  const videos = await readUserCollection<Video>(userId, 'videos');
  const video = videos.find(v => v.id === req.params.id);
  if (!video) return res.json({ success: false, error: 'Video không tồn tại' });

  try { await deleteFromR2(video.r2Key); } catch { /* ignore */ }
  await writeUserCollection(userId, 'videos', videos.filter(v => v.id !== req.params.id));
  res.json({ success: true });
});

// POST /api/videos/:id/send-to-device — send video URL to device for download
router.post('/:id/send-to-device', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { deviceId } = req.body;
  if (!deviceId) return res.json({ success: false, error: 'Thiếu deviceId' });

  // Check video ownership
  const tenantId = isAdmin(req) ? undefined : userId;
  const videos = tenantId
    ? await readUserCollection<Video>(tenantId, 'videos')
    : await readAllTenantsCollection<Video>('videos');
  const video = (videos as Video[]).find(v => v.id === req.params.id);
  if (!video) return res.json({ success: false, error: 'Video không tồn tại' });

  // Check device ownership
  const found = await findDeviceGlobal(deviceId);
  if (!found) return res.json({ success: false, error: 'Thiết bị không tìm thấy' });
  if (!isAdmin(req) && found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  const device = found.device;
  const apiPort = device.httpPort + 1;
  const apiUrl = `http://${device.tailscaleIp}:${apiPort}/api/save-to-photos`;

  console.log(`[SEND-VIDEO] Sending to ${apiUrl} video=${video.url}`);

  // Pre-check: verify video URL is accessible
  try {
    const checkRes = await fetch(video.url, { method: 'HEAD' });
    if (!checkRes.ok) {
      console.log(`[SEND-VIDEO] Video URL not accessible: ${checkRes.status}`);
      return res.json({ success: false, error: `Video URL không truy cập được (HTTP ${checkRes.status}). Kiểm tra R2 bucket có bật public access chưa.` });
    }
    console.log(`[SEND-VIDEO] Video URL OK: ${checkRes.status}, size=${checkRes.headers.get('content-length')}`);
  } catch (urlErr) {
    console.log(`[SEND-VIDEO] Video URL check failed:`, urlErr);
    return res.json({ success: false, error: 'Không thể truy cập video URL. Kiểm tra R2 public URL hoặc custom domain.' });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    const apiRes = await fetch(apiUrl, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: video.url }),
    });
    clearTimeout(timeout);

    const text = await apiRes.text();
    console.log(`[SEND-VIDEO] Response: ${apiRes.status} ${text}`);

    let data: any = null;
    try { data = JSON.parse(text); } catch {}

    if (data?.ok) {
      return res.json({ success: true, data: { message: 'Đã gửi lệnh tải video tới thiết bị. Kiểm tra Photos sau vài giây.' } });
    }

    return res.json({ success: false, error: data?.error || `Thiết bị trả về: ${text.substring(0, 200)}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lỗi kết nối thiết bị';
    console.error(`[SEND-VIDEO] Error: ${msg}`);
    return res.json({ success: false, error: `Không kết nối được thiết bị (${device.tailscaleIp}:${apiPort}): ${msg}` });
  }
});

export default router;
