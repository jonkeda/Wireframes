# Documentation Update Plan

## Document Information
- **Version:** 1.0
- **Date:** December 27, 2025
- **Status:** Active
- **Author:** GitHub Copilot

---

## 1. Executive Summary

This document outlines the plan to update all Wireframe architecture documents to reflect the current implementation. The existing documents (numbered 20-36) will be replaced with a new set numbered from 00, providing accurate and consistent documentation.

---

## 2. Current State Analysis

### 2.1 Existing Documents

| # | Document | Status | Issues |
|---|----------|--------|--------|
| 20 | Architecture_Overview.md | Outdated | Package structure differs, ASCII diagrams |
| 21 | Mermaid_Integration_Design.md | Outdated | Implementation differs significantly |
| 22 | Parser_Specification.md | Outdated | Token types differ, binding syntax wrong (uses `.` not `?`) |
| 23 | Renderer_Design.md | Outdated | Renderer architecture differs |
| 24 | VSCode_Extension_Design.md | Outdated | Extension structure differs |
| 25 | Component_Library.md | Partially Valid | Missing new modifiers, components |
| 26 | Theming_System.md | Outdated | Theme implementation differs |
| 27 | API_Reference.md | Outdated | APIs have changed |
| 28 | Testing_Strategy.md | Outdated | Test structure differs |
| 29 | Implementation_Roadmap.md | Outdated | No longer relevant |
| 30 | Integration_Guide.md | Outdated | Integration approach differs |
| 31 | Architecture_Validation.md | N/A | One-time validation |
| 32 | Sanity_Check_Value_Proposition.md | N/A | One-time analysis |
| 33 | Demo_vs_Spec_Analysis.md | N/A | One-time analysis |
| 36 | Publishing_Tokens_Guide.md | Valid | Keep as reference |

### 2.2 Planning Documents

| File | Status |
|------|--------|
| 06k_Language_Specification_v7_Keywords.md | Outdated - needs sync with implementation |
| 06l_Examples_v7_Keywords.md | Outdated - syntax differs |

### 2.3 Key Implementation Differences

1. **Document Structure**
   - Content must be indented under `wireframe <style>`
   - `%title:` and other doc attributes must be indented

2. **Binding Syntax**
   - Spec says `.binding` but implementation uses `?binding`
   
3. **New Modifiers**
   - Added: `active`, `expanded`, `removable`, `circle`, `indeterminate`, `completed`, `border`
   
4. **New Controls**
   - Added: `Heading`, `Link` as controls
   
5. **Icon Syntax**
   - Supports `$icon:name` format (single token)
   
6. **Package Structure**
   - 5 packages: `@jonkeda/wireframe-core`, `@jonkeda/wireframe-cli`, `@jonkeda/wireframe-mermaid-plugin`, `@jonkeda/wireframe-themes`, `wireframe-vscode`

---

## 3. New Document Structure

All documents will be renumbered starting from 00:

### 3.1 Core Documents

| # | New Document | Replaces | Description |
|---|--------------|----------|-------------|
| 00 | Language_Specification.md | 06k + updates | Complete language spec synced with implementation |
| 01 | Architecture_Overview.md | 20 | Updated system architecture |
| 02 | Lexer_Specification.md | Part of 22 | Token types, keywords, lexer behavior |
| 03 | Parser_Specification.md | Part of 22 | Grammar, AST, parsing rules |
| 04 | AST_Reference.md | New | Complete AST node types and structures |
| 05 | Renderer_Design.md | 23 | SVG rendering pipeline |
| 06 | Component_Library.md | 25 | All controls, sections, components |
| 07 | Theming_System.md | 26 | Theme structure and customization |
| 08 | VSCode_Extension.md | 24 | Extension architecture |
| 09 | CLI_Reference.md | New | Command-line tool documentation |
| 10 | API_Reference.md | 27 | Public APIs for all packages |
| 11 | Testing_Guide.md | 28 | Test structure and patterns |
| 12 | Examples_Gallery.md | 06l | Updated examples with new syntax |

### 3.2 Integration Documents

| # | Document | Description |
|---|----------|-------------|
| 13 | Mermaid_Integration.md | Mermaid plugin usage |
| 14 | Publishing_Guide.md | NPM publishing process |

### 3.3 Reference Documents

| # | Document | Description |
|---|----------|-------------|
| 15 | Keyword_Reference.md | Quick reference for all keywords |
| 16 | Icon_Reference.md | Built-in icons list |
| 17 | Modifier_Reference.md | All modifiers and usage |

---

## 4. Document Specifications

### 4.1 Document 00: Language Specification

**Source:** Current implementation (`tokens.ts`, `ast.ts`, `parser.ts`)

**Sections:**
1. Overview & Design Philosophy
2. File Format (`.wire` extension)
3. Document Structure (wireframe wrapper with indented content)
4. Comments (single-line, multi-line)
5. Layouts (Grid, Vertical, Horizontal, Dock, Canvas, Scroll)
6. Sections (Header, Footer, Sidebar, Content, Panel, Card, Toolbar, StatusBar, Modal, Drawer)
7. Controls (Button, TextInput, Label, Checkbox, etc.)
8. Components (Tabs, Menu, Tree, Accordion, etc.)
9. Identifiers (`:id`, `?binding`, `@navigation`, `$icon`)
10. Modifiers (primary, secondary, required, disabled, checked, selected, readonly, editable, active, expanded, removable, circle, indeterminate, completed, border)
11. Attributes (key=value syntax)
12. Tables (pipe syntax)
13. Trees (branch/leaf syntax)
14. Data Sections (data, validations, calculations, rules, fields)
15. Complete Keyword Reference

