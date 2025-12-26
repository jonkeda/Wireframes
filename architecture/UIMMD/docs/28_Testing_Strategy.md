# UIMMD Testing Strategy

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document describes the testing strategy for the UIMMD project, covering unit tests, integration tests, visual regression tests, and end-to-end tests.

---

## 2. Testing Philosophy

### 2.1 Goals

- **Correctness:** Ensure parser and renderer produce correct output
- **Stability:** Prevent regressions in existing functionality
- **Performance:** Track and maintain performance benchmarks
- **Compatibility:** Verify cross-browser and cross-platform support

### 2.2 Testing Pyramid

```
                    ?????????????
                    ?   E2E     ?  Few, slow, high confidence
                    ?   Tests   ?
                   ???????????????
                  ?????????????????
                  ?  Integration  ?  Some, moderate speed
                  ?    Tests      ?
                 ???????????????????
                ?????????????????????
                ?    Unit Tests     ?  Many, fast, isolated
                ?????????????????????
```

### 2.3 Coverage Targets

| Package | Line Coverage | Branch Coverage |
|---------|--------------|-----------------|
| @uimmd/core | 90% | 85% |
| @uimmd/mermaid-plugin | 80% | 75% |
| @uimmd/themes | 80% | 75% |
| @uimmd/vscode-extension | 70% | 65% |

---

## 3. Testing Stack

### 3.1 Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit and integration testing |
| **Playwright** | E2E and browser testing |
| **Storybook** | Component visual testing |
| **Percy** | Visual regression testing |
| **c8** | Code coverage |
| **Benchmark.js** | Performance benchmarks |

### 3.2 Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['tests/**/*.test.ts'],
        coverage: {
            provider: 'c8',
            reporter: ['text', 'lcov', 'html'],
            exclude: ['node_modules', 'tests', 'dist']
        },
        setupFiles: ['./tests/setup.ts']
    }
});
```

---

## 4. Unit Tests

### 4.1 Lexer Tests

```typescript
// tests/lexer/lexer.test.ts

import { describe, it, expect } from 'vitest';
import { Lexer, TokenType } from '../../src/lexer';

describe('Lexer', () => {
    const lexer = new Lexer();

    describe('tokenize', () => {
        it('should tokenize document start', () => {
            const tokens = lexer.tokenize('uiwire clean');
            
            expect(tokens[0]).toMatchObject({
                type: TokenType.DOCUMENT_START,
                value: 'uiwire'
            });
            expect(tokens[1]).toMatchObject({
                type: TokenType.ATTRIBUTE_NAME,
                value: 'clean'
            });
        });

        it('should tokenize keywords', () => {
            const tokens = lexer.tokenize('Button "Click"');
            
            expect(tokens[0]).toMatchObject({
                type: TokenType.KEYWORD,
                value: 'Button'
            });
            expect(tokens[1]).toMatchObject({
                type: TokenType.STRING,
                value: 'Click'
            });
        });

        it('should tokenize identifiers', () => {
            const tokens = lexer.tokenize(':btnSubmit ?user.name @Dashboard $save');
            
            expect(tokens[0].type).toBe(TokenType.ID);
            expect(tokens[1].type).toBe(TokenType.BINDING);
            expect(tokens[2].type).toBe(TokenType.NAVIGATION);
            expect(tokens[3].type).toBe(TokenType.ICON);
        });

        it('should handle indentation', () => {
            const tokens = lexer.tokenize(`
Vertical
    Button "A"
    Button "B"
/Vertical
            `.trim());
            
            const indentToken = tokens.find(t => t.type === TokenType.INDENT);
            const dedentToken = tokens.find(t => t.type === TokenType.DEDENT);
            
            expect(indentToken).toBeDefined();
            expect(dedentToken).toBeDefined();
        });

        it('should skip comments', () => {
            const tokens = lexer.tokenize(`
// This is a comment
Button "Click"
/* Multi-line
   comment */
            `.trim());
            
            const buttonToken = tokens.find(t => t.value === 'Button');
            expect(buttonToken).toBeDefined();
        });
    });

    describe('error handling', () => {
        it('should report location for invalid tokens', () => {
            const tokens = lexer.tokenize('Button @@@');
            const errorToken = tokens.find(t => t.type === TokenType.ERROR);
            
            expect(errorToken).toBeDefined();
            expect(errorToken?.line).toBeGreaterThan(0);
        });
    });
});
```

### 4.2 Parser Tests

```typescript
// tests/parser/parser.test.ts

