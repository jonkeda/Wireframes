/**
 * @jonkeda/wireframe-themes - Theme definitions for Wireframe
 */

import { parse, resolveTheme, SVGRenderer } from '@jonkeda/wireframe-core';
import type { Theme } from '@jonkeda/wireframe-core';

// Re-export themes from core
export type {
  Theme,
  ThemeColors,
  ThemeTypography,
  ThemeSpacing,
  ThemeBorders,
  ThemeShadows,
  ThemeComponents,
  ThemeName,
} from '@jonkeda/wireframe-core';

export {
  themes,
  cleanTheme,
  sketchTheme,
  blueprintTheme,
  realisticTheme,
  getTheme,
} from '@jonkeda/wireframe-core';

// Additional theme utilities

/**
 * Partial overrides for a theme: every group, and every value in it, is optional.
 */
export type ThemeOverrides = {
  [K in keyof Omit<Theme, 'name'>]?: Partial<Theme[K]>;
};

/**
 * Create a custom theme by extending an existing theme.
 *
 * The result is a complete theme: every value the overrides leave out comes
 * from the base theme. Register it with registerTheme to use it by name.
 */
export function createTheme(
  name: string,
  baseTheme: string | Theme,
  overrides: ThemeOverrides = {}
): Theme {
  const base = typeof baseTheme === 'string' ? resolveTheme(baseTheme) : baseTheme;
  return deepMerge(
    { ...base, name } as unknown as Record<string, unknown>,
    overrides as Record<string, unknown>
  ) as unknown as Theme;
}

// The registry lives in core, so a theme registered here is found by compile,
// the CLI and the Mermaid plugin as well
export {
  registerTheme,
  unregisterTheme,
  getRegisteredThemeNames,
  resolveTheme,
} from '@jonkeda/wireframe-core';

/**
 * Options for compileWithTheme
 */
export interface ThemedCompileOptions {
  width?: number;
  height?: number;
  /** A theme object, or the name of a registered or built-in theme. Default: the document's own style. */
  theme?: string | Theme;
}

/**
 * Compile Wireframe source to SVG with a custom (or built-in) theme.
 */
export function compileWithTheme(
  source: string,
  options: ThemedCompileOptions = {}
): { svg: string; errors: Array<{ message: string; line: number; column: number }> } {
  const { document, errors } = parse(source);
  const mapped = errors.map((e) => ({
    message: e.message,
    line: e.location.line,
    column: e.location.column,
  }));
  if (!document) {
    return { svg: '', errors: mapped };
  }
  const theme = resolveTheme(options.theme ?? document.style ?? 'clean');
  // No `theme` option: SVGRenderer keeps the theme object it was built with.
  const svg = new SVGRenderer(theme).render(document, {
    width: options.width || 800,
    height: options.height || 600,
  });
  return { svg, errors: mapped };
}

/**
 * Deep merge utility
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else if (source[key] !== undefined) {
      result[key] = source[key];
    }
  }

  return result;
}
