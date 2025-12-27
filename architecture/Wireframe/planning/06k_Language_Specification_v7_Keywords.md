# Wireframe Language Specification v7

Complete specification for the Wireframe wireframe language with keyword-based syntax.

---

## Overview

Wireframe is a text-based wireframe language that:
- Uses simple, readable **keyword-based syntax**
- Is easy to learn and AI-friendly
- Renders to HTML wireframe previews
- Supports common UI layouts and components
- Supports data binding, validation, and business rules
- Is version control friendly

### File Extension
`.wire`

### Design Philosophy
- **Keywords over symbols** - Self-documenting syntax
- **Consistent patterns** - Same structure everywhere
- **Easy to read** - Like reading a description
- **AI-friendly** - Natural language-like tokens

---

## Document Structure

```Wireframe
wireframe sketch
    %title: Page Title
    %version: 1.0
    %author: Designer
    
    // Content here
    
/wireframe
```

### Document Attributes

All document-level attributes use `%name: value` syntax:

```Wireframe
%title: My Wireframe
%version: 2.0
%author: Design Team
%date: 2025-01-15
%figma: https://figma.com/file/xxx
%jira: PROJ-123
```

### Wireframe Styles

Specify style after `wireframe`:

| Style | Description |
|-------|-------------|
| `sketch` | Hand-drawn, sketchy look |
| `blueprint` | Technical blueprint style |
| `clean` | Clean minimal wireframe |
| `realistic` | Closer to final UI appearance |

---

## Comments

```Wireframe
// Single line comment

/*
    Multi-line comment
    spanning multiple lines.
*/
```

---

## Block Termination

All blocks use `/keyword` closing syntax:

```Wireframe
Grid
    Vertical
        Button "Click me"
    /Vertical
/Grid
```

---

## Layouts

| Layout | Description |
|--------|-------------|
| `Grid` | Row/column grid |
| `Vertical` | Vertical stack |
| `Horizontal` | Horizontal stack |
| `Dock` | Dock layout |
| `Canvas` | Absolute positioning |
| `Scroll` | Scrollable container |

### Grid Layout

```Wireframe
Grid rows=3 cols=2 gap=16
    // Content with grid= positioning
/Grid
```

### Vertical / Horizontal Layout

```Wireframe
Vertical gap=8 align=center
    Button "Button 1"
    Button "Button 2"
/Vertical

Horizontal gap=16 justify=end
    Button "Cancel"
    Button "Save" primary
/Horizontal
```

**Properties:**
- `gap=n` - Gap between items
- `align=` - Cross-axis alignment (`start`, `center`, `end`, `stretch`)
- `justify=` - Main-axis alignment (`start`, `center`, `end`, `between`, `around`)
- `padding=n` - Internal padding

### Dock Layout

```Wireframe
Dock
    Header dock=top h=60
        Label "Title"
    /Header
    
    Sidebar dock=left w=200
        Button "Menu"
    /Sidebar
    
    Content dock=fill
        Label "Main content"
    /Content
/Dock
```

---

## Sections

| Section | Description |
|---------|-------------|
| `Header` | Top header/navbar |
| `Footer` | Bottom footer |
| `Sidebar` | Side navigation |
| `Content` | Main content area |
| `Panel` | Generic panel |
| `Card` | Card component |
| `Toolbar` | Toolbar area |
| `StatusBar` | Status bar |
| `Modal` | Modal dialog |
| `Drawer` | Slide-out drawer |

---

## Controls

### Button

```Wireframe
Button "Text"                           // Regular button
Button "Text" :btnId                    // With ID
Button "Text" primary                   // Primary style
Button "Text" secondary                 // Secondary style
Button "Text" primary :btnId            // Combined
Button "Text" @NextPage                 // With navigation
Button "Text" disabled                  // Disabled state

IconButton $save                        // Icon only
IconButton $save "Save"                 // Icon + text
IconButton $save "Save" :btnSave        // With ID
IconButton $save "Save" primary         // Primary style
```

### TextInput

```Wireframe
TextInput "placeholder" :id             // Text input
TextInput "placeholder" :id required    // Required
TextInput "placeholder" :id ?binding    // With binding
TextInput "placeholder" :id required ?user.name   // Combined
```

### NumberInput

```Wireframe
NumberInput "placeholder" :id           // Number input
NumberInput "placeholder" :id required  // Required
NumberInput "0" :txtAge min=0 max=150   // With validation
```