import { describe, it, expect } from 'vitest';
import { parse } from '../../src/parser';

describe('Parser', () => {
    describe('document parsing', () => {
        it('should parse minimal document', () => {
            const ast = parse(`
uiwire clean
    Button "Click"
/uiwire
            `);
            
            expect(ast.type).toBe('Document');
            expect(ast.style).toBe('clean');
            expect(ast.body).toHaveLength(1);
        });

        it('should parse metadata', () => {
            const ast = parse(`
uiwire sketch
    %title: Test Form
    %version: 1.0
    %author: Tester
    
    Label "Hello"
/uiwire
            `);
            
            expect(ast.metadata).toHaveLength(3);
            expect(ast.metadata[0]).toMatchObject({
                name: 'title',
                value: 'Test Form'
            });
        });

        it('should parse all styles', () => {
            const styles = ['sketch', 'clean', 'blueprint', 'realistic'];
            
            for (const style of styles) {
                const ast = parse(`uiwire ${style}\n    Label "Test"\n/uiwire`);
                expect(ast.style).toBe(style);
            }
        });
    });

    describe('control parsing', () => {
        it('should parse Button', () => {
            const ast = parse(`
uiwire clean
    Button "Submit" :btnSubmit primary @Dashboard tooltip="Save changes"
/uiwire
            `);
            
            const button = ast.body[0];
            expect(button.type).toBe('Control');
            expect(button.controlType).toBe('Button');
            expect(button.text).toBe('Submit');
            expect(button.id).toBe('btnSubmit');
            expect(button.modifiers).toContain('primary');
            expect(button.navigation).toMatchObject({ target: 'Dashboard', type: 'page' });
            expect(button.attributes.tooltip).toBe('Save changes');
        });

        it('should parse IconButton', () => {
            const ast = parse(`
uiwire clean
    IconButton $save "Save" :btnSave primary
/uiwire
            `);
            
            const button = ast.body[0];
            expect(button.controlType).toBe('IconButton');
            expect(button.icon).toBe('save');
            expect(button.text).toBe('Save');
        });

        it('should parse TextInput', () => {
            const ast = parse(`
uiwire clean
    TextInput "Enter name" :txtName required ?user.name min=3 max=50
/uiwire
            `);
            
            const input = ast.body[0];
            expect(input.controlType).toBe('TextInput');
            expect(input.text).toBe('Enter name');
            expect(input.id).toBe('txtName');
            expect(input.modifiers).toContain('required');
            expect(input.binding).toBe('user.name');
            expect(input.attributes.min).toBe(3);
            expect(input.attributes.max).toBe(50);
        });

        it('should parse Dropdown with Options', () => {
            const ast = parse(`
uiwire clean
    Dropdown :ddlCountry ?user.country
        Option "Select..."
        Option "USA"
        Option "Canada"
    /Dropdown
/uiwire
            `);
            
            const dropdown = ast.body[0];
            expect(dropdown.controlType).toBe('Dropdown');
            expect(dropdown.children).toHaveLength(3);
            expect(dropdown.children[1].text).toBe('USA');
        });
    });

    describe('layout parsing', () => {
        it('should parse Vertical layout', () => {
            const ast = parse(`
uiwire clean
    Vertical gap=12 align=center
        Button "One"
        Button "Two"
    /Vertical
/uiwire
            `);
            
            const layout = ast.body[0];
            expect(layout.type).toBe('Layout');
            expect(layout.layoutType).toBe('Vertical');
            expect(layout.attributes.gap).toBe(12);
            expect(layout.attributes.align).toBe('center');
            expect(layout.children).toHaveLength(2);
        });

        it('should parse nested layouts', () => {
            const ast = parse(`
uiwire clean
    Vertical gap=8
        Horizontal gap=4
            Button "A"
            Button "B"
        /Horizontal
        Button "C"
    /Vertical
/uiwire
            `);
            
            const vertical = ast.body[0];
            expect(vertical.children).toHaveLength(2);
            expect(vertical.children[0].layoutType).toBe('Horizontal');
            expect(vertical.children[0].children).toHaveLength(2);
        });

        it('should parse Grid layout', () => {
            const ast = parse(`
uiwire clean
    Grid cols=2 rows=2 gap=16
        Label "A" grid=0,0
        Label "B" grid=0,1
        Label "C" grid=1,0
        Label "D" grid=1,1
    /Grid
/uiwire
            `);
            
            const grid = ast.body[0];
            expect(grid.layoutType).toBe('Grid');
            expect(grid.attributes.cols).toBe(2);
            expect(grid.children).toHaveLength(4);
        });
    });

    describe('error handling', () => {
        it('should throw on unclosed block', () => {
            expect(() => parse(`
uiwire clean
    Vertical
        Button "Test"
/uiwire
            `)).toThrow(/unclosed/i);
        });

        it('should report line number on error', () => {
            try {
                parse(`
uiwire clean
    Button
/uiwire
                `);
            } catch (error) {
                expect(error.location.line).toBe(3);
            }
        });
    });
});
```

### 4.3 Renderer Tests

```typescript
// tests/renderer/renderer.test.ts

