# VSCode Extension Design

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document describes the VSCode extension for UIMMD, providing:
- Live preview of `.uimmd` files
- Syntax highlighting
- IntelliSense (auto-completion, hover, diagnostics)
- Code navigation
- Snippets

---

## 2. Extension Architecture

### 2.1 Component Overview

```
...................................................................
.                    VSCode Extension                              .
...................................................................
.                                                                  .
.  ...........................................................   .
.  .                    Extension Host                        .   .
.  .  .............  .............  .....................   .   .
.  .  . Language  .  .  Preview  .  .     Commands      .   .   .
.  .  .  Server   .  .  Provider .  .                   .   .   .
.  .  .............  .............  .....................   .   .
.  ...........................................................   .
.                              .                                   .
.  ...........................................................   .
.  .                    UIMMD Core                            .   .
.  .  ...........  ............  ............               .   .
.  .  . Parser  .  . Renderer .  .  Themes  .               .   .
.  .  ...........  ............  ............               .   .
.  ...........................................................   .
.                                                                  .
.  ...........................................................   .
.  .                    Webview Panel                         .   .
.  .  .....................................................  .   .
.  .  .                 Preview Content                    .  .   .
.  .  .                    (SVG)                           .  .   .
.  .  .....................................................  .   .
.  ...........................................................   .
.                                                                  .
...................................................................
```

### 2.2 File Structure

```
uimmd-vscode/
... src/
.   ... extension.ts              # Extension entry point
.   ... language/
.   .   ... server.ts             # Language server
.   .   ... completion.ts         # Auto-completion
.   .   ... hover.ts              # Hover information
.   .   ... diagnostics.ts        # Error diagnostics
.   .   ... symbols.ts            # Document symbols
.   .   ... folding.ts            # Code folding
.   ... preview/
.   .   ... provider.ts           # Webview provider
.   .   ... controller.ts         # Preview controller
.   .   ... html/
.   .       ... preview.html      # Preview template
.   .       ... styles.css        # Preview styles
.   ... commands/
.   .   ... export.ts             # Export commands
.   .   ... insert.ts             # Insert snippets
.   .   ... format.ts             # Format document
.   ... utils/
.       ... debounce.ts
.       ... config.ts
... syntaxes/
.   ... uimmd.tmLanguage.json     # Syntax highlighting
... snippets/
.   ... uimmd.json                # Code snippets
... media/
.   ... icon.png                  # Extension icon
.   ... preview.js                # Preview script
... package.json                   # Extension manifest
... tsconfig.json
... README.md
```

---

## 3. Extension Manifest

### 3.1 package.json

