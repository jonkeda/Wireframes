# Lexer Specification

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source File:** `packages/core/src/lexer/tokens.ts`

---

## 1. Overview

The Wireframe Lexer tokenizes source text into a stream of tokens that the parser consumes. It handles:
- Keyword recognition
- String literals
- Numbers
- Attribute parsing
- Special prefixes (?, @, $, :, %)
- Indentation tracking
- Comments
- Table syntax

---

## 2. Token Types

### 2.1 Complete Token Type Enumeration

```typescript
export enum TokenType {
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
  ICON_BUTTON = 'ICON_BUTTON',
  TEXT_INPUT = 'TEXT_INPUT',
  NUMBER_INPUT = 'NUMBER_INPUT',
  DATE_INPUT = 'DATE_INPUT',
  PASSWORD_INPUT = 'PASSWORD_INPUT',
  TEXT_AREA = 'TEXT_AREA',
  LABEL = 'LABEL',
  HEADING = 'HEADING',
  LINK = 'LINK',
  CHECKBOX = 'CHECKBOX',
  RADIO = 'RADIO',
  DROPDOWN = 'DROPDOWN',
  OPTION = 'OPTION',
  SEPARATOR = 'SEPARATOR',
  SPACER = 'SPACER',

  // Components
  TABS = 'TABS',
  TAB = 'TAB',
  EXPANDER = 'EXPANDER',
  TREE = 'TREE',
  TREE_ITEM = 'TREE_ITEM',
  LIST = 'LIST',
  MENU = 'MENU',
  MENU_ITEM = 'MENU_ITEM',
  HAMBURGER = 'HAMBURGER',
  BREADCRUMB = 'BREADCRUMB',
  BREADCRUMB_ITEM = 'BREADCRUMB_ITEM',
  PAGINATION = 'PAGINATION',
  AVATAR = 'AVATAR',
  BADGE = 'BADGE',
  PROGRESS = 'PROGRESS',
  SLIDER = 'SLIDER',
  SWITCH = 'SWITCH',
  CHIP = 'CHIP',
  ACCORDION = 'ACCORDION',
  ACCORDION_SECTION = 'ACCORDION_SECTION',
  STEPPER = 'STEPPER',
  STEP = 'STEP',
  DIALOG = 'DIALOG',
  TOAST = 'TOAST',
  ALERT = 'ALERT',
  SKELETON = 'SKELETON',
  HOVER = 'HOVER',
  TABLE = 'TABLE',
  DATA_GRID = 'DATA_GRID',
  COLUMN = 'COLUMN',

  // Icons & Images
  ICON = 'ICON',
  IMAGE = 'IMAGE',

  // Data Sections
  DATA = 'DATA',
  VALIDATIONS = 'VALIDATIONS',
  CALCULATIONS = 'CALCULATIONS',
  RULES = 'RULES',
  FIELDS = 'FIELDS',
  COMPONENT = 'COMPONENT',

  // Repeat
  REPEAT = 'REPEAT',

  // Responsive
  DESKTOP = 'DESKTOP',
  TABLET = 'TABLET',
  MOBILE = 'MOBILE',

  // Conditionals
  IF = 'IF',
  ELSE = 'ELSE',
  ELSE_IF = 'ELSE_IF',
  END_IF = 'END_IF',

  // Identifiers and Values
  ID = 'ID',                   // :identifier
  BINDING = 'BINDING',         // ?binding
  NAVIGATION = 'NAVIGATION',   // @target
  ICON_REF = 'ICON_REF',       // $icon
  ATTRIBUTE = 'ATTRIBUTE',     // name=value
  STRING = 'STRING',           // "string" or 'string'
  NUMBER = 'NUMBER',           // 123, 12.5
  BOOLEAN = 'BOOLEAN',         // true, false
  IDENTIFIER = 'IDENTIFIER',   // general identifier

  // Modifiers
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  REQUIRED = 'REQUIRED',
  DISABLED = 'DISABLED',
  CHECKED = 'CHECKED',
  SELECTED = 'SELECTED',
  READONLY = 'READONLY',
  EDITABLE = 'EDITABLE',
  ACTIVE = 'ACTIVE',
  EXPANDED = 'EXPANDED',
  REMOVABLE = 'REMOVABLE',
  CIRCLE = 'CIRCLE',
  INDETERMINATE = 'INDETERMINATE',
  COMPLETED = 'COMPLETED',
  BORDER = 'BORDER',

  // Table Syntax
  TABLE_ROW = 'TABLE_ROW',         // | col | col | col |
  TABLE_SEPARATOR = 'TABLE_SEPARATOR', // |---|---|---|

  // Tree Syntax
  TREE_BRANCH = 'TREE_BRANCH',     // +
  TREE_LEAF = 'TREE_LEAF',         // -

  // Block Closing
  END_BLOCK = 'END_BLOCK',         // /Keyword

  // Document Attributes
  DOC_ATTRIBUTE = 'DOC_ATTRIBUTE', // %name: value

  // Comments
  COMMENT = 'COMMENT',
  MULTILINE_COMMENT = 'MULTILINE_COMMENT',

  // Whitespace and Structure
  NEWLINE = 'NEWLINE',
  INDENT = 'INDENT',
  DEDENT = 'DEDENT',
  EOF = 'EOF',

  // Errors
  ERROR = 'ERROR',
}
```

