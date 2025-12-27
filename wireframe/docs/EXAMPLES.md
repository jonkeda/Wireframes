# Wireframe Examples

A collection of example wireframes demonstrating various UI patterns.

## Basic Examples

### Hello World

```wireframe
/Header "Hello World"
/Button "Click Me"
```

### Login Form

```wireframe
@style clean

/Card
  /Heading "Login"
  /Vertical @gap=16
    /TextInput "Email" @placeholder="Enter your email" @required
    /PasswordInput "Password" @placeholder="Enter password" @required
    /Checkbox "Remember me"
    /Button "Sign In" @primary
    /Link "Forgot password?"
```

### Dashboard Header

```wireframe
/Header
  /Horizontal @gap=16
    /Label "Dashboard" @bold
    /Spacer
    /Icon "search"
    /Icon "notifications"
    /Avatar "JD"
```

## Forms

### Registration Form

```wireframe
/Card
  /Heading "Create Account"
  /Vertical @gap=12
    /Horizontal @gap=8
      /TextInput "First Name" @placeholder="John"
      /TextInput "Last Name" @placeholder="Doe"
    /TextInput "Email" @placeholder="john@example.com" @required
    /PasswordInput "Password" @placeholder="Min 8 characters" @required
    /PasswordInput "Confirm Password" @required
    /Checkbox "I agree to the Terms of Service" @required
    /Button "Create Account" @primary
    /Separator
    /Label "Already have an account?" @secondary
    /Link "Sign in instead"
```

### Contact Form

```wireframe
/Card
  /Heading "Contact Us"
  /Vertical @gap=12
    /TextInput "Name" @required
    /TextInput "Email" @required
    /Dropdown "Subject"
      "General Inquiry"
      "Technical Support"
      "Sales"
      "Other"
    /TextArea "Message" @placeholder="How can we help you?"
    /Button "Send Message" @primary
```

### Settings Form

```wireframe
/Card
  /Heading "Settings"
  /Vertical @gap=16
    /Label "Notifications" @bold
    /Switch "Email notifications"
    /Switch "Push notifications" @checked
    /Separator
    /Label "Privacy" @bold
    /Switch "Public profile"
    /Switch "Show online status" @checked
    /Separator
    /Horizontal @gap=8
      /Button "Cancel"
      /Button "Save Changes" @primary
```

## Navigation

### Sidebar Navigation

```wireframe
/Sidebar
  /Vertical @gap=4
    /Label "MENU" @secondary @small
    /MenuItem "Dashboard" @active
    /MenuItem "Projects"
    /MenuItem "Tasks"
    /MenuItem "Calendar"
    /Separator
    /Label "SETTINGS" @secondary @small
    /MenuItem "Profile"
    /MenuItem "Preferences"
    /MenuItem "Help"
```

### Tab Navigation

```wireframe
/Tabs
  /Tab "Overview" @active
  /Tab "Analytics"
  /Tab "Reports"
  /Tab "Settings"
```

### Breadcrumb Navigation

```wireframe
/Breadcrumb "Home > Products > Electronics > Phones"
```

## Data Display

### User Table

```wireframe
/Card
  /Heading "Users"
  /Table @columns="Name,Email,Role,Status"
    "John Doe" "john@example.com" "Admin" "Active"
    "Jane Smith" "jane@example.com" "Editor" "Active"
    "Bob Wilson" "bob@example.com" "Viewer" "Inactive"
  /Pagination @pages=5 @current=1
```

### Stats Cards

```wireframe
/Horizontal @gap=16
  /Card
    /Label "Total Users" @secondary
    /Heading "12,345"
    /Badge "↑ 12%" @success
  /Card
    /Label "Revenue" @secondary
    /Heading "$45,678"
    /Badge "↑ 8%" @success
  /Card
    /Label "Orders" @secondary
    /Heading "1,234"
    /Badge "↓ 3%" @error
```

### Tree View

```wireframe
/Card
  /Heading "File Browser"
  /Tree
    /TreeItem "Documents" @expanded
      /TreeItem "Work"
        /TreeItem "Report.pdf"
        /TreeItem "Presentation.pptx"
      /TreeItem "Personal"
    /TreeItem "Images"
    /TreeItem "Downloads"
```

## Feedback

### Toast Notifications

```wireframe
/Vertical @gap=8
  /Toast "Success! Your changes have been saved." @success
  /Toast "Warning: Your session will expire soon." @warning
  /Toast "Error: Failed to load data." @error
  /Toast "Info: New updates available." @info
```

