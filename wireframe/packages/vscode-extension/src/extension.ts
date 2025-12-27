/**
 * Wireframe VS Code Extension
 * 
 * Provides syntax highlighting, preview, diagnostics, and export functionality
 * for Wireframe files.
 */

import * as vscode from 'vscode';
import { compile, parse } from '@jonkeda/wireframe-core';

let previewPanel: vscode.WebviewPanel | undefined;
let diagnosticCollection: vscode.DiagnosticCollection;
let currentTheme = 'clean';
let currentZoom = 100;

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  // Create diagnostic collection
  diagnosticCollection = vscode.languages.createDiagnosticCollection('wireframe');
  context.subscriptions.push(diagnosticCollection);
  
  // Register commands
  const previewCommand = vscode.commands.registerCommand('wireframe.preview', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    showPreview(context, editor.document);
  });
  
  const exportSvgCommand = vscode.commands.registerCommand('wireframe.exportSvg', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    await exportToSvg(editor.document);
  });
  
  const validateCommand = vscode.commands.registerCommand('wireframe.validate', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    validateDocument(editor.document);
    vscode.window.showInformationMessage('Wireframe: Validation complete');
  });
  
  const changeThemeCommand = vscode.commands.registerCommand('wireframe.changeTheme', async () => {
    const theme = await vscode.window.showQuickPick(
      ['clean', 'sketch', 'blueprint', 'realistic'],
      { placeHolder: 'Select wireframe theme' }
    );
    if (theme) {
      currentTheme = theme;
      const editor = vscode.window.activeTextEditor;
      if (editor && previewPanel) {
        updatePreview(editor.document);
      }
      vscode.window.showInformationMessage(`Wireframe theme changed to: ${theme}`);
    }
  });
  
  const insertSnippetCommand = vscode.commands.registerCommand('wireframe.insertSnippet', async () => {
    const snippets = [
      { label: 'Wireframe Document', value: 'wireframe' },
      { label: 'Header Section', value: 'header' },
      { label: 'Card Component', value: 'card' },
      { label: 'Form', value: 'form' },
      { label: 'Login Form', value: 'loginform' },
      { label: 'Navigation Tabs', value: 'tabs' },
      { label: 'Data Table', value: 'table' },
      { label: 'Button Group', value: 'buttons' },
    ];
    
    const selected = await vscode.window.showQuickPick(snippets, {
      placeHolder: 'Select a snippet to insert'
    });
    
    if (selected) {
      vscode.commands.executeCommand('editor.action.insertSnippet', {
        name: selected.label
      });
    }
  });
  
  // Zoom commands
  const zoomInCommand = vscode.commands.registerCommand('wireframe.zoomIn', () => {
    currentZoom = Math.min(200, currentZoom + 25);
    const editor = vscode.window.activeTextEditor;
    if (editor && previewPanel) {
      updatePreview(editor.document);
    }
  });
  
  const zoomOutCommand = vscode.commands.registerCommand('wireframe.zoomOut', () => {
    currentZoom = Math.max(25, currentZoom - 25);
    const editor = vscode.window.activeTextEditor;
    if (editor && previewPanel) {
      updatePreview(editor.document);
    }
  });
  
  const zoomResetCommand = vscode.commands.registerCommand('wireframe.zoomReset', () => {
    currentZoom = 100;
    const editor = vscode.window.activeTextEditor;
    if (editor && previewPanel) {
      updatePreview(editor.document);
    }
  });
  
  // Watch for document changes
  const changeWatcher = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'wireframe') {
      // Update diagnostics
      validateDocument(event.document);
      
      // Update preview if open
      if (previewPanel && vscode.window.activeTextEditor?.document === event.document) {
        updatePreview(event.document);
      }
    }
  });
  
  // Watch for document open
  const openWatcher = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'wireframe') {
      validateDocument(document);
      
      // Auto-preview if enabled
      const config = vscode.workspace.getConfiguration('wireframe');
      if (config.get('autoPreview')) {
        showPreview(context, document);
      }
    }
  });
  
  // Watch for document save
  const saveWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === 'wireframe') {
      const config = vscode.workspace.getConfiguration('wireframe');
      if (config.get('validateOnSave')) {
        validateDocument(document);
      }
    }
  });
  
  // Register completion provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'wireframe',
    new WireframeCompletionProvider(),
    ' ', '\n'
  );
  
  // Register hover provider
  const hoverProvider = vscode.languages.registerHoverProvider(
    'wireframe',
    new WireframeHoverProvider()
  );
  
  context.subscriptions.push(
    previewCommand,
    exportSvgCommand,
    validateCommand,
    changeThemeCommand,
    insertSnippetCommand,
    zoomInCommand,
    zoomOutCommand,
    zoomResetCommand,
    changeWatcher,
    openWatcher,
    saveWatcher,
    completionProvider,
    hoverProvider
  );
  
  // Load configuration
  const config = vscode.workspace.getConfiguration('wireframe');
  currentTheme = config.get('defaultTheme') || 'clean';
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
  previewPanel?.dispose();
  diagnosticCollection?.dispose();
}

