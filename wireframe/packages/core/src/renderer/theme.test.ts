/**
 * Theme Tests
 */

import { describe, it, expect } from 'vitest';
import { getTheme, themes, cleanTheme, sketchTheme, blueprintTheme, realisticTheme, ThemeName } from './theme';

describe('Theme', () => {
  describe('getTheme', () => {
    it.each([
      ['clean', cleanTheme],
      ['sketch', sketchTheme],
      ['blueprint', blueprintTheme],
      ['realistic', realisticTheme],
    ])('returns the %s theme', (name, theme) => {
      expect(getTheme(name)).toBe(theme);
      expect(getTheme(name).name).toBe(name);
    });

    it('is case-insensitive', () => {
      expect(getTheme('SKETCH')).toBe(sketchTheme);
      expect(getTheme('Blueprint')).toBe(blueprintTheme);
    });

    it('falls back to the clean theme for unknown names', () => {
      expect(getTheme('nope')).toBe(cleanTheme);
      expect(getTheme('')).toBe(cleanTheme);
    });
  });

  describe('themes', () => {
    it('lists every theme by its own name', () => {
      for (const [name, theme] of Object.entries(themes)) {
        expect(theme.name).toBe(name);
        expect(getTheme(name)).toBe(theme);
      }
      expect(Object.keys(themes).sort()).toEqual(['blueprint', 'clean', 'realistic', 'sketch']);
    });

    it.each(Object.keys(themes) as ThemeName[])('%s has hex colours and positive sizes', (name) => {
      const theme = themes[name];
      for (const [key, value] of Object.entries(theme.colors)) {
        expect(value, key).toMatch(/^#[0-9a-f]{6}$/i);
      }
      expect(theme.typography.fontSize).toBeGreaterThan(0);
      expect(theme.typography.fontFamily.length).toBeGreaterThan(0);
      expect(theme.spacing.padding).toBeGreaterThanOrEqual(0);
      expect(theme.borders.width).toBeGreaterThan(0);
      expect(theme.components.header.height).toBeGreaterThan(0);
      expect(theme.components.sidebar.width).toBeGreaterThan(0);
    });

    it('derives the variants from clean without changing clean', () => {
      expect(sketchTheme.borders.radius).toBe(0);
      expect(sketchTheme.spacing).toEqual(cleanTheme.spacing);
      expect(blueprintTheme.colors.background).not.toBe(cleanTheme.colors.background);
      expect(realisticTheme.borders.radius).toBeGreaterThan(cleanTheme.borders.radius);
      expect(cleanTheme.colors.background).toBe('#ffffff');
      expect(cleanTheme.name).toBe('clean');
    });
  });
});
