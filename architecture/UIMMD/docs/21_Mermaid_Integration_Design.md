# Mermaid Integration Design

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document describes how UIMMD integrates with Mermaid.js as a new diagram type, enabling wireframe rendering in any Mermaid-enabled environment.

---

## 2. Mermaid Architecture Context

### 2.1 Mermaid Diagram Types

Mermaid supports multiple diagram types, each implementing a standard interface:

```
???????????????????????????????????????????????????????????????????
?                      Mermaid Core                                ?
???????????????????????????????????????????????????????????????????
?                                                                  ?
?  ???????????? ???????????? ???????????? ????????????           ?
?  ? Flowchart? ? Sequence ? ?  Class   ? ?   ER     ?  ...      ?
?  ? Diagram  ? ? Diagram  ? ? Diagram  ? ? Diagram  ?           ?
?  ???????????? ???????????? ???????????? ????????????           ?
?                                                                  ?
?  ????????????????????????????????????????????????????????????   ?
?  ?                    Diagram Registry                       ?   ?
?  ?  • detector: (text) => boolean                           ?   ?
?  ?  • parser: DiagramParser                                  ?   ?
?  ?  • renderer: DiagramRenderer                              ?   ?
?  ?  • styles: StyleDefinition                                ?   ?
?  ????????????????????????????????????????????????????????????   ?
?                                                                  ?
???????????????????????????????????????????????????????????????????
```

### 2.2 Registration Interface

```typescript
interface DiagramDefinition {
    id: string;
    detector: DiagramDetector;
    parser: DiagramParser;
    renderer: DiagramRenderer;
    styles?: string;
    init?: (config: MermaidConfig) => void;
}

type DiagramDetector = (text: string, config?: MermaidConfig) => boolean;
```

---

## 3. UIMMD Diagram Registration

### 3.1 Detector Implementation

```typescript
// src/detector.ts

const UIWIRE_PATTERN = /^\s*uiwire\s+(sketch|clean|blueprint|realistic)/i;

export const uimmdDetector: DiagramDetector = (text: string): boolean => {
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
import { uimmdDetector } from './detector';
import { UimmdParser } from './parser';
import { UimmdRenderer } from './renderer';
import { uimmdStyles } from './styles';

export function registerUimmdDiagram(): void {
    mermaid.registerDiagram('uiwire', {
        id: 'uiwire',
        detector: uimmdDetector,
        parser: new UimmdParser(),
        renderer: new UimmdRenderer(),
        styles: uimmdStyles,
        init: (config) => {
            // Initialize with Mermaid config
            UimmdConfig.merge(config.uiwire || {});
        }
    });
}

// Auto-register when module is imported
registerUimmdDiagram();
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

### 4.2 UIMMD Parser Implementation

```typescript
// src/parser/mermaid-adapter.ts

import { Lexer } from './lexer';
import { Parser } from './parser';
import type { Document } from './ast';

export class UimmdParser implements DiagramParser {
    private ast: Document | null = null;
    private lexer: Lexer;
    private parser: Parser;

    constructor() {
        this.lexer = new Lexer();
        this.parser = new Parser();
    }

