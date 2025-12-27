# Design Specifications

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Draft
- **Related:** [01_Issues.md](01_Issues.md)

---

## Overview

This document provides detailed design specifications for the improvements identified in the issues list. Each section corresponds to one or more issues and provides the technical design needed for implementation.

---

## 1. Layout Systems

### 1.1 Grid Layout (Issue #10)

**Purpose:** Allow precise control over component placement in a grid-based layout system.

**Syntax:**
```wireframe
Panel "Dashboard" layout=grid cols=3 rows=4
    Card "Stats" grid=1,1,1,2        // row=1, col=1, rowSpan=1, colSpan=2
    Chart "Revenue" grid=2,1,2,1     // row=2, col=1, rowSpan=2, colSpan=1
    Table "Users" grid=2,2,2,2       // row=2, col=2, rowSpan=2, colSpan=2
```

**Grid Attribute Format:** `grid=row,column,rowSpan,colSpan`
- `row`: Starting row (1-based)
- `column`: Starting column (1-based)  
- `rowSpan`: Number of rows to span (default: 1)
- `colSpan`: Number of columns to span (default: 1)

**AST Extension:**
```typescript
interface GridPosition {
  row: number;
  column: number;
  rowSpan?: number;
  colSpan?: number;
}

interface ComponentNode {
  // ... existing properties
  grid?: GridPosition;
}
```

**Renderer Changes:**
- Calculate cell dimensions based on container size and grid definition
- Position components using absolute coordinates within cells
- Handle spanning across multiple cells

---

### 1.2 Canvas Layout (Issue #14)

**Purpose:** Allow absolute positioning for freeform layouts.

**Syntax:**
```wireframe
Panel "Diagram" layout=canvas width=800 height=600
    Icon "user" canvas=50,100        // x=50, y=100
    Icon "database" canvas=300,100
    Line from=50,100 to=300,100      // Future: connector lines
```

**Canvas Attribute Format:** `canvas=x,y`
- `x`: Horizontal position from left edge
- `y`: Vertical position from top edge

**AST Extension:**
```typescript
interface CanvasPosition {
  x: number;
  y: number;
}

interface ComponentNode {
  // ... existing properties
  canvas?: CanvasPosition;
}
```

---

## 2. Table Components (Issue #11)

### 2.1 Table, Row, Cell Structure

**Purpose:** Provide semantic table structure separate from DataGrid.

**Syntax:**
```wireframe
Table "Users"
    Row header=true
        Cell "Name"
        Cell "Email"
        Cell "Role"
    Row
        Cell "John Doe"
        Cell "john@example.com"
        Cell "Admin"
    Row
        Cell "Jane Smith"
        Cell "jane@example.com"
        Cell "User"
```

**Component Definitions:**

| Component | Properties | Description |
|-----------|------------|-------------|
| `Table` | `title`, `bordered`, `striped` | Container for rows |
| `Row` | `header`, `selected` | Container for cells |
| `Cell` | `align`, `colspan`, `rowspan` | Individual cell content |

**AST Nodes:**
```typescript
interface TableNode extends ComponentNode {
  type: 'Table';
  bordered?: boolean;
  striped?: boolean;
  children: RowNode[];
}

interface RowNode extends ComponentNode {
  type: 'Row';
  header?: boolean;
  children: CellNode[];
}

interface CellNode extends ComponentNode {
  type: 'Cell';
  align?: 'left' | 'center' | 'right';
  colspan?: number;
  rowspan?: number;
}
```

---

## 3. DataGrid Improvements (Issues #12, #13)

### 3.1 Column Type Syntax

**Current (to be deprecated):**
```wireframe
DataGrid "Users"
    Column "Name" type=text
    Column "Date" type=date
```

**New Syntax:**
```wireframe
DataGrid "Users"
    ColumnText "Name"
    ColumnDate "Birth Date"
    ColumnNumber "Age"
    ColumnCheckbox "Active"
    ColumnImage "Avatar"
```

**Column Types:**

| Component | Renders As |
|-----------|------------|
| `ColumnText` | Text placeholder |
| `ColumnDate` | Date format (MM/DD/YYYY) |
| `ColumnNumber` | Numeric placeholder |
| `ColumnCheckbox` | Checkbox indicator |
| `ColumnImage` | Image placeholder |
| `ColumnLink` | Underlined link text |
| `ColumnButton` | Action button |

### 3.2 Columnar Rendering

DataGrid should render data in proper columns with:
- Column headers with proper alignment
- Cell alignment based on column type
- Alternating row colors (optional)
- Column width calculation based on content

**Rendering Layout:**
```
┌─────────────────────────────────────────────────┐
│ Name          │ Birth Date   │ Age  │ Active   │
├─────────────────────────────────────────────────┤
│ ░░░░░░░░      │ ░░/░░/░░░░   │ ░░   │ ☐        │
│ ░░░░░░░░░░    │ ░░/░░/░░░░   │ ░░   │ ☑        │
│ ░░░░░░        │ ░░/░░/░░░░   │ ░░   │ ☐        │
└─────────────────────────────────────────────────┘
```

---

## 4. Component Fixes

### 4.1 TreeView (Issue #2)

**Problem:** TreeView shows +/- expand/collapse indicators inappropriately.

**Solution:** 
- Only show +/- on nodes that have children
- Leaf nodes should not have expand indicators
- Consider making indicators optional via property

**Property Addition:**
```wireframe
TreeView "Files" expandable=false    // Hide all indicators
TreeView "Files" icons=chevron       // Use chevrons instead of +/-
```

### 4.2 Breadcrumb (Issue #8)

