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
  const { name, description, steps, channel, graphData } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });
  const script = se.createScript({ name, description: description || '', steps: steps || [], channel, graphData });
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

// POST /api/scripts/:id/run — run script on a device (async, returns immediately)
router.post('/:id/run', (req, res) => {
  const { deviceId } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

  const script = se.getScript(req.params.id);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });

  // Generate execution ID and return immediately
  const executionId = Date.now().toString(36) + Math.random().toString(36).substring(2, 8);

  // Run in background (don't await)
  se.executeScript(req.params.id, deviceId, 'Manual run').catch(err => {
    console.error('Script execution error:', err);
  });

  res.json({ success: true, data: { executionId, status: 'started', scriptName: script.name } });
});

// GET /api/scripts/executions/latest — get latest execution status (for polling)
router.get('/executions/latest', (_req, res) => {
  const history = se.getExecutionHistory();
  const latest = history.length > 0 ? history[history.length - 1] : null;
  res.json({ success: true, data: latest });
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
