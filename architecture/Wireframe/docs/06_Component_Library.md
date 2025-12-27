# Component Library

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source Files:** `packages/core/src/lexer/tokens.ts`, `packages/core/src/parser/ast.ts`

---

## 1. Overview

This document specifies all Wireframe UI components based on the current implementation, including their syntax, properties, and modifiers.

---

## 2. Component Categories

| Category | Components |
|----------|------------|
| **Layouts** | Grid, Vertical, Horizontal, Dock, Canvas, Scroll |
| **Sections** | Header, Footer, Sidebar, Content, Panel, Card, Toolbar, StatusBar, Modal, Drawer |
| **Controls** | Button, IconButton, TextInput, NumberInput, DateInput, PasswordInput, TextArea, Label, Heading, Link, Checkbox, Radio, Dropdown, Option, Separator, Spacer |
| **Visual** | Icon, Image, Avatar, Badge, Progress, Slider, Switch, Chip, Pagination, Toast, Skeleton |
| **Components** | Tabs, Tab, Expander, Tree, TreeItem, List, Menu, MenuItem, Hamburger, Breadcrumb, BreadcrumbItem, Accordion, AccordionSection, Stepper, Step, Dialog, Alert, Hover, Table, DataGrid, Column |

---

## 3. Layout Components

### 3.1 Grid

Grid layout with rows and columns.

**Syntax:**
```wireframe
Grid columns=3 rows=2 gap=16
    Button "Cell 1"
    Button "Cell 2"
    Button "Cell 3"
    Button "Cell 4"
    Button "Cell 5"
    Button "Cell 6"
/Grid
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| columns | number | 1 | Number of columns |
| rows | number | auto | Number of rows |
| gap | number | 0 | Gap between cells |

---

### 3.2 Vertical

Vertical stack layout (flexbox column).

**Syntax:**
```wireframe
Vertical gap=16
    Button "First"
    Button "Second"
    Button "Third"
/Vertical
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| gap | number | 0 | Gap between items |
| align | string | stretch | Cross-axis alignment |
| justify | string | start | Main-axis alignment |
| padding | number | 0 | Inner padding |

---

### 3.3 Horizontal

Horizontal stack layout (flexbox row).

**Syntax:**
```wireframe
Horizontal gap=8
    Button "Left"
    Button "Center"
    Button "Right"
/Horizontal
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| gap | number | 0 | Gap between items |
| align | string | center | Cross-axis alignment |
| justify | string | start | Main-axis alignment |
| padding | number | 0 | Inner padding |

---

### 3.4 Dock

Dock panel layout with positioned children.

**Syntax:**
```wireframe
Dock
    Header dock=top
        Label "Header"
    /Header
    Footer dock=bottom
        Label "Footer"
    /Footer
    Sidebar dock=left
        Label "Sidebar"
    /Sidebar
    Content dock=fill
        Label "Content"
    /Content
/Dock
```

**Dock Positions:**
- `top` - Docked to top
- `bottom` - Docked to bottom
- `left` - Docked to left
- `right` - Docked to right
- `fill` - Fills remaining space

---

### 3.5 Canvas

Absolute positioning canvas.

**Syntax:**
```wireframe
Canvas width=400 height=300
    Button "Positioned" x=50 y=100
/Canvas
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| width | number | 100% | Canvas width |
| height | number | 100% | Canvas height |

**Child Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| x | number | X position |
| y | number | Y position |

---

### 3.6 Scroll

Scrollable container.

**Syntax:**
```wireframe
Scroll height=200
    Vertical gap=8
        Repeat 20
            Label "Item"
        /Repeat
    /Vertical
/Scroll
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| height | number | auto | Container height |
| width | number | auto | Container width |

---

## 4. Section Components

### 4.1 Header

Page or section header.

**Syntax:**
```wireframe
Header height=64
    Horizontal
        Label "App Name"
        Spacer
        Avatar "JD" circle
    /Horizontal
/Header
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| height | number | 64 | Header height |
| dock | position | top | Dock position |

---

### 4.2 Footer

Page or section footer.

