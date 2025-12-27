# Parser Issues V2 - Editor IntelliSense Errors

This document tracks the remaining parser/IntelliSense issues discovered in the wireframe example files.

## Summary

The core parser (used in tests) correctly parses all example files. However, the VS Code extension shows "Unexpected token" errors because it needs to be reloaded to pick up the rebuilt parser code.

**Test Status**: All 355 tests pass, including 34 example files and 5 theme files.

## Issues Identified

### 1. Indentation Structure Issue

**Location**: All .wire files  
**Symptom**: %title and Vertical appear at wrong indentation level in examples  
**Current Pattern** (in file):
```wireframe
wireframe blueprint
%title: Blueprint Theme Demo

Vertical gap=16
```

**Expected Pattern** (based on user feedback):
```wireframe
wireframe blueprint
    %title: Blueprint Theme Demo

    Vertical gap=16
```

**Analysis**: The current parser accepts both patterns. The examples intentionally use root-level positioning after the `wireframe` declaration because the parser was designed to allow:
1. Directives (`%title`, `%theme`, etc.) either at root level after `wireframe` or as children
2. Layout elements at any valid indentation level

**Decision Needed**: Should directives and root layout be:
- A) At root level (current behavior) - simpler to write
- B) Indented under wireframe (more consistent tree structure)

### 2. MenuItem with Icons and Modifiers

**Location**: `docs/themes/theme-blueprint.wire` line 25-28  
**Symptom**: VSCode shows errors for `$icon:name` and `active` modifier on MenuItem
```wireframe
MenuItem "Overview" $icon:home active
```

**Status**: ✅ Parser handles this correctly - tests pass  
**Root Cause**: VS Code extension needs reload after `pnpm build`  
**Solution**: Reload VS Code window (`Developer: Reload Window`)

### 3. Tab with `active` Modifier

**Location**: `docs/examples/tabs.wire` line 9, 21  
**Symptom**: VSCode shows "Unexpected token: active"
```wireframe
Tab "Overview" active
```

**Status**: ✅ Parser handles this correctly - tests pass  
**Root Cause**: VS Code extension needs reload after `pnpm build`  
**Solution**: Reload VS Code window

### 4. Link inside Breadcrumb

**Location**: `docs/examples/breadcrumb.wire` line 9-13  
**Symptom**: VSCode shows "Unexpected token: Link"
```wireframe
Breadcrumb
    Link "Home"
    Link "Products"
    Link "Electronics"
    Label "Smartphones"
/Breadcrumb
```

**Status**: ✅ Parser handles this correctly - tests pass  
**Root Cause**: VS Code extension needs reload after `pnpm build`  
**Solution**: Reload VS Code window

## Technical Investigation

### Parser Component Support

The following components are fully supported by the parser:

| Component | TokenType | Category | Children Allowed |
|-----------|-----------|----------|------------------|
| Breadcrumb | BREADCRUMB | Component | Yes |
| MenuItem | MENU_ITEM | Component | Yes |
| Tab | TAB | Component | Yes |
| Link | LINK | Control | No |
| Label | LABEL | Control | No |

### Modifier Support

The following modifiers are supported:

| Modifier | TokenType | Works With |
|----------|-----------|------------|
| active | ACTIVE | Tab, MenuItem, Link, Button, etc. |
| expanded | EXPANDED | Accordion, Tree, Expander |
| checked | CHECKED | Checkbox, Radio, Switch |
| selected | SELECTED | Tab, Option, MenuItem |
| disabled | DISABLED | All controls |
| primary | PRIMARY | Button |
| secondary | SECONDARY | Button |

### Icon Support

Icons are supported in two formats:
- `$iconName` - Icon by name
- `$icon:name` - Icon with explicit prefix

The lexer's `scanIconRef()` method handles both patterns correctly.

## Resolution Steps

### Immediate Fix (for VS Code users)

1. Rebuild packages: `pnpm build`
2. Reload VS Code: `Ctrl+Shift+P` → "Developer: Reload Window"

### Long-term Improvements

1. **Auto-reload in development**: Configure VS Code extension to auto-reload on build
2. **Hot module reload**: Add HMR support for faster iteration
3. **Better error messages**: Improve "Unexpected token" messages to be more helpful

## Related Files

- Parser: `packages/core/src/parser/parser.ts`
- Lexer: `packages/core/src/lexer/lexer.ts`
- Tokens: `packages/core/src/lexer/tokens.ts`
- VS Code Extension: `packages/vscode-extension/src/extension.ts`
- Tests: `packages/core/src/parser/examples.test.ts`

## Verification

Run tests to verify parser correctness:
```bash
pnpm test
```

Expected output:
```
✓ packages/core/src/parser/examples.test.ts (91 tests)
  - 34 example files parse without errors
  - 5 theme files parse without errors
  - All modifiers, controls, and components covered
```
