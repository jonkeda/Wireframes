# Parser Specification

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source File:** `packages/core/src/parser/parser.ts`

---

## 1. Overview

The Wireframe Parser converts a stream of tokens from the Lexer into an Abstract Syntax Tree (AST). The parser is a recursive descent parser that handles:

- Document structure
- Layout hierarchies
- Section definitions
- Control parsing
- Component parsing
- Data sections
- Error recovery

---

## 2. Parser Interface

### 2.1 Public API

```typescript
/**
 * Parser error information
 */
export interface ParserError {
  message: string;
  location: SourceLocation;
  token?: Token;
}

/**
 * Parser result
 */
export interface ParseResult {
  document: DocumentNode | null;
  errors: ParserError[];
}

/**
 * Wireframe Parser
 */
export class Parser {
  /**
   * Parse Wireframe source code
   */
  parse(source: string): ParseResult;
  
  /**
   * Parse from pre-lexed tokens
   */
  parseTokens(tokens: Token[]): ParseResult;
}

/**
 * Convenience function to parse Wireframe source
 */
export function parse(source: string): ParseResult;
```

### 2.2 Usage Example

```typescript
import { parse } from '@jonkeda/wireframe-core';

const source = `
wireframe clean
    %title: My App
    Vertical gap=16
        Button "Click Me" primary
    /Vertical
/wireframe
`;

const { document, errors } = parse(source);

if (errors.length === 0) {
  console.log('Parsed successfully!');
  console.log('Style:', document.style);
  console.log('Title:', document.attributes.title);
}
```

---

## 3. Grammar

### 3.1 Document Grammar

```ebnf
document        ::= 'wireframe' style? NEWLINE INDENT doc_content DEDENT '/wireframe'
                  | element*

style           ::= 'clean' | 'sketch' | 'blueprint' | 'realistic'

doc_content     ::= doc_attribute* element* data_section*

doc_attribute   ::= '%' IDENTIFIER ':' value NEWLINE

element         ::= layout | section | control | component | repeat

data_section    ::= ('data' | 'validations' | 'calculations' | 'rules' | 'fields')
                    NEWLINE INDENT table_row* DEDENT '/' IDENTIFIER
```

### 3.2 Layout Grammar

```ebnf
layout          ::= layout_type modifiers* NEWLINE INDENT element* DEDENT ('/' layout_type)?

layout_type     ::= 'Grid' | 'Vertical' | 'Horizontal' | 'Dock' | 'Canvas' | 'Scroll'
```

### 3.3 Section Grammar

```ebnf
section         ::= section_type modifiers* NEWLINE INDENT element* DEDENT ('/' section_type)?

section_type    ::= 'Header' | 'Footer' | 'Sidebar' | 'Content'
                  | 'Panel' | 'Card' | 'Toolbar' | 'StatusBar'
                  | 'Modal' | 'Drawer'
```

### 3.4 Control Grammar

```ebnf
control         ::= control_type STRING? modifiers*

control_type    ::= 'Button' | 'IconButton' | 'TextInput' | 'NumberInput'
                  | 'DateInput' | 'PasswordInput' | 'TextArea'
                  | 'Label' | 'Heading' | 'Link'
                  | 'Checkbox' | 'Radio' | 'Switch'
                  | 'Dropdown' | 'Option'
                  | 'Separator' | 'Spacer'
                  | 'Icon' | 'Image' | 'Avatar' | 'Badge'
                  | 'Progress' | 'Slider' | 'Chip'
                  | 'Pagination' | 'Toast' | 'Skeleton'
```

### 3.5 Component Grammar

```ebnf
component       ::= component_type STRING? modifiers* NEWLINE INDENT children DEDENT ('/' component_type)?

component_type  ::= 'Tabs' | 'Tab' | 'Expander'
                  | 'Tree' | 'TreeItem' | 'List'
                  | 'Menu' | 'MenuItem' | 'Hamburger'
                  | 'Breadcrumb' | 'BreadcrumbItem'
                  | 'Accordion' | 'AccordionSection'
                  | 'Stepper' | 'Step'
                  | 'Dialog' | 'Alert' | 'Hover'
                  | 'Table' | 'DataGrid' | 'Column'

children        ::= element* | table_row* | tree_item*
```

