# Wireframe Language Instructions

This document provides instructions for AI assistants (GitHub Copilot, ChatGPT, Claude, etc.) to generate and interpret Wireframe language documents.

---

## What is Wireframe?

Wireframe is a text-based UI specification language designed for:
- **AI-to-Human communication** - Structured output that humans can quickly verify
- **Human-to-AI communication** - Precise UI specs that AI can parse and implement
- **Documentation** - Version-controlled, diff-friendly UI specifications

---

## Language Syntax

### Document Structure

Every Wireframe document follows this structure:

```wireframe
uiwire <style>
    %title: Document Title
    %version: 1.0
    %author: Author Name
    
    // UI components here
    
/uiwire
```

### Available Styles

| Style | Use Case |
|-------|----------|
| `sketch` | Hand-drawn, informal wireframes |
| `clean` | Minimal, professional wireframes |
| `blueprint` | Technical specifications |
| `realistic` | High-fidelity mockups |

---

## Component Reference

### Controls

| Component | Syntax | Description |
|-----------|--------|-------------|
| `Button` | `Button "Label" :id primary` | Clickable button |
| `IconButton` | `IconButton $icon "Label"` | Button with icon |
| `TextInput` | `TextInput "Placeholder" :id required` | Text input field |
| `PasswordInput` | `PasswordInput "Placeholder" :id` | Password field |
| `TextArea` | `TextArea "Placeholder" rows=4` | Multi-line text |
| `Checkbox` | `Checkbox "Label" :id checked` | Checkbox |
| `Radio` | `Radio "Label" :id selected` | Radio button |
| `Dropdown` | `Dropdown :id` with `Option` children | Select dropdown |
| `Label` | `Label "Text"` | Text label |
| `Separator` | `Separator` | Visual divider |
| `Spacer` | `Spacer` | Empty space |

### Layouts

| Layout | Syntax | Description |
|--------|--------|-------------|
| `Vertical` | `Vertical gap=8` | Stack children vertically |
| `Horizontal` | `Horizontal gap=8` | Stack children horizontally |
| `Grid` | `Grid cols=2 rows=2 gap=16` | Grid layout |
| `Dock` | `Dock` | Dock layout with regions |
| `Canvas` | `Canvas` | Absolute positioning |
| `Scroll` | `Scroll` | Scrollable container |

### Containers

| Container | Syntax | Description |
|-----------|--------|-------------|
| `Card` | `Card` | Bordered card container |
| `Panel` | `Panel` | Panel section |
| `Header` | `Header dock=top h=60` | Header region |
| `Footer` | `Footer dock=bottom` | Footer region |
| `Sidebar` | `Sidebar dock=left w=200` | Side navigation |
| `Content` | `Content dock=fill` | Main content area |
| `Modal` | `Modal` | Modal dialog |
| `Drawer` | `Drawer` | Slide-out panel |

---

## Syntax Patterns

### Element IDs
Use `:` prefix for element IDs:
```wireframe
Button "Save" :btnSave
TextInput "Email" :txtEmail
```

### Data Binding
Use `?` prefix for data binding:
```wireframe
TextInput "Name" ?user.name
Label ?user.email
```

### Icons
Use `$` prefix for icons:
```wireframe
IconButton $save "Save"
IconButton $home "Home"
```

### Navigation
Use `@` prefix for navigation targets:
```wireframe
Button "Dashboard" @Dashboard
Button "Back" @:back
```

### Modifiers
Add modifiers directly after the element:
```wireframe
Button "Submit" primary
Button "Cancel" secondary
TextInput "Email" required
Checkbox "Remember" checked
```

### Attributes
Use `key=value` syntax:
```wireframe
Grid cols=3 rows=2 gap=16
TextInput "Age" min=0 max=120
Vertical gap=8 align=center
```

### Block Closing
Close blocks with `/Keyword`:
```wireframe
Card
    Label "Content"
/Card

Vertical gap=8
    Button "A"
    Button "B"
/Vertical
```

---

## Common Patterns

### Login Form
```wireframe
uiwire clean
    Card w=400
        Label "**Login**"
        Separator
        TextInput "Email" :txtEmail required
        PasswordInput "Password" :txtPass required
        Checkbox "Remember me" :chkRemember
        Button "Sign In" :btnLogin primary
    /Card
/uiwire
```

