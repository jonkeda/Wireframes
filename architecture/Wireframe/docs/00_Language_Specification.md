# Wireframe Language Specification

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Source Files:** `packages/core/src/lexer/tokens.ts`, `packages/core/src/parser/`

---

## 1. Overview

Wireframe is a text-based domain-specific language (DSL) for creating UI wireframe mockups. It uses a simple, readable keyword-based syntax that is:

- **Easy to learn** - Uses familiar UI terminology
- **AI-friendly** - Natural language-like tokens
- **Version control friendly** - Plain text format
- **Portable** - Renders to SVG for universal display

### 1.1 File Extension

Wireframe files use the `.wire` extension.

### 1.2 Design Philosophy

| Principle | Description |
|-----------|-------------|
| **Keywords over symbols** | Self-documenting syntax using readable words |
| **Consistent patterns** | Same structure everywhere |
| **Indentation-based** | Python-like block structure |
| **Declarative** | Describe what, not how |

---

## 2. Document Structure

Every wireframe document follows this structure:

```wireframe
// Optional comment
wireframe <style>
    %title: Document Title
    %version: 1.0
    %author: Author Name
    
    // Content here (indented)
    Vertical gap=16
        Label "Hello World"
    /Vertical
/wireframe
```

### 2.1 Document Wrapper

The document must start with `wireframe` followed by an optional style:

```wireframe
wireframe clean
    // content
/wireframe
```

**Important:** All content (including document attributes) must be indented inside the wireframe block.

### 2.2 Wireframe Styles

| Style | Description |
|-------|-------------|
| `sketch` | Hand-drawn, sketchy appearance |
| `blueprint` | Technical blueprint style |
| `clean` | Modern, minimal wireframe (default) |
| `realistic` | Closer to final UI appearance |

### 2.3 Document Attributes

Document-level metadata uses `%name: value` syntax (must be indented):

```wireframe
wireframe clean
    %title: Login Form
    %version: 2.0
    %author: Design Team
    %date: 2025-12-27
    %figma: https://figma.com/file/xxx
    %jira: PROJ-123
    
    // content
/wireframe
```

---

## 3. Comments

### 3.1 Single-Line Comments

```wireframe
// This is a single-line comment
Button "Click me"  // Inline comment
```

### 3.2 Multi-Line Comments

```wireframe
/*
    This is a multi-line comment
    spanning multiple lines.
*/
```

---

## 4. Block Structure

### 4.1 Indentation

Wireframe uses **4-space indentation** to define hierarchy:

```wireframe
wireframe clean
    Vertical gap=16
        Label "Title"
        Button "Submit"
    /Vertical
/wireframe
```

### 4.2 Block Termination

Blocks can be closed in two ways:

**Explicit closing (recommended for complex structures):**
```wireframe
Vertical gap=16
    Button "One"
    Button "Two"
/Vertical
```

**Indentation-based (automatic):**
```wireframe
Vertical gap=16
    Button "One"
    Button "Two"
// Next element at same or lower indent level closes the block
```

---

## 5. Layouts

Layouts define how child elements are arranged.

| Layout | Description |
|--------|-------------|
| `Grid` | Row/column grid layout |
| `Vertical` | Vertical stack (top to bottom) |
| `Horizontal` | Horizontal stack (left to right) |
| `Dock` | Dock layout (top, bottom, left, right, fill) |
| `Canvas` | Absolute positioning |
| `Scroll` | Scrollable container |

### 5.1 Vertical Layout

```wireframe
Vertical gap=8 padding=16
    Label "Item 1"
    Label "Item 2"
    Label "Item 3"
/Vertical
```

**Attributes:**
- `gap=n` - Space between items (pixels)
- `padding=n` - Internal padding
- `align=` - Cross-axis: `start`, `center`, `end`, `stretch`
- `justify=` - Main-axis: `start`, `center`, `end`, `between`, `around`

### 5.2 Horizontal Layout

```wireframe
Horizontal gap=16 justify=end
    Button "Cancel"
    Button "Save" primary
/Horizontal
```

### 5.3 Grid Layout

