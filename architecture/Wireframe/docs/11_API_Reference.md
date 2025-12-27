# API Reference

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Package:** `@jonkeda/wireframe-core`

---

## 1. Overview

This document provides a complete API reference for the `@jonkeda/wireframe-core` package.

---

## 2. Core Functions

### 2.1 parse

Parse wireframe source code into an AST.

```typescript
function parse(source: string): ParseResult;

interface ParseResult {
  document: DocumentNode | null;
  errors: ParserError[];
}

interface ParserError {
  message: string;
  location: SourceLocation;
  token?: Token;
}
```

**Example:**

```typescript
import { parse } from '@jonkeda/wireframe-core';

const { document, errors } = parse(`
  wireframe clean
      Button "Click Me" primary
  /wireframe
`);

if (errors.length === 0) {
  console.log('Document style:', document.style);
  console.log('Children:', document.children.length);
}
```

---

### 2.2 render

Render an AST to SVG.

```typescript
function render(document: DocumentNode, options?: RenderOptions): RenderResult;

interface RenderOptions {
  theme?: Theme;
  width?: number;
  height?: number;
  scale?: number;
}

interface RenderResult {
  svg: string;
  width: number;
  height: number;
}
```

**Example:**

```typescript
import { parse, render } from '@jonkeda/wireframe-core';

const { document } = parse(source);
const { svg, width, height } = render(document, {
  width: 800,
  theme: sketchTheme,
});

console.log(svg);
```

---

### 2.3 renderToSvg

Convenience function to parse and render in one step.

```typescript
function renderToSvg(source: string, options?: RenderOptions): string;
```

**Example:**

```typescript
import { renderToSvg } from '@jonkeda/wireframe-core';

const svg = renderToSvg(`
  wireframe clean
      Button "Hello" primary
  /wireframe
`);
```

---

## 3. Lexer API

### 3.1 Lexer Class

```typescript
class Lexer {
  constructor(source: string);
  
  tokenize(): LexerResult;
}

interface LexerResult {
  tokens: Token[];
  errors: LexerError[];
}

interface LexerError {
  message: string;
  location: SourceLocation;
}
```

**Example:**

```typescript
import { Lexer } from '@jonkeda/wireframe-core';

const lexer = new Lexer('Button "Test" primary');
const { tokens, errors } = lexer.tokenize();

for (const token of tokens) {
  console.log(token.type, token.value);
}
```

---

### 3.2 Token Types

```typescript
enum TokenType {
  // Document
  WIREFRAME = 'WIREFRAME',
  END_WIREFRAME = 'END_WIREFRAME',
  
  // Layouts
  GRID = 'GRID',
  VERTICAL = 'VERTICAL',
  HORIZONTAL = 'HORIZONTAL',
  DOCK = 'DOCK',
  CANVAS = 'CANVAS',
  SCROLL = 'SCROLL',
  
  // Sections
  HEADER = 'HEADER',
  FOOTER = 'FOOTER',
  SIDEBAR = 'SIDEBAR',
  CONTENT = 'CONTENT',
  PANEL = 'PANEL',
  CARD = 'CARD',
  TOOLBAR = 'TOOLBAR',
  STATUSBAR = 'STATUSBAR',
  MODAL = 'MODAL',
  DRAWER = 'DRAWER',
  
  // Controls
  BUTTON = 'BUTTON',
  // ... (see 02_Lexer_Specification for complete list)
  
  // Modifiers
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  // ... (see 02_Lexer_Specification for complete list)
  
  // Values
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  
  // Special
  ID = 'ID',
  BINDING = 'BINDING',
  NAVIGATION = 'NAVIGATION',
  ICON_REF = 'ICON_REF',
  ATTRIBUTE = 'ATTRIBUTE',
  DOC_ATTRIBUTE = 'DOC_ATTRIBUTE',
  
  // Structure
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}
```

---

### 3.3 Token Interface

