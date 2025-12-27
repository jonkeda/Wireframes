# Theming System

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source Package:** `@jonkeda/wireframe-themes`

---

## 1. Overview

The Wireframe Theming System provides visual styling for wireframe output. Themes control colors, fonts, spacing, borders, and effects to create different visual styles.

---

## 2. Available Themes

| Theme | Style | Description |
|-------|-------|-------------|
| `clean` | Modern | Minimal, professional wireframe style |
| `sketch` | Hand-drawn | Rough, sketchy appearance |
| `blueprint` | Technical | Blueprint/technical drawing style |
| `realistic` | High-fidelity | Realistic UI mockup style |

---

## 3. Theme Interface

### 3.1 Complete Theme Structure

```typescript
interface Theme {
  name: string;
  
  colors: ThemeColors;
  fonts: ThemeFonts;
  spacing: ThemeSpacing;
  borders: ThemeBorders;
  effects: ThemeEffects;
  
  // Component-specific overrides
  components?: ThemeComponents;
}

interface ThemeColors {
  // Core colors
  background: string;
  foreground: string;
  
  // UI colors
  primary: string;
  secondary: string;
  accent: string;
  
  // State colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Surface colors
  surface: string;
  surfaceAlt: string;
  
  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;
  
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textDisabled: string;
  placeholder: string;
  
  // Contrast colors
  onPrimary: string;
  onSecondary: string;
  onSurface: string;
  
  // Input colors
  inputBackground: string;
  inputBorder: string;
  inputFocus: string;
}

interface ThemeFonts {
  family: string;
  familyMono: string;
  
  // Sizes
  sizeXs: number;
  sizeSm: number;
  size: number;       // Base size
  sizeMd: number;
  sizeLg: number;
  sizeXl: number;
  sizeXxl: number;
  
  // Weights
  weightLight: number;
  weightNormal: number;
  weightMedium: number;
  weightBold: number;
  
  // Line heights
  lineHeight: number;
  lineHeightTight: number;
  lineHeightLoose: number;
}

interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  xxl: number;
}

interface ThemeBorders {
  radius: number;
  radiusSm: number;
  radiusLg: number;
  radiusFull: number;
  
  width: number;
  widthThick: number;
  
  style: 'solid' | 'dashed' | 'dotted';
}

interface ThemeEffects {
  shadow: string;
  shadowSm: string;
  shadowLg: string;
  
  blur: number;
  
  // For sketch theme
  roughness?: number;
  bowing?: number;
}

interface ThemeComponents {
  button?: ComponentStyle;
  input?: ComponentStyle;
  card?: ComponentStyle;
  // ... other component overrides
}

interface ComponentStyle {
  background?: string;
  foreground?: string;
  border?: string;
  borderRadius?: number;
  padding?: string;
  shadow?: string;
}
```

---

## 4. Theme Definitions

### 4.1 Clean Theme

```typescript
const cleanTheme: Theme = {
  name: 'clean',
  
  colors: {
    background: '#ffffff',
    foreground: '#1a1a1a',
    
    primary: '#2563eb',
    secondary: '#64748b',
    accent: '#8b5cf6',
    
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    surface: '#f8fafc',
    surfaceAlt: '#f1f5f9',
    
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderDark: '#cbd5e1',
    
    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textDisabled: '#94a3b8',
    placeholder: '#94a3b8',
    
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#1e293b',
    
    inputBackground: '#ffffff',
    inputBorder: '#cbd5e1',
    inputFocus: '#2563eb',
  },
  
  fonts: {
    family: 'Inter, system-ui, sans-serif',
    familyMono: 'JetBrains Mono, monospace',
    
    sizeXs: 10,
    sizeSm: 12,
    size: 14,
    sizeMd: 16,
    sizeLg: 18,
    sizeXl: 24,
    sizeXxl: 32,
    
    weightLight: 300,
    weightNormal: 400,
    weightMedium: 500,
    weightBold: 600,
    
    lineHeight: 1.5,
    lineHeightTight: 1.25,
    lineHeightLoose: 1.75,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borders: {
    radius: 6,
    radiusSm: 4,
    radiusLg: 8,
    radiusFull: 9999,
    
    width: 1,
    widthThick: 2,
    
    style: 'solid',
  },
  
  effects: {
    shadow: '0 1px 3px rgba(0,0,0,0.1)',
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowLg: '0 4px 6px rgba(0,0,0,0.1)',
    
    blur: 8,
  },
};
```

### 4.2 Sketch Theme

