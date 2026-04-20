import type { Script, ScriptInput } from '../../src/types';
import { readUserCollection } from '../store';

export type RawVariables = Record<string, unknown>;
export type ResolvedVariables = Record<string, string>;

export class InputValidationError extends Error {
  constructor(public field: string, public reason: string) {
    super(`Input "${field}": ${reason}`);
    this.name = 'InputValidationError';
  }
}

const NAME_RE = /^[a-z_][a-z0-9_]{0,63}$/;
const MAX_PAYLOAD_BYTES = 100 * 1024; // 100KB

/**
 * Validate Script.inputs schema shape. Called at script save time.
 * Throws InputValidationError on first problem.
 */
export function validateInputsSchema(inputs: ScriptInput[] | undefined): void {
  if (!inputs) return;
  if (!Array.isArray(inputs)) {
    throw new InputValidationError('_inputs', 'phải là mảng');
  }

  const names = new Set<string>();
  for (const input of inputs) {
    if (!input || typeof input !== 'object') {
      throw new InputValidationError('_inputs', 'entry phải là object');
    }
    if (typeof input.name !== 'string' || !NAME_RE.test(input.name)) {
      throw new InputValidationError(
        String(input?.name ?? '_'),
        'name phải lowercase, bắt đầu bằng chữ/_, tối đa 64 ký tự',
      );
    }
    if (names.has(input.name)) {
      throw new InputValidationError(input.name, 'trùng tên');
    }
    names.add(input.name);

    if (typeof input.label !== 'string' || !input.label.trim()) {
      throw new InputValidationError(input.name, 'label bắt buộc');
    }

    const validTypes = ['string', 'text', 'number', 'boolean', 'url', 'video', 'enum'] as const;
    if (!validTypes.includes(input.type as any)) {
      throw new InputValidationError(input.name, `type không hợp lệ (${input.type})`);
    }

    if (input.type === 'enum') {
      if (!Array.isArray(input.options) || input.options.length === 0) {
        throw new InputValidationError(input.name, 'enum type phải có options không rỗng');
      }
      if (input.options.some((o) => typeof o !== 'string')) {
        throw new InputValidationError(input.name, 'options phải là mảng string');
      }
    }
  }
}

/**
 * Resolve raw variables against script.inputs schema.
 * - Apply defaults for missing values
 * - Coerce types, validate constraints
 * - Lookup video ownership for type='video'
 * - Silently drop extra keys not in schema (log warn)
 *
 * Backward compat: if script has no `inputs` schema, passes through all valid-named
 * keys as strings (same behavior as original external-api.ts injectVariables).
 */
export async function resolveScriptInputs(
  script: Script,
  raw: RawVariables | undefined,
  userId: string,
): Promise<ResolvedVariables> {
  const rawObj: RawVariables = raw ?? {};

  // Payload size guard
  const payloadSize = JSON.stringify(rawObj).length;
  if (payloadSize > MAX_PAYLOAD_BYTES) {
    throw new InputValidationError(
      '_payload',
      `variables payload vượt ${MAX_PAYLOAD_BYTES} bytes (nhận ${payloadSize})`,
    );
  }

  // --- Backward compat: script without inputs schema ---
  if (!script.inputs || script.inputs.length === 0) {
    const out: ResolvedVariables = {};
    for (const [k, v] of Object.entries(rawObj)) {
      if (!NAME_RE.test(k)) continue; // skip invalid keys
      if (v === null || v === undefined) continue;
      out[k] = String(v);
    }
    return out;
  }

  // --- With schema: strict validation ---
  const out: ResolvedVariables = {};
  for (const spec of script.inputs) {
    const provided = rawObj[spec.name];
    const hasProvided = provided !== undefined && provided !== null && provided !== '';
    const value = hasProvided ? provided : spec.default;

    if (spec.required && (value === undefined || value === null || value === '')) {
      throw new InputValidationError(spec.name, 'bắt buộc nhưng không có giá trị');
    }
    if (value === undefined || value === null) continue;

    out[spec.name] = await coerceAndValidate(spec, value, userId);
  }

  // Warn on extra keys (don't throw — forward compat)
  for (const key of Object.keys(rawObj)) {
    if (!script.inputs.find((i) => i.name === key)) {
      console.warn(`[script-inputs] Biến "${key}" không có trong schema của script ${script.id}, bỏ qua`);
    }
  }

  return out;
}

async function coerceAndValidate(
  spec: ScriptInput,
  value: unknown,
  userId: string,
): Promise<string> {
  switch (spec.type) {
    case 'string':
    case 'text': {
      const s = String(value);
      if (spec.maxLength !== undefined && s.length > spec.maxLength) {
        throw new InputValidationError(spec.name, `vượt quá ${spec.maxLength} ký tự (${s.length})`);
      }
      return s;
    }
    case 'number': {
      const n = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(n)) {
        throw new InputValidationError(spec.name, 'không phải số');
      }
      if (spec.min !== undefined && n < spec.min) {
        throw new InputValidationError(spec.name, `< min (${spec.min})`);
      }
      if (spec.max !== undefined && n > spec.max) {
        throw new InputValidationError(spec.name, `> max (${spec.max})`);
      }
      return String(n);
    }
    case 'boolean': {
      const b = value === true || value === 'true' || value === 1 || value === '1';
      return b ? 'true' : 'false';
    }
    case 'url': {
      const s = String(value);
      let url: URL;
      try {
        url = new URL(s);
      } catch {
        throw new InputValidationError(spec.name, 'URL không hợp lệ');
      }
      if (!/^https?:$/.test(url.protocol)) {
        throw new InputValidationError(spec.name, 'chỉ cho phép http/https');
      }
      return s;
    }
    case 'enum': {
      const s = String(value);
      if (!spec.options?.includes(s)) {
        throw new InputValidationError(
          spec.name,
          `phải thuộc [${spec.options?.join(', ')}]`,
        );
      }
      return s;
    }
    case 'video': {
      const videoId = String(value);
      const videos = await readUserCollection<{ id: string }>(userId, 'videos');
      if (!videos.find((v) => v.id === videoId)) {
        throw new InputValidationError(
          spec.name,
          `videoId "${videoId}" không tồn tại hoặc không thuộc sở hữu`,
        );
      }
      return videoId;
    }
    default: {
      throw new InputValidationError(spec.name, `unknown type: ${(spec as any).type}`);
    }
  }
}
