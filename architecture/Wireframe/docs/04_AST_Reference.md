# AST Reference

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source File:** `packages/core/src/parser/ast.ts`

---

## 1. Overview

The Wireframe Abstract Syntax Tree (AST) represents the parsed structure of a wireframe document. The AST is the intermediate representation between parsed source code and rendered output.

---

## 2. Node Hierarchy

```
ASTNode
├── DocumentNode
├── ElementNode (union type)
│   ├── LayoutNode
│   ├── SectionNode
│   ├── ControlNode
│   ├── ComponentNode
│   ├── RepeatNode
│   └── ConditionalNode
└── DataSectionNode
```

---

## 3. Base Types

### 3.1 Source Location

```typescript
/**
 * Source location information
 */
export interface SourceLocation {
  line: number;    // 1-based line number
  column: number;  // 1-based column number
  offset: number;  // 0-based character offset
}
```

### 3.2 Base AST Node

```typescript
/**
 * Base interface for all AST nodes
 */
export interface ASTNode {
  type: string;
  start: SourceLocation;
  end: SourceLocation;
}
```

### 3.3 Element Base

```typescript
/**
 * Common properties for elements
 */
export interface ElementBase extends ASTNode {
  id?: string;           // Element ID (:identifier)
  binding?: string;      // Data binding (?path)
  navigation?: string;   // Navigation target (@target)
  attributes: AttributeMap;
  modifiers: ModifierSet;
}
```

### 3.4 Attribute Map

```typescript
/**
 * Attribute map type
 */
export type AttributeMap = Record<string, string | number | boolean>;
```

### 3.5 Modifier Set

```typescript
/**
 * Modifier set type
 */
export interface ModifierSet {
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

## 4. Document Node

### 4.1 Interface

```typescript
/**
 * Wireframe styles
 */
export type WireframeStyle = 'sketch' | 'blueprint' | 'clean' | 'realistic';

/**
 * Document-level attributes
 */
export interface DocumentAttributes {
  title?: string;
  version?: string;
  author?: string;
  date?: string;
  figma?: string;
  jira?: string;
  [key: string]: string | undefined;
}

/**
 * Root document node
 */
export interface DocumentNode extends ASTNode {
  type: 'Document';
  style: WireframeStyle;
  attributes: DocumentAttributes;
  children: ElementNode[];
  dataSections: DataSectionNode[];
}
```

### 4.2 Example

```typescript
{
  type: 'Document',
  style: 'clean',
  attributes: {
    title: 'My Application',
    version: '1.0',
  },
  children: [
    // ... element nodes
  ],
  dataSections: [],
  start: { line: 1, column: 1, offset: 0 },
  end: { line: 10, column: 1, offset: 150 },
}
```

---

## 5. Layout Node

### 5.1 Interface

```typescript
/**
 * Layout types
 */
export type LayoutType = 'Grid' | 'Vertical' | 'Horizontal' | 'Dock' | 'Canvas' | 'Scroll';

/**
 * Layout node
 */
export interface LayoutNode extends ElementBase {
  type: 'Layout';
  layoutType: LayoutType;
  children: ElementNode[];
}
```

### 5.2 Layout Type Descriptions

| Type | Description |
|------|-------------|
| `Grid` | Grid layout with rows/columns |
| `Vertical` | Vertical stack (flexbox column) |
| `Horizontal` | Horizontal stack (flexbox row) |
| `Dock` | Dock panel layout |
| `Canvas` | Absolute positioning |
| `Scroll` | Scrollable container |

### 5.3 Example

```typescript
{
  type: 'Layout',
  layoutType: 'Vertical',
  attributes: { gap: 16 },
  modifiers: {},
  children: [
    // ... child elements
  ],
  start: { line: 3, column: 5, offset: 45 },
  end: { line: 8, column: 14, offset: 120 },
}
```

---

## 6. Section Node

### 6.1 Interface

```typescript
/**
 * Section types
 */
export type SectionType =
  | 'Header'
  | 'Footer'
  | 'Sidebar'
  | 'Content'
  | 'Panel'
  | 'Card'
  | 'Toolbar'
  | 'StatusBar'
  | 'Modal'
  | 'Drawer';

/**
 * Dock positions
 */
export type DockPosition = 'top' | 'bottom' | 'left' | 'right' | 'fill';

/**
 * Section node
 */
