# Appendix & References

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active

---

## 1. Document Index

| # | Document | Description |
|---|----------|-------------|
| 00 | [Language_Specification](./00_Language_Specification.md) | Complete DSL syntax reference |
| 01 | [Architecture_Overview](./01_Architecture_Overview.md) | System architecture and packages |
| 02 | [Lexer_Specification](./02_Lexer_Specification.md) | Token types and lexer rules |
| 03 | [Parser_Specification](./03_Parser_Specification.md) | Grammar and parsing rules |
| 04 | [AST_Reference](./04_AST_Reference.md) | AST node types and structures |
| 05 | [Renderer_Design](./05_Renderer_Design.md) | SVG rendering system |
| 06 | [Component_Library](./06_Component_Library.md) | All UI components |
| 07 | [Theming_System](./07_Theming_System.md) | Theme definitions |
| 08 | [VSCode_Extension](./08_VSCode_Extension.md) | VS Code extension |
| 09 | [CLI_Reference](./09_CLI_Reference.md) | Command line interface |
| 10 | [Mermaid_Integration](./10_Mermaid_Integration.md) | Mermaid plugin usage |
| 11 | [API_Reference](./11_API_Reference.md) | Core package API |
| 12 | [Testing_Strategy](./12_Testing_Strategy.md) | Test framework and approach |
| 13 | [Examples_Gallery](./13_Examples_Gallery.md) | Example wireframes |
| 14 | [Migration_Guide](./14_Migration_Guide.md) | Version migration help |
| 15 | [Contributing_Guide](./15_Contributing_Guide.md) | Contribution guidelines |
| 16 | [Changelog](./16_Changelog.md) | Version history |
| 17 | [Appendix_References](./17_Appendix_References.md) | This document |

---

## 2. Quick Reference

### 2.1 Basic Syntax

```wireframe
wireframe <style>
    Content goes here (indented 4 spaces)
/wireframe
```

### 2.2 Available Styles

| Style | Description |
|-------|-------------|
| `clean` | Modern flat design |
| `sketch` | Hand-drawn look |
| `blueprint` | Technical drawing |
| `minimal` | Clean minimal |

### 2.3 Element Syntax

```
ElementName "label" :id ?binding @navigation $icon:name modifier attribute=value
```

### 2.4 Modifier Reference

| Modifier | Applies To |
|----------|------------|
| `primary` | Buttons |
| `secondary` | Buttons |
| `required` | Inputs |
| `disabled` | All controls |
| `checked` | Checkbox, Switch |
| `selected` | MenuItem, Tab |
| `readonly` | Inputs |
| `editable` | Labels |
| `active` | Navigation |
| `expanded` | Accordion |
| `removable` | Chip, ListItem |
| `circle` | Avatar, Image |
| `indeterminate` | Checkbox |
| `completed` | Step |
| `border` | All elements |

### 2.5 Common Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `width` | Element width | `width=200` |
| `height` | Element height | `height=100` |
| `gap` | Spacing between children | `gap=16` |
| `padding` | Internal padding | `padding=12` |
| `columns` | Grid columns | `columns=3` |
| `rows` | Textarea rows | `rows=5` |
| `level` | Heading level | `level=2` |
| `dock` | Dock position | `dock=top` |
| `align` | Alignment | `align=center` |
| `value` | Initial value | `value=50` |
| `min` | Minimum value | `min=0` |
| `max` | Maximum value | `max=100` |

---

## 3. Token Types

### 3.1 Keywords

**Layouts:** `Vertical`, `Horizontal`, `Grid`, `Stack`, `Dock`, `Wrap`

**Sections:** `Header`, `Content`, `Footer`, `Sidebar`, `Panel`, `Card`, `Dialog`, `Group`, `Block`

**Controls:** `Button`, `TextInput`, `Checkbox`, `Label`, `Image`, `Menu`, `Table`, etc.

### 3.2 Literals

| Type | Pattern | Example |
|------|---------|---------|
| String | `"..."` | `"Hello World"` |
| Number | `\d+` | `123` |
| Boolean | `true|false` | `true` |

### 3.3 Operators

| Symbol | Purpose | Example |
|--------|---------|---------|
| `:` | ID prefix | `:submitBtn` |
| `?` | Binding | `?username` |
| `@` | Navigation | `@settings` |
| `$` | Special | `$icon:save` |
| `=` | Assignment | `width=100` |
| `/` | Closing tag | `/Button` |
| `%` | Metadata | `%title: App` |

