/**
 * markdown-it plugin for rendering wireframe code blocks
 */

import { escapeHtml } from '../shared/html';
import { renderWireframeToHtml } from '../shared/render';
import { detectTheme, getThemeForMode } from './theme-detector';

interface WireframePluginOptions {
  lightTheme?: string;
  darkTheme?: string;
  maxSize?: number;
}

interface MarkdownIt {
  renderer: {
    rules: {
      fence?: (
        tokens: Token[],
        idx: number,
        options: unknown,
        env: unknown,
        self: Renderer
      ) => string;
    };
  };
}

interface Token {
  info: string;
  content: string;
}

interface Renderer {
  render(tokens: Token[], options: unknown, env: unknown): string;
}

/**
 * markdown-it plugin that renders wireframe code blocks
 */
export function wireframePlugin(
  md: MarkdownIt,
  options: WireframePluginOptions = {}
): void {
  const lightTheme = options.lightTheme || 'clean';
  const darkTheme = options.darkTheme || 'blueprint';
  const maxSize = options.maxSize || 50000;

  // Store the original fence renderer
  const defaultFence = md.renderer.rules.fence;

  md.renderer.rules.fence = (
    tokens: Token[],
    idx: number,
    opts: unknown,
    env: unknown,
    self: Renderer
  ): string => {
    const token = tokens[idx];
    const info = token.info.trim().toLowerCase();

    // Check if this is a wireframe code block
    if (info === 'wireframe' || info === 'wire') {
      const mode = detectTheme();
      const theme = getThemeForMode(mode, lightTheme, darkTheme);
      return renderWireframeToHtml(token.content, theme, { maxSize });
    }

    // Fall back to default rendering for other languages
    if (defaultFence) {
      return defaultFence(tokens, idx, opts, env, self);
    }

    // Basic fallback if no default fence
    return `<pre><code class="language-${escapeHtml(info)}">${escapeHtml(token.content)}</code></pre>`;
  };
}