import { describe, it, expect } from 'vitest';
import { parse, render } from '../../src';

describe('Renderer', () => {
    describe('SVG output', () => {
        it('should produce valid SVG', () => {
            const ast = parse(`
uiwire clean
    Button "Click"
/uiwire
            `);
            const svg = render(ast);
            
            expect(svg).toContain('<svg');
            expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
            expect(svg).toContain('</svg>');
        });

        it('should include theme class', () => {
            const ast = parse(`uiwire sketch\n    Label "Test"\n/uiwire`);
            const svg = render(ast);
            
            expect(svg).toContain('uimmd-theme-sketch');
        });
    });

    describe('Button rendering', () => {
        it('should render Button element', () => {
            const ast = parse(`
uiwire clean
    Button "Submit"
/uiwire
            `);
            const svg = render(ast);
            
            expect(svg).toContain('class="uimmd-button"');
            expect(svg).toContain('Submit');
        });

        it('should render primary Button', () => {
            const ast = parse(`
uiwire clean
    Button "Save" primary
/uiwire
            `);
            const svg = render(ast);
            
            expect(svg).toContain('primary');
        });

        it('should include data-id attribute', () => {
            const ast = parse(`
uiwire clean
    Button "Test" :btnTest
/uiwire
            `);
            const svg = render(ast);
            
            expect(svg).toContain('data-id="btnTest"');
        });
    });

    describe('Layout rendering', () => {
        it('should calculate Vertical layout positions', () => {
            const ast = parse(`
uiwire clean
    Vertical gap=10
        Button "A"
        Button "B"
    /Vertical
/uiwire
            `);
            const svg = render(ast, { width: 200 });
            
            // Second button should be offset by height + gap
            expect(svg).toMatch(/translate\(\d+,\s*46\)/); // 36 height + 10 gap
        });

        it('should calculate Horizontal layout positions', () => {
            const ast = parse(`
uiwire clean
    Horizontal gap=8
        Button "A"
        Button "B"
    /Horizontal
/uiwire
            `);
            const svg = render(ast, { width: 400 });
            
            // Second button should be offset horizontally
            expect(svg).toMatch(/translate\(1\d+,/); // Second button x position
        });
    });
});
```

### 4.4 Theme Tests

```typescript
// tests/themes/themes.test.ts

import { describe, it, expect } from 'vitest';
import { getTheme, registerTheme } from '../../src/themes';

describe('Theme Manager', () => {
    describe('getTheme', () => {
        it('should return all built-in themes', () => {
            const themes = ['sketch', 'clean', 'blueprint', 'realistic'];
            
            for (const name of themes) {
                const theme = getTheme(name);
                expect(theme.name).toBe(name);
            }
        });

        it('should return clean for unknown theme', () => {
            const theme = getTheme('unknown' as any);
            expect(theme.name).toBe('clean');
        });
    });

    describe('theme properties', () => {
        it('should have required color properties', () => {
            const theme = getTheme('clean');
            
            expect(theme.backgroundColor).toBeDefined();
            expect(theme.textColor).toBeDefined();
            expect(theme.primaryColor).toBeDefined();
            expect(theme.borderColor).toBeDefined();
        });

        it('should have valid color values', () => {
            const theme = getTheme('clean');
            const hexPattern = /^#[0-9a-fA-F]{6}$/;
            
            expect(theme.backgroundColor).toMatch(hexPattern);
            expect(theme.textColor).toMatch(hexPattern);
        });
    });

    describe('registerTheme', () => {
        it('should register custom theme', () => {
            const customTheme = {
                ...getTheme('clean'),
                name: 'custom',
                primaryColor: '#ff0000'
            };
            
            registerTheme(customTheme);
            
            const retrieved = getTheme('custom');
            expect(retrieved.primaryColor).toBe('#ff0000');
        });
    });

    describe('accessibility', () => {
        it('should meet contrast requirements', () => {
            const theme = getTheme('clean');
            const contrast = calculateContrast(theme.textColor, theme.backgroundColor);
            
            expect(contrast).toBeGreaterThanOrEqual(4.5);
        });
    });
});
```

---

## 5. Integration Tests

### 5.1 Parse-Render Pipeline

```typescript
// tests/integration/pipeline.test.ts

import { describe, it, expect } from 'vitest';
import { parse, render, validate } from '../../src';

describe('Parse-Render Pipeline', () => {
    const examples = [
        {
            name: 'Simple Button',
            source: `
uiwire clean
    Button "Click Me"
/uiwire
            `
        },
        {
            name: 'Login Form',
            source: `
uiwire clean
    Card
        Vertical gap=12
            Label "**Login**"
            TextInput "Username" :txtUser required
            PasswordInput "Password" :txtPass required
            Button "Login" primary
        /Vertical
    /Card
/uiwire
            `
        },
        {
            name: 'Dashboard',
            source: `
uiwire sketch
    Dock
        Header dock=top h=60
            Label "Dashboard"
        /Header
        Sidebar dock=left w=200
            IconButton $home "Home"
            IconButton $settings "Settings"
        /Sidebar
        Content dock=fill
            Grid cols=2 gap=16
                Card
                    Label "Card 1"
                /Card
                Card
                    Label "Card 2"
                /Card
            /Grid
        /Content
    /Dock
/uiwire
            `
        }
    ];

    examples.forEach(({ name, source }) => {
        describe(name, () => {
            it('should parse without errors', () => {
                expect(() => parse(source)).not.toThrow();
            });

            it('should validate without errors', () => {
                const ast = parse(source);
                const errors = validate(ast);
                expect(errors.filter(e => e.severity === 'error')).toHaveLength(0);
            });

            it('should render valid SVG', () => {
                const ast = parse(source);
                const svg = render(ast);
                
                expect(svg).toContain('<svg');
                expect(svg).toContain('</svg>');
            });

            it('should render in all themes', () => {
                const ast = parse(source);
                const themes = ['sketch', 'clean', 'blueprint', 'realistic'];
                
                for (const theme of themes) {
                    expect(() => render(ast, { theme })).not.toThrow();
                }
            });
        });
    });
});
```

### 5.2 Mermaid Integration

```typescript
// tests/integration/mermaid.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import mermaid from 'mermaid';
import '../src/mermaid-plugin'; // Auto-registers

describe('Mermaid Integration', () => {
    beforeAll(() => {
        mermaid.initialize({ startOnLoad: false });
    });

    it('should detect UIMMD syntax', async () => {
        const isUimmd = await mermaid.detect('uiwire clean\n    Button "Test"\n/uiwire');
        expect(isUimmd).toBe('uiwire');
    });

    it('should render UIMMD diagram', async () => {
        const { svg } = await mermaid.render('test-diagram', `
uiwire clean
    Button "Mermaid Button"
/uiwire
        `);
        
        expect(svg).toContain('uimmd-button');
        expect(svg).toContain('Mermaid Button');
    });

    it('should apply Mermaid config', async () => {
        mermaid.initialize({
            startOnLoad: false,
            uiwire: {
                theme: 'sketch',
                primaryColor: '#ff0000'
            }
        });

        const { svg } = await mermaid.render('config-test', `
uiwire clean
    Button "Config Test" primary
/uiwire
        `);
        
        expect(svg).toContain('uimmd-theme-sketch');
    });
});
```

---

## 6. Visual Regression Tests

### 6.1 Snapshot Testing

```typescript
// tests/visual/snapshots.test.ts

import { describe, it, expect } from 'vitest';
import { parse, render } from '../../src';

describe('Visual Snapshots', () => {
    const components = [
        'Button "Click" primary',
        'TextInput "Placeholder" :txt required',
        'Checkbox "Option" checked',
        'Radio "Choice" selected',
        'Dropdown :ddl\n    Option "A"\n    Option "B"\n/Dropdown',
        'Progress value=75',
        'Avatar "JD"'
    ];

    components.forEach((component, i) => {
        it(`should match snapshot for component ${i + 1}`, () => {
            const ast = parse(`uiwire clean\n    ${component}\n/uiwire`);
            const svg = render(ast);
            
            expect(svg).toMatchSnapshot();
        });
    });

    const themes = ['sketch', 'clean', 'blueprint', 'realistic'];

    themes.forEach(theme => {
        it(`should match snapshot for ${theme} theme`, () => {
            const ast = parse(`
uiwire ${theme}
    Card
        Label "**${theme.toUpperCase()}**"
        Button "Primary" primary
        TextInput "Input"
    /Card
/uiwire
            `);
            const svg = render(ast);
            
            expect(svg).toMatchSnapshot();
        });
    });
});
```

### 6.2 Percy Visual Testing

```typescript
// tests/visual/percy.test.ts

import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Percy Visual Tests', () => {
    test('Component Gallery', async ({ page }) => {
        await page.goto('/test/gallery.html');
        await page.waitForSelector('.uimmd-container');
        
        await percySnapshot(page, 'Component Gallery');
    });

    test('Theme Comparison', async ({ page }) => {
        await page.goto('/test/themes.html');
        
        const themes = ['sketch', 'clean', 'blueprint', 'realistic'];
        for (const theme of themes) {
            await page.click(`[data-theme="${theme}"]`);
            await page.waitForSelector(`.uimmd-theme-${theme}`);
            await percySnapshot(page, `Theme: ${theme}`);
        }
    });

    test('Responsive Layout', async ({ page }) => {
        await page.goto('/test/responsive.html');
        
        const viewports = [
            { width: 375, height: 667, name: 'Mobile' },
            { width: 768, height: 1024, name: 'Tablet' },
            { width: 1440, height: 900, name: 'Desktop' }
        ];

        for (const vp of viewports) {
            await page.setViewportSize({ width: vp.width, height: vp.height });
            await percySnapshot(page, `Responsive: ${vp.name}`);
        }
    });
});
```

---

## 7. End-to-End Tests

### 7.1 VSCode Extension Tests

```typescript
// tests/e2e/vscode.test.ts

