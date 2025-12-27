# Examples Gallery

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active

---

## 1. Overview

This document provides a collection of example wireframes demonstrating the Wireframe DSL capabilities.

---

## 2. Basic Examples

### 2.1 Simple Button

```wireframe
wireframe clean
    Button "Click Me" primary
/wireframe
```

### 2.2 Button Variants

```wireframe
wireframe clean
    Vertical gap=16
        Button "Primary" primary
        Button "Secondary" secondary
        Button "Default"
        Button "Disabled" disabled
    /Vertical
/wireframe
```

### 2.3 Text Input

```wireframe
wireframe clean
    Vertical gap=12
        TextInput "Username" ?username required
        TextInput "Email" ?email
        TextInput "Password" ?password
        TextInput "Disabled" ?disabled disabled
    /Vertical
/wireframe
```

---

## 3. Form Examples

### 3.1 Login Form

```wireframe
wireframe clean
    Card width=320
        Heading "Login" level=2
        Vertical gap=16
            TextInput "Email" ?email required
            TextInput "Password" ?password required
            Checkbox "Remember me" ?remember
            Button "Sign In" primary
            Link "Forgot password?" @forgot
        /Vertical
    /Card
/wireframe
```

### 3.2 Registration Form

```wireframe
wireframe clean
    Card width=400
        Heading "Create Account" level=2
        Vertical gap=16
            Horizontal gap=16
                TextInput "First Name" ?firstName required
                TextInput "Last Name" ?lastName required
            /Horizontal
            TextInput "Email Address" ?email required
            TextInput "Password" ?password required
            TextInput "Confirm Password" ?confirmPassword required
            Checkbox "I agree to Terms of Service" ?terms required
            Button "Create Account" primary
        /Vertical
    /Card
/wireframe
```

### 3.3 Settings Form

```wireframe
wireframe clean
    Card width=480
        Heading "Settings" level=2
        Vertical gap=24
            Group "Profile"
                TextInput "Display Name" ?displayName
                Textarea "Bio" ?bio rows=3
                Image ?avatar width=80 height=80 circle
            /Group
            
            Group "Notifications"
                Switch "Email notifications" ?emailNotif checked
                Switch "Push notifications" ?pushNotif
                Switch "Weekly digest" ?weeklyDigest checked
            /Group
            
            Group "Privacy"
                RadioGroup ?visibility
                    RadioButton "Public" value="public"
                    RadioButton "Private" value="private"
                    RadioButton "Friends only" value="friends"
                /RadioGroup
            /Group
            
            Horizontal gap=16
                Button "Cancel" secondary
                Button "Save Changes" primary
            /Horizontal
        /Vertical
    /Card
/wireframe
```

---

## 4. Layout Examples

### 4.1 Two-Column Layout

```wireframe
wireframe clean
    Horizontal gap=24
        Card width=200
            Heading "Left Column" level=3
            Label "Sidebar content"
        /Card
        Card width=400
            Heading "Main Content" level=3
            Label "Primary content area"
        /Card
    /Horizontal
/wireframe
```

### 4.2 Grid Layout

```wireframe
wireframe clean
    Grid columns=3 gap=16
        Card
            Label "Item 1"
        /Card
        Card
            Label "Item 2"
        /Card
        Card
            Label "Item 3"
        /Card
        Card
            Label "Item 4"
        /Card
        Card
            Label "Item 5"
        /Card
        Card
            Label "Item 6"
        /Card
    /Grid
/wireframe
```

### 4.3 Dock Layout

