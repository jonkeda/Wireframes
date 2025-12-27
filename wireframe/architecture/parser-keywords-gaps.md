# Parser Keywords Gap Analysis

This document identified gaps between the defined AST types and the lexer keywords, which caused parser errors in example files.

## Status: ✅ RESOLVED

All issues have been fixed. The parser now correctly handles all keywords and modifiers used in the example files.

## Issues That Were Fixed

### 1. Missing TokenTypes (Added to `tokens.ts`)

**Controls:**
- `HEADING = 'HEADING'`
- `LINK = 'LINK'`

**Components:**
- `TREE_ITEM = 'TREE_ITEM'`

**Modifiers:**
- `ACTIVE = 'ACTIVE'`
- `EXPANDED = 'EXPANDED'`
- `REMOVABLE = 'REMOVABLE'`
- `CIRCLE = 'CIRCLE'`
- `INDETERMINATE = 'INDETERMINATE'`
- `COMPLETED = 'COMPLETED'`
- `BORDER = 'BORDER'`

### 2. Missing KEYWORDS entries (Added)

```typescript
Heading: TokenType.HEADING,
Link: TokenType.LINK,
TreeItem: TokenType.TREE_ITEM,

active: TokenType.ACTIVE,
expanded: TokenType.EXPANDED,
removable: TokenType.REMOVABLE,
circle: TokenType.CIRCLE,
indeterminate: TokenType.INDETERMINATE,
completed: TokenType.COMPLETED,
border: TokenType.BORDER,
```

### 3. Missing CLOSING_KEYWORDS entries (Added)

```typescript
'/Toast': TokenType.END_BLOCK,
'/Skeleton': TokenType.END_BLOCK,
'/TreeItem': TokenType.END_BLOCK,
```

### 4. Parser Updates

- Updated `TOKEN_TO_CONTROL` to include Heading, Link, Pagination, Toast, Skeleton
- Updated `TOKEN_TO_COMPONENT` to include TreeItem
- Updated `parseElementModifiers()` to handle new modifiers
- Updated `parseElementModifiers()` to handle `$icon:name` syntax for all elements
- Updated `Tree` parsing to support both `+/-` syntax and `TreeItem` component syntax
- Added `icon` property to `ComponentNode` interface

### 5. Lexer Updates

- Updated `scanIconRef()` to parse `$icon:name` as a single token

### 6. AST Updates

- Added new modifiers to `ModifierSet` interface
- Added `TreeItem` to `ComponentType`
- Removed `Toast` and `Skeleton` from `ComponentType` (they're controls now)

## Example File Fixes

All 34 example files in `docs/examples/` were updated to use correct syntax:
- Fixed `%title` to be at document level (not indented)
- Fixed indentation of all content
- Fixed `Statusbar` -> `StatusBar` capitalization
- Simplified Toast examples to use inline syntax

## Test Coverage

Created new test file: `packages/core/src/parser/examples.test.ts`
- Validates all 34 example files parse without errors
- Validates all example files compile to valid SVG
- Reports coverage of language features (modifiers, layouts, sections, controls, components)

## Results

- **339 tests passing**
- **34/34 example files parse successfully**
- **27/27 control types tested**
- **14/15 modifiers tested** (only `editable` not in examples)
- **17/21 component types tested**
- **10/10 section types tested**

