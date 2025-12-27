# Wireframe Refinement Plan

**Date:** December 27, 2025  
**Status:** Planned  
**Document:** 35

---

## Overview

This document outlines refinements needed to finalize the Wireframe project for public release.

---

## 1. Rename `uiwire` Keyword to `wireframe`

### Current Syntax
```wireframe
uiwire clean
    %title: My Wireframe
    Button "Click"
/uiwire
```

### New Syntax
```wireframe
wireframe clean
    %title: My Wireframe
    Button "Click"
/wireframe
```

### Files to Update

#### Language Specification
- [ ] `architecture/Wireframe/planning/06k_Language_Specification_v7_Keywords.md`
- [ ] `architecture/Wireframe/planning/06l_Examples_v7_Keywords.md`

#### Documentation
- [ ] `wireframe/docs/GETTING_STARTED.md`
- [ ] `wireframe/docs/EXAMPLES.md`
- [ ] `wireframe/docs/API_REFERENCE.md`
- [ ] `README.md`

#### Implementation
- [ ] `wireframe/packages/core/src/lexer.ts` - Update keyword tokens
- [ ] `wireframe/packages/core/src/parser.ts` - Update document parsing
- [ ] `wireframe/packages/core/tests/` - Update all test files

### Search/Replace Pattern
| Find | Replace |
|------|---------|
| `uiwire ` | `wireframe ` |
| `/uiwire` | `/wireframe` |
| `'uiwire'` | `'wireframe'` |
| `"uiwire"` | `"wireframe"` |

---

## 2. Add Window and Dialog Controls

### Window Control

The `Window` control creates a desktop-style window container with title bar and optional controls.

```wireframe
wireframe clean
    Window "Application Title" w=800 h=600
        // Window content
    /Window
    
    // With options
    Window "Settings" w=400 h=300 closable resizable
        Vertical gap=16
            Label "Window content here"
        /Vertical
    /Window
```

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `w` | number | 800 | Width in pixels |
| `h` | number | 600 | Height in pixels |
| `closable` | boolean | true | Show close button |
| `minimizable` | boolean | true | Show minimize button |
| `maximizable` | boolean | true | Show maximize button |
| `resizable` | boolean | true | Allow resizing |

### Dialog Control

The `Dialog` control creates a modal dialog overlay.

```wireframe
wireframe clean
    Dialog "Confirm Action" :dlgConfirm
        Vertical gap=16
            Label "Are you sure you want to proceed?"
            Horizontal justify=end gap=8
                Button "Cancel" @:close
                Button "Confirm" primary
            /Horizontal
        /Vertical
    /Dialog
    
    // With size options
    Dialog "Large Dialog" :dlgLarge size=large
        // Content
    /Dialog
```

**Properties:**
| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | string | 'medium' | small, medium, large, fullscreen |
| `closable` | boolean | true | Show close button |
| `backdrop` | boolean | true | Show backdrop overlay |
| `centered` | boolean | true | Center vertically |

### Implementation Tasks

- [ ] Add `Window` to lexer token types
- [ ] Add `Dialog` to lexer token types  
- [ ] Implement `WindowNode` AST type
- [ ] Implement `DialogNode` AST type
- [ ] Add Window renderer in SVG renderer
- [ ] Add Dialog renderer in SVG renderer
- [ ] Add Window/Dialog styles to all 4 themes
- [ ] Write unit tests for Window
- [ ] Write unit tests for Dialog
- [ ] Update component library documentation

---

## 3. Package Organization (@aspect-ui)

### Current State

The `@aspect-ui` scope is a **placeholder organization name** used during development. Before publishing, you need to decide on the actual npm organization.

### Options

#### Option A: Create @aspect-ui Organization (Recommended)
1. Create npm organization: https://www.npmjs.com/org/create
2. Organization name: `aspect-ui`
3. Keep current package names

#### Option B: Use Personal Scope
Replace `@aspect-ui` with your npm username:
```
@aspect-ui/wireframe-core → @yourusername/wireframe-core
```

#### Option C: Use Unscoped Packages
```
@aspect-ui/wireframe-core → wireframe-core
```
Note: Unscoped names may have availability issues.

### Package Names

| Package | Purpose |
|---------|---------|
| `@aspect-ui/wireframe-core` | Parser, renderer, core APIs |
| `@aspect-ui/wireframe-themes` | Theme definitions |
| `@aspect-ui/wireframe-mermaid` | Mermaid.js plugin |
| `@aspect-ui/wireframe-vscode` | VS Code extension |
| `@aspect-ui/wireframe-cli` | Command-line interface |

### Files to Update After Decision

