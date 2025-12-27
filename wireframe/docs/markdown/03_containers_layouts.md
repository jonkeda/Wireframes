# Containers and Layouts

This document covers container components and layout systems.

## Layout Containers

### Vertical Layout

Stack children top to bottom.

```wireframe
wireframe clean
    Vertical gap=8
        Button "First"
        Button "Second"
        Button "Third"
    /Vertical
/wireframe
```

### Horizontal Layout

Stack children left to right.

```wireframe
wireframe clean
    Horizontal gap=8
        Button "Left"
        Button "Center"
        Button "Right"
    /Horizontal
/wireframe
```

### Grid Layout

Arrange children in a grid pattern.

```wireframe
wireframe clean
    Grid cols=3 gap=8
        Button "1"
        Button "2"
        Button "3"
        Button "4"
        Button "5"
        Button "6"
    /Grid
/wireframe
```

#### Grid Positioning

Use `grid=row,col,rowSpan,colSpan` for precise positioning.

```wireframe
wireframe clean
    Grid cols=3 rows=3 gap=8
        Button "Span 2 cols" grid=0,0,1,2
        Button "Normal" grid=0,2,1,1
        Button "Tall" grid=1,0,2,1
        Button "Center" grid=1,1,1,1
        Button "Bottom" grid=1,2,1,1
        Button "Wide" grid=2,1,1,2
    /Grid
/wireframe
```

### Canvas Layout

Absolute positioning with `canvas=x,y`.

```wireframe
wireframe clean
    Canvas w=400 h=200
        Button "Top Left" canvas=10,10
        Button "Center" canvas=160,80
        Button "Bottom Right" canvas=290,160
    /Canvas
/wireframe
```

### Dock Layout

Position children relative to edges.

```wireframe
wireframe clean
    Dock w=400 h=300
        Header dock=top h=50
            Label "Top Header"
        /Header
        Footer dock=bottom h=40
            Label "Bottom Footer"
        /Footer
        Sidebar dock=left w=100
            Label "Left"
        /Sidebar
        Content dock=fill
            Label "Main Content"
        /Content
    /Dock
/wireframe
```

### Scroll Layout

Enable scrolling for overflow content.

```wireframe
wireframe clean
    Scroll w=200 h=150
        Vertical gap=8
            Button "Item 1"
            Button "Item 2"
            Button "Item 3"
            Button "Item 4"
            Button "Item 5"
            Button "Item 6"
        /Vertical
    /Scroll
/wireframe
```

## Section Containers

### Card

Rounded container with shadow.

```wireframe
wireframe clean
    Card w=300 padding=16
        Vertical gap=8
            Heading "Card Title" level=3
            Label "Card content goes here"
            Button "Action"
        /Vertical
    /Card
/wireframe
```

### Panel

Basic bordered container.

```wireframe
wireframe clean
    Panel w=300 padding=16
        Vertical gap=8
            Label "Panel content"
        /Vertical
    /Panel
/wireframe
```

### Header

Top section container.

```wireframe
wireframe clean
    Header w=400 h=60 padding=16
        Horizontal gap=8
            Label "**App Name**"
            Spacer
            Button "Login"
        /Horizontal
    /Header
/wireframe
```

### Footer

Bottom section container.

```wireframe
wireframe clean
    Footer w=400 h=50 padding=12
        Label "© 2024 Company Name"
    /Footer
/wireframe
```

### Sidebar

Side navigation container.

```wireframe
wireframe clean
    Sidebar w=200 h=300 padding=12
        Vertical gap=4
            Button "Dashboard" w=100%
            Button "Settings" w=100%
            Button "Profile" w=100%
        /Vertical
    /Sidebar
/wireframe
```

### Content

Main content area.

```wireframe
wireframe clean
    Content w=400 padding=20
        Vertical gap=16
            Heading "Welcome" level=1
            Label "Main content area"
        /Vertical
    /Content
/wireframe
```

### Toolbar

Action bar with tools.

```wireframe
wireframe clean
    Toolbar w=400 h=50 padding=8
        Horizontal gap=8
            IconButton icon=bold
            IconButton icon=italic
            IconButton icon=underline
            Separator
            IconButton icon=align-left
            IconButton icon=align-center
            IconButton icon=align-right
        /Horizontal
    /Toolbar
/wireframe
```

## Overlays

### Dialog

Modal dialog box.

```wireframe
wireframe clean
    Dialog "Confirm Action" w=350 h=180 padding=20
        Vertical gap=16
            Label "Are you sure you want to delete this item?"
            Horizontal gap=8
                Spacer
                Button "Cancel"
                Button "Delete" primary
            /Horizontal
        /Vertical
    /Dialog
/wireframe
```

### Modal

Full modal overlay.

```wireframe
wireframe clean
    Modal w=400 h=250 padding=20
        Vertical gap=16
            Heading "Modal Title" level=2
            Label "Modal content goes here."
            Spacer
            Horizontal gap=8
                Spacer
                Button "Close" primary
            /Horizontal
        /Vertical
    /Modal
/wireframe
```

### Drawer

Sliding side panel.

```wireframe
wireframe clean
    Drawer w=300 h=400 padding=16
        Vertical gap=16
            Heading "Settings" level=3
            Separator
            Switch "Dark Mode"
            Switch "Notifications"
            Switch "Auto-save"
        /Vertical
    /Drawer
/wireframe
```

## Complete Page Layout Example

```wireframe
wireframe clean
    Vertical w=800 h=600
        Header h=60 padding=16
            Horizontal gap=16
                Label "**MyApp**"
                Spacer
                Link "Home"
                Link "About"
                Link "Contact"
                Button "Sign In" primary
            /Horizontal
        /Header
        
        Horizontal h=480
            Sidebar w=200 padding=12
                Vertical gap=8
                    Button "Dashboard" w=100%
                    Button "Projects" w=100%
                    Button "Tasks" w=100%
                    Button "Reports" w=100%
                /Vertical
            /Sidebar
            
            Content padding=20
                Vertical gap=16
                    Heading "Dashboard" level=1
                    
                    Grid cols=3 gap=16
                        Card padding=16
                            Vertical gap=4
                                Label "Total Users"
                                Heading "1,234" level=2
                            /Vertical
                        /Card
                        Card padding=16
                            Vertical gap=4
                                Label "Revenue"
                                Heading "$5,678" level=2
                            /Vertical
                        /Card
                        Card padding=16
                            Vertical gap=4
                                Label "Active Projects"
                                Heading "42" level=2
                            /Vertical
                        /Card
                    /Grid
                /Vertical
            /Content
        /Horizontal
        
        Footer h=40 padding=12
            Label "© 2024 MyApp Inc."
        /Footer
    /Vertical
/wireframe
```
