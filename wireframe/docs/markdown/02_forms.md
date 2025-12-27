# Form Components

This document covers form controls and input elements.

## Text Inputs

Basic text input fields.

```wireframe
wireframe clean
    Vertical gap=12 w=300
        TextInput placeholder="Enter your name"
        TextInput placeholder="Email" required
        TextInput "John Doe"
        TextInput placeholder="Disabled" disabled
        TextInput placeholder="Read only" readonly
/wireframe
```

### TextInput Modifiers
- `required` - Shows asterisk indicator
- `disabled` - Grayed out, non-interactive
- `readonly` - Visible but not editable

## Specialized Inputs

Different input types for specific data.

```wireframe
wireframe clean
    Vertical gap=12 w=300
        PasswordInput placeholder="Password"
        DateInput placeholder="Select date"
        NumberInput placeholder="Enter number"
/wireframe
```

## TextArea

Multi-line text input.

```wireframe
wireframe clean
    TextArea placeholder="Enter description..." w=300 h=100
/wireframe
```

## Checkboxes

Toggle options on or off.

```wireframe
wireframe clean
    Vertical gap=8
        Checkbox "Accept terms and conditions"
        Checkbox "Subscribe to newsletter" checked
        Checkbox "Disabled option" disabled
        Checkbox "Indeterminate" indeterminate
/wireframe
```

### Checkbox Modifiers
- `checked` - Pre-selected state
- `disabled` - Non-interactive
- `indeterminate` - Partial selection state

## Radio Buttons

Select one option from a group.

```wireframe
wireframe clean
    Vertical gap=8
        Radio "Option A"
        Radio "Option B" selected
        Radio "Option C"
        Radio "Disabled" disabled
/wireframe
```

## Switches

Toggle on/off controls.

```wireframe
wireframe clean
    Vertical gap=8
        Switch "Enable notifications"
        Switch "Dark mode" checked
        Switch "Disabled" disabled
/wireframe
```

## Sliders

Range selection controls.

```wireframe
wireframe clean
    Vertical gap=16 w=300
        Slider value=50
        Slider value=75
        Slider value=25 disabled
/wireframe
```

## Dropdowns

Selection from a list of options.

```wireframe
wireframe clean
    Vertical gap=12 w=200
        Dropdown "Select country"
            Option "United States"
            Option "Canada"
            Option "United Kingdom"
            Option "Germany"
        /Dropdown
        
        Dropdown "Color" expanded
            Option "Red" selected
            Option "Green"
            Option "Blue"
        /Dropdown
/wireframe
```

### Dropdown Modifiers
- `expanded` - Show dropdown open
- Options use `selected` for pre-selected item

## Complete Form Example

A typical form layout combining multiple elements.

```wireframe
wireframe clean
    Card w=400 padding=20
        Vertical gap=16
            Heading "Contact Form" level=2
            
            Vertical gap=4
                Label "Full Name"
                TextInput placeholder="John Doe" required
            /Vertical
            
            Vertical gap=4
                Label "Email Address"
                TextInput placeholder="john@example.com" required
            /Vertical
            
            Vertical gap=4
                Label "Subject"
                Dropdown "Select a topic"
                    Option "General Inquiry"
                    Option "Technical Support"
                    Option "Billing Question"
                /Dropdown
            /Vertical
            
            Vertical gap=4
                Label "Message"
                TextArea placeholder="Your message here..." h=100
            /Vertical
            
            Checkbox "Send me a copy of this message"
            
            Horizontal gap=8
                Button "Submit" primary
                Button "Cancel"
            /Horizontal
        /Vertical
    /Card
/wireframe
```

## Login Form Example

```wireframe
wireframe clean
    Card w=350 padding=24
        Vertical gap=16
            Heading "Sign In" level=2
            
            Vertical gap=4
                Label "Username"
                TextInput placeholder="Enter username"
            /Vertical
            
            Vertical gap=4
                Label "Password"
                PasswordInput placeholder="Enter password"
            /Vertical
            
            Horizontal gap=8
                Checkbox "Remember me"
                Spacer
                Link "Forgot password?"
            /Horizontal
            
            Button "Sign In" primary w=100%
            
            Separator
            
            Label "Don't have an account?"
            Link "Create account"
        /Vertical
    /Card
/wireframe
```

## Search Form

```wireframe
wireframe clean
    Horizontal gap=8 w=400
        TextInput placeholder="Search..." w=300
        IconButton icon=search primary
/wireframe
```
