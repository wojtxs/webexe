// PreToolUse (Edit|Write|MultiEdit): blokuje zapis do plików tylko do odczytu.
// Exit 2 = Claude Code blokuje akcję i pokazuje stderr modelowi.
import { readFileSync } from 'node:fs';

let input = {};
try {
  input = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0);
}

const file = String(input?.tool_input?.file_path ?? '').replace(/\\/g, '/');
if (!file) process.exit(0);

const readOnly = [
  { test: /\/docs\/reference\//, why: 'docs/reference to materiał referencyjny tylko do odczytu.' },
  { test: /\/assets-src\/brand\//, why: 'assets-src/brand to oryginały marki — zmieniaj je ręcznie, nie przez Claude.' },
];

for (const rule of readOnly) {
  if (rule.test.test(file)) {
    process.stderr.write(`Zablokowano zapis do ${file}: ${rule.why}\n`);
    process.exit(2);
  }
}
process.exit(0);
