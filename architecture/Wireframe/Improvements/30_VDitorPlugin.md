# Vditor Code Block Plugin System Design

## 1. Executive Summary

This document proposes adding a **code block renderer plugin system** to Vditor, enabling third-party languages like `wireframe` to be rendered without modifying Vditor's source code. Currently, Vditor hardcodes support for specific languages (mermaid, flowchart, echarts, etc.), making it impossible for external consumers to add custom renderers.

### Goals
1. Enable registration of custom code block renderers at runtime
2. Maintain backward compatibility with existing built-in renderers
3. Provide a clean, documented API for plugin authors
4. Allow the wireframe renderer to plug into Vditor seamlessly

---

## 2. Current Architecture Analysis

### 2.1 How Vditor Currently Renders Special Code Blocks

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Markdown Input                               │
│  ```mermaid                                                          │
│  graph TD; A-->B                                                     │
│  ```                                                                 │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Lute Parser (WASM)                              │
│  Markdown → HTML with <code class="language-mermaid">               │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     previewRender.ts                                 │
│  Calls hardcoded renderers:                                          │
│    - mermaidRender(element, cdn, theme)                             │
│    - flowchartRender(element, cdn)                                  │
│    - chartRender(element, cdn, theme)                               │
│    - ... (10+ built-in renderers)                                   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     mermaidRender.ts                                 │
│  1. Find all .language-mermaid elements                             │
│  2. Load mermaid.js from CDN                                        │
│  3. Call mermaid.render() for each element                          │
│  4. Replace innerHTML with SVG output                               │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Key Files Involved

| File | Purpose |
|------|---------|
| `src/ts/markdown/previewRender.ts` | Orchestrates all renderers in sequence |
| `src/ts/markdown/codeRender.ts` | Hardcoded list of languages to skip for syntax highlighting |
| `src/ts/markdown/adapterRender.ts` | Adapter pattern for element selection and code extraction |
| `src/ts/markdown/mermaidRender.ts` | Example of a built-in renderer |
| `types/index.d.ts` | TypeScript interfaces for options |

### 2.3 Current Hardcoded Language List

From `codeRender.ts`:
```typescript
if (e.classList.contains("language-mermaid") || 
    e.classList.contains("language-flowchart") ||
    e.classList.contains("language-echarts") || 
    e.classList.contains("language-mindmap") ||
    e.classList.contains("language-plantuml") || 
    e.classList.contains("language-markmap") ||
    e.classList.contains("language-abc") || 
    e.classList.contains("language-graphviz") ||
    e.classList.contains("language-math") || 
    e.classList.contains("language-smiles")) {
    return false; // Skip syntax highlighting for these
}
```

**Problem**: No way to add `language-wireframe` without modifying this list.

---

## 3. Proposed Plugin System Design

### 3.1 Plugin Interface

```typescript
/**
 * Interface for custom code block renderer plugins
 */
interface ICodeBlockPlugin {
    /** 
     * Language identifier (e.g., 'wireframe', 'mydiagram')
     * Corresponds to ```wireframe code blocks
     */
    language: string;
    
    /**
     * Optional: CDN URL for lazy-loading the renderer library
     * If provided, Vditor will load this script before calling render()
     */
    cdn?: string;
    
    /**
     * Adapter for finding elements and extracting code
     * Default: Uses .language-{language} selector
     */
    adapter?: {
        getElements: (container: HTMLElement | Document) => NodeListOf<Element>;
        getCode: (element: Element) => string;
    };
    
    /**
     * Render function called for each code block
     * @param element - The code element to render into
     * @param code - The source code from the code block
     * @param options - Theme and configuration options
     * @returns Promise that resolves when rendering is complete
     */
    render: (
        element: Element, 
        code: string, 
        options: ICodeBlockRenderOptions
    ) => Promise<void>;
    
    /**
     * Optional: Priority for render order (lower = earlier)
     * Default: 100
     */
    priority?: number;
}

interface ICodeBlockRenderOptions {
    theme: 'light' | 'dark';
    cdn: string;
    container: HTMLElement;
}
```

### 3.2 Plugin Registry

```typescript
// New file: src/ts/markdown/pluginRegistry.ts

