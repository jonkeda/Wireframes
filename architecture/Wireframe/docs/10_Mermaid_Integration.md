# Mermaid Integration

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active
- **Package:** `@jonkeda/wireframe-mermaid-plugin`

---

## 1. Overview

The Mermaid Plugin enables wireframe diagrams to be used within Mermaid.js, allowing wireframes to be embedded in documentation, GitHub markdown, and other Mermaid-supported platforms.

---

## 2. Installation

```bash
npm install @jonkeda/wireframe-mermaid-plugin
```

---

## 3. Registration

### 3.1 Browser

```html
<script type="module">
  import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.esm.min.mjs';
  import { wireframePlugin } from '@jonkeda/wireframe-mermaid-plugin';
  
  mermaid.registerExternalDiagrams([wireframePlugin]);
  mermaid.initialize({ startOnLoad: true });
</script>
```

### 3.2 Node.js

```typescript
import mermaid from 'mermaid';
import { wireframePlugin } from '@jonkeda/wireframe-mermaid-plugin';

mermaid.registerExternalDiagrams([wireframePlugin]);
```

### 3.3 Docusaurus

```javascript
// docusaurus.config.js
module.exports = {
  themes: ['@docusaurus/theme-mermaid'],
  themeConfig: {
    mermaid: {
      options: {
        // Mermaid will auto-detect external diagrams
      },
    },
  },
};
```

---

## 4. Usage

### 4.1 Basic Syntax

````markdown
```mermaid
wireframe clean
    Vertical gap=16
        Button "Hello World" primary
    /Vertical
/wireframe
```
````

### 4.2 With Document Attributes

````markdown
```mermaid
wireframe sketch
    %title: Login Form
    %width: 400
    
    Card
        Heading "Login" level=2
        TextInput "Email" ?email required
        PasswordInput "Password" ?password required
        Checkbox "Remember me"
        Button "Sign In" primary
    /Card
/wireframe
```
````

### 4.3 Complex Example

````markdown
```mermaid
wireframe clean
    %title: Dashboard
    
    Dock
        Header dock=top height=64
            Horizontal
                Heading "Dashboard" level=1
                Spacer
                Avatar "JD" circle
            /Horizontal
        /Header
        
        Sidebar dock=left width=240
            Menu
                MenuItem "Overview" $icon:home selected
                MenuItem "Analytics" $icon:chart
                MenuItem "Settings" $icon:settings
            /Menu
        /Sidebar
        
        Content dock=fill
            Grid columns=3 gap=16
                Card
                    Heading "Users" level=3
                    Label "1,234"
                /Card
                Card
                    Heading "Revenue" level=3
                    Label "$45,678"
                /Card
                Card
                    Heading "Orders" level=3
                    Label "89"
                /Card
            /Grid
        /Content
    /Dock
/wireframe
```
````

---

## 5. Plugin Architecture

### 5.1 Plugin Interface

```typescript
interface MermaidExternalDiagram {
  id: string;
  detector: (text: string) => boolean;
  loader: () => Promise<DiagramDefinition>;
}

const wireframePlugin: MermaidExternalDiagram = {
  id: 'wireframe',
  detector: (text: string) => /^\s*wireframe\s+/.test(text),
  loader: async () => ({
    id: 'wireframe',
    diagram: wireframeDiagram,
  }),
};
```

### 5.2 Diagram Definition

```typescript
const wireframeDiagram: DiagramDefinition = {
  db: new WireframeDb(),
  renderer: wireframeRenderer,
  parser: wireframeParser,
  styles: wireframeStyles,
};
```

### 5.3 Renderer

```typescript
const wireframeRenderer = {
  draw: (text: string, id: string, version: string) => {
    const element = document.getElementById(id);
    const { document, errors } = parse(text);
    
    if (document && errors.length === 0) {
      const { svg } = render(document);
      element.innerHTML = svg;
    } else {
      element.innerHTML = renderErrors(errors);
    }
  },
};
```

---

## 6. Themes in Mermaid

### 6.1 Theme Mapping

| Mermaid Theme | Wireframe Theme |
|---------------|-----------------|
| `default` | `clean` |
| `dark` | `clean` (dark mode) |
| `forest` | `clean` |
| `neutral` | `sketch` |

### 6.2 Custom Theme

```javascript
mermaid.initialize({
  wireframe: {
    theme: 'blueprint',
    width: 800,
  },
});
```

---

## 7. GitHub Integration

### 7.1 GitHub Markdown

GitHub supports Mermaid diagrams in markdown files:

````markdown
# My Documentation

## Wireframe

```mermaid
wireframe clean
    Button "Click Me" primary
/wireframe
```
````

### 7.2 GitHub Wiki

Same syntax works in GitHub wiki pages.

### 7.3 GitHub Issues

Mermaid diagrams are rendered in issue descriptions and comments.

---

## 8. Configuration Options

```typescript
interface WireframeMermaidConfig {
  theme?: 'clean' | 'sketch' | 'blueprint' | 'realistic';
  width?: number;
  height?: number;
  scale?: number;
  background?: string;
}

// Apply via mermaid config
mermaid.initialize({
  wireframe: {
    theme: 'sketch',
    width: 600,
  },
});
```

---

## 9. Limitations

### 9.1 Known Limitations

| Limitation | Workaround |
|------------|------------|
| No interactivity | Use VS Code preview for interactive testing |
| Size limits | Break large wireframes into smaller parts |
| Font loading | Use web-safe fonts in themes |
| PNG export | Not directly supported in Mermaid |

### 9.2 Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✓ Full |
| Firefox | ✓ Full |
| Safari | ✓ Full |
| Edge | ✓ Full |
| IE11 | ✗ Not supported |

---

## 10. Error Handling

### 10.1 Parse Errors

When a wireframe has syntax errors, the plugin displays an error message:

```
Wireframe Error
Line 5: Unexpected token 'Buttn'
```

### 10.2 Fallback Rendering

If the plugin fails to load, Mermaid shows the raw text with an error indicator.

---

## 11. Examples

### 11.1 Form

````markdown
```mermaid
wireframe clean
    Card
        Heading "Contact Us" level=2
        Vertical gap=12
            TextInput "Name" required
            TextInput "Email" required
            TextArea "Message" rows=4
            Button "Send" primary
        /Vertical
    /Card
/wireframe
```
````

### 11.2 Navigation

````markdown
```mermaid
wireframe clean
    Horizontal gap=32
        Link "Home" @home
        Link "Products" @products
        Link "About" @about
        Link "Contact" @contact
    /Horizontal
/wireframe
```
````

### 11.3 Data Table

````markdown
```mermaid
wireframe clean
    Table
        | Name | Email | Role |
        |------|-------|------|
        | John | john@example.com | Admin |
        | Jane | jane@example.com | User |
        | Bob | bob@example.com | Editor |
    /Table
/wireframe
```
````

---

## 12. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Language reference |
| [01_Architecture_Overview](./01_Architecture_Overview.md) | System architecture |

---

*Mermaid Integration v1.0 - December 2025*