```json
{
    "name": "uimmd",
    "displayName": "UIMMD Wireframes",
    "description": "UI wireframe language with live preview",
    "version": "1.0.0",
    "publisher": "uimmd",
    "icon": "media/icon.png",
    "engines": {
        "vscode": "^1.80.0"
    },
    "categories": [
        "Programming Languages",
        "Visualization"
    ],
    "keywords": [
        "uimmd",
        "wireframe",
        "ui",
        "mockup",
        "diagram"
    ],
    "activationEvents": [
        "onLanguage:uimmd",
        "onCommand:uimmd.preview"
    ],
    "main": "./dist/extension.js",
    "contributes": {
        "languages": [
            {
                "id": "uimmd",
                "aliases": ["UIMMD", "uimmd", "UIWire"],
                "extensions": [".uimmd"],
                "configuration": "./language-configuration.json",
                "icon": {
                    "light": "./media/icon.png",
                    "dark": "./media/icon.png"
                }
            }
        ],
        "grammars": [
            {
                "language": "uimmd",
                "scopeName": "source.uimmd",
                "path": "./syntaxes/uimmd.tmLanguage.json"
            }
        ],
        "snippets": [
            {
                "language": "uimmd",
                "path": "./snippets/uimmd.json"
            }
        ],
        "commands": [
            {
                "command": "uimmd.preview",
                "title": "Open Preview",
                "category": "UIMMD",
                "icon": "$(open-preview)"
            },
            {
                "command": "uimmd.previewSide",
                "title": "Open Preview to Side",
                "category": "UIMMD",
                "icon": "$(open-preview)"
            },
            {
                "command": "uimmd.export.png",
                "title": "Export as PNG",
                "category": "UIMMD"
            },
            {
                "command": "uimmd.export.svg",
                "title": "Export as SVG",
                "category": "UIMMD"
            },
            {
                "command": "uimmd.insertSnippet",
                "title": "Insert Component",
                "category": "UIMMD"
            },
            {
                "command": "uimmd.format",
                "title": "Format Document",
                "category": "UIMMD"
            }
        ],
        "menus": {
            "editor/title": [
                {
                    "command": "uimmd.previewSide",
                    "when": "editorLangId == uimmd",
                    "group": "navigation"
                }
            ],
            "editor/context": [
                {
                    "command": "uimmd.preview",
                    "when": "editorLangId == uimmd",
                    "group": "navigation"
                },
                {
                    "command": "uimmd.insertSnippet",
                    "when": "editorLangId == uimmd",
                    "group": "1_modification"
                }
            ],
            "commandPalette": [
                {
                    "command": "uimmd.preview",
                    "when": "editorLangId == uimmd"
                },
                {
                    "command": "uimmd.export.png",
                    "when": "editorLangId == uimmd"
                },
                {
                    "command": "uimmd.export.svg",
                    "when": "editorLangId == uimmd"
                }
            ]
        },
        "keybindings": [
            {
                "command": "uimmd.previewSide",
                "key": "ctrl+shift+v",
                "mac": "cmd+shift+v",
                "when": "editorLangId == uimmd"
            },
            {
                "command": "uimmd.format",
                "key": "shift+alt+f",
                "when": "editorLangId == uimmd"
            }
        ],
        "configuration": {
            "title": "UIMMD",
            "properties": {
                "uimmd.preview.theme": {
                    "type": "string",
                    "default": "auto",
                    "enum": ["auto", "sketch", "clean", "blueprint", "realistic"],
                    "description": "Default preview theme"
                },
                "uimmd.preview.refreshDelay": {
                    "type": "number",
                    "default": 300,
                    "description": "Delay before refreshing preview (ms)"
                },
                "uimmd.preview.showGrid": {
                    "type": "boolean",
                    "default": false,
                    "description": "Show alignment grid in preview"
                },
                "uimmd.preview.showIds": {
                    "type": "boolean",
                    "default": false,
                    "description": "Show element IDs in preview"
                },
                "uimmd.editor.formatOnSave": {
                    "type": "boolean",
                    "default": false,
                    "description": "Format document on save"
                },
                "uimmd.validation.enabled": {
                    "type": "boolean",
                    "default": true,
                    "description": "Enable real-time validation"
                }
            }
        }
    },
    "scripts": {
        "vscode:prepublish": "npm run compile",
        "compile": "tsc -p ./",
        "watch": "tsc -watch -p ./",
        "package": "vsce package",
        "publish": "vsce publish"
    },
    "devDependencies": {
        "@types/vscode": "^1.80.0",
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0",
        "vsce": "^2.15.0"
    },
    "dependencies": {
        "@uimmd/core": "^1.0.0",
        "vscode-languageclient": "^9.0.0",
        "vscode-languageserver": "^9.0.0"
    }
}
```

---

## 4. Extension Entry Point

### 4.1 Activation

```typescript
// src/extension.ts

import * as vscode from 'vscode';
import { UimmdPreviewProvider } from './preview/provider';
import { UimmdLanguageClient } from './language/client';
import { registerCommands } from './commands';

let languageClient: UimmdLanguageClient;
let previewProvider: UimmdPreviewProvider;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
    console.log('UIMMD extension activating...');

    // Initialize language client
    languageClient = new UimmdLanguageClient(context);
    await languageClient.start();

    // Initialize preview provider
    previewProvider = new UimmdPreviewProvider(context);

    // Register preview panel
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'uimmd.preview',
            previewProvider
        )
    );

    // Register commands
    registerCommands(context, previewProvider);

    // Register document change listener for live preview
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'uimmd') {
                previewProvider.update(event.document);
            }
        })
    );

    // Register active editor change listener
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor..document.languageId === 'uimmd') {
                previewProvider.update(editor.document);
            }
        })
    );

    console.log('UIMMD extension activated');
}

export function deactivate(): Thenable<void> | undefined {
    if (languageClient) {
        return languageClient.stop();
    }
    return undefined;
}
```

