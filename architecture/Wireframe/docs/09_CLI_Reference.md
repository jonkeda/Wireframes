# CLI Reference

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Package:** `@jonkeda/wireframe-cli`

---

## 1. Overview

The Wireframe CLI provides command-line tools for converting and validating wireframe files.

---

## 2. Installation

```bash
# Global installation
npm install -g @jonkeda/wireframe-cli

# Or via npx
npx @jonkeda/wireframe-cli render input.wire -o output.svg
```

---

## 3. Commands

### 3.1 render

Convert a wireframe file to SVG or PNG.

**Syntax:**
```bash
wireframe render <input> [options]
```

**Options:**

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--output` | `-o` | stdout | Output file path |
| `--format` | `-f` | svg | Output format (svg, png) |
| `--theme` | `-t` | clean | Theme (clean, sketch, blueprint, realistic) |
| `--width` | `-w` | auto | Output width in pixels |
| `--height` | `-h` | auto | Output height in pixels |
| `--scale` | `-s` | 1 | Scale factor for PNG |

**Examples:**

```bash
# Basic SVG output
wireframe render app.wire -o app.svg

# PNG output with theme
wireframe render app.wire -o app.png --format png --theme sketch

# Custom dimensions
wireframe render app.wire -o app.svg --width 1200 --height 800

# Output to stdout
wireframe render app.wire > output.svg
```

---

### 3.2 validate

Validate wireframe file syntax.

**Syntax:**
```bash
wireframe validate <input> [options]
```

**Options:**

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--strict` | | false | Enable strict mode |
| `--json` | | false | Output errors as JSON |

**Examples:**

```bash
# Basic validation
wireframe validate app.wire

# JSON output for CI
wireframe validate app.wire --json

# Strict mode
wireframe validate app.wire --strict
```

**Output:**
```
✓ app.wire is valid

# Or with errors:
✗ app.wire has errors:
  Line 5, Column 12: Unknown component type 'Buttn'
  Line 8, Column 4: Expected /Vertical to close block
```

---

### 3.3 watch

Watch a file and re-render on changes.

**Syntax:**
```bash
wireframe watch <input> [options]
```

**Options:**

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--output` | `-o` | required | Output file path |
| `--format` | `-f` | svg | Output format |
| `--theme` | `-t` | clean | Theme |
| `--open` | | false | Open in browser |

**Examples:**

```bash
# Watch and re-render
wireframe watch app.wire -o app.svg

# Watch with browser preview
wireframe watch app.wire -o app.svg --open
```

**Output:**
```
Watching app.wire...
[12:34:56] Rendered app.svg
[12:35:02] Rendered app.svg
[12:35:15] Error on line 8: Missing closing tag
[12:35:20] Rendered app.svg
^C
```

---

### 3.4 batch

Batch convert multiple files.

**Syntax:**
```bash
wireframe batch <pattern> [options]
```

**Options:**

| Option | Alias | Default | Description |
|--------|-------|---------|-------------|
| `--outdir` | `-d` | . | Output directory |
| `--format` | `-f` | svg | Output format |
| `--theme` | `-t` | clean | Theme |
| `--parallel` | `-p` | 4 | Parallel jobs |

**Examples:**

```bash
# Convert all .wire files in directory
wireframe batch "*.wire" -d output/

# Convert with pattern
wireframe batch "src/**/*.wire" -d dist/ --format png
```

---

### 3.5 init

Initialize a new wireframe project.

**Syntax:**
```bash
wireframe init [directory]
```

**Creates:**
```
directory/
├── wireframes/
│   └── example.wire
├── output/
└── wireframe.config.json
```

---

## 4. Configuration File

### 4.1 wireframe.config.json

```json
{
  "input": "wireframes/**/*.wire",
  "output": "output",
  "format": "svg",
  "theme": "clean",
  "watch": false,
  "parallel": 4,
  "defaults": {
    "width": 800,
    "height": 600
  }
}
```

### 4.2 Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `input` | string | "*.wire" | Input file pattern |
| `output` | string | "." | Output directory |
| `format` | string | "svg" | Default format |
| `theme` | string | "clean" | Default theme |
| `watch` | boolean | false | Enable watch mode |
| `parallel` | number | 4 | Parallel jobs |
| `defaults.width` | number | auto | Default width |
| `defaults.height` | number | auto | Default height |

---

## 5. Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Invalid arguments |
| 2 | File not found |
| 3 | Parse error |
| 4 | Render error |
| 5 | Write error |

---

## 6. Programmatic API

```typescript
import { CLI } from '@jonkeda/wireframe-cli';

const cli = new CLI();

// Render a file
await cli.render('app.wire', {
  output: 'app.svg',
  theme: 'clean',
});

// Validate a file
const result = await cli.validate('app.wire');
if (!result.valid) {
  console.error(result.errors);
}

// Watch a file
const watcher = cli.watch('app.wire', {
  output: 'app.svg',
  onChange: (svg) => {
    console.log('Rendered');
  },
  onError: (errors) => {
    console.error('Errors:', errors);
  },
});

// Stop watching
watcher.stop();
```

---

## 7. Integration Examples

### 7.1 npm Scripts

```json
{
  "scripts": {
    "wireframe:build": "wireframe batch wireframes/*.wire -d dist/",
    "wireframe:watch": "wireframe watch wireframes/app.wire -o dist/app.svg",
    "wireframe:validate": "wireframe validate wireframes/*.wire"
  }
}
```

### 7.2 GitHub Actions

```yaml
name: Build Wireframes
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g @jonkeda/wireframe-cli
      - run: wireframe batch "wireframes/*.wire" -d output/
      - uses: actions/upload-artifact@v3
        with:
          name: wireframes
          path: output/
```

---

## 8. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Language reference |
| [01_Architecture_Overview](./01_Architecture_Overview.md) | System architecture |

---

*CLI Reference v1.0 - December 2025*
