# UIMMD Theming System

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document describes the UIMMD theming system, which provides four built-in wireframe styles and supports custom themes.

---

## 2. Built-in Themes

### 2.1 Theme Styles

| Theme | Description | Use Case |
|-------|-------------|----------|
| `sketch` | Hand-drawn, informal look | Early ideation, brainstorming |
| `clean` | Minimal, professional wireframe | Client presentations, documentation |
| `blueprint` | Technical blueprint style | Technical specifications |
| `realistic` | Close to final UI | High-fidelity prototypes |

### 2.2 Visual Comparison

```
??????????????????????????????????????????????????????????????????????????????
?  SKETCH                    ?  CLEAN                                        ?
?  ????????????????          ?  ????????????????                             ?
?  ?   Button     ? Wobbly   ?  ?   Button     ? Straight lines              ?
?  ???????????????? lines    ?  ???????????????? Clean corners               ?
??????????????????????????????????????????????????????????????????????????????
?  BLUEPRINT                 ?  REALISTIC                                     ?
?  ????????????????         ?  ????????????????                              ?
?  ?   Button     ? White    ?  ?   Button     ? Shadows, gradients          ?
?  ???????????????? on blue  ?  ???????????????? Realistic colors            ?
??????????????????????????????????????????????????????????????????????????????
```

---

## 3. Theme Interface

### 3.1 Theme Type Definition

```typescript
// src/themes/types.ts

export interface Theme {
    // Identity
    name: ThemeName;
    displayName: string;
    
    // Colors
    backgroundColor: string;
    foregroundColor: string;
    textColor: string;
    primaryColor: string;
    primaryTextColor: string;
    secondaryColor: string;
    borderColor: string;
    placeholderColor: string;
    disabledColor: string;
    errorColor: string;
    successColor: string;
    warningColor: string;
    infoColor: string;
    
    // Typography
    fontFamily: string;
    fontSize: number;
    fontWeight: number;
    lineHeight: number;
    
    // Spacing
    spacing: number;
    padding: Spacing;
    
    // Borders
    borderWidth: number;
    borderRadius: number;
    borderStyle: string;
    
    // Shadows
    shadowEnabled: boolean;
    shadowColor: string;
    shadowOffset: { x: number; y: number };
    shadowBlur: number;
    
    // Sketch-specific
    sketchEnabled: boolean;
    sketchRoughness: number;
    sketchBowing: number;
    
    // Component-specific
    components: ComponentThemes;
}

export type ThemeName = 'sketch' | 'clean' | 'blueprint' | 'realistic';

export interface Spacing {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ComponentThemes {
    button: ButtonTheme;
    input: InputTheme;
    card: CardTheme;
    header: SectionTheme;
    sidebar: SectionTheme;
    // ... more component themes
}

export interface ButtonTheme {
    height: number;
    paddingX: number;
    paddingY: number;
    borderRadius: number;
    fontSize: number;
    fontWeight: number;
}

export interface InputTheme {
    height: number;
    paddingX: number;
    borderRadius: number;
    fontSize: number;
}

export interface CardTheme {
    padding: number;
    borderRadius: number;
    shadow: string;
}

export interface SectionTheme {
    padding: number;
    backgroundColor: string;
    borderColor: string;
}
```

---

## 4. Theme Definitions

### 4.1 Sketch Theme