---

## 5. Preview Provider

### 5.1 Webview Provider

```typescript
// src/preview/provider.ts

import * as vscode from 'vscode';
import { parse, render, Theme, getTheme } from '@uimmd/core';
import { debounce } from '../utils/debounce';

export class UimmdPreviewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'uimmd.preview';
    
    private _view.: vscode.WebviewView;
    private _document.: vscode.TextDocument;
    private _context: vscode.ExtensionContext;
    
    private updatePreview = debounce(this._updatePreview.bind(this), 300);

    constructor(context: vscode.ExtensionContext) {
        this._context = context;
    }

    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this._context.extensionUri, 'media')
            ]
        };

        // Set initial content
        webviewView.webview.html = this.getLoadingHtml();

        // Handle messages from webview
        webviewView.webview.onDidReceiveMessage(message => {
            this.handleMessage(message);
        });

        // Update with current document
        const editor = vscode.window.activeTextEditor;
        if (editor..document.languageId === 'uimmd') {
            this.update(editor.document);
        }
    }

    update(document: vscode.TextDocument): void {
        this._document = document;
        this.updatePreview();
    }

    private async _updatePreview(): Promise<void> {
        if (!this._view || !this._document) return;

        const text = this._document.getText();
        const config = vscode.workspace.getConfiguration('uimmd.preview');

        try {
            // Parse document
            const ast = parse(text);

            // Get theme
            const themeName = config.get<string>('theme') === 'auto' 
                . ast.style 
                : config.get<string>('theme');
            const theme = getTheme(themeName || 'clean');

            // Render SVG
            const svg = render(ast, {
                theme,
                showIds: config.get<boolean>('showIds'),
                showGrid: config.get<boolean>('showGrid')
            });

            // Update webview
            this._view.webview.html = this.getPreviewHtml(svg, theme);

        } catch (error) {
            this._view.webview.html = this.getErrorHtml(error as Error);
        }
    }

    private getPreviewHtml(svg: string, theme: Theme): string {
        const styleUri = this._view!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._context.extensionUri, 'media', 'preview.css')
        );
        const scriptUri = this._view!.webview.asWebviewUri(
            vscode.Uri.joinPath(this._context.extensionUri, 'media', 'preview.js')
        );

        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" 
          content="default-src 'none'; style-src ${this._view!.webview.cspSource} 'unsafe-inline'; 
                   script-src ${this._view!.webview.cspSource}; img-src ${this._view!.webview.cspSource} data:;">
    <link href="${styleUri}" rel="stylesheet">
    <title>UIMMD Preview</title>
    <style>
        :root {
            --uimmd-bg: ${theme.backgroundColor};
            --uimmd-text: ${theme.textColor};
        }
        body {
            background: var(--vscode-editor-background);
            padding: 20px;
            display: flex;
            justify-content: center;
        }
        .preview-container {
            background: var(--uimmd-bg);
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            overflow: auto;
            max-width: 100%;
        }
    </style>
</head>
<body>
    <div class="preview-container">
        ${svg}
    </div>
    <script src="${scriptUri}"></script>
</body>
</html>`;
    }

    private getLoadingHtml(): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: var(--vscode-foreground);
            font-family: var(--vscode-font-family);
        }
    </style>
</head>
<body>
    <div>Loading preview...</div>
</body>
</html>`;
    }

    private getErrorHtml(error: Error): string {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            padding: 20px;
            color: var(--vscode-errorForeground);
            font-family: var(--vscode-font-family);
        }
        .error-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .error-message {
            background: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: var(--vscode-editor-font-family);
        }
    </style>
</head>
<body>
    <div class="error-title">Parse Error</div>
    <div class="error-message">${this.escapeHtml(error.message)}</div>
</body>
</html>`;
    }

    private handleMessage(message: any): void {
        switch (message.command) {
            case 'elementClicked':
                this.highlightElement(message.id);
                break;
            case 'export':
                this.exportAs(message.format);
                break;
        }
    }

    private highlightElement(id: string): void {
        if (!this._document) return;
        
        // Find element in source and select it
        const text = this._document.getText();
        const match = text.match(new RegExp(`:${id}\\b`));
        if (match && match.index !== undefined) {
            const pos = this._document.positionAt(match.index);
            const editor = vscode.window.visibleTextEditors.find(
                e => e.document === this._document
            );
            if (editor) {
                editor.selection = new vscode.Selection(pos, pos);
                editor.revealRange(new vscode.Range(pos, pos));
            }
        }
    }

    private async exportAs(format: 'svg' | 'png'): Promise<void> {
        // Export implementation
    }

    private escapeHtml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
}
```

### 5.2 Preview Panel Command

```typescript
// src/preview/controller.ts

