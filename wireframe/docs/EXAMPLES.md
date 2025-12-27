# Wireframe Examples

A collection of example wireframes demonstrating various UI patterns.

## Basic Examples

### Hello World

```wireframe
uiwire clean
    %title: Hello World
    
    Label "**Hello World**"
    Button "Click Me" primary
/uiwire
```

### Login Form

```wireframe
uiwire clean
    %title: Login Form
    
    Card w=300
        Vertical gap=16
            Label "**Login**"
            
            Label "Email:"
            TextInput "Enter your email" :txtEmail required
            
            Label "Password:"
            PasswordInput "Enter password" :txtPass required
            
            Checkbox "Remember me" :chkRemember
            
            Button "Sign In" :btnLogin primary
            Label "Forgot password?" @ForgotPassword
        /Vertical
    /Card
/uiwire
```

### Dashboard Header

```wireframe
uiwire clean
    Header
        Horizontal gap=16 justify=between
            Label "**Dashboard**"
            Spacer
            Icon $search
            Icon $notifications
            Avatar "JD" :avUser
        /Horizontal
    /Header
/uiwire
```

## Forms

### Registration Form

```wireframe
uiwire clean
    %title: Registration
    
    Card w=400
        Vertical gap=12
            Label "**Create Account**"
            
            Horizontal gap=8
                TextInput "First Name" :txtFirst
                TextInput "Last Name" :txtLast
            /Horizontal
            
            TextInput "Email" :txtEmail required pattern=email
            PasswordInput "Password" :txtPass required min=8
            PasswordInput "Confirm Password" :txtConfirm required
            
            Checkbox "I agree to the Terms of Service" :chkTerms required
            
            Button "Create Account" :btnCreate primary
            
            Separator
            
            Label "Already have an account?"
            Label "Sign in instead" @Login
        /Vertical
    /Card
/uiwire
```

### Contact Form

```wireframe
uiwire clean
    %title: Contact Us
    
    Card w=400
        Vertical gap=12
            Label "**Contact Us**"
            
            Label "Name:"
            TextInput "Your name" :txtName required
            
            Label "Email:"
            TextInput "Your email" :txtEmail required
            
            Label "Subject:"
            Dropdown :ddlSubject
                Option "General Inquiry"
                Option "Technical Support"
                Option "Sales"
                Option "Other"
            /Dropdown
            
            Label "Message:"
            TextArea "How can we help you?" :txtMessage rows=4
            
            Button "Send Message" :btnSend primary
        /Vertical
    /Card
/uiwire
```

### Settings Form

```wireframe
uiwire clean
    %title: Settings
    
    Card w=400
        Vertical gap=16
            Label "**Settings**"
            
            Label "**Notifications**"
            Switch "Email notifications" :swEmail
            Switch "Push notifications" :swPush checked=true
            
            Separator
            
            Label "**Privacy**"
            Switch "Public profile" :swPublic
            Switch "Show online status" :swOnline checked=true
            
            Separator
            
            Horizontal gap=8 justify=end
                Button "Cancel" @:back
                Button "Save Changes" :btnSave primary
            /Horizontal
        /Vertical
    /Card
/uiwire
```

## Navigation

### Sidebar Navigation

```wireframe
uiwire clean
    Sidebar w=200
        Vertical gap=4
            Label "MENU"
            MenuItem "Dashboard" icon=$home selected
            MenuItem "Projects" icon=$folder
            MenuItem "Tasks" icon=$check
            MenuItem "Calendar" icon=$calendar
            
            Separator
            
            Label "SETTINGS"
            MenuItem "Profile" icon=$user
            MenuItem "Preferences" icon=$settings
            MenuItem "Help" icon=$info
        /Vertical
    /Sidebar
/uiwire
```

### Tab Navigation

```wireframe
uiwire clean
    Tabs :tabMain
        Tab "Overview"
            Label "Overview content"
        /Tab
        Tab "Analytics"
            Label "Analytics content"
        /Tab
        Tab "Reports"
            Label "Reports content"
        /Tab
        Tab "Settings"
            Label "Settings content"
        /Tab
    /Tabs
/uiwire
```

