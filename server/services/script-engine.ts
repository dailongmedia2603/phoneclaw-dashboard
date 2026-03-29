import { readCollection, writeCollection, generateId } from '../store';
import { callDeviceApi, updateDevice, getDevice } from './device-manager';
// vncTap no longer needed — PhoneAgent HTTP API now uses VNC coordinate transform
import type { Script, ScriptStep, ScheduleHistory, ExecutionStep } from '../../src/types';

// --- Script CRUD ---

export function getAllScripts(): Script[] {
  return readCollection<Script>('scripts');
}

export function getScript(id: string): Script | undefined {
  return getAllScripts().find(s => s.id === id);
}

export function createScript(data: Pick<Script, 'name' | 'description' | 'steps'>): Script {
  const scripts = getAllScripts();
  const script: Script = {
    ...data,
    id: generateId(),
    status: 'draft',
    runCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  scripts.push(script);
  writeCollection('scripts', scripts);
  return script;
}

export function updateScript(id: string, data: Partial<Script>): Script | null {
  const scripts = getAllScripts();
  const idx = scripts.findIndex(s => s.id === id);
  if (idx === -1) return null;
  scripts[idx] = { ...scripts[idx], ...data, updatedAt: new Date().toISOString() };
  writeCollection('scripts', scripts);
  return scripts[idx];
}

export function deleteScript(id: string): boolean {
  const scripts = getAllScripts();
  const filtered = scripts.filter(s => s.id !== id);
  if (filtered.length === scripts.length) return false;
  writeCollection('scripts', filtered);
  return true;
}

// --- Execution History ---

export function getExecutionHistory(): ScheduleHistory[] {
  return readCollection<ScheduleHistory>('execution-history');
}

function saveExecution(execution: ScheduleHistory) {
  const history = getExecutionHistory();
  const idx = history.findIndex(h => h.id === execution.id);
  if (idx >= 0) {
    history[idx] = execution;
  } else {
    history.push(execution);
  }
  // Keep last 500 entries
  if (history.length > 500) history.splice(0, history.length - 500);
  writeCollection('execution-history', history);
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

/** Execute a script object directly (for shared scripts) */
export async function executeScriptDirect(
  script: Script,
  deviceId: string,
  scheduleName: string,
  onProgress?: ProgressCallback
): Promise<ScheduleHistory> {
  return _executeScript(script, deviceId, scheduleName, onProgress);
}

export async function executeScript(
  scriptId: string,
  deviceId: string,
  scheduleName: string,
  onProgress?: ProgressCallback
): Promise<ScheduleHistory> {
  const script = getScript(scriptId);
  if (!script) throw new Error('Script not found');
  return _executeScript(script, deviceId, scheduleName, onProgress);
}

async function _executeScript(
  script: Script,
  deviceId: string,
  scheduleName: string,
  onProgress?: ProgressCallback
): Promise<ScheduleHistory> {

  const device = getDevice(deviceId);
  if (!device) throw new Error('Device not found');

  const executionId = generateId();
  const ctrl = { abort: false };
  activeExecutions.set(executionId, ctrl);

  // Mark device as running
  updateDevice(deviceId, { status: 'running', currentScript: script.name });

  const execution: ScheduleHistory = {
    id: executionId,
    scheduleId: '',
    scheduleName,
    scriptName: script.name,
    targetName: device.name,
    startedAt: new Date().toISOString(),
    status: 'running',
    steps: [],
  };
  saveExecution(execution);

  try {
    await executeSteps(script.steps, deviceId, execution, ctrl, onProgress);
    execution.status = 'success';
  } catch (err) {
    execution.status = 'error';
    execution.error = err instanceof Error ? err.message : 'Unknown error';
  } finally {
    execution.finishedAt = new Date().toISOString();
    saveExecution(execution);
    activeExecutions.delete(executionId);
    updateDevice(deviceId, { status: 'online', currentScript: undefined });

    // Update script stats (only for scripts in main collection)
    if (script.id) {
      updateScript(script.id, {
        lastRun: new Date().toISOString(),
        runCount: (script.runCount || 0) + 1,
        status: 'active',
      });
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
  onProgress?: ProgressCallback
) {
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
      await executeStep(step, deviceId, execution, ctrl, onProgress);
      execStep.status = 'success';
      execStep.finishedAt = new Date().toISOString();
    } catch (err) {
      execStep.status = 'error';
      execStep.error = err instanceof Error ? err.message : 'Unknown error';
      execStep.finishedAt = new Date().toISOString();
      // Only fatal for launch failures; tap/swipe/key errors continue
      const fatalTypes = ['launch'];
      if (fatalTypes.includes(step.type)) {
        throw err;
      }
      // Non-fatal: log error but continue
    }

    saveExecution(execution);
    onProgress?.(execution);
  }
}

async function executeStep(
  step: ScriptStep,
  deviceId: string,
  execution: ScheduleHistory,
  ctrl: { abort: boolean },
  onProgress?: ProgressCallback
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
      // Store screenshot reference on current step
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
    case 'repeat': {
      const count = Number(p.count) || 1;
      for (let i = 0; i < count; i++) {
        if (ctrl.abort) throw new Error('Execution aborted');
        if (step.children) {
          await executeSteps(step.children, deviceId, execution, ctrl, onProgress);
        }
      }
      break;
    }
    case 'repeat_forever': {
      while (!ctrl.abort) {
        if (step.children) {
          await executeSteps(step.children, deviceId, execution, ctrl, onProgress);
        }
      }
      break;
    }
    default:
      break;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function describeStep(step: ScriptStep): string {
  const p = step.params;
  switch (step.type) {
    case 'tap': return `Tap at (${p.x}, ${p.y})`;
    case 'double_tap': return `Double-tap at (${p.x}, ${p.y})`;
    case 'tap_image': return `Tap on image: ${p.templateName}`;
    case 'swipe': return `Swipe from (${p.fromX},${p.fromY}) to (${p.toX},${p.toY})`;
    case 'type': return `Type "${p.text}"`;
    case 'key': return `Press key: ${p.key}`;
    case 'launch': return `Launch app: ${p.bundleId}`;
    case 'screenshot': return 'Take screenshot';
    case 'clipboard': return p.text ? `Set clipboard: "${p.text}"` : 'Read clipboard';
    case 'wait': return `Wait ${p.seconds}s`;
    case 'wait_random': return `Wait random ${p.min}-${p.max}s`;
    case 'repeat': return `Repeat ${p.count} times`;
    case 'repeat_forever': return 'Repeat forever';
    default: return step.type;
  }
}