import * as vscode from 'vscode';
import { UimmdPreviewProvider } from './provider';

export class PreviewController {
    private panels: Map<string, vscode.WebviewPanel> = new Map();

    constructor(private context: vscode.ExtensionContext) {}

    openPreview(document: vscode.TextDocument, side: boolean = false): void {
        const key = document.uri.toString();

        // Check if panel already exists
        if (this.panels.has(key)) {
            this.panels.get(key)!.reveal();
            return;
        }

        // Create new panel
        const panel = vscode.window.createWebviewPanel(
            'uimmd.preview',
            `Preview: ${this.getFileName(document)}`,
            side . vscode.ViewColumn.Beside : vscode.ViewColumn.Active,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'media')
                ]
            }
        );

        // Track panel
        this.panels.set(key, panel);

        // Handle panel disposal
        panel.onDidDispose(() => {
            this.panels.delete(key);
        });

        // Initial render
        this.updatePanel(panel, document);

        // Watch for changes
        const changeDisposable = vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document === document) {
                this.updatePanel(panel, document);
            }
        });

        panel.onDidDispose(() => {
            changeDisposable.dispose();
        });
    }

    private updatePanel(panel: vscode.WebviewPanel, document: vscode.TextDocument): void {
        // Render and update panel HTML
    }

    private getFileName(document: vscode.TextDocument): string {
        return document.uri.path.split('/').pop() || 'Untitled';
    }
}
```

---

## 6. Language Server

### 6.1 Language Client

```typescript
// src/language/client.ts

import * as vscode from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind
} from 'vscode-languageclient/node';

export class UimmdLanguageClient {
    private client: LanguageClient;

    constructor(context: vscode.ExtensionContext) {
        const serverModule = context.asAbsolutePath('dist/language/server.js');
        
        const serverOptions: ServerOptions = {
            run: { module: serverModule, transport: TransportKind.ipc },
            debug: { 
                module: serverModule, 
                transport: TransportKind.ipc,
                options: { execArgv: ['--nolazy', '--inspect=6009'] }
            }
        };

        const clientOptions: LanguageClientOptions = {
            documentSelector: [{ scheme: 'file', language: 'uimmd' }],
            synchronize: {
                fileEvents: vscode.workspace.createFileSystemWatcher('**/*.uimmd')
            }
        };

        this.client = new LanguageClient(
            'uimmd',
            'UIMMD Language Server',
            serverOptions,
            clientOptions
        );
    }

    async start(): Promise<void> {
        await this.client.start();
    }

    async stop(): Promise<void> {
        await this.client.stop();
    }
}
```

### 6.2 Language Server

```typescript
// src/language/server.ts

import {
    createConnection,
    TextDocuments,
    ProposedFeatures,
    InitializeParams,
    TextDocumentSyncKind,
    CompletionItem,
    CompletionItemKind,
    Hover,
    Diagnostic,
    DiagnosticSeverity,
    TextDocumentPositionParams
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { parse, validate, ParseError } from '@uimmd/core';

const connection = createConnection(ProposedFeatures.all);
const documents = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
    return {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Incremental,
            completionProvider: {
                resolveProvider: true,
                triggerCharacters: ['$', ':', '.', '@', '"']
            },
            hoverProvider: true,
            definitionProvider: true,
            documentSymbolProvider: true,
            foldingRangeProvider: true,
            documentFormattingProvider: true
        }
    };
});

// Validation on document change
documents.onDidChangeContent(change => {
    validateDocument(change.document);
});

