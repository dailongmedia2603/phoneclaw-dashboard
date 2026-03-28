import { Router } from 'express';
import { readCollection, writeCollection, generateId } from '../store';

interface CustomNode {
  id: string;
  name: string;
  createdAt: string;
}

const router = Router();

// GET /api/custom-nodes
router.get('/', (_req, res) => {
  const nodes = readCollection<CustomNode>('custom-nodes');
  res.json({ success: true, data: nodes });
});

// POST /api/custom-nodes
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.json({ success: false, error: 'Tên node không được trống' });

  const nodes = readCollection<CustomNode>('custom-nodes');
  const node: CustomNode = { id: generateId(), name: name.trim(), createdAt: new Date().toISOString() };
  nodes.push(node);
  writeCollection('custom-nodes', nodes);
  res.json({ success: true, data: node });
});

// PUT /api/custom-nodes/:id
router.put('/:id', (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.json({ success: false, error: 'Tên node không được trống' });

  const nodes = readCollection<CustomNode>('custom-nodes');
  const idx = nodes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.json({ success: false, error: 'Node không tồn tại' });

  nodes[idx].name = name.trim();
  writeCollection('custom-nodes', nodes);
  res.json({ success: true, data: nodes[idx] });
});

// DELETE /api/custom-nodes/:id
router.delete('/:id', (req, res) => {
  const nodes = readCollection<CustomNode>('custom-nodes');
  const filtered = nodes.filter(n => n.id !== req.params.id);
  if (filtered.length === nodes.length) return res.json({ success: false, error: 'Node không tồn tại' });
  writeCollection('custom-nodes', filtered);
  res.json({ success: true });
});

export default router;
