# UIMMD to Wireframe Rename Plan

**Date:** December 27, 2025  
**Status:** ✅ Completed

## Overview

This document outlines the plan to rename "UIMMD" (UI Mermaid Markdown) to "Wireframe" throughout the project for better clarity and brand consistency.

## Rationale

1. **Clearer Identity**: "Wireframe" immediately communicates the purpose
2. **Simpler Name**: Easier to remember and type than "UIMMD"
3. **Implementation Reality**: The codebase already uses `@aspect-ui/wireframe-*` package names
4. **File Extension**: `.wire` is already the standard file extension in implementation

## Scope

### Files to Rename

| Current | New |
|---------|-----|
| `architecture/UIMMD/` | `architecture/Wireframe/` |

### Text Replacements

| Pattern | Replacement | Context |
|---------|-------------|---------|
| `UIMMD` | `Wireframe` | Project name, titles |
| `uimmd` | `wireframe` | Code references, identifiers |
| `UI Mermaid Markdown` | `Wireframe` | Full name expansion |
| `.uimmd` | `.wire` | File extension references |
| `@uimmd/` | `@aspect-ui/wireframe-` | Package names |
| `uimmd-` | `wire-` | CSS class prefixes |

### Files Affected

#### Documentation (`architecture/UIMMD/docs/`)
- [x] `20_Architecture_Overview.md`
- [x] `21_Mermaid_Integration_Design.md`
- [x] `22_Parser_Specification.md`
- [x] `23_Renderer_Design.md`
- [x] `24_VSCode_Extension_Design.md`
- [x] `25_Component_Library.md`
- [x] `26_Theming_System.md`
- [x] `27_API_Reference.md`
- [x] `28_Testing_Strategy.md`
- [x] `29_Implementation_Roadmap.md`
- [x] `30_Integration_Guide.md`
- [x] `31_Architecture_Validation.md`
- [x] `32_Sanity_Check_Value_Proposition.md`
- [x] `33_Demo_vs_Spec_Analysis.md`

#### Planning (`architecture/UIMMD/planning/`)
- [x] `06k_Language_Specification_v7_Keywords.md`
- [x] `06l_Examples_v7_Keywords.md`

### Specific Replacements

```
# Titles and Headers
"UIMMD Language Specification" → "Wireframe Language Specification"
"UIMMD Architecture Overview" → "Wireframe Architecture Overview"
"UIMMD Testing Strategy" → "Wireframe Testing Strategy"
"UIMMD Implementation Roadmap" → "Wireframe Implementation Roadmap"

# Full Name
"UIMMD (UI Mermaid Markdown)" → "Wireframe"
"UI Mermaid Markdown" → "Wireframe"

# Package Names
"@uimmd/core" → "@aspect-ui/wireframe-core"
"@uimmd/themes" → "@aspect-ui/wireframe-themes"
"@uimmd/mermaid-plugin" → "@aspect-ui/wireframe-mermaid"
"@uimmd/vscode-extension" → "@aspect-ui/wireframe-vscode"
"@uimmd/cli" → "@aspect-ui/wireframe-cli"

# File Extensions
".uimmd" → ".wire"

# Code References
"uimmdParser" → "wireframeParser"
"uimmdRenderer" → "wireframeRenderer"
"UimmdPreviewProvider" → "WireframePreviewProvider"
"UimmdCompletionProvider" → "WireframeCompletionProvider"
"UimmdHoverProvider" → "WireframeHoverProvider"

# CSS Classes
"uimmd-theme-" → "wire-theme-"
"uimmd-button" → "wire-button"
"uimmd-container" → "wire-container"

# Code Blocks
"```uimmd" → "```wireframe"
```

## Implementation Steps

### Step 1: Rename Folder
```powershell
Rename-Item "architecture/UIMMD" "architecture/Wireframe"
```

### Step 2: Update All Files
Apply text replacements in order of specificity (most specific first):
1. Package names (`@uimmd/` → `@aspect-ui/wireframe-`)
2. Full name (`UI Mermaid Markdown` → `Wireframe`)
3. Class prefixes (`uimmd-` → `wire-`)
4. File extensions (`.uimmd` → `.wire`)
5. Code identifiers (preserve casing: `UIMMD` → `Wireframe`, `uimmd` → `wireframe`)

### Step 3: Verify
- Grep for remaining "uimmd" references
- Review git diff for correctness
- Run documentation linter if available

## Rollback Plan

If issues arise:
```powershell
git checkout -- architecture/
```

## Notes

- The implementation in `wireframe/` already uses correct naming
- This rename aligns documentation with implementation
- No code changes needed in the `wireframe/` package directory