export interface SectionNode extends ElementBase {
  type: 'Section';
  sectionType: SectionType;
  dock?: DockPosition;
  children: ElementNode[];
}
```

### 6.2 Section Type Descriptions

| Type | Description |
|------|-------------|
| `Header` | Page/section header |
| `Footer` | Page/section footer |
| `Sidebar` | Side navigation panel |
| `Content` | Main content area |
| `Panel` | Generic panel container |
| `Card` | Card with border/shadow |
| `Toolbar` | Action toolbar |
| `StatusBar` | Status bar |
| `Modal` | Modal dialog overlay |
| `Drawer` | Slide-out drawer |

### 6.3 Example

```typescript
{
  type: 'Section',
  sectionType: 'Header',
  dock: 'top',
  attributes: { height: 64 },
  modifiers: {},
  children: [
    // ... child elements
  ],
  start: { line: 4, column: 5, offset: 60 },
  end: { line: 7, column: 12, offset: 100 },
}
```

---

## 7. Control Node

### 7.1 Interface

```typescript
/**
 * Control types
 */
export type ControlType =
  | 'Button' | 'IconButton'
  | 'TextInput' | 'NumberInput' | 'DateInput' | 'PasswordInput' | 'TextArea'
  | 'Label' | 'Heading' | 'Link'
  | 'Checkbox' | 'Radio' | 'Switch'
  | 'Dropdown' | 'Option'
  | 'Separator' | 'Spacer'
  | 'Icon' | 'Image' | 'Avatar' | 'Badge'
  | 'Progress' | 'Slider' | 'Chip'
  | 'Tabs' | 'Tab' | 'Menu' | 'MenuItem'
  | 'Breadcrumb' | 'Pagination'
  | 'Table' | 'Tree' | 'TreeItem'
  | 'Accordion' | 'AccordionSection'
  | 'DataGrid' | 'Toast' | 'Skeleton' | 'Stepper'
  | 'Row' | 'Cell'
  | 'ColumnText' | 'ColumnDate' | 'ColumnNumber' 
  | 'ColumnCheckbox' | 'ColumnImage' | 'ColumnLink' | 'ColumnButton';

/**
 * Control node
 */
export interface ControlNode extends ElementBase {
  type: 'Control';
  controlType: ControlType;
  text?: string;         // Button text, label text, etc.
  icon?: string;         // Icon name
  placeholder?: string;  // Input placeholder
  tooltip?: string;      // Tooltip text
  children?: ElementNode[]; // For Dropdown options
}
```

### 7.2 Control Categories

**Buttons:**
- `Button` - Standard button
- `IconButton` - Button with icon

**Text Inputs:**
- `TextInput` - Single-line text input
- `NumberInput` - Numeric input
- `DateInput` - Date picker input
- `PasswordInput` - Password input
- `TextArea` - Multi-line text input

**Text Display:**
- `Label` - Static text label
- `Heading` - Heading (h1-h6)
- `Link` - Hyperlink

**Selection:**
- `Checkbox` - Checkbox
- `Radio` - Radio button
- `Switch` - Toggle switch
- `Dropdown` - Dropdown select
- `Option` - Dropdown option

**Layout:**
- `Separator` - Visual separator
- `Spacer` - Empty space

**Visual:**
- `Icon` - Icon display
- `Image` - Image placeholder
- `Avatar` - User avatar (with `size` attribute: xs/sm/md/lg/xl)
- `Badge` - Badge/count indicator (with `variant` attribute: info/success/warning/error)
- `Progress` - Progress bar
- `Slider` - Range slider
- `Chip` - Tag/chip

**Feedback:**
- `Toast` - Toast notification
- `Skeleton` - Loading skeleton

**Table Components:**
- `Row` - Table row container (with `selected` modifier for header styling)
- `Cell` - Table cell (with `align` attribute: left/center/right)
- `ColumnText` - DataGrid text column
- `ColumnDate` - DataGrid date column (MM/DD/YYYY)
- `ColumnNumber` - DataGrid numeric column
- `ColumnCheckbox` - DataGrid checkbox column
- `ColumnImage` - DataGrid image column
- `ColumnLink` - DataGrid link column
- `ColumnButton` - DataGrid button column

### 7.3 Example

```typescript
{
  type: 'Control',
  controlType: 'Button',
  text: 'Submit',
  attributes: { width: 120 },
  modifiers: { primary: true },
  start: { line: 5, column: 9, offset: 75 },
  end: { line: 5, column: 35, offset: 101 },
}
```

---

## 8. Component Node

### 8.1 Interface

```typescript
/**
 * Component types (containers with special behavior)
 */