```wireframe
Grid rows=2 cols=3 gap=16
    Label "Cell 1"
    Label "Cell 2"
    Label "Cell 3"
    Label "Cell 4"
    Label "Cell 5"
    Label "Cell 6"
/Grid
```

**Attributes:**
- `cols=n` - Number of columns
- `rows=n` - Number of rows
- `gap=n` - Gap between cells

**Child Positioning:**

Use `grid=row,col[,rowSpan,colSpan]` to position children:

```wireframe
Grid cols=3 rows=2
    Button "Span 2 cols" grid=0,0,1,2
    Button "Normal" grid=0,2
    Button "Span 2 rows" grid=1,0,2,1
/Grid
```

### 5.4 Dock Layout

```wireframe
Dock
    Header dock=top
        Label "Header"
    /Header
    
    Sidebar dock=left
        Label "Sidebar"
    /Sidebar
    
    Content dock=fill
        Label "Main Content"
    /Content
    
    Footer dock=bottom
        Label "Footer"
    /Footer
/Dock
```

**Dock positions:** `top`, `bottom`, `left`, `right`, `fill`

### 5.5 Canvas Layout

```wireframe
Canvas w=400 h=300
    Button "Positioned" canvas=50,100
    Icon $star canvas=200,150
/Canvas
```

**Child Positioning:**

Use `canvas=x,y` for absolute positioning:

| Parameter | Description |
|-----------|-------------|
| x | X position from left |
| y | Y position from top |

---

## 6. Sections

Sections are semantic container elements.

| Section | Description |
|---------|-------------|
| `Header` | Page or section header |
| `Footer` | Page or section footer |
| `Sidebar` | Side navigation area |
| `Content` | Main content area |
| `Panel` | Generic panel container |
| `Card` | Card component |
| `Toolbar` | Toolbar area |
| `StatusBar` | Status bar |
| `Modal` | Modal dialog overlay |
| `Drawer` | Slide-out drawer panel |

### 6.1 Example

```wireframe
Card padding=16
    Vertical gap=8
        Label "**Card Title**"
        Label "Card content goes here."
        Button "Action" primary
    /Vertical
/Card
```

---

## 7. Controls

Controls are interactive UI elements.

### 7.1 Button

```wireframe
Button "Click Me"
Button "Primary" primary
Button "Secondary" secondary
Button "Disabled" disabled
Button "With ID" :btnSubmit
Button "Navigate" @NextPage
```

### 7.2 IconButton

```wireframe
IconButton $save
IconButton $save "Save"
IconButton $icon:settings primary
```

### 7.3 TextInput

```wireframe
TextInput "Placeholder text"
TextInput "Username" :txtUser
TextInput "Email" :txtEmail required
TextInput "Name" :txtName ?user.name
```

### 7.4 NumberInput

```wireframe
NumberInput "0" :txtAge
NumberInput "Amount" :txtAmount min=0 max=100
```

### 7.5 DateInput

```wireframe
DateInput "Select date" :txtDate
DateInput "Birthday" :txtBirth required
```

### 7.6 PasswordInput

```wireframe
PasswordInput "Password" :txtPass
PasswordInput "Confirm" :txtConfirm required
```

### 7.7 TextArea

```wireframe
TextArea "Enter description" :txtDesc
TextArea "Notes" :txtNotes rows=4
```

### 7.8 Label

```wireframe
Label "Plain text"
Label "**Bold text**"
Label "*Italic text*"
Label "`Code style`"
```

### 7.9 Heading

```wireframe
Heading "Page Title"
Heading "Section" level=2
```

### 7.10 Link

```wireframe
Link "Click here"
Link "Go to page" @TargetPage
Link "External" url="https://example.com"
```

### 7.11 Checkbox

```wireframe
Checkbox "Accept terms"
Checkbox "Remember me" checked
Checkbox "Required option" required
Checkbox "Disabled" disabled
Checkbox "Subscribe" :chkNews ?user.newsletter
```

### 7.12 Radio

```wireframe
Radio "Option A" :radA
Radio "Option B" :radB selected
Radio "Grouped" :radC group=options
```