/**
 * Validate document and update diagnostics
 */
function validateDocument(document: vscode.TextDocument): void {
  const source = document.getText();
  const { errors } = parse(source);
  
  const diagnostics: vscode.Diagnostic[] = errors.map(error => {
    const line = Math.max(0, error.location.line - 1);
    const range = new vscode.Range(line, 0, line, 100);
    
    return new vscode.Diagnostic(
      range,
      error.message,
      vscode.DiagnosticSeverity.Error
    );
  });
  
  diagnosticCollection.set(document.uri, diagnostics);
}

/**
 * Show preview panel
 */
function showPreview(_context: vscode.ExtensionContext, document: vscode.TextDocument): void {
  if (previewPanel) {
    previewPanel.reveal(vscode.ViewColumn.Beside);
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
  
  updatePreview(document);
}

/**
 * Update preview content
 */
function updatePreview(document: vscode.TextDocument): void {
  if (!previewPanel) return;
  
  const config = vscode.workspace.getConfiguration('wireframe');
  const width = config.get<number>('previewWidth') || 800;
  const height = config.get<number>('previewHeight') || 600;
  
  const source = document.getText();
  const { svg, errors } = compile(source, {
    width,
    height,
    theme: currentTheme,
  });
  
  const errorHtml = errors.length > 0
    ? `<div class="errors">
        <div class="error-title">⚠️ ${errors.length} warning(s)</div>
        ${errors.map(e => `<div class="error">Line ${e.line}: ${e.message}</div>`).join('')}
       </div>`
    : '';
  
  previewPanel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 16px;
          background: var(--vscode-editor-background);
          font-family: var(--vscode-font-family);
          color: var(--vscode-foreground);
          height: 100vh;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px;
          background: var(--vscode-sideBar-background);
          border-radius: 4px;
          flex-shrink: 0;
        }
        .toolbar-btn {
          padding: 4px 12px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          min-width: 32px;
        }
        .toolbar-btn:hover {
          background: var(--vscode-button-hoverBackground);
        }
        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .toolbar-separator {
          width: 1px;
          background: var(--vscode-panel-border);
          margin: 0 4px;
        }
        .toolbar-info {
          margin-left: auto;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
          align-self: center;
        }
        .zoom-display {
          font-size: 12px;
          min-width: 50px;
          text-align: center;
          align-self: center;
          color: var(--vscode-foreground);
        }
        .preview-container {
          flex: 1;
          overflow: auto;
          background: #f0f0f0;
          border-radius: 8px;
          padding: 16px;
        }
        .preview {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 16px;
          display: inline-block;
          transform-origin: top left;
          transform: scale(${currentZoom / 100});
          min-width: ${width}px;
        }
        .errors {
          background: var(--vscode-inputValidation-warningBackground);
          border: 1px solid var(--vscode-inputValidation-warningBorder);
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
          flex-shrink: 0;
        }
        .error-title {
          font-weight: bold;
          margin-bottom: 8px;
        }
        .error {
          font-size: 12px;
          margin: 4px 0;
          font-family: var(--vscode-editor-font-family);
        }
        svg {
          display: block;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <button class="toolbar-btn" onclick="zoomOut()" title="Zoom Out (Ctrl+-)">−</button>
        <span class="zoom-display">${currentZoom}%</span>
        <button class="toolbar-btn" onclick="zoomIn()" title="Zoom In (Ctrl++)">+</button>
        <button class="toolbar-btn" onclick="zoomReset()" title="Reset Zoom">100%</button>
        <button class="toolbar-btn" onclick="zoomFit()" title="Fit to Window">Fit</button>
        <div class="toolbar-separator"></div>
        <span class="toolbar-info">Theme: ${currentTheme} | ${width}×${height}</span>
      </div>
      ${errorHtml}
      <div class="preview-container" id="previewContainer">
        <div class="preview" id="preview">
          ${svg}
        </div>
      </div>
      <script>
        const vscode = acquireVsCodeApi();
        let zoom = ${currentZoom};
        
        function updateZoom(newZoom) {
          zoom = Math.max(25, Math.min(200, newZoom));
          document.querySelector('.zoom-display').textContent = zoom + '%';
          document.getElementById('preview').style.transform = 'scale(' + (zoom / 100) + ')';
        }
        
        function zoomIn() {
          vscode.postMessage({ command: 'zoomIn' });
        }
        
        function zoomOut() {
          vscode.postMessage({ command: 'zoomOut' });
        }
        
        function zoomReset() {
          vscode.postMessage({ command: 'zoomReset' });
        }
        
        function zoomFit() {
          const container = document.getElementById('previewContainer');
          const preview = document.getElementById('preview');
          const svg = preview.querySelector('svg');
          if (!svg) return;
          
          const containerWidth = container.clientWidth - 32;
          const containerHeight = container.clientHeight - 32;
          const svgWidth = svg.getAttribute('width') || ${width};
          const svgHeight = svg.getAttribute('height') || ${height};
          
          const scaleX = containerWidth / svgWidth;
          const scaleY = containerHeight / svgHeight;
          const newZoom = Math.floor(Math.min(scaleX, scaleY) * 100);
          
          updateZoom(newZoom);
        }
        
        // Mouse wheel zoom
        document.getElementById('previewContainer').addEventListener('wheel', function(e) {
          if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -10 : 10;
            updateZoom(zoom + delta);
          }
        }, { passive: false });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
          if (e.ctrlKey) {
            if (e.key === '=' || e.key === '+') {
              e.preventDefault();
              zoomIn();
            } else if (e.key === '-') {
              e.preventDefault();
              zoomOut();
            } else if (e.key === '0') {
              e.preventDefault();
              zoomReset();
            }
          }
        });
      </script>
    </body>
    </html>
  `;
  
  // Handle messages from webview
  previewPanel.webview.onDidReceiveMessage(message => {
    switch (message.command) {
      case 'zoomIn':
        vscode.commands.executeCommand('wireframe.zoomIn');
        break;
      case 'zoomOut':
        vscode.commands.executeCommand('wireframe.zoomOut');
        break;
      case 'zoomReset':
        vscode.commands.executeCommand('wireframe.zoomReset');
        break;
    }
  });
}

/**
 * Export document to SVG file
 */
async function exportToSvg(document: vscode.TextDocument): Promise<void> {
  const config = vscode.workspace.getConfiguration('wireframe');
  const width = config.get<number>('previewWidth') || 800;
  const height = config.get<number>('previewHeight') || 600;
  
  const source = document.getText();
  const { svg, errors } = compile(source, {
    width,
    height,
    theme: currentTheme,
  });
  
  if (errors.length > 0) {
    const proceed = await vscode.window.showWarningMessage(
      `Document has ${errors.length} warning(s). Export anyway?`,
      'Yes',
      'No'
    );
    if (proceed !== 'Yes') return;
  }
  
  const defaultUri = document.uri.with({
    path: document.uri.path.replace(/\.wire$/, '.svg'),
  });
  
  const uri = await vscode.window.showSaveDialog({
    defaultUri,
    filters: { 'SVG Files': ['svg'] },
  });
  
  if (uri) {
    await vscode.workspace.fs.writeFile(uri, Buffer.from(svg, 'utf-8'));
    vscode.window.showInformationMessage(`Exported to ${uri.fsPath}`);
  }
}

/**
 * Completion provider for Wireframe language
 */
class WireframeCompletionProvider implements vscode.CompletionItemProvider {
  private controls = [
    'Button', 'IconButton', 'TextInput', 'NumberInput', 'DateInput',
    'PasswordInput', 'TextArea', 'Label', 'Heading', 'Link', 'Checkbox',
    'Radio', 'Dropdown', 'Option', 'Separator', 'Spacer', 'Icon', 'Image', 'Avatar',
    'Badge', 'Progress', 'Slider', 'Switch', 'Chip', 'Tabs', 'Tab',
    'Menu', 'MenuItem', 'Breadcrumb', 'Pagination', 'Table', 'Tree',
    'Accordion', 'DataGrid', 'Toast', 'Skeleton', 'Stepper'
  ];
  
  private layouts = ['Vertical', 'Horizontal', 'Grid', 'Dock', 'Canvas', 'Scroll'];
  private sections = ['Header', 'Footer', 'Sidebar', 'Content', 'Panel', 'Card', 'Modal', 'Drawer', 'Dialog', 'Alert', 'Toolbar'];
  private modifiers = ['primary', 'secondary', 'required', 'disabled', 'checked', 'selected', 'readonly', 'active', 'expanded'];
  private themes = ['clean', 'sketch', 'blueprint', 'realistic'];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const lineText = document.lineAt(position).text;
    const linePrefix = lineText.substring(0, position.character);
    const trimmedLine = lineText.trim();
    const items: vscode.CompletionItem[] = [];
    
    // At document start or empty line at root level - suggest wireframe keyword
    if (position.line === 0 || (trimmedLine === '' && this.getIndentLevel(lineText) === 0)) {
      const wireframeItem = new vscode.CompletionItem('wireframe', vscode.CompletionItemKind.Keyword);
      wireframeItem.detail = 'Start a new wireframe document';
      wireframeItem.insertText = new vscode.SnippetString('wireframe ${1|clean,sketch,blueprint,realistic|}\n    %title: ${2:My Wireframe}\n\n    $0\n/wireframe');
      wireframeItem.sortText = '0';
      items.push(wireframeItem);
    }
    
    // After wireframe keyword - suggest themes
    if (linePrefix.match(/^\s*wireframe\s+$/)) {
      for (const theme of this.themes) {
        const item = new vscode.CompletionItem(theme, vscode.CompletionItemKind.EnumMember);
        item.detail = 'Wireframe theme';
        items.push(item);
      }
      return items;
    }
    
    // Directive completions after %
    if (linePrefix.match(/%\w*$/)) {
      const directives = ['title', 'description', 'author', 'version', 'theme', 'width', 'height'];
      for (const dir of directives) {
        const item = new vscode.CompletionItem(dir, vscode.CompletionItemKind.Property);
        item.detail = 'Directive';
        item.insertText = new vscode.SnippetString(`${dir}: \${1}`);
        items.push(item);
      }
      return items;
    }
    
    // Closing tag completions after /
    if (linePrefix.match(/\/\w*$/)) {
      const openTags = this.findOpenTags(document, position);
      for (const tag of openTags) {
        const item = new vscode.CompletionItem(tag, vscode.CompletionItemKind.Keyword);
        item.detail = `Close ${tag}`;
        items.push(item);
      }
      return items;
    }
    
    // Inside a wireframe block - show controls, layouts, sections
    if (this.isInsideWireframe(document, position)) {
      // Add layout completions
      for (const layout of this.layouts) {
        const item = new vscode.CompletionItem(layout, vscode.CompletionItemKind.Module);
        item.detail = 'Layout container';
        item.insertText = new vscode.SnippetString(`${layout}\n    $0\n/${layout}`);
        item.sortText = '1' + layout;
        items.push(item);
      }
      
      // Add section completions
      for (const section of this.sections) {
        const item = new vscode.CompletionItem(section, vscode.CompletionItemKind.Struct);
        item.detail = 'Section container';
        item.insertText = new vscode.SnippetString(`${section}\n    $0\n/${section}`);
        item.sortText = '2' + section;
        items.push(item);
      }
      
      // Add control completions
      for (const control of this.controls) {
        const item = new vscode.CompletionItem(control, vscode.CompletionItemKind.Class);
        item.detail = 'UI Control';
        item.sortText = '3' + control;
        items.push(item);
      }
    }
    
    // Modifier completions - only suggest after control/layout names or in attribute context
    if (linePrefix.match(/\b(Button|TextInput|Label|Checkbox|Radio|Dropdown)\b.*\s$/)) {
      for (const mod of this.modifiers) {
        const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Keyword);
        item.detail = 'Modifier';
        items.push(item);
      }
    }
    
    // Attribute completions after control names
    if (linePrefix.match(/\b[A-Z][a-z]+\b.*\s$/)) {
      const attributes = ['gap', 'padding', 'margin', 'align', 'width', 'height', 'rows', 'cols', 'placeholder'];
      for (const attr of attributes) {
        const item = new vscode.CompletionItem(attr + '=', vscode.CompletionItemKind.Property);
        item.detail = 'Attribute';
        item.insertText = new vscode.SnippetString(`${attr}=\${1}`);
        items.push(item);
      }
    }
    
    return items;
  }
  
  private getIndentLevel(line: string): number {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }
  
  private isInsideWireframe(document: vscode.TextDocument, position: vscode.Position): boolean {
    for (let i = position.line; i >= 0; i--) {
      const line = document.lineAt(i).text.trim();
      if (line.startsWith('wireframe')) return true;
      if (line === '/wireframe') return false;
    }
    return false;
  }
  
  private findOpenTags(document: vscode.TextDocument, position: vscode.Position): string[] {
    const tagStack: string[] = [];
    const tagPattern = /^\s*(Vertical|Horizontal|Grid|Card|Panel|Header|Footer|Sidebar|Modal|Drawer|Tabs|Accordion|Dropdown|Menu|wireframe)\b/;
    const closePattern = /^\s*\/(Vertical|Horizontal|Grid|Card|Panel|Header|Footer|Sidebar|Modal|Drawer|Tabs|Accordion|Dropdown|Menu|wireframe)\b/;
    
    for (let i = 0; i < position.line; i++) {
      const line = document.lineAt(i).text;
      const openMatch = line.match(tagPattern);
      const closeMatch = line.match(closePattern);
      
      if (openMatch) {
        tagStack.push(openMatch[1]);
      } else if (closeMatch) {
        const idx = tagStack.lastIndexOf(closeMatch[1]);
        if (idx !== -1) {
          tagStack.splice(idx, 1);
        }
      }
    }
    
    return tagStack.reverse(); // Most recent first
  }
}

/**
 * Hover provider for Wireframe language
 */
class WireframeHoverProvider implements vscode.HoverProvider {
  private docs: Record<string, string> = {
    'Button': 'A clickable button control.\n\nModifiers: [primary], [secondary], [disabled]',
    'TextInput': 'A text input field.\n\nModifiers: [required], [disabled], [readonly]',
    'Label': 'A text label. Use **text** for bold, *text* for italic.',
    'Vertical': 'Arranges children vertically (top to bottom).',
    'Horizontal': 'Arranges children horizontally (left to right).',
    'Grid': 'Arranges children in a 2-column grid.',
    'Card': 'A container with rounded corners and shadow.',
    'Header': 'A header section, typically at the top.',
    'Footer': 'A footer section, typically at the bottom.',
    'Tabs': 'A tab container. Use Tab children for individual tabs.',
    'Table': 'A data table.\n\nAttributes: rows=N, cols=N',
    'Pagination': 'Page navigation controls.\n\nAttributes: page=N, total=N',
    'Stepper': 'A step progress indicator.\n\nAttributes: steps=N, current=N',
  };
  
  provideHover(document: vscode.TextDocument, position: vscode.Position): vscode.Hover | undefined {
    const wordRange = document.getWordRangeAtPosition(position);
    if (!wordRange) return undefined;
    
    const word = document.getText(wordRange);
    const doc = this.docs[word];
    
    if (doc) {
      return new vscode.Hover(new vscode.MarkdownString(doc));
    }
    
    return undefined;
  }
}