### DateInput

```Wireframe
DateInput "Select date" :id             // Date input
DateInput "Select date" :id required    // Required
```

### PasswordInput

```Wireframe
PasswordInput "Password" :id            // Password input
PasswordInput "Password" :id required   // Required
```

### TextArea

```Wireframe
TextArea "Enter description" :id        // Multiline text
TextArea "Bio" :id rows=4               // With row count
TextArea "Notes" :id ?order.notes       // With binding
```

### Label

```Wireframe
Label "Plain text"                      // Regular label
Label "**Bold text**"                   // Bold (markdown)
Label "*Italic text*"                   // Italic
Label "`Code text`"                     // Code style
Label "Link text" @Target               // Hyperlink
Label "Text" :lblId                     // With ID
```

### Checkbox

```Wireframe
Checkbox "Accept terms" :chkTerms                   // Unchecked
Checkbox "Accept terms" :chkTerms checked           // Checked
Checkbox "Accept terms" :chkTerms required          // Required
Checkbox "Subscribe" :chkNews ?user.newsletter      // With binding
```

### Radio

```Wireframe
Radio "Option A" :radA                  // Unselected
Radio "Option A" :radA selected         // Selected
Radio "Option A" :radA group=colors     // In named group
```

### Dropdown

```Wireframe
Dropdown :ddlCountry
    Option "Select..."
    Option "USA"
    Option "Canada"
    Option "UK"
/Dropdown

Dropdown :ddlCountry ?user.country      // With binding
    Option "Select..."
    Option "USA"
    Option "Canada"
/Dropdown

// Inline syntax
Dropdown "USA" "Canada" "UK" :ddlCountry
```

### Separator and Spacer

```Wireframe
Separator                               // Horizontal line
Spacer                                  // Flexible spacer
```

---

## Icons and Images

### Icon

```Wireframe
Icon $settings                          // Standalone icon
Icon $settings tooltip="Open settings"  // With tooltip
Icon $info :iconHelp                    // With ID
```

**Built-in Icons:**

| Category | Icons |
|----------|-------|
| Actions | `$add` `$edit` `$delete` `$save` `$cancel` `$refresh` `$undo` `$redo` `$copy` `$paste` |
| Navigation | `$back` `$forward` `$up` `$down` `$home` `$menu` `$close` `$expand` `$collapse` |
| Status | `$check` `$error` `$warning` `$info` `$loading` `$success` |
| Objects | `$file` `$folder` `$user` `$users` `$bot` `$chat` `$settings` `$search` `$star` |
| Media | `$image` `$video` `$audio` `$attach` `$camera` `$mic` |
| Auth | `$login` `$logout` `$lock` `$unlock` `$key` |

### Image

```Wireframe
Image "logo"                            // By name
Image "path/to/image.png"               // File path
Image "avatar" w=64 h=64                // With dimensions
Image "photo" shape=circle              // Circular
Image "placeholder"                     // Placeholder
```

---

## Tooltips

```Wireframe
Button "Save" tooltip="Save your changes"
Icon $info tooltip="More information"
TextInput "Username" :txtUser tooltip="Enter your username"
```

---

## Components

### Tabs

```Wireframe
Tabs :tabMain
    Tab "General"
        Label "General settings content"
    /Tab
    Tab "Advanced"
        Label "Advanced settings content"
    /Tab
/Tabs
```

### Expander

```Wireframe
Expander "Advanced Options" :expAdvanced
    Label "Option 1:"
    TextInput "Value" :txtOpt1
/Expander

Expander "Details" expanded=true
    Label "Initially expanded content"
/Expander
```

### Tree

```Wireframe
Tree :treeNav
    + Root Node
        + Child 1
            - Leaf 1a
            - Leaf 1b
        + Child 2
        - Leaf 3
/Tree
```

### List

```Wireframe
List :lstItems
    - Item 1
    - Item 2
    - Item 3
/List

List :lstNumbered ordered=true
    - First item
    - Second item
/List
```

### Menu

```Wireframe
Menu :mnuMain
    MenuItem "File"
        MenuItem "New" @New
        MenuItem "Open" @Open
        MenuItem "Save" @Save
        Separator
        MenuItem "Exit" @Exit
    /MenuItem
    MenuItem "Edit"
        MenuItem "Undo" icon=$undo
        MenuItem "Redo" icon=$redo
    /MenuItem
/Menu
```

### Hamburger