```typescript
interface Token {
  type: TokenType;
  value: string;
  start: SourceLocation;
  end: SourceLocation;
  closingKeyword?: string;
  attributeName?: string;
  attributeValue?: string;
}

interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}
```

---

## 4. Parser API

### 4.1 Parser Class

```typescript
class Parser {
  parse(source: string): ParseResult;
  parseTokens(tokens: Token[]): ParseResult;
}
```

---

## 5. AST Types

### 5.1 DocumentNode

```typescript
interface DocumentNode extends ASTNode {
  type: 'Document';
  style: WireframeStyle;
  attributes: DocumentAttributes;
  children: ElementNode[];
  dataSections: DataSectionNode[];
}

type WireframeStyle = 'sketch' | 'blueprint' | 'clean' | 'realistic';

interface DocumentAttributes {
  title?: string;
  version?: string;
  author?: string;
  [key: string]: string | undefined;
}
```

---

### 5.2 LayoutNode

```typescript
interface LayoutNode extends ElementBase {
  type: 'Layout';
  layoutType: LayoutType;
  children: ElementNode[];
}

type LayoutType = 'Grid' | 'Vertical' | 'Horizontal' | 'Dock' | 'Canvas' | 'Scroll';
```

---

### 5.3 SectionNode

```typescript
interface SectionNode extends ElementBase {
  type: 'Section';
  sectionType: SectionType;
  dock?: DockPosition;
  children: ElementNode[];
}

type SectionType = 
  | 'Header' | 'Footer' | 'Sidebar' | 'Content'
  | 'Panel' | 'Card' | 'Toolbar' | 'StatusBar'
  | 'Modal' | 'Drawer';

type DockPosition = 'top' | 'bottom' | 'left' | 'right' | 'fill';
```

---

### 5.4 ControlNode

```typescript
interface ControlNode extends ElementBase {
  type: 'Control';
  controlType: ControlType;
  text?: string;
  icon?: string;
  placeholder?: string;
  tooltip?: string;
  children?: ElementNode[];
}

type ControlType = 
  | 'Button' | 'IconButton'
  | 'TextInput' | 'NumberInput' | 'DateInput' | 'PasswordInput' | 'TextArea'
  | 'Label' | 'Heading' | 'Link'
  | 'Checkbox' | 'Radio' | 'Switch'
  | 'Dropdown' | 'Option'
  | 'Separator' | 'Spacer'
  | 'Icon' | 'Image' | 'Avatar' | 'Badge'
  | 'Progress' | 'Slider' | 'Chip'
  | 'Pagination' | 'Toast' | 'Skeleton';
```

---

### 5.5 ComponentNode

```typescript
interface ComponentNode extends ElementBase {
  type: 'Component';
  componentType: ComponentType;
  text?: string;
  icon?: string;
  children: ElementNode[];
  tableRows?: TableRowData[];
  treeItems?: TreeItemNode[];
  listItems?: string[];
}

type ComponentType = 
  | 'Card' | 'Tabs' | 'Tab' | 'Expander'
  | 'Tree' | 'TreeItem' | 'List'
  | 'Menu' | 'MenuItem' | 'Hamburger'
  | 'Breadcrumb' | 'BreadcrumbItem'
  | 'Accordion' | 'AccordionSection'
  | 'Stepper' | 'Step'
  | 'Dialog' | 'Alert' | 'Hover'
  | 'Table' | 'DataGrid' | 'Column';
```

---

### 5.6 Common Types

```typescript
interface ElementBase extends ASTNode {
  id?: string;
  binding?: string;
  navigation?: string;
  attributes: AttributeMap;
  modifiers: ModifierSet;
}

type AttributeMap = Record<string, string | number | boolean>;

interface ModifierSet {
  primary?: boolean;
  secondary?: boolean;
  required?: boolean;
  disabled?: boolean;
  checked?: boolean;
  selected?: boolean;
  readonly?: boolean;
  editable?: boolean;
  active?: boolean;
  expanded?: boolean;
  removable?: boolean;
  circle?: boolean;
  indeterminate?: boolean;
  completed?: boolean;
  border?: boolean;
}
```

