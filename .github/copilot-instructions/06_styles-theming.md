# Styles and Theming Guide

This instruction file documents styling and theming patterns for Mermaid diagrams.

## Style Function Structure

Create `{name}Styles.ts` in the diagram folder:

```typescript
import type { DiagramStylesProvider } from '../../diagram-api/types.js';

const getStyles: DiagramStylesProvider = (options) => `
  .{name}-diagram {
    /* Base styles */
  }
  
  .node {
    fill: ${options.primaryColor};
    stroke: ${options.primaryBorderColor};
  }
  
  .edge {
    stroke: ${options.lineColor};
    fill: none;
  }
`;

export default getStyles;
```

## DiagramStylesProvider Type

```typescript
type DiagramStylesProvider = (options: ThemeOptions) => string;

interface ThemeOptions {
  // Primary colors
  primaryColor: string;
  primaryBorderColor: string;
  primaryTextColor: string;
  
  // Secondary colors
  secondaryColor: string;
  secondaryBorderColor: string;
  secondaryTextColor: string;
  
  // Tertiary colors
  tertiaryColor: string;
  tertiaryBorderColor: string;
  tertiaryTextColor: string;
  
  // Line and text
  lineColor: string;
  textColor: string;
  
  // Background
  background: string;
  mainBkg: string;
  
  // Font
  fontFamily: string;
  fontSize: string;
  
  // And more theme-specific options...
}
```

## Available Theme Variables

### Core Colors

| Variable | Description | Default (light) |
|----------|-------------|-----------------|
| `primaryColor` | Primary node fill | `#ECECFF` |
| `primaryBorderColor` | Primary node border | `#9370DB` |
| `primaryTextColor` | Primary text color | `#131300` |
| `secondaryColor` | Secondary node fill | `#ffffde` |
| `secondaryBorderColor` | Secondary border | `#AAAA33` |
| `tertiaryColor` | Tertiary/accent color | `#f8e8e8` |

### Line and Edge Colors

| Variable | Description | Default |
|----------|-------------|---------|
| `lineColor` | Default line/edge color | `#333333` |
| `edgeLabelBackground` | Background for edge labels | `#e8e8e8` |

### Background Colors

| Variable | Description | Default |
|----------|-------------|---------|
| `background` | Diagram background | `#ffffff` |
| `mainBkg` | Main content background | `#ECECFF` |
| `nodeBkg` | Node background | varies |
| `nodeBorder` | Node border | varies |

### Typography

| Variable | Description | Default |
|----------|-------------|---------|
| `fontFamily` | Font family | `"trebuchet ms", verdana, arial, sans-serif` |
| `fontSize` | Base font size | `16px` |

### Diagram-Specific Variables

You can access diagram-specific config:

```typescript
interface ArchitectureStyleOptions extends ThemeOptions {
  archEdgeWidth: string;
  archEdgeColor: string;
  archEdgeArrowColor: string;
  archGroupBorderColor: string;
  archGroupBorderWidth: string;
}
```

## Basic Style Patterns

### Node Styles

```typescript
const getStyles: DiagramStylesProvider = (options) => `
  .node {
    fill: ${options.primaryColor};
    stroke: ${options.primaryBorderColor};
    stroke-width: 1px;
  }
  
  .node-label {
    fill: ${options.primaryTextColor};
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
  }
  
  .node:hover {
    fill: ${options.secondaryColor};
    cursor: pointer;
  }
  
  .node.selected {
    stroke: ${options.lineColor};
    stroke-width: 2px;
  }
`;
```

### Edge Styles

```typescript
const getStyles: DiagramStylesProvider = (options) => `
  .edge {
    stroke: ${options.lineColor};
    stroke-width: 2px;
    fill: none;
  }
  
  .edge-label {
    fill: ${options.textColor};
    font-family: ${options.fontFamily};
    font-size: 12px;
  }
  
  .edge-label-bg {
    fill: ${options.edgeLabelBackground};
  }
  
  .arrow {
    fill: ${options.lineColor};
  }
  
  /* Dashed edge variant */
  .edge.dashed {
    stroke-dasharray: 5, 5;
  }
`;
```

### Group/Container Styles

```typescript
const getStyles: DiagramStylesProvider = (options) => `
  .group {
    fill: none;
    stroke: ${options.primaryBorderColor};
    stroke-width: 1px;
    stroke-dasharray: 8;
  }
  
  .group-label {
    fill: ${options.textColor};
    font-weight: bold;
  }
  
  .group-bg {
    fill: ${options.mainBkg};
    opacity: 0.5;
  }
`;
```

## Theme-Aware Styling

### Dark Mode Support

```typescript
const getStyles: DiagramStylesProvider = (options) => {
  const isDark = options.darkMode ?? false;
  
  return `
    .node {
      fill: ${options.primaryColor};
      stroke: ${options.primaryBorderColor};
      ${isDark ? 'filter: brightness(0.9);' : ''}
    }
    
    .node-label {
      fill: ${options.primaryTextColor};
    }
    
    .edge {
      stroke: ${options.lineColor};
      ${isDark ? 'opacity: 0.9;' : ''}
    }
  `;
};
```

### Conditional Styling

