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
 * Text before the diagram keyword that Mermaid allows: optional YAML front
 * matter and `%%` comment / directive lines. (Mermaid strips these before
 * calling a detector; accepting them here keeps standalone use consistent.)
 */
const PREAMBLE = String.raw`^\s*(?:---\r?\n[\s\S]*?\r?\n---[^\S\r\n]*(?:\r?\n|$)\s*)?(?:%%[^\n]*(?:\n|$)\s*)*`;

/** `wireframe` as a whole word at the start: followed by whitespace, `:` or the end. */
const WIREFRAME_RE = new RegExp(`${PREAMBLE}wireframe(?=[\\s:]|$)`, 'i');

/** `wire` as a whole word at the start (the short alias). */
const WIRE_RE = new RegExp(`${PREAMBLE}wire(?=[\\s:]|$)`, 'i');

/**
 * Detector function for Wireframe diagrams.
 * Matches only the whole word `wireframe` at the start, so e.g. `wiremock` is not taken.
 */
export function detector(text: string): boolean {
  return WIREFRAME_RE.test(text);
}

/**
 * Detector for the short `wire` alias (whole word only).
 */
export function wireDetector(text: string): boolean {
  return WIRE_RE.test(text);
}

/**
 * Remove front matter and leading `%%` lines (as Mermaid does before rendering).
 */
function stripPreamble(text: string): string {
  return text.replace(new RegExp(PREAMBLE), '');
}

/**
 * Extract diagram content (removes the diagram type prefix)
 */
function extractContent(text: string): string {
  const lines = stripPreamble(text).split('\n');
  const firstLine = lines[0].trim().toLowerCase();

  // Remove the diagram type identifier from first line
  if (firstLine === 'wireframe' || firstLine === 'wire') {
    return lines.slice(1).join('\n');
  }

  // Handle inline: wireframe: ... or wire: ...
  if (firstLine.startsWith('wireframe:')) {
    lines[0] = lines[0].trimStart().substring('wireframe:'.length);
    return lines.join('\n');
  }
  if (firstLine.startsWith('wire:')) {
    lines[0] = lines[0].trimStart().substring('wire:'.length);
    return lines.join('\n');
  }

  return lines.join('\n');
}

/**
 * Undo Mermaid's encodeEntities (`#name;` turned into private markers) before parsing.
 */
function decodeMermaidEntities(text: string): string {
  return text
    .replace(/ﬂ°°(\d+)¶ß/g, '#$1;')
    .replace(/ﬂ°(\w+)¶ß/g, '#$1;');
}

/**
 * Escape text for use in SVG/XML content and attribute values
 */
export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Build an error SVG: every message is escaped and drawn on its own line.
 */
