# UIMMD Component Library

## Document Information
- **Version:** 1.0
- **Date:** 2025
- **Status:** Draft
- **Parent:** [20_Architecture_Overview](./20_Architecture_Overview.md)

---

## 1. Overview

This document specifies all UIMMD UI components, including their syntax, properties, default sizes, and rendering behavior.

---

## 2. Component Categories

| Category | Components |
|----------|------------|
| **Controls** | Button, IconButton, TextInput, NumberInput, DateInput, PasswordInput, TextArea, Label, Checkbox, Radio, Dropdown, Separator, Spacer |
| **Layout** | Grid, Vertical, Horizontal, Dock, Canvas, Scroll |
| **Sections** | Header, Footer, Sidebar, Content, Panel, Card, Toolbar, Modal, Drawer |
| **Navigation** | Menu, MenuItem, Hamburger, Breadcrumb, Tabs, Pagination |
| **Data Display** | Table, DataGrid, List, Tree, Avatar, Badge, Chip, Progress |
| **Feedback** | Alert, Dialog, Toast, Skeleton, Hover |
| **Input** | Switch, Slider, Stepper, Accordion |

---

## 3. Control Components

### 3.1 Button

Interactive button control.

**Syntax:**
```uimmd
Button "Text"
Button "Text" :id
Button "Text" primary
Button "Text" secondary
Button "Text" disabled
Button "Text" @NavigationTarget
Button "Text" :id primary @Target tooltip="Hint"
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| text | string | required | Button label |
| id | string | - | Unique identifier |
| primary | boolean | false | Primary styling |
| secondary | boolean | false | Secondary styling |
| disabled | boolean | false | Disabled state |
| tooltip | string | - | Tooltip text |
| navigation | string | - | Navigation target |

**Default Size:** 100×36px (auto-width based on text)

**Rendering:**
```svg
<g class="uimmd-button primary">
    <rect x="0" y="0" width="100" height="36" rx="4"/>
    <text x="50" y="18" text-anchor="middle">Button Text</text>
</g>
```

---

### 3.2 IconButton

Button with icon, optionally with text.

**Syntax:**
```uimmd
IconButton $icon
IconButton $icon "Text"
IconButton $icon "Text" :id primary
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| icon | string | required | Icon name (e.g., $save) |
| text | string | - | Optional label |
| id | string | - | Unique identifier |
| primary | boolean | false | Primary styling |
| tooltip | string | - | Tooltip text |

**Default Size:** 
- Icon only: 36×36px
- With text: 120×36px

---

### 3.3 TextInput

Single-line text input field.

**Syntax:**
```uimmd
TextInput "placeholder"
TextInput "placeholder" :id
TextInput "placeholder" :id required
TextInput "placeholder" :id .binding
TextInput "placeholder" :id required min=3 max=50 pattern=email
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| placeholder | string | required | Placeholder text |
| id | string | - | Unique identifier |
| required | boolean | false | Required field |
| binding | string | - | Data binding path |
| min | number | - | Minimum length |
| max | number | - | Maximum length |
| pattern | string | - | Validation pattern |
| disabled | boolean | false | Disabled state |
| tooltip | string | - | Tooltip text |

**Default Size:** 200×36px

**Validation Patterns:**
- `email` - Email format
- `url` - URL format
- `phone` - Phone number
- `alpha` - Letters only
- `numeric` - Numbers only
- `alphanumeric` - Letters and numbers

---

### 3.4 NumberInput

Numeric input field.

**Syntax:**
```uimmd
NumberInput "placeholder"
NumberInput "0" :txtAge min=0 max=150
NumberInput "Amount" :txtAmount required .order.amount
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| placeholder | string | required | Placeholder text |
| id | string | - | Unique identifier |
| required | boolean | false | Required field |
| min | number | - | Minimum value |
| max | number | - | Maximum value |
| step | number | 1 | Step increment |
| binding | string | - | Data binding path |

**Default Size:** 120×36px

---

### 3.5 DateInput

Date selection input.

**Syntax:**
```uimmd
DateInput "Select date"
DateInput "Birth date" :txtDOB required .user.birthDate
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| placeholder | string | required | Placeholder text |
| id | string | - | Unique identifier |
| required | boolean | false | Required field |
| binding | string | - | Data binding path |
| min | string | - | Minimum date |
| max | string | - | Maximum date |

**Default Size:** 150×36px

---

### 3.6 PasswordInput

Masked password input.

**Syntax:**
```uimmd
PasswordInput "Password"
PasswordInput "Password" :txtPass required min=8
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| placeholder | string | required | Placeholder text |
| id | string | - | Unique identifier |
| required | boolean | false | Required field |
| min | number | - | Minimum length |
| binding | string | - | Data binding path |

**Default Size:** 200×36px

