# VS Code Extension Design

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Package:** `wireframe-vscode`

---

## 1. Overview

The Wireframe VS Code Extension provides IDE support for `.wire` files including:

- Syntax highlighting
- Live preview
- Error diagnostics
- Export commands
- Code snippets
- Outline view

---

## 2. Extension Features

| Feature | Description |
|---------|-------------|
| **Syntax Highlighting** | TextMate grammar for colorized code |
| **Live Preview** | Real-time SVG preview panel |
| **Diagnostics** | Inline error and warning markers |
| **Commands** | Export to SVG, PNG, PDF |
| **Snippets** | Quick insertion of common patterns |
| **Outline** | Document structure navigation |
| **Formatting** | Code formatting support |

---

## 3. Extension Structure

```
packages/vscode-extension/
├── src/
│   └── extension.ts           # Extension entry point
├── syntaxes/
│   └── wireframe.tmLanguage.json  # TextMate grammar
├── snippets/
│   └── wireframe.json         # Code snippets
├── language-configuration.json
├── package.json               # Extension manifest
├── tsconfig.json
└── README.md
```

---

## 4. Extension Manifest (package.json)

### 4.1 Basic Information

```json
{
  "name": "wireframe-vscode",
  "displayName": "Wireframe",
  "description": "Wireframe DSL language support",
  "version": "1.0.0",
  "publisher": "jonkeda",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "Programming Languages",
    "Visualization"
  ],
  "activationEvents": [
    "onLanguage:wireframe"
  ],
  "main": "./out/extension.js"
}
```

### 4.2 Contributes

```json
{
  "contributes": {
    "languages": [{
      "id": "wireframe",
      "aliases": ["Wireframe", "wire"],
      "extensions": [".wire"],
      "configuration": "./language-configuration.json"
    }],
    
    "grammars": [{
      "language": "wireframe",
      "scopeName": "source.wireframe",
      "path": "./syntaxes/wireframe.tmLanguage.json"
    }],
    
    "snippets": [{
      "language": "wireframe",
      "path": "./snippets/wireframe.json"
    }],
    
    "commands": [
      {
        "command": "wireframe.preview",
        "title": "Open Preview",
        "category": "Wireframe"
      },
      {
        "command": "wireframe.exportSvg",
        "title": "Export to SVG",
        "category": "Wireframe"
      },
      {
        "command": "wireframe.exportPng",
        "title": "Export to PNG",
        "category": "Wireframe"
      }
    ],
    
    "menus": {
      "editor/title": [{
        "command": "wireframe.preview",
        "when": "resourceLangId == wireframe",
        "group": "navigation"
      }],
      "editor/context": [
        {
          "command": "wireframe.exportSvg",
          "when": "resourceLangId == wireframe",
          "group": "wireframe"
        },
        {
          "command": "wireframe.exportPng",
          "when": "resourceLangId == wireframe",
          "group": "wireframe"
        }
      ]
    },
    
    "keybindings": [{
      "command": "wireframe.preview",
      "key": "ctrl+shift+v",
      "mac": "cmd+shift+v",
      "when": "resourceLangId == wireframe"
    }]
  }
}
```

---

## 5. TextMate Grammar

### 5.1 Grammar Structure

```json
{
  "name": "Wireframe",
  "scopeName": "source.wireframe",
  "patterns": [
    { "include": "#comments" },
    { "include": "#wireframe" },
    { "include": "#layouts" },
    { "include": "#sections" },
    { "include": "#controls" },
    { "include": "#components" },
    { "include": "#modifiers" },
    { "include": "#attributes" },
    { "include": "#strings" },
    { "include": "#special" }
  ],
  "repository": {
    // Pattern definitions
  }
}
```

### 5.2 Key Patterns

#### Document Declaration

```json
{
  "wireframe": {
    "match": "\\b(wireframe)\\s+(clean|sketch|blueprint|realistic)?",
    "captures": {
      "1": { "name": "keyword.control.wireframe" },
      "2": { "name": "support.constant.style.wireframe" }
    }
  }
}
```

#### Layouts

```json
{
  "layouts": {
    "match": "\\b(Grid|Vertical|Horizontal|Dock|Canvas|Scroll)\\b",
    "name": "keyword.control.layout.wireframe"
  }
}
```

#### Sections

```json
{
  "sections": {
    "match": "\\b(Header|Footer|Sidebar|Content|Panel|Card|Toolbar|StatusBar|Modal|Drawer)\\b",
    "name": "keyword.control.section.wireframe"
  }
}
```

