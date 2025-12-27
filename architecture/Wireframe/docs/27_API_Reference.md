# Wireframe API Reference

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document provides the public API reference for the Wireframe library.

---

## 2. Package Structure

```
@jonkeda/wireframe-core           # Core parser and renderer
@jonkeda/wireframe-mermaid-plugin # Mermaid.js integration
@jonkeda/wireframe-themes         # Theme definitions
@jonkeda/wireframe-cli            # Command-line interface
```

---

## 3. Core Library (@jonkeda/wireframe-core)

### 3.1 Main Exports

```typescript
// Main entry point
import {
    parse,
    render,
    validate,
    getTheme,
    registerTheme,
    Document,
    RenderOptions,
    Theme
} from '@jonkeda/wireframe-core';
```

---

### 3.2 parse()

Parses Wireframe source text into an AST.

```typescript
function parse(source: string, options.: ParseOptions): Document;
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| source | string | Yes | Wireframe source text |
| options | ParseOptions | No | Parsing options |

**ParseOptions:**

```typescript
interface ParseOptions {
    // Error handling
    throwOnError.: boolean;      // Throw on parse error (default: true)
    
    // Source information
    filename.: string;           // Source filename for error messages
    
    // Features
    allowIncomplete.: boolean;   // Allow incomplete documents (default: false)
}
```

**Returns:** `Document` AST node

**Example:**

```typescript
import { parse } from '@jonkeda/wireframe-core';

const source = `
wireframe clean
    %title: My Form
    
    Button "Click Me"
/wireframe
`;

const document = parse(source);
console.log(document.style);        // 'clean'
console.log(document.body.length);  // 1
```

**Throws:** `ParseError` on syntax errors

---

### 3.3 render()

Renders an AST document to SVG.

```typescript
function render(document: Document, options.: RenderOptions): string;
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| document | Document | Yes | Parsed AST |
| options | RenderOptions | No | Rendering options |

**RenderOptions:**

```typescript
interface RenderOptions {
    // Dimensions
    width.: number;              // Container width (default: 800)
    height.: number;             // Container height (auto if not set)
    padding.: number;            // Outer padding (default: 20)
    
    // Theme
    theme.: Theme | string;      // Theme name or object
    
    // Display options
    showIds.: boolean;           // Show element IDs (default: false)
    showBindings.: boolean;      // Show data bindings (default: false)
    showGrid.: boolean;          // Show alignment grid (default: false)
    
    // Interactivity
    interactive.: boolean;       // Enable interactions (default: false)
    
    // Output
    minify.: boolean;            // Minify SVG output (default: false)
}
```

**Returns:** SVG string

**Example:**

```typescript
import { parse, render } from '@jonkeda/wireframe-core';

const document = parse(source);
const svg = render(document, {
    width: 600,
    theme: 'sketch',
    showIds: true
});

document.getElementById('preview').innerHTML = svg;
```

---

### 3.4 validate()

Validates a parsed document.

```typescript
function validate(document: Document): ValidationError[];
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| document | Document | Yes | Parsed AST |

**Returns:** Array of `ValidationError`

**ValidationError:**

```typescript
interface ValidationError {
    message: string;
    severity: 'error' | 'warning';
    code: string;
    location: SourceLocation;
}
```

**Example:**

```typescript
import { parse, validate } from '@jonkeda/wireframe-core';

const document = parse(source);
const errors = validate(document);

errors.forEach(error => {
    console.log(`${error.severity}: ${error.message} at line ${error.location.start.line}`);
});
```

---

### 3.5 getTheme()

Gets a theme by name.

```typescript
function getTheme(name: ThemeName): Theme;
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| name | ThemeName | Yes | Theme name |

**ThemeName:** `'sketch' | 'clean' | 'blueprint' | 'realistic'`

**Returns:** `Theme` object

**Example:**

```typescript
import { getTheme } from '@jonkeda/wireframe-core';

const theme = getTheme('sketch');
console.log(theme.fontFamily);  // "Comic Sans MS", ...
```

---

### 3.6 registerTheme()

Registers a custom theme.

```typescript
function registerTheme(theme: Theme): void;
```

**Example:**

```typescript
import { registerTheme, getTheme } from '@jonkeda/wireframe-core';

const darkTheme = {
    ...getTheme('clean'),
    name: 'dark',
    backgroundColor: '#1a1a2e',
    textColor: '#e0e0e0'
};

registerTheme(darkTheme);
```

---

## 4. Type Definitions

### 4.1 Document

```typescript
interface Document {
    type: 'Document';
    style: 'sketch' | 'clean' | 'blueprint' | 'realistic';
    metadata: Metadata[];
    body: Element[];
    dataSections: DataSection[];
    location: SourceLocation;
}

interface Metadata {
    type: 'Metadata';
    name: string;
    value: string;
    location: SourceLocation;
}

interface SourceLocation {
    start: Position;
    end: Position;
}

interface Position {
    line: number;
    column: number;
    offset: number;
}
```

