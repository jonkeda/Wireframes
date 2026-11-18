/**
 * markdown-it integration for VS Code's built-in Markdown preview
 * (runs in the extension host).
 */

import * as vscode from 'vscode';
import { escapeHtml } from './shared/html';
import { errorBox, renderWireframeToHtml } from './shared/render';

interface Token {
  info: string;
  content: string;
}

type FenceRule = (tokens: Token[], idx: number, options: unknown, env: unknown, self: unknown) => string;

export interface MarkdownItInstance {
  renderer: {
    rules: {
      fence?: FenceRule;
    };
  };
}

/**
 * Install the wireframe fence renderer on a markdown-it instance.
 */
export function extendMarkdownIt<T extends MarkdownItInstance>(md: T, outputChannel: vscode.OutputChannel): T {
  try {
    outputChannel.appendLine('[Wireframe] extendMarkdownIt called by VS Code markdown preview');
    outputChannel.appendLine(`[Wireframe] markdown-it instance received: ${typeof md}`);

    const markdownConfig = vscode.workspace.getConfiguration('wireframe.markdown');
    const enabled = markdownConfig.get<boolean>('enabled', true);

    outputChannel.appendLine(`[Wireframe] markdown.enabled: ${enabled}`);

    if (!enabled) {
      outputChannel.appendLine('[Wireframe] Markdown integration is disabled, returning unmodified md');
      return md;
    }

    const lightTheme = markdownConfig.get<string>('lightTheme', 'clean');
    const darkTheme = markdownConfig.get<string>('darkTheme', 'blueprint');
    const maxSize = markdownConfig.get<number>('maxSize', 50000);

    outputChannel.appendLine(`[Wireframe] Themes: light=${lightTheme}, dark=${darkTheme}, maxSize=${maxSize}`);

    // Store original fence renderer
    const defaultFence = md.renderer.rules.fence;
    outputChannel.appendLine(`[Wireframe] Original fence renderer: ${typeof defaultFence}`);

    md.renderer.rules.fence = (tokens, idx, options, env, self): string => {
      const token = tokens[idx];
      const info = token.info.trim().toLowerCase();

      // Check if this is a wireframe code block
      if (info === 'wireframe' || info === 'wire') {
        outputChannel.appendLine(`[Wireframe] Rendering wireframe code block (${token.content.length} chars)`);

        // Use dark theme for dark mode (determined by VS Code)
        // Since we're in the extension host, we check the color theme
        const colorTheme = vscode.window.activeColorTheme;
        const isDark =
          colorTheme.kind === vscode.ColorThemeKind.Dark ||
          colorTheme.kind === vscode.ColorThemeKind.HighContrast;
        const themeName = isDark ? darkTheme : lightTheme;

        outputChannel.appendLine(`[Wireframe] Using theme: ${themeName} (isDark: ${isDark})`);

        try {
          const result = renderWireframeToHtml(token.content, themeName, { inlineStyles: true, maxSize });
          outputChannel.appendLine(`[Wireframe] Render successful, output length: ${result.length}`);
          return result;
        } catch (renderError) {
          const message = renderError instanceof Error ? renderError.message : String(renderError);
          outputChannel.appendLine(`[Wireframe] Render error: ${message}`);
          return errorBox('Wireframe Render Error:', escapeHtml(message), true);
        }
      }

      // Fall back to default rendering
      if (defaultFence) {
        return defaultFence(tokens, idx, options, env, self);
      }
      return `<pre><code class="language-${escapeHtml(info)}">${escapeHtml(token.content)}</code></pre>`;
    };

    outputChannel.appendLine('[Wireframe] Successfully installed fence renderer');
    return md;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    outputChannel.appendLine(`[Wireframe] ERROR in extendMarkdownIt: ${message}`);
    if (error instanceof Error && error.stack) {
      outputChannel.appendLine(`[Wireframe] Stack: ${error.stack}`);
    }
    // Return md unmodified to avoid breaking other extensions
    return md;
  }
}
