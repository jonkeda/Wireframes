/**
 * Wireframe VS Code Extension
 * 
 * Provides syntax highlighting, preview, and export functionality
 * for Wireframe files.
 */

import * as vscode from 'vscode';
import { compile } from '@aspect-ui/wireframe-core';

let previewPanel: vscode.WebviewPanel | undefined;

/**
 * Activate the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  // Register preview command
  const previewCommand = vscode.commands.registerCommand('wireframe.preview', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    
    showPreview(context, editor.document);
  });
  
  // Register export command
  const exportCommand = vscode.commands.registerCommand('wireframe.exportSvg', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor');
      return;
    }
    
    await exportToSvg(editor.document);
  });
  
  // Watch for document changes
  const changeWatcher = vscode.workspace.onDidChangeTextDocument((event) => {
    if (
      previewPanel &&
      event.document.languageId === 'wireframe' &&
      vscode.window.activeTextEditor?.document === event.document
    ) {
      updatePreview(event.document);
    }
  });
  
  context.subscriptions.push(previewCommand, exportCommand, changeWatcher);
}

/**
 * Deactivate the extension
 */
export function deactivate(): void {
  previewPanel?.dispose();
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
  
  const source = document.getText();
  const { svg, errors } = compile(source, {
    width: 800,
    height: 600,
    theme: 'clean',
  });
  
  const errorHtml = errors.length > 0
    ? `<div class="errors">
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
          background: #f5f5f5;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .preview {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          padding: 16px;
          overflow: auto;
        }
        .errors {
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
        }
        .error {
          color: #856404;
          font-size: 13px;
        }
        svg {
          max-width: 100%;
          height: auto;
        }
      </style>
    </head>
    <body>
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
  const source = document.getText();
  const { svg, errors } = compile(source, {
    width: 800,
    height: 600,
    theme: 'clean',
  });
  
  if (errors.length > 0) {
    const proceed = await vscode.window.showWarningMessage(
      `Document has ${errors.length} error(s). Export anyway?`,
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