### 4.2 Elements

```typescript
type Element = Layout | Section | Control | Component;

interface Layout {
    type: 'Layout';
    layoutType: 'Grid' | 'Vertical' | 'Horizontal' | 'Dock' | 'Canvas' | 'Scroll';
    attributes: Record<string, any>;
    children: Element[];
    location: SourceLocation;
}

interface Section {
    type: 'Section';
    sectionType: 'Header' | 'Footer' | 'Sidebar' | 'Content' | 'Panel' | 'Card' | 'Toolbar' | 'Modal' | 'Drawer';
    attributes: Record<string, any>;
    children: Element[];
    location: SourceLocation;
}

interface Control {
    type: 'Control';
    controlType: ControlType;
    text.: string;
    id.: string;
    binding.: string;
    navigation.: Navigation;
    icon.: string;
    modifiers: Modifier[];
    attributes: Record<string, any>;
    children.: Element[];
    location: SourceLocation;
}

type ControlType = 
    | 'Button' | 'IconButton' 
    | 'TextInput' | 'NumberInput' | 'DateInput' | 'PasswordInput' | 'TextArea'
    | 'Label' | 'Checkbox' | 'Radio' | 'Dropdown' | 'Option'
    | 'Separator' | 'Spacer' | 'Icon' | 'Image';

type Modifier = 'primary' | 'secondary' | 'required' | 'disabled' | 'checked' | 'selected';

interface Navigation {
    target: string;
    type: 'page' | 'back' | 'close' | 'modal' | 'drawer';
}
```

### 4.3 Theme

```typescript
interface Theme {
    name: string;
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
    
    // Layout
    spacing: number;
    padding: { top: number; right: number; bottom: number; left: number };
    
    // Borders
    borderWidth: number;
    borderRadius: number;
    
    // Effects
    shadowEnabled: boolean;
    shadowColor: string;
    shadowOffset: { x: number; y: number };
    shadowBlur: number;
    sketchEnabled: boolean;
    sketchRoughness: number;
    sketchBowing: number;
}
```

---

## 5. Mermaid Plugin (@jonkeda/wireframe-mermaid-plugin)

### 5.1 Registration

```typescript
import '@jonkeda/wireframe-mermaid-plugin';
// Auto-registers with Mermaid

// Or manual registration
import { registerWireframeDiagram } from '@jonkeda/wireframe-mermaid-plugin';
registerWireframeDiagram();
```

### 5.2 Configuration

```typescript
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: true,
    
    // Wireframe-specific config
    wireframe: {
        theme: 'sketch',
        width: 800,
        showIds: false,
        showBindings: false,
        primaryColor: '#007bff'
    }
});
```

### 5.3 WireframeConfig

```typescript
interface WireframeConfig {
    theme.: 'sketch' | 'clean' | 'blueprint' | 'realistic';
    width.: number | 'auto';
    showIds.: boolean;
    showBindings.: boolean;
    showGrid.: boolean;
    
    // Theme overrides
    primaryColor.: string;
    backgroundColor.: string;
    textColor.: string;
    borderColor.: string;
    fontFamily.: string;
    fontSize.: number;
    borderRadius.: number;
}
```

---

## 6. CLI (@jonkeda/wireframe-cli)

### 6.1 Commands

```bash
# Parse and validate
Wireframe validate <file.wire>

# Render to SVG
Wireframe render <file.wire> -o output.svg

# Render to PNG
Wireframe render <file.wire> -o output.png --format png

# Watch mode
Wireframe watch <file.wire> --serve

# Convert theme
Wireframe render <file.wire> --theme sketch -o sketch.svg
```

### 6.2 CLI Options

```bash
Wireframe render [options] <input>

Options:
  -o, --output <file>     Output file path
  -f, --format <format>   Output format: svg, png (default: svg)
  -t, --theme <theme>     Theme: sketch, clean, blueprint, realistic
  -w, --width <pixels>    Output width (default: 800)
  -h, --height <pixels>   Output height (auto if not specified)
  --show-ids              Show element IDs
  --show-bindings         Show data bindings
  --show-grid             Show alignment grid
  --minify                Minify SVG output
  --help                  Show help
```

### 6.3 Programmatic Usage

```typescript
import { cli } from '@jonkeda/wireframe-cli';

// Render file
await cli.render('form.wire', {
    output: 'form.svg',
    theme: 'clean'
});

// Validate file
const result = await cli.validate('form.wire');
if (!result.valid) {
    console.error(result.errors);
}
```

---

## 7. VSCode Extension API

### 7.1 Extension Commands

| Command | Description |
|---------|-------------|
| `Wireframe.preview` | Open preview |
| `Wireframe.previewSide` | Open preview to side |
| `Wireframe.export.svg` | Export as SVG |
| `Wireframe.export.png` | Export as PNG |
| `Wireframe.format` | Format document |
| `Wireframe.insertSnippet` | Insert component snippet |

### 7.2 Extension Settings