    parse(text: string): void {
        // Remove mermaid code fence if present
        const cleanText = this.extractUimmdContent(text);
        
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

    private extractUimmdContent(text: string): string {
        // Handle ```uimmd code fences
        const fenceMatch = text.match(/```uimmd\n([\s\S]*?)```/);
        if (fenceMatch) {
            return fenceMatch[1];
        }
        return text;
    }

    private validate(): void {
        if (!this.ast) return;
        
        const errors = validateDocument(this.ast);
        if (errors.length > 0) {
            throw new UimmdParseError(errors);
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
    getClasses?(): Record<string, string>;
}
```

### 5.2 UIMMD Renderer Implementation

```typescript
// src/renderer/mermaid-adapter.ts

import { select } from 'd3-selection';
import { UimmdParser } from '../parser';
import { SvgRenderer } from './svg-renderer';
import { LayoutEngine } from '../layout';
import { ThemeManager } from '../themes';

export class UimmdRenderer implements DiagramRenderer {
    private parser: UimmdParser;
    private layoutEngine: LayoutEngine;
    private svgRenderer: SvgRenderer;
    private themeManager: ThemeManager;

    constructor() {
        this.parser = new UimmdParser();
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
            'uimmd-container': 'uimmd-container',
            'uimmd-button': 'uimmd-button',
            'uimmd-input': 'uimmd-input',
            'uimmd-label': 'uimmd-label',
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

export const uimmdStyles = `
    /* Base styles */
    .uimmd-container {
        font-family: var(--uimmd-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
        font-size: var(--uimmd-font-size, 14px);
    }

    /* Button styles */
    .uimmd-button {
        fill: var(--uimmd-button-bg, #f0f0f0);
        stroke: var(--uimmd-button-border, #ccc);
        stroke-width: 1;
        rx: var(--uimmd-border-radius, 4);
    }

    .uimmd-button.primary {
        fill: var(--uimmd-primary-bg, #0066cc);
        stroke: var(--uimmd-primary-border, #0055aa);
    }

    .uimmd-button text {
        fill: var(--uimmd-button-text, #333);
    }

    .uimmd-button.primary text {
        fill: var(--uimmd-primary-text, #fff);
    }

    /* Input styles */
    .uimmd-input {
        fill: var(--uimmd-input-bg, #fff);
        stroke: var(--uimmd-input-border, #ccc);
        stroke-width: 1;
        rx: var(--uimmd-border-radius, 4);
    }

    .uimmd-input.required::after {
        content: '*';
        fill: var(--uimmd-required-color, #cc0000);
    }

    /* Label styles */
    .uimmd-label {
        fill: var(--uimmd-text-color, #333);
    }

    .uimmd-label.bold {
        font-weight: bold;
    }

    /* Card styles */
    .uimmd-card {
        fill: var(--uimmd-card-bg, #fff);
        stroke: var(--uimmd-card-border, #e0e0e0);
        stroke-width: 1;
        rx: var(--uimmd-card-radius, 8);
        filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    /* Theme: Sketch */
    .uimmd-theme-sketch .uimmd-button,
    .uimmd-theme-sketch .uimmd-input,
    .uimmd-theme-sketch .uimmd-card {
        stroke-dasharray: 5, 3;
        stroke-linecap: round;
    }

    /* Theme: Blueprint */
    .uimmd-theme-blueprint {
        background: #1a365d;
    }

    .uimmd-theme-blueprint .uimmd-button,
    .uimmd-theme-blueprint .uimmd-input,
    .uimmd-theme-blueprint .uimmd-card {
        fill: transparent;
        stroke: #fff;
    }

    .uimmd-theme-blueprint text {
        fill: #fff;
    }
`;
```

---

## 7. Configuration

### 7.1 Mermaid Configuration Extension

```typescript
// src/config.ts

interface UimmdConfig {
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

const defaultConfig: UimmdConfig = {
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
    
    // UIMMD specific config
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
```uimmd
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

export class UimmdParseError extends Error {
    constructor(
        public errors: ParseError[],
        message?: string
    ) {
        super(message || `UIMMD parse error: ${errors.length} error(s)`);
        this.name = 'UimmdParseError';
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

export function renderError(error: UimmdParseError, containerId: string): void {
    const container = document.getElementById(containerId);
    if (!container) return;

    const errorHtml = `
        <div class="uimmd-error">
            <div class="uimmd-error-title">UIMMD Parse Error</div>
            ${error.errors.map(e => `
                <div class="uimmd-error-item">
                    <span class="uimmd-error-location">Line ${e.line}:${e.column}</span>
                    <span class="uimmd-error-message">${e.message}</span>
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
@uimmd/mermaid-plugin/
??? dist/
?   ??? uimmd-mermaid.esm.js      # ES Module
?   ??? uimmd-mermaid.umd.js      # UMD (browser global)
?   ??? uimmd-mermaid.min.js      # Minified UMD
?   ??? types/                     # TypeScript declarations
??? src/
?   ??? index.ts
?   ??? detector.ts
?   ??? parser/
?   ??? renderer/
?   ??? styles/
??? package.json
??? README.md
```

### 10.2 Package.json

```json
{
    "name": "@uimmd/mermaid-plugin",
    "version": "1.0.0",
    "description": "UIMMD wireframe diagram plugin for Mermaid.js",
    "main": "dist/uimmd-mermaid.umd.js",
    "module": "dist/uimmd-mermaid.esm.js",
    "types": "dist/types/index.d.ts",
    "exports": {
        ".": {
            "import": "./dist/uimmd-mermaid.esm.js",
            "require": "./dist/uimmd-mermaid.umd.js",
            "types": "./dist/types/index.d.ts"
        }
    },
    "peerDependencies": {
        "mermaid": ">=10.0.0"
    },
    "keywords": ["mermaid", "diagram", "wireframe", "uimmd", "ui"]
}
```

### 10.3 Usage Examples

**NPM Installation:**
```bash
npm install @uimmd/mermaid-plugin
```

**ES Module:**
```javascript
import mermaid from 'mermaid';
import '@uimmd/mermaid-plugin';

mermaid.initialize({ startOnLoad: true });
```

**Script Tag:**
```html
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@uimmd/mermaid-plugin/dist/uimmd-mermaid.min.js"></script>
<script>
    mermaid.initialize({ startOnLoad: true });
</script>
```

---

## 11. Testing Strategy

### 11.1 Unit Tests

```typescript
// tests/detector.test.ts

describe('UIMMD Detector', () => {
    it('should detect uiwire sketch', () => {
        expect(uimmdDetector('uiwire sketch\n...')).toBe(true);
    });

    it('should detect uiwire clean', () => {
        expect(uimmdDetector('uiwire clean\n...')).toBe(true);
    });

    it('should not detect other diagrams', () => {
        expect(uimmdDetector('flowchart LR\n...')).toBe(false);
        expect(uimmdDetector('sequenceDiagram\n...')).toBe(false);
    });

    it('should handle whitespace', () => {
        expect(uimmdDetector('  uiwire sketch\n...')).toBe(true);
        expect(uimmdDetector('\n\nuiwire clean\n...')).toBe(true);
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

    it('should render UIMMD in Mermaid', async () => {
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
        expect(svg.querySelector('.uimmd-button')).toBeTruthy();
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