---

## 3. Keyword Mappings

### 3.1 Document Keywords

| Keyword | Token Type | Case Sensitive |
|---------|------------|----------------|
| `wireframe` | WIREFRAME | lowercase |

### 3.2 Wireframe Styles

Styles are parsed as IDENTIFIER tokens after `wireframe`:

| Style | Description |
|-------|-------------|
| `clean` | Modern, minimal style |
| `sketch` | Hand-drawn appearance |
| `blueprint` | Technical blueprint |
| `realistic` | High-fidelity mockup |

### 3.3 Layout Keywords

| Keyword | Token Type |
|---------|------------|
| `Grid` | GRID |
| `Vertical` | VERTICAL |
| `Horizontal` | HORIZONTAL |
| `Dock` | DOCK |
| `Canvas` | CANVAS |
| `Scroll` | SCROLL |

### 3.4 Section Keywords

| Keyword | Token Type |
|---------|------------|
| `Header` | HEADER |
| `Footer` | FOOTER |
| `Sidebar` | SIDEBAR |
| `Content` | CONTENT |
| `Panel` | PANEL |
| `Card` | CARD |
| `Toolbar` | TOOLBAR |
| `StatusBar` | STATUSBAR |
| `Modal` | MODAL |
| `Drawer` | DRAWER |

### 3.5 Control Keywords

| Keyword | Token Type |
|---------|------------|
| `Button` | BUTTON |
| `IconButton` | ICON_BUTTON |
| `TextInput` | TEXT_INPUT |
| `NumberInput` | NUMBER_INPUT |
| `DateInput` | DATE_INPUT |
| `PasswordInput` | PASSWORD_INPUT |
| `TextArea` | TEXT_AREA |
| `Label` | LABEL |
| `Heading` | HEADING |
| `Link` | LINK |
| `Checkbox` | CHECKBOX |
| `Radio` | RADIO |
| `Dropdown` | DROPDOWN |
| `Option` | OPTION |
| `Separator` | SEPARATOR |
| `Spacer` | SPACER |
| `Icon` | ICON |
| `Image` | IMAGE |
| `Avatar` | AVATAR |
| `Badge` | BADGE |
| `Progress` | PROGRESS |
| `Slider` | SLIDER |
| `Switch` | SWITCH |
| `Chip` | CHIP |
| `Pagination` | PAGINATION |
| `Toast` | TOAST |
| `Skeleton` | SKELETON |

### 3.6 Component Keywords

