/**
 * Theme definition for Wireframe rendering
 */
export interface Theme {
  name: string;
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borders: ThemeBorders;
  shadows: ThemeShadows;
  components: ThemeComponents;
}

/**
 * Color definitions
 */
export interface ThemeColors {
  // Base colors
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  textDisabled: string;

  // Brand colors
  primary: string;
  primaryText: string;
  secondary: string;
  secondaryText: string;

  // State colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Border colors
  border: string;
  borderFocus: string;

  // Control colors
  inputBackground: string;
  buttonBackground: string;
  buttonHover: string;
}

/**
 * Typography definitions
 */
export interface ThemeTypography {
  fontFamily: string;
  fontSize: number;
  fontSizeLarge: number;
  fontSizeSmall: number;
  fontWeight: number;
  fontWeightBold: number;
  lineHeight: number;
}

/**
 * Spacing definitions
 */
export interface ThemeSpacing {
  unit: number;
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  padding: number;
  gap: number;
}

/**
 * Border definitions
 */
export interface ThemeBorders {
  radius: number;
  radiusLarge: number;
  width: number;
}

/**
 * Shadow definitions
 */
export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
}

/**
 * Component-specific styles
 */
export interface ThemeComponents {
  button: {
    height: number;
    minWidth: number;
    paddingX: number;
    paddingY: number;
  };
  input: {
    height: number;
    paddingX: number;
    paddingY: number;
  };
  checkbox: {
    size: number;
  };
  radio: {
    size: number;
  };
  icon: {
    size: number;
    sizeLarge: number;
    sizeSmall: number;
  };
  card: {
    padding: number;
  };
  header: {
    height: number;
  };
  footer: {
    height: number;
  };
  sidebar: {
    width: number;
  };
}

/**
 * Clean theme - minimal, modern wireframe style
 */
export const cleanTheme: Theme = {
  name: 'clean',
  colors: {
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textSecondary: '#6c757d',
    textDisabled: '#adb5bd',
    primary: '#0d6efd',
    primaryText: '#ffffff',
    secondary: '#6c757d',
    secondaryText: '#ffffff',
    success: '#198754',
    warning: '#ffc107',
    error: '#dc3545',
    info: '#0dcaf0',
    border: '#dee2e6',
    borderFocus: '#86b7fe',
    inputBackground: '#ffffff',
    buttonBackground: '#e9ecef',
    buttonHover: '#dee2e6',
  },
  typography: {
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: 14,
    fontSizeLarge: 18,
    fontSizeSmall: 12,
    fontWeight: 400,
    fontWeightBold: 600,
    lineHeight: 1.5,
  },
  spacing: {
    unit: 4,
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    padding: 16,
    gap: 8,
  },
  borders: {
    radius: 4,
    radiusLarge: 8,
    width: 1,
  },
  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
  },
  components: {
    button: {
      height: 36,
      minWidth: 80,
      paddingX: 16,
      paddingY: 8,
    },
    input: {
      height: 36,
      paddingX: 12,
      paddingY: 8,
    },
    checkbox: {
      size: 18,
    },
    radio: {
      size: 18,
    },
    icon: {
      size: 20,
      sizeLarge: 24,
      sizeSmall: 16,
    },
    card: {
      padding: 16,
    },
    header: {
      height: 56,
    },
    footer: {
      height: 48,
    },
    sidebar: {
      width: 240,
    },
  },
};

/**
 * Sketch theme - hand-drawn wireframe style
 */
export const sketchTheme: Theme = {
  ...cleanTheme,
  name: 'sketch',
  colors: {
    ...cleanTheme.colors,
    background: '#fefefe',
    surface: '#f5f5f5',
    text: '#333333',
    border: '#888888',
    primary: '#4a90d9',
    buttonBackground: '#f0f0f0',
  },
  typography: {
    ...cleanTheme.typography,
    fontFamily: '"Comic Sans MS", cursive, sans-serif',
  },
  borders: {
    radius: 0,
    radiusLarge: 0,
    width: 2,
  },
};

/**
 * Blueprint theme - technical drawing style
 */
export const blueprintTheme: Theme = {
  ...cleanTheme,
  name: 'blueprint',
  colors: {
    ...cleanTheme.colors,
    background: '#1e3a5f',
    surface: '#2a4a6f',
    text: '#ffffff',
    textSecondary: '#a0c4e8',
    border: '#4a7ab0',
    borderFocus: '#6aa0d8',
    primary: '#ffffff',
    primaryText: '#1e3a5f',
    inputBackground: '#2a4a6f',
    buttonBackground: '#2a4a6f',
    buttonHover: '#3a5a7f',
  },
  typography: {
    ...cleanTheme.typography,
    fontFamily: '"Courier New", monospace',
  },
};

/**
 * Realistic theme - closer to final UI appearance
 */
export const realisticTheme: Theme = {
  ...cleanTheme,
  name: 'realistic',
  shadows: {
    sm: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
    md: '0 3px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.12)',
    lg: '0 10px 20px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.10)',
  },
  borders: {
    radius: 6,
    radiusLarge: 12,
    width: 1,
  },
};

/** Custom themes, registered by name */
const customThemes = new Map<string, Theme>();

/**
 * Register a custom theme under its name. From then on getTheme, compile,
 * the CLI and the Mermaid plugin find it by that name. A custom theme may
 * replace a built-in one of the same name.
 */
export function registerTheme(theme: Theme): void {
  customThemes.set(theme.name.toLowerCase(), theme);
}

/**
 * Remove a registered custom theme. Returns whether it was registered.
 */
export function unregisterTheme(name: string): boolean {
  return customThemes.delete(name.toLowerCase());
}

/**
 * Names of the registered custom themes
 */
export function getRegisteredThemeNames(): string[] {
  return [...customThemes.values()].map((t) => t.name);
}

/**
 * A theme object as it is, or a theme by name (see getTheme)
 */
export function resolveTheme(theme: string | Theme): Theme {
  return typeof theme === 'string' ? getTheme(theme) : theme;
}

/**
 * Get theme by name: a registered custom theme first, then a built-in one, else 'clean'
 */
export function getTheme(name: string): Theme {
  const custom = customThemes.get(name.toLowerCase());
  if (custom) {
    return custom;
  }
  switch (name.toLowerCase()) {
    case 'sketch':
      return sketchTheme;
    case 'blueprint':
      return blueprintTheme;
    case 'realistic':
      return realisticTheme;
    case 'clean':
    default:
      return cleanTheme;
  }
}

/**
 * Theme names
 */
export type ThemeName = 'clean' | 'sketch' | 'blueprint' | 'realistic';

/**
 * All available themes
 */
export const themes: Record<ThemeName, Theme> = {
  clean: cleanTheme,
  sketch: sketchTheme,
  blueprint: blueprintTheme,
  realistic: realisticTheme,
};
