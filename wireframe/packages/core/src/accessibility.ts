/**
 * Accessibility Utilities for Wireframe
 * 
 * Provides WCAG compliance checking and accessibility helpers.
 */

/**
 * WCAG compliance level
 */
export type WCAGLevel = 'A' | 'AA' | 'AAA';

/**
 * Contrast ratio result
 */
export interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
}

/**
 * Accessibility audit result
 */
export interface A11yAuditResult {
  passed: boolean;
  issues: A11yIssue[];
  score: number;
}

/**
 * Accessibility issue
 */
export interface A11yIssue {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  wcag?: string;
  element?: string;
}

/**
 * Parse a hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return null;
  
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

/**
 * Calculate relative luminance of a color
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Calculate contrast ratio between two colors
 * https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const l1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color combination passes WCAG contrast requirements
 */
export function checkContrast(foreground: string, background: string): ContrastResult {
  const ratio = getContrastRatio(foreground, background);
  
  return {
    ratio,
    passesAA: ratio >= 4.5,      // Normal text AA
    passesAAA: ratio >= 7,       // Normal text AAA
    passesAALarge: ratio >= 3,   // Large text AA
    passesAAALarge: ratio >= 4.5, // Large text AAA
  };
}

/**
 * Suggest an accessible color for given background
 */
export function suggestAccessibleColor(
  background: string,
  preferLight: boolean = false
): string {
  const bgRgb = hexToRgb(background);
  if (!bgRgb) return preferLight ? '#ffffff' : '#000000';
  
  const bgLuminance = getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // If background is dark, use white; if light, use black
  if (bgLuminance < 0.5) {
    return preferLight ? '#ffffff' : '#f8f9fa';
  } else {
    return preferLight ? '#495057' : '#212529';
  }
}

/**
 * Get ARIA role for a control type
 */
export function getAriaRole(controlType: string): string {
  const roleMap: Record<string, string> = {
    Button: 'button',
    IconButton: 'button',
    TextInput: 'textbox',
    PasswordInput: 'textbox',
    NumberInput: 'spinbutton',
    DateInput: 'textbox',
    TextArea: 'textbox',
    Checkbox: 'checkbox',
    Radio: 'radio',
    Switch: 'switch',
    Slider: 'slider',
    Dropdown: 'combobox',
    Menu: 'menu',
    MenuItem: 'menuitem',
    Tabs: 'tablist',
    Tab: 'tab',
    Table: 'table',
    DataGrid: 'grid',
    Tree: 'tree',
    TreeItem: 'treeitem',
    Progress: 'progressbar',
    Link: 'link',
    Image: 'img',
    Icon: 'img',
    Header: 'banner',
    Footer: 'contentinfo',
    Sidebar: 'navigation',
    Card: 'article',
    Modal: 'dialog',
    Toast: 'alert',
    Accordion: 'group',
    Breadcrumb: 'navigation',
    Pagination: 'navigation',
    Stepper: 'navigation',
  };
  
  return roleMap[controlType] || 'group';
}

/**
 * Get ARIA attributes for a control
 */
export function getAriaAttributes(
  controlType: string,
  props: Record<string, unknown>
): Record<string, string> {
  const attrs: Record<string, string> = {};
  
  // Common attributes
  if (props.label) {
    attrs['aria-label'] = String(props.label);
  }
  if (props.disabled) {
    attrs['aria-disabled'] = 'true';
  }
  if (props.required) {
    attrs['aria-required'] = 'true';
  }
  if (props.placeholder) {
    attrs['aria-placeholder'] = String(props.placeholder);
  }
  
  // Control-specific attributes
  switch (controlType) {
    case 'Checkbox':
    case 'Switch':
      attrs['aria-checked'] = props.checked ? 'true' : 'false';
      break;
    case 'Radio':
      attrs['aria-checked'] = props.selected ? 'true' : 'false';
      break;
    case 'Progress':
      if (typeof props.value === 'number') {
        attrs['aria-valuenow'] = String(props.value);
        attrs['aria-valuemin'] = '0';
        attrs['aria-valuemax'] = String(props.max || 100);
      }
      break;
    case 'Slider':
      if (typeof props.value === 'number') {
        attrs['aria-valuenow'] = String(props.value);
        attrs['aria-valuemin'] = String(props.min || 0);
        attrs['aria-valuemax'] = String(props.max || 100);
      }
      break;
    case 'Dropdown':
      attrs['aria-expanded'] = props.open ? 'true' : 'false';
      attrs['aria-haspopup'] = 'listbox';
      break;
    case 'Tab':
      attrs['aria-selected'] = props.active ? 'true' : 'false';
      break;
    case 'TreeItem':
      if (props.expanded !== undefined) {
        attrs['aria-expanded'] = props.expanded ? 'true' : 'false';
      }
      break;
    case 'Modal':
      attrs['aria-modal'] = 'true';
      break;
  }
  
  return attrs;
}

/**
 * Audit a theme for accessibility compliance
 */
export function auditTheme(theme: {
  colors: Record<string, string>;
  typography: { fontSize: number };
}): A11yAuditResult {
  const issues: A11yIssue[] = [];
  
  // Check text contrast
  const textContrast = checkContrast(theme.colors.text, theme.colors.background);
  if (!textContrast.passesAA) {
    issues.push({
      type: 'error',
      code: 'CONTRAST_TEXT',
      message: `Text color contrast ratio is ${textContrast.ratio.toFixed(2)}, needs to be at least 4.5:1`,
      wcag: '1.4.3 Contrast (Minimum)',
    });
  }
  
  // Check secondary text contrast
  if (theme.colors.textSecondary) {
    const secondaryContrast = checkContrast(theme.colors.textSecondary, theme.colors.background);
    if (!secondaryContrast.passesAA) {
      issues.push({
        type: 'warning',
        code: 'CONTRAST_SECONDARY',
        message: `Secondary text contrast ratio is ${secondaryContrast.ratio.toFixed(2)}, should be at least 4.5:1`,
        wcag: '1.4.3 Contrast (Minimum)',
      });
    }
  }
  
  // Check primary color contrast
  if (theme.colors.primary) {
    const primaryContrast = checkContrast('#ffffff', theme.colors.primary);
    if (!primaryContrast.passesAA) {
      issues.push({
        type: 'warning',
        code: 'CONTRAST_PRIMARY',
        message: `White text on primary color has contrast ratio ${primaryContrast.ratio.toFixed(2)}`,
        wcag: '1.4.3 Contrast (Minimum)',
      });
    }
  }
  
  // Check font size
  if (theme.typography.fontSize < 14) {
    issues.push({
      type: 'warning',
      code: 'FONT_SIZE_SMALL',
      message: `Base font size ${theme.typography.fontSize}px is below recommended 14px minimum`,
      wcag: '1.4.4 Resize Text',
    });
  }
  
  // Calculate score (100 - 10 per error - 5 per warning)
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 5);
  
  return {
    passed: errorCount === 0,
    issues,
    score,
  };
}

/**
 * Format accessibility attributes as string for SVG
 */
export function formatAriaAttributes(attrs: Record<string, string>): string {
  return Object.entries(attrs)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
}