import { test, expect } from '@playwright/test';
import { VSCodePage } from './fixtures/vscode-page';

test.describe('VSCode Extension', () => {
    let vscode: VSCodePage;

    test.beforeEach(async ({ page }) => {
        vscode = new VSCodePage(page);
        await vscode.launch();
    });

    test('should highlight syntax', async () => {
        await vscode.openFile('test.uimmd');
        await vscode.typeText(`
uiwire clean
    Button "Test" primary
/uiwire
        `);

        const highlighted = await vscode.getHighlightedTokens();
        expect(highlighted).toContain('uiwire');
        expect(highlighted).toContain('Button');
    });

    test('should show preview', async () => {
        await vscode.openFile('test.uimmd');
        await vscode.typeText('uiwire clean\n    Button "Test"\n/uiwire');
        
        await vscode.executeCommand('uimmd.previewSide');
        
        const preview = await vscode.getPreviewContent();
        expect(preview).toContain('uimmd-button');
    });

    test('should provide completions', async () => {
        await vscode.openFile('test.uimmd');
        await vscode.typeText('uiwire clean\n    But');
        await vscode.triggerCompletion();
        
        const completions = await vscode.getCompletionItems();
        expect(completions).toContain('Button');
    });

    test('should show hover information', async () => {
        await vscode.openFile('test.uimmd');
        await vscode.typeText('uiwire clean\n    Button "Test"\n/uiwire');
        await vscode.hoverWord('Button');
        
        const hover = await vscode.getHoverContent();
        expect(hover).toContain('clickable button');
    });

    test('should report diagnostics', async () => {
        await vscode.openFile('test.uimmd');
        await vscode.typeText('uiwire clean\n    Button\n/uiwire');
        
        const diagnostics = await vscode.getDiagnostics();
        expect(diagnostics).toContainEqual(
            expect.objectContaining({ severity: 'error' })
        );
    });
});
```

### 7.2 Browser Tests

```typescript
// tests/e2e/browser.test.ts