```Wireframe
Hamburger :btnMenu
    MenuItem "Home" icon=$home @Home
    MenuItem "Settings" icon=$settings @Settings
    Separator
    MenuItem "Logout" icon=$logout @Logout
/Hamburger
```

### Breadcrumb

```Wireframe
Breadcrumb
    BreadcrumbItem "Home" @Home
    BreadcrumbItem "Products" @Products
    BreadcrumbItem "Current Item"
/Breadcrumb
```

### Pagination

```Wireframe
Pagination pages=10 current=3 :pgNav
```

### Avatar

```Wireframe
Avatar "John Doe" :avUser
Avatar "JD" size=48
Avatar image="photo.jpg" size=64
```

### Badge

```Wireframe
Button "Notifications" badge="5"
Label "Messages" badge="New"
```

### Progress

```Wireframe
Progress value=75 :prgUpload
Progress indeterminate=true
```

### Slider

```Wireframe
Slider min=0 max=100 value=50 :sldVolume
```

### Switch

```Wireframe
Switch "Dark Mode" :swDark
Switch "Notifications" :swNotify checked=true
```

### Chip / Tag

```Wireframe
Chip "Tag 1"
Chip "Tag 2" removable=true
Chip "Active" selected=true
```

### Accordion

```Wireframe
Accordion :accFAQ
    AccordionSection "Question 1?"
        Label "Answer to question 1..."
    /AccordionSection
    AccordionSection "Question 2?"
        Label "Answer to question 2..."
    /AccordionSection
/Accordion
```

### Stepper

```Wireframe
Stepper :stpWizard
    Step "Account" completed=true
    Step "Details" current=true
    Step "Review"
    Step "Confirm"
/Stepper
```

### Dialog

```Wireframe
Dialog "Confirm Delete" :dlgConfirm
    Label "Are you sure you want to delete this item?"
    Horizontal justify=end gap=8
        Button "Cancel"
        Button "Delete" primary
    /Horizontal
/Dialog
```

### Toast

```Wireframe
Toast "Item saved successfully" type=success
Toast "Error occurred" type=error
Toast "Please wait..." type=info
```

### Alert

```Wireframe
Alert type=info
    Label "This is an informational message."
/Alert

Alert type=error title="Validation Failed"
    Label "Please fix the following errors:"
    List
        - "Username is required"
        - "Email format is invalid"
    /List
/Alert
```

### Skeleton

```Wireframe
Skeleton type=text lines=3
Skeleton type=card
Skeleton type=avatar
Skeleton type=image w=200 h=150
```

### Hover

```Wireframe
Hover :hvPreview
    Card
        Image "preview" w=200 h=150
        Label "**Item Preview**"
    /Card
/Hover

Button "View" hover=hvPreview
```

---

## Tables

### Table

```Wireframe
Table :tblUsers
    | Name | Email | Role |
    |------|-------|------|
    | John | john@example.com | Admin |
    | Jane | jane@example.com | User |
/Table
```

### Placeholder Table

```Wireframe
Table :tblData cols="Name,Email,Role" rows=5
```

### DataGrid

```Wireframe
DataGrid :dgOrders data=orderItems
    Column field=product header="Product"
    Column field=quantity header="Qty" editable=true align=right
    Column field=price header="Price" format=currency
    Column field=total header="Total" format=currency readonly=true
    Column header="Actions"
        IconButton $edit
        IconButton $delete
    /Column
/DataGrid
```

---

## Identifiers and Binding

### ID Assignment

Use `:` prefix for IDs:

```Wireframe
Button "Save" :btnSave
TextInput "Name" :txtName
Panel :pnlDetails
```

### Data Binding

Use `?` prefix for bindings:

```Wireframe
TextInput "First name" :txtFirst ?customer.firstName
TextInput "Last name" :txtLast ?customer.lastName
NumberInput "Age" :txtAge ?customer.age
Dropdown :ddlStatus ?customer.status
    Option "Active"
    Option "Inactive"
/Dropdown
```

---

## Navigation

```Wireframe
Button "Login" @Dashboard              // Navigate to Dashboard.wire
Button "Cancel" @:back                 // Go back
Button "Help" @:modal:HelpDialog       // Open as modal
Label "Terms of Service" @Terms        // Hyperlink
```

**Special Targets:**
- `@:back` - Navigate back
- `@:close` - Close current modal/drawer
- `@:modal:File` - Open file as modal
- `@:drawer:File` - Open file as drawer

