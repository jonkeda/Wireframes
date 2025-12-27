# Navigation Components

This document covers navigation and menu components.

## Tabs

Tabbed navigation interface.

```wireframe
wireframe clean
    Tabs w=400
        Tab "Overview" active
        Tab "Details"
        Tab "Settings"
        Tab "History"
    /Tabs
/wireframe
```

### Tab Modifiers
- `active` - Currently selected tab

## Menu

Vertical menu list.

```wireframe
wireframe clean
    Menu w=200
        MenuItem "Dashboard" icon=home
        MenuItem "Projects" icon=folder
        MenuItem "Tasks" icon=check
        Separator
        MenuItem "Settings" icon=settings
        MenuItem "Help" icon=help
    /Menu
/wireframe
```

### Menu with Active Item

```wireframe
wireframe clean
    Menu w=200
        MenuItem "Dashboard" icon=home selected
        MenuItem "Projects" icon=folder
        MenuItem "Tasks" icon=check
    /Menu
/wireframe
```

## Breadcrumb

Show navigation path.

```wireframe
wireframe clean
    Breadcrumb
        "Home"
        "Products"
        "Electronics"
        "Laptops"
    /Breadcrumb
/wireframe
```

## Pagination

Page navigation controls.

```wireframe
wireframe clean
    Pagination page=3 total=10
/wireframe
```

### Pagination Attributes
- `page` - Current page number
- `total` - Total number of pages

## Stepper

Step progress indicator.

```wireframe
wireframe clean
    Stepper steps=4 current=2
/wireframe
```

### Stepper with Labels

```wireframe
wireframe clean
    Stepper steps=4 current=2
        "Account"
        "Personal"
        "Payment"
        "Confirm"
    /Stepper
/wireframe
```

## Accordion

Expandable sections.

```wireframe
wireframe clean
    Accordion w=400
        AccordionSection "Section 1" expanded
            Label "Content for section 1"
        /AccordionSection
        AccordionSection "Section 2"
            Label "Content for section 2"
        /AccordionSection
        AccordionSection "Section 3"
            Label "Content for section 3"
        /AccordionSection
    /Accordion
/wireframe
```

### AccordionSection Modifiers
- `expanded` - Section is open

## Tree View

Hierarchical tree navigation.

```wireframe
wireframe clean
    Tree w=250
        TreeItem "Documents" expanded
            TreeItem "Work"
                TreeItem "Project A"
                TreeItem "Project B"
            /TreeItem
            TreeItem "Personal"
        /TreeItem
        TreeItem "Downloads"
        TreeItem "Pictures" expanded
            TreeItem "Vacation 2024"
            TreeItem "Screenshots"
        /TreeItem
    /Tree
/wireframe
```

### TreeItem Modifiers
- `expanded` - Show children (shows +/- indicator)
- Children without their own children won't show +/- indicators

## Complete Navigation Example

Header with navigation, sidebar menu, and content tabs.

```wireframe
wireframe clean
    Vertical w=800 h=500
        Header h=60 padding=16
            Horizontal gap=24
                Label "**Logo**"
                
                Horizontal gap=16
                    Link "Products"
                    Link "Solutions"
                    Link "Pricing"
                    Link "About"
                /Horizontal
                
                Spacer
                
                Breadcrumb
                    "Home"
                    "Products"
                    "Category"
                /Breadcrumb
            /Horizontal
        /Header
        
        Horizontal h=380
            Sidebar w=200 padding=12
                Menu w=176
                    MenuItem "Overview" icon=home selected
                    MenuItem "Analytics" icon=chart
                    MenuItem "Reports" icon=document
                    Separator
                    MenuItem "Settings" icon=settings
                /Menu
            /Sidebar
            
            Content padding=20
                Vertical gap=16
                    Tabs
                        Tab "Summary" active
                        Tab "Details"
                        Tab "History"
                    /Tabs
                    
                    Card padding=16
                        Vertical gap=8
                            Label "Tab content area"
                            Label "More content here..."
                        /Vertical
                    /Card
                /Vertical
            /Content
        /Horizontal
        
        Footer h=50 padding=12
            Horizontal gap=16
                Label "© 2024 Company"
                Spacer
                Pagination page=2 total=5
            /Horizontal
        /Footer
    /Vertical
/wireframe
```

## Wizard Pattern with Stepper

```wireframe
wireframe clean
    Card w=500 padding=24
        Vertical gap=24
            Stepper steps=4 current=2
            
            Heading "Step 2: Personal Information" level=2
            
            Vertical gap=12
                Horizontal gap=12
                    Vertical gap=4
                        Label "First Name"
                        TextInput placeholder="John"
                    /Vertical
                    Vertical gap=4
                        Label "Last Name"
                        TextInput placeholder="Doe"
                    /Vertical
                /Horizontal
                
                Vertical gap=4
                    Label "Email Address"
                    TextInput placeholder="john@example.com"
                /Vertical
            /Vertical
            
            Horizontal gap=8
                Button "Back"
                Spacer
                Button "Continue" primary
            /Horizontal
        /Vertical
    /Card
/wireframe
```