```typescript
// src/themes/sketch.ts

import { Theme } from './types';

export const sketchTheme: Theme = {
    name: 'sketch',
    displayName: 'Sketch',
    
    // Colors - muted, informal
    backgroundColor: '#fafafa',
    foregroundColor: '#ffffff',
    textColor: '#333333',
    primaryColor: '#666666',
    primaryTextColor: '#ffffff',
    secondaryColor: '#999999',
    borderColor: '#666666',
    placeholderColor: '#888888',
    disabledColor: '#cccccc',
    errorColor: '#cc4444',
    successColor: '#44aa44',
    warningColor: '#cc8844',
    infoColor: '#4488cc',
    
    // Typography - handwritten feel
    fontFamily: '"Comic Sans MS", "Segoe Print", cursive, sans-serif',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    
    // Spacing
    spacing: 8,
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    
    // Borders - thick, informal
    borderWidth: 2,
    borderRadius: 3,
    borderStyle: 'solid',
    
    // Shadows - none for sketch
    shadowEnabled: false,
    shadowColor: 'transparent',
    shadowOffset: { x: 0, y: 0 },
    shadowBlur: 0,
    
    // Sketch effects enabled
    sketchEnabled: true,
    sketchRoughness: 1.5,
    sketchBowing: 1,
    
    // Components
    components: {
        button: {
            height: 36,
            paddingX: 16,
            paddingY: 8,
            borderRadius: 3,
            fontSize: 14,
            fontWeight: 400
        },
        input: {
            height: 36,
            paddingX: 12,
            borderRadius: 3,
            fontSize: 14
        },
        card: {
            padding: 16,
            borderRadius: 4,
            shadow: 'none'
        },
        header: {
            padding: 16,
            backgroundColor: '#f0f0f0',
            borderColor: '#666666'
        },
        sidebar: {
            padding: 12,
            backgroundColor: '#f5f5f5',
            borderColor: '#666666'
        }
    }
};
```

### 4.2 Clean Theme

```typescript
// src/themes/clean.ts

import { Theme } from './types';

export const cleanTheme: Theme = {
    name: 'clean',
    displayName: 'Clean',
    
    // Colors - minimal, professional
    backgroundColor: '#ffffff',
    foregroundColor: '#ffffff',
    textColor: '#333333',
    primaryColor: '#0066cc',
    primaryTextColor: '#ffffff',
    secondaryColor: '#6c757d',
    borderColor: '#cccccc',
    placeholderColor: '#999999',
    disabledColor: '#e0e0e0',
    errorColor: '#dc3545',
    successColor: '#28a745',
    warningColor: '#ffc107',
    infoColor: '#17a2b8',
    
    // Typography - clean system fonts
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    
    // Spacing
    spacing: 8,
    padding: { top: 8, right: 16, bottom: 8, left: 16 },
    
    // Borders - thin, clean
    borderWidth: 1,
    borderRadius: 4,
    borderStyle: 'solid',
    
    // Shadows - subtle
    shadowEnabled: true,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { x: 0, y: 2 },
    shadowBlur: 4,
    
    // Sketch effects disabled
    sketchEnabled: false,
    sketchRoughness: 0,
    sketchBowing: 0,
    
    // Components
    components: {
        button: {
            height: 36,
            paddingX: 16,
            paddingY: 8,
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 500
        },
        input: {
            height: 36,
            paddingX: 12,
            borderRadius: 4,
            fontSize: 14
        },
        card: {
            padding: 16,
            borderRadius: 8,
            shadow: '0 2px 4px rgba(0,0,0,0.1)'
        },
        header: {
            padding: 16,
            backgroundColor: '#ffffff',
            borderColor: '#e0e0e0'
        },
        sidebar: {
            padding: 12,
            backgroundColor: '#f8f9fa',
            borderColor: '#e0e0e0'
        }
    }
};
```

### 4.3 Blueprint Theme