### Breadcrumb Navigation

```wireframe
uiwire clean
    Breadcrumb
        BreadcrumbItem "Home" @Home
        BreadcrumbItem "Products" @Products
        BreadcrumbItem "Electronics" @Electronics
        BreadcrumbItem "Phones"
    /Breadcrumb
/uiwire
```

## Data Display

### User Table

```wireframe
uiwire clean
    %title: User Management
    
    Card
        Vertical gap=16
            Label "**Users**"
            
            Table :tblUsers
                | Name | Email | Role | Status |
                |------|-------|------|--------|
                | John Doe | john@example.com | Admin | Active |
                | Jane Smith | jane@example.com | Editor | Active |
                | Bob Wilson | bob@example.com | Viewer | Inactive |
            /Table
            
            Pagination pages=5 current=1 :pgUsers
        /Vertical
    /Card
/uiwire
```

### Stats Cards

```wireframe
uiwire clean
    Horizontal gap=16
        Card w=200
            Vertical gap=8
                Label "Total Users"
                Label "**12,345**"
                Badge "↑ 12%" type=success
            /Vertical
        /Card
        
        Card w=200
            Vertical gap=8
                Label "Revenue"
                Label "**$45,678**"
                Badge "↑ 8%" type=success
            /Vertical
        /Card
        
        Card w=200
            Vertical gap=8
                Label "Orders"
                Label "**1,234**"
                Badge "↓ 3%" type=error
            /Vertical
        /Card
    /Horizontal
/uiwire
```

### Tree View

```wireframe
uiwire clean
    Card
        Vertical gap=12
            Label "**File Browser**"
            
            Tree :treeFiles
                + Documents
                    + Work
                        - Report.pdf
                        - Presentation.pptx
                    + Personal
                + Images
                + Downloads
            /Tree
        /Vertical
    /Card
/uiwire
```

## Feedback

### Toast Notifications

```wireframe
uiwire clean
    Vertical gap=8
        Toast "Success! Your changes have been saved." type=success
        Toast "Warning: Your session will expire soon." type=warning
        Toast "Error: Failed to load data." type=error
        Toast "Info: New updates available." type=info
    /Vertical
/uiwire
```

### Progress Indicators

```wireframe
uiwire clean
    Card w=400
        Vertical gap=12
            Label "**Upload Progress**"
            
            Progress value=75 :prgUpload
            Label "Uploading file... 75%"
            
            Horizontal gap=8 justify=between
                Button "Cancel" @:back
                Label "3 of 4 files"
            /Horizontal
        /Vertical
    /Card
/uiwire
```

### Stepper

```wireframe
uiwire clean
    Stepper :stpCheckout
        Step "Cart" completed=true
        Step "Shipping" current=true
        Step "Payment"
        Step "Confirm"
    /Stepper
/uiwire
```

## Complex Layouts

### Dashboard

```wireframe
uiwire clean
    %title: Analytics Dashboard
    
    Dock
        Header dock=top h=60
            Horizontal justify=between padding=16
                Label "**Analytics Dashboard**"
                Dropdown :ddlPeriod
                    Option "Last 7 days"
                    Option "Last 30 days"
                    Option "Last 90 days"
                /Dropdown
            /Horizontal
        /Header
        
        Content dock=fill padding=16
            Vertical gap=16
                Horizontal gap=16
                    Card w=200
                        Label "Page Views"
                        Label "**45.2K**"
                        Progress value=72
                    /Card
                    
                    Card w=200
                        Label "Visitors"
                        Label "**12.8K**"
                        Progress value=58
                    /Card
                    
                    Card w=200
                        Label "Bounce Rate"
                        Label "**32%**"
                        Progress value=32
                    /Card
                /Horizontal
                
                Card
                    Vertical gap=12
                        Label "**Recent Activity**"
                        
                        Table :tblActivity
                            | Event | User | Time |
                            |-------|------|------|
                            | Page view | john@example.com | 2 min ago |
                            | Sign up | jane@example.com | 5 min ago |
                            | Purchase | bob@example.com | 12 min ago |
                        /Table
                    /Vertical
                /Card
            /Vertical
        /Content
    /Dock
/uiwire
```