---

### 3.7 TextArea

Multi-line text input.

**Syntax:**
```uimmd
TextArea "Enter description"
TextArea "Notes" :txtNotes rows=4 .order.notes
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| placeholder | string | required | Placeholder text |
| id | string | - | Unique identifier |
| rows | number | 3 | Number of visible rows |
| required | boolean | false | Required field |
| binding | string | - | Data binding path |

**Default Size:** 300×100px (height based on rows)

---

### 3.8 Label

Text display element.

**Syntax:**
```uimmd
Label "Plain text"
Label "**Bold text**"
Label "*Italic text*"
Label "`Code text`"
Label "Link" @Target
Label "Text" :lblId
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| text | string | required | Display text |
| id | string | - | Unique identifier |
| navigation | string | - | Link target |

**Markdown Formatting:**
- `**text**` - Bold
- `*text*` - Italic
- `` `text` `` - Code/monospace
- `~~text~~` - Strikethrough

**Default Size:** Auto (based on text)

---

### 3.9 Checkbox

Checkable toggle control.

**Syntax:**
```uimmd
Checkbox "Label"
Checkbox "Accept terms" :chkTerms
Checkbox "Active" :chkActive checked
Checkbox "Subscribe" :chkSub .user.newsletter
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| label | string | required | Checkbox label |
| id | string | - | Unique identifier |
| checked | boolean | false | Initial state |
| required | boolean | false | Required field |
| binding | string | - | Data binding path |

**Default Size:** 150×24px

---

### 3.10 Radio

Radio button for single selection.

**Syntax:**
```uimmd
Radio "Option A" :radA
Radio "Option B" :radB selected
Radio "Option C" :radC group=options
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| label | string | required | Radio label |
| id | string | - | Unique identifier |
| selected | boolean | false | Initial state |
| group | string | - | Radio group name |
| binding | string | - | Data binding path |

**Default Size:** 150×24px

---

### 3.11 Dropdown

Selection dropdown control.

**Syntax:**
```uimmd
Dropdown :ddlCountry
    Option "Select..."
    Option "USA"
    Option "Canada"
/Dropdown

Dropdown :ddlCountry .user.country
    Option "Select..."
    Option "USA"
    Option "Canada"
/Dropdown

// Inline syntax
Dropdown "USA" "Canada" "UK" :ddlCountry
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| id | string | - | Unique identifier |
| binding | string | - | Data binding path |
| required | boolean | false | Required field |
| disabled | boolean | false | Disabled state |

**Default Size:** 200×36px

---

### 3.12 Separator

Horizontal dividing line.

**Syntax:**
```uimmd
Separator
```

**Default Size:** 100%×1px

---

### 3.13 Spacer

Flexible space filler.

**Syntax:**
```uimmd
Spacer
```

**Behavior:** Expands to fill available space in flex layouts.

---

## 4. Layout Components

### 4.1 Vertical

Vertical stack layout.

**Syntax:**
```uimmd
Vertical
Vertical gap=12
Vertical gap=8 align=center
Vertical gap=16 align=stretch padding=20
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| gap | number | 0 | Space between children |
| align | string | stretch | Cross-axis: start, center, end, stretch |
| justify | string | start | Main-axis: start, center, end |
| padding | number | 0 | Internal padding |
| w | number/string | auto | Width |
| h | number/string | auto | Height |

---

### 4.2 Horizontal

Horizontal stack layout.

**Syntax:**
```uimmd
Horizontal
Horizontal gap=8
Horizontal gap=16 justify=end
Horizontal justify=between align=center
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| gap | number | 0 | Space between children |
| align | string | center | Cross-axis: start, center, end, stretch |
| justify | string | start | Main-axis: start, center, end, between, around |
| padding | number | 0 | Internal padding |
| w | number/string | auto | Width |
| h | number/string | auto | Height |

---

### 4.3 Grid

Grid layout with rows and columns.

**Syntax:**
```uimmd
Grid cols=2
Grid rows=3 cols=2 gap=16
Grid cols="200px 1fr 100px" rows="auto 1fr auto"
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| cols | number/string | 1 | Column count or sizes |
| rows | number/string | auto | Row count or sizes |
| gap | number | 0 | Gap between cells |
| padding | number | 0 | Internal padding |

**Child Positioning:**
```uimmd
Grid cols=3 rows=2
    Label "A" grid=0,0
    Label "B" grid=0,1
    Label "C" grid=0,2
    Label "D" grid=1,0,1,2    // Row 1, Col 0, spans 2 columns
/Grid
```

---

### 4.4 Dock

Dock layout with edges and fill.

**Syntax:**
```uimmd
Dock
    Header dock=top h=60
    Sidebar dock=left w=200
    Footer dock=bottom h=40
    Content dock=fill
/Dock
```

