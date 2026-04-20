import { describe, it, expect } from 'vitest';
import { injectVariables, extractPlaceholders } from '../helpers/inject-variables';

describe('injectVariables', () => {
  it('replaces simple placeholder', () => {
    const steps = [{ type: 'type', params: { text: 'Hello {{name}}' } }];
    const result = injectVariables(steps, { name: 'World' });
    expect(result).toEqual([{ type: 'type', params: { text: 'Hello World' } }]);
  });

  it('returns original when variables empty', () => {
    const steps = [{ type: 'type', params: { text: 'x' } }];
    expect(injectVariables(steps, {})).toEqual(steps);
  });

  it('escapes double quotes in value', () => {
    const steps = [{ type: 'type', params: { text: '{{x}}' } }];
    const result = injectVariables(steps, { x: 'say "hi"' });
    expect(result).toEqual([{ type: 'type', params: { text: 'say "hi"' } }]);
  });

  it('escapes newlines', () => {
    const steps = [{ type: 'type', params: { text: '{{x}}' } }];
    const result = injectVariables(steps, { x: 'line1\nline2' });
    expect(result).toEqual([{ type: 'type', params: { text: 'line1\nline2' } }]);
  });

  it('escapes backslashes', () => {
    const steps = [{ type: 'type', params: { text: '{{x}}' } }];
    const result = injectVariables(steps, { x: 'C:\\path' });
    expect(result).toEqual([{ type: 'type', params: { text: 'C:\\path' } }]);
  });

  it('escapes tabs and carriage returns', () => {
    const steps = [{ type: 'type', params: { text: '{{x}}' } }];
    const result = injectVariables(steps, { x: 'a\tb\rc' });
    expect(result).toEqual([{ type: 'type', params: { text: 'a\tb\rc' } }]);
  });

  it('handles emoji', () => {
    const steps = [{ type: 'type', params: { text: '{{x}}' } }];
    const result = injectVariables(steps, { x: 'hot 🔥 fire' });
    expect(result).toEqual([{ type: 'type', params: { text: 'hot 🔥 fire' } }]);
  });

  it('replaces multiple occurrences of same key', () => {
    const steps = [{ type: 'type', params: { text: '{{x}} and {{x}}' } }];
    const result = injectVariables(steps, { x: 'A' });
    expect(result).toEqual([{ type: 'type', params: { text: 'A and A' } }]);
  });

  it('does not replace when key has mismatched braces', () => {
    const steps = [{ type: 'type', params: { text: '{name}' } }];
    expect(injectVariables(steps, { name: 'X' })).toEqual(steps);
  });

  it('does not touch {{a.b}} (with dot)', () => {
    const steps = [{ type: 'type', params: { text: '{{a.b}}' } }];
    expect(injectVariables(steps, { 'a.b': 'X' } as any)).toEqual(steps);
  });

  it('skips invalid variable names silently (prototype pollution guard)', () => {
    const steps = [{ type: 'type', params: { text: '{{name}}' } }];
    const result = injectVariables(steps, {
      name: 'OK',
      __proto__: 'bad',
      'a-b': 'nope',
    } as any);
    expect(result).toEqual([{ type: 'type', params: { text: 'OK' } }]);
  });

  it('preserves nested structure with children', () => {
    const steps = [
      {
        type: 'repeat',
        params: { count: 3 },
        children: [{ type: 'type', params: { text: '{{msg}}' } }],
      },
    ];
    const result = injectVariables(steps, { msg: 'hi' });
    expect(result).toEqual([
      {
        type: 'repeat',
        params: { count: 3 },
        children: [{ type: 'type', params: { text: 'hi' } }],
      },
    ]);
  });

});

describe('extractPlaceholders', () => {
  it('finds all unique placeholders', () => {
    const steps = [
      { type: 'type', params: { text: '{{a}} and {{b}} and {{a}}' } },
      { type: 'send_file', params: { videoId: '{{video_id}}' } },
    ];
    expect(extractPlaceholders(steps).sort()).toEqual(['a', 'b', 'video_id']);
  });

  it('returns empty array when no placeholders', () => {
    expect(extractPlaceholders([{ type: 'wait', params: { seconds: 3 } }])).toEqual([]);
  });

  it('ignores invalid placeholder syntax', () => {
    const steps = [{ type: 'type', params: { text: '{{a.b}} {{c-d}} {{e f}}' } }];
    expect(extractPlaceholders(steps)).toEqual([]);
  });

  it('finds placeholders in nested children', () => {
    const steps = [
      {
        type: 'repeat',
        params: { count: 2 },
        children: [{ type: 'type', params: { text: '{{msg}}' } }],
      },
    ];
    expect(extractPlaceholders(steps)).toEqual(['msg']);
  });
});