class CodeBlockPluginRegistry {
    private plugins: Map<string, ICodeBlockPlugin> = new Map();
    
    /**
     * Register a custom code block renderer
     */
    register(plugin: ICodeBlockPlugin): void {
        if (this.plugins.has(plugin.language)) {
            console.warn(`Plugin for language "${plugin.language}" already registered, overwriting.`);
        }
        this.plugins.set(plugin.language, plugin);
    }
    
    /**
     * Unregister a plugin
     */
    unregister(language: string): boolean {
        return this.plugins.delete(language);
    }
    
    /**
     * Get all registered plugin languages
     */
    getLanguages(): string[] {
        return Array.from(this.plugins.keys());
    }
    
    /**
     * Get a specific plugin
     */
    get(language: string): ICodeBlockPlugin | undefined {
        return this.plugins.get(language);
    }
    
    /**
     * Get all plugins sorted by priority
     */
    getAll(): ICodeBlockPlugin[] {
        return Array.from(this.plugins.values())
            .sort((a, b) => (a.priority ?? 100) - (b.priority ?? 100));
    }
}

// Global singleton
export const codeBlockPlugins = new CodeBlockPluginRegistry();
```

### 3.3 Generic Plugin Renderer

```typescript
// New file: src/ts/markdown/pluginRender.ts

import { addScript } from "../util/addScript";
import { codeBlockPlugins } from "./pluginRegistry";

/**
 * Render all registered plugin code blocks
 */
export const pluginRender = async (
    element: HTMLElement | Document,
    cdn: string,
    theme: 'light' | 'dark'
): Promise<void> => {
    const plugins = codeBlockPlugins.getAll();
    
    for (const plugin of plugins) {
        // Use custom adapter or default
        const adapter = plugin.adapter ?? {
            getElements: (el: HTMLElement | Document) => 
                el.querySelectorAll(`.language-${plugin.language}`),
            getCode: (el: Element) => el.textContent ?? '',
        };
        
        const elements = adapter.getElements(element);
        if (elements.length === 0) continue;
        
        // Load CDN script if specified
        if (plugin.cdn) {
            await addScript(plugin.cdn, `vditorPlugin_${plugin.language}`);
        }
        
        // Render each element
        const renderPromises = Array.from(elements).map(async (el) => {
            if (el.getAttribute('data-processed') === 'true') return;
            
            const code = adapter.getCode(el);
            if (!code.trim()) return;
            
            try {
                await plugin.render(el, code, {
                    theme,
                    cdn,
                    container: element as HTMLElement,
                });
                el.setAttribute('data-processed', 'true');
            } catch (error) {
                console.error(`Plugin "${plugin.language}" render error:`, error);
                el.innerHTML = `<div class="vditor-plugin-error">
                    <strong>Error rendering ${plugin.language}:</strong><br>
                    ${(error as Error).message}
                </div>`;
            }
        });
        
        await Promise.all(renderPromises);
    }
};
```

### 3.4 Integration with previewRender.ts

```typescript
// Modified previewRender.ts

import { pluginRender } from "./pluginRender";
import { codeBlockPlugins } from "./pluginRegistry";

export const previewRender = async (...) => {
    // ... existing code ...
    
    // Built-in renderers (unchanged)
    mermaidRender(previewElement, mergedOptions.cdn, mergedOptions.mode);
    flowchartRender(previewElement, mergedOptions.cdn);
    // ... etc ...
    
    // NEW: Custom plugin renderers
    await pluginRender(previewElement, mergedOptions.cdn, mergedOptions.mode);
    
    // ... rest of existing code ...
};
```

### 3.5 Integration with codeRender.ts

```typescript
// Modified codeRender.ts

import { codeBlockPlugins } from "./pluginRegistry";

