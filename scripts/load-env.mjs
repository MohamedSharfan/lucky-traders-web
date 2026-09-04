/**
 * Reads `.env.local` (then `.env`) into `process.env`.
 *
 * Next loads these itself, but plain `node scripts/*.mjs` does not, and Node's
 * own --env-file is not available on every version a shop owner might have.
 * A real environment variable always wins, so CI and Vercel are unaffected.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export async function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    let raw;
    try {
      raw = await fs.readFile(path.join(root, file), 'utf8');
    } catch {
      continue;
    }
    for (const line of raw.split(/\r?\n/)) {
      const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (!match) continue;
      const [, key, value] = match;
      if (process.env[key]) continue;
      process.env[key] = value.trim().replace(/^["']|["']$/g, '');
    }
  }
}
