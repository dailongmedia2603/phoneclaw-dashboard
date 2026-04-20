import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  resolveScriptInputs,
  validateInputsSchema,
  InputValidationError,
} from '../services/script-inputs';
import type { Script, ScriptInput } from '../../src/types';

vi.mock('../store', () => ({
  readUserCollection: vi.fn(),
}));
import { readUserCollection } from '../store';

function makeScript(inputs?: ScriptInput[]): Script {
  return {
    id: 's1',
    name: 'Test',
    description: '',
    steps: [],
    status: 'draft',
    runCount: 0,
    createdAt: '',
    updatedAt: '',
    inputs,
  };
}

describe('validateInputsSchema', () => {
  it('accepts undefined', () => {
    expect(() => validateInputsSchema(undefined)).not.toThrow();
  });

  it('accepts empty array', () => {
    expect(() => validateInputsSchema([])).not.toThrow();
  });

  it('rejects invalid name (starts with digit)', () => {
    expect(() =>
      validateInputsSchema([{ name: '1bad', label: 'x', type: 'string' }]),
    ).toThrow(InputValidationError);
  });

  it('rejects invalid name (dash)', () => {
    expect(() =>
      validateInputsSchema([{ name: 'foo-bar', label: 'x', type: 'string' }]),
    ).toThrow(/name/);
  });

  it('rejects uppercase name', () => {
    expect(() =>
      validateInputsSchema([{ name: 'FooBar', label: 'x', type: 'string' }]),
    ).toThrow(/name/);
  });

  it('rejects duplicate name', () => {
    expect(() =>
      validateInputsSchema([
        { name: 'x', label: 'x1', type: 'string' },
        { name: 'x', label: 'x2', type: 'number' },
      ]),
    ).toThrow(/trùng tên/);
  });

  it('rejects enum without options', () => {
    expect(() =>
      validateInputsSchema([{ name: 'x', label: 'x', type: 'enum' }]),
    ).toThrow(/options/);
  });

  it('rejects empty label', () => {
    expect(() =>
      validateInputsSchema([{ name: 'x', label: '', type: 'string' }]),
    ).toThrow(/label/);
  });

  it('rejects unknown type', () => {
    expect(() =>
      validateInputsSchema([{ name: 'x', label: 'x', type: 'secret' as any }]),
    ).toThrow(/type/);
  });

  it('accepts valid schema', () => {
    expect(() =>
      validateInputsSchema([
        { name: 'x', label: 'X', type: 'string' },
        { name: 'y', label: 'Y', type: 'enum', options: ['a', 'b'] },
        { name: 'n', label: 'N', type: 'number', min: 0, max: 10 },
        { name: 'v', label: 'V', type: 'video', required: true },
      ]),
    ).not.toThrow();
  });
});

describe('resolveScriptInputs (no schema → backward compat)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('passes through raw vars when no inputs schema', async () => {
    const script = makeScript(undefined);
    const out = await resolveScriptInputs(script, { foo: 'bar', n: 42 }, 'u1');
    expect(out).toEqual({ foo: 'bar', n: '42' });
  });

  it('returns empty for empty raw and no schema', async () => {
    const script = makeScript(undefined);
    expect(await resolveScriptInputs(script, undefined, 'u1')).toEqual({});
  });

  it('strips invalid-name keys in compat mode', async () => {
    const script = makeScript(undefined);
    const out = await resolveScriptInputs(
      script,
      { good: 'x', __proto__: 'bad', 'a-b': 'nope' } as any,
      'u1',
    );
    expect(out).toEqual({ good: 'x' });
  });

  it('empty inputs array also uses compat mode', async () => {
    const script = makeScript([]);
    const out = await resolveScriptInputs(script, { foo: 'bar' }, 'u1');
    expect(out).toEqual({ foo: 'bar' });
  });
});