---

## Repeat

```Wireframe
Repeat 5
    Card
        Label "Card content"
    /Card
/Repeat

// Or inline
Repeat 3 Card
```

---

## Positioning and Sizing

### Grid Positioning

```Wireframe
grid=row,col                    // Position
grid=row,col,rowspan,colspan    // Position + span
```

### Size Attributes

```Wireframe
w=200                           // Width: 200px
h=100                           // Height: 100px
w=50%                           // Width: 50%
h=auto                          // Height: auto
w=*                             // Width: flex/fill
```

---

## Validation

### Inline Validation

```Wireframe
TextInput "Username" :txtUser required min=3 max=20 pattern=alphanumeric
TextInput "Email" :txtEmail required pattern=email
PasswordInput "Password" :txtPass required min=8
NumberInput "Age" :txtAge min=0 max=150
```

### Validation Patterns

| Pattern | Validates |
|---------|-----------|
| `pattern=email` | Email format |
| `pattern=url` | URL format |
| `pattern=phone` | Phone number |
| `pattern=alpha` | Letters only |
| `pattern=numeric` | Numbers only |
| `pattern=alphanumeric` | Letters & numbers |

---

## Data Sections

### Data Sources

```Wireframe
data
    | Source | Type | Fields |
    |--------|------|--------|
    | customer | object | firstName, lastName, email, age |
    | orderItems | collection | product, quantity, price, total |
    | countries | list | id, name, code |
/data
```

### Validations

```Wireframe
validations
    | Field | Rule | Message |
    |-------|------|---------|
    | txtUsername | required | "Username is required" |
    | txtUsername | min(3) | "Username must be at least 3 characters" |
    | txtEmail | pattern(email) | "Please enter a valid email address" |
/validations
```

### Calculations

```Wireframe
calculations
    | Field | Formula | Description |
    |-------|---------|-------------|
    | txtSubtotal | sum(orderItems.total) | Sum of line totals |
    | txtTax | txtSubtotal * 0.08 | 8% tax |
    | txtGrandTotal | txtSubtotal + txtTax | Grand total |
/calculations
```

### Business Rules

```Wireframe
rules
    | ID | Condition | Action | Controls | Message |
    |----|-----------|--------|----------|---------|
    | R001 | radBusiness checked | show | pnlBusiness | |
    | R002 | chkTerms !checked | disable | btnSubmit | "Accept terms required" |
    | R003 | form valid | enable | btnSubmit | |
/rules
```

### Fields Documentation

```Wireframe
fields
    | ID | Type | Required | Binding | Description |
    |----|------|----------|---------|-------------|
    | txtUsername | text | yes | user.name | User login name |
    | txtEmail | text | yes | user.email | Contact email |
/fields
```

---

## Component Definitions

```Wireframe
component FormField
    params: label, id, type="text", required=false, binding=""
    
    Vertical gap=4
        Label "${label}:"
        
        if type == "text" && required
            TextInput "" :${id} required ?${binding}
        else if type == "text"
            TextInput "" :${id} ?${binding}
        else if type == "number"
            NumberInput "" :${id} ?${binding}
        else if type == "password"
            PasswordInput "" :${id} ?${binding}
        else if type == "date"
            DateInput "" :${id} ?${binding}
        /if
    /Vertical
/component

// Usage
FormField label="Username" id="txtUser" required=true binding="user.name"
FormField label="Email" id="txtEmail" required=true binding="user.email"
FormField label="Age" id="txtAge" type="number" binding="user.age"
```

---

## Responsive Breakpoints

```Wireframe
%desktop
Grid cols=3
    // 3 column layout
/Grid

%tablet
Grid cols=2
    // 2 column layout
/Grid

%mobile
Vertical
    // Stacked layout
/Vertical
```

---

## Complete Keyword Reference

