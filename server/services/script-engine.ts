import { readCollection, writeCollection, generateId, readUserCollection, writeUserCollection, readAllTenantsCollection, readSingleton } from '../store';
import { callDeviceApi, updateDevice, getDevice, updateDeviceForTenant, findDeviceGlobal } from './device-manager';
import { decodeJpegBase64, getPixelAt, parseHexColor, compareColor } from './pixel-checker';
import type { Script, ScriptStep, ScheduleHistory, ExecutionStep } from '../../src/types';

// --- Script CRUD ---

export async function getAllScripts(): Promise<Script[]> {
  return readCollection<Script>('scripts');
}

export async function getScript(id: string): Promise<Script | undefined> {
  const all = await getAllScripts();
  return all.find(s => s.id === id);
}

export async function createScript(data: Pick<Script, 'name' | 'description' | 'steps'> & Record<string, unknown>): Promise<Script> {
  const scripts = await getAllScripts();
  const script: Script = {
    ...data,
    id: generateId(),
    status: 'draft',
    runCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  scripts.push(script);
  await writeCollection('scripts', scripts);
  return script;
}

export async function updateScript(id: string, data: Partial<Script>): Promise<Script | null> {
  const scripts = await getAllScripts();
  const idx = scripts.findIndex(s => s.id === id);
  if (idx === -1) return null;
  scripts[idx] = { ...scripts[idx], ...data, updatedAt: new Date().toISOString() };
  await writeCollection('scripts', scripts);
  return scripts[idx];
}

export async function deleteScript(id: string): Promise<boolean> {
  const scripts = await getAllScripts();
  const filtered = scripts.filter(s => s.id !== id);
  if (filtered.length === scripts.length) return false;
  await writeCollection('scripts', filtered);
  return true;
}

// ============================================================
// Tenant-scoped Script CRUD
// ============================================================

export async function getScriptsForTenant(tenantId?: string): Promise<Script[]> {
  if (!tenantId) return readAllTenantsCollection<Script>('scripts');
  return readUserCollection<Script>(tenantId, 'scripts');
}

export async function createScriptForTenant(userId: string, data: Pick<Script, 'name' | 'description' | 'steps'> & Record<string, unknown>): Promise<Script> {
  const scripts = await readUserCollection<Script>(userId, 'scripts');
  const script: Script = {
    ...data,
    id: generateId(),
    ownerId: userId,
    status: 'draft',
    runCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  scripts.push(script);
  await writeUserCollection(userId, 'scripts', scripts);
  return script;
}

export async function updateScriptForTenant(userId: string, id: string, data: Partial<Script>): Promise<Script | null> {
  const scripts = await readUserCollection<Script>(userId, 'scripts');
  const idx = scripts.findIndex(s => s.id === id);
  if (idx === -1) return null;
  scripts[idx] = { ...scripts[idx], ...data, updatedAt: new Date().toISOString() };
  await writeUserCollection(userId, 'scripts', scripts);
  return scripts[idx];
}

export async function deleteScriptForTenant(userId: string, id: string): Promise<boolean> {
  const scripts = await readUserCollection<Script>(userId, 'scripts');
  const filtered = scripts.filter(s => s.id !== id);
  if (filtered.length === scripts.length) return false;
  await writeUserCollection(userId, 'scripts', filtered);
  return true;
}

// --- Execution History ---

export async function getExecutionHistory(): Promise<ScheduleHistory[]> {
  return readCollection<ScheduleHistory>('execution-history');
}

export async function getExecutionHistoryForTenant(tenantId?: string): Promise<ScheduleHistory[]> {
  if (!tenantId) return readAllTenantsCollection<ScheduleHistory>('execution-history');
  return readUserCollection<ScheduleHistory>(tenantId, 'execution-history');
}

async function saveExecution(execution: ScheduleHistory) {
  const history = await getExecutionHistory();
  const idx = history.findIndex(h => h.id === execution.id);
  if (idx >= 0) {
    history[idx] = execution;
  } else {
    history.push(execution);
  }
  // Keep last 500 entries
  if (history.length > 500) history.splice(0, history.length - 500);
  await writeCollection('execution-history', history);
}

async function saveExecutionForTenant(userId: string, execution: ScheduleHistory) {
  const history = await readUserCollection<ScheduleHistory>(userId, 'execution-history');
  const idx = history.findIndex(h => h.id === execution.id);
  if (idx >= 0) {
    history[idx] = execution;
  } else {
    history.push(execution);
  }
  // Keep last 500 entries per user
  if (history.length > 500) history.splice(0, history.length - 500);
  await writeUserCollection(userId, 'execution-history', history);
}

// --- Active Executions ---

const activeExecutions = new Map<string, { abort: boolean }>();

export function isRunning(executionId: string): boolean {
  return activeExecutions.has(executionId);
}

export function stopExecution(executionId: string) {
  const ctrl = activeExecutions.get(executionId);
  if (ctrl) ctrl.abort = true;
}

// --- Script Execution Engine ---

type ProgressCallback = (execution: ScheduleHistory) => void;

/** Auto pre-delay trước mỗi node để iPhone UI có thời gian load. */
const AUTO_PREDELAY_MS = 5000;

/** Step types KHÔNG nhận auto pre-delay (bản thân là wait / control flow / variable op). */
const NO_PREDELAY_STEP_TYPES = new Set<string>([
  'wait',
  'wait_random',
  'wait_for_pixel',
  'repeat',
  'repeat_forever',
  'if_screen_match',
  'if_elapsed',
  'set',
  'random_text',
  'random_int',
  'counter',
]);

/** Execute a script object directly (for shared scripts) */
export async function executeScriptDirect(
  script: Script,
  deviceId: string,
  scheduleName: string,
  onProgress?: ProgressCallback,
  tenantId?: string,
  deviceIndex?: number
): Promise<ScheduleHistory> {
  return _executeScript(script, deviceId, scheduleName, onProgress, tenantId, deviceIndex);
}

export async function executeScript(
  scriptId: string,
  deviceId: string,
  scheduleName: string,
  onProgress?: ProgressCallback,
  tenantId?: string,
  deviceIndex?: number
): Promise<ScheduleHistory> {
  // Tìm script từ tenant nếu có, fallback legacy
  let script: Script | undefined;
  if (tenantId) {
    const scripts = await readUserCollection<Script>(tenantId, 'scripts');
    script = scripts.find(s => s.id === scriptId);
  } else {
    script = await getScript(scriptId);
  }
  if (!script) throw new Error('Script not found');
  return _executeScript(script, deviceId, scheduleName, onProgress, tenantId, deviceIndex);
}

async function _executeScript(
  script: Script,
  deviceId: string,
  scheduleName: string,
  onProgress?: ProgressCallback,
  tenantId?: string,
  deviceIndex?: number
): Promise<ScheduleHistory> {

  // Tìm device: tenant storage trước, fallback legacy
  const found = await findDeviceGlobal(deviceId);
  const device = found?.device ?? await getDevice(deviceId);
  const deviceTenantId = found?.tenantId ?? tenantId;
  if (!device) throw new Error('Device not found');

  const executionId = generateId();
  const ctrl = { abort: false };
  activeExecutions.set(executionId, ctrl);

  // Mark device as running
  if (deviceTenantId) {
    await updateDeviceForTenant(deviceTenantId, deviceId, { status: 'running', currentScript: script.name });
  } else {
    await updateDevice(deviceId, { status: 'running', currentScript: script.name });
  }

  const execution: ScheduleHistory = {
    id: executionId,
    scheduleId: '',
    scheduleName,
    scriptName: script.name,
    targetName: device.name,
    startedAt: new Date().toISOString(),
    status: 'running',
    steps: [],
    ownerId: tenantId,
  };
  const saveFn = tenantId
    ? () => saveExecutionForTenant(tenantId, execution)
    : () => saveExecution(execution);
  await saveFn();

  try {
    await executeSteps(script.steps, deviceId, execution, ctrl, onProgress, tenantId, deviceIndex);
    execution.status = 'success';
  } catch (err) {
    execution.status = 'error';
    execution.error = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    execution.finishedAt = new Date().toISOString();
    await saveFn();
    activeExecutions.delete(executionId);

    if (deviceTenantId) {
      await updateDeviceForTenant(deviceTenantId, deviceId, { status: 'online', currentScript: undefined });
    } else {
      await updateDevice(deviceId, { status: 'online', currentScript: undefined });
    }

    // Update script stats
    if (script.id) {
      const scriptUpdate = {
        lastRun: new Date().toISOString(),
        runCount: (script.runCount || 0) + 1,
        status: 'active' as const,
      };
      if (tenantId) {
        await updateScriptForTenant(tenantId, script.id, scriptUpdate);
      } else {
        await updateScript(script.id, scriptUpdate);
      }
    }

    onProgress?.(execution);
  }

  return execution;
}

async function executeSteps(
  steps: ScriptStep[],
  deviceId: string,
  execution: ScheduleHistory,
  ctrl: { abort: boolean },
  onProgress?: ProgressCallback,
  tenantId?: string,
  deviceIndex?: number
) {
  const saveFn = tenantId
    ? () => saveExecutionForTenant(tenantId, execution)
    : () => saveExecution(execution);

  for (const step of steps) {
    if (ctrl.abort) throw new Error('Execution aborted');

    const execStep: ExecutionStep = {
      index: execution.steps.length,
      type: step.type,
      description: describeStep(step),
      status: 'running',
      startedAt: new Date().toISOString(),
    };
    execution.steps.push(execStep);
    onProgress?.(execution);

    try {
      // Auto pre-delay để iPhone kịp load UI giữa các node.
      // Children của repeat cũng sẽ nhận delay này qua đệ quy executeSteps.
      if (!NO_PREDELAY_STEP_TYPES.has(step.type)) {
        await sleep(AUTO_PREDELAY_MS);
        if (ctrl.abort) throw new Error('Execution aborted');
      }

      await executeStep(step, deviceId, execution, ctrl, onProgress, tenantId, deviceIndex);
      execStep.status = 'success';
      execStep.finishedAt = new Date().toISOString();
    } catch (err) {
      execStep.status = 'error';
      execStep.error = err instanceof Error ? err.message : 'Unknown error';
      execStep.finishedAt = new Date().toISOString();
      const fatalTypes = ['launch'];
      if (fatalTypes.includes(step.type)) {
        throw err;
      }
    }

    await saveFn();
    onProgress?.(execution);
  }
}

async function executeStep(
  step: ScriptStep,
  deviceId: string,
  execution: ScheduleHistory,
  ctrl: { abort: boolean },
  onProgress?: ProgressCallback,
  tenantId?: string,
  deviceIndex?: number
) {
  const p = step.params;

  switch (step.type) {
    case 'tap': {
      const res = await callDeviceApi(deviceId, 'POST', '/api/tap', { x: Number(p.x), y: Number(p.y) });
      if (!res.ok) throw new Error(`Tap failed: ${res.error}`);
      break;
    }
    case 'double_tap': {
      const x = Number(p.x) || 0.5;
      const y = Number(p.y) || 0.4;
      const res = await callDeviceApi(deviceId, 'POST', '/api/doubletap', { x, y, delay: 0.1 });
      if (!res.ok) throw new Error(`Double-tap failed: ${res.error}`);
      break;
    }
    case 'tap_image': {
      const x = Number(p.fallbackX ?? p.x) || 0.5;
      const y = Number(p.fallbackY ?? p.y) || 0.5;
      const res = await callDeviceApi(deviceId, 'POST', '/api/tap', { x, y });
      if (!res.ok) throw new Error(`Tap failed: ${res.error}`);
      break;
    }
    case 'send_file': {
      const videoId = String(p.videoId || '');
      if (!videoId) throw new Error('No video selected');

      const videos = tenantId
        ? await readUserCollection<{ id: string; url: string; name: string }>(tenantId, 'videos')
        : await readCollection<{ id: string; url: string; name: string }>('videos');
      const video = videos.find(v => v.id === videoId);
      if (!video) throw new Error(`Video not found: ${videoId}`);

      const foundDev = await findDeviceGlobal(deviceId);
      const dev = foundDev?.device ?? await getDevice(deviceId);
      if (!dev) throw new Error('Device not found');
      const apiPort = dev.httpPort + 1;
      const apiUrl = `http://${dev.tailscaleIp}:${apiPort}/api/save-to-photos`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200000);
      try {
        const apiRes = await fetch(apiUrl, {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: video.url }),
        });
        clearTimeout(timeout);
        const data = await apiRes.json().catch(() => null);
        if (!data?.ok) throw new Error(data?.error || 'Gửi file thất bại');
      } catch (err) {
        clearTimeout(timeout);
        if (err instanceof Error && err.name === 'AbortError') throw new Error('Timeout tải file');
        throw err;
      }
      await new Promise(r => setTimeout(r, 3000));
      break;
    }
    case 'select_video': {
      const tapX = Number(p.tapX) || 0.12;
      const tapY = Number(p.tapY) || 0.25;
      const res = await callDeviceApi(deviceId, 'POST', '/api/tap', { x: tapX, y: tapY });
      if (!res.ok) throw new Error(`Select video tap failed: ${res.error}`);
      break;
    }
    case 'clear_photos': {
      const res = await callDeviceApi(deviceId, 'POST', '/api/clear-photos', {
        deleteX: Number(p.deleteX) || 0.75,
        deleteY: Number(p.deleteY) || 0.53,
        trashDeleteX: Number(p.trashDeleteX) || 0.75,
        trashDeleteY: Number(p.trashDeleteY) || 0.53,
      });
      if (!res.ok) throw new Error(`Clear photos failed: ${res.error}`);
      await new Promise(r => setTimeout(r, 18000));
      break;
    }
    case 'swipe': {
      const res = await callDeviceApi(deviceId, 'POST', '/api/swipe', {
        fromX: p.fromX, fromY: p.fromY, toX: p.toX, toY: p.toY, duration: p.duration,
      });
      if (!res.ok) throw new Error(`Swipe failed: ${res.error}`);
      break;
    }
    case 'type': {
      const res = await callDeviceApi(deviceId, 'POST', '/api/type', { text: p.text });
      if (!res.ok) throw new Error(`Type failed: ${res.error}`);
      break;
    }
    case 'key': {
      const res = await callDeviceApi(deviceId, 'POST', '/api/key', { key: p.key });
      if (!res.ok) throw new Error(`Key failed: ${res.error}`);
      break;
    }
    case 'launch': {
      const res = await callDeviceApi(deviceId, 'POST', '/api/launch', { bundleId: p.bundleId });
      if (!res.ok) throw new Error(`Launch failed: ${res.error}`);
      break;
    }
    case 'screenshot': {
      const res = await callDeviceApi(deviceId, 'GET', '/api/screenshot');
      if (!res.ok) throw new Error(`Screenshot failed: ${res.error}`);
      const currentStep = execution.steps[execution.steps.length - 1];
      if (currentStep) currentStep.screenshotUrl = `data:image/jpeg;base64,${res.data}`;
      break;
    }
    case 'clipboard': {
      if (p.text !== undefined) {
        const res = await callDeviceApi(deviceId, 'POST', '/api/clipboard', { text: p.text });
        if (!res.ok) throw new Error(`Clipboard write failed: ${res.error}`);
      } else {
        const res = await callDeviceApi(deviceId, 'GET', '/api/clipboard');
        if (!res.ok) throw new Error(`Clipboard read failed: ${res.error}`);
      }
      break;
    }
    case 'wait': {
      const seconds = Number(p.seconds) || 1;
      await sleep(seconds * 1000);
      break;
    }
    case 'wait_random': {
      const min = Number(p.min) || 1;
      const max = Number(p.max) || 3;
      const delay = min + Math.random() * (max - min);
      await sleep(delay * 1000);
      break;
    }
    case 'wait_for_pixel': {
      const pixelX = Number(p.pixelX);
      const pixelY = Number(p.pixelY);
      const expectedHex = String(p.expectedColor || '#000000');
      const tolerance = Number(p.tolerance ?? 15);
      const interval = Math.max(100, Number(p.interval ?? 500));
      const maxWaitSec = Number(p.maxWait ?? 30);

      if (isNaN(pixelX) || pixelX < 0 || pixelX > 1) {
        throw new Error(`wait_for_pixel: pixelX phải 0-1, nhận: ${p.pixelX}`);
      }
      if (isNaN(pixelY) || pixelY < 0 || pixelY > 1) {
        throw new Error(`wait_for_pixel: pixelY phải 0-1, nhận: ${p.pixelY}`);
      }
      const expected = parseHexColor(expectedHex);
      if (!expected) {
        throw new Error(`wait_for_pixel: màu hex không hợp lệ: ${expectedHex}`);
      }
      if (maxWaitSec <= 0 || maxWaitSec > 600) {
        throw new Error(`wait_for_pixel: maxWait phải 1-600 giây, nhận: ${p.maxWait}`);
      }

      const deadline = Date.now() + maxWaitSec * 1000;
      let lastError: string | null = null;
      let pollCount = 0;

      while (Date.now() < deadline) {
        if (ctrl.abort) throw new Error('Execution aborted');
        pollCount++;

        try {
          const shotRes = await callDeviceApi(deviceId, 'GET', '/api/screenshot');
          if (shotRes.ok && typeof shotRes.data === 'string') {
            const img = await decodeJpegBase64(shotRes.data);
            const actual = getPixelAt(img, pixelX, pixelY);
            if (compareColor(actual, expected, tolerance)) {
              break;
            }
            lastError = `RGB (${actual.r},${actual.g},${actual.b}) !== expected (${expected.r},${expected.g},${expected.b}) ±${tolerance}`;
          } else {
            lastError = `Screenshot failed: ${shotRes.error || 'unknown'}`;
          }
        } catch (err) {
          lastError = err instanceof Error ? err.message : 'Decode failed';
        }

        if (ctrl.abort) throw new Error('Execution aborted');
        await sleep(interval);
      }

      if (Date.now() >= deadline) {
        throw new Error(
          `wait_for_pixel timeout sau ${maxWaitSec}s (${pollCount} polls). ${lastError || ''}`
        );
      }
      break;
    }
    case 'repeat': {
      const count = Number(p.count) || 1;
      for (let i = 0; i < count; i++) {
        if (ctrl.abort) throw new Error('Execution aborted');
        if (step.children) {
          await executeSteps(step.children, deviceId, execution, ctrl, onProgress, tenantId, deviceIndex);
        }
      }
      break;
    }
    case 'repeat_forever': {
      while (!ctrl.abort) {
        if (step.children) {
          await executeSteps(step.children, deviceId, execution, ctrl, onProgress, tenantId, deviceIndex);
        }
      }
      break;
    }
    case 'login_account': {
      const accountIds: string[] = Array.isArray(p.accountIds) ? p.accountIds as string[] : [];
      if (accountIds.length === 0) {
        throw new Error('Login account: không có tài khoản nào được chọn');
      }

      // Fetch accounts từ tenant storage
      const allAccounts = tenantId
        ? await readUserCollection<any>(tenantId, 'social-accounts')
        : [];

      // Filter chỉ accounts đã chọn, giữ đúng thứ tự
      const selectedAccounts = accountIds
        .map(id => allAccounts.find((a: any) => a.id === id))
        .filter(Boolean);

      if (selectedAccounts.length === 0) {
        throw new Error('Login account: không tìm thấy tài khoản đã chọn');
      }

      // Round-robin: deviceIndex % số accounts
      const accIdx = (deviceIndex ?? 0) % selectedAccounts.length;
      const account = selectedAccounts[accIdx];

      // 1. Tap vị trí username
      await callDeviceApi(deviceId, 'POST', '/api/tap', {
        x: Number(p.usernameX) || 0.5,
        y: Number(p.usernameY) || 0.3,
      });
      await sleep(3000);

      // 2. Gõ username
      await callDeviceApi(deviceId, 'POST', '/api/type', {
        text: account.username,
      });
      await sleep(3000);

      // 3. Tap vị trí password
      await callDeviceApi(deviceId, 'POST', '/api/tap', {
        x: Number(p.passwordX) || 0.5,
        y: Number(p.passwordY) || 0.5,
      });
      await sleep(3000);

      // 4. Gõ password
      await callDeviceApi(deviceId, 'POST', '/api/type', {
        text: account.password,
      });

      break;
    }

    case 'login_mail': {
      const accountIds: string[] = Array.isArray(p.accountIds) ? p.accountIds as string[] : [];
      if (accountIds.length === 0) {
        throw new Error('Login mail: không có tài khoản nào được chọn');
      }

      const allAccounts = tenantId
        ? await readUserCollection<any>(tenantId, 'social-accounts')
        : [];

      const selectedAccounts = accountIds
        .map(id => allAccounts.find((a: any) => a.id === id))
        .filter(Boolean);

      if (selectedAccounts.length === 0) {
        throw new Error('Login mail: không tìm thấy tài khoản đã chọn');
      }

      const accIdx = (deviceIndex ?? 0) % selectedAccounts.length;
      const account = selectedAccounts[accIdx];

      // 1. Tap vị trí email
      await callDeviceApi(deviceId, 'POST', '/api/tap', {
        x: Number(p.emailX) || 0.5,
        y: Number(p.emailY) || 0.3,
      });
      await sleep(3000);

      // 2. Gõ email
      await callDeviceApi(deviceId, 'POST', '/api/type', {
        text: account.email,
      });
      await sleep(3000);

      // 3. Tap vị trí email password
      await callDeviceApi(deviceId, 'POST', '/api/tap', {
        x: Number(p.emailPassX) || 0.5,
        y: Number(p.emailPassY) || 0.5,
      });
      await sleep(3000);

      // 4. Gõ email password
      await callDeviceApi(deviceId, 'POST', '/api/type', {
        text: account.emailPassword,
      });

      break;
    }

    case 'input_username':
    case 'input_password':
    case 'input_email':
    case 'input_email_pass': {
      const accountIds: string[] = Array.isArray(p.accountIds) ? p.accountIds as string[] : [];
      if (accountIds.length === 0) {
        throw new Error(`${step.type}: không có tài khoản nào được chọn`);
      }

      const allAccounts = tenantId
        ? await readUserCollection<any>(tenantId, 'social-accounts')
        : [];

      const selectedAccounts = accountIds
        .map(id => allAccounts.find((a: any) => a.id === id))
        .filter(Boolean);

      if (selectedAccounts.length === 0) {
        throw new Error(`${step.type}: không tìm thấy tài khoản đã chọn`);
      }

      const accIdx = (deviceIndex ?? 0) % selectedAccounts.length;
      const account = selectedAccounts[accIdx];

      // Xác định trường cần gõ
      const fieldMap: Record<string, string> = {
        input_username: 'username',
        input_password: 'password',
        input_email: 'email',
        input_email_pass: 'emailPassword',
      };
      const textToType = account[fieldMap[step.type]] || '';

      // Tap vị trí
      await callDeviceApi(deviceId, 'POST', '/api/tap', {
        x: Number(p.tapX) || 0.5,
        y: Number(p.tapY) || 0.5,
      });
      await sleep(3000);

      // Gõ text
      await callDeviceApi(deviceId, 'POST', '/api/type', { text: textToType });

      break;
    }

    case 'get_otp_mail': {
      const accountIds: string[] = Array.isArray(p.accountIds) ? p.accountIds as string[] : [];
      if (accountIds.length === 0) throw new Error('Lấy OTP: không có tài khoản nào');

      const allAccounts = tenantId
        ? await readUserCollection<any>(tenantId, 'social-accounts')
        : [];
      const selectedAccounts = accountIds
        .map(id => allAccounts.find((a: any) => a.id === id))
        .filter(Boolean);
      if (selectedAccounts.length === 0) throw new Error('Lấy OTP: không tìm thấy tài khoản');

      const accIdx = (deviceIndex ?? 0) % selectedAccounts.length;
      const account = selectedAccounts[accIdx];

      if (!account.gmailRefreshToken) {
        throw new Error(`Lấy OTP: tài khoản "${account.email}" chưa authorize Gmail`);
      }

      // Load Gmail OAuth config
      const appSettings = await readSingleton<any>('settings', {});
      const gmailConfig = appSettings.gmailOAuth;
      if (!gmailConfig?.clientId || !gmailConfig?.clientSecret) {
        throw new Error('Lấy OTP: chưa cấu hình Gmail OAuth trong Settings');
      }

      // Create Gmail client
      const { google } = await import('googleapis');
      const oauth2Client = new google.auth.OAuth2(gmailConfig.clientId, gmailConfig.clientSecret);
      oauth2Client.setCredentials({ refresh_token: account.gmailRefreshToken });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

      // Poll for OTP email
      const timeout = (Number(p.waitTimeout) || 60) * 1000;
      const startTime = Date.now();
      const pollInterval = 5000;
      // Chỉ nhận email trong 10 phút gần nhất — đồng bộ với Gmail query newer_than:10m.
      // TikTok thường gửi OTP trước khi node chạy vài chục giây đến vài phút.
      const minInternalDate = startTime - 10 * 60 * 1000;
      let otpCode: string | null = null;
      let otpMessageId: string | null = null;
      let lastGmailError: string | null = null;
      const seenMessageIds = new Set<string>();

      console.log(`[OTP] Bắt đầu poll Gmail cho ${account.email} (timeout ${timeout / 1000}s)`);

      while (Date.now() - startTime < timeout) {
        if (ctrl.abort) throw new Error('Execution aborted');

        try {
          const listRes = await gmail.users.messages.list({
            userId: 'me',
            // Không dùng is:unread (email có thể đã bị preview/mark read trên mobile).
            // newer_than:10m để bắt được cả email đã gửi trước node OTP.
            q: 'newer_than:10m (from:tiktok OR from:accounts OR subject:verification OR subject:verify OR subject:code OR subject:xác OR subject:OTP)',
            maxResults: 10,
          });

          const messages = listRes.data.messages || [];
          console.log(`[OTP] Gmail trả về ${messages.length} email ứng viên`);

          for (const msg of messages) {
            if (!msg.id || seenMessageIds.has(msg.id)) continue;
            seenMessageIds.add(msg.id);

            const detail = await gmail.users.messages.get({
              userId: 'me',
              id: msg.id,
              format: 'full',
            });

            const internalDate = Number(detail.data.internalDate || 0);
            if (internalDate > 0 && internalDate < minInternalDate) {
              console.log(`[OTP] Bỏ qua email cũ (internalDate=${new Date(internalDate).toISOString()})`);
              continue;
            }

            const subject = getGmailHeader(detail.data, 'Subject');
            const from = getGmailHeader(detail.data, 'From');
            const body = extractGmailBody(detail.data);
            console.log(`[OTP] Kiểm tra email from="${from}" subject="${subject}"`);

            const code = parseOtpCode(subject + '\n' + body);
            if (code) {
              otpCode = code;
              otpMessageId = msg.id;
              console.log(`[OTP] ✓ Tìm thấy code "${code}" trong email từ ${from}`);
              break;
            }
          }
        } catch (gmailErr: any) {
          lastGmailError = gmailErr?.message || String(gmailErr);
          console.error('[OTP] Gmail API error:', lastGmailError);
          // Nếu refresh token bị revoke/invalid thì ném luôn, không cần poll tiếp
          if (/invalid_grant|unauthorized|401|403/i.test(lastGmailError)) {
            throw new Error(`Lấy OTP: Gmail auth lỗi - cần authorize lại tài khoản "${account.email}". Chi tiết: ${lastGmailError}`);
          }
        }

        if (otpCode) break;
        await sleep(pollInterval);
      }

      if (!otpCode) {
        const hint = lastGmailError ? ` (lỗi Gmail cuối: ${lastGmailError})` : '';
        throw new Error(`Lấy OTP: không tìm thấy OTP trong ${p.waitTimeout}s${hint}`);
      }

      // Mark email read để lần chạy sau không lấy nhầm OTP cũ
      if (otpMessageId) {
        try {
          await gmail.users.messages.modify({
            userId: 'me',
            id: otpMessageId,
            requestBody: { removeLabelIds: ['UNREAD'] },
          });
        } catch (markErr: any) {
          console.warn('[OTP] Không mark read được:', markErr?.message);
        }
      }

      // Tap vị trí OTP + gõ code
      await callDeviceApi(deviceId, 'POST', '/api/tap', {
        x: Number(p.tapX) || 0.5,
        y: Number(p.tapY) || 0.5,
      });
      await sleep(1500);

      await callDeviceApi(deviceId, 'POST', '/api/type', { text: otpCode });

      break;
    }

    default:
      break;
  }
}

