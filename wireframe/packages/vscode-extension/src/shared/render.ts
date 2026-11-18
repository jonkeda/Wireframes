/**
 * Render a wireframe code block to HTML for the Markdown integrations.
 *
 * This module must not import `vscode`: it is used by the extension host
 * (markdown-it plugin), by the browser-side Markdown preview script and by
 * unit tests.
 */

import { Parser, SVGRenderer, getTheme } from '@jonkeda/wireframe-core';
import { declaredStyle, escapeHtml } from './html';

export interface RenderToHtmlOptions {
  /**
   * Put the colours on the elements themselves (for previews without the
   * wireframe stylesheet). Without it, the markup relies on the classes
   * `wireframe-diagram` / `wireframe-error` and `data-theme`.
   */
  inlineStyles?: boolean;
  /** Maximum source length; larger sources render an error. */
  maxSize?: number;
}

const ERROR_STYLE =
  'padding: 12px; background: #5a1d1d; border: 1px solid #be1100; border-radius: 4px; color: #f48771; font-family: monospace; font-size: 13px;';

/**
 * An error box. `bodyHtml` must already be escaped.
 */
export function errorBox(title: string, bodyHtml: string, inlineStyles = false): string {
  const style = inlineStyles ? ` style="${ERROR_STYLE}"` : '';
  return `<div class="wireframe-error"${style}>
        <strong>${escapeHtml(title)}</strong> ${bodyHtml}
      </div>`;
}

/**
 * Render wireframe source to HTML.
 *
 * The theme is the one the wireframe declares (`wireframe sketch`); when it
 * declares none, `defaultTheme` is used.
 */
export function renderWireframeToHtml(
  source: string,
  defaultTheme: string,
  options: RenderToHtmlOptions = {}
): string {
  const inline = options.inlineStyles === true;

  if (options.maxSize !== undefined && source.length > options.maxSize) {
    return errorBox(
      'Wireframe Error:',
      `Diagram exceeds maximum size of ${escapeHtml(String(options.maxSize))} characters.`,
      inline
    );
  }

  try {
    const parser = new Parser();
    const result = parser.parse(source);

    if (result.errors.length > 0) {
      const errorMessages = result.errors
        .map((e) => `Line ${escapeHtml(String(e.location.line))}: ${escapeHtml(e.message)}`)
        .join('<br>');
      return errorBox('Wireframe Parse Error:', `<br>${errorMessages}`, inline);
    }

    if (!result.document) {
      return errorBox('Wireframe Error:', 'Failed to parse document.', inline);
    }

    const themeName = declaredStyle(source) || defaultTheme;
    const theme = getTheme(themeName);

    const renderer = new SVGRenderer(theme);
    const svg = renderer.render(result.document);

    if (inline) {
      const bgColor = themeName === 'blueprint' ? '#1a365d' : '#ffffff';
      const borderColor = themeName === 'blueprint' ? '#2a4a7f' : '#e0e0e0';
      return `<div class="wireframe-diagram" data-theme="${escapeHtml(themeName)}" style="margin: 16px 0; padding: 16px; background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 4px; overflow-x: auto;">${svg}</div>`;
    }

    return `<div class="wireframe-diagram" data-theme="${escapeHtml(themeName)}">${svg}</div>`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return errorBox('Wireframe Error:', escapeHtml(message), inline);
  }
}