| Keyword | Token Type |
|---------|------------|
| `Tabs` | TABS |
| `Tab` | TAB |
| `Expander` | EXPANDER |
| `Tree` | TREE |
| `TreeItem` | TREE_ITEM |
| `List` | LIST |
| `Menu` | MENU |
| `MenuItem` | MENU_ITEM |
| `Hamburger` | HAMBURGER |
| `Breadcrumb` | BREADCRUMB |
| `BreadcrumbItem` | BREADCRUMB_ITEM |
| `Accordion` | ACCORDION |
| `AccordionSection` | ACCORDION_SECTION |
| `Stepper` | STEPPER |
| `Step` | STEP |
| `Dialog` | DIALOG |
| `Alert` | ALERT |
| `Hover` | HOVER |
| `Table` | TABLE |
| `DataGrid` | DATA_GRID |
| `Column` | COLUMN |

### 3.7 Data Section Keywords

| Keyword | Token Type | Case |
|---------|------------|------|
| `data` | DATA | lowercase |
| `validations` | VALIDATIONS | lowercase |
| `calculations` | CALCULATIONS | lowercase |
| `rules` | RULES | lowercase |
| `fields` | FIELDS | lowercase |
| `component` | COMPONENT | lowercase |

### 3.8 Modifier Keywords

| Keyword | Token Type | Usage |
|---------|------------|-------|
| `primary` | PRIMARY | Primary button style |
| `secondary` | SECONDARY | Secondary button style |
| `required` | REQUIRED | Required field |
| `disabled` | DISABLED | Disabled state |
| `checked` | CHECKED | Checked checkbox/radio |
| `selected` | SELECTED | Selected item |
| `readonly` | READONLY | Read-only field |
| `editable` | EDITABLE | Editable state |
| `active` | ACTIVE | Active tab/state |
| `expanded` | EXPANDED | Expanded tree/accordion |
| `removable` | REMOVABLE | Removable chip/tag |
| `circle` | CIRCLE | Circle avatar style |
| `indeterminate` | INDETERMINATE | Indeterminate checkbox |
| `completed` | COMPLETED | Completed step |
| `border` | BORDER | Border style |

### 3.9 Conditional Keywords

| Keyword | Token Type |
|---------|------------|
| `if` | IF |
| `else` | ELSE |
| `/if` | END_IF |

### 3.10 Other Keywords

| Keyword | Token Type |
|---------|------------|
| `Repeat` | REPEAT |
| `true` | BOOLEAN |
| `false` | BOOLEAN |

---

## 4. Closing Keywords

All block elements can be closed with a `/` prefix:

```typescript
export const CLOSING_KEYWORDS: Record<string, TokenType> = {
  '/wireframe': TokenType.END_WIREFRAME,
  '/Grid': TokenType.END_BLOCK,
  '/Vertical': TokenType.END_BLOCK,
  '/Horizontal': TokenType.END_BLOCK,
  '/Dock': TokenType.END_BLOCK,
  '/Canvas': TokenType.END_BLOCK,
  '/Scroll': TokenType.END_BLOCK,
  '/Header': TokenType.END_BLOCK,
  '/Footer': TokenType.END_BLOCK,
  '/Sidebar': TokenType.END_BLOCK,
  '/Content': TokenType.END_BLOCK,
  '/Panel': TokenType.END_BLOCK,
  '/Card': TokenType.END_BLOCK,
  '/Toolbar': TokenType.END_BLOCK,
  '/StatusBar': TokenType.END_BLOCK,
  '/Modal': TokenType.END_BLOCK,
  '/Drawer': TokenType.END_BLOCK,
  '/Dropdown': TokenType.END_BLOCK,
  '/Tabs': TokenType.END_BLOCK,
  '/Tab': TokenType.END_BLOCK,
  '/Expander': TokenType.END_BLOCK,
  '/Tree': TokenType.END_BLOCK,
  '/TreeItem': TokenType.END_BLOCK,
  '/List': TokenType.END_BLOCK,
  '/Menu': TokenType.END_BLOCK,
  '/MenuItem': TokenType.END_BLOCK,
  '/Hamburger': TokenType.END_BLOCK,
  '/Breadcrumb': TokenType.END_BLOCK,
  '/Accordion': TokenType.END_BLOCK,
  '/AccordionSection': TokenType.END_BLOCK,
  '/Stepper': TokenType.END_BLOCK,
  '/Dialog': TokenType.END_BLOCK,
  '/Alert': TokenType.END_BLOCK,
  '/Hover': TokenType.END_BLOCK,
  '/Toast': TokenType.END_BLOCK,
  '/Skeleton': TokenType.END_BLOCK,
  '/Table': TokenType.END_BLOCK,
  '/DataGrid': TokenType.END_BLOCK,
  '/Column': TokenType.END_BLOCK,
  '/data': TokenType.END_BLOCK,
  '/validations': TokenType.END_BLOCK,
  '/calculations': TokenType.END_BLOCK,
  '/rules': TokenType.END_BLOCK,
  '/fields': TokenType.END_BLOCK,
  '/component': TokenType.END_BLOCK,
  '/Repeat': TokenType.END_BLOCK,
  '/if': TokenType.END_IF,
};
```