---

## 6. Type Guards

```typescript
function isLayoutNode(node: ASTNode): node is LayoutNode;
function isSectionNode(node: ASTNode): node is SectionNode;
function isControlNode(node: ASTNode): node is ControlNode;
function isComponentNode(node: ASTNode): node is ComponentNode;
function isRepeatNode(node: ASTNode): node is RepeatNode;
function isConditionalNode(node: ASTNode): node is ConditionalNode;
function isDataSectionNode(node: ASTNode): node is DataSectionNode;
function isDocumentNode(node: ASTNode): node is DocumentNode;
```

**Example:**

```typescript
import { isControlNode, isLayoutNode } from '@jonkeda/wireframe-core';

function visitNode(node: ElementNode) {
  if (isLayoutNode(node)) {
    console.log('Layout:', node.layoutType);
    node.children.forEach(visitNode);
  } else if (isControlNode(node)) {
    console.log('Control:', node.controlType, node.text);
  }
}
```

---

## 7. Token Helpers

```typescript
function isLayoutToken(type: TokenType): boolean;
function isSectionToken(type: TokenType): boolean;
function isControlToken(type: TokenType): boolean;
function isComponentToken(type: TokenType): boolean;
function isModifierToken(type: TokenType): boolean;
function canHaveChildren(type: TokenType): boolean;
```

---

## 8. Factory Functions

```typescript
function createLocation(
  line?: number, 
  column?: number, 
  offset?: number
): SourceLocation;

function createModifierSet(): ModifierSet;

function createDocumentNode(style?: WireframeStyle): DocumentNode;
function createLayoutNode(layoutType: LayoutType): LayoutNode;
function createSectionNode(sectionType: SectionType): SectionNode;
function createControlNode(controlType: ControlType): ControlNode;
function createComponentNode(componentType: ComponentType): ComponentNode;
```

**Example:**

```typescript
import { createDocumentNode, createLayoutNode, createControlNode } from '@jonkeda/wireframe-core';

const doc = createDocumentNode('clean');
const layout = createLayoutNode('Vertical');
const button = createControlNode('Button');

button.text = 'Click Me';
button.modifiers.primary = true;

layout.children.push(button);
doc.children.push(layout);
```

---

## 9. Exports Summary

```typescript
// Core functions
export { parse, render, renderToSvg };

// Classes
export { Lexer, Parser };

// Types
export type {
  ParseResult,
  ParserError,
  RenderOptions,
  RenderResult,
  Token,
  SourceLocation,
  DocumentNode,
  ElementNode,
  LayoutNode,
  SectionNode,
  ControlNode,
  ComponentNode,
  RepeatNode,
  ConditionalNode,
  DataSectionNode,
  WireframeStyle,
  LayoutType,
  SectionType,
  ControlType,
  ComponentType,
  AttributeMap,
  ModifierSet,
};

// Enums
export { TokenType };

// Type guards
export {
  isLayoutNode,
  isSectionNode,
  isControlNode,
  isComponentNode,
  isRepeatNode,
  isConditionalNode,
  isDataSectionNode,
  isDocumentNode,
};

// Token helpers
export {
  isLayoutToken,
  isSectionToken,
  isControlToken,
  isComponentToken,
  isModifierToken,
  canHaveChildren,
};

// Factory functions
export {
  createLocation,
  createModifierSet,
  createDocumentNode,
  createLayoutNode,
  createSectionNode,
  createControlNode,
  createComponentNode,
};
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [02_Lexer_Specification](./02_Lexer_Specification.md) | Token definitions |
| [03_Parser_Specification](./03_Parser_Specification.md) | Parser grammar |
| [04_AST_Reference](./04_AST_Reference.md) | AST node types |

---

*API Reference v1.0 - December 2025*
