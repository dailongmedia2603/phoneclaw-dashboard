import { Router } from 'express';
import { getAuthUserId } from '../helpers/get-user';
import { generateId, isPostgresMode } from '../store';
import * as store from '../store';

const router = Router();

// GET /api/social-accounts — Lấy danh sách tài khoản của user
router.get('/', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    if (isPostgresMode) {
      const { rows } = await store.query(
        'SELECT sa.*, d.name as device_name FROM social_accounts sa LEFT JOIN devices d ON sa.device_id = d.id WHERE sa.owner_id = $1 ORDER BY sa.created_at DESC',
        [userId]
      );
      const data = rows.map((row: any) => {
        const account = store.rowToSocialAccount(row);
        (account as any).deviceName = row.device_name || '';
        delete (account as any).gmailRefreshToken; // Don't expose token to frontend
        return account;
      });
      return res.json({ success: true, data });
    }

    // File-based fallback
    const accounts = await store.readUserCollection<any>(userId, 'social-accounts');
    res.json({ success: true, data: accounts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/social-accounts — Tạo tài khoản mới
router.post('/', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { username, password, email, emailPassword, channel, deviceId, notes, status } = req.body;
    if (!username) return res.status(400).json({ success: false, error: 'username is required' });

    const id = generateId();
    const now = new Date().toISOString();

    if (isPostgresMode) {
      await store.query(
        `INSERT INTO social_accounts (id, owner_id, username, password, email, email_password, channel, device_id, notes, status, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
        [id, userId, username, password || '', email || '', emailPassword || '', channel || 'tiktok_vn', deviceId || null, notes || '', status || 'active', now, now]
      );
      const { rows } = await store.query(
        'SELECT sa.*, d.name as device_name FROM social_accounts sa LEFT JOIN devices d ON sa.device_id = d.id WHERE sa.id = $1',
        [id]
      );
      const account = store.rowToSocialAccount(rows[0]);
      (account as any).deviceName = rows[0].device_name || '';
      return res.status(201).json({ success: true, data: account });
    }

    // File-based fallback
    const accounts = await store.readUserCollection<any>(userId, 'social-accounts');
    const newAccount = {
      id, username, password: password || '', email: email || '',
      emailPassword: emailPassword || '', channel: channel || 'tiktok_vn',
      deviceId: deviceId || '', notes: notes || '', status: status || 'active',
      ownerId: userId, createdAt: now, updatedAt: now,
    };
    accounts.push(newAccount);
    await store.writeUserCollection(userId, 'social-accounts', accounts);
    res.status(201).json({ success: true, data: newAccount });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/social-accounts/:id — Cập nhật tài khoản
router.put('/:id', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;
    const { username, password, email, emailPassword, channel, deviceId, notes, status } = req.body;
    const now = new Date().toISOString();

    if (isPostgresMode) {
      // Check ownership
      const check = await store.query('SELECT id FROM social_accounts WHERE id = $1 AND owner_id = $2', [id, userId]);
      if (check.rows.length === 0) return res.status(404).json({ success: false, error: 'Not found' });

      await store.query(
        `UPDATE social_accounts SET
          username = COALESCE($1, username),
          password = COALESCE($2, password),
          email = COALESCE($3, email),
          email_password = COALESCE($4, email_password),
          channel = COALESCE($5, channel),
          device_id = $6,
          notes = COALESCE($7, notes),
          status = COALESCE($8, status),
          updated_at = $9
        WHERE id = $10 AND owner_id = $11`,
        [username, password, email, emailPassword, channel, deviceId || null, notes, status, now, id, userId]
      );
      const { rows } = await store.query(
        'SELECT sa.*, d.name as device_name FROM social_accounts sa LEFT JOIN devices d ON sa.device_id = d.id WHERE sa.id = $1',
        [id]
      );
      const account = store.rowToSocialAccount(rows[0]);
      (account as any).deviceName = rows[0].device_name || '';
      return res.json({ success: true, data: account });
    }

    // File-based fallback
    const accounts = await store.readUserCollection<any>(userId, 'social-accounts');
    const idx = accounts.findIndex((a: any) => a.id === id);
    if (idx === -1) return res.status(404).json({ success: false, error: 'Not found' });
    accounts[idx] = { ...accounts[idx], ...req.body, updatedAt: now };
    await store.writeUserCollection(userId, 'social-accounts', accounts);
    res.json({ success: true, data: accounts[idx] });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/social-accounts/:id — Xoá tài khoản
router.delete('/:id', async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { id } = req.params;

    if (isPostgresMode) {
      const result = await store.query('DELETE FROM social_accounts WHERE id = $1 AND owner_id = $2', [id, userId]);
      if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Not found' });
      return res.json({ success: true });
    }

    // File-based fallback
    const accounts = await store.readUserCollection<any>(userId, 'social-accounts');
    const filtered = accounts.filter((a: any) => a.id !== id);
    if (filtered.length === accounts.length) return res.status(404).json({ success: false, error: 'Not found' });
    await store.writeUserCollection(userId, 'social-accounts', filtered);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
