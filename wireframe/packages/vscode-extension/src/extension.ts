/**
 * Wireframe VS Code Extension
 * 
 * Provides syntax highlighting, preview, diagnostics, and export functionality
 * for Wireframe files.
 */

import * as vscode from 'vscode';
import { compile, parse } from '@aspect-ui/wireframe-core';

let previewPanel: vscode.WebviewPanel | undefined;
let diagnosticCollection: vscode.DiagnosticCollection;
let currentTheme = 'clean';

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
      { label: 'UIWire Document', value: 'uiwire' },
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
        }
        .toolbar {
          display: flex;
          gap: 8px;
          margin-bottom: 16px;
          padding: 8px;
          background: var(--vscode-sideBar-background);
          border-radius: 4px;
        }
        .toolbar-btn {
          padding: 4px 12px;
          background: var(--vscode-button-background);
          color: var(--vscode-button-foreground);
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .toolbar-btn:hover {
          background: var(--vscode-button-hoverBackground);
        }
        .toolbar-info {
          margin-left: auto;
          font-size: 12px;
          color: var(--vscode-descriptionForeground);
          align-self: center;
        }
        .preview {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 16px;
          overflow: auto;
        }
        .errors {
          background: var(--vscode-inputValidation-warningBackground);
          border: 1px solid var(--vscode-inputValidation-warningBorder);
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
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
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <span class="toolbar-info">Theme: ${currentTheme} | ${width}×${height}</span>
      </div>
      ${errorHtml}
      <div class="preview">
        ${svg}
      </div>
    </body>
    </html>
  `;
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
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    const linePrefix = document.lineAt(position).text.substring(0, position.character);
    const items: vscode.CompletionItem[] = [];
    
    // Control completions
    const controls = [
      'Button', 'IconButton', 'TextInput', 'NumberInput', 'DateInput',
      'PasswordInput', 'TextArea', 'Label', 'Heading', 'Link', 'Checkbox',
      'Radio', 'Dropdown', 'Separator', 'Spacer', 'Icon', 'Image', 'Avatar',
      'Badge', 'Progress', 'Slider', 'Switch', 'Chip', 'Tabs', 'Tab',
      'Menu', 'MenuItem', 'Breadcrumb', 'Pagination', 'Table', 'Tree',
      'Accordion', 'DataGrid', 'Toast', 'Skeleton', 'Stepper'
    ];
    
    const layouts = ['Vertical', 'Horizontal', 'Grid', 'Dock', 'Canvas', 'Scroll'];
    const sections = ['Header', 'Footer', 'Sidebar', 'Content', 'Panel', 'Card', 'Modal'];
    
    // Add control completions
    for (const control of controls) {
      const item = new vscode.CompletionItem(control, vscode.CompletionItemKind.Class);
      item.detail = 'Wireframe Control';
      items.push(item);
    }
    
    // Add layout completions
    for (const layout of layouts) {
      const item = new vscode.CompletionItem(layout, vscode.CompletionItemKind.Module);
      item.detail = 'Wireframe Layout';
      item.insertText = new vscode.SnippetString(`${layout}\n  $0\n/${layout}`);
      items.push(item);
    }
    
    // Add section completions
    for (const section of sections) {
      const item = new vscode.CompletionItem(section, vscode.CompletionItemKind.Struct);
      item.detail = 'Wireframe Section';
      item.insertText = new vscode.SnippetString(`${section}\n  $0\n/${section}`);
      items.push(item);
    }
    
    // Modifier completions after [
    if (linePrefix.endsWith('[')) {
      const modifiers = ['primary', 'secondary', 'required', 'disabled', 'checked', 'selected', 'active', 'expanded'];
      for (const mod of modifiers) {
        const item = new vscode.CompletionItem(mod, vscode.CompletionItemKind.Keyword);
        item.detail = 'Modifier';
        item.insertText = mod + ']';
        items.push(item);
      }
    }
    
    return items;
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
