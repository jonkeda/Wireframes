# Changelog

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active

---

## Version 1.0.0 (December 2025)

### Highlights

Initial stable release of the Wireframe DSL with complete keyword-based syntax, SVG rendering, and tooling ecosystem.

### Added

#### Core Package (`@jonkeda/wireframe-core`)

- **Lexer:** Full tokenizer with support for:
  - Keywords (components, layouts, sections, controls)
  - String literals with escape sequences
  - Attributes (`key=value`)
  - Modifiers (primary, secondary, disabled, etc.)
  - Bindings (`?name`)
  - Navigation (`@target`)
  - Icons (`$icon:name`)
  - Comments (`//` and `/* */`)
  - Indentation tracking (INDENT/DEDENT)

- **Parser:** Complete parser with:
  - Keyword-based syntax
  - Indentation-required structure
  - 15 modifiers support
  - Error collection (non-throwing)
  - AST generation

- **AST:** Full node types:
  - `DocumentNode` with metadata
  - `LayoutNode` (Vertical, Horizontal, Grid, Stack, Dock, Wrap)
  - `SectionNode` (Header, Content, Footer, Sidebar, Panel, Card, Dialog, Group, Block)
  - `ControlNode` (50+ control types)
  - `ComponentNode` for custom components

- **Renderer:** SVG rendering with:
  - Theme support
  - Component rendering
  - Layout calculations
  - Icon rendering

#### CLI Package (`@jonkeda/wireframe-cli`)

- `render` command for file-to-SVG conversion
- `validate` command for syntax checking
- `watch` mode for development
- Batch processing support
- Configuration via `wireframe.config.json`

#### Mermaid Plugin (`@jonkeda/wireframe-mermaid-plugin`)

- Integration with Mermaid diagram system
- Supports embedding in Markdown
- Works with Mermaid Live Editor
- Compatible with documentation tools

#### Themes Package (`@jonkeda/wireframe-themes`)

- `clean` theme (modern flat design)
- `sketch` theme (hand-drawn look)
- `blueprint` theme (technical drawing)
- `minimal` theme (clean minimal)
- Custom theme API

#### VS Code Extension (`wireframe-vscode`)

- Syntax highlighting
- Real-time preview panel
- Auto-completion
- Hover documentation
- Error diagnostics
- Quick fixes
- Code folding
- Bracket matching

### Controls Added (50+)

**Input Controls:**
- Button, IconButton, Link
- TextInput, Textarea, NumberInput
- Checkbox, RadioButton, RadioGroup
- Switch, Slider, Rating
- Dropdown, Combobox
- DatePicker, TimePicker, DateTimePicker
- ColorPicker, FilePicker

**Display Controls:**
- Label, Heading, Paragraph
- Badge, Chip, Tag
- Icon, Image, Avatar
- ProgressBar, Spinner, Skeleton
- Alert, Tooltip, Popover

**Navigation Controls:**
- Menu, MenuItem
- Tab, TabGroup
- Breadcrumb
- Stepper, Step
- Pagination
- TreeView, TreeItem
- Accordion, AccordionItem

**Data Controls:**
- Table, Column, Row, Cell
- List, ListItem
- DataGrid

**Feedback Controls:**
- Dialog, Modal, Drawer
- Notification, Toast

### Layouts Added

- **Vertical:** Vertical stack with gap
- **Horizontal:** Horizontal row with gap
- **Grid:** CSS grid layout
- **Stack:** Z-axis stacking
- **Dock:** Edge docking layout
- **Wrap:** Flex wrap layout

### Sections Added

- **Header:** Top section
- **Content:** Main content area
- **Footer:** Bottom section
- **Sidebar:** Side navigation
- **Panel:** Generic panel
- **Card:** Bordered card
- **Dialog:** Modal dialog
- **Group:** Labeled group
- **Block:** Generic container

### Modifiers Added (15)

- `primary` - Primary styling
- `secondary` - Secondary styling
- `required` - Required field
- `disabled` - Disabled state
- `checked` - Checked state
- `selected` - Selected state
- `readonly` - Read-only mode
- `editable` - Editable mode
- `active` - Active state
- `expanded` - Expanded state
- `removable` - Can be removed
- `circle` - Circular shape
- `indeterminate` - Indeterminate checkbox
- `completed` - Completed step
- `border` - Show border

### Built-in Icons (50)

home, search, settings, user, users, mail, phone, calendar, clock, bell, heart, star, flag, trash, edit, plus, minus, check, close, chevron-up, chevron-down, chevron-left, chevron-right, arrow-up, arrow-down, arrow-left, arrow-right, menu, more, filter, sort, download, upload, share, link, copy, paste, cut, undo, redo, refresh, save, file, folder, image, video, music, code, terminal, cloud

---

## Pre-release Versions

### 0.9.0 (Beta)
- Feature complete
- Documentation updates
- Bug fixes

### 0.8.0 (Alpha)
- Parser rewrite
- Theme system
- VS Code extension

### 0.1.0 - 0.7.0
- Initial prototypes
- Syntax exploration
- Core architecture

---

## Upgrade Guide

See [14_Migration_Guide](./14_Migration_Guide.md) for detailed migration instructions.

---

## Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Full syntax reference |
| [06_Component_Library](./06_Component_Library.md) | All components |
| [14_Migration_Guide](./14_Migration_Guide.md) | Migration help |

---

*Changelog v1.0 - December 2025*