export type ComponentType =
  | 'Card'
  | 'Tabs' | 'Tab'
  | 'Expander'
  | 'Tree' | 'TreeItem'
  | 'List'
  | 'Menu' | 'MenuItem'
  | 'Hamburger'
  | 'Breadcrumb' | 'BreadcrumbItem'
  | 'Accordion' | 'AccordionSection'
  | 'Stepper' | 'Step'
  | 'Dialog' | 'Alert' | 'Hover'
  | 'Table' | 'DataGrid' | 'Column';

/**
 * Component node
 */
export interface ComponentNode extends ElementBase {
  type: 'Component';
  componentType: ComponentType;
  text?: string;
  icon?: string;
  children: ElementNode[];
  tableRows?: TableRowData[];    // For Table
  treeItems?: TreeItemNode[];    // For Tree
  listItems?: string[];          // For List
}
```

### 8.2 Table Row Data

```typescript
/**
 * Table row data
 */
export interface TableRowData {
  cells: string[];
  isSeparator: boolean;
}
```

### 8.3 Tree Item Node

```typescript
/**
 * Tree item node
 */
export interface TreeItemNode {
  text: string;
  isBranch: boolean;
  children: TreeItemNode[];
}
```

### 8.4 Example

```typescript
{
  type: 'Component',
  componentType: 'Tabs',
  attributes: {},
  modifiers: {},
  children: [
    {
      type: 'Component',
      componentType: 'Tab',
      text: 'General',
      modifiers: { active: true },
      children: [
        // ... tab content
      ],
    },
    {
      type: 'Component',
      componentType: 'Tab',
      text: 'Settings',
      children: [
        // ... tab content
      ],
    },
  ],
  start: { line: 3, column: 5, offset: 45 },
  end: { line: 20, column: 10, offset: 350 },
}
```

---

## 9. Repeat Node

### 9.1 Interface

```typescript
/**
 * Repeat node for repeating content
 */
export interface RepeatNode extends ElementBase {
  type: 'Repeat';
  count: number;
  children: ElementNode[];
}
```

### 9.2 Example

```typescript
{
  type: 'Repeat',
  count: 5,
  attributes: {},
  modifiers: {},
  children: [
    {
      type: 'Control',
      controlType: 'Button',
      text: 'Item',
      // ...
    },
  ],
  start: { line: 4, column: 5, offset: 60 },
  end: { line: 6, column: 12, offset: 90 },
}
```

---

## 10. Conditional Node

### 10.1 Interface

```typescript
/**
 * Conditional node for if/else
 */
export interface ConditionalNode extends ElementBase {
  type: 'Conditional';
  condition: string;
  thenChildren: ElementNode[];
  elseChildren?: ElementNode[];
}
```

### 10.2 Example

```typescript
{
  type: 'Conditional',
  condition: 'isLoggedIn',
  thenChildren: [
    {
      type: 'Control',
      controlType: 'Button',
      text: 'Logout',
      // ...
    },
  ],
  elseChildren: [
    {
      type: 'Control',
      controlType: 'Button',
      text: 'Login',
      // ...
    },
  ],
  attributes: {},
  modifiers: {},
  start: { line: 5, column: 5, offset: 70 },
  end: { line: 12, column: 8, offset: 150 },
}
```

---

## 11. Data Section Node

### 11.1 Interface

```typescript
/**
 * Data section types
 */
export type DataSectionType =
  | 'data'
  | 'validations'
  | 'calculations'
  | 'rules'
  | 'fields'
  | 'component';

/**
 * Data section node
 */
export interface DataSectionNode extends ASTNode {
  type: 'DataSection';
  sectionType: DataSectionType;
  rows: TableRowData[];
  /** For component definitions */
  componentName?: string;
  componentParams?: string;
  componentBody?: ElementNode[];
}
```

### 11.2 Example

```typescript
{
  type: 'DataSection',
  sectionType: 'data',
  rows: [
    { cells: ['Field', 'Type', 'Default'], isSeparator: false },
    { cells: ['---', '---', '---'], isSeparator: true },
    { cells: ['username', 'string', ''], isSeparator: false },
    { cells: ['email', 'string', ''], isSeparator: false },
  ],
  start: { line: 15, column: 1, offset: 200 },
  end: { line: 20, column: 6, offset: 280 },
}
```

---

## 12. Type Guards

The AST module provides type guard functions for safe type narrowing:

```typescript
export function isLayoutNode(node: ASTNode): node is LayoutNode {
  return node.type === 'Layout';
}

