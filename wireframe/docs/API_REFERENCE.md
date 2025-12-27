# Wireframe API Reference

Complete API documentation for the Wireframe library.

## Table of Contents

- [Core Functions](#core-functions)
- [Classes](#classes)
- [Types](#types)
- [Cache API](#cache-api)
- [Performance API](#performance-api)
- [Accessibility API](#accessibility-api)

---

## Core Functions

### compile(source, options?)

Compile Wireframe source code to SVG.

```typescript
function compile(source: string, options?: CompileOptions): CompileResult;
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| source | `string` | Wireframe source code |
| options | `CompileOptions` | Optional compilation settings |

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| width | `number` | 800 | SVG width in pixels |
| height | `number` | 600 | SVG height in pixels |
| theme | `string` | 'clean' | Theme name |
| useCache | `boolean` | true | Enable result caching |

**Returns:** `CompileResult`

```typescript
interface CompileResult {
  svg: string;                                    // Generated SVG
  errors: Array<{message, line, column}>;         // Parse errors
  cached?: boolean;                               // From cache?
  duration?: number;                              // Time in ms
}
```

**Example:**

```typescript
import { compile } from '@jonkeda/wireframe-core';

const { svg, errors } = compile(`
wireframe sketch
    Button "Click Me"
/wireframe
`, {
  width: 400,
  height: 300,
  theme: 'sketch'
});
```

---

### parse(source)

Parse Wireframe source into an AST.

```typescript
function parse(source: string): ParseResult;
```

**Returns:**

```typescript
interface ParseResult {
  document: DocumentNode | null;
  errors: ParseError[];
}
```

**Example:**

```typescript
import { parse } from '@jonkeda/wireframe-core';

const { document, errors } = parse(`
wireframe clean
    Header
        Label "Title"
    /Header
/wireframe
`);
if (document) {
  console.log(document.children.length);
}
```

---

### render(document, options?)

Render an AST to SVG.

```typescript
function render(document: DocumentNode, options?: RenderOptions): string;
```

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| width | `number` | 800 | SVG width |
| height | `number` | 600 | SVG height |
| theme | `string` | 'clean' | Theme name |
| padding | `number` | theme | Padding around content |
| accessible | `boolean` | true | Include ARIA attributes |
| title | `string` | - | SVG title for accessibility |
| description | `string` | - | SVG description |
| lang | `string` | - | Language code |

---

### validate(source)

Validate source code without rendering.

```typescript
function validate(source: string): {
  valid: boolean;
  errors: Array<{message, line, column}>;
};
```

**Example:**

```typescript
const { valid, errors } = validate(`
wireframe clean
    Button @invalid
/wireframe
`);
if (!valid) {
  errors.forEach(e => console.error(`Line ${e.line}: ${e.message}`));
}
```

---

### getTheme(name)

Get a theme by name.

```typescript
function getTheme(name: string): Theme;
```

**Available Themes:** `'clean'`, `'sketch'`, `'blueprint'`, `'realistic'`

---

### createCompiler()

Create a compiler instance with all functions.

```typescript
function createCompiler(): {
  parse: typeof parse;
  render: typeof render;
  compile: typeof compile;
  compileNoCache: typeof compileNoCache;
  Lexer: typeof Lexer;
  Parser: typeof Parser;
  SVGRenderer: typeof SVGRenderer;
  getTheme: typeof getTheme;
  getCacheStats: typeof getAllCacheStats;
  clearCache: typeof clearAllCaches;
  benchmark: typeof benchmark;
  formatBenchmarkResult: typeof formatBenchmarkResult;
  perfCollector: PerformanceCollector;
};
```

---

## Classes

### Lexer

Tokenizes Wireframe source code.

```typescript
class Lexer {
  constructor(source: string, options?: LexerOptions);
  tokenize(): { tokens: Token[]; errors: LexerError[] };
}
```

**Options:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| includeComments | `boolean` | false | Include comment tokens |
| tabWidth | `number` | 4 | Tab width for indentation |

---

### Parser

Parses tokens into an AST.

```typescript
class Parser {
  constructor(tokens: Token[]);
  parse(): ParseResult;
}
```

---

### SVGRenderer

Renders AST to SVG.

```typescript
class SVGRenderer {
  constructor(theme: Theme);
  render(document: DocumentNode, options?: RenderOptions): string;
}
```

---

### LRUCache<T>

Generic LRU cache implementation.

```typescript
class LRUCache<T> {
  constructor(options?: { maxSize?: number; maxEntries?: number });
  get(key: string): T | undefined;
  set(key: string, value: T, size?: number): void;
  has(key: string): boolean;
  delete(key: string): boolean;
  clear(): void;
  getStats(): CacheStats;
}
```

---

### PerformanceCollector

Collects performance measurements.

```typescript
class PerformanceCollector {
  constructor(maxMeasurements?: number);
  measure<T>(name: string, fn: () => T): T;
  measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
  getMeasurements(name?: string): MeasureResult[];
  getAverageDuration(name: string): number;
  getSummary(): Record<string, { count, avgDuration, totalDuration }>;
  clear(): void;
}
```

---

## Types

### DocumentNode

Root AST node.

```typescript
interface DocumentNode {
  type: 'Document';
  children: ElementNode[];
  style?: string;
  title?: string;
}
```

### ElementNode

Base element type.

```typescript
type ElementNode = ControlNode | LayoutNode | SectionNode | ComponentNode;
```

### ControlNode

UI control node.

```typescript
interface ControlNode {
  type: 'Control';
  controlType: string;
  text?: string;
  modifiers: Map<string, unknown>;
  children: ElementNode[];
}
```

### Theme

Theme definition.

```typescript
interface Theme {
  name: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    primaryText: string;
    text: string;
    textSecondary: string;
    textDisabled: string;
    border: string;
    borderLight: string;
    success: string;
    error: string;
    warning: string;
    info: string;
  };
  typography: {
    fontFamily: string;
    fontSize: number;
    fontSizeSmall: number;
    fontSizeLarge: number;
    fontWeight: number;
    fontWeightBold: number;
    lineHeight: number;
  };
  spacing: {
    padding: number;
    gap: number;
    borderRadius: number;
  };
  effects: {
    shadow: string;
    roughness?: number;
  };
}
```

---

## Cache API

### Global Caches

```typescript
// Pre-configured caches
const parseCache: LRUCache<ParseResult>;
const renderCache: LRUCache<string>;
const tokenCache: LRUCache<TokenResult>;
```

### Functions

```typescript
// Generate cache key
function generateCacheKey(source: string, options?: Record<string, unknown>): string;

// Get all stats
function getAllCacheStats(): {
  parse: CacheStats;
  render: CacheStats;
  token: CacheStats;
};

// Clear all caches
function clearAllCaches(): void;
```

### CacheStats

```typescript
interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  entries: number;
  hitRate: number;
}
```

---

## Performance API

### benchmark(name, fn, options?)

Run a benchmark.

```typescript
function benchmark(
  name: string,
  fn: () => void,
  options?: { iterations?: number; warmup?: number }
): BenchmarkResult;
```

**Example:**

```typescript
const result = benchmark('parse', () => {
  parse(`
wireframe clean
    Button "Test"
/wireframe
`);
}, { iterations: 1000 });

console.log(formatBenchmarkResult(result));
```

### BenchmarkResult

```typescript
interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  meanTime: number;
  minTime: number;
  maxTime: number;
  stdDev: number;
  opsPerSecond: number;
}
```

### Utilities

```typescript
// Create a timer
function createTimer(): { stop: () => number; elapsed: () => number };

// Debounce function
function debounce<T>(fn: T, delay: number): T;

// Throttle function
function throttle<T>(fn: T, limit: number): T;

// Global collector
const perfCollector: PerformanceCollector;
```

---

## Accessibility API

### checkContrast(foreground, background)

Check color contrast ratio.

```typescript
function checkContrast(foreground: string, background: string): ContrastResult;
```

**Returns:**

```typescript
interface ContrastResult {
  ratio: number;
  passesAA: boolean;      // 4.5:1 for normal text
  passesAAA: boolean;     // 7:1 for normal text
  passesAALarge: boolean; // 3:1 for large text
  passesAAALarge: boolean;
}
```

### auditTheme(theme)

Audit a theme for WCAG compliance.

```typescript
function auditTheme(theme: Theme): A11yAuditResult;
```

**Returns:**

```typescript
interface A11yAuditResult {
  passed: boolean;
  issues: A11yIssue[];
  score: number;  // 0-100
}
```

### getAriaRole(controlType)

Get ARIA role for a control type.

```typescript
function getAriaRole(controlType: string): string;
```

### getAriaAttributes(controlType, props)

Get ARIA attributes for a control.

```typescript
function getAriaAttributes(
  controlType: string,
  props: Record<string, unknown>
): Record<string, string>;
```

### Utilities

```typescript
// Parse hex to RGB
function hexToRgb(hex: string): { r, g, b } | null;

// Get relative luminance
function getRelativeLuminance(r: number, g: number, b: number): number;

// Get contrast ratio
function getContrastRatio(color1: string, color2: string): number;

// Suggest accessible color
function suggestAccessibleColor(background: string, preferLight?: boolean): string;

// Format ARIA attributes
function formatAriaAttributes(attrs: Record<string, string>): string;
```

---

## Default Export

The default export provides all common functions:

```typescript
import wireframe from '@jonkeda/wireframe-core';

wireframe.compile(source);
wireframe.parse(source);
wireframe.render(document);
wireframe.validate(source);
wireframe.getTheme('clean');
wireframe.getCacheStats();
wireframe.clearCache();
wireframe.benchmark('test', fn);
wireframe.checkContrast('#000', '#fff');
wireframe.auditTheme(theme);
```