---

## 5. Special Prefixes

### 5.1 Prefix Characters

| Prefix | Token Type | Description | Example |
|--------|------------|-------------|---------|
| `?` | BINDING | Data binding | `?firstName` |
| `@` | NAVIGATION | Navigation target | `@login` |
| `$` | ICON_REF | Icon reference | `$icon:search` |
| `:` | ID | Element identifier | `:submitBtn` |
| `%` | DOC_ATTRIBUTE | Document attribute | `%title: My App` |

### 5.2 Binding Token (`?`)

```
?fieldName
?user.email
?items[0].name
```

Tokenizes to:
```typescript
{ type: TokenType.BINDING, value: 'fieldName' }
```

### 5.3 Navigation Token (`@`)

```
@dashboard
@user/profile
@/logout
```

Tokenizes to:
```typescript
{ type: TokenType.NAVIGATION, value: 'dashboard' }
```

### 5.4 Icon Reference Token (`$`)

```
$icon:search
$icon:user
$icon:home
```

Tokenizes to:
```typescript
{ type: TokenType.ICON_REF, value: 'search' }
```

### 5.5 ID Token (`:`)

```
:mainButton
:formContainer
:nav-menu
```

Tokenizes to:
```typescript
{ type: TokenType.ID, value: 'mainButton' }
```

### 5.6 Document Attribute Token (`%`)

```
%title: Application Name
%description: This is my app
%width: 800
```

Tokenizes to:
```typescript
{ type: TokenType.DOC_ATTRIBUTE, value: 'title', attributeValue: 'Application Name' }
```

---

## 6. Attribute Syntax

### 6.1 Attribute Format

```
name=value
name="string value"
name='string value'
name=123
name=true
```

### 6.2 Attribute Token

```typescript
{
  type: TokenType.ATTRIBUTE,
  value: 'name=value',
  attributeName: 'name',
  attributeValue: 'value'
}
```

### 6.3 Common Attributes

| Attribute | Value Type | Example |
|-----------|------------|---------|
| `width` | number | `width=200` |
| `height` | number | `height=100` |
| `gap` | number | `gap=16` |
| `columns` | number | `columns=3` |
| `rows` | number | `rows=4` |
| `min` | number | `min=0` |
| `max` | number | `max=100` |
| `value` | number/string | `value=50` |
| `placeholder` | string | `placeholder="Enter..."` |
| `level` | number (1-6) | `level=1` |
| `position` | string | `position=left` |
| `count` | number | `count=5` |

---

## 7. String Literals

### 7.1 String Formats

```
"double quoted string"
'single quoted string'
```

### 7.2 Escape Sequences

| Escape | Character |
|--------|-----------|
| `\"` | Double quote |
| `\'` | Single quote |
| `\\` | Backslash |
| `\n` | Newline |
| `\t` | Tab |

### 7.3 String Token

```typescript
{ type: TokenType.STRING, value: 'content without quotes' }
```

---

## 8. Number Literals

