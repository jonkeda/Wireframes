# Implementation Plan

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Draft
- **Related:** [01_Issues.md](01_Issues.md), [02_Design_Specifications.md](02_Design_Specifications.md)

---

## Overview

This document outlines the implementation plan for addressing all issues in the backlog. Work is organized into phases based on dependencies and priority.

---

## Phase 1: Critical Fixes (Week 1)

### Goal
Fix broken or incorrectly rendering components.

### Tasks

#### 1.1 Breadcrumb Horizontal Layout (#8)
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Update `renderBreadcrumb()` to use horizontal layout
  - Add separator rendering between items
  - Calculate total width based on text measurements
- **Effort:** 2 hours
- **Tests:** Update breadcrumb rendering tests

#### 1.2 Dropdown Text Overlap (#9)
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Fix `renderDropdown()` text positioning
  - Calculate proper Y offset for each option
  - Add proper spacing between items
- **Effort:** 2 hours
- **Tests:** Add dropdown rendering tests

#### 1.3 TreeView +/- Indicators (#2)
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Only show expand indicator on nodes with children
  - Add `expandable` property to TreeView
- **Effort:** 1 hour
- **Tests:** Update TreeView tests

---

## Phase 2: Component Variants (Week 1-2)

### Goal
Add missing size and style variants to components.

### Tasks

#### 2.1 Avatar Sizes (#6)
- **Files:** 
  - `packages/core/src/renderer/svg-renderer.ts`
  - `packages/core/src/parser/parser.ts`
- **Changes:**
  - Add `size` property parsing (xs, sm, md, lg, xl)
  - Map sizes to pixel values in renderer
  - Update avatar rendering with dynamic sizing
- **Effort:** 2 hours

#### 2.2 Badge Variants (#7)
- **Files:**
  - `packages/core/src/renderer/svg-renderer.ts`
  - `packages/core/src/renderer/theme.ts`
- **Changes:**
  - Add `variant` property (primary, secondary, danger, success, info, warning)
  - Define color palette for each variant in theme
  - Update badge rendering to use variant colors
- **Effort:** 2 hours

---

## Phase 3: Table Components (Week 2)

### Goal
Implement Table, Row, Cell components for semantic table structure.

### Tasks

#### 3.1 Parser Updates
- **File:** `packages/core/src/parser/parser.ts`
- **Changes:**
  - Add Table, Row, Cell to component types
  - Parse nested structure (Table → Row → Cell)
  - Add properties: header, align, colspan, rowspan
- **Effort:** 4 hours

#### 3.2 AST Definitions
- **File:** `packages/core/src/parser/ast.ts`
- **Changes:**
  - Add TableNode, RowNode, CellNode interfaces
  - Define property types
- **Effort:** 1 hour

#### 3.3 Renderer Implementation
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Implement `renderTable()` with border handling
  - Implement `renderRow()` with header styling
  - Implement `renderCell()` with alignment
  - Calculate column widths based on content
- **Effort:** 6 hours

#### 3.4 Tests
- **File:** `packages/core/tests/table.test.ts`
- **Changes:**
  - Parser tests for table structure
  - Renderer tests for table output
  - Integration tests with themes
- **Effort:** 2 hours

---

## Phase 4: DataGrid Improvements (Week 2-3)

### Goal
Improve DataGrid with typed columns and proper columnar rendering.

### Tasks

#### 4.1 Column Type Components (#12)
- **Files:**
  - `packages/core/src/lexer/tokens.ts`
  - `packages/core/src/parser/parser.ts`
- **Changes:**
  - Add tokens: ColumnText, ColumnDate, ColumnNumber, etc.
  - Parse as children of DataGrid
- **Effort:** 3 hours

#### 4.2 Columnar Rendering (#13)
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Calculate column widths from content
  - Render header row with proper alignment
  - Render data rows in columns
  - Add alternating row colors
- **Effort:** 4 hours

#### 4.3 Sample Data Generation
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Generate placeholder data based on column type
  - Date: `MM/DD/YYYY` format
  - Number: `000` placeholder
  - Checkbox: ☐/☑ indicators
- **Effort:** 2 hours

---

## Phase 5: Layout Systems (Week 3-4)

### Goal
Implement Grid and Canvas layout systems.

### Tasks

#### 5.1 Grid Layout (#10)

##### 5.1.1 Parser Updates
- **Files:**
  - `packages/core/src/lexer/tokens.ts`
  - `packages/core/src/parser/parser.ts`
- **Changes:**
  - Add `layout=grid` property to containers
  - Add `cols` and `rows` properties
  - Parse `grid=row,col,rowSpan,colSpan` attribute
- **Effort:** 4 hours

##### 5.1.2 Layout Engine
- **File:** `packages/core/src/renderer/layout.ts`
- **Changes:**
  - Implement `GridLayout` class
  - Calculate cell dimensions
  - Position children based on grid attributes
  - Handle spanning cells
- **Effort:** 8 hours

##### 5.1.3 Renderer Integration
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Detect grid layout on containers
  - Use GridLayout for child positioning
- **Effort:** 2 hours

#### 5.2 Canvas Layout (#14)

