# Renaming Plan: UIMMD → Wireframe

**Date:** December 27, 2025  
**Status:** ✅ COMPLETED

## Overview

This document outlines the plan to rename the project from "UIMMD" (UI Mockup Markdown) to "Wireframe" for better clarity and marketability.

## Naming Convention

| Old Name | New Name |
|----------|----------|
| `UIMMD` | `Wireframe` |
| `uimmd` | `wireframe` |
| `@uimmd/*` | `@aspect-ui/wireframe-*` |
| `.uimmd` (file extension) | `.wire` |
| `uiwire` (mermaid keyword) | `wireframe` |

## Scope of Changes

### 1. Package Names (npm)

| Current | New |
|---------|-----|
| `@uimmd/core` | `@aspect-ui/wireframe-core` |
| `@uimmd/themes` | `@aspect-ui/wireframe-themes` |
| `@uimmd/mermaid-plugin` | `@aspect-ui/wireframe-mermaid` |
| `@uimmd/vscode-extension` | `@aspect-ui/wireframe-vscode` |
| `@uimmd/cli` | `@aspect-ui/wireframe-cli` |

### 2. File Extensions

| Current | New |
|---------|-----|
| `.uimmd` | `.wire` |

### 3. Folder Structure

```
uimmd/                    →  wireframe/
├── packages/             →  packages/
│   ├── core/            →  core/
│   ├── themes/          →  themes/
│   ├── mermaid-plugin/  →  mermaid/
│   ├── vscode-extension/→  vscode/
│   └── cli/             →  cli/
└── demos/               →  demos/
    ├── *.uimmd          →  *.wire
```

### 4. Files Requiring Updates

#### Package Configuration Files
- `packages/core/package.json`
- `packages/themes/package.json`
- `packages/mermaid-plugin/package.json`
- `packages/vscode-extension/package.json`
- `packages/cli/package.json`

#### Source Code Files
- `packages/core/src/index.ts` - Comments and descriptions
- `packages/core/src/lexer/tokens.ts` - Comments
- `packages/core/src/lexer/lexer.ts` - Comments
- `packages/core/src/parser/parser.ts` - Comments
- `packages/core/src/renderer/theme.ts` - Comments
- `packages/core/src/renderer/layout.ts` - Comments
- `packages/core/src/renderer/svg-renderer.ts` - CSS class names (`.uimmd-*` → `.wire-*`)
- `packages/themes/src/index.ts` - Import paths
- `packages/mermaid-plugin/src/index.ts` - All references
- `packages/cli/src/cli.ts` - CLI name, help text
- `packages/cli/src/index.ts` - Comments
- `packages/vscode-extension/src/extension.ts` - All references

#### VS Code Extension Configuration
- `packages/vscode-extension/package.json` - Language ID, commands, activation events
- `packages/vscode-extension/language-configuration.json` - No changes needed

#### Demo Files
- `demos/index.html` - Title, descriptions, examples
- `demos/login.uimmd` → `demos/login.wire`
- `demos/dashboard.uimmd` → `demos/dashboard.wire`
- `demos/contact-form.uimmd` → `demos/contact-form.wire`

### 5. Code Changes Summary

#### CSS Classes (svg-renderer.ts)
```
.uimmd-text          → .wire-text
.uimmd-text-secondary → .wire-text-secondary
.uimmd-text-disabled  → .wire-text-disabled
.uimmd-text-bold      → .wire-text-bold
.uimmd-text-small     → .wire-text-small
.uimmd-text-large     → .wire-text-large
```

#### VS Code Commands
```
uimmd.preview    → wireframe.preview
uimmd.exportSvg  → wireframe.exportSvg
```

#### VS Code Language ID
```
uimmd → wireframe
```

#### Mermaid Diagram Type
```
uimmd    → wireframe
uiwire   → wireframe
```

#### CLI Command
```
uimmd → wire
```

### 6. Breaking Changes

| Change | Impact | Migration |
|--------|--------|-----------|
| Package names | All import statements | Update imports to new `@aspect-ui/wireframe-*` |
| File extension | Existing `.uimmd` files | Rename to `.wire` |
| CLI command | Build scripts, CI/CD | Update to use `wire` command |
| VS Code commands | Keybindings, settings | Update command IDs |
| Mermaid keyword | Mermaid diagrams | Use `wireframe` keyword |

### 7. Implementation Order

1. **Phase 1: Core Changes**
   - Update all `package.json` files with new names
   - Update import statements in source files
   - Update comments and documentation strings

2. **Phase 2: CSS and Class Names**
   - Rename CSS classes in svg-renderer.ts

3. **Phase 3: VS Code Extension**
   - Update language ID, commands, and activation events
   - Update extension.ts with new references

4. **Phase 4: CLI**
   - Update CLI name and help text
   - Update file extension references

5. **Phase 5: Mermaid Plugin**
   - Update diagram ID and detector

6. **Phase 6: Demo Files**
   - Rename demo files from `.uimmd` to `.wire`
   - Update index.html content

7. **Phase 7: Folder Rename**
   - Rename root folder from `uimmd` to `wireframe`

## Verification Checklist

- [ ] All package.json files updated
- [x] All import statements updated
- [x] All CSS classes renamed
- [x] VS Code extension configuration updated
- [x] CLI help text updated
- [x] Mermaid plugin updated
- [x] Demo files renamed and updated
- [ ] Tests pass
- [ ] Build succeeds

## Rollback Plan

If issues arise, revert all changes via git:
```bash
git checkout HEAD -- .
```

---

*This plan was auto-generated and implemented on December 27, 2025.*
