# Renderer Design

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source Files:** `packages/core/src/renderer/`

---

## 1. Overview

The Wireframe Renderer converts an AST (Abstract Syntax Tree) into SVG output. The renderer handles:

- Layout calculations
- Component rendering
- Theme application
- Text measurement
- SVG generation

---

## 2. Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    AST      │────▶│   Layout    │────▶│  SVG Gen    │
│  (parsed)   │     │  Calculator │     │  (output)   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
              ┌─────────┐   ┌─────────┐
              │  Theme  │   │ Metrics │
              └─────────┘   └─────────┘
```

---

## 3. Rendering Interface

### 3.1 Public API

```typescript
/**
 * Render options
 */
export interface RenderOptions {
  theme?: Theme;           // Theme to apply
  width?: number;          // Output width
  height?: number;         // Output height
  scale?: number;          // Scale factor
  format?: 'svg' | 'png';  // Output format
}

/**
 * Render result
 */
export interface RenderResult {
  svg: string;             // SVG string output
  width: number;           // Actual width
  height: number;          // Actual height
}

/**
 * Render AST to SVG
 */
export function render(
  document: DocumentNode, 
  options?: RenderOptions
): RenderResult;

/**
 * Convenience function
 */
export function renderToSvg(source: string): string;
```

### 3.2 Usage Example

```typescript
import { parse, render } from '@jonkeda/wireframe-core';

const source = `
wireframe clean
    Vertical gap=16
        Button "Click Me" primary
    /Vertical
/wireframe
`;

const { document } = parse(source);
const { svg, width, height } = render(document, {
  theme: cleanTheme,
  width: 800,
});

console.log(svg);
```

---

## 4. Layout System

### 4.1 Layout Box Model

```
┌───────────────────────────────────────────┐
│                  margin                   │
│   ┌───────────────────────────────────┐   │
│   │              border               │   │
│   │   ┌───────────────────────────┐   │   │
│   │   │         padding           │   │   │
│   │   │   ┌───────────────────┐   │   │   │
│   │   │   │     content       │   │   │   │
│   │   │   │  (width x height) │   │   │   │
│   │   │   └───────────────────┘   │   │   │
│   │   │                           │   │   │
│   │   └───────────────────────────┘   │   │
│   │                                   │   │
│   └───────────────────────────────────┘   │
│                                           │
└───────────────────────────────────────────┘
```

### 4.2 Layout Node Interface

```typescript
interface LayoutBox {
  x: number;
  y: number;
  width: number;
  height: number;
  contentWidth: number;
  contentHeight: number;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
}
```

### 4.3 Layout Algorithms

#### Vertical Layout

```typescript
function layoutVertical(node: LayoutNode, available: Rect): LayoutBox {
  const gap = node.attributes.gap ?? 0;
  let y = available.y + padding.top;
  
  for (const child of node.children) {
    const childBox = layoutElement(child, {
      x: available.x + padding.left,
      y: y,
      width: available.width - padding.left - padding.right,
      height: Infinity,
    });
    y += childBox.height + gap;
  }
  
  return {
    x: available.x,
    y: available.y,
    width: available.width,
    height: y - available.y - gap + padding.bottom,
    // ...
  };
}
```

#### Horizontal Layout

```typescript
function layoutHorizontal(node: LayoutNode, available: Rect): LayoutBox {
  const gap = node.attributes.gap ?? 0;
  let x = available.x + padding.left;
  
  for (const child of node.children) {
    const childBox = layoutElement(child, {
      x: x,
      y: available.y + padding.top,
      width: Infinity,
      height: available.height - padding.top - padding.bottom,
    });
    x += childBox.width + gap;
  }
  
  return {
    x: available.x,
    y: available.y,
    width: x - available.x - gap + padding.right,
    height: available.height,
    // ...
  };
}
```

#### Grid Layout

```typescript
function layoutGrid(node: LayoutNode, available: Rect): LayoutBox {
  const columns = node.attributes.columns ?? 1;
  const gap = node.attributes.gap ?? 0;
  const cellWidth = (available.width - gap * (columns - 1)) / columns;
  
  let row = 0, col = 0;
  for (const child of node.children) {
    const x = available.x + col * (cellWidth + gap);
    const y = available.y + row * (cellHeight + gap);
    
    layoutElement(child, { x, y, width: cellWidth, height: cellHeight });
    
    col++;
    if (col >= columns) {
      col = 0;
      row++;
    }
  }
  
  return { /* ... */ };
}
```

---

## 5. Component Rendering

### 5.1 Render Visitor Pattern

```typescript
interface ComponentRenderer {
  render(node: ASTNode, box: LayoutBox, theme: Theme): SVGElement;
}

