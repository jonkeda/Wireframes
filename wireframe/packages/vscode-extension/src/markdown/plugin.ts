/**
 * markdown-it plugin for rendering wireframe code blocks
 */

import { Parser, SVGRenderer, getTheme } from '@jonkeda/wireframe-core';
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
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render a wireframe to SVG
 */
function renderWireframe(
  source: string,
  defaultTheme: string,
  maxSize: number
): string {
  // Size check
  if (source.length > maxSize) {
    return `<div class="wireframe-error">
      <strong>Wireframe Error:</strong> Diagram exceeds maximum size of ${maxSize} characters.
    </div>`;
  }

  try {
    const parser = new Parser();
    const result = parser.parse(source);

    if (result.errors.length > 0) {
      const errorMessages = result.errors
        .map((e) => `Line ${e.location.line}: ${e.message}`)
        .join('<br>');
      return `<div class="wireframe-error">
        <strong>Wireframe Parse Error:</strong><br>${errorMessages}
      </div>`;
    }

    if (!result.document) {
      return `<div class="wireframe-error">
        <strong>Wireframe Error:</strong> Failed to parse document.
      </div>`;
    }

    // Determine theme from document or use default
    const documentTheme = result.document.theme || defaultTheme;
    const theme = getTheme(documentTheme);

    const renderer = new SVGRenderer(theme);
    const svg = renderer.render(result.document);

    return `<div class="wireframe-diagram" data-theme="${documentTheme}">${svg}</div>`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `<div class="wireframe-error">
      <strong>Wireframe Error:</strong> ${escapeHtml(message)}
    </div>`;
  }
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
      return renderWireframe(token.content, theme, maxSize);
    }

    // Fall back to default rendering for other languages
    if (defaultFence) {
      return defaultFence(tokens, idx, opts, env, self);
    }

    // Basic fallback if no default fence
    return `<pre><code class="language-${info}">${escapeHtml(token.content)}</code></pre>`;
  };
}
