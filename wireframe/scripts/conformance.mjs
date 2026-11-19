// The conformance set: what the Wireframe language is, as files both implementations are held against
// (.my/net/100-ParserAndRenderer.md). The TypeScript implementation writes the expected files; a file of the set
// changes only when the language changes.
//
//   node scripts/conformance.mjs collect   copies the examples and takes the sources out of the tests, as cases
//   node scripts/conformance.mjs write     writes each case's tree, diagnostics and SVGs
//   node scripts/conformance.mjs check     exits 1 when a written file is not what the implementation gives now
//
// Run `pnpm build` first: the script uses the built core (packages/core/dist), as a user of the package would.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const casesDir = path.join(root, 'conformance', 'cases');
const themes = ['clean', 'sketch', 'blueprint', 'realistic'];

// Every file of the set: UTF-8 without a mark, line feeds only.
const lf = (text) => text.replace(/\r\n/g, '\n');

function walk(dir, ext, found = []) {
  if (!fs.existsSync(dir)) return found;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'coverage') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, ext, found);
    else if (entry.name.endsWith(ext)) found.push(full);
  }
  return found.sort();
}

const slug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// A source inside a test: a template string or a quoted string that starts a wireframe, with nothing put into it.
function sourcesIn(testText) {
  const sources = [];
  const template = /`((?:[^`\\]|\\.)*)`/g;
  for (const match of testText.matchAll(template)) {
    const text = match[1];
    if (text.includes('${')) continue;
    const unescaped = text.replace(/\\`/g, '`').replace(/\\\\/g, '\\');
    if (/^\s*wireframe\b/.test(unescaped)) sources.push(unescaped);
  }
  const quoted = /(['"])(wireframe\b(?:[^'"\\\n]|\\.)*)\1/g;
  for (const match of testText.matchAll(quoted)) {
    const text = match[2];
    if (!text.includes('\\n')) continue; // one line: a name, not a wireframe
    sources.push(text.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\(['"\\])/g, '$1'));
  }
  return sources;
}

function collect() {
  fs.mkdirSync(casesDir, { recursive: true });
  const have = new Map(); // a source's hash, to its case
  for (const file of walk(casesDir, '.wire')) have.set(hash(lf(fs.readFileSync(file, 'utf8'))), file);
  let added = 0;
  const add = (name, source) => {
    const text = lf(source).replace(/\s+$/, '') + '\n';
    const key = hash(text);
    if (have.has(key)) return;
    let file = path.join(casesDir, name + '.wire');
    for (let n = 2; fs.existsSync(file); n++) file = path.join(casesDir, `${name}-${n}.wire`);
    fs.writeFileSync(file, text, 'utf8');
    have.set(key, file);
    added++;
  };

  // 1. The example files of the documentation and the demos.
  for (const [origin, dir] of [['example', path.join(root, 'docs', 'examples')], ['theme', path.join(root, 'docs', 'themes')],
    ['markdown', path.join(root, 'docs', 'markdown')], ['demo', path.join(root, 'demos')]]) {
    for (const file of walk(dir, '.wire')) add(`${origin}-${slug(path.basename(file, '.wire'))}`, fs.readFileSync(file, 'utf8'));
  }

  // 2. The sources inside the tests of the core and the command-line tool.
  for (const pkg of ['core', 'cli']) {
    for (const file of walk(path.join(root, 'packages', pkg, 'src'), '.test.ts')) {
      const name = slug(path.basename(file, '.test.ts'));
      sourcesIn(fs.readFileSync(file, 'utf8')).forEach((source, n) => add(`test-${name}-${String(n + 1).padStart(3, '0')}`, source));
    }
  }

  // 3. The wireframe blocks of the documentation and the language's specification. A block that is a part of a
  //    wireframe (no "wireframe" line of its own) is put in one.
  const docs = [...walk(path.join(root, 'docs'), '.md'), ...walk(path.join(root, '..', 'architecture', 'Wireframe', 'docs'), '.md')];
  for (const file of docs) {
    const name = slug(path.basename(file, '.md'));
    const blocks = [...lf(fs.readFileSync(file, 'utf8')).matchAll(/^```wireframe[^\n]*\n([\s\S]*?)^```/gm)].map((match) => match[1]);
    blocks.forEach((block, n) => {
      const whole = /^\s*wireframe\b/.test(block);
      const source = whole
        ? block
        : 'wireframe clean\n' + block.split('\n').map((line) => (line.trim() ? '    ' + line : line)).join('\n').replace(/\s+$/, '') + '\n/wireframe\n';
      add(`doc-${name}-${String(n + 1).padStart(3, '0')}`, source);
    });
  }

  console.log(`${added} cases added; ${walk(casesDir, '.wire').length} cases in ${path.relative(root, casesDir)}`);
}

const hash = (text) => createHash('sha256').update(text).digest('hex');

// A tree as JSON with its keys in the order of the alphabet, so the two implementations need not agree on the order
// their code happens to set fields in.
function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().filter((key) => value[key] !== undefined).map((key) => [key, sorted(value[key])]));
  }
  return value;
}

const json = (value) => JSON.stringify(sorted(value), null, 2) + '\n';

async function expected(source) {
  const core = await import(new URL('../packages/core/dist/index.js', import.meta.url));
  const { document, errors } = core.parse(source);
  const files = new Map();
  files.set('.ast.json', json(document));
  files.set('.diagnostics.json', json(errors.map((error) => ({ message: error.message, line: error.location.line, column: error.location.column }))));
  if (document) {
    for (const theme of themes) {
      // No width and no height: the picture fits its content, as the command-line tool renders it.
      files.set(`.${theme}.svg`, lf(core.render(document, { theme })).replace(/\n*$/, '\n'));
    }
  }
  return files;
}

async function writeOrCheck(check) {
  const cases = walk(casesDir, '.wire');
  let different = 0;
  let written = 0;
  for (const file of cases) {
    const base = file.slice(0, -'.wire'.length);
    let files;
    try {
      files = await expected(fs.readFileSync(file, 'utf8'));
    } catch (error) {
      console.error(`${path.basename(file)}: the implementation threw: ${error.message}`);
      different++;
      continue;
    }
    for (const [ending, text] of files) {
      const target = base + ending;
      const now = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : null;
      if (now === text) continue;
      if (check) {
        console.error(`${path.basename(target)}: ${now === null ? 'missing' : 'not what the implementation gives now'}`);
        different++;
      } else {
        fs.writeFileSync(target, text, 'utf8');
        written++;
      }
    }
    // A file of a case the implementation no longer gives (a case that lost its document) goes.
    for (const theme of themes) {
      const target = `${base}.${theme}.svg`;
      if (!files.has(`.${theme}.svg`) && fs.existsSync(target)) {
        if (check) { console.error(`${path.basename(target)}: there, and the implementation gives none`); different++; }
        else fs.unlinkSync(target);
      }
    }
  }
  if (check) {
    console.log(different === 0 ? `${cases.length} cases: every file is what the implementation gives.` : `${different} files differ.`);
    process.exit(different === 0 ? 0 : 1);
  }
  console.log(`${cases.length} cases; ${written} files written.`);
}

const mode = process.argv[2];
if (mode === 'collect') collect();
else if (mode === 'write') await writeOrCheck(false);
else if (mode === 'check') await writeOrCheck(true);
else {
  console.error('Usage: node scripts/conformance.mjs collect | write | check');
  process.exit(2);
}