#### Controls

```json
{
  "controls": {
    "match": "\\b(Button|IconButton|TextInput|NumberInput|DateInput|PasswordInput|TextArea|Label|Heading|Link|Checkbox|Radio|Dropdown|Option|Separator|Spacer|Icon|Image|Avatar|Badge|Progress|Slider|Switch|Chip|Pagination|Toast|Skeleton)\\b",
    "name": "entity.name.type.control.wireframe"
  }
}
```

#### Components

```json
{
  "components": {
    "match": "\\b(Tabs|Tab|Expander|Tree|TreeItem|List|Menu|MenuItem|Hamburger|Breadcrumb|BreadcrumbItem|Accordion|AccordionSection|Stepper|Step|Dialog|Alert|Hover|Table|DataGrid|Column)\\b",
    "name": "entity.name.type.component.wireframe"
  }
}
```

#### Modifiers

```json
{
  "modifiers": {
    "match": "\\b(primary|secondary|required|disabled|checked|selected|readonly|editable|active|expanded|removable|circle|indeterminate|completed|border)\\b",
    "name": "keyword.other.modifier.wireframe"
  }
}
```

#### Special Prefixes

```json
{
  "special": {
    "patterns": [
      {
        "match": ":[a-zA-Z_][a-zA-Z0-9_-]*",
        "name": "variable.other.id.wireframe"
      },
      {
        "match": "\\?[a-zA-Z_][a-zA-Z0-9_.]*",
        "name": "variable.other.binding.wireframe"
      },
      {
        "match": "@[a-zA-Z_][a-zA-Z0-9_/]*",
        "name": "variable.other.navigation.wireframe"
      },
      {
        "match": "\\$icon:[a-zA-Z_][a-zA-Z0-9_]*",
        "name": "constant.other.icon.wireframe"
      },
      {
        "match": "%[a-zA-Z_][a-zA-Z0-9_]*:",
        "name": "keyword.other.docattr.wireframe"
      }
    ]
  }
}
```

---

## 6. Language Configuration

### 6.1 language-configuration.json

```json
{
  "comments": {
    "lineComment": "//",
    "blockComment": ["/*", "*/"]
  },
  "brackets": [
    ["(", ")"],
    ["[", "]"]
  ],
  "autoClosingPairs": [
    { "open": "\"", "close": "\"" },
    { "open": "'", "close": "'" },
    { "open": "(", "close": ")" },
    { "open": "[", "close": "]" }
  ],
  "surroundingPairs": [
    { "open": "\"", "close": "\"" },
    { "open": "'", "close": "'" }
  ],
  "indentationRules": {
    "increaseIndentPattern": "^\\s*(wireframe|Grid|Vertical|Horizontal|Dock|Canvas|Scroll|Header|Footer|Sidebar|Content|Panel|Card|Toolbar|StatusBar|Modal|Drawer|Tabs|Tab|Expander|Tree|TreeItem|Menu|MenuItem|Hamburger|Breadcrumb|Accordion|AccordionSection|Stepper|Dialog|Alert|Hover|Table|DataGrid|Dropdown|Repeat)\\b.*$",
    "decreaseIndentPattern": "^\\s*/.*$"
  },
  "folding": {
    "markers": {
      "start": "^\\s*(wireframe|Grid|Vertical|Horizontal|Dock|Canvas|Scroll|Header|Footer|Sidebar|Content|Panel|Card|Tabs|Tab|Menu|Accordion|Dialog|Table|DataGrid)\\b",
      "end": "^\\s*/\\w+"
    }
  }
}
```

---

## 7. Extension Implementation

### 7.1 Extension Entry Point

```typescript
import * as vscode from 'vscode';
import { parse } from '@jonkeda/wireframe-core';

let previewPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
  // Register preview command
  context.subscriptions.push(
    vscode.commands.registerCommand('wireframe.preview', () => {
      openPreview(context);
    })
  );
  
  // Register export commands
  context.subscriptions.push(
    vscode.commands.registerCommand('wireframe.exportSvg', () => {
      exportToSvg();
    })
  );
  
  context.subscriptions.push(
    vscode.commands.registerCommand('wireframe.exportPng', () => {
      exportToPng();
    })
  );
  
  // Register diagnostics
  const diagnostics = vscode.languages.createDiagnosticCollection('wireframe');
  context.subscriptions.push(diagnostics);
  
  // Update diagnostics on document change
  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.languageId === 'wireframe') {
        updateDiagnostics(e.document, diagnostics);
      }
    })
  );
  
  // Update diagnostics on open
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument((document) => {
      if (document.languageId === 'wireframe') {
        updateDiagnostics(document, diagnostics);
      }
    })
  );
  
  console.log('Wireframe extension activated');
}

export function deactivate() {
  if (previewPanel) {
    previewPanel.dispose();
  }
}
```

