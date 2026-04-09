import { Router } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { readSingleton, isPostgresMode } from '../store';
import * as store from '../store';
import { getAuthUserId } from '../helpers/get-user';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'phoneagent-secret-key';

/** Verify JWT token manually for generate-link (this route is before authMiddleware) */
function verifyAuthToken(req: any): string | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    return payload.id || null;
  } catch {
    return null;
  }
}

function createHmacToken(accountId: string): string {
  return crypto.createHmac('sha256', JWT_SECRET).update(accountId).digest('hex');
}

function verifyHmacToken(accountId: string, token: string): boolean {
  const expected = createHmacToken(accountId);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

async function getGmailConfig(): Promise<{ clientId: string; clientSecret: string } | null> {
  const settings = await readSingleton<any>('settings', {});
  const cfg = settings?.gmailOAuth;
  if (!cfg?.clientId || !cfg?.clientSecret) return null;
  return cfg;
}

function getRedirectUri(): string {
  const base = process.env.BASE_URL || 'https://phoneagent.io.vn';
  return `${base}/api/gmail-auth/callback`;
}

// ============================================================
// GET /api/gmail-auth/generate-link?accountId={id}
// (Cần đăng nhập — gọi từ dashboard)
// ============================================================
router.get('/generate-link', async (req, res) => {
  try {
    // Auth manually (this route is mounted before authMiddleware)
    const userId = verifyAuthToken(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    const { accountId } = req.query;
    if (!accountId || typeof accountId !== 'string') {
      return res.status(400).json({ success: false, error: 'accountId is required' });
    }

    // Verify user owns this account
    if (isPostgresMode) {
      const check = await store.query(
        'SELECT id FROM social_accounts WHERE id = $1 AND owner_id = $2',
        [accountId, userId]
      );
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Account not found' });
      }
    }

    const gmailConfig = await getGmailConfig();
    if (!gmailConfig) {
      return res.status(400).json({ success: false, error: 'Gmail OAuth chưa được cấu hình trong Settings' });
    }

    const token = createHmacToken(accountId);
    const base = process.env.BASE_URL || 'https://phoneagent.io.vn';
    const url = `${base}/api/gmail-auth/start?account=${accountId}&token=${token}`;

    res.json({ success: true, data: { url } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// GET /api/gmail-auth/start?account={id}&token={hmac}
// (Không cần đăng nhập — redirect sang Google OAuth)
// ============================================================
router.get('/start', async (req, res) => {
  try {
    const { account, token } = req.query;
    if (!account || !token || typeof account !== 'string' || typeof token !== 'string') {
      return res.status(400).send('Missing account or token parameter');
    }

    // Validate HMAC
    if (!verifyHmacToken(account, token)) {
      return res.status(403).send('Invalid or expired link');
    }

    const gmailConfig = await getGmailConfig();
    if (!gmailConfig) {
      return res.status(500).send('Gmail OAuth chưa được cấu hình');
    }

    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      gmailConfig.clientId,
      gmailConfig.clientSecret,
      getRedirectUri()
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      state: JSON.stringify({ accountId: account }),
      prompt: 'consent',
    });

    res.redirect(authUrl);
  } catch (err: any) {
    res.status(500).send(`Error: ${err.message}`);
  }
});

// ============================================================
// GET /api/gmail-auth/callback?code={code}&state={state}
// (Google OAuth callback — không cần đăng nhập)
// ============================================================
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.send(`
        <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;max-width:400px;">
            <h1 style="color:#dc2626;">✕ Không thể kết nối</h1>
            <p style="color:#64748b;">Bạn đã từ chối hoặc có lỗi: ${error}</p>
          </div>
        </body></html>
      `);
    }

    if (!code || !state) {
      return res.status(400).send('Missing code or state');
    }

    const { accountId } = JSON.parse(state as string);
    if (!accountId) return res.status(400).send('Invalid state');

    const gmailConfig = await getGmailConfig();
    if (!gmailConfig) return res.status(500).send('Gmail OAuth chưa được cấu hình');

    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(
      gmailConfig.clientId,
      gmailConfig.clientSecret,
      getRedirectUri()
    );

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);

    if (!tokens.refresh_token) {
      return res.send(`
        <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;max-width:400px;">
            <h1 style="color:#f59e0b;">⚠ Không nhận được refresh token</h1>
            <p style="color:#64748b;">Vui lòng thử lại. Nếu đã authorize trước đó, vào <a href="https://myaccount.google.com/permissions" target="_blank">Google Permissions</a> → xoá app → thử lại.</p>
          </div>
        </body></html>
      `);
    }

    // Save refresh token to social_accounts
    if (isPostgresMode) {
      await store.query(
        'UPDATE social_accounts SET gmail_refresh_token = $1, gmail_authorized = true, updated_at = NOW() WHERE id = $2',
        [tokens.refresh_token, accountId]
      );
    } else {
      // File-based: would need to scan all tenants — simplified for PG mode
      console.log('[Gmail Auth] File-mode not fully supported for OAuth callback');
    }

    res.send(`
      <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;max-width:400px;">
          <div style="width:64px;height:64px;border-radius:50%;background:#ecfdf5;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
            <span style="font-size:32px;">✓</span>
          </div>
          <h1 style="color:#059669;margin-bottom:8px;">Đã kết nối Gmail thành công!</h1>
          <p style="color:#64748b;">Bạn có thể đóng trang này và quay lại Phone Agent.</p>
        </div>
      </body></html>
    `);
  } catch (err: any) {
    console.error('[Gmail Auth] Callback error:', err);
    res.status(500).send(`
      <html><body style="font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
        <div style="text-align:center;max-width:400px;">
          <h1 style="color:#dc2626;">✕ Lỗi kết nối</h1>
          <p style="color:#64748b;">${err.message}</p>
        </div>
      </body></html>
    `);
  }
});

export default router;