### 3.6 Modifier Grammar

```ebnf
modifiers       ::= (id | binding | navigation | icon_ref | modifier | attribute)*

id              ::= ':' IDENTIFIER
binding         ::= '?' path
navigation      ::= '@' target
icon_ref        ::= '$' 'icon:' IDENTIFIER | '$' IDENTIFIER

modifier        ::= 'primary' | 'secondary' | 'required' | 'disabled'
                  | 'checked' | 'selected' | 'readonly' | 'editable'
                  | 'active' | 'expanded' | 'removable' | 'circle'
                  | 'indeterminate' | 'completed' | 'border'

attribute       ::= IDENTIFIER '=' value
value           ::= STRING | NUMBER | BOOLEAN
```

---

## 4. Token Type Mappings

### 4.1 Layout Token Mapping

```typescript
const TOKEN_TO_LAYOUT: Record<string, LayoutType> = {
  [TokenType.GRID]: 'Grid',
  [TokenType.VERTICAL]: 'Vertical',
  [TokenType.HORIZONTAL]: 'Horizontal',
  [TokenType.DOCK]: 'Dock',
  [TokenType.CANVAS]: 'Canvas',
  [TokenType.SCROLL]: 'Scroll',
};
```

### 4.2 Section Token Mapping

```typescript
const TOKEN_TO_SECTION: Record<string, SectionType> = {
  [TokenType.HEADER]: 'Header',
  [TokenType.FOOTER]: 'Footer',
  [TokenType.SIDEBAR]: 'Sidebar',
  [TokenType.CONTENT]: 'Content',
  [TokenType.PANEL]: 'Panel',
  [TokenType.CARD]: 'Card',
  [TokenType.TOOLBAR]: 'Toolbar',
  [TokenType.STATUSBAR]: 'StatusBar',
  [TokenType.MODAL]: 'Modal',
  [TokenType.DRAWER]: 'Drawer',
};
```

### 4.3 Control Token Mapping

```typescript
const TOKEN_TO_CONTROL: Record<string, ControlType> = {
  [TokenType.BUTTON]: 'Button',
  [TokenType.ICON_BUTTON]: 'IconButton',
  [TokenType.TEXT_INPUT]: 'TextInput',
  [TokenType.NUMBER_INPUT]: 'NumberInput',
  [TokenType.DATE_INPUT]: 'DateInput',
  [TokenType.PASSWORD_INPUT]: 'PasswordInput',
  [TokenType.TEXT_AREA]: 'TextArea',
  [TokenType.LABEL]: 'Label',
  [TokenType.HEADING]: 'Heading',
  [TokenType.LINK]: 'Link',
  [TokenType.CHECKBOX]: 'Checkbox',
  [TokenType.RADIO]: 'Radio',
  [TokenType.DROPDOWN]: 'Dropdown',
  [TokenType.OPTION]: 'Option',
  [TokenType.SEPARATOR]: 'Separator',
  [TokenType.SPACER]: 'Spacer',
  [TokenType.ICON]: 'Icon',
  [TokenType.IMAGE]: 'Image',
  [TokenType.AVATAR]: 'Avatar',
  [TokenType.BADGE]: 'Badge',
  [TokenType.PROGRESS]: 'Progress',
  [TokenType.SLIDER]: 'Slider',
  [TokenType.SWITCH]: 'Switch',
  [TokenType.CHIP]: 'Chip',
  [TokenType.PAGINATION]: 'Pagination',
  [TokenType.TOAST]: 'Toast',
  [TokenType.SKELETON]: 'Skeleton',
};
```

### 4.4 Component Token Mapping