// --- Gmail OTP helpers ---

export function extractGmailBody(message: any): string {
  // Recursive walk để xử lý multipart/alternative và multipart/related
  function walk(part: any): string {
    if (!part) return '';
    if (part.mimeType === 'text/plain' && part.body?.data) {
      return Buffer.from(part.body.data, 'base64url').toString('utf-8');
    }
    if (Array.isArray(part.parts)) {
      for (const sub of part.parts) {
        const found = walk(sub);
        if (found) return found;
      }
    }
    if (part.mimeType === 'text/html' && part.body?.data) {
      const html = Buffer.from(part.body.data, 'base64url').toString('utf-8');
      return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
    }
    return '';
  }

  const fromParts = walk(message.payload);
  if (fromParts) return fromParts;
  if (message.payload?.body?.data) {
    return Buffer.from(message.payload.body.data, 'base64url').toString('utf-8');
  }
  return message.snippet || '';
}

export function getGmailHeader(message: any, name: string): string {
  const headers = message?.payload?.headers || [];
  const lower = name.toLowerCase();
  for (const h of headers) {
    if ((h.name || '').toLowerCase() === lower) return h.value || '';
  }
  return '';
}

const OTP_PATTERNS = [
  // "123456 is your verification code", "123456 là mã xác minh"
  /\b(\d{4,8})\s*(?:is your|là mã|là code|is the code)/i,
  // "code/mã/verification: 123456"
  /(?:code|mã|verification|xác minh|xác nhận|confirm|verify|OTP)[\s:]+(\d{4,8})/i,
  // "Your code is 123456"
  /(?:your|the)\s+(?:code|verification|otp)[^\d]{0,20}(\d{4,8})/i,
  // Fallback: 6 chữ số đứng riêng (TikTok dùng 6 digits)
  /\b(\d{6})\b/,
  // Fallback cuối: 4-8 chữ số
  /\b(\d{4,8})\b/,
];