const renderers: Record<string, ComponentRenderer> = {
  Button: new ButtonRenderer(),
  TextInput: new TextInputRenderer(),
  Label: new LabelRenderer(),
  // ...
};

function renderComponent(node: ControlNode, box: LayoutBox, theme: Theme): string {
  const renderer = renderers[node.controlType];
  return renderer.render(node, box, theme);
}
```

### 5.2 Button Renderer Example

```typescript
class ButtonRenderer implements ComponentRenderer {
  render(node: ControlNode, box: LayoutBox, theme: Theme): string {
    const { x, y, width, height } = box;
    const isPrimary = node.modifiers.primary;
    const isDisabled = node.modifiers.disabled;
    
    const fill = isPrimary ? theme.colors.primary : theme.colors.secondary;
    const stroke = theme.colors.border;
    const textColor = isPrimary ? theme.colors.onPrimary : theme.colors.foreground;
    
    return `
      <g class="wireframe-button ${isPrimary ? 'primary' : ''} ${isDisabled ? 'disabled' : ''}">
        <rect 
          x="${x}" y="${y}" 
          width="${width}" height="${height}" 
          rx="${theme.borderRadius}"
          fill="${fill}" 
          stroke="${stroke}"
        />
        <text 
          x="${x + width / 2}" 
          y="${y + height / 2}" 
          text-anchor="middle" 
          dominant-baseline="central"
          fill="${textColor}"
          font-family="${theme.fonts.family}"
          font-size="${theme.fonts.size}"
        >${node.text}</text>
      </g>
    `;
  }
}
```

### 5.3 Input Renderer Example

```typescript
class TextInputRenderer implements ComponentRenderer {
  render(node: ControlNode, box: LayoutBox, theme: Theme): string {
    const { x, y, width, height } = box;
    const placeholder = node.placeholder || '';
    const isRequired = node.modifiers.required;
    
    return `
      <g class="wireframe-input ${isRequired ? 'required' : ''}">
        <rect 
          x="${x}" y="${y}" 
          width="${width}" height="${height}"
          rx="${theme.borderRadius}"
          fill="${theme.colors.inputBackground}"
          stroke="${theme.colors.border}"
        />
        <text 
          x="${x + 8}" 
          y="${y + height / 2}"
          dominant-baseline="central"
          fill="${theme.colors.placeholder}"
          font-family="${theme.fonts.family}"
          font-size="${theme.fonts.size}"
        >${placeholder}</text>
        ${isRequired ? `<text x="${x + width - 12}" y="${y + 12}" fill="red">*</text>` : ''}
      </g>
    `;
  }
}
```

---

## 6. SVG Generation

### 6.1 SVG Document Structure

```svg
<svg 
  xmlns="http://www.w3.org/2000/svg" 
  width="800" 
  height="600"
  viewBox="0 0 800 600"
>
  <defs>
    <!-- Filters, gradients, patterns -->
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.2"/>
    </filter>
  </defs>
  
  <style>
    .wireframe-button { cursor: pointer; }
    .wireframe-button.disabled { opacity: 0.5; }
    /* ... more styles */
  </style>
  
  <!-- Rendered components -->
  <g class="wireframe-content">
    <!-- Components here -->
  </g>
</svg>
```

### 6.2 SVG Builder

```typescript
class SVGBuilder {
  private elements: string[] = [];
  private defs: string[] = [];
  private styles: string[] = [];
  
  addElement(svg: string): void {
    this.elements.push(svg);
  }
  
  addDef(def: string): void {
    this.defs.push(def);
  }
  
  addStyle(style: string): void {
    this.styles.push(style);
  }
  