export const codeRender = (element: HTMLElement, option?: IHljs) => {
    // Get registered plugin languages
    const pluginLanguages = codeBlockPlugins.getLanguages();
    
    Array.from<HTMLElement>(element.querySelectorAll("pre > code")).filter((e) => {
        // ... existing checks ...
        
        // Built-in languages (keep for backward compatibility)
        if (e.classList.contains("language-mermaid") || /* ... */) {
            return false;
        }
        
        // NEW: Check registered plugins
        for (const lang of pluginLanguages) {
            if (e.classList.contains(`language-${lang}`)) {
                return false; // Skip syntax highlighting
            }
        }
        
        return true;
    }).forEach((e) => {
        // ... existing syntax highlighting code ...
    });
};
```

---

## 4. Public API

### 4.1 Vditor Instance Methods

```typescript
// Add to Vditor class

class Vditor {
    // ... existing methods ...
    
    /**
     * Register a custom code block renderer plugin
     */
    static registerPlugin(plugin: ICodeBlockPlugin): void {
        codeBlockPlugins.register(plugin);
    }
    
    /**
     * Unregister a plugin
     */
    static unregisterPlugin(language: string): boolean {
        return codeBlockPlugins.unregister(language);
    }
}
```

### 4.2 Standalone API

```typescript
// Export from main entry point

export { codeBlockPlugins } from './ts/markdown/pluginRegistry';
export type { ICodeBlockPlugin, ICodeBlockRenderOptions } from './ts/types';
```

---

## 5. Wireframe Plugin Implementation

### 5.1 Plugin Definition

```typescript
// wireframe-vditor-plugin.ts

import { ICodeBlockPlugin } from 'vditor';
import { WireframeParser, WireframeSVGRenderer } from '@anthropic/wireframe-core';

export const wireframePlugin: ICodeBlockPlugin = {
    language: 'wireframe',
    priority: 50, // Render before most other plugins
    
    render: async (element, code, options) => {
        try {
            // Parse wireframe DSL
            const parser = new WireframeParser();
            const ast = parser.parse(code);
            
            // Render to SVG
            const renderer = new WireframeSVGRenderer({
                theme: options.theme,
            });
            const svg = renderer.render(ast);
            
            // Replace element content
            element.innerHTML = svg;
            element.classList.add('wireframe-rendered');
        } catch (error) {
            throw new Error(`Wireframe parse error: ${(error as Error).message}`);
        }
    },
};
```

### 5.2 Usage in Application

```typescript
import Vditor from 'vditor';
import { wireframePlugin } from '@anthropic/wireframe-vditor-plugin';

// Register before creating Vditor instance
Vditor.registerPlugin(wireframePlugin);

