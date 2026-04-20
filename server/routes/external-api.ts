/**
 * External API v1 Routes — /api/v1/external/*
 *
 * Authenticated via API Token (apiTokenAuthMiddleware).
 * Provides full access to user's resources for external software integration.
 */

import { Router, Request, Response } from 'express';
import { getAuthUserId } from '../helpers/get-user';
import { readUserCollection, readCollection, writeUserCollection, generateId } from '../store';
import { executeScript, executeScriptDirect } from '../services/script-engine';
import { checkVideoStorage } from '../helpers/check-quota';
import { injectVariables } from '../helpers/inject-variables';
import { resolveScriptInputs, InputValidationError } from '../services/script-inputs';
import type { Script } from '../../src/types';

interface ExternalVideo {
  id: string;
  name: string;
  filename: string;
  r2Key: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  ownerId?: string;
  source?: 'upload' | 'url';
}

const router = Router();

// ============================================================
// Account Info
// ============================================================

router.get('/me', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const users = await readCollection<any>('users');
    const user = users.find((u: any) => u.id === userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const devices = await readUserCollection<any>(userId, 'devices');
    const scripts = await readUserCollection<any>(userId, 'scripts');
    const schedules = await readUserCollection<any>(userId, 'schedules');

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        stats: {
          totalDevices: devices.length,
          onlineDevices: devices.filter((d: any) => d.status === 'online').length,
          totalScripts: scripts.length,
          totalSchedules: schedules.length,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Devices
// ============================================================

router.get('/devices', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    let devices = await readUserCollection<any>(userId, 'devices');

    const statusFilter = req.query.status as string;
    if (statusFilter) {
      devices = devices.filter((d: any) => d.status === statusFilter);
    }

    res.json({
      success: true,
      data: devices.map((d: any) => ({
        id: d.id,
        name: d.name,
        tailscaleIp: d.tailscaleIp,
        status: d.status,
        model: d.model,
        iosVersion: d.iosVersion,
        battery: d.battery,
        uptime: d.uptime,
        lastSeen: d.lastSeen,
        currentScript: d.currentScript,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/devices/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const devices = await readUserCollection<any>(userId, 'devices');
    const device = devices.find((d: any) => d.id === req.params.id);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    res.json({ success: true, data: device });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/devices/:id/screenshot', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const devices = await readUserCollection<any>(userId, 'devices');
    const device = devices.find((d: any) => d.id === req.params.id);
    if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

    const response = await fetch(`http://${device.tailscaleIp}:${device.httpPort}/screenshot`);
    if (!response.ok) throw new Error('Screenshot failed');

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', 'image/png');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Screenshot failed: ${err.message}` });
  }
});

// ============================================================
// Scripts
// ============================================================

router.get('/scripts', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const userScripts = await readUserCollection<any>(userId, 'scripts');
    const sharedScripts = await readCollection<any>('shared-scripts');

    res.json({
      success: true,
      data: {
        own: userScripts.map((s: any) => ({
          id: s.id, name: s.name, description: s.description, channel: s.channel,
          status: s.status, runCount: s.runCount, lastRun: s.lastRun,
          createdAt: s.createdAt, updatedAt: s.updatedAt, steps: s.steps,
        })),
        shared: sharedScripts.map((s: any) => ({
          id: s.id, name: s.name, description: s.description, channel: s.channel,
          status: s.status, steps: s.steps, isShared: true,
        })),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/scripts/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const scripts = await readUserCollection<any>(userId, 'scripts');
    let script = scripts.find((s: any) => s.id === req.params.id);

    if (!script) {
      const sharedScripts = await readCollection<any>('shared-scripts');
      script = sharedScripts.find((s: any) => s.id === req.params.id);
      if (script) script = { ...script, isShared: true };
    }

    if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
    res.json({ success: true, data: script });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/v1/external/scripts/:id/inputs
 * Returns the input schema for a script so external software can discover
 * required/optional variables before calling /run.
 *
 * Response: { success: true, data: { scriptId, name, inputs: ScriptInput[] } }
 */
router.get('/scripts/:id/inputs', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const scripts = await readUserCollection<Script>(userId, 'scripts');
    let script = scripts.find(s => s.id === req.params.id);
    if (!script) {
      const shared = await readCollection<Script>('shared-scripts');
      script = shared.find(s => s.id === req.params.id);
    }
    if (!script) return res.status(404).json({ success: false, error: 'Script not found' });

    res.json({
      success: true,
      data: {
        scriptId: script.id,
        name: script.name,
        inputs: script.inputs ?? [],
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/external/scripts/:id/run
 * Run a script on a device.
 *
 * Body: {
 *   deviceId: string,
 *   variables?: Record<string, unknown>  // Inject into {{key}} placeholders
 * }
 *
 * If script.inputs is defined: variables are validated against schema (type,
 * required, maxLength, video ownership). Returns 400 with `field` on validation error.
 * If script.inputs is missing/empty: legacy behavior — variables passed through as strings.
 */
router.post('/scripts/:id/run', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { deviceId, variables } = req.body;
  if (!deviceId) {
    return res.status(400).json({ success: false, error: 'deviceId is required' });
  }

  try {
    // Verify device ownership
    const devices = await readUserCollection<any>(userId, 'devices');
    const device = devices.find((d: any) => d.id === deviceId);
    if (!device) {
      return res.status(403).json({ success: false, error: 'Device not found or not owned by you' });
    }
    if (device.status !== 'online') {
      return res.status(400).json({ success: false, error: `Device is ${device.status}, must be online` });
    }

    // Find script (user's or shared)
    const scripts = await readUserCollection<Script>(userId, 'scripts');
    let script: Script | undefined = scripts.find(s => s.id === req.params.id);
    if (!script) {
      const shared = await readCollection<Script>('shared-scripts');
      script = shared.find(s => s.id === req.params.id);
    }
    if (!script) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }

    // Validate + resolve variables (backward-compat: no schema → pass-through)
    let resolved: Record<string, string>;
    try {
      resolved = await resolveScriptInputs(script, variables, userId);
    } catch (err: any) {
      if (err instanceof InputValidationError) {
        return res.status(400).json({
          success: false,
          error: err.message,
          field: err.field,
        });
      }
      throw err;
    }

    const scheduleName = `API: ${script.name}`;
    const hasVars = Object.keys(resolved).length > 0;

    if (hasVars) {
      const modifiedScript: Script = {
        ...script,
        steps: injectVariables(script.steps, resolved) as Script['steps'],
      };
      executeScriptDirect(modifiedScript, deviceId, scheduleName, undefined, userId, 0).catch(err => {
        console.error('[External API] Script execution error:', err.message);
      });
    } else {
      executeScript(req.params.id, deviceId, scheduleName, undefined, userId, 0).catch(err => {
        console.error('[External API] Script execution error:', err.message);
      });
    }

    res.json({
      success: true,
      data: {
        message: `Script "${script.name}" started on device "${device.name}"`,
        scriptId: script.id,
        deviceId: device.id,
        hasVariables: hasVars,
        resolvedVariables: Object.keys(resolved),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Execution failed: ${err.message}` });
  }
});

// ============================================================
// Schedules
// ============================================================

router.get('/schedules', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const schedules = await readUserCollection<any>(userId, 'schedules');
    res.json({ success: true, data: schedules });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/schedules/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const schedules = await readUserCollection<any>(userId, 'schedules');
    const schedule = schedules.find((s: any) => s.id === req.params.id);
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });
    res.json({ success: true, data: schedule });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.put('/schedules/:id/toggle', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const schedules = await readUserCollection<any>(userId, 'schedules');
    const schedule = schedules.find((s: any) => s.id === req.params.id);
    if (!schedule) return res.status(404).json({ success: false, error: 'Schedule not found' });

    schedule.enabled = !schedule.enabled;
    await writeUserCollection(userId, 'schedules', schedules);

    res.json({ success: true, data: schedule });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Execution History
// ============================================================

router.get('/executions', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    let history = await readUserCollection<any>(userId, 'execution-history');

    const statusFilter = req.query.status as string;
    if (statusFilter) {
      history = history.filter((h: any) => h.status === statusFilter);
    }

    const limit = parseInt(req.query.limit as string) || 50;
    history = history.slice(-limit).reverse();

    res.json({ success: true, data: history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/executions/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const history = await readUserCollection<any>(userId, 'execution-history');
    const execution = history.find((h: any) => h.id === req.params.id);
    if (!execution) return res.status(404).json({ success: false, error: 'Execution not found' });
    res.json({ success: true, data: execution });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Device Control
// ============================================================

router.post('/devices/:id/tap', deviceControlHandler('tap'));
router.post('/devices/:id/swipe', deviceControlHandler('swipe'));
router.post('/devices/:id/type', deviceControlHandler('type'));
router.post('/devices/:id/key', deviceControlHandler('key'));
router.post('/devices/:id/launch', deviceControlHandler('launch'));

function deviceControlHandler(action: string) {
  return async (req: Request, res: Response) => {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

    try {
      const devices = await readUserCollection<any>(userId, 'devices');
      const device = devices.find((d: any) => d.id === req.params.id);
      if (!device) return res.status(404).json({ success: false, error: 'Device not found' });

      if (device.status === 'offline') {
        return res.status(400).json({ success: false, error: 'Device is offline' });
      }

      const response = await fetch(`http://${device.tailscaleIp}:${device.httpPort}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.body),
      });
      const data = await response.json();
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: `Control failed: ${err.message}` });
    }
  };
}

// ============================================================
// Device Groups
// ============================================================

router.get('/device-groups', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const groups = await readUserCollection<any>(userId, 'device-groups');
    res.json({ success: true, data: groups });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================
// Videos (for external integration: register video by URL)
// ============================================================

router.get('/videos', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const videos = await readUserCollection<ExternalVideo>(userId, 'videos');
    videos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    res.json({
      success: true,
      data: videos.map(v => ({
        id: v.id,
        name: v.name,
        filename: v.filename,
        url: v.url,
        size: v.size,
        mimeType: v.mimeType,
        uploadedAt: v.uploadedAt,
        source: v.source || 'upload',
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/videos/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const videos = await readUserCollection<ExternalVideo>(userId, 'videos');
    const video = videos.find(v => v.id === req.params.id);
    if (!video) return res.status(404).json({ success: false, error: 'Video not found' });
    res.json({ success: true, data: video });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/v1/external/videos/register
 * Register a video by URL (no file upload needed).
 * The URL must be PUBLIC and accessible from the iPhone device.
 *
 * Body: { url: string, name?: string, mimeType?: string, size?: number }
 *
 * Returns: { id, name, url, ... } — use `id` as videoId in script run variables.
 */
router.post('/videos/register', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { url, name, mimeType, size } = req.body || {};
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ success: false, error: 'url is required (public, accessible from device)' });
  }
  if (!/^https?:\/\//i.test(url)) {
    return res.status(400).json({ success: false, error: 'url must start with http:// or https://' });
  }

  try {
    // Pre-check: HEAD the URL to validate it's reachable; pull size/mime if not provided.
    let resolvedSize = Number(size) || 0;
    let resolvedMime = (typeof mimeType === 'string' && mimeType) || 'video/mp4';
    let headOk = false;
    try {
      const headRes = await fetch(url, { method: 'HEAD' });
      if (headRes.ok) {
        headOk = true;
        const cl = headRes.headers.get('content-length');
        if (cl && !resolvedSize) resolvedSize = Number(cl) || 0;
        const ct = headRes.headers.get('content-type');
        if (ct && (!mimeType)) resolvedMime = ct.split(';')[0].trim();
      }
    } catch { /* ignore — some CDNs reject HEAD; we'll still register */ }

    // Enforce quota only if we know a size
    if (resolvedSize > 0) {
      const storageCheck = await checkVideoStorage(req, resolvedSize);
      if (!storageCheck.allowed) {
        return res.status(403).json({ success: false, error: storageCheck.error });
      }
    }

    const id = generateId();
    const filename = (() => {
      try { return new URL(url).pathname.split('/').pop() || `${id}.mp4`; }
      catch { return `${id}.mp4`; }
    })();
    const finalName = (typeof name === 'string' && name.trim()) || filename.replace(/\.[^.]+$/, '');

    const video: ExternalVideo = {
      id,
      name: finalName,
      filename,
      r2Key: '', // not stored in R2 — external URL
      url,
      size: resolvedSize,
      mimeType: resolvedMime,
      uploadedAt: new Date().toISOString(),
      ownerId: userId,
      source: 'url',
    };

    const videos = await readUserCollection<ExternalVideo>(userId, 'videos');
    videos.push(video);
    await writeUserCollection(userId, 'videos', videos);

    res.json({
      success: true,
      data: {
        id: video.id,
        name: video.name,
        url: video.url,
        size: video.size,
        mimeType: video.mimeType,
        uploadedAt: video.uploadedAt,
        source: video.source,
        urlReachable: headOk,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Register failed: ${err.message}` });
  }
});

router.delete('/videos/:id', async (req: Request, res: Response) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  try {
    const videos = await readUserCollection<ExternalVideo>(userId, 'videos');
    const video = videos.find(v => v.id === req.params.id);
    if (!video) return res.status(404).json({ success: false, error: 'Video not found' });

    // Only delete metadata for url-registered videos. R2-uploaded videos must be deleted via dashboard.
    if (video.source === 'upload' && video.r2Key) {
      return res.status(400).json({
        success: false,
        error: 'Video này được upload qua dashboard (R2 storage). Vui lòng xoá qua dashboard để giải phóng quota.',
      });
    }

    await writeUserCollection(userId, 'videos', videos.filter(v => v.id !== req.params.id));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