async function validateDocument(document: TextDocument): Promise<void> {
    const text = document.getText();
    const diagnostics: Diagnostic[] = [];

    try {
        const ast = parse(text);
        const errors = validate(ast);

        for (const error of errors) {
            diagnostics.push({
                severity: error.severity === 'error' 
                    . DiagnosticSeverity.Error 
                    : DiagnosticSeverity.Warning,
                range: {
                    start: document.positionAt(error.location.start.offset),
                    end: document.positionAt(error.location.end.offset)
                },
                message: error.message,
                source: 'uimmd'
            });
        }
    } catch (error) {
        if (error instanceof ParseError) {
            diagnostics.push({
                severity: DiagnosticSeverity.Error,
                range: {
                    start: document.positionAt(0),
                    end: document.positionAt(text.length)
                },
                message: error.message,
                source: 'uimmd'
            });
        }
    }

    connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

// Start server
documents.listen(connection);
connection.listen();
```

### 6.3 Auto-Completion

```typescript
// src/language/completion.ts

import {
    CompletionItem,
    CompletionItemKind,
    InsertTextFormat
} from 'vscode-languageserver';

const KEYWORDS: CompletionItem[] = [
    // Layouts
    { label: 'Vertical', kind: CompletionItemKind.Keyword, 
      insertText: 'Vertical gap=${1:8}\n\t$0\n/Vertical', 
      insertTextFormat: InsertTextFormat.Snippet },
    { label: 'Horizontal', kind: CompletionItemKind.Keyword,
      insertText: 'Horizontal gap=${1:8}\n\t$0\n/Horizontal',
      insertTextFormat: InsertTextFormat.Snippet },
    { label: 'Grid', kind: CompletionItemKind.Keyword,
      insertText: 'Grid rows=${1:2} cols=${2:2} gap=${3:16}\n\t$0\n/Grid',
      insertTextFormat: InsertTextFormat.Snippet },
    
    // Controls
    { label: 'Button', kind: CompletionItemKind.Class,
      insertText: 'Button "${1:Text}" ${2::btnId}',
      insertTextFormat: InsertTextFormat.Snippet },
    { label: 'TextInput', kind: CompletionItemKind.Class,
      insertText: 'TextInput "${1:placeholder}" ${2::txtId}',
      insertTextFormat: InsertTextFormat.Snippet },
    { label: 'Label', kind: CompletionItemKind.Class,
      insertText: 'Label "${1:Text}"',
      insertTextFormat: InsertTextFormat.Snippet },
    { label: 'Checkbox', kind: CompletionItemKind.Class,
      insertText: 'Checkbox "${1:Label}" ${2::chkId}',
      insertTextFormat: InsertTextFormat.Snippet },
    
    // Sections
    { label: 'Card', kind: CompletionItemKind.Module,
      insertText: 'Card\n\t$0\n/Card',
      insertTextFormat: InsertTextFormat.Snippet },
    { label: 'Panel', kind: CompletionItemKind.Module,
      insertText: 'Panel ${1::pnlId}\n\t$0\n/Panel',
      insertTextFormat: InsertTextFormat.Snippet },
    
    // Components
    { label: 'Tabs', kind: CompletionItemKind.Module,
      insertText: 'Tabs ${1::tabId}\n\tTab "${2:Tab 1}"\n\t\t$0\n\t/Tab\n/Tabs',
      insertTextFormat: InsertTextFormat.Snippet },
];

const ICONS: CompletionItem[] = [
    '$save', '$edit', '$delete', '$add', '$close',
    '$home', '$settings', '$search', '$user', '$users',
    '$check', '$error', '$warning', '$info',
    '$back', '$forward', '$menu', '$refresh'
].map(icon => ({
    label: icon,
    kind: CompletionItemKind.Value,
    detail: 'Icon'
}));

const MODIFIERS: CompletionItem[] = [
    { label: 'primary', kind: CompletionItemKind.Property, detail: 'Primary style' },
    { label: 'secondary', kind: CompletionItemKind.Property, detail: 'Secondary style' },
    { label: 'required', kind: CompletionItemKind.Property, detail: 'Required field' },
    { label: 'disabled', kind: CompletionItemKind.Property, detail: 'Disabled state' },
    { label: 'checked', kind: CompletionItemKind.Property, detail: 'Checked state' },
    { label: 'selected', kind: CompletionItemKind.Property, detail: 'Selected state' },
];

export function getCompletions(
    line: string, 
    character: number,
    document: string
): CompletionItem[] {
    const prefix = line.substring(0, character);
    
    // Icon completion after $
    if (prefix.endsWith('$')) {
        return ICONS;
    }
    
    // Modifier completion
    if (/\b(Button|TextInput|Checkbox|Radio)\s+"[^"]*"\s+:.\w*\s*$/.test(prefix)) {
        return MODIFIERS;
    }
    
    // Default to keywords
    return KEYWORDS;
}
```

### 6.4 Hover Provider

```typescript
// src/language/hover.ts

