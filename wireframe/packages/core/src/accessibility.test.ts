/**
 * Accessibility Tests
 */

import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  getRelativeLuminance,
  getContrastRatio,
  checkContrast,
  suggestAccessibleColor,
  getAriaRole,
  getAriaAttributes,
  auditTheme,
  formatAriaAttributes,
} from './accessibility';

describe('Accessibility Utilities', () => {
  describe('hexToRgb', () => {
    it('should parse hex colors', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
    });

    it('should handle hex without #', () => {
      expect(hexToRgb('ffffff')).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should return null for invalid hex', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#fff')).toBeNull(); // 3-digit not supported
    });
  });

  describe('getRelativeLuminance', () => {
    it('should return 1 for white', () => {
      expect(getRelativeLuminance(255, 255, 255)).toBeCloseTo(1, 2);
    });

    it('should return 0 for black', () => {
      expect(getRelativeLuminance(0, 0, 0)).toBeCloseTo(0, 2);
    });

    it('should return value between 0 and 1', () => {
      const luminance = getRelativeLuminance(128, 128, 128);
      expect(luminance).toBeGreaterThan(0);
      expect(luminance).toBeLessThan(1);
    });
  });

  describe('getContrastRatio', () => {
    it('should return 21:1 for black on white', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('should return 1:1 for same colors', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 0);
    });

    it('should return 0 for invalid colors', () => {
      const ratio = getContrastRatio('invalid', '#ffffff');
      expect(ratio).toBe(0);
    });
  });

  describe('checkContrast', () => {
    it('should pass all levels for black on white', () => {
      const result = checkContrast('#000000', '#ffffff');
      expect(result.passesAA).toBe(true);
      expect(result.passesAAA).toBe(true);
      expect(result.passesAALarge).toBe(true);
      expect(result.passesAAALarge).toBe(true);
    });

    it('should fail for low contrast', () => {
      const result = checkContrast('#777777', '#888888');
      expect(result.passesAA).toBe(false);
    });

    it('should return contrast ratio', () => {
      const result = checkContrast('#000000', '#ffffff');
      expect(result.ratio).toBeCloseTo(21, 0);
    });
  });

  describe('suggestAccessibleColor', () => {
    it('should suggest light color for dark background', () => {
      const color = suggestAccessibleColor('#000000');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      const contrast = checkContrast(color, '#000000');
      expect(contrast.passesAA).toBe(true);
    });

    it('should suggest dark color for light background', () => {
      const color = suggestAccessibleColor('#ffffff');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      const contrast = checkContrast(color, '#ffffff');
      expect(contrast.passesAA).toBe(true);
    });
  });

  describe('getAriaRole', () => {
    it('should return button role for Button', () => {
      expect(getAriaRole('Button')).toBe('button');
    });

    it('should return textbox role for TextInput', () => {
      expect(getAriaRole('TextInput')).toBe('textbox');
    });

    it('should return checkbox role for Checkbox', () => {
      expect(getAriaRole('Checkbox')).toBe('checkbox');
    });

    it('should return group for unknown controls', () => {
      expect(getAriaRole('Unknown')).toBe('group');
    });
  });

  describe('getAriaAttributes', () => {
    it('should include aria-label for label prop', () => {
      const attrs = getAriaAttributes('Button', { label: 'Click me' });
      expect(attrs['aria-label']).toBe('Click me');
    });

    it('should include aria-disabled for disabled prop', () => {
      const attrs = getAriaAttributes('Button', { disabled: true });
      expect(attrs['aria-disabled']).toBe('true');
    });

    it('should include aria-checked for Checkbox', () => {
      const attrs = getAriaAttributes('Checkbox', { checked: true });
      expect(attrs['aria-checked']).toBe('true');
    });

    it('should include aria-valuenow for Progress', () => {
      const attrs = getAriaAttributes('Progress', { value: 50 });
      expect(attrs['aria-valuenow']).toBe('50');
      expect(attrs['aria-valuemin']).toBe('0');
      expect(attrs['aria-valuemax']).toBe('100');
    });
  });

  describe('auditTheme', () => {
    it('should pass for accessible theme', () => {
      const result = auditTheme({
        colors: {
          text: '#212529',
          background: '#ffffff',
          textSecondary: '#6c757d',
          primary: '#0d6efd',
        },
        typography: { fontSize: 14 },
      });
      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(80);
    });

    it('should fail for low contrast theme', () => {
      const result = auditTheme({
        colors: {
          text: '#999999',
          background: '#ffffff',
        },
        typography: { fontSize: 14 },
      });
      expect(result.passed).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should warn for small font size', () => {
      const result = auditTheme({
        colors: {
          text: '#000000',
          background: '#ffffff',
        },
        typography: { fontSize: 10 },
      });
      const fontIssue = result.issues.find(i => i.code === 'FONT_SIZE_SMALL');
      expect(fontIssue).toBeDefined();
    });
  });

  describe('formatAriaAttributes', () => {
    it('should format attributes as string', () => {
      const result = formatAriaAttributes({
        'aria-label': 'Test',
        'aria-disabled': 'true',
      });
      expect(result).toContain('aria-label="Test"');
      expect(result).toContain('aria-disabled="true"');
    });

    it('should return empty string for empty attrs', () => {
      const result = formatAriaAttributes({});
      expect(result).toBe('');
    });
  });
});
