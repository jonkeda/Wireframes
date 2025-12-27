# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-27

### 🎉 Initial Release

First stable release of Wireframe, a domain-specific language for UI wireframes.

### Added

#### Core Library (`@jonkeda/wireframe-core`)

**Language Features**
- Complete Wireframe DSL with controls, layouts, sections, and modifiers
- 38 built-in control types covering all common UI patterns
- 6 layout types: Vertical, Horizontal, Grid, Dock, Canvas, Scroll
- Section support: Header, Footer, Sidebar, Content, Card, Modal
- Modifier system with `@` prefix for control customization
- Comment support (single-line `//` and multi-line `/* */`)
- Document directives (`@style`, `@title`, `@width`, `@height`)

**Themes**
- Clean theme - Modern, minimal design (default)
- Sketch theme - Hand-drawn, informal style
- Blueprint theme - Technical, grid-based design
- Realistic theme - Polished, production-like appearance
- Full theme API with customization support

**Performance**
- LRU caching for parsed documents and rendered SVGs
- Benchmarking utilities for performance measurement
- Debounce and throttle helper functions
- Performance collector for timing analysis

**Accessibility**
- WCAG 2.1 compliance checking
- Color contrast ratio calculation
- Theme accessibility auditing
- ARIA role and attribute utilities
- Accessible SVG output with title, description, and roles

**API**
- `compile()` - Compile source to SVG
- `parse()` - Parse source to AST
- `render()` - Render AST to SVG
- `validate()` - Validate source without rendering
- `getTheme()` - Get theme by name
- `createCompiler()` - Create compiler instance

#### VSCode Extension (`@jonkeda/wireframe-vscode`)

- Syntax highlighting with TextMate grammar
- 17 code snippets for common patterns
- Real-time diagnostics and error highlighting
- Auto-completion for controls, layouts, and modifiers
- Hover documentation for keywords
- Live preview panel with hot reload
- Export to SVG and PNG
- Theme switching command
- Keyboard shortcuts (`Ctrl+Shift+V` for preview)

#### CLI Tool (`@jonkeda/wireframe-cli`)

- Compile wireframe files to SVG
- Watch mode for automatic recompilation
- Config file support (JSON)
- Multiple file batch processing
- Output directory configuration
- Theme selection
- Quiet mode for scripting
- Validation without output

#### Mermaid Plugin (`@jonkeda/wireframe-mermaid`)

- Mermaid.js integration
- Multiple diagram prefixes (`wireframe`, `wire`, `wireframe`)
- Configuration API
- Standalone render function
- Error SVG generation for invalid content

### Controls Reference

| Category | Controls |
|----------|----------|
| Basic | Button, IconButton, Label, Heading, Link, Separator, Spacer |
| Input | TextInput, NumberInput, DateInput, PasswordInput, TextArea |
| Selection | Checkbox, Radio, Dropdown, Switch, Slider |
| Display | Icon, Image, Avatar, Badge, Progress, Chip |
| Navigation | Tabs, Tab, Menu, MenuItem, Breadcrumb, Pagination |
| Data | Table, DataGrid, Tree, TreeItem |
| Containers | Accordion, AccordionSection |
| Feedback | Toast, Skeleton, Stepper |

### Test Coverage

- 265 tests passing
- 73% overall coverage
- 88% core module coverage
- Comprehensive tests for lexer, parser, renderer, cache, and accessibility

### Documentation

- Getting Started Guide
- API Reference
- Example Gallery
- Language Specification
- Architecture Documentation

---

## Future Releases

### Planned for 1.1.0
- Custom component definitions
- Theme editor/builder
- Additional icon packs
- Import/export formats

### Planned for 1.2.0
- Real-time collaboration
- Figma plugin
- Adobe XD plugin
- Sketch plugin

### Planned for 2.0.0
- Animation support
- Interactive prototypes
- Design tokens
- Component marketplace
