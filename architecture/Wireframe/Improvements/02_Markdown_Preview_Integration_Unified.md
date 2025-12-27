# Markdown Preview Integration for Wireframe (Unified Extension)

## Overview

This document describes how to add Markdown Preview support **directly into the existing Wireframe VS Code extension**, rather than creating a separate extension. This approach provides a unified experience where installing one extension enables both `.wire` file editing and markdown preview rendering.

## Comparison: Unified vs Separate Extension

| Aspect | Unified Extension | Separate Extension |
|--------|------------------|-------------------|
| Installation | Single extension | Two extensions |
| Versioning | Single version | Independent versions |
| Bundle size | Shared code, smaller total | Duplicated core library |
| User experience | Simpler | More flexible |
| Maintenance | Single codebase | Two codebases |
| Marketplace | One listing | Two listings |

**Recommendation:** For Wireframe, the **unified approach** is preferred because:
1. The core library is already bundled in the extension
2. Users expect one tool for wireframes
3. Simpler maintenance and updates

## Implementation Plan

### Phase 1: Update package.json

Add markdown preview contribution points to the existing extension:

```json
{
  "name": "wireframe-vscode",
  "displayName": "Wireframe",
  "version": "0.0.8",
  "contributes": {
    // Existing contributions...
    "languages": [...],
    "grammars": [...],
    "commands": [...],
    
    // NEW: Markdown preview integration
    "markdown.previewScripts": [
      "./dist/markdown-preview.js"
    ],
    "markdown.markdownItPlugins": true,
    
    // NEW: Notebook renderer support
    "notebookRenderer": [
      {
        "id": "jonkeda.markdown-it.wireframe",
        "displayName": "Wireframe Diagram Renderer",
        "entrypoint": {
          "extends": "vscode.markdown-it-renderer",
          "path": "./dist/notebook-renderer.js"
        }
      }
    ],
    
    // NEW: Configuration for markdown preview
    "configuration": {
      "title": "Wireframe",
      "properties": {
        // Existing properties...
        
        "wireframe.markdown.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable wireframe diagram rendering in Markdown preview"
        },
        "wireframe.markdown.lightTheme": {
          "type": "string",
          "enum": ["clean", "sketch", "realistic"],
          "default": "clean",
          "description": "Theme for wireframe diagrams in light mode Markdown preview"
        },
        "wireframe.markdown.darkTheme": {
          "type": "string",
          "enum": ["blueprint", "sketch"],
          "default": "blueprint",
          "description": "Theme for wireframe diagrams in dark mode Markdown preview"
        },
        "wireframe.markdown.maxSize": {
          "type": "number",
          "default": 50000,
          "description": "Maximum character size for wireframe diagrams in Markdown"
        }
      }
    }
  }
}
```

### Phase 2: Create Markdown Preview Script

Create a new file that will be bundled separately for the markdown preview context:

```
packages/vscode-extension/
├── src/
│   ├── extension.ts           # Existing main extension
│   ├── preview.ts             # Existing .wire preview
│   ├── markdown/              # NEW: Markdown integration
│   │   ├── plugin.ts          # markdown-it plugin
│   │   ├── preview-script.ts  # Browser script for preview
│   │   └── notebook-renderer.ts # Notebook renderer
│   └── ...
├── dist/
│   ├── extension.js           # Main extension bundle
│   ├── markdown-preview.js    # NEW: Markdown preview bundle
│   └── notebook-renderer.js   # NEW: Notebook renderer bundle
```

#### 2.1 markdown-it Plugin

```typescript
// src/markdown/plugin.ts
import type MarkdownIt from 'markdown-it';
import type Token from 'markdown-it/lib/token';
import type Renderer from 'markdown-it/lib/renderer';

// Import from existing core (will be bundled)
import { Parser, SvgRenderer, getTheme } from '@jonkeda/wireframe-core';

interface WireframePluginOptions {
  theme?: string;
  maxSize?: number;
}

export function wireframePlugin(md: MarkdownIt, options: WireframePluginOptions = {}) {
  const defaultTheme = options.theme || 'clean';
  const maxSize = options.maxSize || 50000;
  
  // Store the original fence renderer
  const defaultFence = md.renderer.rules.fence!.bind(md.renderer.rules);

  md.renderer.rules.fence = (
    tokens: Token[],
    idx: number,
    opts: MarkdownIt.Options,
    env: any,
    self: Renderer
  ): string => {
    const token = tokens[idx];
    const info = token.info.trim().toLowerCase();

    // Check if this is a wireframe code block
    if (info === 'wireframe' || info === 'wire') {
      return renderWireframe(token.content, defaultTheme, maxSize);
    }

    // Fall back to default rendering for other languages
    return defaultFence(tokens, idx, opts, env, self);
  };
}

function renderWireframe(source: string, defaultTheme: string, maxSize: number): string {
  // Size check
  if (source.length > maxSize) {
    return `<div class="wireframe-error">
      <strong>Wireframe Error:</strong> Diagram exceeds maximum size of ${maxSize} characters.
    </div>`;
  }

  try {
    const parser = new Parser();
    const result = parser.parse(source);

    if (result.errors.length > 0) {
      const errorMessages = result.errors
        .map(e => `Line ${e.line}: ${e.message}`)
        .join('<br>');
      return `<div class="wireframe-error">
        <strong>Wireframe Parse Error:</strong><br>${errorMessages}
      </div>`;
    }

    if (!result.document) {
      return `<div class="wireframe-error">
        <strong>Wireframe Error:</strong> Failed to parse document.
      </div>`;
    }

    // Determine theme from document or use default
    const documentTheme = result.document.theme || defaultTheme;
    const theme = getTheme(documentTheme);
    
    const renderer = new SvgRenderer(theme);
    const svg = renderer.render(result.document);

    return `<div class="wireframe-diagram" data-theme="${documentTheme}">${svg}</div>`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `<div class="wireframe-error">
      <strong>Wireframe Error:</strong> ${escapeHtml(message)}
    </div>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
