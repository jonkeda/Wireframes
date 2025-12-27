# Wireframe Architecture Overview

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source Files:** `packages/*/package.json`, project structure

---

## 1. System Overview

Wireframe is a text-based wireframe language and toolchain that converts `.wire` files into SVG wireframe mockups. The system consists of multiple packages that work together:

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Interfaces                          │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   VS Code       │   CLI Tool      │   Mermaid Integration       │
│   Extension     │   (wireframe)   │   (mermaid-plugin)          │
├─────────────────┴─────────────────┴─────────────────────────────┤
│                        Core Library                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│   │  Lexer   │→ │  Parser  │→ │   AST    │→ │ Renderer │       │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│                        Themes Library                           │
│   clean  │  sketch  │  blueprint  │  realistic                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Package Structure

### 2.1 Monorepo Organization

```
wireframe/
├── packages/
│   ├── core/                 # @jonkeda/wireframe-core
│   ├── cli/                  # @jonkeda/wireframe-cli
│   ├── mermaid-plugin/       # @jonkeda/wireframe-mermaid-plugin
│   ├── themes/               # @jonkeda/wireframe-themes
│   └── vscode-extension/     # wireframe-vscode
├── docs/
│   ├── examples/             # Example .wire files
│   └── themes/               # Theme example files
├── package.json              # Workspace root
├── pnpm-workspace.yaml       # pnpm workspace config
└── vitest.config.ts          # Test configuration
```

### 2.2 Package Details

| Package | NPM Name | Description |
|---------|----------|-------------|
| `core` | `@jonkeda/wireframe-core` | Lexer, Parser, AST, Renderer |
| `cli` | `@jonkeda/wireframe-cli` | Command-line tool |
| `mermaid-plugin` | `@jonkeda/wireframe-mermaid-plugin` | Mermaid.js integration |
| `themes` | `@jonkeda/wireframe-themes` | Theme definitions |
| `vscode-extension` | `wireframe-vscode` | VS Code extension |

---

## 3. Core Package (`@jonkeda/wireframe-core`)

The core package contains the fundamental parsing and rendering logic.

### 3.1 Module Structure

```
packages/core/src/
├── lexer/
│   ├── lexer.ts          # Tokenizer implementation
│   ├── tokens.ts         # Token types and keywords
│   └── lexer.test.ts     # Lexer tests
├── parser/
│   ├── parser.ts         # Parser implementation
│   ├── ast.ts            # AST node definitions
│   ├── parser.test.ts    # Parser tests
│   └── examples.test.ts  # Example file validation
├── renderer/
│   ├── svg-renderer.ts   # SVG generation
│   ├── layout.ts         # Layout calculations
│   └── *.test.ts         # Renderer tests
└── index.ts              # Public API exports
```

### 3.2 Data Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Source  │───▶│  Tokens  │───▶│   AST    │───▶│   SVG    │
│  (.wire) │    │  Stream  │    │   Tree   │    │  Output  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
      │               │               │               │
      │     Lexer     │    Parser     │   Renderer    │
      │               │               │               │
      ▼               ▼               ▼               ▼
   tokenize()      parse()      render()       SVG string
```

### 3.3 Key Exports

```typescript
// Core parsing
export { Lexer } from './lexer/lexer.js';
export { Parser, parse } from './parser/parser.js';
export type { ParseResult, ParserError } from './parser/parser.js';

// AST types
export type { 
  DocumentNode, 
  LayoutNode, 
  SectionNode, 
  ControlNode,
  ComponentNode 
} from './parser/ast.js';

// Rendering
export { render, renderToSvg } from './renderer/svg-renderer.js';
export type { RenderOptions, RenderResult } from './renderer/svg-renderer.js';

// Token types
export { TokenType } from './lexer/tokens.js';
```

---

## 4. CLI Package (`@jonkeda/wireframe-cli`)

Command-line tool for converting wireframe files.

### 4.1 Commands

```bash
# Convert single file
wireframe render input.wire -o output.svg

# Convert with theme
wireframe render input.wire -o output.svg --theme sketch

# Convert to PNG
wireframe render input.wire -o output.png --format png

# Watch mode
wireframe watch input.wire -o output.svg

