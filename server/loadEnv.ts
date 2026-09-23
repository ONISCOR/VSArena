// Assumption: Next already injects `.env.local`; this standalone harness does not.

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Copy missing keys from `.env.local` into `process.env`.
 */
export function loadLocalEnv(cwd = process.cwd()): void {
  const file = resolve(cwd, ".env.local");
  if (!existsSync(file)) return;
  const text = readFileSync(file, "utf8").replace(/^\uFEFF/, "");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadLocalEnv();
