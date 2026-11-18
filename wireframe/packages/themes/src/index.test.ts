/**
 * Themes Tests
 */

import { describe, it, expect, afterEach } from 'vitest';
import {
  createTheme,
  registerTheme,
  unregisterTheme,
  getRegisteredThemeNames,
  resolveTheme,
  compileWithTheme,
  cleanTheme,
  sketchTheme,
} from './index';

describe('createTheme', () => {
  afterEach(() => {
    for (const name of getRegisteredThemeNames()) unregisterTheme(name);
  });

  it('returns a complete theme synchronously', () => {
    const theme = createTheme('brand', 'clean', { colors: { primary: '#ff0066' } });
    expect(theme).not.toBeInstanceOf(Promise);
    expect(theme.name).toBe('brand');
    expect(theme.colors.primary).toBe('#ff0066');
    // Values the overrides leave out come from the base
    expect(theme.colors.text).toBe(cleanTheme.colors.text);
    expect(theme.typography).toEqual(cleanTheme.typography);
  });

  it('does not change the base theme', () => {
    const before = cleanTheme.colors.primary;
    createTheme('brand', 'clean', { colors: { primary: '#123456' } });
    expect(cleanTheme.colors.primary).toBe(before);
  });

  it('extends a theme object or a registered theme', () => {
    const a = createTheme('a', sketchTheme, { borders: { radius: 9 } });
    expect(a.borders.radius).toBe(9);
    expect(a.colors).toEqual(sketchTheme.colors);
    registerTheme(a);
    const b = createTheme('b', 'a', { colors: { primary: '#000001' } });
    expect(b.borders.radius).toBe(9);
  });

  it('resolves registered themes by name, case-insensitively', () => {
    const brand = createTheme('Brand', 'clean', {});
    registerTheme(brand);
    expect(resolveTheme('brand')).toBe(brand);
    expect(resolveTheme('sketch')).toBe(sketchTheme);
    expect(unregisterTheme('BRAND')).toBe(true);
    expect(resolveTheme('brand')).toBe(cleanTheme);
  });

  it('renders a custom theme', () => {
    const brand = createTheme('brand', 'clean', { colors: { background: '#abcdef' } });
    registerTheme(brand);
    const byName = compileWithTheme('wireframe sketch\n    Button "Go"\n/wireframe', { theme: 'brand' });
    expect(byName.errors).toEqual([]);
    expect(byName.svg).toContain('#abcdef');
    const byObject = compileWithTheme('Button "Go"', { theme: brand, width: 500 });
    expect(byObject.svg).toContain('#abcdef');
    expect(byObject.svg).toContain('width="500"');
  });

  it('uses the document style when no theme is given', () => {
    const { svg } = compileWithTheme('wireframe sketch\n    Button "Go"\n/wireframe');
    expect(svg).toContain(sketchTheme.typography.fontFamily);
  });

  it('returns the parse errors with line and column', () => {
    const result = compileWithTheme('wireframe bogus\n/wireframe');
    expect(result.errors.length).toBeGreaterThan(0);
    expect(typeof result.errors[0].line).toBe('number');
    expect(typeof result.errors[0].column).toBe('number');
  });
});