```typescript
const getStyles: DiagramStylesProvider = (options) => `
  .node {
    fill: ${options.primaryColor};
    stroke: ${options.primaryBorderColor};
  }
  
  /* Success state */
  .node.success {
    fill: ${options.successColor ?? '#90EE90'};
    stroke: ${options.successBorderColor ?? '#228B22'};
  }
  
  /* Error state */
  .node.error {
    fill: ${options.errorColor ?? '#FFB6C1'};
    stroke: ${options.errorBorderColor ?? '#DC143C'};
  }
  
  /* Warning state */
  .node.warning {
    fill: ${options.warningColor ?? '#FFE4B5'};
    stroke: ${options.warningBorderColor ?? '#FFA500'};
  }
`;
```

## CSS Class Conventions

### Standard Class Names

| Class | Purpose |
|-------|---------|
| `.{name}-diagram` | Root container |
| `.node` | Node element |
| `.node-bg` | Node background shape |
| `.node-label` | Node text label |
| `.edge` | Edge/line element |
| `.edge-label` | Edge label |
| `.edge-label-bg` | Edge label background |
| `.arrow` | Arrow marker |
| `.group` | Group container |
| `.group-label` | Group title |

### State Classes

| Class | Purpose |
|-------|---------|
| `.hover` | Mouse hover state |
| `.selected` | Selected state |
| `.active` | Active/current state |
| `.disabled` | Disabled state |
| `.highlight` | Highlighted state |

### Type Classes

| Class | Purpose |
|-------|---------|
| `.node-service` | Service node type |
| `.node-junction` | Junction/connector |
| `.node-group` | Group node |
| `.edge-arrow` | Directional edge |
| `.edge-line` | Non-directional edge |

## Complete Style Template

```typescript
import type { DiagramStylesProvider } from '../../diagram-api/types.js';

export interface {Name}StyleOptions {
  // Standard theme options
  primaryColor: string;
  primaryBorderColor: string;
  primaryTextColor: string;
  secondaryColor: string;
  lineColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: string;
  
  // Diagram-specific options
  {name}NodeWidth?: string;
  {name}EdgeWidth?: string;
}

const getStyles: DiagramStylesProvider = (options: {Name}StyleOptions) => `
  /* ===== Container ===== */
  .{name}-diagram {
    font-family: ${options.fontFamily};
    font-size: ${options.fontSize};
  }
  
  /* ===== Nodes ===== */
  .node {
    cursor: pointer;
  }
  
  .node-bg {
    fill: ${options.primaryColor};
    stroke: ${options.primaryBorderColor};
    stroke-width: 1px;
    rx: 5px;
    ry: 5px;
  }
  
  .node-label {
    fill: ${options.primaryTextColor};
    text-anchor: middle;
    dominant-baseline: middle;
    font-size: 14px;
  }
  
  .node:hover .node-bg {
    fill: ${options.secondaryColor};
    stroke-width: 2px;
  }
  
  .node.selected .node-bg {
    stroke: ${options.lineColor};
    stroke-width: 2px;
  }
  
  /* ===== Edges ===== */
  .edge {
    stroke: ${options.lineColor};
    stroke-width: ${options.{name}EdgeWidth ?? '2px'};
    fill: none;
  }
  
  .edge-label {
    fill: ${options.textColor};
    font-size: 12px;
    text-anchor: middle;
  }
  
  .edge-label-bg {
    fill: white;
    opacity: 0.8;
  }
  
  .arrow {
    fill: ${options.lineColor};
  }
  
  /* ===== Groups ===== */
  .group-bg {
    fill: none;
    stroke: ${options.primaryBorderColor};
    stroke-width: 1px;
    stroke-dasharray: 8;
  }
  
  .group-label {
    fill: ${options.textColor};
    font-weight: bold;
    font-size: 14px;
  }
  
  /* ===== States ===== */
  .disabled {
    opacity: 0.5;
    pointer-events: none;
  }
  
  .highlight {
    filter: drop-shadow(0 0 3px ${options.primaryBorderColor});
  }
  
  /* ===== Accessibility ===== */
  @media (prefers-reduced-motion: reduce) {
    * {
      transition: none !important;
    }
  }
  
  /* ===== Print ===== */
  @media print {
    .node-bg {
      fill: white !important;
      stroke: black !important;
    }
    .edge {
      stroke: black !important;
    }
  }
`;

export default getStyles;
```

## Adding Custom Theme Variables

Define diagram-specific config in `mermaid/packages/mermaid/src/config.type.ts`:

```typescript
export interface {Name}DiagramConfig {
  nodeWidth?: number;
  nodeHeight?: number;
  edgeWidth?: number;
  useMaxWidth?: boolean;
  // Style-related
  nodeColor?: string;
  nodeBorderColor?: string;
  edgeColor?: string;
}
```

Access in styles:

```typescript
const getStyles: DiagramStylesProvider = (options) => {
  const config = getConfig().{name} ?? {};
  
  return `
    .node-bg {
      fill: ${config.nodeColor ?? options.primaryColor};
      stroke: ${config.nodeBorderColor ?? options.primaryBorderColor};
    }
  `;
};
```

## Best Practices

1. **Use template literals**: Enables variable interpolation cleanly
2. **Provide fallbacks**: Use `??` for optional config values
3. **Follow CSS conventions**: Use kebab-case class names
4. **Support themes**: Use theme variables, not hardcoded colors
5. **Handle dark mode**: Test with dark theme variables
6. **Include states**: Style hover, selected, disabled states
7. **Add print styles**: Ensure diagrams print correctly
8. **Support reduced motion**: Respect accessibility preferences
9. **Comment sections**: Organize styles with clear comments
10. **Type options**: Define interface for custom style options
