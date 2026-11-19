// What of the language the conformance set does not reach: the keywords no case uses, and how often each kind of
// diagnostic is in it. Run from the wireframe folder: node scripts/conformance-coverage.cjs
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const casesDir = path.join(root, 'conformance', 'cases');
const tokens = fs.readFileSync(path.join(root, 'packages', 'core', 'src', 'lexer', 'tokens.ts'), 'utf8');
const words = [...new Set([...tokens.matchAll(/^\s*['"]?([A-Za-z][A-Za-z-]*)['"]?:\s*TokenType\.(\w+)/gm)].map((m) => m[1]))];
const files = fs.readdirSync(casesDir);
const sources = files.filter((f) => f.endsWith('.wire'));
const all = sources.map((f) => fs.readFileSync(path.join(casesDir, f), 'utf8')).join('\n');

const unused = words.filter((w) => !new RegExp('(^|[^A-Za-z])' + w + '([^A-Za-z]|$)', 'm').test(all));
console.log(`${words.length} keywords; in no case: ${unused.join(' ') || 'none'}`);

let withDiagnostics = 0;
const kinds = new Map();
for (const f of files.filter((f) => f.endsWith('.diagnostics.json'))) {
  const diagnostics = JSON.parse(fs.readFileSync(path.join(casesDir, f), 'utf8'));
  if (diagnostics.length) withDiagnostics++;
  for (const d of diagnostics) {
    const kind = d.message.replace(/: .*/, '').replace(/\/\w+/, '/X').replace(/\d+/g, 'N');
    kinds.set(kind, (kinds.get(kind) || 0) + 1);
  }
}
console.log(`${sources.length} cases; ${withDiagnostics} with diagnostics; ${files.filter((f) => f.endsWith('.ast.json') && fs.readFileSync(path.join(casesDir, f), 'utf8').trim() === 'null').length} without a tree`);
for (const [kind, count] of [...kinds].sort((a, b) => b[1] - a[1])) console.log(`  ${count}  ${kind}`);
process.exit(unused.length === 0 ? 0 : 1);
