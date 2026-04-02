import { Router } from 'express';
import { readUserCollection, writeUserCollection, generateId } from '../store';
import { getTenantId, getAuthUserId } from '../helpers/get-user';

interface CustomNode {
  id: string;
  name: string;
  createdAt: string;
  ownerId?: string;
}

const router = Router();

// GET /api/custom-nodes
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  if (!tenantId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  const nodes = await readUserCollection<CustomNode>(tenantId, 'custom-nodes');
  res.json({ success: true, data: nodes });
});

// POST /api/custom-nodes
router.post('/', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name } = req.body;
  if (!name?.trim()) return res.json({ success: false, error: 'Tên node không được trống' });

  const nodes = await readUserCollection<CustomNode>(userId, 'custom-nodes');
  const node: CustomNode = { id: generateId(), name: name.trim(), createdAt: new Date().toISOString(), ownerId: userId };
  nodes.push(node);
  await writeUserCollection(userId, 'custom-nodes', nodes);
  res.json({ success: true, data: node });
});

// PUT /api/custom-nodes/:id
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { name } = req.body;
  if (!name?.trim()) return res.json({ success: false, error: 'Tên node không được trống' });

  const nodes = await readUserCollection<CustomNode>(userId, 'custom-nodes');
  const idx = nodes.findIndex(n => n.id === req.params.id);
  if (idx === -1) return res.json({ success: false, error: 'Node không tồn tại' });
  nodes[idx].name = name.trim();
  await writeUserCollection(userId, 'custom-nodes', nodes);
  res.json({ success: true, data: nodes[idx] });
});

// DELETE /api/custom-nodes/:id
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const nodes = await readUserCollection<CustomNode>(userId, 'custom-nodes');
  const filtered = nodes.filter(n => n.id !== req.params.id);
  if (filtered.length === nodes.length) return res.json({ success: false, error: 'Node không tồn tại' });
  await writeUserCollection(userId, 'custom-nodes', filtered);
  res.json({ success: true });
});

export default router;
