# UIMMD Integration Guide

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document describes how to integrate UIMMD preview and editing capabilities into existing development environments and extensions, rather than requiring a standalone extension.

---

## 2. Development Environment Recommendation

### 2.1 VSCode vs Visual Studio

| Factor | VSCode | Visual Studio |
|--------|--------|---------------|
| **TypeScript/Node.js** | Native, first-class support | Requires additional setup |
| **Extension Development** | Build VSCode extensions directly | Cannot build VSCode extensions |
| **Mermaid.js** | JavaScript ecosystem alignment | Not designed for pure JS libs |
| **Monorepo (pnpm)** | Excellent workspace support | Less common pattern |
| **Community** | Standard for web/Node.js OSS | More .NET focused |
| **Debugging** | Built-in Node.js debugger | Extra configuration needed |

### 2.2 Recommendation: VSCode

**VSCode is the preferred environment** for UIMMD development because:

1. **You're building a VSCode extension** - You need VSCode to develop, test, and debug the extension itself

2. **Pure TypeScript/JavaScript project** - No .NET, C#, or compiled languages that would benefit from Visual Studio

3. **npm ecosystem** - All dependencies (Mermaid, Rough.js, d3, etc.) are JavaScript packages

4. **Monorepo structure** - pnpm workspaces work better with VSCode's multi-root workspace feature

5. **Extension testing** - VSCode has built-in support for `@vscode/test-electron` to run extension tests

### 2.3 Technology Stack Alignment

```
UIMMD Technology Stack:
... TypeScript 5.x          . VSCode native
... pnpm workspaces         . VSCode native  
... Vitest                  . VSCode extensions available
... Vite/esbuild           . JavaScript tooling
... Mermaid.js             . JavaScript library
... VSCode Extension API   . Must use VSCode
```

### 2.4 When Visual Studio Would Be Preferred

Visual Studio would only be preferred if:
- You were building a **.NET-based parser** (C#)
- You needed **WPF/WinForms** for a desktop preview app
- The project included **ASP.NET** backend components

---

## 3. Integration Options

### 3.1 Option 1: Markdown Preview Extensions (Easiest)

If you use markdown preview extensions, UIMMD can work like Mermaid does today.

**Compatible Extensions:**

| Extension | Integration Method |
|-----------|-------------------|
| **Markdown Preview Enhanced** | Custom parser plugin |
| **Markdown Preview Mermaid Support** | Add UIMMD as diagram type |
| **Foam/Dendron** | Custom renderer |

**Example: Markdown Preview Enhanced Integration**

Create a custom parser file:

```javascript
// ~/.mume/parser.js
const uimmd = require('@uimmd/core');

module.exports = {
    onWillParseMarkdown: async function(markdown) {
        return markdown;
    },
    onDidParseMarkdown: async function(html) {
        // Replace ```uimmd code blocks with rendered SVG
        return html.replace(
            /<pre><code class="language-uimmd">([\s\S]*.)<\/code><\/pre>/g,
            (match, code) => {
                try {
                    const ast = uimmd.parse(code);
                    return uimmd.render(ast);
                } catch (e) {
                    return `<pre style="color:red">${e.message}</pre>`;
                }
            }
        );
    }
};
```

---

### 3.2 Option 2: Mermaid Extension Integration (Recommended)

Since UIMMD is designed as a Mermaid diagram type, any extension that supports Mermaid can support UIMMD automatically.

**Compatible Mermaid Extensions:**
- Markdown Preview Mermaid Support
- Draw.io Integration
- Mermaid Editor
- Markdown All in One

**How It Works:**

The `@uimmd/mermaid-plugin` auto-registers with Mermaid when imported:

```typescript
// The plugin registers automatically
import '@uimmd/mermaid-plugin';

// Mermaid now recognizes uiwire syntax
mermaid.render('diagram', `
uiwire clean
    Button "Hello World"
/uiwire
`);
```

**Usage in Markdown:**

````markdown
# My Document

Here's a wireframe:

```mermaid
uiwire clean
    Card
        Label "**Login**"
        TextInput "Username" :txtUser
        PasswordInput "Password" :txtPass
        Button "Login" primary
    /Card
