import { Router } from 'express';
import { readCollection, writeCollection, generateId } from '../store';
import { executeScriptDirect } from '../services/script-engine';
import type { Script } from '../../src/types';

const router = Router();

// GET /api/shared-scripts
router.get('/', (_req, res) => {
  const scripts = readCollection<Script>('shared-scripts');
  res.json({ success: true, data: scripts });
});

// GET /api/shared-scripts/:id
router.get('/:id', (req, res) => {
  const scripts = readCollection<Script>('shared-scripts');
  const script = scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: script });
});

// POST /api/shared-scripts
router.post('/', (req, res) => {
  const scripts = readCollection<Script>('shared-scripts');
  const script: Script = {
    ...req.body,
    id: generateId(),
    status: 'active',
    lastRun: null,
    createdAt: new Date().toISOString(),
  };
  scripts.push(script);
  writeCollection('shared-scripts', scripts);
  res.json({ success: true, data: script });
});

// PUT /api/shared-scripts/:id
router.put('/:id', (req, res) => {
  const scripts = readCollection<Script>('shared-scripts');
  const idx = scripts.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
  scripts[idx] = { ...scripts[idx], ...req.body };
  writeCollection('shared-scripts', scripts);
  res.json({ success: true, data: scripts[idx] });
});

// DELETE /api/shared-scripts/:id
router.delete('/:id', (req, res) => {
  const scripts = readCollection<Script>('shared-scripts');
  const filtered = scripts.filter(s => s.id !== req.params.id);
  if (filtered.length === scripts.length) return res.status(404).json({ success: false, error: 'Not found' });
  writeCollection('shared-scripts', filtered);
  res.json({ success: true });
});

// POST /api/shared-scripts/:id/run — run shared script on device (admin only)
router.post('/:id/run', async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

  // Check admin role
  const user = (req as any).user;
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Chỉ admin mới có thể chạy kịch bản từ kho' });
  }

  const scripts = readCollection<Script>('shared-scripts');
  const script = scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });

  executeScriptDirect(script, deviceId, 'Shared: ' + script.name).catch(err => {
    console.error('Shared script execution error:', err);
  });

  res.json({ success: true, data: { status: 'started', scriptName: script.name } });
});

export default router;