### 7.13 Dropdown

```wireframe
Dropdown :ddlCountry
    Option "Select..."
    Option "USA"
    Option "Canada"
    Option "UK"
/Dropdown

// Inline syntax
Dropdown "USA" "Canada" "UK" :ddlCountry
```

### 7.14 Other Controls

| Control | Example |
|---------|---------|
| `Separator` | `Separator` |
| `Spacer` | `Spacer` |
| `Icon` | `Icon $settings` |
| `Image` | `Image "photo.jpg"` |
| `Avatar` | `Avatar "JD"` or `Avatar "John Doe" size=lg` |
| `Badge` | `Badge "5"` or `Badge "New" variant=success` |
| `Progress` | `Progress value=75` |
| `Slider` | `Slider min=0 max=100 value=50` |
| `Switch` | `Switch "Dark Mode"` |
| `Chip` | `Chip "Tag" removable` |
| `Pagination` | `Pagination pages=10 current=3` |
| `Toast` | `Toast "Saved!" type=success` |
| `Skeleton` | `Skeleton type=text lines=3` |

---

## 8. Components

Components are complex UI elements that contain other elements.

### 8.1 Tabs

```wireframe
Tabs :tabMain
    Tab "General" active
        Label "General content"
    /Tab
    Tab "Settings"
        Label "Settings content"
    /Tab
/Tabs
```

### 8.2 Menu

```wireframe
Menu
    MenuItem "Home" $icon:home active
    MenuItem "Settings" $icon:settings
    MenuItem "Logout" $icon:logout
/Menu
```

### 8.3 Accordion

```wireframe
Accordion
    AccordionSection "Question 1?" expanded
        Label "Answer to question 1"
    /AccordionSection
    AccordionSection "Question 2?"
        Label "Answer to question 2"
    /AccordionSection
/Accordion
```

### 8.4 Tree

**Using TreeItem components:**
```wireframe
Tree
    TreeItem "Root" expanded
        TreeItem "Child 1"
        TreeItem "Child 2"
            TreeItem "Grandchild"
        /TreeItem
    /TreeItem
/Tree
```

**Using branch/leaf syntax:**
```wireframe
Tree
    + Root Node
        + Child Branch
            - Leaf 1
            - Leaf 2
        - Child Leaf
/Tree
```

### 8.5 Breadcrumb

```wireframe
Breadcrumb
    Link "Home"
    Link "Products"
    Link "Category"
    Label "Current Item"
/Breadcrumb
```

### 8.6 Stepper

```wireframe
Stepper
    Step "Account" completed
    Step "Details" active
    Step "Review"
    Step "Confirm"
/Stepper
```

### 8.7 Table

```wireframe
Table
    | Name | Email | Role |
    |------|-------|------|
    | John | john@example.com | Admin |
    | Jane | jane@example.com | User |
/Table
```

### 8.8 DataGrid

```wireframe
DataGrid :dgOrders rows=5 selected
    ColumnText "Product"
    ColumnNumber "Qty"
    ColumnDate "Date"
    ColumnCheckbox "Shipped"
    ColumnButton "Actions"
/DataGrid
```

**Column Types:**

| Type | Description |
|------|-------------|
| `ColumnText` | Text column |
| `ColumnDate` | Date (MM/DD/YYYY) |
| `ColumnNumber` | Numeric column |
| `ColumnCheckbox` | Boolean checkbox |
| `ColumnImage` | Image thumbnail |
| `ColumnLink` | Clickable link |
| `ColumnButton` | Action button |

### 8.9 Row and Cell

```wireframe
Vertical
    Row selected
        Cell "Name" align=left
        Cell "Email" align=center
    /Row
    Row
        Cell "John Doe"
        Cell "john@example.com"
    /Row
/Vertical
```

**Cell Attributes:**
- `align` - Text alignment: `left`, `center`, `right`

**Row Modifiers:**
- `selected` - Header row styling

---

## 9. Identifiers and References

### 9.1 ID Assignment (`:`)

Assign unique identifiers to elements:

```wireframe
Button "Save" :btnSave
TextInput "Name" :txtName
Panel :pnlDetails
```

### 9.2 Data Binding (`?`)

Bind elements to data fields:

```wireframe
TextInput "First Name" :txtFirst ?customer.firstName
TextInput "Last Name" :txtLast ?customer.lastName
Dropdown :ddlStatus ?customer.status
    Option "Active"
    Option "Inactive"
/Dropdown
```

### 9.3 Navigation (`@`)

Define navigation targets:

```wireframe
Button "Login" @Dashboard
Button "Cancel" @:back
Button "Help" @:modal:HelpDialog
Link "Terms" @TermsPage
```

**Special targets:**
- `@:back` - Navigate back
- `@:close` - Close current modal/drawer
- `@:modal:File` - Open file as modal
- `@:drawer:File` - Open file as drawer

### 9.4 Icon Reference (`$`)

Reference icons by name:

```wireframe
Icon $settings
IconButton $save "Save"
MenuItem "Home" $icon:home
```

**Two formats supported:**
- `$iconname` - Short format
- `$icon:iconname` - Explicit format

---

## 10. Modifiers

Modifiers change element appearance or behavior.

| Modifier | Description | Applies To |
|----------|-------------|------------|
| `primary` | Primary/emphasized style | Button, IconButton |
| `secondary` | Secondary style | Button, IconButton |
| `required` | Required field indicator | Input controls |
| `disabled` | Disabled state | All controls |
| `checked` | Checked state | Checkbox, Switch |
| `selected` | Selected state | Radio, Option, Chip |
| `readonly` | Read-only state | Input controls |
| `editable` | Editable state | DataGrid columns |
| `active` | Active/current state | Tab, MenuItem, Step |
| `expanded` | Expanded state | AccordionSection, TreeItem |
| `removable` | Can be removed | Chip |
| `circle` | Circular shape | Avatar, Badge |
| `indeterminate` | Indeterminate state | Checkbox, Progress |
| `completed` | Completed state | Step |
| `border` | Show border | Various containers |

### 10.1 Usage Examples

```wireframe
Button "Submit" primary
Checkbox "Remember" checked
Tab "Dashboard" active
AccordionSection "Details" expanded
Step "Shipping" completed
Avatar "JD" circle
Chip "Removable" removable
```

---

## 11. Attributes

Attributes are key-value pairs that configure elements.

### 11.1 Syntax

```wireframe
Element attribute=value attribute2="string value"
```

### 11.2 Common Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `gap=` | Spacing between items | `gap=16` |
| `padding=` | Internal padding | `padding=8` |
| `w=` | Width | `w=200` or `w=50%` |
| `h=` | Height | `h=100` |
| `min=` | Minimum value | `min=0` |
| `max=` | Maximum value | `max=100` |
| `value=` | Current value | `value=50` |
| `rows=` | Number of rows | `rows=4` |
| `cols=` | Number of columns | `cols=3` |
| `tooltip=` | Tooltip text | `tooltip="Click to save"` |
| `dock=` | Dock position | `dock=top` |
| `align=` | Alignment | `align=center` |
| `justify=` | Justification | `justify=end` |

---

## 12. Repeat

Repeat content multiple times:

```wireframe
Repeat 3
    Card
        Label "Repeated card"
    /Card
/Repeat

// Inline syntax
Repeat 5 Label "Item"
```

---

## 13. Data Sections

Data sections define metadata at the end of the document.

### 13.1 Data Sources

```wireframe
data
    | Source | Type | Fields |
    |--------|------|--------|
    | customer | object | firstName, lastName, email |
    | orderItems | collection | product, quantity, price |
/data
```

### 13.2 Validations

```wireframe
validations
    | Field | Rule | Message |
    |-------|------|---------|
    | txtUsername | required | "Username is required" |
    | txtEmail | pattern(email) | "Invalid email" |
/validations
```

### 13.3 Calculations

```wireframe
calculations
    | Field | Formula | Description |
    |-------|---------|-------------|
    | txtTotal | sum(items.price) | Sum of prices |
/calculations
```