describe('resolveScriptInputs (with schema)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('string type coerces and enforces maxLength', async () => {
    const s = makeScript([{ name: 'x', label: 'x', type: 'string', maxLength: 3 }]);
    expect(await resolveScriptInputs(s, { x: 'ab' }, 'u1')).toEqual({ x: 'ab' });
    await expect(resolveScriptInputs(s, { x: 'abcd' }, 'u1')).rejects.toThrow(
      /vượt quá 3/,
    );
  });

  it('number type enforces min/max', async () => {
    const s = makeScript([{ name: 'n', label: 'n', type: 'number', min: 1, max: 10 }]);
    expect(await resolveScriptInputs(s, { n: 5 }, 'u1')).toEqual({ n: '5' });
    await expect(resolveScriptInputs(s, { n: 0 }, 'u1')).rejects.toThrow(/min/);
    await expect(resolveScriptInputs(s, { n: 11 }, 'u1')).rejects.toThrow(/max/);
    await expect(resolveScriptInputs(s, { n: 'abc' }, 'u1')).rejects.toThrow(
      /không phải số/,
    );
  });

  it('number accepts string numeric input', async () => {
    const s = makeScript([{ name: 'n', label: 'n', type: 'number' }]);
    expect(await resolveScriptInputs(s, { n: '42' }, 'u1')).toEqual({ n: '42' });
  });

  it('boolean coerces truthy/falsy correctly', async () => {
    const s = makeScript([{ name: 'b', label: 'b', type: 'boolean' }]);
    expect(await resolveScriptInputs(s, { b: true }, 'u1')).toEqual({ b: 'true' });
    expect(await resolveScriptInputs(s, { b: 'true' }, 'u1')).toEqual({ b: 'true' });
    expect(await resolveScriptInputs(s, { b: 1 }, 'u1')).toEqual({ b: 'true' });
    expect(await resolveScriptInputs(s, { b: false }, 'u1')).toEqual({ b: 'false' });
    expect(await resolveScriptInputs(s, { b: 0 }, 'u1')).toEqual({ b: 'false' });
    expect(await resolveScriptInputs(s, { b: 'false' }, 'u1')).toEqual({ b: 'false' });
  });

  it('url rejects non-http schemes (security)', async () => {
    const s = makeScript([{ name: 'u', label: 'u', type: 'url' }]);
    await expect(resolveScriptInputs(s, { u: 'javascript:alert(1)' }, 'u1')).rejects.toThrow(
      /http\/https/,
    );
    await expect(resolveScriptInputs(s, { u: 'file:///etc/passwd' }, 'u1')).rejects.toThrow(
      /http\/https/,
    );
    await expect(resolveScriptInputs(s, { u: 'data:text/html,x' }, 'u1')).rejects.toThrow(
      /http\/https/,
    );
  });

  it('url accepts https and http', async () => {
    const s = makeScript([{ name: 'u', label: 'u', type: 'url' }]);
    expect(await resolveScriptInputs(s, { u: 'https://ok.com' }, 'u1')).toEqual({
      u: 'https://ok.com',
    });
    expect(await resolveScriptInputs(s, { u: 'http://a.b' }, 'u1')).toEqual({
      u: 'http://a.b',
    });
  });

  it('url rejects malformed', async () => {
    const s = makeScript([{ name: 'u', label: 'u', type: 'url' }]);
    await expect(resolveScriptInputs(s, { u: 'not a url' }, 'u1')).rejects.toThrow(
      /không hợp lệ/,
    );
  });

  it('enum rejects invalid option', async () => {
    const s = makeScript([
      { name: 'e', label: 'e', type: 'enum', options: ['a', 'b'] },
    ]);
    expect(await resolveScriptInputs(s, { e: 'a' }, 'u1')).toEqual({ e: 'a' });
    await expect(resolveScriptInputs(s, { e: 'c' }, 'u1')).rejects.toThrow(/phải thuộc/);
  });

  it('video rejects unknown videoId', async () => {
    vi.mocked(readUserCollection).mockResolvedValue([{ id: 'vid_real' }] as any);
    const s = makeScript([{ name: 'v', label: 'v', type: 'video' }]);
    await expect(resolveScriptInputs(s, { v: 'vid_fake' }, 'u1')).rejects.toThrow(
      /không tồn tại/,
    );
    expect(await resolveScriptInputs(s, { v: 'vid_real' }, 'u1')).toEqual({
      v: 'vid_real',
    });
  });

  it('video enforces ownership via readUserCollection(userId)', async () => {
    vi.mocked(readUserCollection).mockResolvedValue([]); // userId 'u2' owns no videos
    const s = makeScript([{ name: 'v', label: 'v', type: 'video' }]);
    await expect(resolveScriptInputs(s, { v: 'vid_of_other' }, 'u2')).rejects.toThrow(
      /không tồn tại/,
    );
    expect(readUserCollection).toHaveBeenCalledWith('u2', 'videos');
  });

  it('required missing throws', async () => {
    const s = makeScript([{ name: 'x', label: 'x', type: 'string', required: true }]);
    await expect(resolveScriptInputs(s, {}, 'u1')).rejects.toThrow(/bắt buộc/);
    await expect(resolveScriptInputs(s, { x: '' }, 'u1')).rejects.toThrow(/bắt buộc/);
    await expect(resolveScriptInputs(s, { x: null }, 'u1')).rejects.toThrow(/bắt buộc/);
  });

  it('default used when value missing', async () => {
    const s = makeScript([
      { name: 'x', label: 'x', type: 'string', default: 'fallback' },
    ]);
    expect(await resolveScriptInputs(s, {}, 'u1')).toEqual({ x: 'fallback' });
    expect(await resolveScriptInputs(s, { x: 'override' }, 'u1')).toEqual({
      x: 'override',
    });
    expect(await resolveScriptInputs(s, { x: '' }, 'u1')).toEqual({ x: 'fallback' });
  });

  it('optional missing is omitted from result', async () => {
    const s = makeScript([{ name: 'x', label: 'x', type: 'string' }]);
    expect(await resolveScriptInputs(s, {}, 'u1')).toEqual({});
  });

  it('extra keys are dropped (not thrown)', async () => {
    const s = makeScript([{ name: 'a', label: 'a', type: 'string' }]);
    const out = await resolveScriptInputs(s, { a: 'A', extra: 'ignored' }, 'u1');
    expect(out).toEqual({ a: 'A' });
  });

  it('rejects oversized payload', async () => {
    const s = makeScript([{ name: 'a', label: 'a', type: 'text' }]);
    const big = 'x'.repeat(200 * 1024);
    await expect(resolveScriptInputs(s, { a: big }, 'u1')).rejects.toThrow(
      /payload vượt/,
    );
  });

  it('provides field name on validation error', async () => {
    const s = makeScript([{ name: 'caption', label: 'c', type: 'string', required: true }]);
    await expect(resolveScriptInputs(s, {}, 'u1')).rejects.toMatchObject({
      field: 'caption',
    });
  });
});