### Progress Indicators

```wireframe
/Card
  /Heading "Upload Progress"
  /Vertical @gap=12
    /Progress @value=75
    /Label "Uploading file... 75%"
    /Horizontal @gap=8
      /Button "Cancel"
      /Spacer
      /Label "3 of 4 files" @secondary
```

### Stepper

```wireframe
/Stepper
  "Cart" @completed
  "Shipping" @active
  "Payment"
  "Confirm"
```

## Complex Layouts

### Dashboard

```wireframe
@style clean

/Header
  /Horizontal
    /Label "Analytics Dashboard" @bold
    /Spacer
    /Dropdown "Last 7 days"
      "Last 7 days"
      "Last 30 days"
      "Last 90 days"

/Horizontal @gap=16
  /Card @width=200
    /Label "Page Views" @secondary
    /Heading "45.2K"
    /Progress @value=72
  /Card @width=200
    /Label "Visitors" @secondary
    /Heading "12.8K"
    /Progress @value=58
  /Card @width=200
    /Label "Bounce Rate" @secondary
    /Heading "32%"
    /Progress @value=32

/Card
  /Heading "Recent Activity"
  /Table @columns="Event,User,Time"
    "Page view" "john@example.com" "2 min ago"
    "Sign up" "jane@example.com" "5 min ago"
    "Purchase" "bob@example.com" "12 min ago"
```

### E-commerce Product Page

```wireframe
@style realistic

/Header
  /Horizontal
    /Label "STORE" @bold
    /Spacer
    /TextInput "" @placeholder="Search products..."
    /Icon "cart"

/Horizontal @gap=24
  /Card @width=400
    /Image "product-image" @ratio="1:1"
    /Horizontal @gap=8
      /Image "thumb-1" @width=80
      /Image "thumb-2" @width=80
      /Image "thumb-3" @width=80

  /Vertical @gap=16
    /Breadcrumb "Home > Electronics > Headphones"
    /Heading "Premium Wireless Headphones"
    /Horizontal @gap=8
      /Label "$299" @bold @large
      /Label "$399" @secondary @strikethrough
      /Badge "25% OFF" @success
    /Label "★★★★☆ (128 reviews)" @secondary
    /Separator
    /Label "Color" @bold
    /Horizontal @gap=8
      /Chip "Black" @selected
      /Chip "White"
      /Chip "Navy"
    /Separator
    /Horizontal @gap=8
      /NumberInput "1" @width=80
      /Button "Add to Cart" @primary
      /IconButton "heart"
```

### Modal Dialog

```wireframe
/Modal
  /Heading "Confirm Delete"
  /Label "Are you sure you want to delete this item? This action cannot be undone."
  /Separator
  /Horizontal @gap=8
    /Spacer
    /Button "Cancel"
    /Button "Delete" @error
```

## Theme Showcase

### Clean Theme

```wireframe
@style clean

/Card
  /Heading "Clean Theme"
  /Label "Modern and minimal design"
  /Button "Primary" @primary
  /Button "Default"
```

### Sketch Theme

```wireframe
@style sketch

/Card
  /Heading "Sketch Theme"
  /Label "Hand-drawn, informal style"
  /Button "Primary" @primary
  /Button "Default"
```

### Blueprint Theme

```wireframe
@style blueprint

/Card
  /Heading "Blueprint Theme"
  /Label "Technical, grid-based design"
  /Button "Primary" @primary
  /Button "Default"
```

### Realistic Theme

```wireframe
@style realistic

/Card
  /Heading "Realistic Theme"
  /Label "Polished, production-like"
  /Button "Primary" @primary
  /Button "Default"
```

## Accessibility Examples

### Accessible Form

```wireframe
/Card
  /Heading "Accessible Form Example"
  /Vertical @gap=12
    /Label "Email Address *" @id="email-label"
    /TextInput "" @labelledby="email-label" @required @describedby="email-help"
    /Label "Enter a valid email address" @id="email-help" @secondary @small
    
    /Label "Password *" @id="pass-label"
    /PasswordInput "" @labelledby="pass-label" @required @describedby="pass-help"
    /Label "Minimum 8 characters" @id="pass-help" @secondary @small
    
    /Button "Submit" @primary
```

---

These examples demonstrate the flexibility of the Wireframe language. Copy and modify them for your own projects!