**Syntax:**
```wireframe
Footer height=48
    Label "© 2025 Company"
/Footer
```

---

### 4.3 Sidebar

Side navigation panel.

**Syntax:**
```wireframe
Sidebar width=240 dock=left
    Menu
        MenuItem "Dashboard" $icon:home
        MenuItem "Settings" $icon:settings
    /Menu
/Sidebar
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| width | number | 240 | Sidebar width |
| dock | position | left | Dock position |
| position | string | left | left/right |

---

### 4.4 Content

Main content area.

**Syntax:**
```wireframe
Content dock=fill
    // Main content here
/Content
```

---

### 4.5 Panel

Generic panel container.

**Syntax:**
```wireframe
Panel
    Label "Panel content"
/Panel
```

---

### 4.6 Card

Card with border/shadow.

**Syntax:**
```wireframe
Card
    Heading "Card Title" level=2
    Label "Card content goes here"
    Button "Action" primary
/Card
```

---

### 4.7 Toolbar

Action toolbar.

**Syntax:**
```wireframe
Toolbar
    IconButton $icon:save
    IconButton $icon:undo
    IconButton $icon:redo
    Separator
    Dropdown "Font" "Arial" "Helvetica" "Times"
/Toolbar
```

---

### 4.8 StatusBar

Status bar at bottom.

**Syntax:**
```wireframe
StatusBar
    Label "Ready"
    Spacer
    Label "Line 42, Column 8"
/StatusBar
```

---

### 4.9 Modal

Modal dialog overlay.

**Syntax:**
```wireframe
Modal
    Dialog "Confirm Action"
        Label "Are you sure?"
        Horizontal gap=8
            Button "Cancel" secondary
            Button "Confirm" primary
        /Horizontal
    /Dialog
/Modal
```

---

### 4.10 Drawer

Slide-out drawer panel.

**Syntax:**
```wireframe
Drawer position=right width=320
    Heading "Settings" level=2
    // Drawer content
/Drawer
```

---

## 5. Control Components

### 5.1 Button

Interactive button.

**Syntax:**
```wireframe
Button "Click Me"
Button "Primary" primary
Button "Secondary" secondary
Button "Disabled" disabled
Button "With ID" :submitBtn
Button "Navigate" @login
Button "Bound" ?action
```

**Modifiers:**
- `primary` - Primary button style
- `secondary` - Secondary button style
- `disabled` - Disabled state

---

### 5.2 IconButton

Button with icon.

**Syntax:**
```wireframe
IconButton $icon:save
IconButton $icon:add "Add Item"
IconButton $icon:delete primary
```

---

### 5.3 TextInput

Single-line text input.

**Syntax:**
```wireframe
TextInput "Placeholder text"
TextInput "Email" ?email required
TextInput "Read only" readonly
```

**Modifiers:**
- `required` - Required field marker
- `readonly` - Read-only state
- `disabled` - Disabled state

---

### 5.4 NumberInput

Numeric input field.

**Syntax:**
```wireframe
NumberInput "Amount" min=0 max=100
NumberInput "Quantity" ?quantity
```

**Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| min | number | Minimum value |
| max | number | Maximum value |
| step | number | Step increment |

---

### 5.5 DateInput

Date picker input.

**Syntax:**
```wireframe
DateInput "Select date"
DateInput "Birth Date" ?birthDate required
```

---

### 5.6 PasswordInput

Password input field.

**Syntax:**
```wireframe
PasswordInput "Enter password"
PasswordInput "Password" ?password required
```

---

### 5.7 TextArea

Multi-line text input.

**Syntax:**
```wireframe
TextArea "Enter description" rows=4
TextArea "Comments" ?comments
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| rows | number | 3 | Number of rows |

---

### 5.8 Label

Static text label.

**Syntax:**
```wireframe
Label "Static text"
Label "Bound value" ?userName
```

---

### 5.9 Heading

Heading text (h1-h6).