```

#### 2.2 Markdown Preview Script (Browser Bundle)

```typescript
// src/markdown/preview-script.ts
import { wireframePlugin } from './plugin';

// This is the entry point for the markdown preview script
// It exports the function that VS Code calls to extend markdown-it

declare const acquireVsCodeApi: () => {
  getState: () => any;
  setState: (state: any) => void;
  postMessage: (message: any) => void;
};

interface MarkdownItAPI {
  use: (plugin: any, options?: any) => MarkdownItAPI;
}

// Get VS Code configuration (injected by VS Code)
declare const vscodeMarkdownPreviewConfig: {
  wireframe?: {
    enabled?: boolean;
    theme?: string;
    maxSize?: number;
  };
};

export function activate() {
  return {
    extendMarkdownIt(md: MarkdownItAPI) {
      const config = typeof vscodeMarkdownPreviewConfig !== 'undefined' 
        ? vscodeMarkdownPreviewConfig.wireframe || {}
        : {};
      
      if (config.enabled === false) {
        return md;
      }

      return md.use(wireframePlugin, {
        theme: config.theme || 'clean',
        maxSize: config.maxSize || 50000
      });
    }
  };
}
```

#### 2.3 Notebook Renderer

```typescript
// src/markdown/notebook-renderer.ts
import { wireframePlugin } from './plugin';

interface MarkdownItAPI {
  use: (plugin: any, options?: any) => MarkdownItAPI;
}

export function activate() {
  return {
    extendMarkdownIt(md: MarkdownItAPI) {
      return md.use(wireframePlugin, {
        theme: 'clean',
        maxSize: 50000
      });
    }
  };
}
```

### Phase 3: Update Build Configuration

Modify `esbuild.js` to create multiple bundles:

```javascript
// esbuild.js
const esbuild = require('esbuild');

const production = process.argv.includes('--production');

// Main extension bundle (Node.js context)
const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  sourcemap: !production,
  minify: production,
};

// Markdown preview bundle (Browser context)
const markdownPreviewConfig = {
  entryPoints: ['src/markdown/preview-script.ts'],
  bundle: true,
  outfile: 'dist/markdown-preview.js',
  format: 'iife',
  globalName: 'wireframeMarkdownPreview',
  platform: 'browser',
  sourcemap: !production,
  minify: production,
  // Important: bundle everything, no externals for browser
};

// Notebook renderer bundle (Browser context)
const notebookRendererConfig = {
  entryPoints: ['src/markdown/notebook-renderer.ts'],
  bundle: true,
  outfile: 'dist/notebook-renderer.js',
  format: 'iife',
  globalName: 'wireframeNotebookRenderer',
  platform: 'browser',
  sourcemap: !production,
  minify: production,
};

