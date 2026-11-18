import { describe, it, expect } from 'vitest';
import { compile } from '../index';

const FORM = `wireframe
    Vertical
        Heading "Create department"
        TextInput :Name label="Name" required
        Button "Create" primary
    /Vertical
/wireframe`;

function heightOf(svg: string): number {
  const match = /<svg[^>]* height="([\d.]+)"/.exec(svg);
  if (!match) throw new Error('no height on the svg element');
  return Number(match[1]);
}

/** The lowest edge any rect or text in the picture reaches */
function lowestMark(svg: string): number {
  let lowest = 0;
  for (const m of svg.matchAll(/<rect x="[\d.]+" y="([\d.]+)" width="[\d.]+" height="([\d.]+)"/g)) {
    lowest = Math.max(lowest, Number(m[1]) + Number(m[2]));
  }
  return lowest;
}

function widthOf(svg: string): number {
  const match = /<svg[^>]* width="([\d.]+)"/.exec(svg);
  if (!match) throw new Error('no width on the svg element');
  return Number(match[1]);
}

/** The rightmost edge any rect in the picture reaches */
function rightmostMark(svg: string): number {
  let rightmost = 0;
  for (const m of svg.matchAll(/<rect x="([\d.]+)" y="[\d.]+" width="([\d.]+)"/g)) {
    rightmost = Math.max(rightmost, Number(m[1]) + Number(m[2]));
  }
  return rightmost;
}

describe('SVG width', () => {
  it('fits the content when no width is given', () => {
    const { svg } = compile(FORM, { useCache: false });
    const width = widthOf(svg);
    const rightmost = rightmostMark(svg);

    expect(rightmost).toBeGreaterThan(0);
    expect(width).toBeLessThan(800);
    expect(width).toBeGreaterThanOrEqual(rightmost);
    expect(svg).toContain(`viewBox="0 0 ${width} ${heightOf(svg)}"`);
  });

  it('keeps a given width', () => {
    const { svg } = compile(FORM, { width: 800, useCache: false });
    expect(widthOf(svg)).toBe(800);
  });

  it('is never wider than the default 800', () => {
    const wide = `wireframe\n    Card\n        Label "In a card"\n    /Card\n/wireframe`;
    const { svg } = compile(wide, { useCache: false });
    expect(widthOf(svg)).toBe(800);
  });

  it('counts the elements inside a conditional, not the conditional itself', () => {
    const source = `wireframe\n    if loggedIn\n        Button "Log out"\n    /if\n/wireframe`;
    const { svg } = compile(source, { useCache: false });
    expect(widthOf(svg)).toBeLessThan(800);
  });
});

describe('SVG height', () => {
  it('fits the content when no height is given', () => {
    const { svg } = compile(FORM, { useCache: false });
    const height = heightOf(svg);
    const lowest = lowestMark(svg);

    expect(lowest).toBeGreaterThan(0);
    expect(height).toBeGreaterThanOrEqual(lowest);
    // No more than the padding below the last control
    expect(height - lowest).toBeLessThanOrEqual(32);
    expect(svg).toContain(`viewBox="0 0 ${widthOf(svg)} ${height}"`);
  });

  it('keeps a given height as the minimum', () => {
    const { svg } = compile(FORM, { height: 600, useCache: false });
    expect(heightOf(svg)).toBe(600);
  });

  it('grows past a given height when the content is taller', () => {
    const { svg } = compile(FORM, { height: 50, useCache: false });
    expect(heightOf(svg)).toBeGreaterThan(50);
  });

  it('keeps the default height for a document with nothing in it', () => {
    const { svg } = compile('wireframe\n/wireframe', { useCache: false });
    expect(heightOf(svg)).toBe(600);
  });
});
