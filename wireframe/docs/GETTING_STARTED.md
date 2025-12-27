# Wireframe Getting Started Guide

Welcome to **Wireframe**, a domain-specific language for creating UI wireframes as text. This guide will help you get started creating beautiful wireframe diagrams.

## Installation

### Using npm/pnpm

```bash
# Install the core library
npm install @aspect-ui/wireframe-core

# Or with pnpm
pnpm add @aspect-ui/wireframe-core
```

### VSCode Extension

Install the **Wireframe Preview** extension from the VSCode marketplace for syntax highlighting, live preview, and code completion.

## Quick Start

### Basic Wireframe

Create a file with the `.wire` extension:

```wireframe
uiwire clean
    %title: My First Wireframe
    
    // My first wireframe
    Header
        Label "My Application"
    /Header
    
    Card
        Label "Welcome!"
        Button "Get Started" primary
    /Card
    
    Footer
        Label "© 2025 My Company"
    /Footer
/uiwire
```

### Compile to SVG

```typescript
import { compile } from '@aspect-ui/wireframe-core';

const source = `
uiwire clean
    Header
        Label "My App"
    /Header
    Button "Click Me"
/uiwire
`;

const { svg, errors } = compile(source, {
  width: 800,
  height: 600,
  theme: 'clean'
});

if (errors.length === 0) {
  console.log(svg); // SVG string output
}
```

## Language Basics

### Controls

Controls are UI elements with text in quotes:

```wireframe
uiwire clean
    Button "Click Me"
    TextInput "Enter name..." :txtName
    Checkbox "Remember me" :chkRemember checked
    Dropdown :ddlOption
        Option "Option 1"
        Option "Option 2"
    /Dropdown
/uiwire
```

### Layouts

Organize controls with layout containers:

```wireframe
uiwire clean
    Vertical gap=16
        Label "**Title**"
        Horizontal gap=8
            Button "Cancel"
            Button "Submit" primary
        /Horizontal
    /Vertical
/uiwire
```

### Sections

Create semantic regions:

```wireframe
uiwire clean
    Header
        Label "**My App**"
    /Header
    
    Content
        Card
            Label "Main content here"
        /Card
    /Content
    
    Footer
        Label "Footer text"
    /Footer
/uiwire
```

### Modifiers

Customize controls with keyword modifiers:

```wireframe
uiwire clean
    Button "Primary" primary
    Button "Disabled" disabled
    TextInput "Email" :txtEmail required
    Label "Error message" 
/uiwire
```

## Themes

Wireframe supports four built-in themes:

| Theme | Description |
|-------|-------------|
| `clean` | Modern, minimal design (default) |
| `sketch` | Hand-drawn, informal style |
| `blueprint` | Technical, grid-based design |
| `realistic` | Polished, production-like appearance |

Apply a theme:

```typescript
const { svg } = compile(source, { theme: 'sketch' });
```

Or in the document:

```wireframe
uiwire sketch
    %title: Sketchy Design
    
    Header
        Label "Sketchy Design"
    /Header
/uiwire
```

## Available Controls

### Basic
- `Button` - Clickable button
- `IconButton` - Button with icon (`IconButton $save "Save"`)
- `Label` - Text label (supports `**bold**`, `*italic*`)
- `Link` - Hyperlink (`Label "Click here" @Target`)
- `Separator` - Horizontal line
- `Spacer` - Flexible spacer

### Input
- `TextInput` - Single-line text
- `PasswordInput` - Password field
- `NumberInput` - Numeric input
- `DateInput` - Date picker
- `TextArea` - Multi-line text

### Selection
- `Checkbox` - Checkbox control
- `Radio` - Radio button
- `Dropdown` / `Option` - Select dropdown
- `Switch` - Toggle switch
- `Slider` - Range slider

### Display
- `Icon` - Icon display (`Icon $settings`)
- `Image` - Image placeholder
- `Avatar` - User avatar
- `Badge` - Status badge
- `Progress` - Progress bar
- `Chip` - Tag/chip element

### Navigation
- `Tabs` / `Tab` - Tab container
- `Menu` / `MenuItem` - Menu container
- `Breadcrumb` / `BreadcrumbItem` - Breadcrumb navigation
- `Pagination` - Page navigation

### Data
- `Table` - Data table
- `DataGrid` / `Column` - Advanced data grid
- `Tree` - Tree view
- `List` - List items

### Containers
- `Card` - Card container
- `Panel` - Generic panel
- `Accordion` / `AccordionSection` - Collapsible sections
- `Modal` - Modal dialog
- `Dialog` - Dialog box
- `Drawer` - Slide-out drawer

### Feedback
- `Toast` - Notification toast
- `Alert` - Alert/notification box
- `Skeleton` - Loading placeholder
- `Stepper` / `Step` - Step indicator

## CLI Usage

The command-line tool supports various operations:

```bash
# Compile a wireframe file
wire input.wire -o output.svg

# Use a specific theme
wire input.wire --theme blueprint

# Watch for changes
wire input.wire --watch

# Validate without output
wire input.wire --validate

# Use a config file
wire -c wireframe.config.json
```

### Config File Example

```json
{
  "inputs": ["src/**/*.wire"],
  "outputDir": "./dist",
  "theme": "clean",
  "width": 1200,
  "height": 800
}
```

## VSCode Features

With the VSCode extension installed:

- **Syntax Highlighting**: Full color coding for the language
- **Live Preview**: See changes in real-time (`Ctrl+Shift+V`)
- **Code Completion**: Auto-complete controls and modifiers
- **Snippets**: Quick templates for common patterns
- **Validation**: Error highlighting as you type
- **Export**: Export to SVG or PNG

## Mermaid Integration

Use Wireframe diagrams in Mermaid:

```typescript
import mermaid from 'mermaid';
import { registerWireframe } from '@aspect-ui/wireframe-mermaid';

registerWireframe(mermaid);
```

Then in your Mermaid diagrams:

````markdown
```mermaid
wireframe-beta
    Header
        Label "Dashboard"
    /Header
    Card
        Label "Welcome back!"
    /Card
```
````

## Performance Tips

1. **Enable Caching**: Caching is on by default for repeated compilations
2. **Use Validation**: Call `validate()` for quick syntax checks without rendering
3. **Batch Processing**: Process multiple files with the CLI config

```typescript
import { compile, validate, getCacheStats } from '@aspect-ui/wireframe-core';

// Quick validation
const { valid, errors } = validate(source);

// Check cache performance
console.log(getCacheStats());

// Clear cache if needed
clearCache();
```

## Accessibility

Wireframe generates accessible SVG output:

```typescript
const { svg } = compile(source, {
  accessible: true,
  title: 'Login Form Wireframe',
  description: 'A wireframe showing a login form with email and password fields',
  lang: 'en'
});
```

Audit themes for WCAG compliance:

```typescript
import { auditTheme, getTheme } from '@aspect-ui/wireframe-core';

const theme = getTheme('clean');
const { passed, issues, score } = auditTheme(theme);

console.log(`Accessibility score: ${score}/100`);
issues.forEach(issue => console.log(`${issue.type}: ${issue.message}`));
```

## Next Steps

- Explore the [Component Gallery](./COMPONENT_GALLERY.md)
- Read the [API Reference](./API_REFERENCE.md)
- Check out [Example Wireframes](./EXAMPLES.md)
- Join our community on [Discord](#)

## Support

- [GitHub Issues](https://github.com/aspect-ui/wireframe/issues)
- [Documentation](https://wireframe.aspect-ui.dev)
- [Discord Community](#)
