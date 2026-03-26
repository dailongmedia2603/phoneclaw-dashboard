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
  role: 'admin' | 'manager';
  createdAt: string;
}

// --- Helpers ---

function getUsers(): User[] {
  return readCollection<User>('users');
}

function saveUsers(users: User[]) {
  writeCollection('users', users);
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
  const user = users.find(u => u.email === email);
  if (!user) {
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
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    },
  });
});

// --- GET /api/auth/me ---
router.get('/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
    const users = getUsers();
    const user = users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    res.json({
      success: true,
      data: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalid' });
  }
});

// --- POST /api/auth/change-password ---
router.post('/change-password', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(authHeader.slice(7), JWT_SECRET) as any;
    const { currentPassword, newPassword } = req.body;

    const users = getUsers();
    const user = users.find(u => u.id === payload.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ success: false, error: 'Mật khẩu hiện tại không đúng' });

    user.password = await bcrypt.hash(newPassword, 10);
    saveUsers(users);

    res.json({ success: true });
  } catch {
    return res.status(401).json({ success: false, error: 'Token invalid' });
  }
});

// --- Auth Middleware (export for use in other routes) ---
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // Skip auth for login endpoint
  if (req.path === '/api/auth/login' || req.path === '/api/health') {
    return next();
  }

  // Skip auth for static files
  if (!req.path.startsWith('/api/')) {
    return next();
  }

  // Support token via query param (for <img src> and iframe)
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : queryToken;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).user = payload;
    next();
  } catch {
    return res.status(401).json({ success: false, error: 'Token expired' });
  }
}

export default router;