export function errorSvg(messages: string[]): string {
  const lineHeight = 16;
  const lines = messages.flatMap((m) => m.split(/\r?\n/));
  const height = 60 + lines.length * lineHeight;
  const texts = lines
    .map(
      (line, i) =>
        `<text x="10" y="${50 + i * lineHeight}" fill="#c00" font-family="monospace" font-size="12">${escapeXml(line)}</text>`
    )
    .join('\n      ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="${height}">
      <rect width="100%" height="100%" fill="#fee"/>
      <text x="10" y="30" fill="#c00" font-family="monospace">Wireframe Parse Error</text>
      ${texts}
    </svg>`;
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
      error: errors.map(e => `Line ${e.location.line}:${e.location.column}: ${e.message}`).join('\n'),
    };
  }

  return { valid: !!document };
}

/**
 * Compile diagram text (with its `wireframe` prefix) using the current config
 */
function compileDiagram(text: string, options: Partial<WireframeConfig> = {}): ReturnType<typeof compile> {
  const content = extractContent(text);
  const config = { ...currentConfig, ...options };

  return compile(content, {
    width: config.width,
    height: config.height,
    theme: config.theme,
  });
}

/**
 * Render Wireframe to an SVG string (standalone use; Mermaid uses the diagram's draw)
 */
export function renderer(
  text: string,
  options: Partial<WireframeConfig> = {}
): string {
  const { svg, errors } = compileDiagram(text, options);

  if (errors.length > 0 || !svg) {
    // Return error message as SVG
    return errorSvg(
      errors.length > 0
        ? errors.map(e => `Line ${e.line}:${e.column}: ${e.message}`)
        : ['No output']
    );
  }

  return svg;
}

/**
 * The part of an SVG element that draw writes to
 */
export interface SvgTarget {
  setAttribute(name: string, value: string): void;
  insertAdjacentHTML?(position: 'beforeend', html: string): void;
  innerHTML: string;
}

interface DocumentLike {
  getElementById(id: string): unknown;
}

/**
 * Copy a compiled SVG into the <svg> element Mermaid created: first the root
 * attributes (size, viewBox, ...), then the content.
 */
export function drawSvgInto(target: SvgTarget, svg: string): void {
  const match = /<svg\b([^>]*)>([\s\S]*)<\/svg>\s*$/.exec(svg);
  if (!match) {
    throw new Error('Wireframe: compiled output is not an SVG');
  }
  const [, attributes, content] = match;
  for (const [, name, value] of attributes.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"/g)) {
    if (name === 'id' || name === 'xmlns' || name.startsWith('xmlns:')) continue;
    target.setAttribute(name, value);
  }
  if (typeof target.insertAdjacentHTML === 'function') {
    target.insertAdjacentHTML('beforeend', content);
  } else {
    target.innerHTML += content;
  }
}

/**
 * Find the <svg id={id}> Mermaid draws into (inside the sandbox iframe
 * `#i{id}` when securityLevel is 'sandbox').
 */
function findSvgElement(id: string): SvgTarget | null {
  const doc = (globalThis as { document?: DocumentLike }).document;
  if (!doc) return null;
  const frame = doc.getElementById(`i${id}`) as { contentDocument?: DocumentLike | null } | null;
  const root = frame?.contentDocument ?? doc;
  return (root.getElementById(id) as SvgTarget | null) ?? null;
}

function formatErrors(errors: Array<{ line: number; column: number; message: string }>): string {
  return errors.map(e => `Line ${e.line}:${e.column}: ${e.message}`).join('\n');
}

/**
 * Mermaid DiagramDefinition for Wireframe: parse throws on errors (Mermaid
 * then shows its own error diagram), draw renders into the <svg> Mermaid created.
 */
export const wireframeDiagramDefinition = {
  db: {
    clear: (): void => {},
  },
  parser: {
    parse: (text: string): void => {
      const result = parser(decodeMermaidEntities(text));
      if (!result.valid) {
        throw new Error(result.error ?? 'Invalid wireframe');
      }
    },
  },
  renderer: {
    draw: (text: string, id: string, _version: string): void => {
      const { svg, errors } = compileDiagram(text);
      if (!svg) {
        throw new Error(formatErrors(errors) || 'Wireframe: no output');
      }
      const target = findSvgElement(id);
      if (!target) {
        throw new Error(`Wireframe: no <svg id="${id}"> to draw into`);
      }
      drawSvgInto(target, svg);
    },
  },
  styles: (): string => '',
};

/**
 * Mermaid external diagram definition (for mermaid.registerExternalDiagrams)
 */
export interface ExternalDiagram {
  id: string;
  detector: (text: string) => boolean;
  loader: () => Promise<{ id: string; diagram: typeof wireframeDiagramDefinition }>;
}

/**
 * Wireframe diagram definition for Mermaid
 */
export const wireframeDiagram: ExternalDiagram = {
  id: 'wireframe',
  detector,
  loader: async () => ({ id: 'wireframe', diagram: wireframeDiagramDefinition }),
};

/**
 * Alternative diagram definition using the 'wire' prefix
 */
export const wireDiagram: ExternalDiagram = {
  id: 'wire',
  detector: wireDetector,
  loader: async () => ({ id: 'wire', diagram: wireframeDiagramDefinition }),
};

/**
 * Register Wireframe with Mermaid
 *
 * Usage:
 * ```typescript
 * import mermaid from 'mermaid';
 * import { registerWireframe } from '@jonkeda/wireframe-mermaid';
 *
 * await registerWireframe(mermaid);
 * ```
 */
export async function registerWireframe(mermaid: unknown, config?: Partial<WireframeConfig>): Promise<void> {
  if (config) {
    setConfig(config);
  }

  const m = mermaid as {
    registerExternalDiagrams?: (diagrams: ExternalDiagram[]) => Promise<void> | void;
  };

  if (typeof m.registerExternalDiagrams === 'function') {
    await m.registerExternalDiagrams([wireframeDiagram, wireDiagram]);
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
): { svg: string; errors: Array<{ line: number; column: number; message: string }> } {
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
  wireDetector,
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
