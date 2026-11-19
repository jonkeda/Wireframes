/**
 * The conformance set (conformance/cases): what the language is, as files this implementation and the .NET one are
 * both held against. A case's tree, diagnostics and SVGs are written by `node scripts/conformance.mjs write`; a file
 * of the set changes only when the language changes.
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from './parser';
import { render } from './renderer';

const casesDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../conformance/cases');
const themes = ['clean', 'sketch', 'blueprint', 'realistic'];

function sorted(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .filter((key) => record[key] !== undefined)
        .map((key) => [key, sorted(record[key])])
    );
  }
  return value;
}

const json = (value: unknown): string => JSON.stringify(sorted(value), null, 2) + '\n';
const read = (file: string): string => fs.readFileSync(file, 'utf8');

const cases = fs.existsSync(casesDir)
  ? fs
      .readdirSync(casesDir)
      .filter((file) => file.endsWith('.wire'))
      .map((file) => file.slice(0, -'.wire'.length))
      .sort()
  : [];

describe('conformance set', () => {
  it('is there', () => {
    expect(cases.length).toBeGreaterThan(300);
  });

  it.each(cases)('%s', (name) => {
    const base = path.join(casesDir, name);
    const { document, errors } = parse(read(base + '.wire'));

    expect(json(document)).toBe(read(base + '.ast.json'));
    expect(
      json(errors.map((error) => ({ message: error.message, line: error.location.line, column: error.location.column })))
    ).toBe(read(base + '.diagnostics.json'));

    for (const theme of themes) {
      const file = `${base}.${theme}.svg`;
      if (!document) {
        expect(fs.existsSync(file)).toBe(false);
        continue;
      }
      const svg = render(document, { theme }).replace(/\r\n/g, '\n').replace(/\n*$/, '\n');
      expect(svg).toBe(read(file));
    }
  });
});