---

## 4. AST Node Types

### 4.1 Hierarchy

```
DocumentNode
├── LayoutNode
│   ├── SectionNode
│   │   └── ControlNode
│   └── ControlNode
├── SectionNode
│   └── ControlNode
└── ControlNode
```

### 4.2 Node Properties

**All Nodes:**
- `type`: Node type
- `position`: Source location

**With Content:**
- `children`: Child nodes
- `attributes`: Key-value pairs
- `modifiers`: Boolean flags

**Controls:**
- `controlType`: Control name
- `label`: Display text
- `id`: Element ID
- `binding`: Data binding
- `navigation`: Navigation target
- `icon`: Icon name

---

## 5. Built-in Icons

### 5.1 Icon List

```
home        search      settings    user        users
mail        phone       calendar    clock       bell
heart       star        flag        trash       edit
plus        minus       check       close       chevron-up
chevron-down chevron-left chevron-right arrow-up  arrow-down
arrow-left  arrow-right menu        more        filter
sort        download    upload      share       link
copy        paste       cut         undo        redo
refresh     save        file        folder      image
video       music       code        terminal    cloud
```

### 5.2 Usage

```wireframe
Button "Save" $icon:save
MenuItem "Home" $icon:home
IconButton $icon:edit
```

---

## 6. Error Codes

| Code | Message | Solution |
|------|---------|----------|
| E001 | Expected INDENT after wireframe | Add 4-space indentation |
| E002 | Unexpected token | Check syntax near position |
| E003 | Missing closing tag | Add `/ElementName` |
| E004 | Mismatched closing tag | Match closing to opening |
| E005 | Unknown keyword | Check spelling/case |
| E006 | Duplicate ID | Use unique IDs |
| E007 | Invalid attribute value | Check attribute format |

---

## 7. File Extensions

| Extension | Purpose |
|-----------|---------|
| `.wire` | Wireframe source file |
| `.wireframe` | Alternate extension |
| `.svg` | Rendered output |
| `.json` | Configuration |

---

## 8. External Resources

### 8.1 Technologies

| Technology | Documentation |
|------------|---------------|
| TypeScript | https://www.typescriptlang.org/docs/ |
| Vitest | https://vitest.dev/ |
| VS Code API | https://code.visualstudio.com/api |
| Mermaid | https://mermaid.js.org/ |
| SVG | https://developer.mozilla.org/en-US/docs/Web/SVG |

### 8.2 Related Projects

| Project | Purpose |
|---------|---------|
| Mermaid | Diagram DSL inspiration |
| Balsamiq | Wireframe tool reference |
| Excalidraw | Sketch rendering reference |

---

## 9. Glossary

| Term | Definition |
|------|------------|
| **AST** | Abstract Syntax Tree - tree representation of source code |
| **Binding** | Connection between control and data (`?name`) |
| **Control** | UI element like Button, Input, Label |
| **DSL** | Domain Specific Language |
| **Layout** | Container that arranges children |
| **Lexer** | Converts source text to tokens |
| **Modifier** | Boolean flag changing element behavior |
| **Node** | Single element in the AST |
| **Parser** | Converts tokens to AST |
| **Renderer** | Converts AST to visual output |
| **Section** | Semantic region (Header, Content, etc.) |
| **Theme** | Visual styling configuration |
| **Token** | Smallest unit of syntax |
| **Wireframe** | Low-fidelity UI mockup |

---

## 10. Version Information

| Package | Version | Status |
|---------|---------|--------|
| @jonkeda/wireframe-core | 1.0.0 | Stable |
| @jonkeda/wireframe-cli | 1.0.0 | Stable |
| @jonkeda/wireframe-mermaid-plugin | 1.0.0 | Stable |
| @jonkeda/wireframe-themes | 1.0.0 | Stable |
| wireframe-vscode | 1.0.0 | Stable |

---

## 11. Support

- **Repository:** https://github.com/jonkeda/wireframe
- **Issues:** https://github.com/jonkeda/wireframe/issues
- **Discussions:** https://github.com/jonkeda/wireframe/discussions

---

*Appendix & References v1.0 - December 2025*