```typescript
const sketchTheme: Theme = {
  name: 'sketch',
  
  colors: {
    background: '#fffef5',
    foreground: '#2c2c2c',
    
    primary: '#4a90d9',
    secondary: '#7a7a7a',
    accent: '#9b59b6',
    
    success: '#27ae60',
    warning: '#f39c12',
    error: '#e74c3c',
    info: '#3498db',
    
    surface: '#f9f8f0',
    surfaceAlt: '#f4f3e8',
    
    border: '#3c3c3c',
    borderLight: '#7a7a7a',
    borderDark: '#2c2c2c',
    
    textPrimary: '#2c2c2c',
    textSecondary: '#5a5a5a',
    textDisabled: '#9a9a9a',
    placeholder: '#8a8a8a',
    
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#2c2c2c',
    
    inputBackground: '#ffffff',
    inputBorder: '#3c3c3c',
    inputFocus: '#4a90d9',
  },
  
  fonts: {
    family: 'Caveat, cursive, sans-serif',
    familyMono: 'Courier New, monospace',
    
    sizeXs: 12,
    sizeSm: 14,
    size: 16,
    sizeMd: 18,
    sizeLg: 22,
    sizeXl: 28,
    sizeXxl: 36,
    
    weightLight: 300,
    weightNormal: 400,
    weightMedium: 500,
    weightBold: 700,
    
    lineHeight: 1.4,
    lineHeightTight: 1.2,
    lineHeightLoose: 1.6,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borders: {
    radius: 2,
    radiusSm: 1,
    radiusLg: 4,
    radiusFull: 9999,
    
    width: 2,
    widthThick: 3,
    
    style: 'solid',
  },
  
  effects: {
    shadow: 'none',
    shadowSm: 'none',
    shadowLg: 'none',
    
    blur: 0,
    
    // Rough.js settings
    roughness: 1.5,
    bowing: 1,
  },
};
```

### 4.3 Blueprint Theme

```typescript
const blueprintTheme: Theme = {
  name: 'blueprint',
  
  colors: {
    background: '#1e3a5f',
    foreground: '#ffffff',
    
    primary: '#4fc3f7',
    secondary: '#81d4fa',
    accent: '#b3e5fc',
    
    success: '#69f0ae',
    warning: '#ffd54f',
    error: '#ff8a80',
    info: '#40c4ff',
    
    surface: '#234b73',
    surfaceAlt: '#2c5a87',
    
    border: '#4fc3f7',
    borderLight: '#81d4fa',
    borderDark: '#29b6f6',
    
    textPrimary: '#ffffff',
    textSecondary: '#b3e5fc',
    textDisabled: '#78909c',
    placeholder: '#90caf9',
    
    onPrimary: '#1e3a5f',
    onSecondary: '#1e3a5f',
    onSurface: '#ffffff',
    
    inputBackground: '#234b73',
    inputBorder: '#4fc3f7',
    inputFocus: '#81d4fa',
  },
  
  fonts: {
    family: 'Roboto Mono, monospace',
    familyMono: 'Roboto Mono, monospace',
    
    sizeXs: 10,
    sizeSm: 11,
    size: 12,
    sizeMd: 14,
    sizeLg: 16,
    sizeXl: 20,
    sizeXxl: 24,
    
    weightLight: 300,
    weightNormal: 400,
    weightMedium: 500,
    weightBold: 700,
    
    lineHeight: 1.5,
    lineHeightTight: 1.25,
    lineHeightLoose: 1.75,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borders: {
    radius: 0,
    radiusSm: 0,
    radiusLg: 0,
    radiusFull: 9999,
    
    width: 1,
    widthThick: 2,
    
    style: 'solid',
  },
  
  effects: {
    shadow: 'none',
    shadowSm: 'none',
    shadowLg: 'none',
    
    blur: 0,
  },
};
```

### 4.4 Realistic Theme

```typescript
const realisticTheme: Theme = {
  name: 'realistic',
  
  colors: {
    background: '#f5f5f5',
    foreground: '#212121',
    
    primary: '#1976d2',
    secondary: '#424242',
    accent: '#7c4dff',
    
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    
    surface: '#ffffff',
    surfaceAlt: '#fafafa',
    
    border: '#e0e0e0',
    borderLight: '#eeeeee',
    borderDark: '#bdbdbd',
    
    textPrimary: '#212121',
    textSecondary: '#757575',
    textDisabled: '#9e9e9e',
    placeholder: '#9e9e9e',
    
    onPrimary: '#ffffff',
    onSecondary: '#ffffff',
    onSurface: '#212121',
    
    inputBackground: '#ffffff',
    inputBorder: '#bdbdbd',
    inputFocus: '#1976d2',
  },
  
  fonts: {
    family: 'Roboto, system-ui, sans-serif',
    familyMono: 'Roboto Mono, monospace',
    
    sizeXs: 10,
    sizeSm: 12,
    size: 14,
    sizeMd: 16,
    sizeLg: 20,
    sizeXl: 24,
    sizeXxl: 34,
    
    weightLight: 300,
    weightNormal: 400,
    weightMedium: 500,
    weightBold: 700,
    
    lineHeight: 1.5,
    lineHeightTight: 1.25,
    lineHeightLoose: 1.75,
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borders: {
    radius: 4,
    radiusSm: 2,
    radiusLg: 8,
    radiusFull: 9999,
    
    width: 1,
    widthThick: 2,
    
    style: 'solid',
  },
  
  effects: {
    shadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowLg: '0 10px 25px rgba(0,0,0,0.1), 0 5px 10px rgba(0,0,0,0.04)',
    
    blur: 10,
  },
};
```

