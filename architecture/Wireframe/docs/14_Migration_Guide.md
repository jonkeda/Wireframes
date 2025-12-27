# Migration Guide

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active

---

## 1. Overview

This document provides guidance for migrating between Wireframe DSL versions and from legacy syntax patterns.

---

## 2. Version History

| Version | Release | Changes |
|---------|---------|---------|
| 1.0 | Dec 2025 | Initial release with keyword-based syntax |
| 0.x | Legacy | Prototype versions (deprecated) |

---

## 3. Syntax Changes

### 3.1 Indentation Requirements

**Legacy (non-indented):**
```
wireframe clean
Button "Test"
Label "Content"
/wireframe
```

**Current (indented with 4 spaces):**
```
wireframe clean
    Button "Test"
    Label "Content"
/wireframe
```

**Migration:** Add 4-space indentation to all content within `wireframe` block.

---

### 3.2 Binding Prefix Change

**Legacy:**
```
TextInput "Name" .name
Checkbox "Accept" .accept
```

**Current:**
```
TextInput "Name" ?name
Checkbox "Accept" ?accept
```

**Migration:** Replace `.` binding prefix with `?` prefix.

---

### 3.3 Icon Syntax

**Legacy:**
```
Button "Save" icon=save
MenuItem icon:home "Home"
```

**Current:**
```
Button "Save" $icon:save
MenuItem "Home" $icon:home
```

**Migration:** Use `$icon:name` format for all icons.

---

### 3.4 Block Closing Tags

**Legacy (optional):**
```
Card
    Button "Test"

Card
    Button "Another"
```

**Current (required):**
```
Card
    Button "Test"
/Card

Card
    Button "Another"
/Card
```

**Migration:** Add `/ElementName` closing tags for all blocks.

---

### 3.5 Layout Syntax

**Legacy:**
```
VStack gap=16
    Button "A"
    Button "B"
/VStack

HStack gap=8
    Button "X"
    Button "Y"
/HStack
```

**Current:**
```
Vertical gap=16
    Button "A"
    Button "B"
/Vertical

Horizontal gap=8
    Button "X"
    Button "Y"
/Horizontal
```

**Migration:** Rename `VStack` to `Vertical`, `HStack` to `Horizontal`.

---

### 3.6 Attribute Syntax

**Legacy:**
```
Button label="Click Me" type=primary width=100
```

**Current:**
```
Button "Click Me" primary width=100
```

**Migration:**
- First string is the implicit label (no `label=` needed)
- Use boolean modifiers (`primary`, `secondary`) instead of `type=`

---

## 4. Component Changes

### 4.1 Renamed Components

| Legacy | Current | Notes |
|--------|---------|-------|
| `VStack` | `Vertical` | Vertical layout |
| `HStack` | `Horizontal` | Horizontal layout |
| `Input` | `TextInput` | Text input field |
| `Select` | `Dropdown` | Dropdown selector |
| `Nav` | `Menu` | Navigation menu |
| `NavItem` | `MenuItem` | Menu item |
| `Box` | `Block` | Generic container |
| `Text` | `Label` | Text label |

### 4.2 Removed Components

| Component | Replacement |
|-----------|-------------|
| `Panel` | Use `Card` or `Block` |
| `Container` | Use `Block` |
| `Frame` | Use `Block` with attributes |

### 4.3 New Components

| Component | Description |
|-----------|-------------|
| `Accordion` | Collapsible sections |
| `AccordionItem` | Accordion panel |
| `Badge` | Status badges |
| `Chip` | Chip/tag element |
| `Switch` | Toggle switch |
| `Avatar` | User avatar |
| `Skeleton` | Loading placeholder |
| `Rating` | Star rating |

---

## 5. Modifier Changes

### 5.1 New Modifiers

| Modifier | Description |
|----------|-------------|
| `indeterminate` | Checkbox indeterminate state |
| `completed` | Stepper completed step |
| `circle` | Circular shape (Avatar, Image) |
| `border` | Add border to element |

### 5.2 Modifier Usage

**Legacy:**
```
Button "Submit" style=primary state=disabled
```

**Current:**
```
Button "Submit" primary disabled
```

**Migration:** Use boolean modifiers directly without `style=` or `state=` prefix.

---

## 6. Section Changes

### 6.1 Dock Layout

