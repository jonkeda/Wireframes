/**
 * CLI Tests
 *
 * Tests the real CLI code (cli.ts) against temporary directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  run,
  parseArgs,
  defaultOutputName,
  resolveOutputPath,
  formatError,
  UsageError,
  HELP,
  STDOUT,
} from './cli';

const VALID = 'wireframe\n    Button "Go"\n/wireframe\n';
const SKETCH = 'wireframe sketch\n    Button "Go"\n/wireframe\n';
const INVALID = 'wireframe\n    Button "Go"\n    @@@\n/wireframe\n';

interface Captured {
  out: string[];
  err: string[];
  code: number | undefined;
}

function cli(argv: string[]): Captured {
  const out: string[] = [];
  const err: string[] = [];
  const code = run(argv, { stdout: (t) => out.push(t), stderr: (t) => err.push(t) });
  return { out, err, code };
}

describe('parseArgs', () => {
  it('parses flags with separate values and --flag=value', () => {
    expect(parseArgs(['a.wire', '-o', 'x.svg', '--theme=sketch', '--width', '1024', '--height=700', '-q', '-f'])).toEqual({
      command: 'compile',
      inputs: ['a.wire'],
      output: 'x.svg',
      theme: 'sketch',
      width: 1024,
      height: 700,
      quiet: true,
      force: true,
    });
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['a.wire', '--bogus'])).toThrow(UsageError);
    expect(() => parseArgs(['a.wire', '--colour=red'])).toThrow(/Unknown option "--colour"/);
    expect(() => parseArgs(['-x'])).toThrow(UsageError);
  });

  it('rejects missing and invalid values', () => {
    expect(() => parseArgs(['a.wire', '-o'])).toThrow(/expects a value/);
    expect(() => parseArgs(['a.wire', '--width', 'wide'])).toThrow(/positive whole number/);
    expect(() => parseArgs(['a.wire', '--quiet=yes'])).toThrow(/does not take a value/);
  });

  it('recognises the parse command and "--" before inputs', () => {
    expect(parseArgs(['parse', 'a.wire'])).toMatchObject({ command: 'parse', inputs: ['a.wire'] });
    expect(parseArgs(['--', '-odd.wire'])).toMatchObject({ inputs: ['-odd.wire'] });
  });

  it('accepts -o - for stdout', () => {
    expect(parseArgs(['a.wire', '-o', '-']).output).toBe(STDOUT);
  });
});

describe('output paths', () => {
  it('replaces .wire and appends .svg to anything else', () => {
    expect(defaultOutputName('/p/file.wire')).toBe('/p/file.svg');
    expect(defaultOutputName('spec.txt')).toBe('spec.txt.svg');
    expect(defaultOutputName('noext')).toBe('noext.svg');
    expect(defaultOutputName('a.wire.bak')).toBe('a.wire.bak.svg');
  });

  it('never equals the input', () => {
    for (const p of ['a.wire', 'a.txt', 'a.svg', 'a']) {
      expect(resolveOutputPath(p, undefined, false)).not.toBe(p);
    }
  });

  it('joins a directory output with the default name', () => {
    expect(resolveOutputPath('src/a.wire', 'out', true)).toBe(path.join('out', 'a.svg'));
    expect(resolveOutputPath('src/spec.txt', 'out', true)).toBe(path.join('out', 'spec.txt.svg'));
    expect(resolveOutputPath('a.wire', 'x.svg', false)).toBe('x.svg');
    expect(resolveOutputPath('a.wire', '-', false)).toBe(STDOUT);
  });

  it('formats errors as file:line:column: error: message', () => {
    expect(formatError('a.wire', { line: 3, column: 5, message: 'Boom' })).toBe('a.wire:3:5: error: Boom');
  });
});

describe('run', () => {
  let dir: string;
  const file = (name: string, content?: string): string => {
    const p = path.join(dir, name);
    if (content !== undefined) fs.writeFileSync(p, content);
    return p;
  };

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wire-cli-'));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('does not overwrite a non-.wire input (writes spec.txt.svg)', () => {
    const input = file('spec.txt', VALID);
    const r = cli([input]);
    expect(r.code).toBe(0);
    expect(fs.readFileSync(input, 'utf-8')).toBe(VALID);
    expect(fs.readFileSync(input + '.svg', 'utf-8')).toContain('<svg');
  });

  it('refuses to write the output over the input', () => {
    const input = file('a.wire', VALID);
    const r = cli([input, '-o', input]);
    expect(r.code).toBe(1);
    expect(fs.readFileSync(input, 'utf-8')).toBe(VALID);
  });

  it('reports errors with line and column, exits 1 and writes nothing', () => {
    const input = file('bad.wire', INVALID);
    const r = cli([input]);
    expect(r.code).toBe(1);
    expect(r.err[0]).toMatch(new RegExp(`^${input.replace(/[\\.]/g, '\\$&')}:3:\\d+: error: `));
    expect(fs.existsSync(file('bad.svg'))).toBe(false);
  });

  it('--force writes despite recoverable errors but still exits 1', () => {
    const input = file('bad.wire', INVALID);
    const r = cli([input, '--force']);
    expect(r.code).toBe(1);
    expect(r.err.some((l) => l.includes(':3:'))).toBe(true);
    expect(fs.readFileSync(file('bad.svg'), 'utf-8')).toContain('<svg');
  });

  it('--validate reports file:line:column and exits 1', () => {
    const input = file('bad.wire', INVALID);
    const r = cli(['--validate', input]);
    expect(r.code).toBe(1);
    expect(r.err[0]).toContain(':3:');
    expect(r.err[0]).toContain(': error: ');
    expect(cli(['-v', file('ok.wire', VALID)]).code).toBe(0);
  });

  it("uses the document's own style when no --theme is given", () => {
    const input = file('s.wire', SKETCH);
    const out = file('s.svg');
    expect(cli([input, '-o', out]).code).toBe(0);
    const viaHeader = fs.readFileSync(out, 'utf-8');
    expect(cli([input, '-o', out, '--theme=clean']).code).toBe(0);
    const viaFlag = fs.readFileSync(out, 'utf-8');
    expect(cli([input, '-o', out, '--theme', 'sketch']).code).toBe(0);
    const sketchFlag = fs.readFileSync(out, 'utf-8');
    expect(viaHeader).toBe(sketchFlag);
    expect(viaHeader).not.toBe(viaFlag);
  });

  it('a config theme is used when no --theme is given', () => {
    const input = file('s.wire', SKETCH);
    const cfg = file('c.json', JSON.stringify({ theme: 'clean' }));
    const out = file('s.svg');
    cli([input, '-o', out, '-c', cfg]);
    const viaConfig = fs.readFileSync(out, 'utf-8');
    cli([input, '-o', out, '-t', 'clean']);
    expect(viaConfig).toBe(fs.readFileSync(out, 'utf-8'));
  });

  it('-o - writes the SVG (only) to stdout', () => {
    const input = file('a.wire', VALID);
    const r = cli([input, '-o', '-']);
    expect(r.code).toBe(0);
    expect(r.out).toHaveLength(1);
    expect(r.out[0].startsWith('<svg')).toBe(true);
    expect(fs.existsSync(file('a.svg'))).toBe(false);
  });

  it('-o - with several inputs is a usage error', () => {
    const r = cli([file('a.wire', VALID), file('b.wire', VALID), '-o', '-']);
    expect(r.code).toBe(2);
  });

  it('the help text matches the behaviour', () => {
    expect(HELP).not.toContain('default: stdout');
    expect(HELP).toContain('"-" for stdout');
    expect(HELP).toContain('parse');
    expect(cli(['--help']).out[0]).toBe(HELP);
  });

  it('writes several inputs into the -o directory', () => {
    const a = file('a.wire', VALID);
    const b = file('b.txt', VALID);
    const out = path.join(dir, 'out');
    fs.mkdirSync(out);
    const r = cli([a, b, '-o', out]);
    expect(r.code).toBe(0);
    expect(fs.existsSync(path.join(out, 'a.svg'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'b.txt.svg'))).toBe(true);
  });

  it('writes several inputs into the config output directory (created if missing)', () => {
    const a = file('a.wire', VALID);
    const b = file('b.wire', VALID);
    const out = path.join(dir, 'dist');
    const cfg = file('c.json', JSON.stringify({ output: out }));
    const r = cli(['-c', cfg, a, b]);
    expect(r.code).toBe(0);
    expect(fs.existsSync(path.join(out, 'a.svg'))).toBe(true);
    expect(fs.existsSync(path.join(out, 'b.svg'))).toBe(true);
  });

  it('several inputs with an existing output file is an error', () => {
    const existing = file('x.svg', '');
    const r = cli([file('a.wire', VALID), file('b.wire', VALID), '-o', existing]);
    expect(r.code).toBe(2);
  });

  it('counts successes correctly', () => {
    const inputs = [file('a.wire', VALID), file('b.wire', INVALID), file('c.wire', INVALID), path.join(dir, 'missing.wire')];
    const r = cli(inputs);
    expect(r.code).toBe(1);
    expect(r.out.join('\n')).toContain('Processed 4 file(s): 1 succeeded, 3 failed');
    const ok = cli([file('d.wire', VALID), file('e.wire', VALID)]);
    expect(ok.out.join('\n')).toContain('2 succeeded, 0 failed');
  });

  it('unknown flags are an error with exit code 2', () => {
    const r = cli([file('a.wire', VALID), '--colour=red']);
    expect(r.code).toBe(2);
    expect(r.err[0]).toContain('Unknown option "--colour"');
    expect(fs.existsSync(file('a.svg'))).toBe(false);
  });

  it('--flag=value works end to end', () => {
    const input = file('a.wire', VALID);
    const out = file('wide.svg');
    expect(cli([input, `--output=${out}`, '--width=1234']).code).toBe(0);
    expect(fs.readFileSync(out, 'utf-8')).toContain('width="1234"');
  });

  it('no inputs is a usage error', () => {
    expect(cli([]).code).toBe(2);
  });

  it('a missing input file fails with exit 1', () => {
    const r = cli([path.join(dir, 'nope.wire')]);
    expect(r.code).toBe(1);
    expect(r.err[0]).toContain('could not read file');
  });

  describe('parse command', () => {
    it('prints the AST and errors as JSON to stdout', () => {
      const r = cli(['parse', file('a.wire', VALID)]);
      expect(r.code).toBe(0);
      const json = JSON.parse(r.out.join('\n'));
      expect(json.errors).toEqual([]);
      expect(json.document.type).toBeDefined();
      expect(JSON.stringify(json.document)).toContain('Go');
    });

    it('exits 1 and includes the errors when the source has errors', () => {
      const input = file('bad.wire', INVALID);
      const r = cli(['parse', input]);
      expect(r.code).toBe(1);
      const json = JSON.parse(r.out.join('\n'));
      expect(json.errors.length).toBeGreaterThan(0);
      expect(json.errors[0]).toMatchObject({ line: 3 });
      expect(typeof json.errors[0].column).toBe('number');
      expect(r.err[0]).toContain(`${input}:3:`);
    });

    it('prints an array of { file, document, errors } for several inputs', () => {
      const a = file('a.wire', VALID);
      const b = file('b.wire', VALID);
      const json = JSON.parse(cli(['parse', a, b]).out.join('\n'));
      expect(json.map((x: { file: string }) => x.file)).toEqual([a, b]);
    });
  });
});
