import { Router } from 'express';
import * as se from '../services/script-engine';
import { findDeviceGlobal } from '../services/device-manager';
import { getTenantId, getAuthUserId } from '../helpers/get-user';
import { checkQuota } from '../helpers/check-quota';
import {
  validateInputsSchema,
  resolveScriptInputs,
  InputValidationError,
} from '../services/script-inputs';
import { injectVariables, extractPlaceholders } from '../helpers/inject-variables';
import type { Script, ScriptInput } from '../../src/types';

const router = Router();

// GET /api/scripts
router.get('/', async (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: await se.getScriptsForTenant(tenantId) });
});

// GET /api/scripts/:id
router.get('/:id', async (req, res) => {
  const tenantId = getTenantId(req);
  const scripts = await se.getScriptsForTenant(tenantId);
  const script = scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true, data: script });
});

// POST /api/scripts
router.post('/', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  // Enforce scripts quota
  const quota = await checkQuota(req, 'scripts');
  if (!quota.allowed) return res.status(403).json({ success: false, error: quota.error });

  const { name, description, steps, channel, graphData, inputs } = req.body;
  if (!name) return res.status(400).json({ success: false, error: 'name is required' });

  try {
    validateInputsSchema(inputs);
  } catch (err: any) {
    if (err instanceof InputValidationError) {
      return res.status(400).json({ success: false, error: err.message, field: err.field });
    }
    throw err;
  }

  const script = await se.createScriptForTenant(userId, {
    name,
    description: description || '',
    steps: steps || [],
    channel,
    graphData,
    inputs,
  });
  res.status(201).json({ success: true, data: script });
});

// PUT /api/scripts/:id
router.put('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  if (req.body?.inputs !== undefined) {
    try {
      validateInputsSchema(req.body.inputs);
    } catch (err: any) {
      if (err instanceof InputValidationError) {
        return res.status(400).json({ success: false, error: err.message, field: err.field });
      }
      throw err;
    }
  }

  const script = await se.updateScriptForTenant(userId, req.params.id, req.body);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true, data: script });
});

// DELETE /api/scripts/:id
router.delete('/:id', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const ok = await se.deleteScriptForTenant(userId, req.params.id);
  if (!ok) return res.status(404).json({ success: false, error: 'Script not found' });
  res.json({ success: true });
});

// POST /api/scripts/:id/run — run script on a device
router.post('/:id/run', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const { deviceId, variables } = req.body;
  if (!deviceId) return res.status(400).json({ success: false, error: 'deviceId is required' });

  // Check script ownership
  const userScripts = await se.getScriptsForTenant(userId);
  const script = userScripts.find(s => s.id === req.params.id);
  if (!script) return res.status(403).json({ success: false, error: 'Không có quyền chạy script này' });

  // Check device ownership
  const found = await findDeviceGlobal(deviceId);
  if (!found) return res.status(404).json({ success: false, error: 'Device not found' });
  if (found.tenantId !== userId) {
    return res.status(403).json({ success: false, error: 'Không có quyền truy cập thiết bị này' });
  }

  // Resolve + validate variables (backward-compat: no schema → pass-through)
  let resolved: Record<string, string>;
  try {
    resolved = await resolveScriptInputs(script, variables, userId);
  } catch (err: any) {
    if (err instanceof InputValidationError) {
      return res.status(400).json({ success: false, error: err.message, field: err.field });
    }
    throw err;
  }

  if (Object.keys(resolved).length > 0) {
    const modified: Script = {
      ...script,
      steps: injectVariables(script.steps, resolved) as Script['steps'],
    };
    se.executeScriptDirect(modified, deviceId, 'Manual run', undefined, userId, 0).catch(err => {
      console.error('Script execution error:', err);
    });
  } else {
    se.executeScript(req.params.id, deviceId, 'Manual run', undefined, userId, 0).catch(err => {
      console.error('Script execution error:', err);
    });
  }

  res.json({ success: true, data: { executionId: '', status: 'started', scriptName: script.name } });
});

// GET /api/scripts/executions/latest — get latest execution status
router.get('/executions/latest', async (req, res) => {
  const tenantId = getTenantId(req);
  const history = await se.getExecutionHistoryForTenant(tenantId);
  const latest = history.length > 0 ? history[history.length - 1] : null;
  res.json({ success: true, data: latest });
});

// POST /api/scripts/:id/stop
router.post('/:id/stop', (req, res) => {
  const { executionId } = req.body;
  if (!executionId) return res.status(400).json({ success: false, error: 'executionId is required' });
  se.stopExecution(executionId);
  res.json({ success: true });
});

// GET /api/scripts/history/all
router.get('/history/all', async (req, res) => {
  const tenantId = getTenantId(req);
  res.json({ success: true, data: await se.getExecutionHistoryForTenant(tenantId) });
});

// GET /api/scripts/:id/suggested-inputs
// Scans steps for {{placeholders}} not yet declared in script.inputs, returns
// suggested ScriptInput entries with inferred types (heuristic from placeholder name).
router.get('/:id/suggested-inputs', async (req, res) => {
  const userId = getAuthUserId(req);
  if (!userId) return res.status(401).json({ success: false, error: 'Unauthorized' });

  const scripts = await se.getScriptsForTenant(userId);
  const script = scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ success: false, error: 'Script not found' });

  const found = extractPlaceholders(script.steps);
  const existing = new Set((script.inputs ?? []).map(i => i.name));
  const missing = found.filter(n => !existing.has(n));

  const suggestions: ScriptInput[] = missing.map(name => inferInputSpec(name, script.steps));
  res.json({ success: true, data: { found, missing, suggestions } });
});

function inferInputSpec(name: string, steps: unknown[]): ScriptInput {
  const nameLower = name.toLowerCase();
  const json = JSON.stringify(steps);
  const placeholder = `{{${name}}}`;

  let type: ScriptInput['type'] = 'string';
  if (nameLower.includes('video') || nameLower.endsWith('_file')) type = 'video';
  else if (nameLower.endsWith('_url') || nameLower === 'url') type = 'url';
  else if (
    nameLower === 'caption' ||
    nameLower.includes('content') ||
    nameLower.includes('desc') ||
    nameLower.includes('text') ||
    json.includes(`"text":"${placeholder}"`) ||
    json.includes(`"text": "${placeholder}"`)
  ) {
    type = 'text';
  }

  return {
    name,
    label: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    type,
    required: true,
  };
}

export default router;
