# Documentation Update Plan

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Planning
- **Related:** [03_Implementation_Plan.md](./03_Implementation_Plan.md) - completed implementation

---

## 1. Overview

This document outlines the plan to update all documentation to reflect the recent implementation changes from the 8-phase improvement plan.

### Documentation Locations

| Location | Purpose | Priority |
|----------|---------|----------|
| `architecture/Wireframe/docs/` | Technical specifications | High |
| `.github/copilot-instructions/09_wireframe-language.md` | AI assistant instructions | High |
| `README.md` (root) | Project overview & quick start | High |
| `wireframe/docs/` | User-facing documentation | Medium |

---

## 2. New Features to Document

### 2.1 Phase 1-2: Component Improvements

| Feature | Description |
|---------|-------------|
| TreeItem +/- indicators | Only shown on nodes with children |
| Avatar sizes | `xs`, `sm`, `md`, `lg`, `xl` (24-80px) |
| Badge variants | `info`, `success`, `warning`, `error` with proper text colors |

### 2.2 Phase 3-4: Table & DataGrid

| Feature | Description |
|---------|-------------|
| Row component | Table row container with header styling (`selected` modifier) |
| Cell component | Individual cell with `align` attribute (left/center/right) |
| ColumnText | Text column type for DataGrid |
| ColumnDate | Date column (MM/DD/YYYY format) |
| ColumnNumber | Numeric column |
| ColumnCheckbox | Boolean checkbox column |
| ColumnImage | Image thumbnail column |
| ColumnLink | Clickable link column |
| ColumnButton | Action button column |
| DataGrid row selection | `selected` modifier adds checkbox column |

### 2.3 Phase 5: Layout Improvements

| Feature | Description |
|---------|-------------|
| Grid `cols`/`rows` attributes | Configurable grid dimensions on parent |
| `grid=row,col,rowSpan,colSpan` | Child positioning attribute |
| `canvas=x,y` | Absolute positioning in Canvas layout |

### 2.4 Phase 6: Sketch Theme

| Feature | Description |
|---------|-------------|
| Sketchy line rendering | Hand-drawn style paths for borders |
| `sketch.ts` module | New utility for sketchy SVG paths |
| Theme-aware components | Button, Input, Card, Section use sketchy rendering |

### 2.5 Phase 7: VS Code Extension

| Feature | Description |
|---------|-------------|
| Zoom controls | +, -, 100%, Fit buttons |
| Mouse wheel zoom | Ctrl+scroll in preview |
| Keyboard shortcuts | Ctrl++, Ctrl+-, Ctrl+0 |
| Enhanced package.json | Better descriptions, icon, repository links |

---

## 3. Update Tasks by Location

### 3.1 architecture/Wireframe/docs/

#### 06_Component_Library.md
- [ ] Add Row component specification
- [ ] Add Cell component specification (with `align` attribute)
- [ ] Add all Column* components (ColumnText, ColumnDate, etc.)
- [ ] Update Avatar section with size variants
- [ ] Update Badge section with variant colors
- [ ] Update TreeItem with +/- indicator behavior
- **Effort:** 2 hours

#### 00_Language_Specification.md
- [ ] Add `grid=row,col,rowSpan,colSpan` attribute syntax
- [ ] Add `canvas=x,y` attribute syntax
- [ ] Document `cols` and `rows` attributes for Grid layout
- [ ] Update modifier documentation
- **Effort:** 1 hour

#### 05_Renderer_Design.md
- [ ] Document sketch.ts module and sketchy rendering
- [ ] Add section on theme-aware shape creation
- [ ] Document `createRect()`, `createLine()`, `createCircle()` helpers
- **Effort:** 1 hour

#### 08_VSCode_Extension.md
- [ ] Add zoom feature documentation
- [ ] Document keyboard shortcuts
- [ ] Update preview section with new UI
- **Effort:** 30 minutes

#### 04_AST_Reference.md
- [ ] Add new ControlType values (Row, Cell, Column*)
- **Effort:** 30 minutes

---

### 3.2 .github/copilot-instructions/09_wireframe-language.md

#### Component Reference Section
- [ ] Add Row and Cell to table
- [ ] Add all ColumnText, ColumnDate, etc. to component table
- [ ] Update Avatar with size attribute
- [ ] Update Badge with variant attribute
- **Effort:** 1 hour

#### Attribute Reference Section
- [ ] Add `grid=row,col,rowSpan,colSpan` syntax
- [ ] Add `canvas=x,y` syntax
- [ ] Add `cols`, `rows` for Grid
- [ ] Add `size` for Avatar (xs/sm/md/lg/xl)
- [ ] Add `variant` for Badge
- [ ] Add `align` for Cell
- **Effort:** 45 minutes

#### Examples Section
- [ ] Add DataGrid with typed columns example
- [ ] Add Grid with spanning example
- [ ] Add Canvas positioning example
- **Effort:** 30 minutes

---

### 3.3 README.md (root)

#### Features Section
- [ ] Update control count (now 40+ with new column types)
- [ ] Add mention of Grid positioning attributes
- [ ] Add zoom feature to VS Code extension features
- **Effort:** 15 minutes