**Syntax:**
```wireframe
Heading "Page Title" level=1
Heading "Section" level=2
Heading "Subsection" level=3
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| level | number | 1 | Heading level (1-6) |

---

### 5.10 Link

Hyperlink.

**Syntax:**
```wireframe
Link "Click here" @target
Link "External" href="https://example.com"
```

---

### 5.11 Checkbox

Checkbox control.

**Syntax:**
```wireframe
Checkbox "Accept terms"
Checkbox "Remember me" checked
Checkbox "Partial" indeterminate
Checkbox "Bound" ?isEnabled
```

**Modifiers:**
- `checked` - Checked state
- `indeterminate` - Indeterminate state
- `disabled` - Disabled state

---

### 5.12 Radio

Radio button.

**Syntax:**
```wireframe
Radio "Option A" ?selection
Radio "Option B" ?selection selected
Radio "Option C" ?selection
```

**Modifiers:**
- `selected` - Selected state
- `disabled` - Disabled state

---

### 5.13 Switch

Toggle switch.

**Syntax:**
```wireframe
Switch "Enable feature"
Switch "Dark mode" checked
Switch "Notifications" ?notifications
```

**Modifiers:**
- `checked` - On state
- `disabled` - Disabled state

---

### 5.14 Dropdown

Dropdown select.

**Syntax:**
```wireframe
// Inline options
Dropdown "Select..." "Option 1" "Option 2" "Option 3"

// With binding
Dropdown ?selectedValue "One" "Two" "Three"

// With child Options
Dropdown "Choose..."
    Option "First"
    Option "Second" selected
    Option "Third"
/Dropdown
```

---

### 5.15 Option

Dropdown option (inside Dropdown).

**Syntax:**
```wireframe
Option "Option text"
Option "Selected option" selected
```

---

### 5.16 Separator

Visual separator line.

**Syntax:**
```wireframe
Separator
```

---

### 5.17 Spacer

Empty space element.

**Syntax:**
```wireframe
Spacer
Spacer height=32
```

---

## 6. Visual Components

### 6.1 Icon

Icon display.

**Syntax:**
```wireframe
Icon $icon:search
Icon $icon:user
```

**Built-in Icons:**
`add`, `edit`, `delete`, `save`, `cancel`, `refresh`, `undo`, `redo`, `copy`, `paste`, `back`, `forward`, `up`, `down`, `home`, `menu`, `close`, `expand`, `collapse`, `check`, `error`, `warning`, `info`, `loading`, `success`, `file`, `folder`, `user`, `users`, `bot`, `chat`, `settings`, `search`, `star`, `image`, `video`, `audio`, `attach`, `camera`, `mic`, `login`, `logout`, `lock`, `unlock`, `key`, `cart`, `heart`, `notification`, `bell`, `calendar`, `clock`, `mail`, `phone`, `link`, `print`, `download`, `upload`, `filter`, `sort`

---

### 6.2 Image

Image placeholder.

**Syntax:**
```wireframe
Image "Product photo" width=200 height=150
```

---

### 6.3 Avatar

User avatar.

**Syntax:**
```wireframe
Avatar "JD"
Avatar "John Doe" circle
Avatar $icon:user circle
```

**Modifiers:**
- `circle` - Circular avatar

---

### 6.4 Badge

Badge/count indicator.

**Syntax:**
```wireframe
Badge "3"
Badge "New" primary
```

---

### 6.5 Progress

Progress bar.

**Syntax:**
```wireframe
Progress value=75
Progress value=50 max=100
Progress indeterminate
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| value | number | 0 | Current value |
| max | number | 100 | Maximum value |

**Modifiers:**
- `indeterminate` - Indeterminate animation

---

### 6.6 Slider

Range slider.

**Syntax:**
```wireframe
Slider min=0 max=100 value=50
Slider ?volume min=0 max=100
```

**Attributes:**

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| min | number | 0 | Minimum value |
| max | number | 100 | Maximum value |
| value | number | 0 | Current value |
| step | number | 1 | Step increment |

---

### 6.7 Chip

Tag/chip element.

**Syntax:**
```wireframe
Chip "Tag"
Chip "Removable" removable
Chip "Primary" primary
```

**Modifiers:**
- `removable` - Shows remove button
- `primary` - Primary styling