**Problem:** Breadcrumb renders vertically instead of horizontally.

**Solution:** Update renderer to use horizontal flex layout with separator.

**Expected Rendering:**
```
Home > Products > Electronics > Phones
```

**CSS/Layout:**
```typescript
// In breadcrumb renderer
direction: 'horizontal',
separator: '>',  // or '/' or custom
gap: 8
```

### 4.3 Dropdown (Issue #9)

**Problem:** Text overlaps in dropdown SVG rendering.

**Root Cause:** Multiple text elements positioned at same coordinates.

**Solution:**
- Calculate text bounds before rendering
- Stack items vertically with proper spacing
- Use clip-path to prevent overflow

### 4.4 Avatar Sizes (Issue #6)

**Add Size Variants:**
```wireframe
Avatar "User" size=xs    // 24px
Avatar "User" size=sm    // 32px
Avatar "User" size=md    // 40px (default)
Avatar "User" size=lg    // 56px
Avatar "User" size=xl    // 80px
```

### 4.5 Badge Variants (Issue #7)

**Add Style Variants:**
```wireframe
Badge "New" variant=primary
Badge "3" variant=secondary
Badge "!" variant=danger
Badge "✓" variant=success
Badge "i" variant=info
Badge "⚠" variant=warning
```

---

## 5. Sketch Theme Improvements (Issue #3)

### 5.1 Sketchy Lines

**Problem:** Sketch theme lines are too straight/perfect.

**Solution:** Apply hand-drawn effect to all strokes:

**Algorithm:**
```typescript
function sketchyLine(x1, y1, x2, y2, roughness = 2): string {
  const points: Point[] = [];
  const segments = Math.ceil(distance(x1, y1, x2, y2) / 10);
  
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = lerp(x1, x2, t) + randomOffset(roughness);
    const y = lerp(y1, y2, t) + randomOffset(roughness);
    points.push({ x, y });
  }
  
  return pointsToPath(points);
}
```

**Apply To:**
- Border strokes
- Separator lines
- Underlines
- Box outlines
- Connector lines

### 5.2 Sketchy Shapes

For rectangles, use slightly irregular paths:
- Corners don't quite meet
- Edges have slight wobble
- Fill uses hatching or cross-hatching (optional)

---

## 6. VS Code Extension Enhancements

### 6.1 Preview Zoom and Scroll (Issue #18)

**Features:**
- Zoom controls: +/- buttons and keyboard shortcuts
- Zoom levels: 25%, 50%, 75%, 100%, 125%, 150%, 200%
- Fit to window option
- Mouse wheel zoom with Ctrl key
- Scroll bars for overflow content
- Pan with middle mouse button or space+drag

**Implementation:**
```typescript
// In webview
interface PreviewState {
  zoom: number;        // 0.25 to 2.0
  panX: number;
  panY: number;
}

// Zoom controls in toolbar
<button onclick="zoomIn()">+</button>
<span>{zoom}%</span>
<button onclick="zoomOut()">-</button>
<button onclick="fitToWindow()">Fit</button>
```

### 6.2 Extension Overview (Issue #16)

Add to `package.json`:
- Detailed description
- Feature list with screenshots
- Quick start guide
- Keyboard shortcuts table
- Links to documentation

---

## 7. Documentation Updates

### 7.1 Files to Update (Issues #4, #5, #17)

| File | Updates Needed |
|------|----------------|
| `API_REFERENCE.md` | New components, grid/canvas attributes |
| `EXAMPLES.md` | Add examples for all new features |
| `GETTING_STARTED.md` | Update with current syntax |
| `README.md` | Feature overview, installation, quick start |
| `09_wireframe-language.md` | Full language specification |

### 7.2 Markdown Examples (Issue #1)

Create example files in `docs/markdown/`:
- `01_basic_components.md` - Buttons, inputs, labels
- `02_containers.md` - Panels, cards, groups
- `03_navigation.md` - Menus, tabs, breadcrumbs
- `04_data_display.md` - Tables, lists, datagrids
- `05_forms.md` - Complete form examples
- `06_layouts.md` - Grid and canvas examples
- `07_themes.md` - Theme comparison examples

---

## 8. Assets

### 8.1 Package Icon (Issue #15)

**Requirements:**
- `wireframe.png` at 128x128 and 256x256
- SVG version for scalability
- Simple, recognizable design
- Works in light and dark themes

**Location:** `packages/vscode-extension/images/`

---

## Priority Matrix

| Issue | Priority | Effort | Dependencies |
|-------|----------|--------|--------------|
| #10 Grid Layout | High | Large | Parser, Renderer |
| #11 Table/Row/Cell | High | Medium | Parser, Renderer |
| #13 DataGrid columns | High | Medium | Renderer |
| #8 Breadcrumb | High | Small | Renderer |
| #9 Dropdown | High | Small | Renderer |
| #2 TreeView | Medium | Small | Renderer |
| #3 Sketch theme | Medium | Medium | Theme system |
| #6 Avatar sizes | Medium | Small | Renderer |
| #7 Badge variants | Medium | Small | Renderer |
| #12 Column syntax | Medium | Medium | Parser |
| #14 Canvas layout | Medium | Large | Parser, Renderer |
| #18 Zoom/scroll | Medium | Medium | Extension |
| #1 Markdown examples | Low | Medium | None |
| #4 API Reference | Low | Medium | After features |
| #5 README | Low | Small | After features |
| #15 Package icon | Low | Small | None |
| #16 Extension overview | Low | Small | None |
| #17 Language spec | Low | Medium | After features |

---

*Design Specifications v1.0 - December 2025*