```typescript
const TOKEN_TO_COMPONENT: Record<string, ComponentType> = {
  [TokenType.TABS]: 'Tabs',
  [TokenType.TAB]: 'Tab',
  [TokenType.EXPANDER]: 'Expander',
  [TokenType.TREE]: 'Tree',
  [TokenType.TREE_ITEM]: 'TreeItem',
  [TokenType.LIST]: 'List',
  [TokenType.MENU]: 'Menu',
  [TokenType.MENU_ITEM]: 'MenuItem',
  [TokenType.HAMBURGER]: 'Hamburger',
  [TokenType.BREADCRUMB]: 'Breadcrumb',
  [TokenType.BREADCRUMB_ITEM]: 'BreadcrumbItem',
  [TokenType.ACCORDION]: 'Accordion',
  [TokenType.ACCORDION_SECTION]: 'AccordionSection',
  [TokenType.STEPPER]: 'Stepper',
  [TokenType.STEP]: 'Step',
  [TokenType.DIALOG]: 'Dialog',
  [TokenType.ALERT]: 'Alert',
  [TokenType.HOVER]: 'Hover',
  [TokenType.TABLE]: 'Table',
  [TokenType.DATA_GRID]: 'DataGrid',
  [TokenType.COLUMN]: 'Column',
};
```

---

## 5. Parsing Rules

### 5.1 Document Parsing

The document parser:
1. Skips leading newlines
2. Checks for `wireframe` keyword
3. Parses optional style identifier
4. Expects INDENT for content
5. Parses document attributes (`%name: value`)
6. Parses child elements
7. Parses data sections
8. Expects `/wireframe` or end of file

```typescript
private parseDocument(): DocumentNode {
  this.skipNewlines();

  // Check for wireframe keyword
  if (!this.check(TokenType.WIREFRAME)) {
    // Allow documents without explicit wireframe wrapper
    const doc = createDocumentNode('clean');
    doc.children = this.parseElements();
    return doc;
  }

  const startToken = this.advance(); // consume 'wireframe'
  const doc = createDocumentNode();
  doc.start = startToken.start;

  // Parse style (on same line as wireframe)
  if (this.check(TokenType.IDENTIFIER)) {
    const styleToken = this.advance();
    const style = styleToken.value.toLowerCase();
    if (['sketch', 'blueprint', 'clean', 'realistic'].includes(style)) {
      doc.style = style as WireframeStyle;
    } else {
      this.addError(`Unknown wireframe style: ${style}`);
    }
  }

  this.skipNewlines();

  // Expect INDENT for document content
  if (this.check(TokenType.INDENT)) {
    this.advance();

    // Parse document attributes (%name: value) - must be indented
    while (this.check(TokenType.DOC_ATTRIBUTE)) {
      const attrToken = this.advance();
      if (attrToken.attributeName && attrToken.attributeValue !== undefined) {
        doc.attributes[attrToken.attributeName] = attrToken.attributeValue;
      }
      this.skipNewlines();
    }

    // Parse children
    doc.children = this.parseElements();

    // Expect DEDENT
    if (this.check(TokenType.DEDENT)) {
      this.advance();
    }
  }

  // Parse data sections
  doc.dataSections = this.parseDataSections();

  // Expect /wireframe
  this.skipNewlines();
  if (this.check(TokenType.END_WIREFRAME)) {
    const endToken = this.advance();
    doc.end = endToken.end;
  }

  return doc;
}
```

### 5.2 Element Parsing

Elements are dispatched to specific parsers based on token type:

```typescript
private parseElement(): ElementNode | null {
  const token = this.peek();

  if (isLayoutToken(token.type)) {
    return this.parseLayout();
  }

  if (isSectionToken(token.type)) {
    return this.parseSection();
  }

  if (isControlToken(token.type)) {
    return this.parseControl();
  }

  if (isComponentToken(token.type)) {
    return this.parseComponent();
  }

  if (token.type === TokenType.REPEAT) {
    return this.parseRepeat();
  }

  // Skip unknown tokens
  if (token.type !== TokenType.EOF && 
      token.type !== TokenType.NEWLINE &&
      token.type !== TokenType.END_BLOCK) {
    this.addError(`Unexpected token: ${token.value}`);
    this.advance();
  }

  return null;
}
```

### 5.3 Layout Parsing