---

## 5. Theme Files

### 5.1 File Location

Theme definition files are located at:
```
docs/themes/
├── clean.wire
├── sketch.wire
├── blueprint.wire
└── realistic.wire
```

### 5.2 Theme File Format

Theme files use wireframe syntax to demonstrate the theme:

```wireframe
wireframe clean
    %title: Clean Theme Demo
    
    Vertical gap=16
        Heading "Clean Theme" level=1
        
        Horizontal gap=8
            Button "Primary" primary
            Button "Secondary" secondary
            Button "Default"
            Button "Disabled" disabled
        /Horizontal
        
        Card
            Heading "Form Example" level=2
            TextInput "Name" required
            TextInput "Email"
            Checkbox "Subscribe" checked
            Button "Submit" primary
        /Card
    /Vertical
/wireframe
```

---

## 6. Theme Usage

### 6.1 Specifying Theme in Document

```wireframe
wireframe clean
    // Uses clean theme
/wireframe

wireframe sketch
    // Uses sketch theme
/wireframe

wireframe blueprint
    // Uses blueprint theme
/wireframe

wireframe realistic
    // Uses realistic theme
/wireframe
```

### 6.2 Programmatic Theme Selection

```typescript
import { parse, render } from '@jonkeda/wireframe-core';
import { cleanTheme, sketchTheme } from '@jonkeda/wireframe-themes';

const { document } = parse(source);

// Override document theme
const { svg } = render(document, {
  theme: sketchTheme,
});
```

### 6.3 Custom Theme

```typescript
import { Theme, cleanTheme } from '@jonkeda/wireframe-themes';

const customTheme: Theme = {
  ...cleanTheme,
  name: 'custom',
  colors: {
    ...cleanTheme.colors,
    primary: '#8b5cf6',
    secondary: '#6366f1',
  },
};
```

---

## 7. Theme Extension

### 7.1 Creating a Custom Theme

```typescript
import { Theme } from '@jonkeda/wireframe-themes';

const myTheme: Theme = {
  name: 'my-theme',
  
  colors: {
    background: '#0f172a',
    foreground: '#e2e8f0',
    primary: '#06b6d4',
    // ... all required colors
  },
  
  fonts: {
    family: 'Fira Sans, sans-serif',
    // ... all required font settings
  },
  
  spacing: {
    xs: 2,
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  
  borders: {
    radius: 8,
    // ... all required border settings
  },
  
  effects: {
    shadow: '0 4px 14px rgba(0,0,0,0.25)',
    // ... all required effects
  },
};
```

### 7.2 Theme Merging

```typescript
function mergeTheme(base: Theme, overrides: Partial<Theme>): Theme {
  return {
    ...base,
    ...overrides,
    colors: { ...base.colors, ...overrides.colors },
    fonts: { ...base.fonts, ...overrides.fonts },
    spacing: { ...base.spacing, ...overrides.spacing },
    borders: { ...base.borders, ...overrides.borders },
    effects: { ...base.effects, ...overrides.effects },
  };
}
```

---

## 8. Theme Resolution

### 8.1 Resolution Order

1. Component-specific overrides
2. Document theme
3. Render options theme
4. Default theme (clean)

```typescript
function resolveTheme(
  document: DocumentNode,
  options?: RenderOptions
): Theme {
  // 1. Start with default
  let theme = cleanTheme;
  
  // 2. Apply document style
  const docStyle = document.style;
  if (docStyle && themes[docStyle]) {
    theme = themes[docStyle];
  }
  
  // 3. Override with render options
  if (options?.theme) {
    theme = options.theme;
  }
  
  return theme;
}
```

---

## 9. CSS Variables

### 9.1 Generated CSS Variables

Themes generate CSS custom properties for use in SVG:

```css
:root {
  --wire-bg: #ffffff;
  --wire-fg: #1a1a1a;
  --wire-primary: #2563eb;
  --wire-secondary: #64748b;
  --wire-border: #e2e8f0;
  --wire-radius: 6px;
  --wire-font: Inter, system-ui, sans-serif;
  --wire-font-size: 14px;
  /* ... more variables */
}
```

### 9.2 Using Variables in Components

```typescript
function renderButton(node: ControlNode): string {
  return `
    <rect 
      fill="var(--wire-primary)" 
      stroke="var(--wire-border)"
      rx="var(--wire-radius)"
    />
  `;
}
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [05_Renderer_Design](./05_Renderer_Design.md) | SVG rendering |
| [06_Component_Library](./06_Component_Library.md) | UI components |

---

*Theming System v1.0 - December 2025*