**Legacy:**
```
Layout
    Top
        Header content
    /Top
    Left
        Sidebar content
    /Left
    Center
        Main content
    /Center
/Layout
```

**Current:**
```
Dock
    Header dock=top
        Header content
    /Header
    Sidebar dock=left
        Sidebar content
    /Sidebar
    Content dock=fill
        Main content
    /Content
/Dock
```

**Migration:** Use `Dock` layout with `dock=` attribute on sections.

---

## 7. Migration Script

### 7.1 Automated Migration

```javascript
// migration.js
const fs = require('fs');

function migrate(source) {
  let result = source;
  
  // Add indentation after wireframe line
  result = result.replace(
    /^(wireframe\s+\w+)\n((?!    ).)/gm, 
    '$1\n    $2'
  );
  
  // Replace binding prefix
  result = result.replace(/\s\.([\w]+)(\s|$)/g, ' ?$1$2');
  
  // Replace icon syntax
  result = result.replace(/icon=(\w+)/g, '$icon:$1');
  result = result.replace(/icon:(\w+)/g, '$icon:$1');
  
  // Rename components
  const renames = {
    'VStack': 'Vertical',
    '/VStack': '/Vertical',
    'HStack': 'Horizontal', 
    '/HStack': '/Horizontal',
    'Input': 'TextInput',
    '/Input': '/TextInput',
    'Select': 'Dropdown',
    '/Select': '/Dropdown',
    'Nav': 'Menu',
    '/Nav': '/Menu',
    'NavItem': 'MenuItem',
    '/NavItem': '/MenuItem',
    'Box': 'Block',
    '/Box': '/Block',
    'Text': 'Label',
    '/Text': '/Label',
  };
  
  for (const [old, new_] of Object.entries(renames)) {
    result = result.replace(new RegExp(`\\b${old}\\b`, 'g'), new_);
  }
  
  return result;
}

// Usage
const source = fs.readFileSync(process.argv[2], 'utf-8');
const migrated = migrate(source);
fs.writeFileSync(process.argv[3] || process.argv[2], migrated);
```

### 7.2 CLI Migration Command

```bash
# Migrate single file
npx wireframe-cli migrate input.wire output.wire

# Migrate all files in directory
npx wireframe-cli migrate --dir ./wireframes

# Dry run (preview changes)
npx wireframe-cli migrate input.wire --dry-run
```

---

## 8. Breaking Changes Checklist

### 8.1 Before Migration

- [ ] Backup existing wireframe files
- [ ] Document any custom components
- [ ] Note any non-standard syntax usage

### 8.2 Migration Steps

- [ ] Update wireframe block indentation
- [ ] Replace `.` binding prefix with `?`
- [ ] Update icon syntax to `$icon:name`
- [ ] Add closing tags to all blocks
- [ ] Rename deprecated components
- [ ] Update modifier usage
- [ ] Test all wireframes render correctly

### 8.3 After Migration

- [ ] Verify visual output matches original
- [ ] Update any documentation
- [ ] Update build scripts if needed
- [ ] Remove legacy dependencies

---

## 9. Compatibility Mode

For gradual migration, enable compatibility mode:

```javascript
import { parse } from '@jonkeda/wireframe-core';

const { document, errors } = parse(source, {
  compatibility: 'legacy', // Accept legacy syntax
});
```

**Note:** Compatibility mode will be removed in version 2.0.

---

## 10. Common Migration Issues

### 10.1 Indentation Errors

**Error:**
```
Parse error: Expected INDENT after wireframe
```

**Fix:** Ensure all content inside `wireframe` block is indented with 4 spaces.

### 10.2 Missing Closing Tags

**Error:**
```
Parse error: Expected /Block, found /Card
```

**Fix:** Ensure closing tag matches opening tag exactly.

### 10.3 Invalid Binding

**Error:**
```
Parse error: Unexpected token '.'
```

**Fix:** Replace `.name` with `?name` for bindings.

---

## 11. Getting Help

- **GitHub Issues:** Report migration problems
- **Documentation:** Check updated examples
- **Validation:** Use `wireframe-cli validate` to check syntax

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Current syntax |
| [06_Component_Library](./06_Component_Library.md) | Available components |
| [09_CLI_Reference](./09_CLI_Reference.md) | CLI commands |

---

*Migration Guide v1.0 - December 2025*