**Key Corrections:**
- Binding uses `?` prefix not `.`
- Content indented under `wireframe`
- All 15 modifiers documented
- `$icon:name` format documented

---

### 4.2 Document 01: Architecture Overview

**Source:** Current package structure

**Sections:**
1. System Overview
2. Package Structure
   - `@jonkeda/wireframe-core` - Lexer, Parser, Renderer
   - `@jonkeda/wireframe-cli` - Command-line tool
   - `@jonkeda/wireframe-mermaid-plugin` - Mermaid integration
   - `@jonkeda/wireframe-themes` - Theme definitions
   - `wireframe-vscode` - VS Code extension
3. Data Flow (Source → Tokens → AST → SVG)
4. Module Dependencies
5. Technology Stack (TypeScript, Vitest, esbuild)

---

### 4.3 Document 02: Lexer Specification

**Source:** `packages/core/src/lexer/`

**Sections:**
1. Token Types (from `TokenType` enum)
2. Keywords Map (from `KEYWORDS`)
3. Closing Keywords (from `CLOSING_KEYWORDS`)
4. Built-in Icons (from `BUILTIN_ICONS`)
5. Token Functions (`isLayoutToken`, `isSectionToken`, etc.)
6. Lexer Implementation Details

---

### 4.4 Document 03: Parser Specification

**Source:** `packages/core/src/parser/parser.ts`

**Sections:**
1. Grammar Rules
2. Parsing Strategy (recursive descent)
3. Element Parsing (layouts, sections, controls, components)
4. Modifier Parsing
5. Attribute Parsing
6. Error Handling
7. Source Location Tracking

---

### 4.5 Document 04: AST Reference

**Source:** `packages/core/src/parser/ast.ts`

**Sections:**
1. Node Types Overview
2. DocumentNode
3. LayoutNode (Grid, Vertical, Horizontal, Dock, Canvas, Scroll)
4. SectionNode (Header, Footer, etc.)
5. ControlNode (Button, TextInput, etc.)
6. ComponentNode (Tabs, Menu, Tree, etc.)
7. RepeatNode
8. ConditionalNode
9. DataSectionNode
10. ModifierSet
11. Factory Functions

---

### 4.6 Document 06: Component Library

**Source:** `tokens.ts` (isControlToken, isComponentToken)

**Updates Needed:**
- Add `Heading` control
- Add `Link` control  
- Add `TreeItem` component
- Document all 15 modifiers
- Document `$icon:name` syntax
- Document `active`, `expanded` on tabs/accordions

---

## 5. Implementation Plan

### Phase 1: Core Language Docs (Priority: High)

1. **00_Language_Specification.md** - Complete language reference
2. **02_Lexer_Specification.md** - Token definitions
3. **03_Parser_Specification.md** - Parsing rules
4. **04_AST_Reference.md** - AST structure

### Phase 2: Architecture Docs (Priority: High)

5. **01_Architecture_Overview.md** - System architecture
6. **05_Renderer_Design.md** - Rendering pipeline
7. **06_Component_Library.md** - All UI components

### Phase 3: Integration Docs (Priority: Medium)

8. **07_Theming_System.md** - Themes
9. **08_VSCode_Extension.md** - Extension docs
10. **09_CLI_Reference.md** - CLI docs
11. **10_API_Reference.md** - Public APIs

### Phase 4: Reference Docs (Priority: Medium)

12. **11_Testing_Guide.md** - Testing patterns
13. **12_Examples_Gallery.md** - Example wireframes
14. **13_Mermaid_Integration.md** - Plugin usage
15. **15_Keyword_Reference.md** - Quick reference

---

## 6. Document Template

Each document will follow this structure:

```markdown
# [Document Title]

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source Files:** [list of implementation files]

---

## 1. Overview

[Brief description]

---

## 2. [Main Content Sections]

[Content derived from implementation]

---

## 3. [Additional Sections]

---

## References

- [Links to related docs]
- [Links to source files]
```

---

## 7. Cleanup Plan

After new documents are created:

1. Archive old documents (move to `archive/` folder)
2. Update any cross-references
3. Remove planning documents that are now superseded
4. Update README with new document structure

---

## 8. Verification Checklist

For each document:

- [ ] Content matches current implementation
- [ ] All code examples are valid and tested
- [ ] Cross-references are correct
- [ ] No outdated information
- [ ] Consistent formatting
- [ ] Spell-checked

---

## 9. Next Steps

Begin creating documents in order:

1. Start with **00_Language_Specification.md** - the foundational reference
2. Then **01_Architecture_Overview.md** - system context
3. Continue with lexer, parser, AST docs
4. Complete remaining docs

---

*Documentation Update Plan v1.0 - December 2025*
