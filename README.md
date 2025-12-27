# Wireframe

A text-based wireframe language for creating UI mockups with simple, readable syntax. Integrates seamlessly with Mermaid.js and VSCode.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

## Overview

Wireframe lets you describe user interfaces using a declarative, keyword-based syntax that's easy to learn, version control friendly, and perfect for AI-assisted design workflows.

```wireframe
uiwire sketch
    %title: Login Form
    
    Card w=400
        Vertical gap=16 padding=24
            Label "**Welcome Back**"
            
            Label "Email:"
            TextInput "Enter email" :txtEmail
            
            Label "Password:"
            PasswordInput "Enter password" :txtPass
            
            Horizontal gap=8
                Checkbox "Remember me" :chkRemember
                Label "Forgot password?" @ForgotPassword
            /Horizontal
            
            Button "Sign In" :btnLogin primary
        /Vertical
    /Card
/uiwire
```

## Features

- **Simple Syntax** - Keyword-based, no complex symbols to memorize
- **4 Visual Themes** - Sketch, Blueprint, Clean, and Realistic styles
- **38 UI Controls** - Buttons, inputs, tables, charts, navigation, and more
- **6 Layout Types** - Vertical, Horizontal, Grid, Dock, Canvas, Scroll
- **Mermaid Integration** - Use wireframes in any Mermaid-enabled environment
- **VSCode Extension** - Live preview, syntax highlighting, IntelliSense
- **CLI Tool** - Batch render wireframes to SVG/PNG
- **Accessibility** - WCAG-compliant output with ARIA attributes

## Installation

```bash
# Core library
npm install @aspect-ui/wireframe-core

# With themes
npm install @aspect-ui/wireframe-themes

# Mermaid plugin
npm install @aspect-ui/wireframe-mermaid

# CLI tool
npm install -g @aspect-ui/wireframe-cli
```

### VSCode Extension

Search for "Wireframe" in the VSCode marketplace or install from:
```
ext install aspect-ui.wireframe-vscode
```

## Quick Start

### Basic Usage

```typescript
import { compile } from '@aspect-ui/wireframe-core';

const source = `
uiwire clean
    Button "Click Me" primary
/uiwire
`;

const svg = compile(source);
```

### With Themes

```typescript
import { compile } from '@aspect-ui/wireframe-core';
import { sketchTheme } from '@aspect-ui/wireframe-themes';

const svg = compile(source, { theme: sketchTheme });
```

### In Mermaid

````markdown
```mermaid
wireframe-beta
    Dock
        Header dock=top h=60
            Horizontal justify=between padding=16
                Label "**Acme Inc**"
                Horizontal gap=24
                    Label "Home" @Home
                    Label "Products" @Products
                    Label "Contact" @Contact
                /Horizontal
            /Horizontal
        /Header
        
        Sidebar dock=left w=200
            Menu :mnuMain
                MenuItem "Overview" icon=$dashboard
                MenuItem "Reports" icon=$chart
                MenuItem "Settings" icon=$settings
            /Menu
        /Sidebar
        
        Content dock=fill
            Label "Dashboard content"
        /Content
    /Dock
```
````

### CLI

```bash
# Render single file
wire render login.wire -o login.svg

# Batch render with theme
wire render *.wire --theme sketch --format png

# Validate syntax
wire validate dashboard.wire
```

## Syntax Reference

### Document Structure

```wireframe
uiwire [theme]          // Start document (sketch|blueprint|clean|realistic)
    %title: Page Title  // Metadata
    %version: 1.0
    
    // Content here
    
/uiwire                 // End document
```

### Controls

| Category | Controls |
|----------|----------|
| **Basic** | `Button`, `Label`, `TextInput`, `TextArea`, `Checkbox`, `Radio`, `Dropdown`, `Slider`, `Switch` |
| **Navigation** | `Menu`, `MenuItem`, `Breadcrumb`, `Tabs`, `Tab`, `Pagination` |
| **Layout** | `Panel`, `Card`, `Header`, `Footer`, `Sidebar`, `Separator`, `Spacer` |
| **Data** | `Table`, `List`, `Tree`, `DataGrid` |
| **Media** | `Image`, `Icon`, `Avatar` |
| **Feedback** | `Alert`, `Toast`, `Badge`, `Progress`, `Skeleton` |