```typescript
private parseLayout(): LayoutNode {
  const token = this.advance();
  const layoutType = TOKEN_TO_LAYOUT[token.type];
  const node = createLayoutNode(layoutType);
  node.start = token.start;

  // Parse attributes
  this.parseElementModifiers(node);

  this.skipNewlines();

  // Check for INDENT
  if (this.check(TokenType.INDENT)) {
    this.advance();
    node.children = this.parseElements();

    // Expect DEDENT
    if (this.check(TokenType.DEDENT)) {
      this.advance();
    }
  }

  // Check for explicit end block
  this.skipNewlines();
  if (this.check(TokenType.END_BLOCK) && this.peek().closingKeyword === layoutType) {
    const endToken = this.advance();
    node.end = endToken.end;
  }

  return node;
}
```

### 5.4 Control Parsing

Controls may have:
- Optional text string
- Icon reference (for IconButton, Icon)
- Modifiers and attributes
- Children (for Dropdown)

```typescript
private parseControl(): ControlNode {
  const token = this.advance();
  const controlType = TOKEN_TO_CONTROL[token.type];
  const node = createControlNode(controlType);
  node.start = token.start;

  // Parse text/placeholder for controls that have them
  if (this.check(TokenType.STRING)) {
    const textToken = this.advance();
    if (['Button', 'Label', 'Checkbox', 'Radio', 'Switch', 'Chip', 
         'Avatar', 'Dialog', 'Toast'].includes(controlType)) {
      node.text = textToken.value;
    } else {
      node.placeholder = textToken.value;
    }
  }

  // For IconButton, parse icon reference first
  if (controlType === 'IconButton' && this.check(TokenType.ICON_REF)) {
    const iconToken = this.advance();
    node.icon = iconToken.value.substring(1);
    if (this.check(TokenType.STRING)) {
      node.text = this.advance().value;
    }
  }

  // Parse remaining modifiers and attributes
  this.parseElementModifiers(node);

  node.end = this.previousEnd();
  return node;
}
```

### 5.5 Modifier Parsing

The `parseElementModifiers` method handles all inline modifiers:

```typescript
private parseElementModifiers(node: {
  attributes: AttributeMap;
  modifiers: ModifierSet;
  id?: string;
  binding?: string;
  navigation?: string;
  icon?: string;
}): void {
  while (!this.isAtEnd() && 
         !this.check(TokenType.NEWLINE) && 
         !this.check(TokenType.INDENT)) {
    const token = this.peek();

    // ID (:identifier)
    if (token.type === TokenType.ID) {
      this.advance();
      const id = token.value.substring(1);
      if (this.ids.has(id)) {
        this.addError(`Duplicate ID: ${id}`);
      } else {
        this.ids.add(id);
      }
      node.id = id;
      continue;
    }

    // Binding (?path)
    if (token.type === TokenType.BINDING) {
      this.advance();
      node.binding = token.value.substring(1);
      continue;
    }

    // Navigation (@target)
    if (token.type === TokenType.NAVIGATION) {
      this.advance();
      node.navigation = token.value.substring(1);
      continue;
    }

    // Modifiers (primary, secondary, etc.)
    if (isModifierToken(token.type)) {
      this.advance();
      switch (token.type) {
        case TokenType.PRIMARY:
          node.modifiers.primary = true;
          break;
        // ... other modifiers
      }
      continue;
    }

    // Attributes (name=value)
    if (token.type === TokenType.ATTRIBUTE) {
      this.advance();
      if (token.attributeName && token.attributeValue !== undefined) {
        const numValue = parseFloat(token.attributeValue);
        if (!isNaN(numValue)) {
          node.attributes[token.attributeName] = numValue;
        } else if (token.attributeValue === 'true') {
          node.attributes[token.attributeName] = true;
        } else if (token.attributeValue === 'false') {
          node.attributes[token.attributeName] = false;
        } else {
          node.attributes[token.attributeName] = token.attributeValue;
        }
      }
      continue;
    }

    break;
  }
}
```

---

## 6. Special Parsing

### 6.1 Table Parsing