```
DOCUMENT
    wireframe style        Document root (sketch/blueprint/clean/realistic)
    %name: value        Document attribute
    /wireframe             Close document

COMMENTS
    //                  Single line comment
    /* */               Multi-line comment

LAYOUTS
    Grid                Grid layout (rows=, cols=, gap=)
    Vertical            Vertical stack
    Horizontal          Horizontal stack
    Dock                Dock layout
    Canvas              Absolute positioning
    Scroll              Scrollable container

SECTIONS
    Header              Header section
    Footer              Footer section
    Sidebar             Side navigation
    Content             Main content
    Panel               Generic panel
    Card                Card component
    Toolbar             Toolbar
    StatusBar           Status bar
    Modal               Modal dialog
    Drawer              Slide-out drawer
    Window              Desktop window container

CONTROLS
    Button "text"       Button
    Button "text" primary   Primary button
    IconButton $icon    Icon button
    IconButton $icon "text" Icon + text button
    TextInput "placeholder" Text input
    NumberInput "placeholder" Number input
    DateInput "placeholder" Date input
    PasswordInput "placeholder" Password input
    TextArea "placeholder"  Multiline text
    Label "text"        Label/text
    Checkbox "label"    Checkbox
    Radio "label"       Radio button
    Dropdown            Dropdown select
    Separator           Horizontal line
    Spacer              Flexible spacer

COMPONENTS
    Tabs / Tab          Tab container
    Expander            Collapsible section
    Tree                Tree view
    List                List items
    Menu / MenuItem     Menu with items
    Hamburger           Hamburger menu
    Breadcrumb / BreadcrumbItem  Navigation
    Pagination          Page navigation
    Avatar              User avatar
    Progress            Progress bar
    Slider              Range slider
    Switch              Toggle switch
    Chip                Tag/chip
    Accordion / AccordionSection  Collapsible sections
    Stepper / Step      Multi-step indicator
    Dialog              Modal dialog
    Toast               Notification toast
    Alert               Alert/notification box
    Skeleton            Loading placeholder
    Hover               Hover content
    Table               Static table
    DataGrid / Column   Data grid

ICONS & IMAGES
    Icon $name          Icon
    Image "name"        Image

IDENTIFIERS
    :id                 ID assignment
    ?binding            Data binding

MODIFIERS
    primary             Primary style
    secondary           Secondary style
    required            Required field
    disabled            Disabled state
    checked             Checked state
    selected            Selected state

NAVIGATION
    @target             Navigate to target
    @:back              Go back
    @:modal:File        Open as modal
    @:drawer:File       Open as drawer

ATTRIBUTES
    tooltip="text"      Tooltip text
    hover=id            Hover content reference
    w= h=               Size
    gap=                Spacing
    min= max=           Validation
    pattern=            Validation pattern

SECTIONS
    data                Data sources
    validations         Validation messages
    calculations        Calculated fields
    rules               Business rules
    fields              Field documentation
    component           Component definition
```

---

## Complete Example

