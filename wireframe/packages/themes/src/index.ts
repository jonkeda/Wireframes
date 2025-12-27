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
 * Create a custom theme by extending an existing theme
 */
export async function createTheme(
  name: string,
  baseTheme: string,
  overrides: Record<string, unknown>
): Promise<unknown> {
  const { getTheme } = await import('@jonkeda/wireframe-core');
  const base = getTheme(baseTheme);
  return deepMerge({ ...base, name }, overrides);
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
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}