```typescript
// src/themes/blueprint.ts

import { Theme } from './types';

export const blueprintTheme: Theme = {
    name: 'blueprint',
    displayName: 'Blueprint',
    
    // Colors - blue technical drawing
    backgroundColor: '#1a365d',
    foregroundColor: '#1e40af',
    textColor: '#ffffff',
    primaryColor: '#60a5fa',
    primaryTextColor: '#1a365d',
    secondaryColor: '#93c5fd',
    borderColor: '#ffffff',
    placeholderColor: '#93c5fd',
    disabledColor: '#6b7280',
    errorColor: '#f87171',
    successColor: '#4ade80',
    warningColor: '#fbbf24',
    infoColor: '#60a5fa',
    
    // Typography - technical font
    fontFamily: '"Courier New", "Consolas", monospace',
    fontSize: 13,
    fontWeight: 400,
    lineHeight: 1.4,
    
    // Spacing
    spacing: 8,
    padding: { top: 8, right: 12, bottom: 8, left: 12 },
    
    // Borders - white lines
    borderWidth: 1,
    borderRadius: 0,
    borderStyle: 'solid',
    
    // Shadows - none
    shadowEnabled: false,
    shadowColor: 'transparent',
    shadowOffset: { x: 0, y: 0 },
    shadowBlur: 0,
    
    // Sketch effects disabled
    sketchEnabled: false,
    sketchRoughness: 0,
    sketchBowing: 0,
    
    // Components
    components: {
        button: {
            height: 32,
            paddingX: 12,
            paddingY: 6,
            borderRadius: 0,
            fontSize: 13,
            fontWeight: 400
        },
        input: {
            height: 32,
            paddingX: 8,
            borderRadius: 0,
            fontSize: 13
        },
        card: {
            padding: 12,
            borderRadius: 0,
            shadow: 'none'
        },
        header: {
            padding: 12,
            backgroundColor: '#1e40af',
            borderColor: '#ffffff'
        },
        sidebar: {
            padding: 12,
            backgroundColor: '#1e3a5f',
            borderColor: '#ffffff'
        }
    }
};
```

### 4.4 Realistic Theme

```typescript
// src/themes/realistic.ts

import { Theme } from './types';

export const realisticTheme: Theme = {
    name: 'realistic',
    displayName: 'Realistic',
    
    // Colors - modern UI
    backgroundColor: '#f5f5f5',
    foregroundColor: '#ffffff',
    textColor: '#1a1a1a',
    primaryColor: '#2563eb',
    primaryTextColor: '#ffffff',
    secondaryColor: '#64748b',
    borderColor: '#d1d5db',
    placeholderColor: '#9ca3af',
    disabledColor: '#e5e7eb',
    errorColor: '#ef4444',
    successColor: '#22c55e',
    warningColor: '#f59e0b',
    infoColor: '#3b82f6',
    
    // Typography - modern system fonts
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    fontSize: 14,
    fontWeight: 400,
    lineHeight: 1.5,
    
    // Spacing
    spacing: 8,
    padding: { top: 10, right: 16, bottom: 10, left: 16 },
    
    // Borders - subtle
    borderWidth: 1,
    borderRadius: 6,
    borderStyle: 'solid',
    
    // Shadows - realistic
    shadowEnabled: true,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { x: 0, y: 4 },
    shadowBlur: 12,
    
    // Sketch effects disabled
    sketchEnabled: false,
    sketchRoughness: 0,
    sketchBowing: 0,
    
    // Components
    components: {
        button: {
            height: 40,
            paddingX: 20,
            paddingY: 10,
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500
        },
        input: {
            height: 40,
            paddingX: 14,
            borderRadius: 6,
            fontSize: 14
        },
        card: {
            padding: 20,
            borderRadius: 12,
            shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        },
        header: {
            padding: 16,
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb'
        },
        sidebar: {
            padding: 16,
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb'
        }
    }
};
```

---

## 5. CSS Variables

### 5.1 CSS Variable Mapping

```css
/* src/themes/variables.css */

:root {
    /* Base Colors */
    --uimmd-bg: var(--uimmd-theme-bg, #ffffff);
    --uimmd-fg: var(--uimmd-theme-fg, #ffffff);
    --uimmd-text: var(--uimmd-theme-text, #333333);
    --uimmd-primary: var(--uimmd-theme-primary, #0066cc);
    --uimmd-primary-text: var(--uimmd-theme-primary-text, #ffffff);
    --uimmd-secondary: var(--uimmd-theme-secondary, #6c757d);
    --uimmd-border: var(--uimmd-theme-border, #cccccc);
    --uimmd-placeholder: var(--uimmd-theme-placeholder, #999999);
    --uimmd-disabled: var(--uimmd-theme-disabled, #e0e0e0);
    
    /* Status Colors */
    --uimmd-error: var(--uimmd-theme-error, #dc3545);
    --uimmd-success: var(--uimmd-theme-success, #28a745);
    --uimmd-warning: var(--uimmd-theme-warning, #ffc107);
    --uimmd-info: var(--uimmd-theme-info, #17a2b8);
    
    /* Typography */
    --uimmd-font-family: var(--uimmd-theme-font, sans-serif);
    --uimmd-font-size: var(--uimmd-theme-font-size, 14px);
    --uimmd-line-height: var(--uimmd-theme-line-height, 1.5);
    
    /* Spacing */
    --uimmd-spacing: var(--uimmd-theme-spacing, 8px);
    --uimmd-padding: var(--uimmd-theme-padding, 8px 16px);
    
    /* Borders */
    --uimmd-border-width: var(--uimmd-theme-border-width, 1px);
    --uimmd-border-radius: var(--uimmd-theme-border-radius, 4px);
    
    /* Shadows */
    --uimmd-shadow: var(--uimmd-theme-shadow, 0 2px 4px rgba(0,0,0,0.1));
}
```

