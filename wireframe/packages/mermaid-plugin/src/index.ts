/**
 * Wireframe Mermaid Plugin
 * 
 * Integrates Wireframe diagrams into Mermaid.js
 */

import { compile, parse, render, getTheme } from '@jonkeda/wireframe-core';

/**
 * Configuration options for Wireframe diagrams
 */
export interface WireframeConfig {
  /** SVG width in pixels */
  width?: number;
  /** SVG height in pixels */
  height?: number;
  /** Theme name: clean, sketch, blueprint, realistic */
  theme?: 'clean' | 'sketch' | 'blueprint' | 'realistic';
  /** Whether to show grid lines */
  showGrid?: boolean;
  /** Default font family */
  fontFamily?: string;
}

/** Default configuration */
const defaultConfig: WireframeConfig = {
  width: 800,
  height: 600,
  theme: 'clean',
  showGrid: false,
};

/** Current configuration */
let currentConfig: WireframeConfig = { ...defaultConfig };

/**
 * Set configuration for Wireframe diagrams
 */
export function setConfig(config: Partial<WireframeConfig>): void {
  currentConfig = { ...currentConfig, ...config };
}

/**
 * Get current configuration
 */
export function getConfig(): WireframeConfig {
  return { ...currentConfig };
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): void {
  currentConfig = { ...defaultConfig };
}

/**
 * Detector function for Wireframe diagrams
 * Detects both 'wireframe' and 'wire' prefixes
 */
export function detector(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return (
    trimmed.startsWith('wireframe') ||
    trimmed.startsWith('wire')
  );
}

/**
 * Extract diagram content (removes the diagram type prefix)
 */
function extractContent(text: string): string {
  const lines = text.split('\n');
  const firstLine = lines[0].trim().toLowerCase();
  
  // Remove the diagram type identifier from first line
  if (firstLine === 'wireframe' || firstLine === 'wire') {
    return lines.slice(1).join('\n');
  }
  
  // Handle inline: wireframe: ... or wire: ...
  if (firstLine.startsWith('wireframe:')) {
    lines[0] = lines[0].substring('wireframe:'.length);
    return lines.join('\n');
  }
  if (firstLine.startsWith('wire:')) {
    lines[0] = lines[0].substring('wire:'.length);
    return lines.join('\n');
  }
  
  return text;
}

/**
 * Parse Wireframe source
 */
export function parser(text: string): { valid: boolean; error?: string } {
  const content = extractContent(text);
  const { document, errors } = parse(content);
  
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
  options: Partial<WireframeConfig> = {}
): string {
  const content = extractContent(text);
  const config = { ...currentConfig, ...options };
  
  const { svg, errors } = compile(content, {
    width: config.width,
    height: config.height,
    theme: config.theme,
  });
  
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
 * Alternative diagram definition using 'wire' prefix
 */
export const wireDiagram = {
  id: 'wire',
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
 * import { registerWireframe } from '@jonkeda/wireframe-mermaid';
 * 
 * registerWireframe(mermaid);
 * ```
 */
export function registerWireframe(mermaid: unknown, config?: Partial<WireframeConfig>): void {
  if (config) {
    setConfig(config);
  }
  
  const m = mermaid as { 
    registerExternalDiagrams?: (diagrams: unknown[]) => void;
    mermaidAPI?: { getConfig?: () => Record<string, unknown> };
  };
  
  if (typeof m.registerExternalDiagrams === 'function') {
    m.registerExternalDiagrams([wireframeDiagram, wireDiagram]);
  } else {
    // eslint-disable-next-line no-console
    console.warn('Mermaid.registerExternalDiagrams not available. Wireframe plugin not registered.');
  }
}

/**
 * Standalone render function for use without Mermaid
 */
export function renderWireframe(
  source: string,
  options?: Partial<WireframeConfig>
): { svg: string; errors: Array<{ line: number; message: string }> } {
  const config = { ...currentConfig, ...options };
  return compile(source, {
    width: config.width,
    height: config.height,
    theme: config.theme,
  });
}

// Default export for convenience
export default {
  detector,
  parser,
  renderer,
  wireframeDiagram,
  wireDiagram,
  registerWireframe,
  renderWireframe,
  setConfig,
  getConfig,
  resetConfig,
  compile,
  parse,
  render,
  getTheme,
};