import { Hover, MarkupKind } from 'vscode-languageserver';

const HOVER_INFO: Record<string, { description: string; syntax: string; example: string }> = {
    'Button': {
        description: 'A clickable button control.',
        syntax: 'Button "text" [:id] [primary|secondary] [@target]',
        example: 'Button "Submit" :btnSubmit primary @Dashboard'
    },
    'TextInput': {
        description: 'A single-line text input field.',
        syntax: 'TextInput "placeholder" [:id] [required] [.binding]',
        example: 'TextInput "Enter name" :txtName required .user.name'
    },
    'Vertical': {
        description: 'A vertical stack layout that arranges children top to bottom.',
        syntax: 'Vertical [gap=n] [align=start|center|end|stretch]',
        example: 'Vertical gap=12 align=center\n    Button "One"\n    Button "Two"\n/Vertical'
    },
    'Horizontal': {
        description: 'A horizontal stack layout that arranges children left to right.',
        syntax: 'Horizontal [gap=n] [justify=start|center|end|between|around]',
        example: 'Horizontal gap=8 justify=end\n    Button "Cancel"\n    Button "Save" primary\n/Horizontal'
    },
    // ... more hover info
};

export function getHover(word: string): Hover | null {
    const info = HOVER_INFO[word];
    if (!info) return null;

    return {
        contents: {
            kind: MarkupKind.Markdown,
            value: [
                `## ${word}`,
                '',
                info.description,
                '',
                '### Syntax',
                '```uimmd',
                info.syntax,
                '```',
                '',
                '### Example',
                '```uimmd',
                info.example,
                '```'
            ].join('\n')
        }
    };
}
```

---

## 7. Syntax Highlighting

### 7.1 TextMate Grammar

```json
{
    "$schema": "https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json",
    "name": "UIMMD",
    "scopeName": "source.uimmd",
    "patterns": [
        { "include": "#comments" },
        { "include": "#document" },
        { "include": "#metadata" },
        { "include": "#keywords" },
        { "include": "#controls" },
        { "include": "#strings" },
        { "include": "#identifiers" },
        { "include": "#icons" },
        { "include": "#navigation" },
        { "include": "#attributes" },
        { "include": "#modifiers" }
    ],
    "repository": {
        "comments": {
            "patterns": [
                {
                    "name": "comment.line.double-slash.uimmd",
                    "match": "//.*$"
                },
                {
                    "name": "comment.block.uimmd",
                    "begin": "/\\*",
                    "end": "\\*/"
                }
            ]
        },
        "document": {
            "patterns": [
                {
                    "name": "keyword.control.uimmd",
                    "match": "^\\s*(uiwire|/uiwire)\\b"
                },
                {
                    "name": "constant.language.uimmd",
                    "match": "\\b(sketch|clean|blueprint|realistic)\\b"
                }
            ]
        },
        "metadata": {
            "match": "^\\s*(%\\w+):\\s*(.*)$",
            "captures": {
                "1": { "name": "keyword.other.uimmd" },
                "2": { "name": "string.unquoted.uimmd" }
            }
        },
        "keywords": {
            "patterns": [
                {
                    "name": "keyword.control.layout.uimmd",
                    "match": "\\b(Grid|Vertical|Horizontal|Dock|Canvas|Scroll|/Grid|/Vertical|/Horizontal|/Dock|/Canvas|/Scroll)\\b"
                },
                {
                    "name": "keyword.control.section.uimmd",
                    "match": "\\b(Header|Footer|Sidebar|Content|Panel|Card|Toolbar|Modal|Drawer|/Header|/Footer|/Sidebar|/Content|/Panel|/Card|/Toolbar|/Modal|/Drawer)\\b"
                }
            ]
        },
        "controls": {
            "name": "entity.name.type.uimmd",
            "match": "\\b(Button|IconButton|TextInput|NumberInput|DateInput|PasswordInput|TextArea|Label|Checkbox|Radio|Dropdown|Option|Separator|Spacer|Icon|Image|Avatar|Progress|Slider|Switch|Chip|Badge)\\b"
        },
        "strings": {
            "name": "string.quoted.double.uimmd",
            "begin": "\"",
            "end": "\"",
            "patterns": [
                {
                    "name": "constant.character.escape.uimmd",
                    "match": "\\\\."
                },
                {
                    "name": "markup.bold.uimmd",
                    "match": "\\*\\*[^*]+\\*\\*"
                },
                {
                    "name": "markup.italic.uimmd",
                    "match": "\\*[^*]+\\*"
                }
            ]
        },
        "identifiers": {
            "patterns": [
                {
                    "name": "variable.name.uimmd",
                    "match": ":[a-zA-Z][a-zA-Z0-9]*"
                },
                {
                    "name": "variable.other.binding.uimmd",
                    "match": "\\.[a-zA-Z][a-zA-Z0-9.]*"
                }
            ]
        },
        "icons": {
            "name": "constant.other.icon.uimmd",
            "match": "\\$[a-zA-Z][a-zA-Z0-9]*"
        },
        "navigation": {
            "name": "entity.name.function.uimmd",
            "match": "@[a-zA-Z:][a-zA-Z0-9:]*"
        },
        "attributes": {
            "match": "\\b([a-z]+)\\s*=\\s*([^\\s]+)",
            "captures": {
                "1": { "name": "entity.other.attribute-name.uimmd" },
                "2": { "name": "constant.other.uimmd" }
            }
        },
        "modifiers": {
            "name": "keyword.other.modifier.uimmd",
            "match": "\\b(primary|secondary|required|disabled|checked|selected)\\b"
        }
    }
}
```

---

## 8. Snippets

### 8.1 Code Snippets

```json
{
    "Document": {
        "prefix": "uiwire",
        "body": [
            "uiwire ${1|sketch,clean,blueprint,realistic|}",
            "    %title: ${2:Title}",
            "    ",
            "    $0",
            "/uiwire"
        ],
        "description": "Create a new UIMMD document"
    },
    "Login Form": {
        "prefix": "login",
        "body": [
            "Card",
            "    Vertical gap=12",
            "        Label \"**${1:Login}**\"",
            "        ",
            "        Label \"Username:\"",
            "        TextInput \"Username\" :txtUser required",
            "        ",
            "        Label \"Password:\"",
            "        PasswordInput \"Password\" :txtPass required",
            "        ",
            "        Separator",
            "        ",
            "        Horizontal justify=end gap=8",
            "            Button \"${2:Cancel}\" @:back",
            "            Button \"${3:Login}\" primary :btnLogin",
            "        /Horizontal",
            "    /Vertical",
            "/Card"
        ],
        "description": "Insert a login form"
    },
    "Dashboard Layout": {
        "prefix": "dashboard",
        "body": [
            "Dock",
            "    Header dock=top h=60",
            "        Horizontal padding=16",
            "            Icon \\$${1:home}",
            "            Label \"**${2:App Title}**\"",
            "            Spacer",
            "            IconButton \\$settings",
            "            Avatar \"${3:JD}\" :avUser",
            "        /Horizontal",
            "    /Header",
            "    ",
            "    Sidebar dock=left w=220",
            "        Vertical padding=12 gap=4",
            "            IconButton \\$home \"Home\" @Home",
            "            IconButton \\$settings \"Settings\" @Settings",
            "            Spacer",
            "            IconButton \\$logout \"Logout\" @Logout",
            "        /Vertical",
            "    /Sidebar",
            "    ",
            "    Content dock=fill",
            "        Scroll",
            "            Vertical padding=24 gap=16",
            "                $0",
            "            /Vertical",
            "        /Scroll",
            "    /Content",
            "/Dock"
        ],
        "description": "Insert a dashboard layout"
    },
    "Data Grid": {
        "prefix": "datagrid",
        "body": [
            "DataGrid :${1:dgData} data=${2:items}",
            "    Column field=${3:name} header=\"${4:Name}\"",
            "    Column field=${5:value} header=\"${6:Value}\"",
            "    Column header=\"Actions\"",
            "        IconButton \\$edit",
            "        IconButton \\$delete",
            "    /Column",
            "/DataGrid"
        ],
        "description": "Insert a data grid"
    }
}
```

---

## 9. Commands

### 9.1 Command Registration

```typescript
// src/commands/index.ts