### 7.2 Preview Panel

```typescript
function openPreview(context: vscode.ExtensionContext) {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'wireframe') {
    vscode.window.showWarningMessage('Open a .wire file to preview');
    return;
  }
  
  if (previewPanel) {
    previewPanel.reveal();
  } else {
    previewPanel = vscode.window.createWebviewPanel(
      'wireframePreview',
      'Wireframe Preview',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );
    
    previewPanel.onDidDispose(() => {
      previewPanel = undefined;
    });
  }
  
  updatePreview(editor.document);
  
  // Update on changes
  vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document === editor.document) {
      updatePreview(e.document);
    }
  });
}

function updatePreview(document: vscode.TextDocument) {
  if (!previewPanel) return;
  
  const source = document.getText();
  const { document: ast, errors } = parse(source);
  
  if (ast && errors.length === 0) {
    const { svg } = render(ast);
    previewPanel.webview.html = getPreviewHtml(svg);
  } else {
    previewPanel.webview.html = getErrorHtml(errors);
  }
}

function getPreviewHtml(svg: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 16px;
          display: flex;
          justify-content: center;
          background: #f5f5f5;
        }
        .preview {
          background: white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 16px;
        }
      </style>
    </head>
    <body>
      <div class="preview">
        ${svg}
      </div>
    </body>
    </html>
  `;
}
```

### 7.3 Diagnostics

```typescript
function updateDiagnostics(
  document: vscode.TextDocument,
  collection: vscode.DiagnosticCollection
) {
  const source = document.getText();
  const { errors } = parse(source);
  
  const diagnostics: vscode.Diagnostic[] = errors.map((error) => {
    const range = new vscode.Range(
      error.location.line - 1,
      error.location.column - 1,
      error.location.line - 1,
      error.location.column + 10
    );
    
    return new vscode.Diagnostic(
      range,
      error.message,
      vscode.DiagnosticSeverity.Error
    );
  });
  
  collection.set(document.uri, diagnostics);
}
```

### 7.4 Export Functions

```typescript
async function exportToSvg() {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== 'wireframe') {
    return;
  }
  
  const source = editor.document.getText();
  const { document: ast, errors } = parse(source);
  
  if (!ast || errors.length > 0) {
    vscode.window.showErrorMessage('Cannot export: document has errors');
    return;
  }
  
  const { svg } = render(ast);
  
  const defaultPath = editor.document.uri.fsPath.replace('.wire', '.svg');
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file(defaultPath),
    filters: { 'SVG Files': ['svg'] },
  });
  
  if (uri) {
    await vscode.workspace.fs.writeFile(
      uri,
      Buffer.from(svg, 'utf-8')
    );
    vscode.window.showInformationMessage(`Exported to ${uri.fsPath}`);
  }
}

