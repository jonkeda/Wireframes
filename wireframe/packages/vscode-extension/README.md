# Wireframe - UI Mockup DSL for VS Code

![Version](https://img.shields.io/badge/version-0.0.6-blue)
![VS Code](https://img.shields.io/badge/VS%20Code-1.107%2B-brightgreen)
![License](https://img.shields.io/badge/license-MIT-green)

Create beautiful UI wireframes and mockups using a simple, text-based domain-specific language (DSL). Perfect for rapid prototyping, documentation, and communicating UI designs.

![Wireframe Preview](images/wireframe.png)

## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Syntax Highlighting** | Full TextMate grammar with colorized keywords, modifiers, and attributes |
| 👁️ **Live Preview** | Real-time side-by-side preview that updates as you type |
| 🔍 **Zoom Controls** | Zoom in/out, reset, fit-to-window with keyboard shortcuts |
| ⚠️ **Error Diagnostics** | Inline error markers with descriptive messages |
| 💾 **Export to SVG** | Export your wireframes to scalable vector graphics |
| 🎨 **4 Themes** | Clean, Sketch, Blueprint, and Realistic styles |
| 🧩 **50+ Components** | Buttons, inputs, tables, navigation, layouts, and more |
| ✏️ **Code Snippets** | Quick insertion of common patterns |
| 💡 **IntelliSense** | Auto-completion for components, modifiers, and attributes |
| 📖 **Hover Documentation** | Quick docs when hovering over keywords |

---

## 🚀 Quick Start

### 1. Create a new file

Create a new file with the `.wire` extension:

```
example.wire
```

### 2. Write your wireframe

```wireframe
wireframe clean
    %title: My First Wireframe
    
    Card w=300
        Vertical gap=16 padding=24
            Label "**Welcome**"
            TextInput "Enter your name" :txtName required
            Button "Get Started" primary
        /Vertical
    /Card
/wireframe
```

### 3. Preview your wireframe

Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac) to open the live preview.

---

## 🎨 Themes

Choose from 4 built-in themes:

| Theme | Style | Use Case |
|-------|-------|----------|
| `clean` | Modern, minimal | Production mockups |
| `sketch` | Hand-drawn | Early concepts, brainstorming |
| `blueprint` | Technical grid | Specifications, engineering |
| `realistic` | Polished UI | Client presentations |

```wireframe
wireframe sketch    // Hand-drawn style
wireframe clean     // Minimal modern style
wireframe blueprint // Technical blueprint
wireframe realistic // Production-like
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Command |
|----------|---------|
| `Ctrl+Shift+V` | Open Preview |
| `Ctrl++` | Zoom In |
| `Ctrl+-` | Zoom Out |
| `Ctrl+0` | Reset Zoom |

> On Mac, use `Cmd` instead of `Ctrl`

---

## 🧩 Components

### Basic Controls

```wireframe
Button "Click Me" primary
Button "Cancel" secondary
TextInput "Email" :txtEmail required
PasswordInput "Password" :txtPass
TextArea "Description" rows=4
Checkbox "Accept terms" checked
Radio "Option A" selected
Switch "Enable notifications"
Dropdown "Select..."
    Option "Option 1"
    Option "Option 2"
/Dropdown
```

### Layout Components

```wireframe
// Vertical stack
Vertical gap=16
    Button "First"
    Button "Second"
/Vertical

// Horizontal row
Horizontal gap=8
    Button "Left"
    Button "Right"
/Horizontal

// Grid with positioning
Grid cols=3 rows=2 gap=8
    Button "Span 2" grid=0,0,1,2
    Button "Normal" grid=0,2
/Grid

// Canvas with absolute positioning
Canvas w=400 h=300
    Button "At 50,100" canvas=50,100
/Canvas
```

### Section Components

```wireframe
Card
    // Content with rounded corners and shadow
/Card

Header dock=top h=60
    // Top header content
/Header

Sidebar dock=left w=200
    // Side navigation
/Sidebar

Modal
    Dialog "Confirm"
        // Dialog content
    /Dialog
/Modal
```

### Data Components

```wireframe
// Table with markdown syntax
Table
    | Name | Email | Role |
    |------|-------|------|
    | John | john@example.com | Admin |
/Table

// DataGrid with typed columns
DataGrid rows=5 selected
    ColumnText "Name"
    ColumnDate "Created"
    ColumnNumber "Count"
    ColumnCheckbox "Active"
    ColumnButton "Actions"
/DataGrid

// Custom table with Row/Cell
Row selected
    Cell "Header 1" align=left
    Cell "Header 2" align=center
/Row
```

### Visual Components

```wireframe
Avatar "JD" size=lg circle    // xs, sm, md, lg, xl
Badge "New" variant=success   // info, success, warning, error
Progress value=75
Icon $settings
Image "photo.jpg" w=200 h=150
```

### Navigation Components

```wireframe
Tabs
    Tab "General" active
        // Tab content
    /Tab
    Tab "Settings"
        // Tab content
    /Tab
/Tabs

Menu
    MenuItem "Home" $home
    MenuItem "Settings" $settings
/Menu

Breadcrumb
    BreadcrumbItem "Home" @home
    BreadcrumbItem "Products"
/Breadcrumb
```

---

## 🔧 Configuration

Access settings via `File > Preferences > Settings` and search for "Wireframe".

| Setting | Default | Description |
|---------|---------|-------------|
| `wireframe.defaultTheme` | `clean` | Default theme for new previews |
| `wireframe.previewWidth` | `800` | Default preview width in pixels |
| `wireframe.previewHeight` | `600` | Default preview height in pixels |
| `wireframe.autoPreview` | `false` | Auto-open preview when opening .wire files |
| `wireframe.validateOnSave` | `true` | Validate documents when saving |

---

## 📋 Commands

Access via Command Palette (`Ctrl+Shift+P`):

| Command | Description |
|---------|-------------|
| `Wireframe: Open Preview` | Open the live preview panel |
| `Wireframe: Export to SVG` | Export wireframe to SVG file |
| `Wireframe: Export to PNG` | Export wireframe to PNG file |
| `Wireframe: Validate Document` | Check for syntax errors |
| `Wireframe: Change Theme` | Switch between themes |
| `Wireframe: Insert Snippet` | Insert a code snippet |
| `Wireframe: Zoom In` | Increase preview zoom |
| `Wireframe: Zoom Out` | Decrease preview zoom |
| `Wireframe: Reset Zoom` | Reset zoom to 100% |

---

## 📝 Syntax Reference

### Document Structure

```wireframe
wireframe <theme>           // Required: start document
    %title: Document Title  // Optional: metadata
    %author: Your Name
    %version: 1.0
    
    // Your components here
    
/wireframe                  // Required: end document
```

### Identifiers & References

| Prefix | Purpose | Example |
|--------|---------|---------|
| `:` | Element ID | `Button "Save" :btnSave` |
| `?` | Data binding | `TextInput ?user.name` |
| `@` | Navigation | `Button "Login" @LoginPage` |
| `$` | Icon | `IconButton $settings` |
| `%` | Directive | `%title: My Form` |

### Common Modifiers

| Modifier | Applies To | Effect |
|----------|------------|--------|
| `primary` | Button | Primary button style |
| `secondary` | Button | Secondary button style |
| `required` | Inputs | Shows required indicator |
| `disabled` | All controls | Grayed out, non-interactive |
| `checked` | Checkbox, Switch | Checked state |
| `selected` | Radio, Option, Row | Selected state |
| `expanded` | Accordion, TreeItem | Expanded state |
| `active` | Tab, Step | Active/current state |
| `circle` | Avatar | Circular shape |

### Common Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| `w`, `width` | number | Element width |
| `h`, `height` | number | Element height |
| `gap` | number | Spacing between children |
| `padding` | number | Internal padding |
| `rows` | number | Number of rows (Grid, DataGrid) |
| `cols` | number | Number of columns (Grid) |
| `align` | string | Cross-axis alignment |
| `justify` | string | Main-axis alignment |
| `dock` | string | Dock position (top/bottom/left/right/fill) |
| `grid` | string | Grid positioning (row,col,rowSpan,colSpan) |
| `canvas` | string | Canvas positioning (x,y) |
| `size` | string | Size variant (xs/sm/md/lg/xl for Avatar) |
| `variant` | string | Color variant (info/success/warning/error for Badge) |

---

## 🎯 Code Snippets

Type these prefixes and press `Tab` to insert snippets:

| Prefix | Inserts |
|--------|---------|
| `wireframe` | Complete document template |
| `vertical` | Vertical layout block |
| `horizontal` | Horizontal layout block |
| `card` | Card container |
| `form` | Basic form layout |
| `loginform` | Login form template |
| `tabs` | Tab navigation |
| `table` | Data table |
| `buttons` | Button group |

---

## 📁 File Types

| Extension | Description |
|-----------|-------------|
| `.wire` | Wireframe document (recommended) |
| `.wireframe` | Wireframe document (alternative) |

---

## 🔗 Related

- [Wireframe Core](https://www.npmjs.com/package/@jonkeda/wireframe-core) - Parser and renderer library
- [Wireframe CLI](https://www.npmjs.com/package/@jonkeda/wireframe-cli) - Command-line tool
- [GitHub Repository](https://github.com/jonkeda/Wireframes) - Source code and issues

---

## 📄 License

MIT © jonkeda

---

## 🐛 Issues & Feedback

Found a bug or have a feature request? 

[Open an issue on GitHub](https://github.com/jonkeda/Wireframes/issues)
