# UIMMD Architecture Overview

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft

---

## 1. Executive Summary

UIMMD (UI Mermaid Markdown) is a text-based wireframe language that extends the Mermaid ecosystem to support UI wireframe diagrams. This document describes the overall architecture for:

1. **Mermaid Integration** - Adding UIMMD as a new diagram type to Mermaid.js
2. **VSCode Extension** - Real-time preview and editing support for `.uimmd` files

---

## 2. System Context

```
...........................................................................
.                           User Environment                               .
...........................................................................
.                                                                          .
.  ................    ................    ................              .
.  .   Markdown   .    .    VSCode    .    .   Web Apps   .              .
.  .    Files     .    .   Extension  .    .  (Preview)   .              .
.  ................    ................    ................              .
.         .                   .                   .                       .
.         .........................................                       .
.                             .                                            .
.                    ...................                                  .
.                    .   UIMMD Core    .                                  .
.                    .    Library      .                                  .
.                    ...................                                  .
.                             .                                            .
.         .........................................                       .
.         .                   .                   .                       .
.  ...............    ...............    ...............                .
.  .   Parser    .    .  Renderer   .    .   Themes    .                .
.  .   Module    .    .   Module    .    .   Module    .                .
.  ...............    ...............    ...............                .
.                                                                          .
...........................................................................
```

---

## 3. Architecture Principles

### 3.1 Design Goals

| Goal | Description |
|------|-------------|
| **Extensibility** | Easy to add new components and layouts |
| **Portability** | Works in browser, Node.js, and VSCode |
| **Performance** | Fast parsing and rendering for real-time preview |
| **Compatibility** | Integrates seamlessly with Mermaid ecosystem |
| **Accessibility** | Generated wireframes are accessible |

### 3.2 Key Decisions

| Decision | Rationale |
|----------|-----------|
| TypeScript | Type safety, better tooling, Mermaid compatibility |
| SVG Output | Scalable, styleable, works everywhere |
| CSS Variables | Easy theming, runtime customization |
| Modular Design | Separate parser, renderer, themes |

---

## 4. High-Level Architecture

### 4.1 Component Overview

```
...................................................................
.                        UIMMD System                              .
...................................................................
.                                                                  .
.  ...........................................................   .
.  .                    Integration Layer                     .   .
.  .  ...............  ...............  ...................  .   .
.  .  .   Mermaid   .  .   VSCode    .  .   Standalone    .  .   .
.  .  .   Plugin    .  .  Extension  .  .      CLI        .  .   .
.  .  ...............  ...............  ...................  .   .
.  ...........................................................   .
.                              .                                   .
.  ...........................................................   .
.  .                      Core Library                        .   .
.  .  ...........  ............  ..........  .............  .   .
.  .  .  Lexer  .. .  Parser  .. .  AST   .. . Renderer  .  .   .
.  .  ...........  ............  ..........  .............  .   .
.  ...........................................................   .
.                              .                                   .
.  ...........................................................   .
.  .                    Support Modules                       .   .
.  .  ............  .............  ......................   .   .
.  .  .  Themes  .  . Component .  .  Layout Engine     .   .   .
.  .  .          .  .  Library  .  .                    .   .   .
.  .  ............  .............  ......................   .   .
.  ...........................................................   .
.                                                                  .
...................................................................
```

### 4.2 Core Modules

| Module | Responsibility |
|--------|----------------|
| **Lexer** | Tokenizes UIMMD source text |
| **Parser** | Builds Abstract Syntax Tree (AST) |
| **AST** | Represents document structure |
| **Renderer** | Generates SVG/HTML output |
| **Themes** | Provides styling (sketch, clean, etc.) |
| **Components** | Individual UI element renderers |
| **Layout Engine** | Calculates positions and sizes |

---

## 5. Data Flow

### 5.1 Rendering Pipeline

```
............    ............    ............    ............    ............
.  Source  .    .  Tokens  .    .   AST    .    .  Layout  .    .  Output  .
.   Text   . . .  Stream  . . .   Tree   . . .   Tree   . . .  SVG/HTML .
............    ............    ............    ............    ............
     .               .               .               .               .
     .    Lexer      .    Parser     .    Layout     .   Renderer    .
     .               .               .    Engine     .               .
     .................................................................
```

### 5.2 Processing Steps

1. **Lexing**: Source text . Token stream
2. **Parsing**: Tokens . Abstract Syntax Tree
3. **Validation**: AST validation and error reporting
4. **Layout**: Calculate sizes and positions
5. **Rendering**: Generate SVG elements
6. **Styling**: Apply theme CSS

---

## 6. Module Specifications

### 6.1 Lexer Module

```typescript
interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}

enum TokenType {
    KEYWORD,        // Button, Label, Vertical, etc.
    STRING,         // "quoted text"
    IDENTIFIER,     // :id, .binding
    ATTRIBUTE,      // key=value
    ICON,           // $iconname
    NAVIGATION,     // @target
    COMMENT,        // // or /* */
    INDENT,         // Indentation level
    NEWLINE,
    EOF
}
```

### 6.2 Parser Module

