import { Router } from 'express';
import * as se from '../services/script-engine';

const router = Router();

// GET /api/scripts
router.get('/', (_req, res) => {
  res.json({ success: true, data: se.getAllScripts() });
});

// GET /api/scripts/:id
router.get('/:id', (req, res) => {
  const script = se.getScript(req.params.id);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true, data: script });
});

// POST /api/scripts
router.post('/', (req, res) => {
  const { name, description, steps } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  const script = se.createScript({ name, description: description || '', steps: steps || [] });
  res.status(201).json({ success: true, data: script });
});

// PUT /api/scripts/:id
router.put('/:id', (req, res) => {
  const script = se.updateScript(req.params.id, req.body);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true, data: script });
});

// DELETE /api/scripts/:id
router.delete('/:id', (req, res) => {
  const ok = se.deleteScript(req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true });
});

// POST /api/scripts/:id/run — run script on a device
router.post('/:id/run', async (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

  try {
    const execution = await se.executeScript(req.params.id, deviceId, 'Manual run');
    res.json({ success: true, data: execution });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Execution failed',
    });
  }
});

// POST /api/scripts/:id/stop
router.post('/:id/stop', (req, res) => {
  const { executionId } = req.body;
  if (!executionId) return res.status(400).json({ success: false, error: 'executionId is required' });
  se.stopExecution(executionId);
  res.json({ success: true });
});

// GET /api/scripts/history/all
router.get('/history/all', (_req, res) => {
  res.json({ success: true, data: se.getExecutionHistory() });
});

export default router;