### 5.2 Component Styles

```css
/* src/themes/components.css */

/* Button */
.uimmd-button {
    fill: var(--uimmd-fg);
    stroke: var(--uimmd-border);
    stroke-width: var(--uimmd-border-width);
}

.uimmd-button text {
    fill: var(--uimmd-text);
    font-family: var(--uimmd-font-family);
    font-size: var(--uimmd-font-size);
}

.uimmd-button.primary {
    fill: var(--uimmd-primary);
    stroke: var(--uimmd-primary);
}

.uimmd-button.primary text {
    fill: var(--uimmd-primary-text);
}

.uimmd-button.secondary {
    fill: var(--uimmd-secondary);
    stroke: var(--uimmd-secondary);
}

.uimmd-button.disabled {
    fill: var(--uimmd-disabled);
    stroke: var(--uimmd-disabled);
    opacity: 0.6;
}

/* Input */
.uimmd-input {
    fill: var(--uimmd-fg);
    stroke: var(--uimmd-border);
    stroke-width: var(--uimmd-border-width);
}

.uimmd-input text.placeholder {
    fill: var(--uimmd-placeholder);
    font-style: italic;
}

.uimmd-input .required-indicator {
    fill: var(--uimmd-error);
}

/* Card */
.uimmd-card {
    fill: var(--uimmd-fg);
    stroke: var(--uimmd-border);
    filter: drop-shadow(var(--uimmd-shadow));
}

/* Header */
.uimmd-header {
    fill: var(--uimmd-bg);
    stroke: var(--uimmd-border);
}

/* Alert types */
.uimmd-alert.error {
    fill: color-mix(in srgb, var(--uimmd-error) 10%, white);
    stroke: var(--uimmd-error);
}

.uimmd-alert.success {
    fill: color-mix(in srgb, var(--uimmd-success) 10%, white);
    stroke: var(--uimmd-success);
}

.uimmd-alert.warning {
    fill: color-mix(in srgb, var(--uimmd-warning) 10%, white);
    stroke: var(--uimmd-warning);
}

.uimmd-alert.info {
    fill: color-mix(in srgb, var(--uimmd-info) 10%, white);
    stroke: var(--uimmd-info);
}
```

---

## 6. Sketch Effect

### 6.1 Rough.js Integration

```typescript
// src/themes/sketch-renderer.ts

import rough from 'roughjs';

export class SketchRenderer {
    private rc: RoughCanvas;
    private options: RoughOptions;

    constructor(svg: SVGElement, theme: Theme) {
        this.rc = rough.svg(svg);
        this.options = {
            roughness: theme.sketchRoughness,
            bowing: theme.sketchBowing,
            stroke: theme.borderColor,
            strokeWidth: theme.borderWidth,
            fill: theme.foregroundColor,
            fillStyle: 'solid'
        };
    }

    rectangle(x: number, y: number, w: number, h: number, options?: RoughOptions): SVGGElement {
        return this.rc.rectangle(x, y, w, h, { ...this.options, ...options });
    }

    line(x1: number, y1: number, x2: number, y2: number, options?: RoughOptions): SVGGElement {
        return this.rc.line(x1, y1, x2, y2, { ...this.options, ...options });
    }

    circle(x: number, y: number, diameter: number, options?: RoughOptions): SVGGElement {
        return this.rc.circle(x, y, diameter, { ...this.options, ...options });
    }

    ellipse(x: number, y: number, w: number, h: number, options?: RoughOptions): SVGGElement {
        return this.rc.ellipse(x, y, w, h, { ...this.options, ...options });
    }

    path(d: string, options?: RoughOptions): SVGGElement {
        return this.rc.path(d, { ...this.options, ...options });
    }
}

interface RoughOptions {
    roughness?: number;
    bowing?: number;
    stroke?: string;
    strokeWidth?: number;
    fill?: string;
    fillStyle?: 'hachure' | 'solid' | 'zigzag' | 'cross-hatch';
    fillWeight?: number;
    hachureAngle?: number;
    hachureGap?: number;
}
```