---

### 6.8 Pagination

Page navigation.

**Syntax:**
```wireframe
Pagination pages=10 current=3
```

---

### 6.9 Toast

Toast notification.

**Syntax:**
```wireframe
Toast "Operation successful"
Toast "Error occurred" error
```

---

### 6.10 Skeleton

Loading skeleton placeholder.

**Syntax:**
```wireframe
Skeleton width=200 height=20
Skeleton type=avatar
Skeleton type=text lines=3
```

---

## 7. Container Components

### 7.1 Tabs

Tab container.

**Syntax:**
```wireframe
Tabs
    Tab "General" active
        // Tab content
    /Tab
    Tab "Settings"
        // Tab content
    /Tab
    Tab "Advanced"
        // Tab content
    /Tab
/Tabs
```

---

### 7.2 Tab

Individual tab (inside Tabs).

**Syntax:**
```wireframe
Tab "Tab Label"
    // Tab content
/Tab

Tab "Active Tab" active
    // Content
/Tab
```

**Modifiers:**
- `active` - Currently active tab

---

### 7.3 Expander

Expandable/collapsible section.

**Syntax:**
```wireframe
Expander "Click to expand"
    // Expanded content
/Expander

Expander "Pre-expanded" expanded
    // Content
/Expander
```

**Modifiers:**
- `expanded` - Initially expanded

---

### 7.4 Accordion

Accordion container.

**Syntax:**
```wireframe
Accordion
    AccordionSection "Section 1" expanded
        Label "Content 1"
    /AccordionSection
    AccordionSection "Section 2"
        Label "Content 2"
    /AccordionSection
/Accordion
```

---

### 7.5 AccordionSection

Accordion section (inside Accordion).

**Syntax:**
```wireframe
AccordionSection "Section Title"
    // Content
/AccordionSection
```

**Modifiers:**
- `expanded` - Initially expanded

---

### 7.6 Dialog

Dialog box.

**Syntax:**
```wireframe
Dialog "Dialog Title"
    Label "Dialog content"
    Horizontal gap=8
        Button "Cancel" secondary
        Button "OK" primary
    /Horizontal
/Dialog
```

---

### 7.7 Alert

Alert message.

**Syntax:**
```wireframe
Alert "Important message"
    Label "Additional details..."
/Alert
```

---

### 7.8 Hover

Hover tooltip/popover.

**Syntax:**
```wireframe
Hover
    Button "Hover me"
    // Hover content appears here
/Hover
```

---

## 8. Navigation Components

### 8.1 Menu

Menu container.

**Syntax:**
```wireframe
Menu
    MenuItem "Home" $icon:home @home
    MenuItem "Dashboard" $icon:dashboard @dashboard
    Separator
    MenuItem "Settings" $icon:settings @settings
/Menu
```

---

### 8.2 MenuItem

Menu item (inside Menu).

**Syntax:**
```wireframe
MenuItem "Label"
MenuItem "With Icon" $icon:home
MenuItem "With Navigation" @target
MenuItem "Selected" selected
MenuItem "With Submenu"
    MenuItem "Submenu Item 1"
    MenuItem "Submenu Item 2"
/MenuItem
```

**Modifiers:**
- `selected` - Selected state
- `disabled` - Disabled state

---

### 8.3 Hamburger

Hamburger menu button.

**Syntax:**
```wireframe
Hamburger
    Menu
        MenuItem "Item 1"
        MenuItem "Item 2"
    /Menu
/Hamburger
```

---

### 8.4 Breadcrumb

Breadcrumb navigation.

**Syntax:**
```wireframe
Breadcrumb
    BreadcrumbItem "Home" @home
    BreadcrumbItem "Products" @products
    BreadcrumbItem "Details"
/Breadcrumb

// Or with Links
Breadcrumb
    Link "Home" @home
    Link "Products" @products
    Label "Details"
/Breadcrumb
```

---

### 8.5 BreadcrumbItem

Breadcrumb item.

**Syntax:**
```wireframe
BreadcrumbItem "Label" @navigation
```

---

