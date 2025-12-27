# Markdown Preview Integration for Wireframe

## Overview

This document analyzes how Wireframe diagrams can be integrated into VS Code's Markdown Preview, similar to how the **Markdown Mermaid** extension (`bierner.markdown-mermaid`) renders Mermaid diagrams inside markdown code blocks.

## Current State

### How Mermaid Works

The Mermaid extension uses VS Code's markdown preview extension API to render diagrams. Key contribution points:

```json
{
  "contributes": {
    "markdown.previewScripts": [
      "./dist-preview/index.bundle.js"
    ],
    "markdown.markdownItPlugins": true,
    "notebookRenderer": [
      {
        "id": "bierner.markdown-it.mermaid-extension",
        "displayName": "Markdown it Mermaid renderer",
        "entrypoint": {
          "extends": "vscode.markdown-it-renderer",
          "path": "./dist-notebook/index.bundle.js"
        }
      }
    ]
  }
}
```

### How "Markdown All in One" Works

"Markdown All in One" (`yzhang.markdown-all-in-one`) does **not** render Mermaid itself. It relies on the separate **Markdown Preview Mermaid Support** extension to handle Mermaid rendering. The FAQ states:

> "For other Markdown syntax, you need to install the corresponding extensions from VS Code marketplace (e.g. Mermaid diagram, emoji, footnotes and superscript)."

## Proposed Solution: Wireframe Markdown Preview Extension

To enable `wireframe` code blocks in markdown preview, we can create a **Markdown Preview Wireframe Support** extension using VS Code's extension APIs.

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Markdown Document                          │
│                                                               │
│  # My Design Document                                         │
│                                                               │
│  Here's the login form wireframe:                            │
│                                                               │
│  ```wireframe                                                │
│  wireframe clean                                             │
│      Card w=300                                              │
│          Vertical gap=8                                      │
│              Heading "Login"                                 │
│              TextInput placeholder="Email"                   │
│              PasswordInput placeholder="Password"            │
│              Button "Sign In" primary                        │
│          /Vertical                                           │
│      /Card                                                   │
│  /wireframe                                                  │
│  ```                                                         │
│                                                               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│              markdown-it Plugin (Extension)                   │
│                                                               │
│  1. Intercepts ```wireframe``` code blocks                   │
│  2. Parses wireframe DSL using @jonkeda/wireframe-core       │
│  3. Renders to SVG                                           │
│  4. Injects SVG into preview HTML                            │
│                                                               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   Markdown Preview                            │
│                                                               │
│  # My Design Document                                         │
│                                                               │
│  Here's the login form wireframe:                            │
│                                                               │
│  ┌─────────────────────────┐                                 │
│  │         Login           │                                 │
│  │  ┌───────────────────┐  │                                 │
│  │  │ Email             │  │                                 │
│  │  └───────────────────┘  │                                 │
│  │  ┌───────────────────┐  │                                 │
│  │  │ ●●●●●●●●          │  │                                 │
│  │  └───────────────────┘  │                                 │
│  │  ┌───────────────────┐  │                                 │
│  │  │     Sign In       │  │                                 │
│  │  └───────────────────┘  │                                 │
│  └─────────────────────────┘                                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Create Markdown Preview Extension

Create a new extension package: `packages/vscode-markdown-wireframe/`

#### 1.1 Package Structure

```
packages/vscode-markdown-wireframe/
├── package.json
├── tsconfig.json
├── esbuild.js
├── src/
│   ├── index.ts              # Extension activation
│   └── markdownPreview.ts    # Preview script bundled separately
└── README.md
```

#### 1.2 package.json Configuration

```json
{
  "name": "markdown-wireframe",
  "displayName": "Markdown Preview Wireframe Support",
  "description": "Adds Wireframe diagram support to VS Code's builtin markdown preview",
  "version": "0.0.1",
  "publisher": "jonkeda",
  "engines": {
    "vscode": "^1.80.0"
  },
  "activationEvents": [],
  "main": "./dist/index.js",
  "contributes": {
    "markdown.previewScripts": [
      "./dist-preview/index.bundle.js"
    ],
    "markdown.markdownItPlugins": true,
    "configuration": {
      "title": "Markdown Preview Wireframe Support",
      "properties": {
        "markdown-wireframe.theme": {
          "type": "string",
          "enum": ["clean", "blueprint", "sketch"],
          "default": "clean",
          "description": "Default theme for wireframe diagrams"
        }
      }
    }
  },
  "dependencies": {
    "@jonkeda/wireframe-core": "^0.0.7"
  }
}
```

#### 1.3 markdown-it Plugin Implementation