```Wireframe
wireframe sketch
    %title: Order Form
    %version: 2.0
    %author: Design Team
    
    /*
        Order Form Wireframe
        - Customer selection
        - Order items with DataGrid
        - Calculations and validation
    */
    
    Dock
        Header dock=top h=60
            Horizontal padding=16
                Icon $cart
                Label "**New Order**"
                Spacer
                IconButton $close @:back tooltip="Close form"
            /Horizontal
        /Header
        
        Scroll dock=fill
            Vertical padding=24 gap=24
                
                // Customer Selection
                Card
                    Label "**Customer Information**"
                    
                    Grid cols=2 gap=16
                        Vertical
                            Label "Customer:"
                            Dropdown :ddlCustomer ?order.customerId
                                Option "Select customer..."
                                Option "Acme Corp"
                                Option "Globex Inc"
                            /Dropdown
                        /Vertical
                        Vertical
                            Label "Order Date:"
                            DateInput "Order date" :txtOrderDate required ?order.orderDate
                        /Vertical
                    /Grid
                /Card
                
                // Order Items
                Card
                    Horizontal justify=between
                        Label "**Order Items**"
                        IconButton $add "Add Item" primary
                    /Horizontal
                    
                    DataGrid :dgItems data=orderItems
                        Column field=product header="Product" w=250
                        Column field=quantity header="Qty" w=80 editable=true align=right
                        Column field=unitPrice header="Unit Price" format=currency align=right
                        Column field=discount header="Discount %" w=100 editable=true align=right
                        Column field=lineTotal header="Total" format=currency align=right readonly=true
                        Column header="" w=80
                            IconButton $edit
                            IconButton $delete
                        /Column
                    /DataGrid
                /Card
                
                // Totals
                Card
                    Grid cols=2 gap=16
                        Vertical
                            Label "Notes:"
                            TextArea "Order notes" :txtNotes ?order.notes rows=3
                        /Vertical
                        
                        Vertical align=end
                            Horizontal justify=between w=250
                                Label "Subtotal:"
                                Label :txtSubtotal ?order.subtotal format=currency
                            /Horizontal
                            Horizontal justify=between w=250
                                Label "Tax (8%):"
                                Label :txtTax ?order.tax format=currency
                            /Horizontal
                            Separator
                            Horizontal justify=between w=250
                                Label "**Grand Total:**"
                                Label "**:txtGrandTotal**" ?order.grandTotal format=currency
                            /Horizontal
                        /Vertical
                    /Grid
                /Card
                
                // Validation Alert
                Alert type=error :alertErrors
                    Label "Please fix the following errors:"
                    List
                        - "Customer is required"
                        - "At least one item is required"
                    /List
                /Alert
                
            /Vertical
        /Scroll
        
        Footer dock=bottom h=60
            Horizontal justify=end padding=16 gap=8
                Button "Cancel" @:back
                Button "Save Draft"
                Button "Submit Order" primary :btnSubmit @OrderConfirmation tooltip="Submit this order"
            /Horizontal
        /Footer
    /Dock
/wireframe

data
    | Source | Type | Fields |
    |--------|------|--------|
    | order | object | customerId, orderDate, notes, subtotal, tax, grandTotal |
    | orderItems | collection | product, quantity, unitPrice, discount, lineTotal |
    | customers | list | id, name, email |
/data

calculations
    | Field | Formula | Description |
    |-------|---------|-------------|
    | lineTotal | quantity * unitPrice * (1 - discount/100) | Line item total |
    | txtSubtotal | sum(orderItems.lineTotal) | Sum of line totals |
    | txtTax | txtSubtotal * 0.08 | 8% tax |
    | txtGrandTotal | txtSubtotal + txtTax | Grand total |
/calculations

validations
    | Field | Rule | Message |
    |-------|------|---------|
    | ddlCustomer | required | "Please select a customer" |
    | txtOrderDate | required | "Order date is required" |
    | orderItems | min(1) | "At least one item is required" |
/validations

rules
    | ID | Condition | Action | Controls | Message |
    |----|-----------|--------|----------|---------|
    | R001 | ddlCustomer empty | disable | btnSubmit | "Select a customer" |
    | R002 | orderItems count == 0 | disable | btnSubmit | "Add items to order" |
    | R003 | form valid | enable | btnSubmit | |
    | R004 | form !valid | show | alertErrors | |
    | R005 | form valid | hide | alertErrors | |
/rules

fields
    | ID | Type | Required | Binding | Description |
    |----|------|----------|---------|-------------|
    | ddlCustomer | select | yes | order.customerId | Customer selection |
    | txtOrderDate | date | yes | order.orderDate | Order date |
    | txtNotes | text | no | order.notes | Order notes |
    | txtSubtotal | currency | readonly | order.subtotal | Order subtotal |
    | txtTax | currency | readonly | order.tax | Tax amount |
    | txtGrandTotal | currency | readonly | order.grandTotal | Grand total |
/fields
```

---

## Comparison: v6 (Symbols) vs v7 (Keywords)

| Feature | v6 Symbol Syntax | v7 Keyword Syntax |
|---------|------------------|-------------------|
| Button | `[Submit]` | `Button "Submit"` |
| Primary Button | `[1 Submit]` | `Button "Submit" primary` |
| Icon Button | `[$save Save]` | `IconButton $save "Save"` |
| Text Input | `<placeholder :id>` | `TextInput "placeholder" :id` |
| Number Input | `<1 placeholder :id>` | `NumberInput "placeholder" :id` |
| Date Input | `<@ placeholder :id>` | `DateInput "placeholder" :id` |
| Password Input | `<* placeholder :id>` | `PasswordInput "placeholder" :id` |
| Required | `<! placeholder :id>` | `TextInput "placeholder" :id required` |
| Label | `"text"` | `Label "text"` |
| Checkbox | `[x] Label :id` | `Checkbox "Label" :id checked` |
| Radio | `(o) Label :id` | `Radio "Label" :id selected` |
| Dropdown | `{A \| B \| C :id}` | `Dropdown :id` with `Option` children |
| Separator | `---` | `Separator` |
| Spacer | `...` | `Spacer` |
| Icon | `$settings` | `Icon $settings` |
| Image | `img:logo` | `Image "logo"` |
| Repeat | `x5[Card]` | `Repeat 5 Card` |

---

*Wireframe Language Specification v7 - 2025*