### E-commerce Product Page

```wireframe
uiwire realistic
    %title: Product Page
    
    Dock
        Header dock=top h=60
            Horizontal padding=16 justify=between
                Label "**STORE**"
                TextInput "Search products..." :txtSearch
                IconButton $cart "Cart"
            /Horizontal
        /Header
        
        Content dock=fill padding=24
            Horizontal gap=24
                Card w=400
                    Image "product-image" h=300
                    Horizontal gap=8
                        Image "thumb-1" w=80 h=80
                        Image "thumb-2" w=80 h=80
                        Image "thumb-3" w=80 h=80
                    /Horizontal
                /Card
                
                Vertical gap=16 w=400
                    Breadcrumb
                        BreadcrumbItem "Home" @Home
                        BreadcrumbItem "Electronics" @Electronics
                        BreadcrumbItem "Headphones"
                    /Breadcrumb
                    
                    Label "**Premium Wireless Headphones**"
                    
                    Horizontal gap=8
                        Label "**$299**"
                        Label "~~$399~~"
                        Badge "25% OFF" type=success
                    /Horizontal
                    
                    Label "★★★★☆ (128 reviews)"
                    
                    Separator
                    
                    Label "**Color**"
                    Horizontal gap=8
                        Chip "Black" selected=true
                        Chip "White"
                        Chip "Navy"
                    /Horizontal
                    
                    Separator
                    
                    Horizontal gap=8
                        NumberInput "1" :txtQty w=80
                        Button "Add to Cart" :btnAdd primary
                        IconButton $star "Favorite"
                    /Horizontal
                /Vertical
            /Horizontal
        /Content
    /Dock
/uiwire
```

### Modal Dialog

```wireframe
uiwire clean
    Dialog "Confirm Delete" :dlgConfirm
        Vertical gap=16
            Label "Are you sure you want to delete this item?"
            Label "This action cannot be undone."
            
            Separator
            
            Horizontal gap=8 justify=end
                Button "Cancel" @:close
                Button "Delete" :btnDelete primary
            /Horizontal
        /Vertical
    /Dialog
/uiwire
```

## Theme Showcase

### Clean Theme

```wireframe
uiwire clean
    Card w=300
        Vertical gap=12
            Label "**Clean Theme**"
            Label "Modern and minimal design"
            Button "Primary" primary
            Button "Default"
        /Vertical
    /Card
/uiwire
```

### Sketch Theme

```wireframe
uiwire sketch
    Card w=300
        Vertical gap=12
            Label "**Sketch Theme**"
            Label "Hand-drawn, informal style"
            Button "Primary" primary
            Button "Default"
        /Vertical
    /Card
/uiwire
```

### Blueprint Theme

```wireframe
uiwire blueprint
    Card w=300
        Vertical gap=12
            Label "**Blueprint Theme**"
            Label "Technical, grid-based design"
            Button "Primary" primary
            Button "Default"
        /Vertical
    /Card
/uiwire
```

### Realistic Theme

```wireframe
uiwire realistic
    Card w=300
        Vertical gap=12
            Label "**Realistic Theme**"
            Label "Polished, production-like"
            Button "Primary" primary
            Button "Default"
        /Vertical
    /Card
/uiwire
```

## Accessibility Examples

### Accessible Form

```wireframe
uiwire clean
    %title: Accessible Form Example
    
    Card w=400
        Vertical gap=12
            Label "**Accessible Form Example**"
            
            Label "Email Address *"
            TextInput "Enter a valid email address" :txtEmail required pattern=email
            
            Label "Password *"
            PasswordInput "Minimum 8 characters" :txtPass required min=8
            
            Button "Submit" :btnSubmit primary
        /Vertical
    /Card
/uiwire
```

---

These examples demonstrate the flexibility of the Wireframe language. Copy and modify them for your own projects!