### 6.2 Sketch Button Example

```typescript
// Sketch style button rendering
function renderSketchButton(node: LayoutNode, theme: Theme): string {
    const { x, y, width, height } = node.bounds;
    const sketch = new SketchRenderer(document.createElementNS('http://www.w3.org/2000/svg', 'svg'), theme);
    
    // Create wobbly rectangle
    const rect = sketch.rectangle(x, y, width, height, {
        roughness: 1.5,
        bowing: 1,
        fill: theme.foregroundColor,
        stroke: theme.borderColor
    });

    // Add hand-drawn text (using custom font)
    const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textEl.setAttribute('x', String(x + width / 2));
    textEl.setAttribute('y', String(y + height / 2));
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'central');
    textEl.setAttribute('font-family', theme.fontFamily);
    textEl.textContent = node.element.text;

    return rect.outerHTML + textEl.outerHTML;
}
```

---

## 7. Theme Manager

### 7.1 Theme Registration

```typescript
// src/themes/manager.ts

import { Theme, ThemeName } from './types';
import { sketchTheme } from './sketch';
import { cleanTheme } from './clean';
import { blueprintTheme } from './blueprint';
import { realisticTheme } from './realistic';

export class ThemeManager {
    private themes: Map<string, Theme> = new Map();
    private currentTheme: Theme;

    constructor() {
        // Register built-in themes
        this.register(sketchTheme);
        this.register(cleanTheme);
        this.register(blueprintTheme);
        this.register(realisticTheme);
        
        // Default to clean
        this.currentTheme = cleanTheme;
    }

    register(theme: Theme): void {
        this.themes.set(theme.name, theme);
    }

    get(name: ThemeName | string): Theme {
        const theme = this.themes.get(name);
        if (!theme) {
            console.warn(`Theme "${name}" not found, using clean`);
            return cleanTheme;
        }
        return theme;
    }

    getAll(): Theme[] {
        return Array.from(this.themes.values());
    }

    getCurrent(): Theme {
        return this.currentTheme;
    }

    setCurrent(name: ThemeName | string): void {
        this.currentTheme = this.get(name);
    }

    // Create custom theme by extending existing
    extend(baseName: ThemeName, customizations: Partial<Theme>): Theme {
        const base = this.get(baseName);
        return {
            ...base,
            ...customizations,
            name: customizations.name || `${base.name}-custom` as any,
            components: {
                ...base.components,
                ...(customizations.components || {})
            }
        };
    }
}

// Singleton instance
export const themeManager = new ThemeManager();
```

### 7.2 Theme Application