async function exportToPng() {
  // Similar to SVG export, but converts SVG to PNG
  // May use sharp, canvas, or other libraries
}
```

---

## 8. Code Snippets

### 8.1 Snippet Definitions

```json
{
  "Wireframe Document": {
    "prefix": "wireframe",
    "body": [
      "wireframe ${1:clean}",
      "    %title: ${2:Document Title}",
      "    ",
      "    $0",
      "/wireframe"
    ],
    "description": "Create a new wireframe document"
  },
  
  "Vertical Layout": {
    "prefix": "vertical",
    "body": [
      "Vertical gap=${1:16}",
      "    $0",
      "/Vertical"
    ],
    "description": "Vertical stack layout"
  },
  
  "Horizontal Layout": {
    "prefix": "horizontal",
    "body": [
      "Horizontal gap=${1:8}",
      "    $0",
      "/Horizontal"
    ],
    "description": "Horizontal stack layout"
  },
  
  "Card": {
    "prefix": "card",
    "body": [
      "Card",
      "    Heading \"${1:Card Title}\" level=2",
      "    $0",
      "/Card"
    ],
    "description": "Card component"
  },
  
  "Form": {
    "prefix": "form",
    "body": [
      "Vertical gap=16",
      "    TextInput \"${1:Name}\" ?${2:name} required",
      "    TextInput \"${3:Email}\" ?${4:email}",
      "    Horizontal gap=8",
      "        Button \"Cancel\" secondary",
      "        Button \"Submit\" primary",
      "    /Horizontal",
      "/Vertical"
    ],
    "description": "Basic form layout"
  },
  
  "Button Primary": {
    "prefix": "buttonp",
    "body": "Button \"${1:Click Me}\" primary",
    "description": "Primary button"
  },
  
  "Table": {
    "prefix": "table",
    "body": [
      "Table",
      "    | ${1:Column 1} | ${2:Column 2} | ${3:Column 3} |",
      "    |---|---|---|",
      "    | ${4:Data 1} | ${5:Data 2} | ${6:Data 3} |",
      "/Table"
    ],
    "description": "Basic table"
  },
  
  "Tabs": {
    "prefix": "tabs",
    "body": [
      "Tabs",
      "    Tab \"${1:Tab 1}\" active",
      "        $0",
      "    /Tab",
      "    Tab \"${2:Tab 2}\"",
      "        ",
      "    /Tab",
      "/Tabs"
    ],
    "description": "Tab container"
  },
  
  "Header": {
    "prefix": "header",
    "body": [
      "Header height=64",
      "    Horizontal",
      "        Heading \"${1:App Name}\" level=1",
      "        Spacer",
      "        Avatar \"${2:JD}\" circle",
      "    /Horizontal",
      "/Header"
    ],
    "description": "Page header"
  }
}
```

---

## 9. Outline Provider

```typescript
class WireframeOutlineProvider implements vscode.DocumentSymbolProvider {
  provideDocumentSymbols(
    document: vscode.TextDocument
  ): vscode.DocumentSymbol[] {
    const source = document.getText();
    const { document: ast } = parse(source);
    
    if (!ast) return [];
    
    return this.buildSymbols(ast.children, document);
  }
  
  private buildSymbols(
    nodes: ElementNode[],
    document: vscode.TextDocument
  ): vscode.DocumentSymbol[] {
    return nodes.map((node) => {
      const range = new vscode.Range(
        node.start.line - 1,
        node.start.column - 1,
        node.end.line - 1,
        node.end.column - 1
      );
      
      const name = this.getNodeName(node);
      const kind = this.getSymbolKind(node);
      
      const symbol = new vscode.DocumentSymbol(
        name,
        '',
        kind,
        range,
        range
      );
      
      if ('children' in node && node.children) {
        symbol.children = this.buildSymbols(node.children, document);
      }
      
      return symbol;
    });
  }
  
  private getNodeName(node: ElementNode): string {
    if (isLayoutNode(node)) return node.layoutType;
    if (isSectionNode(node)) return node.sectionType;
    if (isControlNode(node)) return `${node.controlType}${node.text ? `: ${node.text}` : ''}`;
    if (isComponentNode(node)) return `${node.componentType}${node.text ? `: ${node.text}` : ''}`;
    return node.type;
  }
  
  private getSymbolKind(node: ElementNode): vscode.SymbolKind {
    if (isLayoutNode(node)) return vscode.SymbolKind.Namespace;
    if (isSectionNode(node)) return vscode.SymbolKind.Module;
    if (isControlNode(node)) return vscode.SymbolKind.Field;
    if (isComponentNode(node)) return vscode.SymbolKind.Class;
    return vscode.SymbolKind.Variable;
  }
}
```

---

## 10. Configuration Options

```json
{
  "contributes": {
    "configuration": {
      "title": "Wireframe",
      "properties": {
        "wireframe.defaultTheme": {
          "type": "string",
          "default": "clean",
          "enum": ["clean", "sketch", "blueprint", "realistic"],
          "description": "Default theme for wireframe preview"
        },
        "wireframe.previewAutoRefresh": {
          "type": "boolean",
          "default": true,
          "description": "Auto-refresh preview on document changes"
        },
        "wireframe.exportScale": {
          "type": "number",
          "default": 1,
          "description": "Scale factor for PNG export"
        },
        "wireframe.showOutline": {
          "type": "boolean",
          "default": true,
          "description": "Show document outline in explorer"
        }
      }
    }
  }
}
```

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Language reference |
| [06_Component_Library](./06_Component_Library.md) | UI components |

---

*VS Code Extension Design v1.0 - December 2025*
