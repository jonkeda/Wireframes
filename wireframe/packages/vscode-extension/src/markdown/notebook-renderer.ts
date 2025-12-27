/**
 * Notebook Renderer for Wireframe
 * 
 * This script is bundled separately and extends VS Code's notebook
 * markdown renderer to support wireframe code blocks.
 */

import { wireframePlugin } from './plugin';

interface MarkdownItAPI {
  use: (plugin: (md: unknown, options?: unknown) => void, options?: unknown) => MarkdownItAPI;
}

/**
 * Activate function called by VS Code's notebook renderer
 */
export function activate() {
  return {
    extendMarkdownIt(md: MarkdownItAPI) {
      return md.use(wireframePlugin, {
        lightTheme: 'clean',
        darkTheme: 'blueprint',
        maxSize: 50000,
      });
    },
  };
}
