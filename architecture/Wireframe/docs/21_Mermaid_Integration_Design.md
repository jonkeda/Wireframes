# Mermaid Integration Design

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document describes how Wireframe integrates with Mermaid.js as a new diagram type, enabling wireframe rendering in any Mermaid-enabled environment.

---

## 2. Mermaid Architecture Context

### 2.1 Mermaid Diagram Types

Mermaid supports multiple diagram types, each implementing a standard interface:

```
...................................................................
.                      Mermaid Core                                .
...................................................................
.                                                                  .
.  ............ ............ ............ ............           .
.  . Flowchart. . Sequence . .  Class   . .   ER     .  ...      .
.  . Diagram  . . Diagram  . . Diagram  . . Diagram  .           .
.  ............ ............ ............ ............           .
.                                                                  .
.  ............................................................   .
.  .                    Diagram Registry                       .   .
.  .  � detector: (text) => boolean                           .   .
.  .  � parser: DiagramParser                                  .   .
.  .  � renderer: DiagramRenderer                              .   .
.  .  � styles: StyleDefinition                                .   .
.  ............................................................   .
.                                                                  .
...................................................................
```

### 2.2 Registration Interface

```typescript
interface DiagramDefinition {
    id: string;
    detector: DiagramDetector;
    parser: DiagramParser;
    renderer: DiagramRenderer;
    styles.: string;
    init.: (config: MermaidConfig) => void;
}

type DiagramDetector = (text: string, config.: MermaidConfig) => boolean;
```

---

## 3. Wireframe Diagram Registration

### 3.1 Detector Implementation

```typescript
// src/detector.ts

const UIWIRE_PATTERN = /^\s*uiwire\s+(sketch|clean|blueprint|realistic)/i;

export const WireframeDetector: DiagramDetector = (text: string): boolean => {
    return UIWIRE_PATTERN.test(text);
};

// Alternative patterns for flexibility
const ALTERNATIVE_PATTERNS = [
    /^\s*uiwire\b/i,           // Just "uiwire" keyword
    /^\s*wireframe\b/i,         // Alias
    /^\s*ui\s*wire\b/i,         // Space variation
];
```

### 3.2 Registration Code

```typescript
// src/index.ts

import { mermaid } from 'mermaid';
import { WireframeDetector } from './detector';
import { WireframeParser } from './parser';
import { WireframeRenderer } from './renderer';
import { WireframeStyles } from './styles';

export function registerWireframeDiagram(): void {
    mermaid.registerDiagram('uiwire', {
        id: 'uiwire',
        detector: WireframeDetector,
        parser: new WireframeParser(),
        renderer: new WireframeRenderer(),
        styles: WireframeStyles,
        init: (config) => {
            // Initialize with Mermaid config
            WireframeConfig.merge(config.uiwire || {});
        }
    });
}

// Auto-register when module is imported
registerWireframeDiagram();
```

---

## 4. Parser Integration

### 4.1 Mermaid Parser Interface

```typescript
interface DiagramParser {
    parse(text: string): void;
    getAst(): DiagramAST;
    clear(): void;
}
```

### 4.2 Wireframe Parser Implementation

