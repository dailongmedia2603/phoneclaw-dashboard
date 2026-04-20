/**
 * Client-side mirror of server/helpers/inject-variables.ts extractPlaceholders.
 * Kept separate to avoid importing server code into the browser bundle.
 */
export function extractPlaceholders(steps: unknown[]): string[] {
  const json = JSON.stringify(steps ?? []);
  const set = new Set<string>();
  const re = /\{\{([a-z_][a-z0-9_]*)\}\}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(json)) !== null) set.add(m[1]);
  return [...set];
}

export const INPUT_NAME_RE = /^[a-z_][a-z0-9_]{0,63}$/;
