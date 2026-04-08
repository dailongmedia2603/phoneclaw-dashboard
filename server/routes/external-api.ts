/**
 * External API v1 Routes — /api/v1/external/*
 *
 * Authenticated via API Token (apiTokenAuthMiddleware).
 * Provides full access to user's resources for external software integration.
 */

import { Router, Request, Response } from 'express';
import { getAuthUserId } from '../helpers/get-user';
import { readUserCollection, readCollection, writeUserCollection } from '../store';
import { executeScript, executeScriptDirect } from '../services/script-engine';
import type { Script } from '../../src/types';

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
 * POST /api/v1/external/scripts/:id/run
 * Run a script on a device.
 *
 * Body: {
 *   deviceId: string,
 *   variables?: Record<string, string>  // Inject into {{key}} placeholders
 * }
 *
 * Uses correct script-engine interface:
 * - No variables → executeScript(scriptId, deviceId, name, undefined, tenantId)
 * - With variables → executeScriptDirect(modifiedScript, deviceId, name, undefined, tenantId)
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
    let isShared = false;

    if (!script) {
      const shared = await readCollection<Script>('shared-scripts');
      script = shared.find(s => s.id === req.params.id);
      isShared = !!script;
    }
    if (!script) {
      return res.status(404).json({ success: false, error: 'Script not found' });
    }

    const scheduleName = `API: ${script.name}`;

    if (variables && Object.keys(variables).length > 0) {
      // Has variables → inject then use executeScriptDirect
      const modifiedScript: Script = {
        ...script,
        steps: injectVariables(script.steps, variables),
      };
      // Fire and forget (same pattern as scripts.ts:75)
      executeScriptDirect(modifiedScript, deviceId, scheduleName, undefined, userId, 0).catch(err => {
        console.error('[External API] Script execution error:', err.message);
      });
    } else {
      // No variables → use executeScript
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
        hasVariables: !!(variables && Object.keys(variables).length > 0),
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: `Execution failed: ${err.message}` });
  }
});

/**
 * Inject variables into script steps.
 * Replaces {{variable_name}} with actual values.
 */
function injectVariables(steps: any[], variables: Record<string, string>): any[] {
  const json = JSON.stringify(steps);
  let result = json;
  for (const [key, value] of Object.entries(variables)) {
    const safeValue = value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    result = result.replace(new RegExp(`\\{\\{${escapeRegex(key)}\\}\\}`, 'g'), safeValue);
  }
  return JSON.parse(result);
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

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

export default router;