```typescript
// src/parser/mermaid-adapter.ts

import { Lexer } from './lexer';
import { Parser } from './parser';
import type { Document } from './ast';

export class WireframeParser implements DiagramParser {
    private ast: Document | null = null;
    private lexer: Lexer;
    private parser: Parser;

    constructor() {
        this.lexer = new Lexer();
        this.parser = new Parser();
    }

    parse(text: string): void {
        // Remove mermaid code fence if present
        const cleanText = this.extractWireframeContent(text);
        
        // Tokenize
        const tokens = this.lexer.tokenize(cleanText);
        
        // Parse to AST
        this.ast = this.parser.parse(tokens);
        
        // Validate
        this.validate();
    }

    getAst(): Document {
        if (!this.ast) {
            throw new Error('No document parsed');
        }
        return this.ast;
    }

    clear(): void {
        this.ast = null;
        this.lexer.reset();
        this.parser.reset();
    }

    private extractWireframeContent(text: string): string {
        // Handle ```Wireframe code fences
        const fenceMatch = text.match(/```Wireframe\n([\s\S]*.)```/);
        if (fenceMatch) {
            return fenceMatch[1];
        }
        return text;
    }

    private validate(): void {
        if (!this.ast) return;
        
        const errors = validateDocument(this.ast);
        if (errors.length > 0) {
            throw new WireframeParseError(errors);
        }
    }
}
```

---

## 5. Renderer Integration

### 5.1 Mermaid Renderer Interface

```typescript
interface DiagramRenderer {
    draw(text: string, id: string, version: string): Promise<void>;
    getClasses.(): Record<string, string>;
}
```

### 5.2 Wireframe Renderer Implementation

```typescript
// src/renderer/mermaid-adapter.ts

import { select } from 'd3-selection';
import { WireframeParser } from '../parser';
import { SvgRenderer } from './svg-renderer';
import { LayoutEngine } from '../layout';
import { ThemeManager } from '../themes';

export class WireframeRenderer implements DiagramRenderer {
    private parser: WireframeParser;
    private layoutEngine: LayoutEngine;
    private svgRenderer: SvgRenderer;
    private themeManager: ThemeManager;

    constructor() {
        this.parser = new WireframeParser();
        this.layoutEngine = new LayoutEngine();
        this.svgRenderer = new SvgRenderer();
        this.themeManager = new ThemeManager();
    }

    async draw(text: string, id: string, version: string): Promise<void> {
        // Parse document
        this.parser.parse(text);
        const ast = this.parser.getAst();

        // Get container
        const container = select(`#${id}`);
        if (container.empty()) {
            throw new Error(`Container #${id} not found`);
        }

        // Load theme
        const theme = this.themeManager.getTheme(ast.style);

        // Calculate layout
        const layout = this.layoutEngine.calculate(ast, {
            width: this.getContainerWidth(container),
            theme
        });

        // Render SVG
        const svg = this.svgRenderer.render(layout, theme);

        // Insert into container
        container.html(svg);

        // Apply theme styles
        this.applyStyles(container, theme);
    }

    getClasses(): Record<string, string> {
        return {
            'Wireframe-container': 'Wireframe-container',
            'Wireframe-button': 'Wireframe-button',
            'Wireframe-input': 'Wireframe-input',
            'Wireframe-label': 'Wireframe-label',
            // ... more classes
        };
    }

    private getContainerWidth(container: d3.Selection<any, any, any, any>): number {
        const node = container.node();
        if (node && 'getBoundingClientRect' in node) {
            return node.getBoundingClientRect().width || 800;
        }
        return 800;
    }

    private applyStyles(container: d3.Selection<any, any, any, any>, theme: Theme): void {
        container.selectAll('*')
            .style('font-family', theme.fontFamily);
    }
}
```

---

## 6. Styles Integration

### 6.1 CSS Style Definitions

```typescript
// src/styles/index.ts