### Layouts

```wireframe
Vertical gap=16          // Stack vertically
Horizontal gap=8         // Stack horizontally  
Grid cols=3 gap=16       // CSS Grid
Dock                     // Dock layout (top/left/right/bottom/fill)
Canvas                   // Absolute positioning
Scroll h=400             // Scrollable container
```

### Attributes

```wireframe
Button "Label" primary w=200 disabled
TextInput "Name" :txtName required
Image "photo.jpg" w=100 h=100
```

### States

```wireframe
Button "Save" disabled           // disabled state
TextInput "Email" :txt required  // required field
Checkbox "Accept" :chk checked   // checked state
```

## Packages

| Package | Description |
|---------|-------------|
| `@aspect-ui/wireframe-core` | Parser, renderer, and core APIs |
| `@aspect-ui/wireframe-themes` | Visual themes (sketch, blueprint, clean, realistic) |
| `@aspect-ui/wireframe-mermaid` | Mermaid.js integration plugin |
| `@aspect-ui/wireframe-vscode` | VSCode extension with live preview |
| `@aspect-ui/wireframe-cli` | Command-line interface |

## Documentation

- [Getting Started](wireframe/docs/GETTING_STARTED.md)
- [API Reference](wireframe/docs/API_REFERENCE.md)
- [Examples](wireframe/docs/EXAMPLES.md)
- [Changelog](wireframe/CHANGELOG.md)

### Architecture Documentation

- [Architecture Overview](architecture/Wireframe/docs/20_Architecture_Overview.md)
- [Language Specification](architecture/Wireframe/planning/06k_Language_Specification_v7_Keywords.md)
- [Component Library](architecture/Wireframe/docs/25_Component_Library.md)
- [Theming System](architecture/Wireframe/docs/26_Theming_System.md)

## Examples

### Dashboard Layout

```wireframe
uiwire clean
    %title: Analytics Dashboard
    
    Dock
        Header dock=top h=60
            Horizontal justify=between padding=16
                Label "**Dashboard**"
                Horizontal gap=24
                    Label "Overview" @Overview
                    Label "Reports" @Reports
                    Label "Settings" @Settings
                /Horizontal
                Avatar "user.jpg" size=32
            /Horizontal
        /Header
        
        Sidebar dock=left w=240
            Menu :mnuMain
                MenuItem "Dashboard" icon=$home selected
                MenuItem "Analytics" icon=$chart
                MenuItem "Users" icon=$users
                MenuItem "Settings" icon=$settings
            /Menu
        /Sidebar
        
        Panel dock=fill padding=24
            Vertical gap=16
                Grid cols=3 gap=16
                    Card
                        Label "Total Users"
                        Label "**12,345**"
                    /Card
                    Card
                        Label "Revenue"
                        Label "**$45,678**"
                    /Card
                    Card
                        Label "Growth"
                        Label "**+23%**"
                    /Card
                /Grid
                
                Card
                    Label "**Monthly Trends**"
                    Image "chart-placeholder" h=300
                /Card
            /Vertical
        /Panel
    /Dock
/uiwire
```

### Form Example

```wireframe
uiwire sketch
    %title: Create Account
    
    Card w=400
        Vertical gap=20 padding=32
            Label "**Create Account**"
            
            Label "Full Name:"
            TextInput "Enter your name" :txtName required
            
            Label "Email:"
            TextInput "Enter email" :txtEmail required pattern=email
            
            Label "Password:"
            PasswordInput "Enter password" :txtPass required min=8
            
            Label "Country:"
            Dropdown :ddlCountry
                Option "United States"
                Option "Canada"
                Option "United Kingdom"
            /Dropdown
            
            Checkbox "I agree to the Terms of Service" :chkTerms required
            
            Button "Create Account" :btnCreate primary
            
            Horizontal justify=center gap=4
                Label "Already have an account?"
                Label "Sign in" @Login
            /Horizontal
        /Vertical
    /Card
/uiwire
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT © Aspect UI
