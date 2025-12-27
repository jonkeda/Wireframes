# Testing Strategy

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Test Framework:** Vitest

---

## 1. Overview

This document describes the testing strategy for the Wireframe project, including test types, coverage targets, and testing best practices.

---

## 2. Test Structure

```
packages/
├── core/src/
│   ├── lexer/
│   │   ├── lexer.ts
│   │   └── lexer.test.ts
│   ├── parser/
│   │   ├── parser.ts
│   │   ├── parser.test.ts
│   │   └── examples.test.ts
│   └── renderer/
│       ├── svg-renderer.ts
│       └── svg-renderer.test.ts
├── cli/src/
│   ├── cli.ts
│   └── cli.test.ts
└── mermaid-plugin/src/
    ├── plugin.ts
    └── plugin.test.ts
```

---

## 3. Test Categories

### 3.1 Unit Tests

Test individual functions and classes in isolation.

**Lexer Tests:**
```typescript
describe('Lexer', () => {
  describe('tokenize', () => {
    it('should tokenize keywords', () => {
      const lexer = new Lexer('Button');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.BUTTON);
    });
    
    it('should tokenize strings', () => {
      const lexer = new Lexer('"Hello World"');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('Hello World');
    });
    
    it('should tokenize attributes', () => {
      const lexer = new Lexer('gap=16');
      const { tokens } = lexer.tokenize();
      expect(tokens[0].type).toBe(TokenType.ATTRIBUTE);
      expect(tokens[0].attributeName).toBe('gap');
      expect(tokens[0].attributeValue).toBe('16');
    });
  });
});
```

**Parser Tests:**
```typescript
describe('Parser', () => {
  describe('parse', () => {
    it('should parse wireframe document', () => {
      const { document, errors } = parse(`
        wireframe clean
            Button "Test"
        /wireframe
      `);
      
      expect(errors).toHaveLength(0);
      expect(document).not.toBeNull();
      expect(document.style).toBe('clean');
    });
    
    it('should parse layouts', () => {
      const { document } = parse(`
        wireframe clean
            Vertical gap=16
                Button "A"
                Button "B"
            /Vertical
        /wireframe
      `);
      
      const layout = document.children[0] as LayoutNode;
      expect(layout.layoutType).toBe('Vertical');
      expect(layout.attributes.gap).toBe(16);
      expect(layout.children).toHaveLength(2);
    });
  });
});
```

---

### 3.2 Integration Tests

Test component interactions and full parsing pipeline.

```typescript
describe('Full Pipeline', () => {
  it('should parse and render complete document', () => {
    const source = `
      wireframe clean
          %title: Test App
          
          Header height=64
              Heading "App Name" level=1
          /Header
          
          Content
              Vertical gap=16
                  Button "Primary" primary
                  Button "Secondary" secondary
              /Vertical
          /Content
      /wireframe
    `;
    
    const { document, errors } = parse(source);
    expect(errors).toHaveLength(0);
    
    const { svg, width, height } = render(document);
    expect(svg).toContain('<svg');
    expect(svg).toContain('App Name');
    expect(svg).toContain('Primary');
  });
});
```

---

### 3.3 Example File Tests

Validate all example files parse without errors.

```typescript
import { glob } from 'glob';
import { readFileSync } from 'fs';
import { parse } from '../parser';

describe('Example Files', () => {
  const exampleFiles = glob.sync('docs/examples/*.wire');
  
  it.each(exampleFiles)('should parse %s without errors', (file) => {
    const source = readFileSync(file, 'utf-8');
    const { errors } = parse(source);
    
    expect(errors).toHaveLength(0);
  });
});
```

---

### 3.4 Snapshot Tests

Use snapshots for SVG output consistency.

```typescript
describe('Renderer Snapshots', () => {
  it('should render button consistently', () => {
    const { document } = parse(`
      wireframe clean
          Button "Test" primary
      /wireframe
    `);
    
    const { svg } = render(document);
    expect(svg).toMatchSnapshot();
  });
  
  it('should render form consistently', () => {
    const { document } = parse(`
      wireframe clean
          Card
              TextInput "Name" required
              TextInput "Email"
              Button "Submit" primary
          /Card
      /wireframe
    `);
    
    const { svg } = render(document);
    expect(svg).toMatchSnapshot();
  });
});
```

---

### 3.5 Error Tests

Verify proper error handling and messages.