### 8.1 Number Formats

```
123       // Integer
12.5      // Decimal
0.5       // Leading zero
.5        // Without leading zero (if supported)
```

### 8.2 Number Token

```typescript
{ type: TokenType.NUMBER, value: '123' }
```

---

## 9. Comments

### 9.1 Single-line Comments

```
// This is a comment
# This is also a comment
```

### 9.2 Multi-line Comments

```
/* This is a
   multi-line comment */
```

### 9.3 Comment Tokens

```typescript
{ type: TokenType.COMMENT, value: ' This is a comment' }
{ type: TokenType.MULTILINE_COMMENT, value: ' This is a\n   multi-line comment ' }
```

---

## 10. Table Syntax

### 10.1 Table Row

```
| Header 1 | Header 2 | Header 3 |
```

Tokenizes to:
```typescript
{ type: TokenType.TABLE_ROW, value: '| Header 1 | Header 2 | Header 3 |' }
```

### 10.2 Table Separator

```
|----------|----------|----------|
|---|---|---|
```

Tokenizes to:
```typescript
{ type: TokenType.TABLE_SEPARATOR, value: '|---|---|---|' }
```

---

## 11. Tree Syntax

### 11.1 Tree Branch

```
+ Expanded folder
```

Tokenizes to:
```typescript
{ type: TokenType.TREE_BRANCH, value: '+' }
```

### 11.2 Tree Leaf

```
- Leaf item
```

Tokenizes to:
```typescript
{ type: TokenType.TREE_LEAF, value: '-' }
```

---

## 12. Indentation

### 12.1 Indentation Rules

- Indentation is tracked via a stack
- Each increase in indent emits an INDENT token
- Each decrease in indent emits DEDENT token(s)
- Standard indent is 4 spaces or 1 tab

### 12.2 Indentation Tokens

```typescript
{ type: TokenType.INDENT }
{ type: TokenType.DEDENT }
{ type: TokenType.NEWLINE }
```

### 12.3 Example

```
wireframe clean
    Vertical          // INDENT before Vertical
        Button        // INDENT before Button
    /Vertical         // DEDENT before /Vertical
```

---

## 13. Token Interface

```typescript
/**
 * Source location information for a token
 */
export interface SourceLocation {
  line: number;
  column: number;
  offset: number;
}

/**
 * Represents a token in the Wireframe language
 */
export interface Token {
  type: TokenType;
  value: string;
  start: SourceLocation;
  end: SourceLocation;
  /** For END_BLOCK tokens, the keyword being closed */
  closingKeyword?: string;
  /** For ATTRIBUTE tokens, the attribute name */
  attributeName?: string;
  /** For ATTRIBUTE tokens, the attribute value */
  attributeValue?: string;
}
```

---

## 14. Token Classification Functions