export function parseOtpCode(text: string): string | null {
  for (const pattern of OTP_PATTERNS) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const APP_NAMES: Record<string, string> = {
  'com.ss.iphone.ugc.Ame': 'Mở TikTok VN',
  'com.zhiliaoapp.musically': 'Mở TikTok US',
  'com.facebook.Facebook': 'Mở Facebook',
  'com.apple.mobilemail': 'Mở Mail',
};

function describeStep(step: ScriptStep): string {
  const p = step.params;
  const label = p._nodeLabel as string | undefined;

  switch (step.type) {
    case 'tap':
    case 'double_tap':
      // Hiển thị tên node thân thiện (vd: "Bấm đăng bài") thay vì toạ độ
      return label || `Tap (${p.x}, ${p.y})`;
    case 'tap_image':
      return label || `Tap hình ảnh: ${p.templateName}`;
    case 'swipe': {
      if (label) return label;
      // Nhận diện swipe direction theo default params
      if (Number(p.fromY) >= 0.7 && Number(p.toY) <= 0.3) return 'Lướt lên';
      if (Number(p.fromY) <= 0.4 && Number(p.toY) >= 0.7) return 'Lướt xuống';
      if (Number(p.fromX) >= 0.8 && Number(p.toX) <= 0.2) return 'Lướt trái';
      if (Number(p.fromX) <= 0.2 && Number(p.toX) >= 0.8) return 'Lướt phải';
      return 'Vuốt toạ độ';
    }
    case 'type': return `Gõ text: "${p.text}"`;
    case 'key': {
      if (p.key === 'home') return 'Nút Home';
      return `Phím: ${p.key}`;
    }
    case 'launch':
      return APP_NAMES[p.bundleId as string] || `Mở app: ${p.bundleId}`;
    case 'screenshot': return 'Chụp ảnh màn hình';
    case 'clipboard': return p.text ? `Đặt clipboard: "${p.text}"` : 'Đọc clipboard';
    case 'send_file': return label || 'Truyền file video';
    case 'select_video': return label || 'Chọn video';
    case 'clear_photos': return 'Xoá Photos';
    case 'login_account': {
      const ids: string[] = Array.isArray(p.accountIds) ? p.accountIds as string[] : [];
      return `Login tài khoản (${ids.length} TK)`;
    }
    case 'login_mail': {
      const ids2: string[] = Array.isArray(p.accountIds) ? p.accountIds as string[] : [];
      return `Login Mail (${ids2.length} TK)`;
    }
    case 'input_username': return `Nhập tài khoản (${(Array.isArray(p.accountIds) ? p.accountIds.length : 0)} TK)`;
    case 'input_password': return `Nhập mật khẩu (${(Array.isArray(p.accountIds) ? p.accountIds.length : 0)} TK)`;
    case 'input_email': return `Nhập email (${(Array.isArray(p.accountIds) ? p.accountIds.length : 0)} TK)`;
    case 'input_email_pass': return `Nhập pass mail (${(Array.isArray(p.accountIds) ? p.accountIds.length : 0)} TK)`;
    case 'get_otp_mail': return `Lấy OTP Mail (timeout ${p.waitTimeout}s)`;
    case 'wait': return `Chờ ${p.seconds} giây`;
    case 'wait_random': return `Chờ ngẫu nhiên ${p.min}-${p.max} giây`;
    case 'repeat': return `Lặp lại ${p.count} lần`;
    case 'repeat_forever': return 'Lặp vô hạn';
    default: return label || step.type;
  }
}