```typescript
// src/markdownPlugin.ts
import MarkdownIt from 'markdown-it';
import { parse, render } from '@jonkeda/wireframe-core';

export function wireframePlugin(md: MarkdownIt, options: { theme?: string } = {}) {
  const defaultFence = md.renderer.rules.fence;
  
  md.renderer.rules.fence = (tokens, idx, opts, env, self) => {
    const token = tokens[idx];
    
    if (token.info.trim() === 'wireframe') {
      try {
        const source = token.content;
        const result = parse(source);
        
        if (result.document && result.errors.length === 0) {
          const svg = render(result.document, {
            theme: options.theme || 'clean',
            accessible: true
          });
          
          return `<div class="wireframe-diagram">${svg}</div>`;
        } else {
          // Show parse errors
          const errors = result.errors.map(e => e.message).join('\n');
          return `<pre class="wireframe-error">Wireframe Error:\n${errors}</pre>`;
        }
      } catch (error) {
        return `<pre class="wireframe-error">Wireframe Error: ${error}</pre>`;
      }
    }
    
    // Fall back to default fence rendering
    return defaultFence ? defaultFence(tokens, idx, opts, env, self) : '';
  };
}
```

#### 1.4 Preview Script (Browser Bundle)

```typescript
// src/preview/index.ts
import { wireframePlugin } from '../markdownPlugin';

export function activate() {
  return {
    extendMarkdownIt(md: MarkdownIt) {
      return md.use(wireframePlugin);
    }
  };
}
```

### Phase 2: Notebook Renderer Support

For Jupyter notebooks and VS Code notebooks with markdown cells:

```json
{
  "contributes": {
    "notebookRenderer": [
      {
        "id": "jonkeda.markdown-it.wireframe-extension",
        "displayName": "Markdown it Wireframe renderer",
        "entrypoint": {
          "extends": "vscode.markdown-it-renderer",
          "path": "./dist-notebook/index.bundle.js"
        }
      }
    ]
  }
}
```

### Phase 3: Theme Support

Support VS Code's light/dark mode with appropriate theme switching:

```json
{
  "properties": {
    "markdown-wireframe.lightModeTheme": {
      "type": "string",
      "enum": ["clean", "sketch"],
      "default": "clean"
    },
    "markdown-wireframe.darkModeTheme": {
      "type": "string",
      "enum": ["blueprint", "sketch"],
      "default": "blueprint"
    }
  }
}
```

## Technical Considerations

### 1. Bundle Size

The `@jonkeda/wireframe-core` package needs to be bundled for browser use. Consider:
- Tree-shaking unused code
- Minifying production builds
- Lazy loading if needed

### 2. Performance

For large documents with many wireframes:
- Consider caching rendered SVGs
- Use virtual rendering for very large diagrams
- Implement maximum text size limit (like Mermaid's `maxTextSize`)

### 3. Security

- Ensure SVG output is properly sanitized
- Use Content Security Policy compliant rendering
- No external resource loading in preview

### 4. Interoperability

The extension should:
- Work alongside the existing wireframe extension
- Not conflict with Mermaid or other diagram extensions
- Support both Markdown Preview and notebooks

## Usage Examples

Once implemented, users can embed wireframes in markdown:

~~~markdown
# User Login Design

The login form should be simple and clean:

```wireframe
wireframe clean
    Card w=350 padding=24
        Vertical gap=16
            Heading "Sign In" level=2
            TextInput placeholder="Email"
            PasswordInput placeholder="Password"
            Button "Sign In" primary w=100%
        /Vertical
    /Card
/wireframe
```

## Dashboard Layout

```wireframe
wireframe blueprint
    Dock w=800 h=600
        Header dock=top
            Horizontal
                Heading "Dashboard"
                Spacer
                Avatar "JD"
            /Horizontal
        /Header
        Sidebar dock=left w=200
            Menu
                MenuItem "Home" icon=home selected
                MenuItem "Analytics" icon=chart
                MenuItem "Settings" icon=settings
            /Menu
        /Sidebar
        Content dock=fill
            Grid cols=2 gap=16
                Card
                    Heading "Users" level=3
                    Label "1,234"
                /Card
                Card
                    Heading "Revenue" level=3
                    Label "$45,678"
                /Card
            /Grid
        /Content
    /Dock
/wireframe
```
~~~

## Comparison with Current Wireframe Extension

| Feature | Current Extension | Markdown Preview Extension |
|---------|------------------|---------------------------|
| File type | `.wire` files | `.md` files with code blocks |
| Preview | Dedicated webview | Built-in Markdown Preview |
| Editing | Full editor support | Markdown editor |
| Use case | Dedicated wireframe design | Documentation with embedded diagrams |
| Themes | All themes | All themes |

## Recommendation

We recommend implementing this as a **separate extension** that depends on `@jonkeda/wireframe-core`. This approach:

1. Keeps the main wireframe extension focused
2. Allows independent versioning and updates
3. Follows the pattern established by Mermaid
4. Users can install only what they need

## Timeline Estimate

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1 | 2-3 days | Basic markdown preview support |
| Phase 2 | 1-2 days | Notebook renderer support |
| Phase 3 | 1 day | Theme switching |
| Testing | 1-2 days | Cross-platform testing |
| **Total** | **5-8 days** | Complete extension |

## Conclusion

Integrating Wireframe into VS Code's Markdown Preview is **feasible and recommended**. The implementation follows established patterns from the Mermaid extension, leverages the existing `@jonkeda/wireframe-core` package, and provides significant value for documentation workflows.