```typescript
/**
 * Checks if a token type is a layout type
 */
export function isLayoutToken(type: TokenType): boolean {
  return [
    TokenType.GRID,
    TokenType.VERTICAL,
    TokenType.HORIZONTAL,
    TokenType.DOCK,
    TokenType.CANVAS,
    TokenType.SCROLL,
  ].includes(type);
}

/**
 * Checks if a token type is a section type
 */
export function isSectionToken(type: TokenType): boolean {
  return [
    TokenType.HEADER,
    TokenType.FOOTER,
    TokenType.SIDEBAR,
    TokenType.CONTENT,
    TokenType.PANEL,
    TokenType.CARD,
    TokenType.TOOLBAR,
    TokenType.STATUSBAR,
    TokenType.MODAL,
    TokenType.DRAWER,
  ].includes(type);
}

/**
 * Checks if a token type is a control type
 */
export function isControlToken(type: TokenType): boolean {
  return [
    TokenType.BUTTON,
    TokenType.ICON_BUTTON,
    TokenType.TEXT_INPUT,
    TokenType.NUMBER_INPUT,
    TokenType.DATE_INPUT,
    TokenType.PASSWORD_INPUT,
    TokenType.TEXT_AREA,
    TokenType.LABEL,
    TokenType.HEADING,
    TokenType.LINK,
    TokenType.CHECKBOX,
    TokenType.RADIO,
    TokenType.DROPDOWN,
    TokenType.OPTION,
    TokenType.SEPARATOR,
    TokenType.SPACER,
    TokenType.ICON,
    TokenType.IMAGE,
    TokenType.AVATAR,
    TokenType.BADGE,
    TokenType.PROGRESS,
    TokenType.SLIDER,
    TokenType.SWITCH,
    TokenType.CHIP,
    TokenType.PAGINATION,
    TokenType.TOAST,
    TokenType.SKELETON,
  ].includes(type);
}

/**
 * Checks if a token type is a component type (has children)
 */
export function isComponentToken(type: TokenType): boolean {
  return [
    TokenType.TABS,
    TokenType.TAB,
    TokenType.EXPANDER,
    TokenType.TREE,
    TokenType.TREE_ITEM,
    TokenType.LIST,
    TokenType.MENU,
    TokenType.MENU_ITEM,
    TokenType.HAMBURGER,
    TokenType.BREADCRUMB,
    TokenType.ACCORDION,
    TokenType.ACCORDION_SECTION,
    TokenType.STEPPER,
    TokenType.DIALOG,
    TokenType.ALERT,
    TokenType.HOVER,
    TokenType.TABLE,
    TokenType.DATA_GRID,
    TokenType.COLUMN,
  ].includes(type);
}

/**
 * Checks if a token type is a modifier
 */
export function isModifierToken(type: TokenType): boolean {
  return [
    TokenType.PRIMARY,
    TokenType.SECONDARY,
    TokenType.REQUIRED,
    TokenType.DISABLED,
    TokenType.CHECKED,
    TokenType.SELECTED,
    TokenType.READONLY,
    TokenType.EDITABLE,
    TokenType.ACTIVE,
    TokenType.EXPANDED,
    TokenType.REMOVABLE,
    TokenType.CIRCLE,
    TokenType.INDETERMINATE,
    TokenType.COMPLETED,
    TokenType.BORDER,
  ].includes(type);
}

/**
 * Checks if a token type can have children
 */
export function canHaveChildren(type: TokenType): boolean {
  return (
    isLayoutToken(type) ||
    isSectionToken(type) ||
    isComponentToken(type) ||
    type === TokenType.WIREFRAME ||
    type === TokenType.DROPDOWN ||
    type === TokenType.DATA ||
    type === TokenType.VALIDATIONS ||
    type === TokenType.CALCULATIONS ||
    type === TokenType.RULES ||
    type === TokenType.FIELDS ||
    type === TokenType.COMPONENT ||
    type === TokenType.REPEAT
  );
}
```

---

## 15. Built-in Icons

```typescript
export const BUILTIN_ICONS = new Set([
  // Actions
  'add', 'edit', 'delete', 'save', 'cancel', 'refresh', 
  'undo', 'redo', 'copy', 'paste',
  
  // Navigation
  'back', 'forward', 'up', 'down', 'home', 'menu', 
  'close', 'expand', 'collapse',
  
  // Status
  'check', 'error', 'warning', 'info', 'loading', 'success',
  
  // Objects
  'file', 'folder', 'user', 'users', 'bot', 'chat', 
  'settings', 'search', 'star',
  
  // Media
  'image', 'video', 'audio', 'attach', 'camera', 'mic',
  
  // Auth
  'login', 'logout', 'lock', 'unlock', 'key',
  
  // Other
  'cart', 'heart', 'notification', 'bell', 'calendar', 
  'clock', 'mail', 'phone', 'link', 'print', 
  'download', 'upload', 'filter', 'sort',
]);
```

---

## 16. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Complete language reference |
| [03_Parser_Specification](./03_Parser_Specification.md) | Parser grammar and rules |
| [04_AST_Reference](./04_AST_Reference.md) | AST node types |

---

*Lexer Specification v1.0 - December 2025*