**Dock Values:**
- `top` - Dock to top edge
- `bottom` - Dock to bottom edge
- `left` - Dock to left edge
- `right` - Dock to right edge
- `fill` - Fill remaining space

---

### 4.5 Canvas

Absolute positioning layout.

**Syntax:**
```uimmd
Canvas w=800 h=600
    Button "A" canvas=10,20
    Button "B" canvas=100,50
    Label "C" canvas=200,100,150,40    // x, y, w, h
/Canvas
```

---

### 4.6 Scroll

Scrollable container.

**Syntax:**
```uimmd
Scroll
    Vertical gap=8
        // Many items...
    /Vertical
/Scroll

Scroll direction=horizontal
    Horizontal gap=8
        // Many items...
    /Horizontal
/Scroll
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| direction | string | vertical | vertical, horizontal, both |

---

## 5. Section Components

### 5.1 Card

Card container with shadow.

**Syntax:**
```uimmd
Card
    Label "Card content"
/Card

Card :cardId padding=16
    Vertical gap=8
        Label "**Title**"
        Label "Description"
    /Vertical
/Card
```

**Default Styling:** White background, subtle shadow, rounded corners.

---

### 5.2 Panel

Generic container panel.

**Syntax:**
```uimmd
Panel :pnlDetails
    // Content
/Panel

Panel :pnlAdvanced visible=false
    // Hidden by default
/Panel
```

---

### 5.3 Header / Footer

Page header and footer sections.

**Syntax:**
```uimmd
Header dock=top h=60
    Horizontal padding=16
        Icon $app
        Label "**App Title**"
        Spacer
        Avatar "JD"
    /Horizontal
/Header

Footer dock=bottom h=40
    Label "*© 2025 Company*"
/Footer
```

---

### 5.4 Sidebar

Side navigation panel.

**Syntax:**
```uimmd
Sidebar dock=left w=220
    Vertical padding=12
        IconButton $home "Home" @Home
        IconButton $settings "Settings" @Settings
    /Vertical
/Sidebar
```

---

### 5.5 Modal

Modal dialog overlay.

**Syntax:**
```uimmd
Modal "Dialog Title" :dlgConfirm
    Label "Modal content"
    Horizontal justify=end gap=8
        Button "Cancel"
        Button "OK" primary
    /Horizontal
/Modal
```

---

### 5.6 Drawer

Slide-out drawer panel.

**Syntax:**
```uimmd
Drawer :drwMenu position=left
    Menu
        MenuItem "Option 1"
        MenuItem "Option 2"
    /Menu
/Drawer
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| position | string | left | left, right, top, bottom |

---

## 6. Navigation Components

### 6.1 Tabs

Tabbed content container.

**Syntax:**
```uimmd
Tabs :tabMain
    Tab "General"
        Label "General content"
    /Tab
    Tab "Advanced"
        Label "Advanced content"
    /Tab
/Tabs
```

---

### 6.2 Menu

Hierarchical menu.

**Syntax:**
```uimmd
Menu :mnuMain
    MenuItem "File"
        MenuItem "New" @New
        MenuItem "Open" @Open
        Separator
        MenuItem "Exit" @Exit
    /MenuItem
    MenuItem "Edit"
        MenuItem "Undo" icon=$undo
        MenuItem "Redo" icon=$redo
    /MenuItem
/Menu
```

---

### 6.3 Hamburger

Mobile hamburger menu.

**Syntax:**
```uimmd
Hamburger :btnMenu
    MenuItem "Home" icon=$home @Home
    MenuItem "Settings" icon=$settings @Settings
    Separator
    MenuItem "Logout" icon=$logout
/Hamburger
```

---

### 6.4 Breadcrumb

Breadcrumb navigation.

**Syntax:**
```uimmd
Breadcrumb
    BreadcrumbItem "Home" @Home
    BreadcrumbItem "Products" @Products
    BreadcrumbItem "Category"
/Breadcrumb
```

---

### 6.5 Pagination

Page navigation control.

**Syntax:**
```uimmd
Pagination pages=10 current=3 :pgNav
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| pages | number | required | Total page count |
| current | number | 1 | Current page |
| id | string | - | Unique identifier |

---

## 7. Data Display Components

### 7.1 Table

Static data table.

**Syntax:**
```uimmd
Table :tblUsers
    | Name | Email | Role |
    |------|-------|------|
    | John | john@example.com | Admin |
    | Jane | jane@example.com | User |
/Table

// Placeholder table
Table cols="Name,Email,Role" rows=5
```

---

### 7.2 DataGrid

Interactive data grid.

**Syntax:**
```uimmd
DataGrid :dgOrders data=orderItems
    Column field=product header="Product"
    Column field=quantity header="Qty" editable=true align=right
    Column field=price header="Price" format=currency
    Column header="Actions"
        IconButton $edit
        IconButton $delete
    /Column