async function build() {
  try {
    await Promise.all([
      esbuild.build(extensionConfig),
      esbuild.build(markdownPreviewConfig),
      esbuild.build(notebookRendererConfig),
    ]);
    console.log('Build complete');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
```

### Phase 4: Add CSS Styles for Markdown Preview

Create styles that will be injected into the markdown preview:

```typescript
// src/markdown/styles.ts
export const wireframeStyles = `
.wireframe-diagram {
  margin: 16px 0;
  padding: 16px;
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
  border-radius: 4px;
  overflow-x: auto;
}

.wireframe-diagram svg {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.wireframe-diagram[data-theme="blueprint"] {
  background: #1a365d;
}

.wireframe-error {
  margin: 16px 0;
  padding: 12px 16px;
  background: var(--vscode-inputValidation-errorBackground);
  border: 1px solid var(--vscode-inputValidation-errorBorder);
  border-radius: 4px;
  color: var(--vscode-errorForeground);
  font-family: var(--vscode-editor-font-family);
  font-size: 13px;
}

.wireframe-error strong {
  display: block;
  margin-bottom: 4px;
}
`;
```

Add to preview script:

```typescript
// In preview-script.ts
import { wireframeStyles } from './styles';

export function activate() {
  // Inject styles
  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.textContent = wireframeStyles;
    document.head.appendChild(style);
  }

  return {
    extendMarkdownIt(md: MarkdownItAPI) {
      // ... existing code
    }
  };
}
```

### Phase 5: Theme Switching Based on VS Code Theme

Support automatic theme switching:

```typescript
// src/markdown/theme-detector.ts
export function detectTheme(): 'light' | 'dark' {
  if (typeof document === 'undefined') {
    return 'light';
  }
  
  // VS Code adds these classes to the body
  const body = document.body;
  if (body.classList.contains('vscode-dark') || 
      body.classList.contains('vscode-high-contrast')) {
    return 'dark';
  }
  
  return 'light';
}

export function getThemeForMode(
  mode: 'light' | 'dark',
  lightTheme: string,
  darkTheme: string
): string {
  return mode === 'dark' ? darkTheme : lightTheme;
}
```

Update the plugin to use theme detection:

```typescript
// Updated plugin.ts
import { detectTheme, getThemeForMode } from './theme-detector';

interface WireframePluginOptions {
  lightTheme?: string;
  darkTheme?: string;
  maxSize?: number;
}

export function wireframePlugin(md: MarkdownIt, options: WireframePluginOptions = {}) {
  const lightTheme = options.lightTheme || 'clean';
  const darkTheme = options.darkTheme || 'blueprint';
  const maxSize = options.maxSize || 50000;

  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    const info = token.info.trim().toLowerCase();

    if (info === 'wireframe' || info === 'wire') {
      const mode = detectTheme();
      const defaultTheme = getThemeForMode(mode, lightTheme, darkTheme);
      return renderWireframe(token.content, defaultTheme, maxSize);
    }

    return defaultFence(tokens, idx, opts, env, self);
  };
}
```

## Updated Extension Structure

```
packages/vscode-extension/
├── package.json              # Updated with markdown contributions
├── esbuild.js                # Updated build config
├── src/
│   ├── extension.ts          # Main extension entry
│   ├── preview.ts            # .wire file preview webview
│   ├── commands.ts           # Extension commands
│   ├── markdown/             # NEW
│   │   ├── plugin.ts         # markdown-it plugin
│   │   ├── preview-script.ts # Markdown preview bundle entry
│   │   ├── notebook-renderer.ts
│   │   ├── theme-detector.ts
│   │   └── styles.ts
│   └── ...
├── dist/
│   ├── extension.js          # Main extension (Node.js)
│   ├── markdown-preview.js   # Markdown preview (Browser)
│   └── notebook-renderer.js  # Notebook renderer (Browser)
├── images/
├── snippets/
└── syntaxes/
```

## Configuration Options

Users can configure markdown preview behavior:

```json
// settings.json
{
  // Enable/disable wireframe rendering in markdown preview
  "wireframe.markdown.enabled": true,
  
  // Theme for light mode
  "wireframe.markdown.lightTheme": "clean",
  
  // Theme for dark mode  
  "wireframe.markdown.darkTheme": "blueprint",
  
  // Maximum diagram size (characters)
  "wireframe.markdown.maxSize": 50000
}
```

## Usage

After updating the extension, users can embed wireframes in any Markdown file:

~~~markdown
# Design Document

## Login Screen

```wireframe
wireframe clean
    Card w=350 padding=24
        Vertical gap=16
            Heading "Sign In" level=2
            TextInput placeholder="Email"
            PasswordInput placeholder="Password"
            Button "Sign In" primary
        /Vertical
    /Card
/wireframe
```

## Alternative: Using `wire` shorthand

```wire
wireframe sketch
    Button "Quick Example"
/wireframe
```
~~~

## Benefits of Unified Approach

1. **Single Installation** - Users install one extension for all wireframe functionality
2. **Shared Code** - Core parsing/rendering is bundled once, reducing total size
3. **Consistent Experience** - Same themes and rendering across all contexts
4. **Simpler Updates** - One version number, one changelog
5. **Cross-Feature Integration** - Can add commands like "Open in Wireframe Editor" from markdown

## Migration Path

For users upgrading from a version without markdown support:

1. The extension auto-enables markdown preview
2. Existing `.wire` files continue to work unchanged
3. No breaking changes to existing functionality

## Testing Checklist

- [ ] Wireframe code blocks render in Markdown preview
- [ ] Theme switching works (light/dark mode)
- [ ] Document-level theme overrides work (`wireframe blueprint`)
- [ ] Parse errors display correctly
- [ ] Large diagrams respect maxSize limit
- [ ] Notebook markdown cells render wireframes
- [ ] No conflicts with Mermaid or other diagram extensions
- [ ] Performance acceptable with multiple diagrams
- [ ] Existing .wire preview still works

## Timeline

| Task | Duration |
|------|----------|
| Update package.json | 0.5 day |
| Create markdown plugin | 1 day |
| Update build configuration | 0.5 day |
| Add theme detection | 0.5 day |
| Notebook renderer | 0.5 day |
| Testing & fixes | 1-2 days |
| **Total** | **4-5 days** |

## Conclusion

Integrating markdown preview support directly into the Wireframe extension is the recommended approach. It provides a seamless user experience, reduces duplication, and simplifies maintenance. The implementation leverages VS Code's standard markdown extension APIs and follows established patterns.