### 8.6 Stepper

Step indicator.

**Syntax:**
```wireframe
Stepper
    Step "Cart" completed
    Step "Shipping" active
    Step "Payment"
    Step "Confirm"
/Stepper
```

---

### 8.7 Step

Individual step (inside Stepper).

**Syntax:**
```wireframe
Step "Step Label"
Step "Completed" completed
Step "Active" active
```

**Modifiers:**
- `completed` - Completed step
- `active` - Current step

---

## 9. Data Components

### 9.1 Table

Data table with markdown syntax.

**Syntax:**
```wireframe
Table
    | Name | Email | Role |
    |------|-------|------|
    | John | john@example.com | Admin |
    | Jane | jane@example.com | User |
/Table
```

---

### 9.2 DataGrid

Data grid with columns.

**Syntax:**
```wireframe
DataGrid ?items
    Column "Name" ?name
    Column "Email" ?email
    Column "Actions"
        Button "Edit" secondary
        Button "Delete" secondary
    /Column
/DataGrid
```

---

### 9.3 Column

DataGrid column.

**Syntax:**
```wireframe
Column "Header" ?binding
Column "With Content"
    // Column content template
/Column
```

---

### 9.4 Tree

Tree view with +/- syntax.

**Syntax:**
```wireframe
Tree
    + Documents
        + Projects
            - Project A
            - Project B
        - Notes.txt
    + Images
        - Photo1.jpg
        - Photo2.jpg
/Tree
```

Or with TreeItem:

```wireframe
Tree
    TreeItem "Documents" expanded
        TreeItem "Projects" expanded
            TreeItem "Project A"
            TreeItem "Project B"
        /TreeItem
    /TreeItem
/Tree
```

---

### 9.5 TreeItem

Tree item node.

**Syntax:**
```wireframe
TreeItem "Label"
TreeItem "Expanded" expanded
    TreeItem "Child 1"
    TreeItem "Child 2"
/TreeItem
```

**Modifiers:**
- `expanded` - Initially expanded

---

### 9.6 List

Simple list with - syntax.

**Syntax:**
```wireframe
List
    - Item 1
    - Item 2
    - Item 3
/List
```

---

## 10. Repeat Component

### 10.1 Repeat

Repeats child elements.

**Syntax:**
```wireframe
// Block repeat
Repeat 5
    Card
        Label "Card content"
    /Card
/Repeat

// Inline repeat
Repeat 3 Button "Click"
```

**Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| count | number | Number of repetitions |

---

## 11. Modifiers Reference

### 11.1 All Modifiers

| Modifier | Description | Applicable To |
|----------|-------------|---------------|
| `primary` | Primary styling | Button, Badge, Chip |
| `secondary` | Secondary styling | Button |
| `required` | Required field marker | TextInput, NumberInput, etc. |
| `disabled` | Disabled state | All interactive controls |
| `checked` | Checked state | Checkbox, Switch |
| `selected` | Selected state | Radio, Option, MenuItem |
| `readonly` | Read-only state | Text inputs |
| `editable` | Editable state | Label, other displays |
| `active` | Active state | Tab, Step |
| `expanded` | Expanded state | Expander, TreeItem, AccordionSection |
| `removable` | Shows remove button | Chip |
| `circle` | Circular style | Avatar |
| `indeterminate` | Indeterminate state | Checkbox, Progress |
| `completed` | Completed state | Step |
| `border` | Border style | Various containers |

---

## 12. Common Attributes

### 12.1 Size Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `width` | number | Element width |
| `height` | number | Element height |

### 12.2 Layout Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `gap` | number | Gap between children |
| `padding` | number | Inner padding |
| `margin` | number | Outer margin |

### 12.3 Position Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `x` | number | X position (Canvas) |
| `y` | number | Y position (Canvas) |
| `dock` | position | Dock position |

---

## 13. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Complete language reference |
| [02_Lexer_Specification](./02_Lexer_Specification.md) | Token definitions |
| [03_Parser_Specification](./03_Parser_Specification.md) | Parser grammar |

---

*Component Library v1.0 - December 2025*