/uiwire
```
````

**Installation:**

```bash
npm install @uimmd/mermaid-plugin
```

---

### 3.3 Option 3: Language Server Protocol (LSP) Integration

For extensions that support LSP (like many linting/formatting extensions), UIMMD provides a language server.

**VSCode Settings:**

```json
// .vscode/settings.json
{
    "uimmd.languageServer.enable": true,
    "[uimmd]": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "uimmd.uimmd"
    }
}
```

**Benefits:**
- IntelliSense in any LSP-compatible editor
- Works with Neovim, Sublime Text, Atom, etc.
- No dedicated extension required

---

### 3.4 Option 4: VSCode Tasks Integration

Use VSCode tasks to render UIMMD files with existing tooling:

```json
// .vscode/tasks.json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "UIMMD: Render Current File",
            "type": "shell",
            "command": "npx @uimmd/cli render ${file} -o ${fileDirname}/${fileBasenameNoExtension}.svg",
            "group": "build",
            "presentation": {
                "reveal": "silent"
            },
            "problemMatcher": []
        },
        {
            "label": "UIMMD: Watch Current File",
            "type": "shell", 
            "command": "npx @uimmd/cli watch ${file} --serve",
            "isBackground": true,
            "problemMatcher": [],
            "presentation": {
                "reveal": "always",
                "panel": "dedicated"
            }
        },
        {
            "label": "UIMMD: Validate Current File",
            "type": "shell",
            "command": "npx @uimmd/cli validate ${file}",
            "group": "test",
            "problemMatcher": {
                "owner": "uimmd",
                "pattern": {
                    "regexp": "^(.+):(\\d+):(\\d+):\\s+(error|warning):\\s+(.+)$",
                    "file": 1,
                    "line": 2,
                    "column": 3,
                    "severity": 4,
                    "message": 5
                }
            }
        },
        {
            "label": "UIMMD: Export to PNG",
            "type": "shell",
            "command": "npx @uimmd/cli render ${file} -o ${fileDirname}/${fileBasenameNoExtension}.png --format png",
            "group": "build",
            "problemMatcher": []
        }
    ]
}
```

**Keyboard Shortcuts:**

```json
// .vscode/keybindings.json (user level)
[
    {
        "key": "ctrl+shift+u",
        "command": "workbench.action.tasks.runTask",
        "args": "UIMMD: Render Current File",
        "when": "editorLangId == uimmd"
    }
]
```

---

### 3.5 Option 5: Webview Panel API (For Extension Authors)

If you maintain your own VSCode extension, you can add UIMMD preview support:

```typescript
// In your existing extension's activate function
import * as vscode from 'vscode';
import { parse, render } from '@uimmd/core';

export function addUimmdSupport(context: vscode.ExtensionContext) {
    // Register for .uimmd files
    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument(doc => {
            if (doc.languageId === 'uimmd' || doc.fileName.endsWith('.uimmd')) {
                showUimmdPreview(doc);
            }
        })
    );

    // Register command
    context.subscriptions.push(
        vscode.commands.registerCommand('myExtension.previewUimmd', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor && editor.document.fileName.endsWith('.uimmd')) {
                showUimmdPreview(editor.document);
            }
        })
    );
}

