import { Router } from 'express';
import { getAuthUserId } from '../helpers/get-user';
import { readUserCollection, readSingleton } from '../store';
import { extractGmailBody, getGmailHeader, parseOtpCode } from '../services/script-engine';

const router = Router();

// POST /api/test/otp-fetch — Test lấy OTP cho 1 account (không tap/type iPhone)
// Body: { accountId: string, waitTimeout?: number (seconds, default 60) }
router.post('/otp-fetch', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { accountId, waitTimeout, maxAgeMinutes, gmailQuery } = req.body || {};
  if (!accountId) return res.status(400).json({ success: false, error: 'accountId is required' });

  // Test mode defaults: permissive để bạn thử với email bất kỳ trong inbox.
  // maxAgeMinutes: chỉ nhận email nhận trong X phút gần nhất (default 60 = 1 giờ).
  // Dùng -1 hoặc 0 để không giới hạn thời gian (tìm trong toàn bộ inbox khả dụng).
  const ageMinutes = maxAgeMinutes === undefined ? 60 : Number(maxAgeMinutes);
  const effectiveQuery = (typeof gmailQuery === 'string' && gmailQuery.trim())
    ? gmailQuery.trim()
    : (ageMinutes > 0
        ? `newer_than:${Math.max(1, Math.ceil(ageMinutes / 60))}h (from:tiktok OR from:accounts OR subject:verification OR subject:verify OR subject:code OR subject:xác OR subject:OTP)`
        : '(from:tiktok OR from:accounts OR subject:verification OR subject:verify OR subject:code OR subject:xác OR subject:OTP)');

  try {
    const accounts = await readUserCollection<any>(userId, 'social-accounts');
    const account = accounts.find((a: any) => a.id === accountId);
    if (!account) return res.status(404).json({ success: false, error: 'Account không tồn tại' });
    if (!account.gmailRefreshToken) {
      return res.status(400).json({
        success: false,
        error: `Tài khoản "${account.email}" chưa authorize Gmail`,
      });
    }

    const settings = await readSingleton<any>('settings', {});
    const gmailConfig = settings.gmailOAuth;
    if (!gmailConfig?.clientId || !gmailConfig?.clientSecret) {
      return res.status(400).json({
        success: false,
        error: 'Chưa cấu hình Gmail OAuth trong Settings',
      });
    }

    const { google } = await import('googleapis');
    const oauth2Client = new google.auth.OAuth2(gmailConfig.clientId, gmailConfig.clientSecret);
    oauth2Client.setCredentials({ refresh_token: account.gmailRefreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const timeout = (Number(waitTimeout) || 60) * 1000;
    const startTime = Date.now();
    const pollInterval = 5000;
    // minInternalDate: chỉ áp dụng khi ageMinutes > 0. Nếu <=0 thì không giới hạn thời gian.
    const minInternalDate = ageMinutes > 0 ? startTime - ageMinutes * 60 * 1000 : 0;
    const seenMessageIds = new Set<string>();
    const attempts: Array<{
      pollIdx: number;
      candidates: number;
      checked: Array<{ id: string; from: string; subject: string; internalDate: string; tooOld: boolean; matched: string | null }>;
      error?: string;
    }> = [];

    let otpCode: string | null = null;
    let otpMessageId: string | null = null;
    let otpMessageMeta: { from: string; subject: string; internalDate: string; snippet: string } | null = null;
    let lastGmailError: string | null = null;
    let pollIdx = 0;

    console.log(`[TEST-OTP] Poll cho ${account.email} (timeout ${timeout / 1000}s, ageMinutes=${ageMinutes}, q="${effectiveQuery}")`);

    while (Date.now() - startTime < timeout) {
      pollIdx++;
      const attempt: (typeof attempts)[number] = { pollIdx, candidates: 0, checked: [] };

      try {
        const listRes = await gmail.users.messages.list({
          userId: 'me',
          q: effectiveQuery,
          maxResults: 15,
        });

        const messages = listRes.data.messages || [];
        attempt.candidates = messages.length;

        for (const msg of messages) {
          if (!msg.id || seenMessageIds.has(msg.id)) continue;
          seenMessageIds.add(msg.id);

          const detail = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
          });

          const internalDate = Number(detail.data.internalDate || 0);
          const tooOld = minInternalDate > 0 && internalDate > 0 && internalDate < minInternalDate;
          const subject = getGmailHeader(detail.data, 'Subject');
          const from = getGmailHeader(detail.data, 'From');
          const body = extractGmailBody(detail.data);

          const checked = {
            id: msg.id,
            from,
            subject,
            internalDate: new Date(internalDate).toISOString(),
            tooOld,
            matched: null as string | null,
          };

          if (!tooOld) {
            const code = parseOtpCode(subject + '\n' + body);
            if (code) {
              checked.matched = code;
              otpCode = code;
              otpMessageId = msg.id;
              otpMessageMeta = {
                from,
                subject,
                internalDate: checked.internalDate,
                snippet: (detail.data.snippet || '').slice(0, 200),
              };
            }
          }

          attempt.checked.push(checked);
          if (otpCode) break;
        }
      } catch (gmailErr: any) {
        lastGmailError = gmailErr?.message || String(gmailErr);
        attempt.error = lastGmailError;
        console.error('[TEST-OTP] Gmail API error:', lastGmailError);
        if (/invalid_grant|unauthorized|401|403/i.test(lastGmailError || '')) {
          attempts.push(attempt);
          return res.status(400).json({
            success: false,
            error: `Gmail auth lỗi - cần authorize lại tài khoản "${account.email}"`,
            gmailError: lastGmailError,
            attempts,
          });
        }
      }

      attempts.push(attempt);
      if (otpCode) break;

      await new Promise(r => setTimeout(r, pollInterval));
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);

    if (!otpCode) {
      return res.json({
        success: false,
        error: `Không tìm thấy OTP trong ${elapsed}s`,
        gmailError: lastGmailError,
        attempts,
      });
    }

    // Mark email read để test lần sau không dính lại
    if (otpMessageId) {
      try {
        await gmail.users.messages.modify({
          userId: 'me',
          id: otpMessageId,
          requestBody: { removeLabelIds: ['UNREAD'] },
        });
      } catch (markErr: any) {
        console.warn('[TEST-OTP] Không mark read được:', markErr?.message);
      }
    }

    return res.json({
      success: true,
      otpCode,
      elapsedSeconds: elapsed,
      email: otpMessageMeta,
      attempts,
    });
  } catch (err: any) {
    console.error('[TEST-OTP] Unexpected error:', err);
    return res.status(500).json({ success: false, error: err?.message || String(err) });
  }
});

export default router;