### 13.4 Rules

```wireframe
rules
    | ID | Condition | Action | Controls |
    |----|-----------|--------|----------|
    | R001 | chkTerms checked | enable | btnSubmit |
/rules
```

---

## 14. Built-in Icons

| Category | Icons |
|----------|-------|
| **Actions** | `add`, `edit`, `delete`, `save`, `cancel`, `refresh`, `undo`, `redo`, `copy`, `paste` |
| **Navigation** | `back`, `forward`, `up`, `down`, `home`, `menu`, `close`, `expand`, `collapse` |
| **Status** | `check`, `error`, `warning`, `info`, `loading`, `success` |
| **Objects** | `file`, `folder`, `user`, `users`, `bot`, `chat`, `settings`, `search`, `star` |
| **Media** | `image`, `video`, `audio`, `attach`, `camera`, `mic` |
| **Auth** | `login`, `logout`, `lock`, `unlock`, `key` |
| **Other** | `cart`, `heart`, `notification`, `bell`, `calendar`, `clock`, `mail`, `phone`, `link`, `print`, `download`, `upload`, `filter`, `sort` |

---

## 15. Complete Example

```wireframe
// User Profile Form
wireframe clean
    %title: User Profile
    %version: 1.0
    
    Dock
        Header dock=top padding=16
            Horizontal justify=between
                Label "**User Profile**"
                IconButton $icon:close @:back
            /Horizontal
        /Header
        
        Content dock=fill padding=24
            Vertical gap=16
                Card padding=16
                    Vertical gap=12
                        Label "**Personal Information**"
                        
                        Horizontal gap=16
                            Vertical
                                Label "First Name"
                                TextInput "John" :txtFirst ?user.firstName
                            /Vertical
                            Vertical
                                Label "Last Name"
                                TextInput "Doe" :txtLast ?user.lastName
                            /Vertical
                        /Horizontal
                        
                        Label "Email"
                        TextInput "john@example.com" :txtEmail required ?user.email
                        
                        Checkbox "Subscribe to newsletter" :chkNews ?user.newsletter
                    /Vertical
                /Card
                
                Card padding=16
                    Vertical gap=12
                        Label "**Preferences**"
                        
                        Switch "Dark Mode" :swDark ?user.darkMode
                        Switch "Notifications" :swNotify ?user.notifications checked
                        
                        Label "Theme"
                        Dropdown :ddlTheme ?user.theme
                            Option "Light"
                            Option "Dark"
                            Option "System"
                        /Dropdown
                    /Vertical
                /Card
            /Vertical
        /Content
        
        Footer dock=bottom padding=16
            Horizontal justify=end gap=8
                Button "Cancel" @:back
                Button "Save" primary :btnSave
            /Horizontal
        /Footer
    /Dock
/wireframe
```

---

## 16. Keyword Quick Reference

### Document
```
wireframe <style>    /wireframe
%name: value
```

### Layouts
```
Grid        /Grid
Vertical    /Vertical
Horizontal  /Horizontal
Dock        /Dock
Canvas      /Canvas
Scroll      /Scroll
```

### Sections
```
Header      Footer      Sidebar     Content
Panel       Card        Toolbar     StatusBar
Modal       Drawer
```

### Controls
```
Button      IconButton  TextInput   NumberInput
DateInput   PasswordInput TextArea  Label
Heading     Link        Checkbox    Radio
Dropdown    Option      Separator   Spacer
Icon        Image       Avatar      Badge
Progress    Slider      Switch      Chip
Pagination  Toast       Skeleton
```

### Components
```
Tabs        Tab         Menu        MenuItem
Tree        TreeItem    Accordion   AccordionSection
Breadcrumb  Stepper     Step        Table
DataGrid    Column      Dialog      Alert
Hover       List        Hamburger   Expander
```

### Identifiers
```
:id         ?binding    @navigation    $icon
```

### Modifiers
```
primary     secondary   required    disabled
checked     selected    readonly    editable
active      expanded    removable   circle
indeterminate completed border
```

---

*Wireframe Language Specification v1.0 - December 2025*