- [ ] All `package.json` files
- [ ] All import statements in source files
- [ ] Documentation references
- [ ] README.md

---

## 4. CI/CD Pipeline

### Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Commit    │───▶│    Build    │───▶│    Test     │───▶│   Publish   │
│   & Push    │    │  & Lint     │    │ & Coverage  │    │  Packages   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### GitHub Actions Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  release:
    types: [published]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm lint
      
      - name: Type check
        run: pnpm typecheck
      
      - name: Build
        run: pnpm build
      
      - name: Test
        run: pnpm test -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  publish-npm:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm build
      
      - name: Publish to npm
        run: pnpm -r publish --access public --no-git-checks
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  publish-vscode:
    needs: build
    runs-on: ubuntu-latest
    if: github.event_name == 'release'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build extension
        run: pnpm --filter @aspect-ui/wireframe-vscode build
      
      - name: Package extension
        run: |
          cd wireframe/packages/vscode
          npx vsce package
      
      - name: Publish to VS Code Marketplace
        run: |
          cd wireframe/packages/vscode
          npx vsce publish -p ${{ secrets.VSCE_TOKEN }}
      
      - name: Publish to Open VSX
        run: |
          cd wireframe/packages/vscode
          npx ovsx publish -p ${{ secrets.OVSX_TOKEN }}
```

### Required Secrets

Configure these in GitHub repository settings → Secrets:

| Secret | Description | How to Get |
|--------|-------------|------------|
| `NPM_TOKEN` | npm automation token | npmjs.com → Access Tokens → Generate |
| `VSCE_TOKEN` | VS Code Marketplace PAT | dev.azure.com → Personal Access Tokens |
| `OVSX_TOKEN` | Open VSX token | open-vsx.org → Access Tokens |

### Publishing to npm

#### Manual Publishing
```bash
# Login to npm
npm login

# Build all packages
pnpm build

# Publish all packages (from root)
pnpm -r publish --access public

# Or publish individually
cd wireframe/packages/core && npm publish --access public
cd wireframe/packages/themes && npm publish --access public
cd wireframe/packages/mermaid && npm publish --access public
cd wireframe/packages/cli && npm publish --access public
```

#### Version Management
```bash
# Bump version across all packages
pnpm -r exec npm version patch  # or minor, major

# Or use changesets for better changelog management
pnpm add -D @changesets/cli
pnpm changeset init
pnpm changeset        # Create changeset
pnpm changeset version  # Apply versions
pnpm -r publish --access public
```

### Publishing VS Code Extension

#### Setup (One-time)
```bash
# Install vsce
npm install -g @vscode/vsce

# Create publisher (if needed)
# Go to: https://marketplace.visualstudio.com/manage
# Click "Create Publisher"
```

#### Manual Publishing
```bash
cd wireframe/packages/vscode

# Package extension
vsce package
# Creates: wireframe-vscode-1.0.0.vsix

# Publish to VS Code Marketplace
vsce publish

# Or publish specific version
vsce publish 1.0.1
```

#### Extension package.json Requirements
```json
{
  "name": "wireframe-vscode",
  "displayName": "Wireframe",
  "description": "Create UI wireframes with text-based syntax",
  "version": "1.0.0",
  "publisher": "aspect-ui",
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": ["Programming Languages", "Visualization"],
  "repository": {
    "type": "git",
    "url": "https://github.com/aspect-ui/wireframe"
  },
  "icon": "images/icon.png",
  "galleryBanner": {
    "color": "#1e1e1e",
    "theme": "dark"
  }
}
```

### Release Process

1. **Prepare Release**
   ```bash
   # Update versions
   pnpm -r exec npm version 1.0.0
   
   # Update CHANGELOG.md
   
   # Commit
   git add -A
   git commit -m "chore: release v1.0.0"
   git push
   ```

2. **Create GitHub Release**
   - Go to GitHub → Releases → Create new release
   - Tag: `v1.0.0`
   - Title: `v1.0.0`
   - Description: Copy from CHANGELOG.md
   - Publish release

3. **Automatic Publishing**
   - GitHub Actions triggers on release
   - Publishes npm packages
   - Publishes VS Code extension

---

## 5. README Restructure

### New Structure

```markdown
# Wireframe

> Create UI wireframes with simple, readable text syntax

[Example wireframe code] → [Rendered SVG image]

## Features
- Feature list with icons/badges

## VS Code Extension (Recommended)
- One-click install
- Live preview, syntax highlighting, IntelliSense

## npm Packages
- For programmatic use
- Package list

## Quick Start
- Basic examples

## Documentation
- Links

## Contributing / License
```

### Detailed Content

#### Hero Section with SVG

```markdown
# Wireframe

