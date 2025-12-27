# Contributing Guide

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active

---

## 1. Overview

Welcome to the Wireframe project! This guide explains how to contribute to the codebase, including setting up your development environment, coding standards, and the contribution workflow.

---

## 2. Getting Started

### 2.1 Prerequisites

- **Node.js:** v18 or later
- **pnpm:** v8 or later
- **Git:** Latest version
- **VS Code:** Recommended editor

### 2.2 Clone Repository

```bash
git clone https://github.com/jonkeda/wireframe.git
cd wireframe
```

### 2.3 Install Dependencies

```bash
pnpm install
```

### 2.4 Build All Packages

```bash
pnpm build
```

### 2.5 Run Tests

```bash
pnpm test
```

---

## 3. Project Structure

```
wireframe/
├── packages/
│   ├── core/                 # Core parser and renderer
│   │   ├── src/
│   │   │   ├── lexer/       # Tokenizer
│   │   │   ├── parser/      # Parser and AST
│   │   │   └── renderer/    # SVG renderer
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── cli/                  # CLI tool
│   ├── mermaid-plugin/       # Mermaid integration
│   ├── themes/               # Theme definitions
│   └── vscode/               # VS Code extension
│
├── architecture/             # Documentation
├── examples/                 # Example wireframes
└── package.json              # Root package
```

---

## 4. Development Workflow

### 4.1 Create a Branch

```bash
# Feature branch
git checkout -b feature/your-feature-name

# Bugfix branch
git checkout -b fix/issue-description
```

### 4.2 Development Mode

```bash
# Watch mode for core package
cd packages/core
pnpm dev

# Watch mode for VS Code extension
cd packages/vscode
pnpm dev
```

### 4.3 Run Tests During Development

```bash
# Watch tests
pnpm test:watch

# Run specific test
pnpm test lexer.test.ts
```

### 4.4 Commit Changes

```bash
git add .
git commit -m "feat: add new component"
```

### 4.5 Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

---

## 5. Coding Standards

### 5.1 TypeScript

- Use TypeScript for all source code
- Enable strict mode
- Define interfaces for public APIs
- Use `readonly` where appropriate

```typescript
// ✓ Good
export interface ComponentProps {
  readonly label: string;
  readonly disabled?: boolean;
}

// ✗ Avoid
export interface ComponentProps {
  label: any;
  disabled: boolean;
}
```

### 5.2 Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `svg-renderer.ts` |
| Classes | PascalCase | `SvgRenderer` |
| Functions | camelCase | `parseDocument()` |
| Constants | UPPER_SNAKE | `MAX_DEPTH` |
| Types | PascalCase | `TokenType` |
| Enums | PascalCase | `TokenType.BUTTON` |

### 5.3 File Organization

```typescript
// 1. Imports
import { Token } from './lexer';

// 2. Types and interfaces
export interface ParserOptions {
  strict?: boolean;
}

// 3. Constants
const MAX_NESTING = 100;

// 4. Classes or functions
export class Parser {
  // ...
}

// 5. Utility functions
function isValidToken(token: Token): boolean {
  // ...
}
```

### 5.4 Comments

```typescript
/**
 * Parses wireframe source into an AST.
 * 
 * @param source - The wireframe source code
 * @param options - Parser options
 * @returns Parse result with document and errors
 * 
 * @example
 * ```typescript
 * const { document, errors } = parse(source);
 * ```
 */
export function parse(
  source: string, 
  options?: ParserOptions
): ParseResult {
  // ...
}
```

---

## 6. Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### 6.1 Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### 6.2 Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code restructure |
| `test` | Add tests |
| `chore` | Maintenance |

### 6.3 Examples

```
feat(parser): add support for Switch component

fix(lexer): handle escaped quotes in strings

docs(readme): update installation instructions

test(renderer): add snapshot tests for cards
```

---

## 7. Pull Request Process

### 7.1 Before Submitting

