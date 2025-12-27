/**
 * Markdown Preview Script for Wireframe
 * 
 * This script is bundled separately and loaded into VS Code's markdown preview.
 * It extends markdown-it to render wireframe code blocks as SVG diagrams.
 */

import { wireframePlugin } from './plugin';
import { wireframeStyles } from './styles';

interface MarkdownItAPI {
  use: (plugin: (md: unknown, options?: unknown) => void, options?: unknown) => MarkdownItAPI;
}

/**
 * Inject styles into the document
 */
function injectStyles(): void {
  if (typeof document === 'undefined') {
    return;
  }

  // Check if styles are already injected
  if (document.getElementById('wireframe-markdown-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'wireframe-markdown-styles';
  style.textContent = wireframeStyles;
  document.head.appendChild(style);
}

/**
 * Activate function called by VS Code's markdown preview
 */
export function activate() {
  // Inject styles on activation
  injectStyles();

  return {
    extendMarkdownIt(md: MarkdownItAPI) {
      // Use the wireframe plugin with default options
      // Theme will be auto-detected from VS Code's color scheme
      return md.use(wireframePlugin, {
        lightTheme: 'clean',
        darkTheme: 'blueprint',
        maxSize: 50000,
      });
    },
  };
}