Tables are parsed from TABLE_ROW and TABLE_SEPARATOR tokens:

```typescript
private parseTableRow(token: Token): TableRowData {
  const isSeparator = token.type === TokenType.TABLE_SEPARATOR;
  const value = token.value.trim();

  // Split by | and clean up
  const cells = value
    .split('|')
    .filter((cell) => cell.trim() !== '')
    .map((cell) => cell.trim());

  return { cells, isSeparator };
}
```

### 6.2 Tree Parsing

Trees support both `+/-` syntax and TreeItem syntax:

```typescript
private parseTreeItems(depth: number): TreeItemNode[] {
  const items: TreeItemNode[] = [];

  while (this.check(TokenType.TREE_BRANCH) || this.check(TokenType.TREE_LEAF)) {
    const token = this.advance();
    const item: TreeItemNode = {
      text: token.value,
      isBranch: token.type === TokenType.TREE_BRANCH,
      children: [],
    };

    this.skipNewlines();

    // Check for nested items
    if (this.check(TokenType.INDENT)) {
      this.advance();
      item.children = this.parseTreeItems(depth + 1);
      if (this.check(TokenType.DEDENT)) {
        this.advance();
      }
    }

    items.push(item);
    this.skipNewlines();
  }

  return items;
}
```

### 6.3 Repeat Parsing

```typescript
private parseRepeat(): RepeatNode {
  const token = this.advance(); // consume 'Repeat'
  const node: RepeatNode = {
    type: 'Repeat',
    count: 1,
    children: [],
    // ...
  };

  // Parse count
  if (this.check(TokenType.NUMBER)) {
    node.count = parseInt(this.advance().value, 10);
  }

  // Parse modifiers
  this.parseElementModifiers(node);

  this.skipNewlines();

  // Parse children
  if (this.check(TokenType.INDENT)) {
    this.advance();
    node.children = this.parseElements();
    if (this.check(TokenType.DEDENT)) {
      this.advance();
    }
  } else {
    // Inline repeat - single element on same line
    const element = this.parseElement();
    if (element) {
      node.children = [element];
    }
  }

  return node;
}
```

---

## 7. Block End Detection

The parser uses `isBlockEnd()` to detect when to stop parsing children:

```typescript
private isBlockEnd(): boolean {
  const token = this.peek();
  return (
    token.type === TokenType.END_BLOCK ||
    token.type === TokenType.END_WIREFRAME ||
    token.type === TokenType.DEDENT ||
    token.type === TokenType.DATA ||
    token.type === TokenType.VALIDATIONS ||
    token.type === TokenType.CALCULATIONS ||
    token.type === TokenType.RULES ||
    token.type === TokenType.FIELDS
  );
}
```

---

## 8. Error Handling

### 8.1 Error Collection

Errors are collected rather than thrown:

```typescript
private addError(message: string, token?: Token): void {
  this.errors.push({
    message,
    location: token?.start || this.peek().start,
    token,
  });
}
```

### 8.2 Error Types

| Error | Cause |
|-------|-------|
| `Unknown wireframe style` | Invalid style after `wireframe` |
| `Duplicate ID` | Same `:id` used twice |
| `Expected /wireframe` | Missing document end |
| `Unexpected token` | Unknown token in element position |

### 8.3 Error Recovery

The parser attempts to continue after errors:
- Unknown tokens are skipped
- Missing end blocks are tolerated
- Lexer errors are passed through

---

## 9. ID Validation

The parser tracks used IDs to detect duplicates:

```typescript
private ids: Set<string> = new Set();

// In parseElementModifiers:
if (token.type === TokenType.ID) {
  const id = token.value.substring(1);
  if (this.ids.has(id)) {
    this.addError(`Duplicate ID: ${id}`);
  } else {
    this.ids.add(id);
  }
  node.id = id;
}
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Complete language reference |
| [02_Lexer_Specification](./02_Lexer_Specification.md) | Token definitions |
| [04_AST_Reference](./04_AST_Reference.md) | AST node types |

---

*Parser Specification v1.0 - December 2025*