import { test, expect } from '@playwright/test';

test.describe('Browser Rendering', () => {
    test('should render in Chrome', async ({ page }) => {
        await page.goto('/test/render.html');
        
        const svg = await page.locator('svg.uimmd-container');
        await expect(svg).toBeVisible();
    });

    test('should handle navigation clicks', async ({ page }) => {
        await page.goto('/test/interactive.html');
        
        const button = await page.locator('[data-navigation="Dashboard"]');
        await button.click();
        
        await expect(page).toHaveURL(/Dashboard/);
    });

    test('should update preview on source change', async ({ page }) => {
        await page.goto('/test/live-preview.html');
        
        const editor = page.locator('#source-editor');
        const preview = page.locator('#preview svg');
        
        await editor.fill('uiwire clean\n    Button "Updated"\n/uiwire');
        
        await expect(preview).toContainText('Updated');
    });
});
```

---

## 8. Performance Tests

### 8.1 Benchmark Suite

```typescript
// tests/performance/benchmarks.test.ts

import { describe, it, expect } from 'vitest';
import { parse, render } from '../../src';
import Benchmark from 'benchmark';

describe('Performance Benchmarks', () => {
    const simpleDoc = `
uiwire clean
    Button "Click"
/uiwire
    `;

    const complexDoc = `
uiwire clean
    Dock
        Header dock=top h=60
            Horizontal padding=16
                Label "**App**"
                Spacer
                IconButton $settings
            /Horizontal
        /Header
        Sidebar dock=left w=220
            Vertical gap=4
                ${Array(20).fill('IconButton $home "Menu Item"').join('\n                ')}
            /Vertical
        /Sidebar
        Content dock=fill
            Scroll
                Grid cols=3 gap=16
                    ${Array(50).fill('Card\n                        Label "Card"\n                        Button "Action"\n                    /Card').join('\n                    ')}
                /Grid
            /Scroll
        /Content
    /Dock
/uiwire
    `;

    it('should parse simple document < 5ms', () => {
        const start = performance.now();
        parse(simpleDoc);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(5);
    });

    it('should parse complex document < 50ms', () => {
        const start = performance.now();
        parse(complexDoc);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(50);
    });

    it('should render simple document < 20ms', () => {
        const ast = parse(simpleDoc);
        
        const start = performance.now();
        render(ast);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(20);
    });

    it('should render complex document < 200ms', () => {
        const ast = parse(complexDoc);
        
        const start = performance.now();
        render(ast);
        const duration = performance.now() - start;
        
        expect(duration).toBeLessThan(200);
    });
});
```

### 8.2 Memory Tests

```typescript
// tests/performance/memory.test.ts