export const WireframeStyles = `
    /* Base styles */
    .wire-container {
        font-family: var(--Wireframe-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        font-size: var(--Wireframe-font-size, 14px);
    }

    /* Button styles */
    .wire-button {
        fill: var(--Wireframe-button-bg, #f0f0f0);
        stroke: var(--Wireframe-button-border, #ccc);
        stroke-width: 1;
        rx: var(--Wireframe-border-radius, 4);
    }

    .wire-button.primary {
        fill: var(--Wireframe-primary-bg, #0066cc);
        stroke: var(--Wireframe-primary-border, #0055aa);
    }

    .wire-button text {
        fill: var(--Wireframe-button-text, #333);
    }

    .wire-button.primary text {
        fill: var(--Wireframe-primary-text, #fff);
    }

    /* Input styles */
    .wire-input {
        fill: var(--Wireframe-input-bg, #fff);
        stroke: var(--Wireframe-input-border, #ccc);
        stroke-width: 1;
        rx: var(--Wireframe-border-radius, 4);
    }

    .wire-input.required::after {
        content: '*';
        fill: var(--Wireframe-required-color, #cc0000);
    }

    /* Label styles */
    .wire-label {
        fill: var(--Wireframe-text-color, #333);
    }

    .wire-label.bold {
        font-weight: bold;
    }

    /* Card styles */
    .wire-card {
        fill: var(--Wireframe-card-bg, #fff);
        stroke: var(--Wireframe-card-border, #e0e0e0);
        stroke-width: 1;
        rx: var(--Wireframe-card-radius, 8);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    /* Theme: Sketch */
    .wire-theme-sketch .wire-button,
    .wire-theme-sketch .wire-input,
    .wire-theme-sketch .wire-card {
        stroke-dasharray: 5, 3;
        stroke-linecap: round;
    }

    /* Theme: Blueprint */
    .wire-theme-blueprint {
        background: #1a365d;
    }

    .wire-theme-blueprint .wire-button,
    .wire-theme-blueprint .wire-input,
    .wire-theme-blueprint .wire-card {
        fill: transparent;
        stroke: #fff;
    }

    .wire-theme-blueprint text {
        fill: #fff;
    }
`;
```

---

## 7. Configuration

### 7.1 Mermaid Configuration Extension

```typescript
// src/config.ts

interface WireframeConfig {
    // Rendering
    theme: 'sketch' | 'clean' | 'blueprint' | 'realistic';
    width: number | 'auto';
    padding: number;
    
    // Typography
    fontFamily: string;
    fontSize: number;
    
    // Colors
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    
    // Components
    buttonRadius: number;
    inputHeight: number;
    cardShadow: boolean;
    
    // Behavior
    interactive: boolean;
    showIds: boolean;
    showBindings: boolean;
}

const defaultConfig: WireframeConfig = {
    theme: 'clean',
    width: 'auto',
    padding: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: 14,
    primaryColor: '#0066cc',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#cccccc',
    buttonRadius: 4,
    inputHeight: 36,
    cardShadow: true,
    interactive: false,
    showIds: false,
    showBindings: false
};
```

### 7.2 Usage in Mermaid Configuration

```javascript
// User configuration
mermaid.initialize({
    startOnLoad: true,
    theme: 'default',
    
    // Wireframe specific config
    uiwire: {
        theme: 'sketch',
        primaryColor: '#007bff',
        fontFamily: 'Comic Sans MS',
        showIds: true
    }
});
```

---

## 8. Markdown Integration

### 8.1 Code Fence Detection

````markdown
```Wireframe
uiwire sketch
    %title: Login Form
    
    Vertical gap=12
        Label "**Login**"
        TextInput "Username" :txtUser required
        PasswordInput "Password" :txtPass required
        Button "Login" primary
    /Vertical
/uiwire
```
````

### 8.2 Inline Diagram Syntax

```markdown
:::uiwire
uiwire clean
    Button "Click Me"
/uiwire
:::
```

---

## 9. Error Handling

### 9.1 Parse Errors

```typescript
// src/errors.ts

export class WireframeParseError extends Error {
    constructor(
        public errors: ParseError[],
        message.: string
    ) {
        super(message || `Wireframe parse error: ${errors.length} error(s)`);
        this.name = 'WireframeParseError';
    }
}

interface ParseError {
    message: string;
    line: number;
    column: number;
    severity: 'error' | 'warning';
    code: string;
}
```

### 9.2 Error Display

```typescript
// src/renderer/error-renderer.ts

