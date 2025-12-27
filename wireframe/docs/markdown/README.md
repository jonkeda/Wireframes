# Wireframe Markdown Documentation

This folder contains documentation for the Wireframe DSL that demonstrates embedding wireframes in Markdown documents.

## Overview

Wireframe diagrams can be embedded in Markdown using fenced code blocks with the `wireframe` language identifier:

~~~markdown
```wireframe
wireframe clean
    Button "Hello World"
/wireframe
```
~~~

## Document Index

### Component Documentation

| Document | Description |
|----------|-------------|
| [01_basic_components.md](01_basic_components.md) | Buttons, labels, icons, badges, and basic UI elements |
| [02_forms.md](02_forms.md) | Text inputs, checkboxes, dropdowns, and complete forms |
| [03_containers_layouts.md](03_containers_layouts.md) | Vertical, Horizontal, Grid, Canvas, and Dock layouts |
| [04_navigation.md](04_navigation.md) | Tabs, menus, breadcrumbs, steppers, and navigation |
| [05_data_display.md](05_data_display.md) | Tables, data grids, toasts, and alerts |
| [06_themes.md](06_themes.md) | Clean, Sketch, Blueprint, and Realistic themes |

### Integration Guides

| Document | Description |
|----------|-------------|
| [07_wireframes_in_markdown.md](07_wireframes_in_markdown.md) | How to use wireframes in Markdown documentation |

## Rendering Wireframes in Markdown Preview

### Current Status

Currently, wireframe code blocks in Markdown are **not rendered** in VS Code's built-in Markdown preview. They display as syntax-highlighted code blocks.

### Future: Markdown Preview Wireframe Extension

A planned extension will enable rendering wireframe diagrams directly in Markdown preview, similar to how the [Markdown Mermaid](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-mermaid) extension renders Mermaid diagrams.

See the improvement proposal: [01_Markdown_Preview_Integration.md](../../architecture/wireframe/improvements/01_Markdown_Preview_Integration.md)

### Workaround: Dedicated .wire Files

For now, you can:

1. **Use `.wire` files** - Create dedicated wireframe files and open them in VS Code with the Wireframe extension installed
2. **Reference images** - Export wireframes as SVG/PNG and embed them in Markdown
3. **Use the CLI** - Run `wire render <file>.wire -o <file>.svg` to generate images

## Example: Complete Design Document

Here's how a design document might look with embedded wireframes:

~~~markdown
# Login Page Design

## Overview

The login page should be simple and focused on the primary action of signing in.

## Wireframe

```wireframe
wireframe clean
    Card w=400 padding=32
        Vertical gap=20
            // Logo area
            Image w=200 h=50
            
            Heading "Welcome Back" level=2
            Label "Sign in to your account"
            
            // Form fields
            Vertical gap=4
                Label "Email"
                TextInput placeholder="you@example.com" required
            /Vertical
            
            Vertical gap=4
                Label "Password"
                PasswordInput placeholder="••••••••" required
            /Vertical
            
            // Options
            Horizontal
                Checkbox "Remember me"
                Spacer
                Link "Forgot password?"
            /Horizontal
            
            // Actions
            Button "Sign In" primary w=100%
            
            Separator
            
            // Social login
            Label "Or continue with"
            Horizontal gap=8
                Button "Google" secondary
                Button "GitHub" secondary
            /Horizontal
            
            // Sign up link
            Horizontal gap=4
                Label "Don't have an account?"
                Link "Sign up"
            /Horizontal
        /Vertical
    /Card
/wireframe
```

## Design Notes

- Form should be centered on page
- Use primary brand color for main CTA
- Show loading spinner during authentication
- Display inline errors below fields

## States

### Error State

```wireframe
wireframe clean
    Card w=400 padding=32
        Vertical gap=16
            Alert type=error
                Label "Invalid email or password"
            /Alert
            
            TextInput placeholder="Email" required
            PasswordInput placeholder="Password" required
            
            Button "Sign In" primary w=100%
        /Vertical
    /Card
/wireframe
```

### Loading State

```wireframe
wireframe clean
    Card w=400 padding=32
        Vertical gap=16
            TextInput "user@example.com" disabled
            PasswordInput "••••••••" disabled
            
            Button "Signing in..." primary w=100% disabled
            
            Progress value=50
        /Vertical
    /Card
/wireframe
```
~~~

## Best Practices

1. **Use themes consistently** - Pick one theme per document for consistency
2. **Add explanatory text** - Always describe what the wireframe represents
3. **Keep wireframes focused** - One concept per wireframe
4. **Use appropriate sizing** - Set `w=` and `h=` for predictable layout
5. **Group related views** - Show different states together

## Related Resources

- [VS Code Extension README](../../packages/vscode-extension/README.md)
- [Language Specification](../../architecture/wireframe/docs/00_Language_Specification.md)
- [Component Library](../../architecture/wireframe/docs/06_Component_Library.md)
- [Examples](../../docs/EXAMPLES.md)