function showUimmdPreview(document: vscode.TextDocument) {
    const panel = vscode.window.createWebviewPanel(
        'uimmdPreview',
        `Preview: ${document.fileName.split('/').pop()}`,
        vscode.ViewColumn.Beside,
        { 
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    const updatePreview = () => {
        try {
            const ast = parse(document.getText());
            const svg = render(ast);
            panel.webview.html = getPreviewHtml(svg);
        } catch (e) {
            panel.webview.html = getErrorHtml(e as Error);
        }
    };

    // Initial render
    updatePreview();

    // Watch for changes
    const changeDisposable = vscode.workspace.onDidChangeTextDocument(e => {
        if (e.document === document) {
            updatePreview();
        }
    });

    panel.onDidDispose(() => {
        changeDisposable.dispose();
    });
}

function getPreviewHtml(svg: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            padding: 20px;
            display: flex;
            justify-content: center;
            background: var(--vscode-editor-background);
        }
        .preview-container {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
    </style>
</head>
<body>
    <div class="preview-container">
        ${svg}
    </div>
</body>
</html>`;
}

function getErrorHtml(error: Error): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            padding: 20px;
            font-family: var(--vscode-font-family);
            color: var(--vscode-errorForeground);
        }
        .error-title { font-weight: bold; margin-bottom: 10px; }
        .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: monospace;
        }
    </style>
</head>
<body>
    <div class="error-title">Parse Error</div>
    <div class="error-message">${error.message}</div>
</body>
</html>`;
}
```

---

## 4. Recommended VSCode Extensions for Development

### 4.1 Essential Extensions

```json
// .vscode/extensions.json
{
    "recommendations": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "vitest.explorer",
        "amodio.tsl-problem-matcher",
        "ms-vscode.vscode-typescript-next",
        "bierner.markdown-mermaid",
        "eamodio.gitlens",
        "streetsidesoftware.code-spell-checker"
    ]
}
```

### 4.2 Extension Descriptions

| Extension | Purpose |
|-----------|---------|
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Vitest Explorer** | Test runner UI |
| **TypeScript Next** | Latest TS features |
| **Markdown Mermaid** | Mermaid preview in markdown |
| **GitLens** | Git integration |
| **Code Spell Checker** | Spell checking |

---

## 5. Integration Strategy

### 5.1 Recommended Approach

```
...................................................................
.                    Integration Strategy                          .
...................................................................
.                                                                  .
.  Phase 1: Mermaid Plugin                                        .
.  .....................                                          .
.  • Install @uimmd/mermaid-plugin                                .
.  • Works with existing Mermaid extensions                       .
.  • Zero configuration required                                  .
.                                                                  .
.  Phase 2: Dedicated File Support                                .
.  ...............................                                .
.  • Add syntax highlighting via TextMate grammar                 .
.  • Use CLI for rendering and validation                         .
.  • Configure VSCode tasks                                       .
.                                                                  .
.  Phase 3: Full IntelliSense (Optional)                          .
.  .....................................                          .
.  • Install lightweight UIMMD extension                          .
.  • Provides completion, hover, diagnostics                      .
.  • Delegates rendering to @uimmd/core                           .
.                                                                  .
...................................................................
```

### 5.2 Quick Start

**Step 1: Install CLI globally**

```bash
npm install -g @uimmd/cli
```

**Step 2: Install Mermaid plugin in your project**

```bash
npm install @uimmd/mermaid-plugin
```

**Step 3: Use in markdown files**

````markdown
```mermaid
uiwire sketch
    Card
        Label "**Quick Demo**"
        Button "It Works!" primary
    /Card
/uiwire
```
````

This works immediately with extensions like **Markdown Preview Mermaid Support** without any additional configuration.

---

## 6. File Association Configuration

### 6.1 VSCode Settings

```json
// .vscode/settings.json
{
    "files.associations": {
        "*.uimmd": "uimmd"
    },
    "editor.tokenColorCustomizations": {
        "textMateRules": [
            {
                "scope": "keyword.control.uimmd",
                "settings": {
                    "foreground": "#569cd6",
                    "fontStyle": "bold"
                }
            },
            {
                "scope": "entity.name.type.uimmd",
                "settings": {
                    "foreground": "#4ec9b0"
                }
            },
            {
                "scope": "string.quoted.double.uimmd",
                "settings": {
                    "foreground": "#ce9178"
                }
            },
            {
                "scope": "variable.name.uimmd",
                "settings": {
                    "foreground": "#9cdcfe"
                }
            }
        ]
    }
}
```

### 6.2 Workspace Configuration

```json
// .vscode/settings.json (workspace)
{
    "uimmd.preview.theme": "auto",
    "uimmd.preview.refreshDelay": 300,
    "uimmd.validation.enabled": true,
    "[uimmd]": {
        "editor.tabSize": 4,
        "editor.insertSpaces": true,
        "editor.formatOnSave": true,
        "editor.wordWrap": "off"
    }
}
```

---

## 7. CI/CD Integration

### 7.1 GitHub Actions for UIMMD Validation

```yaml
# .github/workflows/uimmd-validate.yml
name: Validate UIMMD Files

on:
  push:
    paths:
      - '**/*.uimmd'
  pull_request:
    paths:
      - '**/*.uimmd'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install UIMMD CLI
        run: npm install -g @uimmd/cli
      
      - name: Validate UIMMD files
        run: |
          find . -name "*.uimmd" -exec uimmd validate {} \;
      
      - name: Render UIMMD files
        run: |
          mkdir -p output
          find . -name "*.uimmd" -exec sh -c 'uimmd render "$1" -o "output/$(basename "$1" .uimmd).svg"' _ {} \;
      
      - name: Upload rendered wireframes
        uses: actions/upload-artifact@v4
        with:
          name: wireframes
          path: output/
```

---

## 8. Troubleshooting

### 8.1 Common Issues

| Issue | Solution |
|-------|----------|
| Mermaid not detecting UIMMD | Ensure `@uimmd/mermaid-plugin` is imported before Mermaid initializes |
| Preview not updating | Check `uimmd.preview.refreshDelay` setting |
| Syntax highlighting not working | Verify file association in settings |
| CLI command not found | Ensure global npm bin is in PATH |

### 8.2 Debug Mode

```json
// .vscode/settings.json
{
    "uimmd.debug.enabled": true,
    "uimmd.debug.logLevel": "verbose"
}
```

---

## 9. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [21_Mermaid_Integration_Design](./21_Mermaid_Integration_Design.md) | Mermaid plugin details |
| [24_VSCode_Extension_Design](./24_VSCode_Extension_Design.md) | Extension architecture |
| [27_API_Reference](./27_API_Reference.md) | Public API documentation |
| [29_Implementation_Roadmap](./29_Implementation_Roadmap.md) | Implementation plan |

---

*UIMMD Integration Guide v1.0 - 2025*