```wireframe
wireframe clean
    Dock width=800 height=600
        Header dock=top height=64
            Horizontal gap=16
                Heading "MyApp" level=1
                Horizontal gap=8
                    Link "Home" @home
                    Link "About" @about
                    Link "Contact" @contact
                /Horizontal
                Button "Sign In" primary
            /Horizontal
        /Header
        
        Sidebar dock=left width=200
            Menu
                MenuItem "Dashboard" $icon:home active
                MenuItem "Projects" $icon:folder
                MenuItem "Tasks" $icon:check
                MenuItem "Reports" $icon:chart
                MenuItem "Settings" $icon:settings
            /Menu
        /Sidebar
        
        Content dock=fill
            Heading "Dashboard" level=2
            Label "Welcome to your dashboard"
        /Content
        
        Footer dock=bottom height=40
            Label "© 2025 MyApp"
        /Footer
    /Dock
/wireframe
```

---

## 5. Navigation Examples

### 5.1 Tab Navigation

```wireframe
wireframe clean
    Card width=500
        TabGroup ?activeTab
            Tab "Overview"
                Label "Overview content goes here"
            /Tab
            Tab "Details" active
                Vertical gap=16
                    TextInput "Name" ?name
                    TextInput "Description" ?desc
                /Vertical
            /Tab
            Tab "Settings"
                Label "Settings content"
            /Tab
        /TabGroup
    /Card
/wireframe
```

### 5.2 Sidebar Menu

```wireframe
wireframe clean
    Card width=240
        Heading "Navigation" level=3
        Menu
            MenuItem "Home" $icon:home active
            MenuItem "Documents" $icon:file
            MenuItem "Images" $icon:image
            Separator
            MenuItem "Settings" $icon:settings
            MenuItem "Help" $icon:help
        /Menu
    /Card
/wireframe
```

### 5.3 Breadcrumb Navigation

```wireframe
wireframe clean
    Breadcrumb
        Breadcrumb "Home" @home
        Breadcrumb "Products" @products
        Breadcrumb "Electronics" @electronics
        Breadcrumb "Laptops" active
    /Breadcrumb
/wireframe
```

### 5.4 Wizard Steps

```wireframe
wireframe clean
    Card width=600
        Stepper ?step
            Step "Account" completed
            Step "Profile" active
            Step "Review"
            Step "Complete"
        /Stepper
        
        Vertical gap=24
            Heading "Profile Information" level=2
            TextInput "First Name" ?firstName required
            TextInput "Last Name" ?lastName required
            Textarea "About" ?about
            
            Horizontal gap=16
                Button "Back" secondary
                Button "Continue" primary
            /Horizontal
        /Vertical
    /Card
/wireframe
```

---

## 6. Data Display Examples

### 6.1 Simple Table

```wireframe
wireframe clean
    Table
        Column "Name" sortable
        Column "Email" sortable
        Column "Role"
        Column "Status"
        Column "Actions"
        
        Row
            Cell "John Doe"
            Cell "john@example.com"
            Cell "Admin"
            Cell
                Badge "Active" color=green
            /Cell
            Cell
                Horizontal gap=8
                    IconButton $icon:edit
                    IconButton $icon:trash
                /Horizontal
            /Cell
        /Row
        Row
            Cell "Jane Smith"
            Cell "jane@example.com"
            Cell "User"
            Cell
                Badge "Pending" color=yellow
            /Cell
            Cell
                Horizontal gap=8
                    IconButton $icon:edit
                    IconButton $icon:trash
                /Horizontal
            /Cell
        /Row
    /Table
/wireframe
```

### 6.2 Data Cards

```wireframe
wireframe clean
    Grid columns=3 gap=16
        Card
            Image ?product1 width=200 height=150
            Heading "Product 1" level=3
            Label "Description of product 1"
            Horizontal gap=8
                Badge "$99.99"
                Badge "In Stock" color=green
            /Horizontal
            Button "Add to Cart" primary
        /Card
        Card
            Image ?product2 width=200 height=150
            Heading "Product 2" level=3
            Label "Description of product 2"
            Horizontal gap=8
                Badge "$149.99"
                Badge "Low Stock" color=yellow
            /Horizontal
            Button "Add to Cart" primary
        /Card
        Card
            Image ?product3 width=200 height=150
            Heading "Product 3" level=3
            Label "Description of product 3"
            Horizontal gap=8
                Badge "$199.99"
                Badge "Out of Stock" color=red
            /Horizontal
            Button "Add to Cart" disabled
        /Card
    /Grid
/wireframe
```