export function renderError(error: WireframeParseError, containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const errorHtml = `
        <div class="Wireframe-error">
            <div class="Wireframe-error-title">Wireframe Parse Error</div>
            ${error.errors.map(e => `
                <div class="Wireframe-error-item">
                    <span class="Wireframe-error-location">Line ${e.line}:${e.column}</span>
                    <span class="Wireframe-error-message">${e.message}</span>
                </div>
            `).join('')}
        </div>
    `;

    container.innerHTML = errorHtml;
}
```

---

## 10. Build and Distribution

### 10.1 Package Structure

```
@aspect-ui/wireframe-mermaid-plugin/
... dist/
.   ... Wireframe-mermaid.esm.js      # ES Module
.   ... Wireframe-mermaid.umd.js      # UMD (browser global)
.   ... Wireframe-mermaid.min.js      # Minified UMD
.   ... types/                     # TypeScript declarations
... src/
.   ... index.ts
.   ... detector.ts
.   ... parser/
.   ... renderer/
.   ... styles/
... package.json
... README.md
```

### 10.2 Package.json

```json
{
    "name": "@aspect-ui/wireframe-mermaid-plugin",
    "version": "1.0.0",
    "description": "Wireframe wireframe diagram plugin for Mermaid.js",
    "main": "dist/Wireframe-mermaid.umd.js",
    "module": "dist/Wireframe-mermaid.esm.js",
    "types": "dist/types/index.d.ts",
    "exports": {
        ".": {
            "import": "./dist/Wireframe-mermaid.esm.js",
            "require": "./dist/Wireframe-mermaid.umd.js",
            "types": "./dist/types/index.d.ts"
        }
    },
    "peerDependencies": {
        "mermaid": ">=10.0.0"
    },
    "keywords": ["mermaid", "diagram", "wireframe", "Wireframe", "ui"]
}
```

### 10.3 Usage Examples

**NPM Installation:**
```bash
npm install @aspect-ui/wireframe-mermaid-plugin
```

**ES Module:**
```javascript
import mermaid from 'mermaid';
import '@aspect-ui/wireframe-mermaid-plugin';

mermaid.initialize({ startOnLoad: true });
```

**Script Tag:**
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@aspect-ui/wireframe-mermaid-plugin/dist/Wireframe-mermaid.min.js"></script>
<script>
    mermaid.initialize({ startOnLoad: true });
</script>
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// tests/detector.test.ts

describe('Wireframe Detector', () => {
    it('should detect uiwire sketch', () => {
        expect(WireframeDetector('uiwire sketch\n...')).toBe(true);
    });

    it('should detect uiwire clean', () => {
        expect(WireframeDetector('uiwire clean\n...')).toBe(true);
    });

    it('should not detect other diagrams', () => {
        expect(WireframeDetector('flowchart LR\n...')).toBe(false);
        expect(WireframeDetector('sequenceDiagram\n...')).toBe(false);
    });

    it('should handle whitespace', () => {
        expect(WireframeDetector('  uiwire sketch\n...')).toBe(true);
        expect(WireframeDetector('\n\nuiwire clean\n...')).toBe(true);
    });
});
```

### 11.2 Integration Tests

```typescript
// tests/mermaid-integration.test.ts

describe('Mermaid Integration', () => {
    beforeEach(() => {
        document.body.innerHTML = '<div id="test-container"></div>';
    });

    it('should render Wireframe in Mermaid', async () => {
        const container = document.getElementById('test-container');
        container.innerHTML = `
            <pre class="mermaid">
                uiwire clean
                    Button "Click Me"
                /uiwire
            </pre>
        `;

        await mermaid.run();

        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
        expect(svg.querySelector('.wire-button')).toBeTruthy();
    });
});
```

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [22_Parser_Specification](./22_Parser_Specification.md) | Parser details |
| [23_Renderer_Design](./23_Renderer_Design.md) | Renderer details |
| [26_Theming_System](./26_Theming_System.md) | Theme implementation |

---

*Mermaid Integration Design v1.0 - 2025*
