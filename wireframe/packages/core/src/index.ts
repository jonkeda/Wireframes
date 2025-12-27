// Wireframe Core Library
// Main entry point

export * from './lexer/index.js';
export * from './parser/index.js';
export * from './renderer/index.js';

import { Lexer } from './lexer/index.js';
import { Parser, parse } from './parser/index.js';
import { render, SVGRenderer, getTheme } from './renderer/index.js';

/**
 * Compile Wireframe source to SVG
 */
export function compile(
  source: string,
  options: {
    width?: number;
    height?: number;
    theme?: string;
  } = {}
): { svg: string; errors: Array<{ message: string; line: number; column: number }> } {
  const { document, errors } = parse(source);

  if (!document) {
    return {
      svg: '',
      errors: errors.map((e) => ({
        message: e.message,
        line: e.location.line,
        column: e.location.column,
      })),
    };
  }

  const svg = render(document, {
    width: options.width || 800,
    height: options.height || 600,
    theme: options.theme || document.style,
  });

  return {
    svg,
    errors: errors.map((e) => ({
      message: e.message,
      line: e.location.line,
      column: e.location.column,
    })),
  };
}

/**
 * Create a Wireframe compiler instance
 */
export function createCompiler() {
  return {
    parse,
    render,
    compile,
    Lexer,
    Parser,
    SVGRenderer,
    getTheme,
  };
}

// Default export
export default {
  compile,
  parse,
  render,
  createCompiler,
  Lexer,
  Parser,
  SVGRenderer,
  getTheme,
};
