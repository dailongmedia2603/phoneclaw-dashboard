/**
 * Inject {{variable}} placeholders into script steps.
 *
 * Semantics preserved from the original implementation in external-api.ts:
 *   1. JSON.stringify(steps)
 *   2. Regex replace {{key}} with JSON-escaped value
 *   3. JSON.parse back
 *
 * Only replaces keys that look like valid identifiers (/^[a-z_][a-z0-9_]*$/i).
 * Invalid syntax ({{a.b}}, {{a+b}}, {{ a }}) is left untouched.
 */
export function injectVariables(
  steps: unknown[],
  variables: Record<string, string>,
): unknown[] {
  if (!variables || Object.keys(variables).length === 0) return steps;

  let result = JSON.stringify(steps);
  for (const [key, value] of Object.entries(variables)) {
    // Safety: skip keys that aren't valid identifiers (ngăn prototype pollution qua __proto__, etc.)
    // Regex matches ScriptInput.name spec in src/types/index.ts (lowercase, max 64 chars)
    if (!/^[a-z_][a-z0-9_]{0,63}$/.test(key)) continue;

    const safeValue = escapeJsonString(String(value));
    const re = new RegExp(`\\{\\{${escapeRegex(key)}\\}\\}`, 'g');
    result = result.replace(re, safeValue);
  }
  return JSON.parse(result);
}

/**
 * Scan steps for {{placeholder}} names actually used.
 * Used by migration tool to suggest `inputs` entries.
 */
export function extractPlaceholders(steps: unknown[]): string[] {
  const json = JSON.stringify(steps);
  const set = new Set<string>();
  const re = /\{\{([a-z_][a-z0-9_]*)\}\}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json)) !== null) set.add(m[1]);
  return [...set];
}

function escapeJsonString(v: string): string {
  return v
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