// Now wireframe code blocks will render!
const editor = new Vditor('editor', {
    mode: 'ir',
    // ...
});
```

### 5.3 CDN-based Usage

```typescript
// For lazy-loading from CDN
export const wireframePluginCDN: ICodeBlockPlugin = {
    language: 'wireframe',
    cdn: 'https://unpkg.com/@anthropic/wireframe-core@latest/dist/wireframe.min.js',
    
    render: async (element, code, options) => {
        // wireframe-core loaded globally as `Wireframe`
        const { WireframeParser, WireframeSVGRenderer } = (window as any).Wireframe;
        // ... same render logic ...
    },
};
```

---

## 6. Implementation Plan

### Phase 1: Core Plugin System (Week 1)

| Task | File | Changes |
|------|------|---------|
| 1.1 | `types/index.d.ts` | Add `ICodeBlockPlugin` interface |
| 1.2 | `src/ts/markdown/pluginRegistry.ts` | Create plugin registry class |
| 1.3 | `src/ts/markdown/pluginRender.ts` | Create generic plugin renderer |
| 1.4 | `src/ts/markdown/codeRender.ts` | Check registered plugins for skip list |
| 1.5 | `src/ts/markdown/previewRender.ts` | Call `pluginRender()` after built-ins |
| 1.6 | `src/ts/index.ts` | Export plugin API |

### Phase 2: Integration Points (Week 2)

| Task | File | Changes |
|------|------|---------|
| 2.1 | `src/ts/ir/index.ts` | Support plugins in IR mode |
| 2.2 | `src/ts/wysiwyg/index.ts` | Support plugins in WYSIWYG mode |
| 2.3 | `src/ts/sv/index.ts` | Support plugins in SV mode |
| 2.4 | Tests | Add unit tests for plugin system |

### Phase 3: Wireframe Plugin (Week 3)

| Task | Deliverable |
|------|-------------|
| 3.1 | Create `@anthropic/wireframe-vditor-plugin` package |
| 3.2 | Browser build of wireframe-core (UMD/ESM) |
| 3.3 | CDN distribution via unpkg/jsdelivr |
| 3.4 | Documentation and examples |

### Phase 4: Upstream Contribution (Week 4)

| Task | Action |
|------|--------|
| 4.1 | Fork Vditor repository |
| 4.2 | Implement Phase 1 & 2 changes |
| 4.3 | Create PR to Vanessa219/vditor |
| 4.4 | Address review feedback |
| 4.5 | Publish wireframe plugin after merge |

---

## 7. Alternative Approaches Considered

### 7.1 DOM Post-Processing (Rejected)

**Approach**: Inject a script that runs after Vditor renders, finds unprocessed code blocks, renders them.

**Pros**:
- No Vditor modification needed
- Works immediately

**Cons**:
- Race conditions with Vditor's own rendering
- Flicker as content is double-processed
- No integration with Vditor's theme system
- Breaks on Vditor updates

### 7.2 Fork Vditor (Fallback)

**Approach**: Maintain a fork with wireframe support built-in.

**Pros**:
- Full control
- Works immediately

**Cons**:
- Maintenance burden of keeping fork updated
- Users must use our fork instead of official Vditor

### 7.3 Lute Custom Renderer (Partial)

**Approach**: Use `SetJSRenderers()` to customize HTML output.

**Pros**:
- Official API exists

**Cons**:
- Only controls HTML generation, not post-render visualization
- Still need DOM processing for interactive renderers
- Not suitable for SVG/Canvas-based renderers

---

## 8. TypeScript Definitions

```typescript
// Full type definitions to add to types/index.d.ts

/**
 * Options passed to code block plugin render function
 */
interface ICodeBlockRenderOptions {
    /** Current theme: 'light' or 'dark' */
    theme: 'light' | 'dark';
    /** CDN base URL for loading assets */
    cdn: string;
    /** The container element being rendered */
    container: HTMLElement;
}

/**
 * Adapter for finding and extracting code from elements
 */
interface ICodeBlockAdapter {
    /** Find all elements for this language in the container */
    getElements: (container: HTMLElement | Document) => NodeListOf<Element>;
    /** Extract the source code from an element */
    getCode: (element: Element) => string;
}

/**
 * Custom code block renderer plugin
 */
interface ICodeBlockPlugin {
    /** Language identifier (matches ```language code blocks) */
    language: string;
    /** Optional CDN URL for lazy-loading renderer library */
    cdn?: string;
    /** Custom adapter for element selection and code extraction */
    adapter?: ICodeBlockAdapter;
    /** Render function called for each code block */
    render: (
        element: Element,
        code: string,
        options: ICodeBlockRenderOptions
    ) => Promise<void>;
    /** Priority for render order (lower = earlier, default: 100) */
    priority?: number;
}

/**
 * Code block plugin registry interface
 */
interface ICodeBlockPluginRegistry {
    register(plugin: ICodeBlockPlugin): void;
    unregister(language: string): boolean;
    getLanguages(): string[];
    get(language: string): ICodeBlockPlugin | undefined;
    getAll(): ICodeBlockPlugin[];
}

// Extend Vditor static methods
declare class Vditor {
    // ... existing ...
    
    /** Register a custom code block renderer plugin */
    static registerPlugin(plugin: ICodeBlockPlugin): void;
    
    /** Unregister a plugin by language */
    static unregisterPlugin(language: string): boolean;
    
