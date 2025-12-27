# Wireframes in Markdown

This document demonstrates how Wireframe diagrams can be embedded in Markdown documentation using fenced code blocks.

## How It Works

Wireframe diagrams can be embedded in Markdown using the `wireframe` language identifier in fenced code blocks:

~~~markdown
```wireframe
wireframe clean
    Button "Click Me"
/wireframe
```
~~~

When the **Markdown Preview Wireframe Support** extension is installed, these code blocks will render as SVG diagrams in the Markdown preview.

## Basic Example

A simple login form embedded in documentation:

```wireframe
wireframe clean
    Card w=350 padding=24
        Vertical gap=16
            Heading "Sign In" level=2
            
            Vertical gap=4
                Label "Email"
                TextInput placeholder="you@example.com"
            /Vertical
            
            Vertical gap=4
                Label "Password"
                PasswordInput placeholder="Enter password"
            /Vertical
            
            Checkbox "Remember me"
            Button "Sign In" primary w=100%
            
            Separator
            
            Link "Forgot password?"
        /Vertical
    /Card
/wireframe
```

## Dashboard Layout Example

A more complex dashboard wireframe:

```wireframe
wireframe clean
    Dock w=700 h=500
        Header dock=top h=60
            Horizontal padding=16
                Heading "Analytics Dashboard" level=2
                Spacer
                IconButton icon=bell
                Avatar "JD"
            /Horizontal
        /Header
        
        Sidebar dock=left w=180
            Vertical padding=8 gap=4
                Menu
                    MenuItem "Dashboard" icon=home selected
                    MenuItem "Analytics" icon=chart
                    MenuItem "Reports" icon=document
                    MenuItem "Settings" icon=settings
                /Menu
            /Vertical
        /Sidebar
        
        Content dock=fill
            Vertical padding=16 gap=16
                Grid cols=3 gap=16
                    Card padding=16
                        Vertical gap=8
                            Label "Total Users"
                            Heading "12,345" level=3
                            Badge "↑ 12%" variant=success
                        /Vertical
                    /Card
                    
                    Card padding=16
                        Vertical gap=8
                            Label "Revenue"
                            Heading "$45,678" level=3
                            Badge "↑ 8%" variant=success
                        /Vertical
                    /Card
                    
                    Card padding=16
                        Vertical gap=8
                            Label "Conversion"
                            Heading "3.2%" level=3
                            Badge "↓ 2%" variant=warning
                        /Vertical
                    /Card
                /Grid
                
                Card padding=16 h=200
                    Vertical gap=8
                        Heading "Activity Chart" level=4
                        Skeleton variant=rectangular h=150
                    /Vertical
                /Card
            /Vertical
        /Content
    /Dock
/wireframe
```

## Themed Examples

### Blueprint Theme

The blueprint theme is great for technical documentation:

```wireframe
wireframe blueprint
    Card w=400 padding=20
        Vertical gap=12
            Heading "API Response" level=3
            
            Table
                | Field | Type | Required |
                | name | string | Yes |
                | email | string | Yes |
                | age | number | No |
            /Table
            
            Horizontal gap=8
                Button "Validate" primary
                Button "Clear"
            /Horizontal
        /Vertical
    /Card
/wireframe
```

### Sketch Theme

The sketch theme adds a hand-drawn feel, perfect for early concepts:

```wireframe
wireframe sketch
    Vertical gap=16 w=300
        Heading "Quick Sketch" level=2
        
        TextInput placeholder="Search..."
        
        List
            "First item"
            "Second item"
            "Third item"
        /List
        
        Horizontal gap=8
            Button "Add" primary
            Button "Remove"
        /Horizontal
    /Vertical
/wireframe
```

## Mobile Layouts

Wireframes can represent mobile screens:

```wireframe
wireframe clean
    Vertical w=375 h=667
        Header h=44
            Horizontal padding=8
                IconButton icon=back
                Heading "Profile" level=4
                Spacer
                IconButton icon=more
            /Horizontal
        /Header
        
        Content
            Vertical padding=16 gap=16
                Horizontal gap=16
                    Avatar "JD" size=xl
                    Vertical gap=4
                        Heading "John Doe" level=3
                        Label "john@example.com"
                        Badge "Premium" variant=info
                    /Vertical
                /Horizontal
                
                Separator
                
                Menu
                    MenuItem "Edit Profile" icon=edit
                    MenuItem "Notifications" icon=bell
                    MenuItem "Privacy" icon=lock
                    MenuItem "Help" icon=help
                    Separator
                    MenuItem "Sign Out" icon=logout
                /Menu
            /Vertical
        /Content
        
        Footer h=50
            Horizontal
                IconButton icon=home
                IconButton icon=search
                IconButton icon=add
                IconButton icon=heart
                IconButton icon=user selected
            /Horizontal
        /Footer
    /Vertical
/wireframe
```

## Form Validation States

Showing different states of form controls:

```wireframe
wireframe clean
    Card w=400 padding=20
        Vertical gap=16
            Heading "Form States" level=3
            
            Vertical gap=4
                Label "Normal Input"
                TextInput placeholder="Enter text"
            /Vertical
            
            Vertical gap=4
                Label "Required Field *"
                TextInput placeholder="Required" required
            /Vertical
            
            Vertical gap=4
                Label "Disabled Input"
                TextInput placeholder="Cannot edit" disabled
            /Vertical
            
            Vertical gap=4
                Label "Read Only"
                TextInput "Fixed value" readonly
            /Vertical
        /Vertical
    /Card
/wireframe
```

## Component Catalog

Document your design system components:

```wireframe
wireframe clean
    Vertical gap=24 w=500
        Heading "Button Variants" level=2
        
        Horizontal gap=8
            Button "Default"
            Button "Primary" primary
            Button "Secondary" secondary
            Button "Disabled" disabled
        /Horizontal
        
        Separator
        
        Heading "Icon Buttons" level=2
        
        Horizontal gap=8
            IconButton icon=home
            IconButton icon=settings
            IconButton icon=search
            IconButton icon=menu
        /Horizontal
        
        Separator
        
        Heading "Badges" level=2
        
        Horizontal gap=8
            Badge "Default"
            Badge "Info" variant=info
            Badge "Success" variant=success
            Badge "Warning" variant=warning
            Badge "Error" variant=error
        /Horizontal
        
        Separator
        
        Heading "Progress" level=2
        
        Vertical gap=8 w=300
            Progress value=25
            Progress value=50
            Progress value=75
            Progress value=100
        /Vertical
    /Vertical
/wireframe
```

## Tips for Using Wireframes in Markdown

1. **Keep it simple** - Wireframes are for showing structure, not final designs
2. **Use appropriate themes** - Blueprint for technical docs, sketch for concepts
3. **Size appropriately** - Use `w=` and `h=` attributes to control dimensions
4. **Add context** - Always explain what the wireframe represents
5. **Group related wireframes** - Use headings to organize different views

## Next Steps

To use wireframes in your Markdown files:

1. Install the **Wireframe** extension for `.wire` file support
2. Install the **Markdown Preview Wireframe Support** extension (coming soon)
3. Use `wireframe` code blocks in your Markdown files
4. Open the Markdown preview to see rendered diagrams
