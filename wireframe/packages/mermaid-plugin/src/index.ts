/**
 * Wireframe Mermaid Plugin
 * 
 * Integrates Wireframe diagrams into Mermaid.js
 */

import { compile, parse, render, getTheme } from '@aspect-ui/wireframe-core';

/**
 * Detector function for Wireframe diagrams
 */
export function detector(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.startsWith('wireframe') || trimmed.startsWith('wire');
}

/**
 * Parse Wireframe source
 */
export function parser(text: string): { valid: boolean; error?: string } {
  const { document, errors } = parse(text);
  
  if (errors.length > 0) {
    return {
      valid: false,
      error: errors.map(e => `Line ${e.location.line}: ${e.message}`).join('\n'),
    };
  }
  
  return { valid: !!document };
}

/**
 * Render Wireframe to SVG
 */
export function renderer(
  text: string,
  options: { width?: number; height?: number; theme?: string } = {}
): string {
  const { svg, errors } = compile(text, options);
  
  if (errors.length > 0 || !svg) {
    // Return error message as SVG
    const errorMessage = errors.map(e => `Line ${e.line}: ${e.message}`).join('\\n');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100">
      <rect width="100%" height="100%" fill="#fee"/>
      <text x="10" y="30" fill="#c00" font-family="monospace">Wireframe Parse Error</text>
      <text x="10" y="50" fill="#c00" font-family="monospace" font-size="12">${errorMessage}</text>
    </svg>`;
  }
  
  return svg;
}

/**
 * Wireframe diagram definition for Mermaid
 */
export const wireframeDiagram = {
  id: 'wireframe',
  detector,
  parser: {
    parse: (text: string) => parser(text),
  },
  renderer: {
    render: (text: string, _id: string, _version: string) => renderer(text),
  },
};

/**
 * Register Wireframe with Mermaid
 * 
 * Usage:
 * ```typescript
 * import mermaid from 'mermaid';
 * import { registerWireframe } from '@aspect-ui/wireframe-mermaid';
 * 
 * registerWireframe(mermaid);
 * ```
 */
export function registerWireframe(mermaid: unknown): void {
  const m = mermaid as { registerExternalDiagrams?: (diagrams: unknown[]) => void };
  
  if (typeof m.registerExternalDiagrams === 'function') {
    m.registerExternalDiagrams([wireframeDiagram]);
  } else {
    // eslint-disable-next-line no-console
    console.warn('Mermaid.registerExternalDiagrams not available. Wireframe plugin not registered.');
  }
}

// Default export for convenience
export default {
  detector,
  parser,
  renderer,
  wireframeDiagram,
  registerWireframe,
  compile,
  parse,
  render,
  getTheme,
};