import * as vscode from 'vscode';
import { UimmdPreviewProvider } from '../preview/provider';
import { exportDocument } from './export';
import { insertSnippet } from './insert';
import { formatDocument } from './format';

export function registerCommands(
    context: vscode.ExtensionContext,
    previewProvider: UimmdPreviewProvider
): void {
    // Preview commands
    context.subscriptions.push(
        vscode.commands.registerCommand('uimmd.preview', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor..document.languageId === 'uimmd') {
                previewProvider.update(editor.document);
                vscode.commands.executeCommand('uimmd.preview.focus');
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('uimmd.previewSide', () => {
            const editor = vscode.window.activeTextEditor;
            if (editor..document.languageId === 'uimmd') {
                vscode.commands.executeCommand('workbench.view.extension.uimmd-preview');
            }
        })
    );

    // Export commands
    context.subscriptions.push(
        vscode.commands.registerCommand('uimmd.export.png', async () => {
            await exportDocument('png');
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('uimmd.export.svg', async () => {
            await exportDocument('svg');
        })
    );

    // Insert snippet
    context.subscriptions.push(
        vscode.commands.registerCommand('uimmd.insertSnippet', async () => {
            await insertSnippet();
        })
    );

    // Format document
    context.subscriptions.push(
        vscode.commands.registerCommand('uimmd.format', async () => {
            await formatDocument();
        })
    );
}
```

### 9.2 Export Implementation

```typescript
// src/commands/export.ts

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { parse, render } from '@uimmd/core';

export async function exportDocument(format: 'svg' | 'png'): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'uimmd') {
        vscode.window.showErrorMessage('No UIMMD document open');
        return;
    }

    const text = editor.document.getText();

    try {
        const ast = parse(text);
        const svg = render(ast);

        // Get save location
        const defaultPath = editor.document.uri.fsPath.replace('.uimmd', `.${format}`);
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: vscode.Uri.file(defaultPath),
            filters: {
                [format.toUpperCase()]: [format]
            }
        });

        if (!saveUri) return;

        if (format === 'svg') {
            fs.writeFileSync(saveUri.fsPath, svg);
        } else {
            // PNG export requires canvas conversion
            const pngData = await svgToPng(svg);
            fs.writeFileSync(saveUri.fsPath, pngData);
        }

        vscode.window.showInformationMessage(`Exported to ${saveUri.fsPath}`);

    } catch (error) {
        vscode.window.showErrorMessage(`Export failed: ${(error as Error).message}`);
    }
}