/DataGrid
```

**Column Properties:**

| Property | Type | Description |
|----------|------|-------------|
| field | string | Data field name |
| header | string | Column header |
| width | number | Column width |
| align | string | left, center, right |
| editable | boolean | Allow editing |
| readonly | boolean | Read-only display |
| format | string | currency, number, percent, date |
| sortable | boolean | Enable sorting |

---

### 7.3 List

List of items.

**Syntax:**
```uimmd
List :lstItems
    - Item 1
    - Item 2
    - Item 3
/List

List ordered=true
    - First
    - Second
    - Third
/List
```

---

### 7.4 Tree

Hierarchical tree view.

**Syntax:**
```uimmd
Tree :treeNav
    + Root
        + Child 1
            - Leaf 1a
            - Leaf 1b
        + Child 2
        - Leaf 3
/Tree
```

**Node Symbols:**
- `+` - Expandable node
- `-` - Leaf node

---

### 7.5 Avatar

User avatar display.

**Syntax:**
```uimmd
Avatar "John Doe"
Avatar "JD" size=48
Avatar image="photo.jpg" size=64
```

**Default Size:** 40×40px

---

### 7.6 Badge

Notification badge.

**Syntax:**
```uimmd
Button "Notifications" badge="5"
Icon $bell badge="3"
```

---

### 7.7 Progress

Progress indicator.

**Syntax:**
```uimmd
Progress value=75
Progress value=50 :prgUpload
Progress indeterminate=true
```

**Default Size:** 200×8px

---

## 8. Feedback Components

### 8.1 Alert

Alert/notification box.

**Syntax:**
```uimmd
Alert type=info
    Label "Informational message"
/Alert

Alert type=error title="Error"
    Label "Something went wrong"
/Alert
```

**Types:** info, success, warning, error

---

### 8.2 Dialog

Modal dialog.

**Syntax:**
```uimmd
Dialog "Confirm" :dlgConfirm
    Label "Are you sure."
    Horizontal justify=end gap=8
        Button "Cancel"
        Button "Confirm" primary
    /Horizontal
/Dialog
```

---

### 8.3 Toast

Toast notification.

**Syntax:**
```uimmd
Toast "Saved successfully" type=success
Toast "Error occurred" type=error
```

---

### 8.4 Skeleton

Loading placeholder.

**Syntax:**
```uimmd
Skeleton type=text lines=3
Skeleton type=card
Skeleton type=avatar
Skeleton type=image w=200 h=150
```

---

## 9. Input Components

### 9.1 Switch

Toggle switch.

**Syntax:**
```uimmd
Switch "Dark Mode" :swDark
Switch "Notifications" checked=true
```

---

### 9.2 Slider

Range slider.

**Syntax:**
```uimmd
Slider min=0 max=100 value=50 :sldVolume
Slider min=0 max=100 step=10
```

---

### 9.3 Stepper

Multi-step indicator.

**Syntax:**
```uimmd
Stepper :stpWizard
    Step "Account" completed=true
    Step "Details" current=true
    Step "Review"
    Step "Confirm"
/Stepper
```

---

### 9.4 Accordion

Collapsible sections.

**Syntax:**
```uimmd
Accordion :accFAQ
    AccordionSection "Question 1."
        Label "Answer 1"
    /AccordionSection
    AccordionSection "Question 2."
        Label "Answer 2"
    /AccordionSection
/Accordion
```

---

## 10. Component Size Reference

| Component | Default Width | Default Height |
|-----------|---------------|----------------|
| Button | auto (min 80) | 36 |
| IconButton | 36 | 36 |
| IconButton (text) | 120 | 36 |
| TextInput | 200 | 36 |
| NumberInput | 120 | 36 |
| DateInput | 150 | 36 |
| PasswordInput | 200 | 36 |
| TextArea | 300 | 100 |
| Label | auto | 24 |
| Checkbox | 150 | 24 |
| Radio | 150 | 24 |
| Dropdown | 200 | 36 |
| Switch | 150 | 24 |
| Slider | 200 | 24 |
| Avatar | 40 | 40 |
| Progress | 200 | 8 |
| Icon | 24 | 24 |
| Image | 200 | 150 |

---

## 11. Related Documents

| Document | Description |
|----------|-------------|
| [20_Architecture_Overview](./20_Architecture_Overview.md) | System architecture |
| [23_Renderer_Design](./23_Renderer_Design.md) | Renderer details |
| [26_Theming_System](./26_Theming_System.md) | Theme implementation |
| [06k_Language_Specification_v7](../planning/06k_Language_Specification_v7_Keywords.md) | Language spec |

---

*UIMMD Component Library v1.0 - 2025*