- [ ] All tests pass (`pnpm test`)
- [ ] Code is linted (`pnpm lint`)
- [ ] Types check (`pnpm typecheck`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow convention

### 7.2 PR Description

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Breaking changes documented
```

### 7.3 Review Process

1. CI checks must pass
2. At least one maintainer approval
3. No unresolved conversations
4. Up-to-date with main branch

---

## 8. Adding New Components

### 8.1 Define Token

Add to `packages/core/src/lexer/tokens.ts`:

```typescript
export enum TokenType {
  // ... existing tokens
  NEW_COMPONENT = 'NEW_COMPONENT',
}

export const KEYWORDS: Record<string, TokenType> = {
  // ... existing keywords
  'NewComponent': TokenType.NEW_COMPONENT,
};
```

### 8.2 Add to Parser

Update `packages/core/src/parser/parser.ts`:

```typescript
const TOKEN_TO_CONTROL: Record<TokenType, ControlType> = {
  // ... existing mappings
  [TokenType.NEW_COMPONENT]: 'NewComponent',
};
```

### 8.3 Implement Renderer

Add to `packages/core/src/renderer/controls/`:

```typescript
export function renderNewComponent(
  node: ControlNode,
  theme: Theme
): string {
  // SVG rendering logic
}
```

### 8.4 Add Tests

```typescript
describe('NewComponent', () => {
  it('should parse NewComponent', () => {
    const { document, errors } = parse(`
      wireframe clean
          NewComponent "Label"
      /wireframe
    `);
    expect(errors).toHaveLength(0);
  });
  
  it('should render NewComponent', () => {
    // ...
  });
});
```

### 8.5 Document

Update `06_Component_Library.md` with new component.

---

## 9. Adding New Themes

### 9.1 Create Theme File

Add to `packages/themes/src/`:

```typescript
// mytheme.ts
import { Theme } from '@jonkeda/wireframe-core';

export const mytheme: Theme = {
  name: 'mytheme',
  colors: {
    background: '#ffffff',
    foreground: '#000000',
    primary: '#0066cc',
    // ...
  },
  fonts: {
    family: 'Arial',
    size: 14,
  },
  // ...
};
```

### 9.2 Register Theme

Update `packages/themes/src/index.ts`:

```typescript
export { mytheme } from './mytheme';
```

### 9.3 Add to Core

Register in core's theme resolver.

---

## 10. Testing

### 10.1 Unit Tests

Test individual functions:

```typescript
describe('tokenize', () => {
  it('should tokenize keyword', () => {
    // ...
  });
});
```

### 10.2 Integration Tests

Test full pipeline:

```typescript
describe('parse and render', () => {
  it('should produce valid SVG', () => {
    // ...
  });
});
```

### 10.3 Snapshot Tests

```typescript
it('should match snapshot', () => {
  const { svg } = render(document);
  expect(svg).toMatchSnapshot();
});
```

---

## 11. Documentation

### 11.1 Code Documentation

- JSDoc comments for public APIs
- Inline comments for complex logic
- README for each package

### 11.2 Architecture Docs

Update documents in `architecture/Wireframe/docs/`:

- New components → `06_Component_Library.md`
- API changes → `11_API_Reference.md`
- New examples → `13_Examples_Gallery.md`

---

## 12. Release Process

### 12.1 Version Bump

```bash
pnpm changeset
```

### 12.2 Create Release

```bash
pnpm changeset version
pnpm build
pnpm changeset publish
```

---

## 13. Getting Help

- **Discussions:** Ask questions in GitHub Discussions
- **Issues:** Report bugs or request features
- **Discord:** Join our community (if available)

---

## 14. Code of Conduct

Be respectful and inclusive. See CODE_OF_CONDUCT.md for details.

---

## 15. Related Documents

| Document | Description |
|----------|-------------|
| [01_Architecture_Overview](./01_Architecture_Overview.md) | System architecture |
| [12_Testing_Strategy](./12_Testing_Strategy.md) | Testing approach |
| [11_API_Reference](./11_API_Reference.md) | API documentation |

---

*Contributing Guide v1.0 - December 2025*