async function svgToPng(svg: string): Promise<Buffer> {
    // Use canvas or sharp for conversion
    // This would require additional dependencies
    throw new Error('PNG export not implemented');
}
```

---

## 10. Testing

### 10.1 Extension Tests

```typescript
// src/test/extension.test.ts

import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('uimmd.uimmd'));
    });

    test('Should activate on UIMMD file', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'uimmd',
            content: 'uiwire clean\n    Button "Test"\n/uiwire'
        });
        
        await vscode.window.showTextDocument(doc);
        
        // Check extension is active
        const ext = vscode.extensions.getExtension('uimmd.uimmd');
        assert.ok(ext..isActive);
    });

    test('Should provide completions', async () => {
        const doc = await vscode.workspace.openTextDocument({
            language: 'uimmd',
            content: 'uiwire clean\n    But'
        });
        
        const position = new vscode.Position(1, 7);
        const completions = await vscode.commands.executeCommand<vscode.CompletionList>(
            'vscode.executeCompletionItemProvider',
            doc.uri,
            position
        );
        
        assert.ok(completions.items.some(item => item.label === 'Button'));
    });
});
```

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [22_Parser_Specification](./22_Parser_Specification.md) | Parser details |
| [23_Renderer_Design](./23_Renderer_Design.md) | Renderer details |
| [26_Theming_System](./26_Theming_System.md) | Theme implementation |

---

*VSCode Extension Design v1.0 - 2025*