##### 5.2.1 Parser Updates
- **Files:**
  - `packages/core/src/parser/parser.ts`
- **Changes:**
  - Add `layout=canvas` property
  - Parse `canvas=x,y` attribute
- **Effort:** 2 hours

##### 5.2.2 Layout Engine
- **File:** `packages/core/src/renderer/layout.ts`
- **Changes:**
  - Implement `CanvasLayout` class
  - Use absolute positioning from canvas attribute
- **Effort:** 3 hours

---

## Phase 6: Sketch Theme (Week 4)

### Goal
Make sketch theme look hand-drawn with sketchy lines.

### Tasks

#### 6.1 Sketchy Line Algorithm (#3)
- **File:** `packages/core/src/renderer/sketch.ts` (new)
- **Changes:**
  - Implement `sketchyLine()` function
  - Add randomness to line segments
  - Create wobbly rectangles
  - Implement corner imperfections
- **Effort:** 6 hours

#### 6.2 Theme Integration
- **File:** `packages/core/src/renderer/svg-renderer.ts`
- **Changes:**
  - Detect sketch theme
  - Replace straight lines with sketchy paths
  - Apply to all border strokes
- **Effort:** 4 hours

#### 6.3 Sketchy Shapes
- **File:** `packages/core/src/renderer/sketch.ts`
- **Changes:**
  - Implement `sketchyRect()`
  - Implement `sketchyCircle()`
  - Optional: hatching fill patterns
- **Effort:** 4 hours

---

## Phase 7: VS Code Extension (Week 4-5)

### Goal
Add zoom/scroll to preview and improve extension packaging.

### Tasks

#### 7.1 Preview Zoom and Scroll (#18)
- **File:** `packages/vscode-extension/src/preview.ts`
- **Changes:**
  - Add zoom state management
  - Implement zoom controls (+, -, fit)
  - Add keyboard shortcuts (Ctrl+, Ctrl-)
  - Enable mouse wheel zoom
  - Add scroll bars for overflow
- **Effort:** 6 hours

#### 7.2 Extension Overview (#16)
- **File:** `packages/vscode-extension/package.json`
- **Changes:**
  - Write detailed description
  - Add feature list
  - Include screenshots
  - Add keyboard shortcuts documentation
- **Effort:** 2 hours

#### 7.3 Package Icon (#15)
- **Files:**
  - `packages/vscode-extension/images/wireframe.png`
  - `packages/vscode-extension/images/wireframe.svg`
- **Changes:**
  - Design/create icon
  - Add to package.json
- **Effort:** 2 hours

---

## Phase 8: Documentation (Week 5)

### Goal
Update all documentation to reflect current features.

### Tasks

#### 8.1 Markdown Examples (#1)
- **Location:** `docs/markdown/`
- **Files to create:**
  - `01_basic_components.md`
  - `02_containers.md`
  - `03_navigation.md`
  - `04_data_display.md`
  - `05_forms.md`
  - `06_layouts.md`
  - `07_themes.md`
- **Effort:** 4 hours

#### 8.2 API Reference (#4)
- **File:** `API_REFERENCE.md` or equivalent
- **Changes:**
  - Document all components
  - Document all properties
  - Add usage examples
- **Effort:** 4 hours

#### 8.3 README Update (#5)
- **File:** `README.md`
- **Changes:**
  - Update feature list
  - Add installation instructions
  - Add quick start guide
  - Add screenshots
- **Effort:** 2 hours

#### 8.4 Language Specification (#17)
- **File:** `09_wireframe-language.md`
- **Changes:**
  - Complete grammar specification
  - Document all syntax
  - Add EBNF notation
- **Effort:** 4 hours

---

## Timeline Summary

| Phase | Duration | Issues Covered |
|-------|----------|----------------|
| Phase 1: Critical Fixes | 3 days | #2, #8, #9 |
| Phase 2: Component Variants | 2 days | #6, #7 |
| Phase 3: Table Components | 4 days | #11 |
| Phase 4: DataGrid | 3 days | #12, #13 |
| Phase 5: Layout Systems | 5 days | #10, #14 |
| Phase 6: Sketch Theme | 4 days | #3 |
| Phase 7: Extension | 3 days | #15, #16, #18 |
| Phase 8: Documentation | 4 days | #1, #4, #5, #17 |

**Total Estimated Duration:** 4-5 weeks

---

## Testing Strategy

### Unit Tests
- Each new component needs parser tests
- Each renderer change needs output tests
- Layout calculations need mathematical tests

### Integration Tests
- Full wireframe → SVG rendering
- Theme application across all components
- Grid/canvas layout with nested components

### Visual Regression
- Generate baseline screenshots
- Compare after changes
- Especially important for sketch theme

---

## Definition of Done

For each issue:
- [ ] Code implemented
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Merged to main

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Grid layout complexity | High | Start with simple cases, iterate |
| Sketch randomness consistency | Medium | Use seeded random for reproducibility |
| Performance with large wireframes | Medium | Profile and optimize layout calculations |
| Breaking changes to syntax | High | Version property syntax, support both temporarily |

---

*Implementation Plan v1.0 - December 2025*