```typescript
describe('Error Handling', () => {
  it('should report syntax errors', () => {
    const { errors } = parse(`
      wireframe clean
          Buttn "Test"
      /wireframe
    `);
    
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].message).toContain('Unexpected token');
  });
  
  it('should report duplicate IDs', () => {
    const { errors } = parse(`
      wireframe clean
          Button "A" :btn1
          Button "B" :btn1
      /wireframe
    `);
    
    expect(errors.some(e => e.message.includes('Duplicate ID'))).toBe(true);
  });
  
  it('should report unknown styles', () => {
    const { errors } = parse(`
      wireframe unknown
          Button "Test"
      /wireframe
    `);
    
    expect(errors.some(e => e.message.includes('Unknown wireframe style'))).toBe(true);
  });
});
```

---

## 4. Test Configuration

### 4.1 Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['**/*.test.ts', '**/*.d.ts'],
    },
  },
});
```

### 4.2 Vitest Workspace

```javascript
// vitest.workspace.js
export default [
  'packages/core',
  'packages/cli',
  'packages/mermaid-plugin',
];
```

---

## 5. Coverage Targets

| Package | Target | Current |
|---------|--------|---------|
| core | 90% | - |
| cli | 80% | - |
| mermaid-plugin | 80% | - |
| vscode-extension | 70% | - |

### 5.1 Coverage Reports

```bash
# Run tests with coverage
pnpm test:coverage

# Generate HTML report
pnpm test:coverage --reporter=html
```

---

## 6. Test Utilities

### 6.1 Test Helpers

```typescript
// test/helpers.ts

export function parseValid(source: string): DocumentNode {
  const { document, errors } = parse(source);
  if (errors.length > 0) {
    throw new Error(`Parse errors: ${errors.map(e => e.message).join(', ')}`);
  }
  return document!;
}

export function expectNoErrors(result: ParseResult): void {
  expect(result.errors).toHaveLength(0);
  expect(result.document).not.toBeNull();
}

export function findControl(
  document: DocumentNode, 
  controlType: ControlType
): ControlNode | undefined {
  const findIn = (nodes: ElementNode[]): ControlNode | undefined => {
    for (const node of nodes) {
      if (isControlNode(node) && node.controlType === controlType) {
        return node;
      }
      if ('children' in node && node.children) {
        const found = findIn(node.children);
        if (found) return found;
      }
    }
    return undefined;
  };
  return findIn(document.children);
}
```

### 6.2 Fixtures

```typescript
// test/fixtures.ts

export const simpleButton = `
wireframe clean
    Button "Test" primary
/wireframe
`;

export const simpleForm = `
wireframe clean
    Card
        Heading "Form" level=2
        TextInput "Name" ?name required
        TextInput "Email" ?email
        Button "Submit" primary
    /Card
/wireframe
`;

export const complexLayout = `
wireframe clean
    Dock
        Header dock=top
            Heading "App" level=1
        /Header
        Sidebar dock=left
            Menu
                MenuItem "Home" $icon:home
                MenuItem "Settings" $icon:settings
            /Menu
        /Sidebar
        Content dock=fill
            Label "Content"
        /Content
    /Dock
/wireframe
`;
```

---

## 7. Running Tests

### 7.1 Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific package tests
pnpm test --filter @jonkeda/wireframe-core

# Run specific test file
pnpm test lexer.test.ts

# Run with coverage
pnpm test:coverage

# Run with verbose output
pnpm test --reporter=verbose
```

### 7.2 CI Configuration

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:coverage
      - uses: codecov/codecov-action@v3
```

---

## 8. Testing Best Practices

### 8.1 Test Organization

1. **Group related tests** using `describe` blocks
2. **Use descriptive test names** that explain the expected behavior
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests focused** on one behavior

### 8.2 Test Independence

1. **No shared state** between tests
2. **Each test should be runnable in isolation**
3. **Clean up any side effects**

### 8.3 Meaningful Assertions

```typescript
// ❌ Bad - not specific enough
expect(result).toBeTruthy();

// ✓ Good - specific assertion
expect(result.errors).toHaveLength(0);
expect(result.document.style).toBe('clean');
```

### 8.4 Edge Cases

Test edge cases explicitly:
- Empty input
- Maximum nesting
- Special characters in strings
- Unicode content
- Large files

---

## 9. Performance Tests

```typescript
describe('Performance', () => {
  it('should parse large file under 100ms', () => {
    const lines = Array(1000).fill('Button "Test"').join('\n');
    const source = `
      wireframe clean
          Vertical
              ${lines}
          /Vertical
      /wireframe
    `;
    
    const start = performance.now();
    const { errors } = parse(source);
    const duration = performance.now() - start;
    
    expect(errors).toHaveLength(0);
    expect(duration).toBeLessThan(100);
  });
});
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [01_Architecture_Overview](./01_Architecture_Overview.md) | System architecture |
| [02_Lexer_Specification](./02_Lexer_Specification.md) | Lexer tests |
| [03_Parser_Specification](./03_Parser_Specification.md) | Parser tests |

---

*Testing Strategy v1.0 - December 2025*
