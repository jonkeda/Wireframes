/**
 * Preview panel and SVG export for Wireframe documents
 */

import * as vscode from 'vscode';
import { compile } from '@jonkeda/wireframe-core';
import { buildPreviewHtml, createNonce } from './shared/html';

/**
 * The theme the user configured in `wireframe.defaultTheme`, or undefined
 * when the setting is left at its default (the document's own style wins).
 */
export function configuredTheme(): string | undefined {
  const inspected = vscode.workspace.getConfiguration('wireframe').inspect<string>('defaultTheme');
  return (
    inspected?.workspaceFolderValue ??
    inspected?.workspaceValue ??
    inspected?.globalValue ??
    undefined
  );
}

function previewSize(): { width: number; height: number } {
  const config = vscode.workspace.getConfiguration('wireframe');
  return {
    width: config.get<number>('previewWidth') || 800,
    height: config.get<number>('previewHeight') || 600,
  };
}

export class WireframePreview implements vscode.Disposable {
  private panel: vscode.WebviewPanel | undefined;
  private panelDisposables: vscode.Disposable[] = [];
  private document: vscode.TextDocument | undefined;
  /** Theme picked by the user (setting or Change Theme); undefined = the document's style */
  private theme: string | undefined;
  private zoom = 100;

  constructor() {
    this.theme = configuredTheme();
  }

  get isOpen(): boolean {
    return this.panel !== undefined;
  }

  setTheme(theme: string): void {
    this.theme = theme;
    this.refresh();
  }

  zoomIn(): void {
    this.zoom = Math.min(200, this.zoom + 25);
    this.refresh();
  }

  zoomOut(): void {
    this.zoom = Math.max(25, this.zoom - 25);
    this.refresh();
  }

  zoomReset(): void {
    this.zoom = 100;
    this.refresh();
  }

  show(document: vscode.TextDocument): void {
    if (this.panel) {
      this.panel.reveal(vscode.ViewColumn.Beside);
    } else {
      const panel = vscode.window.createWebviewPanel(
        'wireframePreview',
        'Wireframe Preview',
        vscode.ViewColumn.Beside,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          // The preview is fully inline; it loads no local files.
          localResourceRoots: [],
        }
      );
      this.panel = panel;

      // Registered once per panel, disposed with it.
      panel.webview.onDidReceiveMessage(
        (message: { command?: string }) => {
          switch (message?.command) {
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
        },
        undefined,
        this.panelDisposables
      );

      panel.onDidDispose(
        () => {
          this.panel = undefined;
          this.document = undefined;
          this.disposePanelListeners();
        },
        undefined,
        this.panelDisposables
      );
    }

    this.update(document);
  }

  /**
   * Re-render the preview for the active editor's document, or else the
   * document last shown.
   */
  refresh(): void {
    const document = vscode.window.activeTextEditor?.document ?? this.document;
    if (document) {
      this.update(document);
    }
  }

  update(document: vscode.TextDocument): void {
    const panel = this.panel;
    if (!panel) return;
    this.document = document;

    const { width, height } = previewSize();
    const { svg, errors } = compile(document.getText(), {
      width,
      height,
      ...(this.theme ? { theme: this.theme } : {}),
    });

    panel.webview.html = buildPreviewHtml({
      svg,
      errors,
      zoom: this.zoom,
      themeLabel: this.theme ?? 'from document',
      width,
      height,
      cspSource: panel.webview.cspSource,
      nonce: createNonce(),
    });
  }

  async exportSvg(document: vscode.TextDocument): Promise<void> {
    const { width, height } = previewSize();
    const { svg, errors } = compile(document.getText(), {
      width,
      height,
      ...(this.theme ? { theme: this.theme } : {}),
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

  dispose(): void {
    this.panel?.dispose();
    this.disposePanelListeners();
  }

  private disposePanelListeners(): void {
    const disposables = this.panelDisposables;
    this.panelDisposables = [];
    for (const d of disposables) {
      d.dispose();
    }
  }
}