  build(width: number, height: number): string {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" 
           width="${width}" height="${height}"
           viewBox="0 0 ${width} ${height}">
        <defs>${this.defs.join('\n')}</defs>
        <style>${this.styles.join('\n')}</style>
        <g class="wireframe-content">
          ${this.elements.join('\n')}
        </g>
      </svg>
    `;
  }
}
```

---

## 7. Text Measurement

### 7.1 Text Metrics

```typescript
interface TextMetrics {
  width: number;
  height: number;
  baseline: number;
}

function measureText(text: string, font: FontSpec): TextMetrics {
  // In browser: use canvas measureText
  // In Node: use font metrics library
  const avgCharWidth = font.size * 0.6;
  return {
    width: text.length * avgCharWidth,
    height: font.size * 1.2,
    baseline: font.size,
  };
}
```

### 7.2 Text Wrapping

```typescript
function wrapText(text: string, maxWidth: number, font: FontSpec): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = measureText(testLine, font);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}
```

---

## 8. Default Sizes

### 8.1 Control Sizes

| Component | Default Width | Default Height |
|-----------|---------------|----------------|
| Button | auto (min 80) | 36 |
| IconButton | 36 | 36 |
| TextInput | 200 | 36 |
| TextArea | 200 | 100 |
| Checkbox | 24 | 24 |
| Radio | 24 | 24 |
| Switch | 48 | 24 |
| Dropdown | 200 | 36 |
| Slider | 200 | 24 |
| Progress | 200 | 8 |
| Avatar | 40 | 40 |
| Badge | auto | 20 |

### 8.2 Section Sizes

| Section | Default Size |
|---------|--------------|
| Header | width: 100%, height: 64 |
| Footer | width: 100%, height: 48 |
| Sidebar | width: 240, height: 100% |
| Toolbar | width: 100%, height: 48 |
| StatusBar | width: 100%, height: 24 |

---

## 9. Rendering Pipeline

```
Document AST
     │
     ▼
┌─────────────────────────────────────────┐
│  1. Calculate Layout                     │
│     - Measure all elements               │
│     - Apply layout algorithms            │
│     - Resolve sizes and positions        │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  2. Apply Theme                          │
│     - Load theme colors                  │
│     - Resolve fonts                      │
│     - Calculate style properties         │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  3. Render Components                    │
│     - Visit each node                    │
│     - Generate SVG for each component    │
│     - Build SVG tree                     │
└─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────┐
│  4. Generate Output                      │
│     - Combine SVG elements               │
│     - Add defs and styles                │
│     - Produce final SVG string           │
└─────────────────────────────────────────┘
     │
     ▼
  SVG Output
```

---

## 10. Error Handling

### 10.1 Render Errors

```typescript
interface RenderError {
  message: string;
  node?: ASTNode;
  phase: 'layout' | 'render' | 'output';
}

interface RenderResult {
  svg: string;
  width: number;
  height: number;
  errors: RenderError[];
}
```

### 10.2 Fallback Rendering

When a component fails to render, a placeholder is shown:

```typescript
function renderFallback(node: ASTNode, box: LayoutBox): string {
  return `
    <g class="wireframe-error">
      <rect 
        x="${box.x}" y="${box.y}" 
        width="${box.width}" height="${box.height}"
        fill="#fee" stroke="#f00" stroke-dasharray="4"
      />
      <text x="${box.x + 4}" y="${box.y + 14}" fill="#f00">
        Error: ${node.type}
      </text>
    </g>
  `;
}
```

---

## 11. Sketch Theme Rendering

The sketch theme uses hand-drawn style rendering implemented in `sketch.ts`.

### 11.1 Sketch Helpers Module

```typescript
// packages/core/src/renderer/sketch.ts

/**
 * Generate a sketchy line path between two points
 */
export function sketchyLine(
  x1: number, y1: number,
  x2: number, y2: number,
  roughness?: number
): string;

/**
 * Generate a sketchy rectangle path
 */
export function sketchyRect(
  x: number, y: number,
  width: number, height: number,
  roughness?: number
): string;

/**
 * Generate a sketchy circle/ellipse path
 */
export function sketchyCircle(
  cx: number, cy: number,
  rx: number, ry: number,
  roughness?: number
): string;
```

### 11.2 Algorithm

The sketchy rendering algorithm adds controlled randomness:

1. **Line Jitter** - Add small random offsets to line endpoints
2. **Multi-Stroke** - Draw 2-3 overlapping strokes for hand-drawn effect
3. **Curve Variation** - Use bezier curves instead of straight lines
4. **Roughness Control** - Configurable roughness factor (0-1)

### 11.3 Theme Integration

```typescript
class SVGRenderer {
  private createRect(x, y, w, h, rx, fill, stroke): string {
    if (this.theme.name === 'sketch') {
      const path = sketchyRect(x, y, w, h, 0.5);
      return `<path d="${path}" fill="${fill}" stroke="${stroke}" />`;
    }
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ... />`;
  }
}
```

### 11.4 Affected Components

Components that use sketchy rendering when `theme=sketch`:

- Button, IconButton
- TextInput, TextArea, NumberInput
- Card, Panel, Section containers
- Checkbox, Radio (outline)
- Progress bar
- Table/DataGrid borders

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [04_AST_Reference](./04_AST_Reference.md) | AST node types |
| [06_Component_Library](./06_Component_Library.md) | UI components |
| [07_Theming_System](./07_Theming_System.md) | Theme definitions |

---

*Renderer Design v1.0 - December 2025*
