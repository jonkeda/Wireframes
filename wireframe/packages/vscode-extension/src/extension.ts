/**
 * Wireframe VS Code Extension
 *
 * Provides syntax highlighting, preview, diagnostics, and export functionality
 * for Wireframe files.
 */

import * as vscode from 'vscode';
import { WireframeCompletionProvider } from './completion';
import { validateDocument } from './diagnostics';
import { WireframeHoverProvider } from './hover';
import { extendMarkdownIt, type MarkdownItInstance } from './markdown-integration';
import { WireframePreview } from './preview';

let preview: WireframePreview | undefined;
let diagnosticCollection: vscode.DiagnosticCollection | undefined;

// Output channel for debugging
let outputChannel: vscode.OutputChannel;

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext): {
  extendMarkdownIt(md: MarkdownItInstance): MarkdownItInstance;
} {
  // Create output channel for debugging
  outputChannel = vscode.window.createOutputChannel('Wireframe');
  outputChannel.appendLine('[Wireframe] Extension activating...');

  // Create diagnostic collection
  const diagnostics = vscode.languages.createDiagnosticCollection('wireframe');
  diagnosticCollection = diagnostics;
  const wirePreview = new WireframePreview();
  preview = wirePreview;
  context.subscriptions.push(diagnostics, outputChannel, wirePreview);

  const validate = (document: vscode.TextDocument): void => validateDocument(document, diagnostics);

  // Register commands
  const previewCommand = vscode.commands.registerCommand('wireframe.preview', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    wirePreview.show(editor.document);
  });

  const exportSvgCommand = vscode.commands.registerCommand('wireframe.exportSvg', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    await wirePreview.exportSvg(editor.document);
  });

  const validateCommand = vscode.commands.registerCommand('wireframe.validate', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    validate(editor.document);
    vscode.window.showInformationMessage('Wireframe: Validation complete');
  });

  const changeThemeCommand = vscode.commands.registerCommand('wireframe.changeTheme', async () => {
    const theme = await vscode.window.showQuickPick(
      ['clean', 'sketch', 'blueprint', 'realistic'],
      { placeHolder: 'Select wireframe theme' }
    );
    if (theme) {
      wirePreview.setTheme(theme);
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
  const zoomInCommand = vscode.commands.registerCommand('wireframe.zoomIn', () => wirePreview.zoomIn());
  const zoomOutCommand = vscode.commands.registerCommand('wireframe.zoomOut', () => wirePreview.zoomOut());
  const zoomResetCommand = vscode.commands.registerCommand('wireframe.zoomReset', () => wirePreview.zoomReset());

  // Watch for document changes
  const changeWatcher = vscode.workspace.onDidChangeTextDocument((event) => {
    if (event.document.languageId === 'wireframe') {
      // Update diagnostics
      validate(event.document);

      // Update preview if open
      if (wirePreview.isOpen && vscode.window.activeTextEditor?.document === event.document) {
        wirePreview.update(event.document);
      }
    }
  });

  // Watch for document open
  const openWatcher = vscode.workspace.onDidOpenTextDocument((document) => {
    if (document.languageId === 'wireframe') {
      validate(document);

      // Auto-preview if enabled
      const config = vscode.workspace.getConfiguration('wireframe');
      if (config.get('autoPreview')) {
        wirePreview.show(document);
      }
    }
  });

  // Watch for document save
  const saveWatcher = vscode.workspace.onDidSaveTextDocument((document) => {
    if (document.languageId === 'wireframe') {
      const config = vscode.workspace.getConfiguration('wireframe');
      if (config.get('validateOnSave')) {
        validate(document);
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

  outputChannel.appendLine('[Wireframe] Extension activated successfully');
  outputChannel.show(true); // Show output channel to help debugging

  // Return markdown-it plugin for markdown preview integration
  // This is called by VS Code when rendering markdown previews
  outputChannel.appendLine('[Wireframe] Returning exports with extendMarkdownIt function');
  return {
    extendMarkdownIt(md: MarkdownItInstance): MarkdownItInstance {
      return extendMarkdownIt(md, outputChannel);
    },
  };
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
  preview?.dispose();
  diagnosticCollection?.dispose();
  preview = undefined;
  diagnosticCollection = undefined;
}