# Validate syntax
wireframe validate input.wire
```

### 4.2 Module Structure

```
packages/cli/src/
├── cli.ts              # CLI entry point
├── commands/
│   ├── render.ts       # Render command
│   ├── validate.ts     # Validate command
│   └── watch.ts        # Watch command
└── cli.test.ts         # CLI tests
```

---

## 5. VS Code Extension (`wireframe-vscode`)

Provides IDE support for `.wire` files.

### 5.1 Features

| Feature | Description |
|---------|-------------|
| **Syntax Highlighting** | TextMate grammar for `.wire` files |
| **Live Preview** | Real-time SVG preview panel |
| **Diagnostics** | Inline error reporting |
| **Export** | Export to SVG/PNG commands |
| **Snippets** | Code snippets for common patterns |

### 5.2 Module Structure

```
packages/vscode-extension/
├── src/
│   └── extension.ts      # Extension entry point
├── syntaxes/
│   └── wireframe.tmLanguage.json  # TextMate grammar
├── snippets/
│   └── wireframe.json    # Code snippets
├── language-configuration.json
└── package.json          # Extension manifest
```

### 5.3 Extension Activation

The extension activates for:
- Files with `.wire` extension
- Language ID: `wireframe`

---

## 6. Mermaid Plugin (`@jonkeda/wireframe-mermaid-plugin`)

Enables wireframe diagrams in Mermaid.js.

### 6.1 Usage

```markdown
```mermaid
wireframe clean
    Vertical gap=16
        Button "Hello"
    /Vertical
/wireframe
```

### 6.2 Integration

```typescript
import mermaid from 'mermaid';
import { wireframePlugin } from '@jonkeda/wireframe-mermaid-plugin';

mermaid.registerExternalDiagrams([wireframePlugin]);
```

---

## 7. Themes Package (`@jonkeda/wireframe-themes`)

Provides theme definitions for wireframe styling.

### 7.1 Available Themes

| Theme | Description |
|-------|-------------|
| `clean` | Modern, minimal wireframe style |
| `sketch` | Hand-drawn, sketchy appearance |
| `blueprint` | Technical blueprint style |
| `realistic` | High-fidelity mockup style |

### 7.2 Theme Structure

```typescript
interface Theme {
  name: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    border: string;
    // ...
  };
  fonts: {
    family: string;
    size: number;
    // ...
  };
  spacing: {
    small: number;
    medium: number;
    large: number;
  };
  // ...
}
```

---

## 8. Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Language** | TypeScript 5.x | Type-safe development |
| **Build** | Vite + esbuild | Fast builds |
| **Testing** | Vitest | Unit and integration tests |
| **Package Manager** | pnpm | Monorepo workspace |
| **Linting** | ESLint | Code quality |
| **Formatting** | Prettier | Code formatting |
| **Extension Bundling** | esbuild | VS Code extension |

---

## 9. Module Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                      vscode-extension                       │
│                            │                                │
│              ┌─────────────┴─────────────┐                  │
│              ▼                           ▼                  │
│          core ◄────────────────────── themes               │
│              ▲                                              │
│              │                                              │
│   ┌──────────┴───────────┐                                  │
│   ▼                      ▼                                  │
│  cli              mermaid-plugin                            │
└─────────────────────────────────────────────────────────────┘
```

**Dependency Rules:**
- `core` has no internal dependencies
- `themes` may depend on `core` types
- `cli`, `mermaid-plugin`, `vscode-extension` depend on `core`
- External dependencies are minimized

---

## 10. Build and Development

### 10.1 Development Setup

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Development mode
pnpm dev
```

### 10.2 Build Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run all tests |
| `pnpm lint` | Lint all packages |
| `pnpm format` | Format code |

### 10.3 Testing Strategy

- **Unit Tests:** Lexer, Parser, Renderer functions
- **Integration Tests:** Full pipeline (source → SVG)
- **Example Tests:** Validate all example files parse correctly
- **Snapshot Tests:** SVG output consistency

---

## 11. Quality Metrics

### 11.1 Performance Targets

| Metric | Target |
|--------|--------|
| Parse time (100 lines) | < 10ms |
| Render time (simple) | < 50ms |
| Render time (complex) | < 200ms |
| VS Code preview update | < 100ms |

### 11.2 Test Coverage

| Package | Target Coverage |
|---------|-----------------|
| core | 90%+ |
| cli | 80%+ |
| mermaid-plugin | 80%+ |

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Complete language reference |
| [02_Lexer_Specification](./02_Lexer_Specification.md) | Token definitions |
| [03_Parser_Specification](./03_Parser_Specification.md) | Parsing rules |
| [04_AST_Reference](./04_AST_Reference.md) | AST node types |
| [05_Renderer_Design](./05_Renderer_Design.md) | SVG rendering |
| [06_Component_Library](./06_Component_Library.md) | UI components |

---

*Wireframe Architecture Overview v1.0 - December 2025*