    /** Access the plugin registry directly */
    static readonly plugins: ICodeBlockPluginRegistry;
}
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('CodeBlockPluginRegistry', () => {
    it('should register a plugin', () => {
        const plugin = { language: 'test', render: jest.fn() };
        codeBlockPlugins.register(plugin);
        expect(codeBlockPlugins.get('test')).toBe(plugin);
    });
    
    it('should unregister a plugin', () => {
        codeBlockPlugins.register({ language: 'test', render: jest.fn() });
        expect(codeBlockPlugins.unregister('test')).toBe(true);
        expect(codeBlockPlugins.get('test')).toBeUndefined();
    });
    
    it('should sort plugins by priority', () => {
        codeBlockPlugins.register({ language: 'a', priority: 200, render: jest.fn() });
        codeBlockPlugins.register({ language: 'b', priority: 50, render: jest.fn() });
        codeBlockPlugins.register({ language: 'c', render: jest.fn() }); // default 100
        
        const all = codeBlockPlugins.getAll();
        expect(all.map(p => p.language)).toEqual(['b', 'c', 'a']);
    });
});
```

### 9.2 Integration Tests

```typescript
describe('Plugin Rendering', () => {
    it('should render custom code block', async () => {
        Vditor.registerPlugin({
            language: 'custom',
            render: async (el, code) => {
                el.innerHTML = `<div class="custom-rendered">${code.toUpperCase()}</div>`;
            },
        });
        
        const html = await Vditor.md2html('```custom\nhello\n```');
        const container = document.createElement('div');
        container.innerHTML = html;
        
        await previewRender(container, '```custom\nhello\n```');
        
        expect(container.querySelector('.custom-rendered')?.textContent).toBe('HELLO');
    });
});
```

---

## 10. Migration Guide

### For Existing Built-in Renderers

The plugin system is purely additive. Built-in renderers (mermaid, flowchart, etc.) continue to work unchanged. Optionally, they could be migrated to plugins for consistency:

```typescript
// Optional: Convert mermaidRender to plugin format
const mermaidPlugin: ICodeBlockPlugin = {
    language: 'mermaid',
    cdn: `${Constants.CDN}/dist/js/mermaid/mermaid.min.js`,
    priority: 10, // Built-in priority
    render: async (element, code, options) => {
        // Existing mermaidRender logic
    },
};
```

### For Plugin Authors

1. Create plugin object implementing `ICodeBlockPlugin`
2. Call `Vditor.registerPlugin(yourPlugin)` before creating Vditor instance
3. Your `render()` function receives the element and source code
4. Replace element's `innerHTML` with your rendered output

---

## 11. Security Considerations

1. **Sandboxing**: Plugin render functions run in the same context as Vditor. Malicious plugins could access DOM/cookies.

2. **CSP**: CDN-loaded scripts must be allowed by Content-Security-Policy.

3. **Input Sanitization**: Plugin authors are responsible for sanitizing code input before rendering.

4. **Recommendations**:
   - Document security best practices for plugin authors
   - Consider optional iframe sandboxing for untrusted plugins
   - Provide a `sanitize` utility function plugins can use

---

## 12. Success Criteria

| Metric | Target |
|--------|--------|
| Plugin registration works | ✓ Can register wireframe plugin |
| Code blocks render correctly | ✓ Wireframe SVG appears in preview |
| No syntax highlighting on plugin languages | ✓ Code not highlighted as generic code |
| Works in all modes | ✓ IR, WYSIWYG, Preview modes |
| Backward compatible | ✓ All existing renderers still work |
| Performance | < 10ms overhead for empty plugin list |
| Bundle size impact | < 2KB minified |

---

## 13. Open Questions

1. **Should plugins be async-loaded?** Currently proposed as sync registration. Could support dynamic `import()`.

2. **Plugin lifecycle hooks?** Consider `init()`, `destroy()` hooks for cleanup.

3. **Multiple languages per plugin?** Allow `languages: ['wireframe', 'wire', 'wf']` aliases?

4. **Editor integration?** Toolbar buttons, syntax completion for plugin languages?

5. **Plugin discovery?** Registry/marketplace for community plugins?

---

## 14. References

- [Vditor GitHub Repository](https://github.com/Vanessa219/vditor)
- [Vditor Documentation](https://ld246.com/article/1549638745630)
- [Lute Parser](https://github.com/88250/lute) - The Go markdown parser used by Vditor
- [Mermaid.js Plugin Architecture](https://mermaid.js.org/config/usage.html) - Reference for diagram plugin patterns