#### Quick Start Section
- [ ] Verify examples still work
- [ ] Consider adding DataGrid example
- **Effort:** 15 minutes

#### Component Quick Reference
- [ ] Add Row, Cell to table if exists
- [ ] Update Avatar with sizes
- [ ] Update Badge with variants
- **Effort:** 30 minutes

---

### 3.4 wireframe/docs/

#### API_REFERENCE.md
- [ ] No changes needed (API unchanged)
- **Effort:** 0

#### GETTING_STARTED.md
- [ ] Add section on zoom controls
- [ ] Verify all examples compile
- **Effort:** 30 minutes

#### EXAMPLES.md
- [ ] Add DataGrid with typed columns example
- [ ] Add Grid positioning example
- [ ] Add Avatar sizes example
- [ ] Add Badge variants example
- **Effort:** 1 hour

#### examples/ folder
- [ ] Create `datagrid-columns.wire` example
- [ ] Create `grid-positioning.wire` example
- [ ] Create `avatar-sizes.wire` example
- [ ] Create `badge-variants.wire` example
- **Effort:** 1 hour

---

## 4. Implementation Order

### Priority 1: AI Instructions (Critical)
1. **09_wireframe-language.md** - AI assistants use this for code generation
   - Must reflect all new components and attributes
   - Enables accurate AI-generated wireframes

### Priority 2: Architecture Docs (High)
2. **06_Component_Library.md** - Primary component reference
3. **00_Language_Specification.md** - Grammar and syntax
4. **04_AST_Reference.md** - Type definitions

### Priority 3: User-Facing (Medium)
5. **README.md** - First thing users see
6. **wireframe/docs/EXAMPLES.md** - Learning resource
7. **wireframe/docs/GETTING_STARTED.md** - Onboarding

### Priority 4: Supporting (Low)
8. **05_Renderer_Design.md** - Internal architecture
9. **08_VSCode_Extension.md** - Extension details

---

## 5. Detailed Change Specifications

### 5.1 New Component Specifications

#### Row
```markdown
### Row

Table row container.

**Syntax:**
```wireframe
Row
    Cell "Column 1"
    Cell "Column 2"
/Row
```

**Modifiers:**

| Modifier | Description |
|----------|-------------|
| selected | Header row styling (darker background) |
```

#### Cell
```markdown
### Cell

Table cell with text content.

**Syntax:**
```wireframe
Cell "Content" align=center
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| align | string | left | Text alignment: left, center, right |
```

#### Column Types
```markdown
### DataGrid Column Types

| Component | Data Type | Sample Display |
|-----------|-----------|----------------|
| ColumnText | String | "Text value" |
| ColumnDate | Date | MM/DD/YYYY |
| ColumnNumber | Number | 123 |
| ColumnCheckbox | Boolean | ☐/☑ |
| ColumnImage | Image | Thumbnail |
| ColumnLink | URL | Hyperlink |
| ColumnButton | Action | Button |

**Example:**
```wireframe
DataGrid rows=5 selected
    ColumnText "Name"
    ColumnDate "Created"
    ColumnNumber "Count"
    ColumnCheckbox "Active"
    ColumnButton "Actions"
/DataGrid
```
```

### 5.2 New Attribute Specifications

#### Grid Positioning
```markdown
### grid Attribute

Position elements in a Grid layout with optional spanning.

**Syntax:** `grid=row,col[,rowSpan,colSpan]`

| Parameter | Description |
|-----------|-------------|
| row | Row index (0-based) |
| col | Column index (0-based) |
| rowSpan | Number of rows to span (default: 1) |
| colSpan | Number of columns to span (default: 1) |

**Example:**
```wireframe
Grid cols=3 rows=2
    Button "Span 2" grid=0,0,1,2
    Button "Normal" grid=0,2
    Button "Tall" grid=1,0,1,1
/Grid
```
```

#### Canvas Positioning
```markdown
### canvas Attribute

Absolute positioning in Canvas layout.

**Syntax:** `canvas=x,y`

**Example:**
```wireframe
Canvas w=400 h=300
    Button "At 10,20" canvas=10,20
    Button "At 200,150" canvas=200,150
/Canvas
```
```

---

## 6. Validation Checklist

After updates, verify:

- [ ] All code examples compile without errors
- [ ] Component counts are accurate
- [ ] Attribute tables match implementation
- [ ] No broken internal links
- [ ] Screenshots/diagrams are current (if any)
- [ ] Version numbers updated where applicable

---

## 7. Effort Summary

| Location | Estimated Time |
|----------|---------------|
| architecture/Wireframe/docs/ | 5 hours |
| 09_wireframe-language.md | 2.25 hours |
| README.md | 1 hour |
| wireframe/docs/ | 2.5 hours |
| **Total** | **~11 hours** |

---

## 8. Dependencies

- All Phase 1-8 implementation complete ✅
- Tests passing (355/355) ✅
- markdown/ examples created ✅

---

## 9. Next Steps

1. Review this plan for completeness
2. Begin with Priority 1 (09_wireframe-language.md)
3. Update architecture docs in order
4. Update user-facing docs
5. Run validation checklist
6. Commit with message: "docs: update documentation for v0.0.7 features"
