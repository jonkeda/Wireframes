# Themes

The Wireframe DSL supports multiple visual themes to match different design stages and presentation contexts.

## Available Themes

### Clean Theme (Default)

Modern, polished design suitable for client presentations.

```wireframe
wireframe clean
    Card w=300 padding=16
        Vertical gap=12
            Heading "Clean Theme" level=2
            Label "Modern and polished"
            Button "Primary Action" primary
            TextInput placeholder="Enter text"
        /Vertical
    /Card
/wireframe
```

**Characteristics:**
- Rounded corners (8px radius)
- Clean gray borders
- System font stack
- Subtle shadows

### Sketch Theme

Hand-drawn, wireframe aesthetic with sketchy lines.

```wireframe
wireframe sketch
    Card w=300 padding=16
        Vertical gap=12
            Heading "Sketch Theme" level=2
            Label "Hand-drawn look"
            Button "Primary Action" primary
            TextInput placeholder="Enter text"
        /Vertical
    /Card
/wireframe
```

**Characteristics:**
- Wobbly, hand-drawn lines
- Comic Sans font
- No rounded corners (sketchy paths)
- Emphasizes "work in progress" nature

### Blueprint Theme

Technical drawing style, ideal for development specs.

```wireframe
wireframe blueprint
    Card w=300 padding=16
        Vertical gap=12
            Heading "Blueprint Theme" level=2
            Label "Technical drawing style"
            Button "Primary Action" primary
            TextInput placeholder="Enter text"
        /Vertical
    /Card
/wireframe
```

**Characteristics:**
- Dark blue background
- White/light blue elements
- Monospace font
- Grid-like precision

### Realistic Theme

High-fidelity preview closer to final design.

```wireframe
wireframe realistic
    Card w=300 padding=16
        Vertical gap=12
            Heading "Realistic Theme" level=2
            Label "Near-production look"
            Button "Primary Action" primary
            TextInput placeholder="Enter text"
        /Vertical
    /Card
/wireframe
```

**Characteristics:**
- More refined styling
- Better shadows
- Production-like appearance

## Theme Comparison

Side-by-side comparison of all themes.

```wireframe
wireframe clean
    Horizontal gap=20
        Card w=200 padding=12
            Vertical gap=8
                Label "**Clean**"
                Button "Button" primary
                TextInput placeholder="Input"
                Checkbox "Option" checked
            /Vertical
        /Card
    /Horizontal
/wireframe
```

```wireframe
wireframe sketch
    Horizontal gap=20
        Card w=200 padding=12
            Vertical gap=8
                Label "**Sketch**"
                Button "Button" primary
                TextInput placeholder="Input"
                Checkbox "Option" checked
            /Vertical
        /Card
    /Horizontal
/wireframe
```

```wireframe
wireframe blueprint
    Horizontal gap=20
        Card w=200 padding=12
            Vertical gap=8
                Label "**Blueprint**"
                Button "Button" primary
                TextInput placeholder="Input"
                Checkbox "Option" checked
            /Vertical
        /Card
    /Horizontal
/wireframe
```

```wireframe
wireframe realistic
    Horizontal gap=20
        Card w=200 padding=12
            Vertical gap=8
                Label "**Realistic**"
                Button "Button" primary
                TextInput placeholder="Input"
                Checkbox "Option" checked
            /Vertical
        /Card
    /Horizontal
/wireframe
```

## Choosing the Right Theme

| Theme | Use Case | Audience |
|-------|----------|----------|
| **Clean** | Polished mockups, client demos | Stakeholders, clients |
| **Sketch** | Early concepts, brainstorming | Design team, early feedback |
| **Blueprint** | Technical specs, developer handoff | Engineering team |
| **Realistic** | High-fidelity prototypes | Final review, user testing |

## Theme-Specific Tips

### Sketch Theme

Best for emphasizing that designs are not final:

```wireframe
wireframe sketch
    Card w=350 padding=20
        Vertical gap=16
            Heading "Early Concept" level=2
            Label "This is a rough idea - feedback welcome!"
            
            TextInput placeholder="Search..."
            
            Vertical gap=8
                Checkbox "Feature A"
                Checkbox "Feature B"
                Checkbox "Feature C"
            /Vertical
            
            Horizontal gap=8
                Button "Approve"
                Button "Revise"
            /Horizontal
        /Vertical
    /Card
/wireframe
```

### Blueprint Theme

Ideal for developer documentation:

```wireframe
wireframe blueprint
    Vertical w=500 gap=16
        Heading "Component Specification" level=1
        
        Card padding=16
            Vertical gap=8
                Label "**LoginForm Component**"
                Label "Props: onSubmit, onForgotPassword"
                Label "State: username, password, loading"
            /Vertical
        /Card
        
        Card padding=16
            Vertical gap=8
                Label "Username"
                TextInput placeholder="string, required"
                Label "Password"
                PasswordInput placeholder="string, min 8 chars"
                Button "Submit" primary
            /Vertical
        /Card
    /Vertical
/wireframe
```

## Changing Themes in VS Code

1. Open a `.wire` file
2. Use `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
3. Type "Wireframe: Change Theme"
4. Select from: clean, sketch, blueprint, realistic

Or use the API programmatically:

```javascript
const { compile } = require('@jonkeda/wireframe-core');

const svg = compile(wireframeSource, {
  theme: 'sketch',
  width: 800,
  height: 600
});
```

## Document-Level Theme

Set the theme at the document level:

```wireframe
wireframe sketch
    %title: My Wireframe
    %theme: sketch
    
    Card w=300 padding=16
        Label "Uses sketch theme"
    /Card
/wireframe
```