```typescript
interface ASTNode {
    type: NodeType;
    attributes: Record<string, any>;
    children: ASTNode[];
    location: SourceLocation;
}

interface Document extends ASTNode {
    type: 'Document';
    style: 'sketch' | 'clean' | 'blueprint' | 'realistic';
    metadata: DocumentMetadata;
}

interface Control extends ASTNode {
    type: 'Control';
    controlType: ControlType;
    id.: string;
    binding.: string;
}
```

### 6.3 Renderer Module

```typescript
interface Renderer {
    render(ast: Document, options: RenderOptions): RenderResult;
}

interface RenderOptions {
    theme: Theme;
    width.: number;
    height.: number;
    scale.: number;
}

interface RenderResult {
    svg: string;
    width: number;
    height: number;
    elements: ElementMap;
}
```

---

## 7. Integration Points

### 7.1 Mermaid Integration

```typescript
// Register UIMMD as a Mermaid diagram type
mermaid.registerDiagram('uiwire', {
    detector: (text: string) => text.match(/^\s*uiwire\s+(sketch|clean|blueprint|realistic)/),
    parser: uimmdParser,
    renderer: uimmdRenderer,
    styles: uimmdStyles
});
```

### 7.2 VSCode Extension

```typescript
// Extension activation
export function activate(context: vscode.ExtensionContext) {
    // Register preview provider
    const provider = new UimmdPreviewProvider(context);
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider('uimmd.preview', provider)
    );
    
    // Register language features
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider('uimmd', new UimmdCompletionProvider()),
        vscode.languages.registerHoverProvider('uimmd', new UimmdHoverProvider()),
        vscode.languages.registerDefinitionProvider('uimmd', new UimmdDefinitionProvider())
    );
}
```

---

## 8. Package Structure

```
uimmd/
... packages/
.   ... core/                    # Core library
.   .   ... src/
.   .   .   ... lexer/
.   .   .   ... parser/
.   .   .   ... ast/
.   .   .   ... renderer/
.   .   .   ... layout/
.   .   .   ... index.ts
.   .   ... package.json
.   .   ... tsconfig.json
.   .
.   ... mermaid-plugin/          # Mermaid integration
.   .   ... src/
.   .   .   ... detector.ts
.   .   .   ... diagram.ts
.   .   .   ... index.ts
.   .   ... package.json
.   .
.   ... vscode-extension/        # VSCode extension
.   .   ... src/
.   .   .   ... extension.ts
.   .   .   ... preview/
.   .   .   ... language/
.   .   .   ... commands/
.   .   ... syntaxes/
.   .   ... package.json
.   .
.   ... themes/                  # Theme packages
.   .   ... sketch/
.   .   ... clean/
.   .   ... blueprint/
.   .   ... realistic/
.   .
.   ... cli/                     # Command-line tool
.       ... src/
.       ... package.json
.
... docs/                        # Documentation
... examples/                    # Example wireframes
... tests/                       # Test suites
... package.json                 # Workspace root
... tsconfig.json
... README.md
```

---

## 9. Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Language | TypeScript 5.x | Type safety, Mermaid compatibility |
| Build | Vite / esbuild | Fast builds, tree-shaking |
| Testing | Vitest | Fast, TypeScript-native |
| Linting | ESLint + Prettier | Code quality |
| Package Manager | pnpm | Workspace support, efficiency |
| CI/CD | GitHub Actions | Standard, free for OSS |
| Documentation | TypeDoc | API docs from source |

---

## 10. Quality Attributes

### 10.1 Performance Requirements

| Metric | Target |
|--------|--------|
| Parse time (100 lines) | < 10ms |
| Render time (simple) | < 50ms |
| Render time (complex) | < 200ms |
| VSCode preview update | < 100ms |
| Memory (typical doc) | < 10MB |

### 10.2 Compatibility Requirements

| Platform | Support |
|----------|---------|
| Node.js | 18.x, 20.x, 22.x |
| Browsers | Chrome, Firefox, Safari, Edge (latest 2) |
| VSCode | 1.80+ |
| Mermaid | 10.x, 11.x |

---

## 11. Security Considerations

| Concern | Mitigation |
|---------|------------|
| XSS in rendered output | Sanitize all text content |
| Path traversal in imports | Validate and sandbox file access |
| Resource exhaustion | Limit document size and nesting |
| Code injection | No eval, no dynamic code |

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [21_Mermaid_Integration_Design](./21_Mermaid_Integration_Design.md) | Mermaid plugin details |
| [22_Parser_Specification](./22_Parser_Specification.md) | Parser grammar and implementation |
| [23_Renderer_Design](./23_Renderer_Design.md) | Rendering engine design |
| [24_VSCode_Extension_Design](./24_VSCode_Extension_Design.md) | Extension architecture |
| [25_Component_Library](./25_Component_Library.md) | UI component specs |
| [26_Theming_System](./26_Theming_System.md) | Theme implementation |
| [27_API_Reference](./27_API_Reference.md) | Public API documentation |
| [28_Testing_Strategy](./28_Testing_Strategy.md) | Test approach |
| [29_Implementation_Roadmap](./29_Implementation_Roadmap.md) | Implementation phases |

---

*UIMMD Architecture Overview v1.0 - 2025*