### 6.3 List View

```wireframe
wireframe clean
    List
        ListItem removable
            Checkbox "Buy groceries" ?todo1
        /ListItem
        ListItem removable
            Checkbox "Review pull request" ?todo2 checked
        /ListItem
        ListItem removable
            Checkbox "Update documentation" ?todo3
        /ListItem
        ListItem removable
            Checkbox "Deploy to production" ?todo4
        /ListItem
    /List
/wireframe
```

---

## 7. Dialog Examples

### 7.1 Confirmation Dialog

```wireframe
wireframe clean
    Dialog width=400
        Heading "Delete Item?" level=2
        Label "Are you sure you want to delete this item? This action cannot be undone."
        Horizontal gap=16
            Button "Cancel" secondary
            Button "Delete" primary
        /Horizontal
    /Dialog
/wireframe
```

### 7.2 Form Dialog

```wireframe
wireframe clean
    Dialog width=480
        Heading "Edit Profile" level=2
        Vertical gap=16
            TextInput "Name" ?name
            TextInput "Email" ?email
            Textarea "Bio" ?bio rows=3
        /Vertical
        Horizontal gap=16
            Button "Cancel" secondary
            Button "Save" primary
        /Horizontal
    /Dialog
/wireframe
```

---

## 8. Complex Examples

### 8.1 Dashboard

```wireframe
wireframe clean
    %title: Admin Dashboard
    
    Dock width=1200 height=800
        Header dock=top height=64
            Horizontal gap=16
                Heading "Dashboard" level=1
                Horizontal gap=8
                    Button "Notifications" $icon:bell
                    Avatar ?user
                /Horizontal
            /Horizontal
        /Header
        
        Sidebar dock=left width=220
            Menu
                MenuItem "Overview" $icon:home active
                MenuItem "Analytics" $icon:chart
                MenuItem "Customers" $icon:users
                MenuItem "Products" $icon:box
                MenuItem "Orders" $icon:cart
                Separator
                MenuItem "Settings" $icon:settings
            /Menu
        /Sidebar
        
        Content dock=fill padding=24
            Grid columns=4 gap=16
                Card
                    Label "Total Revenue"
                    Heading "$45,231" level=2
                    Badge "+20.1%" color=green
                /Card
                Card
                    Label "Subscriptions"
                    Heading "2,350" level=2
                    Badge "+180.1%" color=green
                /Card
                Card
                    Label "Sales"
                    Heading "12,234" level=2
                    Badge "+19%" color=green
                /Card
                Card
                    Label "Active Now"
                    Heading "573" level=2
                    Badge "+201" color=green
                /Card
            /Grid
            
            Horizontal gap=24
                Card width=600
                    Heading "Recent Sales" level=3
                    List
                        ListItem
                            Horizontal gap=16
                                Avatar ?avatar1
                                Vertical
                                    Label "Olivia Martin"
                                    Label "olivia.martin@email.com"
                                /Vertical
                                Label "+$1,999.00"
                            /Horizontal
                        /ListItem
                        ListItem
                            Horizontal gap=16
                                Avatar ?avatar2
                                Vertical
                                    Label "Jackson Lee"
                                    Label "jackson.lee@email.com"
                                /Vertical
                                Label "+$39.00"
                            /Horizontal
                        /ListItem
                    /List
                /Card
                Card
                    Heading "Overview" level=3
                    Chart ?revenueChart type=bar
                /Card
            /Horizontal
        /Content
    /Dock
/wireframe
```

### 8.2 E-commerce Product Page