### Dashboard Layout
```wireframe
uiwire clean
    Dock
        Header dock=top h=60
            Horizontal padding=16 align=center
                Label "**Dashboard**"
                Spacer
                IconButton $settings
            /Horizontal
        /Header
        
        Sidebar dock=left w=220
            Vertical gap=4
                IconButton $home "Home"
                IconButton $users "Users"
                IconButton $settings "Settings"
            /Vertical
        /Sidebar
        
        Content dock=fill
            // Main content here
        /Content
    /Dock
/uiwire
```

### Form with Validation
```wireframe
uiwire clean
    Vertical gap=12 w=400
        Label "**Contact Form**"
        
        TextInput "Name" :txtName required min=2 max=50
        TextInput "Email" :txtEmail required pattern=email
        TextInput "Phone" :txtPhone pattern=phone
        TextArea "Message" :txtMessage rows=4
        
        Separator
        
        Horizontal justify=end gap=8
            Button "Cancel" @:back
            Button "Submit" :btnSubmit primary
        /Horizontal
    /Vertical
/uiwire
```

### Data Table
```wireframe
uiwire clean
    Card
        Horizontal justify=between align=center
            Label "**Users**"
            Button "Add User" primary
        /Horizontal
        
        Separator
        
        DataGrid :dgUsers
            Column "Name" field=name
            Column "Email" field=email
            Column "Role" field=role
            Column "Actions" w=100
        /DataGrid
        
        Pagination :pgUsers
    /Card
/uiwire
```

---

## AI Instructions

### When Generating Wireframe from Screenshots

1. **Identify the layout structure first** - Is it a single column, sidebar layout, or grid?
2. **Map visual elements to components** - Buttons, inputs, labels, etc.
3. **Preserve hierarchy** - Use indentation to show parent-child relationships
4. **Infer IDs** - Generate meaningful IDs like `:btnSubmit`, `:txtEmail`
5. **Note modifiers** - Identify primary buttons, required fields, checked boxes

### When Generating Wireframe from Descriptions

1. **Start with the container** - Card, Panel, or layout
2. **Add components in visual order** - Top to bottom, left to right
3. **Use appropriate layouts** - Vertical for forms, Horizontal for toolbars
4. **Include validation hints** - required, min, max, pattern
5. **Add navigation** - Use `@Target` for buttons that navigate

### When Reading Wireframe to Generate Code

1. **Map components to framework equivalents**:
   - `Button` ? `<button>`, `<Button>`, `<v-btn>`
   - `TextInput` ? `<input type="text">`, `<TextField>`
   - `Vertical` ? flexbox column, Stack
   
2. **Preserve IDs** - Use `:id` values as element IDs/refs
3. **Implement bindings** - `?path` becomes data bindings
4. **Handle navigation** - `@Target` becomes routing/navigation
5. **Apply validation** - `required`, `pattern` become form validation

---

## Output Format Guidelines

### Always Include
- Document wrapper: `uiwire <style>` ... `/uiwire`
- Proper indentation (4 spaces per level)
- Closing tags for all blocks

### Prefer
- Meaningful IDs over generic ones
- Explicit layout components over implicit stacking
- Modifiers over attributes when available

### Avoid
- Styling details (colors, fonts, specific pixels)
- Business logic or event handlers
- Framework-specific syntax
- Deeply nested structures (max 4-5 levels)

---

## Validation Checklist

When generating Wireframe, verify:

- [ ] Document starts with `uiwire <style>` and ends with `/uiwire`
- [ ] All blocks are properly closed with `/Keyword`
- [ ] Indentation is consistent (4 spaces)
- [ ] IDs are unique within the document
- [ ] Required components have meaningful IDs
- [ ] Layout hierarchy makes visual sense
- [ ] No orphaned closing tags

---

## Example Prompt Templates

### Screenshot to Wireframe
```
Analyze this screenshot and generate a Wireframe document describing the UI structure.
Focus on the component hierarchy, layout, and key interactive elements.
Use the 'clean' style.
```

### Description to Wireframe
```
Create a Wireframe document for: [description]
Include appropriate IDs for interactive elements.
Use Vertical/Horizontal layouts as appropriate.
```

### Wireframe to React
```
Convert this Wireframe document to a React component.
Map components as follows:
- Button ? <button> or <Button> from UI library
- TextInput ? <input type="text">
- Vertical ? flexbox column div
Preserve the IDs as element ids or refs.
```

---

*Wireframe Language Instructions v1.0 - 2025*