```json
{
    "Wireframe.preview.theme": "auto",
    "Wireframe.preview.refreshDelay": 300,
    "Wireframe.preview.showGrid": false,
    "Wireframe.preview.showIds": false,
    "Wireframe.editor.formatOnSave": false,
    "Wireframe.validation.enabled": true
}
```

### 7.3 Language Server Protocol

The Wireframe language server implements:
- `textDocument/completion`
- `textDocument/hover`
- `textDocument/definition`
- `textDocument/documentSymbol`
- `textDocument/foldingRange`
- `textDocument/formatting`
- `textDocument/publishDiagnostics`

---

## 8. Events

### 8.1 Renderer Events

```typescript
interface RendererEvents {
    'element:click': (element: Element, event: MouseEvent) => void;
    'element:hover': (element: Element, event: MouseEvent) => void;
    'navigation': (target: Navigation) => void;
    'render:start': (document: Document) => void;
    'render:complete': (svg: string, duration: number) => void;
    'error': (error: Error) => void;
}

// Usage
import { createRenderer } from '@jonkeda/wireframe-core';

const renderer = createRenderer({
    interactive: true
});

renderer.on('element:click', (element) => {
    console.log('Clicked:', element.id);
});

renderer.on('navigation', (nav) => {
    if (nav.type === 'page') {
        window.location.href = `/${nav.target}.html`;
    }
});
```

---

## 9. Utilities

### 9.1 AST Utilities

```typescript
import { walk, find, findAll, getById } from '@jonkeda/wireframe-core/utils';

// Walk all nodes
walk(document, (node, parent, depth) => {
    console.log(`${depth}: ${node.type}`);
});

// Find first match
const button = find(document, node => 
    node.type === 'Control' && node.controlType === 'Button'
);

// Find all matches
const inputs = findAll(document, node =>
    node.type === 'Control' && node.controlType.endsWith('Input')
);

// Get by ID
const element = getById(document, 'btnSubmit');
```

### 9.2 Theme Utilities

```typescript
import { extendTheme, mergeThemes } from '@jonkeda/wireframe-core/themes';

// Extend a theme
const customTheme = extendTheme('clean', {
    primaryColor: '#ff5722',
    borderRadius: 8
});

// Merge multiple themes
const merged = mergeThemes(baseTheme, overrides);
```

### 9.3 Source Map

```typescript
import { generateSourceMap } from '@jonkeda/wireframe-core/sourcemap';

const { svg, sourceMap } = render(document, {
    sourceMap: true
});

// Map SVG element to source location
const location = sourceMap.getSourceLocation(svgElement);
console.log(`Line ${location.line}, Column ${location.column}`);
```

---

## 10. Error Types

### 10.1 ParseError

```typescript
class ParseError extends Error {
    constructor(
        message: string,
        public location: SourceLocation,
        public code: string
    );
}
```

### 10.2 ValidationError

```typescript
interface ValidationError {
    message: string;
    severity: 'error' | 'warning';
    code: string;
    location: SourceLocation;
}
```

### 10.3 Error Codes

| Code | Description |
|------|-------------|
| `E001` | Unexpected token |
| `E002` | Unclosed block |
| `E003` | Invalid attribute |
| `E004` | Duplicate ID |
| `E005` | Invalid nesting |
| `E006` | Missing required attribute |
| `E007` | Unknown component |
| `W001` | Unused ID |
| `W002` | Deprecated syntax |

---

## 11. TypeScript Support

### 11.1 Type Imports

```typescript
import type {
    Document,
    Element,
    Layout,
    Section,
    Control,
    Component,
    Theme,
    ParseOptions,
    RenderOptions,
    ValidationError,
    SourceLocation
} from '@jonkeda/wireframe-core';
```

### 11.2 Generic Types

```typescript
// Type-safe element filtering
function getButtons(doc: Document): Control[] {
    return findAll(doc, (node): node is Control => 
        node.type === 'Control' && node.controlType === 'Button'
    );
}
```

---

## 12. Browser Usage

### 12.1 Script Tag

```html
<script src="https://cdn.jsdelivr.net/npm/@jonkeda/wireframe-core/dist/Wireframe.min.js"></script>
<script>
    const { parse, render } = Wireframe;
    
    const source = document.getElementById('Wireframe-source').textContent;
    const doc = parse(source);
    const svg = render(doc, { theme: 'clean' });
    
    document.getElementById('preview').innerHTML = svg;
</script>
```

### 12.2 ES Module

```html
<script type="module">
    import { parse, render } from 'https://cdn.jsdelivr.net/npm/@jonkeda/wireframe-core/dist/Wireframe.esm.js';
    
    const doc = parse(source);
    const svg = render(doc);
</script>
```

---

## 13. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [22_Parser_Specification](./22_Parser_Specification.md) | Parser details |
| [23_Renderer_Design](./23_Renderer_Design.md) | Renderer details |
| [25_Component_Library](./25_Component_Library.md) | Component specs |

---

*Wireframe API Reference v1.0 - 2025*