```wireframe
wireframe clean
    %title: Product Page
    
    Vertical gap=32
        Breadcrumb
            Breadcrumb "Home" @home
            Breadcrumb "Electronics" @electronics
            Breadcrumb "Laptops" @laptops
            Breadcrumb "MacBook Pro" active
        /Breadcrumb
        
        Horizontal gap=48
            Image ?productImage width=500 height=400
            
            Vertical gap=16 width=400
                Heading "MacBook Pro 14-inch" level=1
                
                Horizontal gap=8
                    Rating ?rating value=4.5 readonly
                    Link "142 reviews" @reviews
                /Horizontal
                
                Heading "$1,999.00" level=2
                
                Label "The most powerful MacBook Pro ever is here."
                
                Group "Color"
                    RadioGroup ?color
                        RadioButton "Space Gray" value="gray" checked
                        RadioButton "Silver" value="silver"
                    /RadioGroup
                /Group
                
                Group "Memory"
                    RadioGroup ?memory
                        RadioButton "16GB" value="16"
                        RadioButton "32GB" value="32" checked
                        RadioButton "64GB" value="64"
                    /RadioGroup
                /Group
                
                Horizontal gap=16
                    NumberInput ?quantity value=1 min=1 max=10
                    Button "Add to Cart" primary
                    IconButton $icon:heart
                /Horizontal
            /Vertical
        /Horizontal
        
        TabGroup
            Tab "Description"
                Label "Full product description..."
            /Tab
            Tab "Specifications"
                Table
                    Row
                        Cell "Processor"
                        Cell "Apple M3 Pro"
                    /Row
                    Row
                        Cell "Display"
                        Cell "14.2-inch Liquid Retina XDR"
                    /Row
                    Row
                        Cell "Battery"
                        Cell "Up to 17 hours"
                    /Row
                /Table
            /Tab
            Tab "Reviews"
                Label "Customer reviews..."
            /Tab
        /TabGroup
    /Vertical
/wireframe
```

### 8.3 Chat Interface

```wireframe
wireframe clean
    %title: Chat
    
    Dock width=400 height=600
        Header dock=top height=56
            Horizontal gap=12
                Avatar ?userAvatar
                Vertical
                    Label "John Doe"
                    Label "Online" color=green
                /Vertical
                IconButton $icon:more
            /Horizontal
        /Header
        
        Content dock=fill
            Vertical gap=12 padding=16
                Bubble "Hey, how are you?" align=left
                Bubble "I'm doing great! Just finished the wireframe." align=right
                Bubble "That's awesome! Can you share it?" align=left
                Bubble "Sure, I'll send it right now." align=right
                Bubble "Here's the file:" align=right
                Attachment "wireframe.pdf" $icon:file
            /Vertical
        /Content
        
        Footer dock=bottom height=64
            Horizontal gap=8 padding=16
                TextInput "Type a message..." ?message
                IconButton $icon:attach
                IconButton $icon:send primary
            /Horizontal
        /Footer
    /Dock
/wireframe
```

---

## 9. Style Variants

### 9.1 Sketch Style

```wireframe
wireframe sketch
    Card width=300
        Heading "Sketch Style" level=2
        Label "Hand-drawn wireframe look"
        Button "Action" primary
    /Card
/wireframe
```

### 9.2 Blueprint Style

```wireframe
wireframe blueprint
    Card width=300
        Heading "Blueprint Style" level=2
        Label "Technical blueprint aesthetic"
        Button "Action" primary
    /Card
/wireframe
```

### 9.3 Minimal Style

```wireframe
wireframe minimal
    Card width=300
        Heading "Minimal Style" level=2
        Label "Clean minimal design"
        Button "Action" primary
    /Card
/wireframe
```

---

## 10. Related Documents

| Document | Description |
|----------|-------------|
| [00_Language_Specification](./00_Language_Specification.md) | Full DSL syntax |
| [06_Component_Library](./06_Component_Library.md) | All components |
| [07_Theming_System](./07_Theming_System.md) | Styling options |

---

*Examples Gallery v1.0 - December 2025*