```typescript
// src/themes/apply.ts

export function applyTheme(theme: Theme, container: SVGElement): void {
    // Set CSS variables on container
    const style = container.style;
    
    style.setProperty('--uimmd-theme-bg', theme.backgroundColor);
    style.setProperty('--uimmd-theme-fg', theme.foregroundColor);
    style.setProperty('--uimmd-theme-text', theme.textColor);
    style.setProperty('--uimmd-theme-primary', theme.primaryColor);
    style.setProperty('--uimmd-theme-primary-text', theme.primaryTextColor);
    style.setProperty('--uimmd-theme-secondary', theme.secondaryColor);
    style.setProperty('--uimmd-theme-border', theme.borderColor);
    style.setProperty('--uimmd-theme-placeholder', theme.placeholderColor);
    style.setProperty('--uimmd-theme-disabled', theme.disabledColor);
    
    style.setProperty('--uimmd-theme-error', theme.errorColor);
    style.setProperty('--uimmd-theme-success', theme.successColor);
    style.setProperty('--uimmd-theme-warning', theme.warningColor);
    style.setProperty('--uimmd-theme-info', theme.infoColor);
    
    style.setProperty('--uimmd-theme-font', theme.fontFamily);
    style.setProperty('--uimmd-theme-font-size', `${theme.fontSize}px`);
    style.setProperty('--uimmd-theme-line-height', String(theme.lineHeight));
    
    style.setProperty('--uimmd-theme-spacing', `${theme.spacing}px`);
    style.setProperty('--uimmd-theme-border-width', `${theme.borderWidth}px`);
    style.setProperty('--uimmd-theme-border-radius', `${theme.borderRadius}px`);
    
    if (theme.shadowEnabled) {
        const shadow = `${theme.shadowOffset.x}px ${theme.shadowOffset.y}px ${theme.shadowBlur}px ${theme.shadowColor}`;
        style.setProperty('--uimmd-theme-shadow', shadow);
    } else {
        style.setProperty('--uimmd-theme-shadow', 'none');
    }

    // Add theme class
    container.classList.remove('uimmd-theme-sketch', 'uimmd-theme-clean', 'uimmd-theme-blueprint', 'uimmd-theme-realistic');
    container.classList.add(`uimmd-theme-${theme.name}`);
}
```

---

## 8. Custom Themes

### 8.1 Creating Custom Theme

```typescript
// Example: Creating a dark theme
const darkTheme = themeManager.extend('clean', {
    name: 'dark' as any,
    displayName: 'Dark Mode',
    backgroundColor: '#1a1a2e',
    foregroundColor: '#16213e',
    textColor: '#e0e0e0',
    primaryColor: '#0f4c75',
    borderColor: '#4a4a6a',
    placeholderColor: '#6a6a8a'
});

themeManager.register(darkTheme);
```

### 8.2 Theme Configuration in UIMMD

```uimmd
uiwire clean
    %theme-primary: #ff5722
    %theme-border-radius: 8
    %theme-font: "Inter, sans-serif"
    
    // Content with custom theme colors
/uiwire
```

---

## 9. Theme Preview

### 9.1 Component Preview Matrix

| Component | Sketch | Clean | Blueprint | Realistic |
|-----------|--------|-------|-----------|-----------|
| Button | Wobbly edges | Clean rect | Technical lines | Shadows, hover |
| Input | Hand-drawn | Minimal border | Grid-like | Focus states |
| Card | Sketchy shadow | Subtle shadow | No shadow | Depth shadow |
| Checkbox | Rough square | Clean square | Technical | Animated check |

---

## 10. Accessibility

### 10.1 Color Contrast

All themes must meet WCAG 2.1 AA contrast requirements:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### 10.2 Color Contrast Check

```typescript
function checkContrast(foreground: string, background: string): number {
    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

function validateTheme(theme: Theme): ValidationResult[] {
    const issues: ValidationResult[] = [];
    
    const textContrast = checkContrast(theme.textColor, theme.backgroundColor);
    if (textContrast < 4.5) {
        issues.push({
            type: 'error',
            message: `Text contrast ${textContrast.toFixed(2)}:1 is below 4.5:1 requirement`
        });
    }
    
    const primaryContrast = checkContrast(theme.primaryTextColor, theme.primaryColor);
    if (primaryContrast < 4.5) {
        issues.push({
            type: 'error',
            message: `Primary button text contrast ${primaryContrast.toFixed(2)}:1 is below 4.5:1`
        });
    }
    
    return issues;
}
```

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [23_Renderer_Design](./23_Renderer_Design.md) | Renderer details |
| [25_Component_Library](./25_Component_Library.md) | Component specs |

---

*UIMMD Theming System v1.0 - 2025*
