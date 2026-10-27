// PostToolUse (Edit|Write|MultiEdit): formatuje i lintuje edytowany plik,
// pilnuje, żeby kolory szły tylko z tokenów.
// Exit 2 = stderr trafia do Claude jako informacja do poprawy (edycja już się wykonała).
// Gdy narzędzi jeszcze nie ma (przed F1), hook po cichu nic nie robi.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}

const file = String(input?.tool_input?.file_path ?? '');
if (!file || !existsSync(file)) process.exit(0);

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const rel = path.relative(root, file).replace(/\\/g, '/');
const ext = path.extname(file).toLowerCase();
const problems = [];

// 1) Kolory tylko z tokenów
const colorCheckExt = ['.astro', '.css', '.ts', '.js', '.mjs'];
const colorAllow = ['src/styles/tokens.css'];
if (colorCheckExt.includes(ext) && rel.startsWith('src/') && !colorAllow.includes(rel)) {
  const src = readFileSync(file, 'utf8');
  const re = /(color|background|fill|stroke|border|shadow|gradient|Color)[^;\n]{0,80}#[0-9a-fA-F]{3,8}\b/g;
  const hits = [...src.matchAll(re)].slice(0, 5).map((m) => m[0].trim());
  if (hits.length) {
    problems.push(
      `Hexy kolorów poza tokens.css w ${rel}:\n  ${hits.join('\n  ')}\n` +
        `Użyj var(--c-…) w CSS albo cssColor('--c-…') w TS/GL (zasada 4 w CLAUDE.md).`,
    );
  }
}

// 2) Prettier + ESLint, jeśli są zainstalowane
const bin = (name) => {
  const p = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? `${name}.cmd` : name);
  return existsSync(p) ? p : null;
};
const run = (cmd, args) =>
  spawnSync(cmd, args, { cwd: root, encoding: 'utf8', shell: process.platform === 'win32' });

const formatExt = ['.astro', '.css', '.ts', '.js', '.mjs', '.json', '.md'];
const prettier = bin('prettier');
if (prettier && formatExt.includes(ext)) run(prettier, ['--write', '--log-level', 'warn', file]);

const lintExt = ['.astro', '.ts', '.js', '.mjs'];
const eslint = bin('eslint');
if (eslint && lintExt.includes(ext)) {
  const r = run(eslint, ['--no-warn-ignored', file]);
  if (r.status && r.status !== 0) {
    problems.push(`ESLint w ${rel}:\n${(r.stdout || r.stderr || '').trim().slice(0, 3000)}`);
  }
}

if (problems.length) {
  process.stderr.write(problems.join('\n\n') + '\n');
  process.exit(2);
}
process.exit(0);