import { describe, it, expect } from 'vitest';
import { parse, render } from '../../src';

describe('Memory Usage', () => {
    it('should not leak memory on repeated parsing', () => {
        const source = 'uiwire clean\n    Button "Test"\n/uiwire';
        
        // Force GC if available
        if (global.gc) global.gc();
        const initialHeap = process.memoryUsage().heapUsed;
        
        for (let i = 0; i < 1000; i++) {
            parse(source);
        }
        
        if (global.gc) global.gc();
        const finalHeap = process.memoryUsage().heapUsed;
        
        // Allow up to 10MB increase
        expect(finalHeap - initialHeap).toBeLessThan(10 * 1024 * 1024);
    });
});
```

---

## 9. Test Fixtures

### 9.1 Example Documents

```
tests/
??? fixtures/
    ??? documents/
    ?   ??? minimal.uimmd
    ?   ??? form-simple.uimmd
    ?   ??? form-complex.uimmd
    ?   ??? dashboard.uimmd
    ?   ??? data-grid.uimmd
    ?   ??? all-components.uimmd
    ??? expected/
    ?   ??? minimal.svg
    ?   ??? form-simple.svg
    ?   ??? ...
    ??? invalid/
        ??? unclosed-block.uimmd
        ??? duplicate-id.uimmd
        ??? invalid-syntax.uimmd
        ??? ...