> Create UI wireframes with simple, readable text syntax

<table>
<tr>
<td width="50%">

```wireframe
wireframe sketch
    Card w=300
        Vertical gap=16 padding=24
            Label "**Login**"
            TextInput "Email" :txtEmail
            PasswordInput "Password" :txtPass
            Button "Sign In" primary
        /Vertical
    /Card
/wireframe
```

</td>
<td width="50%">

![Login wireframe](docs/images/login-example.svg)

</td>
</tr>
</table>
```

#### Features Section

```markdown
## ✨ Features

| Feature | Description |
|---------|-------------|
| 📝 **Simple Syntax** | Keyword-based, easy to learn |
| 🎨 **4 Themes** | Sketch, Blueprint, Clean, Realistic |
| 🧩 **40+ Controls** | Buttons, inputs, tables, navigation |
| 📐 **6 Layouts** | Vertical, Horizontal, Grid, Dock, Canvas, Scroll |
| ⚡ **Live Preview** | See changes instantly in VS Code |
| 🔌 **Mermaid Plugin** | Use in any Mermaid environment |
| ♿ **Accessible** | WCAG-compliant SVG output |
| 🚀 **Fast** | LRU caching, optimized rendering |
```

#### VS Code Installation (Primary)

```markdown
## 🚀 Quick Start with VS Code

The easiest way to use Wireframe is with the VS Code extension.

### Install Extension

[![Install in VS Code](https://img.shields.io/badge/VS%20Code-Install%20Extension-007ACC?logo=visualstudiocode)](vscode:extension/aspect-ui.wireframe-vscode)

Or search for **"Wireframe"** in VS Code Extensions.

### Create Your First Wireframe

1. Create a new file: `example.wire`
2. Add content:
   ```wireframe
   wireframe clean
       Button "Hello World" primary
   /wireframe
   ```
3. Press `Ctrl+Shift+V` to preview

### Extension Features

- ✅ Syntax highlighting
- ✅ Live preview (side-by-side)
- ✅ IntelliSense autocomplete
- ✅ Error diagnostics
- ✅ Export to SVG/PNG
- ✅ Theme switching
```

#### npm Installation (Secondary)

```markdown
## 📦 npm Packages

For programmatic use, CI/CD integration, or custom tooling.

### Core Library

```bash
npm install @aspect-ui/wireframe-core
```

```typescript
import { compile } from '@aspect-ui/wireframe-core';

const { svg } = compile(`
wireframe clean
    Button "Click Me" primary
/wireframe
`);
```

### All Packages

| Package | Description |
|---------|-------------|
| `@aspect-ui/wireframe-core` | Parser and renderer |
| `@aspect-ui/wireframe-themes` | Additional themes |
| `@aspect-ui/wireframe-mermaid` | Mermaid.js plugin |
| `@aspect-ui/wireframe-cli` | Command-line tool |

### CLI Usage

```bash
npm install -g @aspect-ui/wireframe-cli

wire render input.wire -o output.svg
wire validate input.wire
```
```

---

## Implementation Checklist

### Phase 1: Keyword Rename
- [ ] Update lexer for `wireframe` keyword
- [ ] Update parser for `wireframe` document
- [ ] Update all documentation
- [ ] Update all tests
- [ ] Update all examples

### Phase 2: New Controls
- [ ] Implement Window control
- [ ] Implement Dialog control
- [ ] Add theme styles
- [ ] Write tests
- [ ] Update documentation

### Phase 3: Package Organization
- [ ] Decide on npm organization
- [ ] Create organization (if needed)
- [ ] Update all package.json files
- [ ] Update import statements

### Phase 4: CI/CD Setup
- [ ] Create GitHub Actions workflow
- [ ] Configure npm token secret
- [ ] Configure VSCE token secret
- [ ] Test publish workflow
- [ ] Document release process

### Phase 5: README Update
- [ ] Create example SVG images
- [ ] Restructure README sections
- [ ] Add VS Code install button
- [ ] Update feature list
- [ ] Add badges

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Keyword Rename | 1 day | None |
| Phase 2: New Controls | 2 days | Phase 1 |
| Phase 3: Package Organization | 1 day | Decision needed |
| Phase 4: CI/CD Setup | 1 day | Phase 3 |
| Phase 5: README Update | 1 day | Phase 1-4 |

**Total Estimated Time:** 6 days

---

## Notes

- The `@aspect-ui` scope requires creating an npm organization or changing the package names
- VS Code extension publishing requires a Microsoft/Azure DevOps account
- Consider adding Open VSX publishing for VS Code forks (VS Codium, etc.)
- The README SVG examples should be pre-rendered and committed to the repo
