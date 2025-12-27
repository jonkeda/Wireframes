// Wireframe Core Library
// Main entry point

export * from './lexer/index.js';
export * from './parser/index.js';
export * from './renderer/index.js';
export * from './cache.js';
export * from './performance.js';
export * from './accessibility.js';

import { Lexer } from './lexer/index.js';
import { Parser, parse } from './parser/index.js';
import { render, SVGRenderer, getTheme } from './renderer/index.js';
import {
  renderCache,
  generateCacheKey,
  getAllCacheStats,
  clearAllCaches,
} from './cache.js';
import {
  perfCollector,
  benchmark,
  formatBenchmarkResult,
  createTimer,
  debounce,
  throttle,
} from './performance.js';
import {
  checkContrast,
  auditTheme,
  getAriaRole,
  getAriaAttributes,
} from './accessibility.js';

/**
 * Compile options
 */
export interface CompileOptions {
  width?: number;
  height?: number;
  theme?: string;
  /** Use cache for repeated compilations (default: true) */
  useCache?: boolean;
}

/**
 * Compile result
 */
export interface CompileResult {
  svg: string;
  errors: Array<{ message: string; line: number; column: number }>;
  /** Whether the result was from cache */
  cached?: boolean;
  /** Time taken in milliseconds */
  duration?: number;
}

/**
 * Compile Wireframe source to SVG
 */
export function compile(
  source: string,
  options: CompileOptions = {}
): CompileResult {
  const timer = createTimer();
  const useCache = options.useCache !== false;

  // Check render cache first
  if (useCache) {
    const cacheKey = generateCacheKey(source, options as Record<string, unknown>);
    const cached = renderCache.get(cacheKey);
    if (cached) {
      return {
        svg: cached,
        errors: [],
        cached: true,
        duration: timer.stop(),
      };
    }
  }

  const { document, errors } = parse(source);

  if (!document) {
    return {
      svg: '',
      errors: errors.map((e) => ({
        message: e.message,
        line: e.location.line,
        column: e.location.column,
      })),
      cached: false,
      duration: timer.stop(),
    };
  }

  const svg = render(document, {
    width: options.width || 800,
    height: options.height || 600,
    theme: options.theme || document.style,
  });

  // Store in cache
  if (useCache) {
    const cacheKey = generateCacheKey(source, options as Record<string, unknown>);
    renderCache.set(cacheKey, svg, svg.length);
  }

  return {
    svg,
    errors: errors.map((e) => ({
      message: e.message,
      line: e.location.line,
      column: e.location.column,
    })),
    cached: false,
    duration: timer.stop(),
  };
}

/**
 * Compile with caching disabled (for benchmarking)
 */
export function compileNoCache(
  source: string,
  options: Omit<CompileOptions, 'useCache'> = {}
): CompileResult {
  return compile(source, { ...options, useCache: false });
}

/**
 * Create a Wireframe compiler instance
 */
export function createCompiler() {
  return {
    parse,
    render,
    compile,
    compileNoCache,
    Lexer,
    Parser,
    SVGRenderer,
    getTheme,
    // Cache utilities
    getCacheStats: getAllCacheStats,
    clearCache: clearAllCaches,
    // Performance utilities
    benchmark,
    formatBenchmarkResult,
    perfCollector,
  };
}

/**
 * Validate Wireframe source without rendering
 */
export function validate(source: string): {
  valid: boolean;
  errors: Array<{ message: string; line: number; column: number }>;
} {
  const { document, errors } = parse(source);
  return {
    valid: !!document && errors.length === 0,
    errors: errors.map((e) => ({
      message: e.message,
      line: e.location.line,
      column: e.location.column,
    })),
  };
}

// Default export
export default {
  compile,
  compileNoCache,
  validate,
  parse,
  render,
  createCompiler,
  Lexer,
  Parser,
  SVGRenderer,
  getTheme,
  // Cache utilities
  getCacheStats: getAllCacheStats,
  clearCache: clearAllCaches,
  // Performance utilities
  benchmark,
  formatBenchmarkResult,
  debounce,
  throttle,
  createTimer,
  perfCollector,
  // Accessibility utilities
  checkContrast,
  auditTheme,
  getAriaRole,
  getAriaAttributes,
};
