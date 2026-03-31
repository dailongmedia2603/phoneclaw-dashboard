import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readCollection, writeCollection, generateId } from '../store';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'phoneclaw-secret-key-change-in-production';
const TOKEN_EXPIRY = '7d';

interface User {
  id: string;
  email: string;
  password: string; // bcrypt hash
  name: string;
  phone?: string;
  role: 'admin' | 'user';
  packageId?: string;
  createdAt: string;
}

// --- Helpers ---

function getUsers(): User[] {
  return readCollection<User>('users');
}

function saveUsers(users: User[]) {
  writeCollection('users', users);
}

/** Strip password from user before sending to client */
function sanitizeUser(user: User) {
  return { id: user.id, email: user.email, name: user.name, phone: user.phone || '', role: user.role, packageId: user.packageId, createdAt: user.createdAt };
}

/** Get authenticated user from request */
function getAuthUser(req: Request): { id: string; email: string; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
  } catch {
    return null;
  }
}

/** Admin-only guard */
function adminOnly(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập' });
  }
  next();
}

// --- Seed default admin if no users exist ---
(async () => {
  const users = getUsers();
  if (users.length === 0) {
    const hash = await bcrypt.hash('dailongmedia@123', 10);
    const admin: User = {
      id: generateId(),
      email: 'long@dailongmedia.io.vn',
      password: hash,
      name: 'Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    saveUsers([admin]);
    console.log('[Auth] Default admin account created: long@dailongmedia.io.vn');
  }
})();

// --- POST /api/auth/login ---
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email và mật khẩu là bắt buộc' });
  }

  const users = getUsers();
  // Use constant-time comparison to prevent timing attacks
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Still hash to prevent timing attack (reveals whether email exists)
    await bcrypt.hash(password, 10);
    return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, error: 'Email hoặc mật khẩu không đúng' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );

  res.json({
    success: true,
    data: {
      token,
      user: sanitizeUser(user),
    },
  });
});

// --- GET /api/auth/me ---
router.get('/me', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const users = getUsers();
  const user = users.find(u => u.id === authUser.id);
  if (!user) return res.status(401).json({ success: false, error: 'User not found' });

  res.json({ success: true, data: sanitizeUser(user) });
});

// --- POST /api/auth/change-password ---
router.post('/change-password', async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu mới phải ít nhất 6 ký tự' });
  }

  const users = getUsers();
  const user = users.find(u => u.id === authUser.id);
  if (!user) return res.status(401).json({ success: false, error: 'User not found' });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không đúng' });

  user.password = await bcrypt.hash(newPassword, 10);
  saveUsers(users);
  res.json({ success: true });
});

// ============================================================
// User Management (Admin Only)
// ============================================================

// GET /api/auth/users — list all users
router.get('/users', adminOnly, (_req: Request, res: Response) => {
  const users = getUsers();
  res.json({ success: true, data: users.map(sanitizeUser) });
});

// POST /api/auth/users — create new user
router.post('/users', adminOnly, async (req: Request, res: Response) => {
  const { name, email, password, phone, role, packageId } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ success: false, error: 'Tên, email và mật khẩu là bắt buộc' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Mật khẩu phải ít nhất 6 ký tự' });
  }
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({ success: false, error: 'Quyền không hợp lệ' });
  }

  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ success: false, error: 'Email đã tồn tại' });
  }

  const hash = await bcrypt.hash(password, 10);
  const user: User = {
    id: generateId(),
    email: email.trim().toLowerCase(),
    password: hash,
    name: name.trim(),
    phone: phone?.trim() || '',
    role,
    packageId: packageId || undefined,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  saveUsers(users);
  res.json({ success: true, data: sanitizeUser(user) });
});

// PUT /api/auth/users/:id — update user
router.put('/users/:id', adminOnly, async (req: Request, res: Response) => {
  const { name, email, phone, role, password, packageId } = req.body;
  const users = getUsers();
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });

  // Prevent removing last admin
  if (users[idx].role === 'admin' && role === 'user') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ success: false, error: 'Không thể xoá quyền admin cuối cùng' });
    }
  }

  if (name) users[idx].name = name.trim();
  if (email) {
    const emailLower = email.trim().toLowerCase();
    const existing = users.find(u => u.email === emailLower && u.id !== req.params.id);
    if (existing) return res.status(400).json({ success: false, error: 'Email đã tồn tại' });
    users[idx].email = emailLower;
  }
  if (phone !== undefined) users[idx].phone = phone.trim();
  if (role && ['admin', 'user'].includes(role)) users[idx].role = role;
  if (password && password.length >= 6) {
    users[idx].password = await bcrypt.hash(password, 10);
  }
  if (packageId !== undefined) {
    users[idx].packageId = packageId || undefined;
  }

  saveUsers(users);
  res.json({ success: true, data: sanitizeUser(users[idx]) });
});

// DELETE /api/auth/users/:id — delete user
router.delete('/users/:id', adminOnly, (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const users = getUsers();
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: 'Người dùng không tồn tại' });

  // Cannot delete yourself
  if (authUser?.id === req.params.id) {
    return res.status(400).json({ success: false, error: 'Không thể xoá chính mình' });
  }

  // Cannot delete last admin
  if (user.role === 'admin') {
    const adminCount = users.filter(u => u.role === 'admin').length;
    if (adminCount <= 1) {
      return res.status(400).json({ success: false, error: 'Không thể xoá admin cuối cùng' });
    }
  }

  const filtered = users.filter(u => u.id !== req.params.id);
  saveUsers(filtered);
  res.json({ success: true });
});

// --- Auth Middleware ---
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.path === '/api/auth/login' || req.path === '/api/health') return next();
  if (!req.path.startsWith('/api/')) return next();

  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken;

  if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }
}

export default router;