```

### 9.2 Test Helpers

```typescript
// tests/helpers.ts

import * as fs from 'fs';
import * as path from 'path';

export function loadFixture(name: string): string {
    return fs.readFileSync(
        path.join(__dirname, 'fixtures/documents', name),
        'utf-8'
    );
}

export function loadExpected(name: string): string {
    return fs.readFileSync(
        path.join(__dirname, 'fixtures/expected', name),
        'utf-8'
    );
}

export function normalizeSvg(svg: string): string {
    return svg
        .replace(/\s+/g, ' ')
        .replace(/> </g, '><')
        .trim();
}

export function compareSvg(actual: string, expected: string): boolean {
    return normalizeSvg(actual) === normalizeSvg(expected);
}
```

---

## 10. CI/CD Integration

### 10.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      - run: pnpm install
      - run: pnpm test:integration

  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      - run: pnpm install
      - run: pnpm build
      
      - name: Percy Visual Testing
        run: pnpm test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      - run: pnpm install
      - run: npx playwright install --with-deps
      - run: pnpm test:e2e

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      
      - run: pnpm install
      - run: pnpm test:perf
```

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [22_Parser_Specification](./22_Parser_Specification.md) | Parser details |
| [23_Renderer_Design](./23_Renderer_Design.md) | Renderer details |
| [29_Implementation_Roadmap](./29_Implementation_Roadmap.md) | Implementation plan |

---

*UIMMD Testing Strategy v1.0 - 2025*
