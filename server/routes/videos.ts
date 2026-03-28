import { Router } from 'express';
import multer from 'multer';
import { readCollection, writeCollection, generateId } from '../store';
import { uploadToR2, deleteFromR2 } from '../services/r2-storage';
import { callDeviceApi } from '../services/device-manager';

interface Video {
  id: string;
  name: string;
  filename: string;
  r2Key: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } }); // 500MB max

// GET /api/videos — list all videos
router.get('/', (_req, res) => {
  const videos = readCollection<Video>('videos');
  videos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  res.json({ success: true, data: videos });
});

// POST /api/videos/upload — upload video to R2
router.post('/upload', upload.single('video'), async (req, res) => {
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
    };

    const videos = readCollection<Video>('videos');
    videos.push(video);
    writeCollection('videos', videos);

    res.json({ success: true, data: video });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload thất bại';
    res.json({ success: false, error: msg });
  }
});

// DELETE /api/videos/:id — delete video from R2 + metadata
router.delete('/:id', async (req, res) => {
  const videos = readCollection<Video>('videos');
  const video = videos.find(v => v.id === req.params.id);
  if (!video) return res.json({ success: false, error: 'Video không tồn tại' });

  try {
    await deleteFromR2(video.r2Key);
  } catch { /* ignore R2 delete errors */ }

  const filtered = videos.filter(v => v.id !== req.params.id);
  writeCollection('videos', filtered);
  res.json({ success: true });
});

// POST /api/videos/:id/send-to-device — send video URL to device for download
router.post('/:id/send-to-device', async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.json({ success: false, error: 'Thiếu deviceId' });

  const videos = readCollection<Video>('videos');
  const video = videos.find(v => v.id === req.params.id);
  if (!video) return res.json({ success: false, error: 'Video không tồn tại' });

  // Try save-to-photos endpoint (requires TrollVNC rebuild with Photos.framework)
  const result = await callDeviceApi(deviceId, 'POST', '/api/save-to-photos', { url: video.url });

  if (result.ok) {
    return res.json({ success: true, data: { message: 'Đã lưu video vào Photos trên thiết bị' } });
  }

  // Fallback: set clipboard to URL so user can paste in Safari
  await callDeviceApi(deviceId, 'POST', '/api/clipboard', { text: video.url });
  res.json({
    success: true,
    data: { message: 'Đã copy URL video vào clipboard thiết bị. Mở Safari để tải về.', fallback: true },
  });
});

export default router;