export function isSectionNode(node: ASTNode): node is SectionNode {
  return node.type === 'Section';
}

export function isControlNode(node: ASTNode): node is ControlNode {
  return node.type === 'Control';
}

export function isComponentNode(node: ASTNode): node is ComponentNode {
  return node.type === 'Component';
}

export function isRepeatNode(node: ASTNode): node is RepeatNode {
  return node.type === 'Repeat';
}

export function isConditionalNode(node: ASTNode): node is ConditionalNode {
  return node.type === 'Conditional';
}

export function isDataSectionNode(node: ASTNode): node is DataSectionNode {
  return node.type === 'DataSection';
}

export function isDocumentNode(node: ASTNode): node is DocumentNode {
  return node.type === 'Document';
}
```

---

## 13. Factory Functions

### 13.1 Create Location

```typescript
/**
 * Create a default source location
 */
export function createLocation(
  line: number = 1,
  column: number = 1,
  offset: number = 0
): SourceLocation {
  return { line, column, offset };
}
```

### 13.2 Create Modifier Set

```typescript
/**
 * Create an empty modifier set
 */
export function createModifierSet(): ModifierSet {
  return {};
}
```

### 13.3 Create Document Node

```typescript
/**
 * Create an empty document node
 */
export function createDocumentNode(style: WireframeStyle = 'clean'): DocumentNode {
  const loc = createLocation();
  return {
    type: 'Document',
    style,
    attributes: {},
    children: [],
    dataSections: [],
    start: loc,
    end: loc,
  };
}
```

### 13.4 Create Layout Node

```typescript
/**
 * Create a layout node
 */
export function createLayoutNode(layoutType: LayoutType): LayoutNode {
  const loc = createLocation();
  return {
    type: 'Layout',
    layoutType,
    children: [],
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}
```

### 13.5 Create Section Node

```typescript
/**
 * Create a section node
 */
export function createSectionNode(sectionType: SectionType): SectionNode {
  const loc = createLocation();
  return {
    type: 'Section',
    sectionType,
    children: [],
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}
```

### 13.6 Create Control Node

```typescript
/**
 * Create a control node
 */
export function createControlNode(controlType: ControlType): ControlNode {
  const loc = createLocation();
  return {
    type: 'Control',
    controlType,
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}
```

### 13.7 Create Component Node

```typescript
/**
 * Create a component node
 */
export function createComponentNode(componentType: ComponentType): ComponentNode {
  const loc = createLocation();
  return {
    type: 'Component',
    componentType,
    children: [],
    attributes: {},
    modifiers: createModifierSet(),
    start: loc,
    end: loc,
  };
}
```

---

## 14. Usage Examples

### 14.1 Traversing the AST

```typescript
function visitNode(node: ASTNode): void {
  if (isDocumentNode(node)) {
    console.log('Document:', node.style);
    node.children.forEach(visitNode);
  } else if (isLayoutNode(node)) {
    console.log('Layout:', node.layoutType);
    node.children.forEach(visitNode);
  } else if (isSectionNode(node)) {
    console.log('Section:', node.sectionType);
    node.children.forEach(visitNode);
  } else if (isControlNode(node)) {
    console.log('Control:', node.controlType, node.text);
  } else if (isComponentNode(node)) {
    console.log('Component:', node.componentType);
    node.children.forEach(visitNode);
  }
}
```

### 14.2 Finding Elements by ID

```typescript
function findById(node: ElementNode, id: string): ElementNode | null {
  if ('id' in node && node.id === id) {
    return node;
  }
  
  if ('children' in node) {
    for (const child of node.children) {
      const found = findById(child, id);
      if (found) return found;
    }
  }
  
  return null;
}
```

### 14.3 Collecting All Controls

```typescript
function collectControls(node: ElementNode, controls: ControlNode[] = []): ControlNode[] {
  if (isControlNode(node)) {
    controls.push(node);
  }
  
  if ('children' in node && node.children) {
    for (const child of node.children) {
      collectControls(child, controls);
    }
  }
  
  return controls;
}
```

---

## 15. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Complete language reference |
| [02_Lexer_Specification](./02_Lexer_Specification.md) | Token definitions |
| [03_Parser_Specification](./03_Parser_Specification.md) | Parser grammar |

---

*AST Reference v1.0 - December 2025*
