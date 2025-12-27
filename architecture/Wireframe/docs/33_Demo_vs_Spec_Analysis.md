# Demo Files vs Language Specification Analysis

**Date:** December 27, 2025  
**Purpose:** Analyze discrepancies between demo files and Wireframe v7 Language Specification

---

## Executive Summary

The demo files (`login.wire`, `dashboard.wire`, `contact-form.wire`) use a **completely different syntax** than the v7 Language Specification. This is not a matter of minor tweaks—it's two fundamentally different language designs.

**Recommendation:** Update the demo files to match the v7 specification. The spec is the better design.

---

## Syntax Comparison

### 1. Document Structure

| Feature | Demo Files | v7 Spec |
|---------|------------|---------|
| Root element | `Screen "name"` | `uiwire style` |
| Closing | `EndScreen` | `/uiwire` |
| Attributes | `@name value` (multi-line) | `attribute=value` (inline) |

**Demo Syntax:**
```
Screen "Login"
  @title "Welcome Back"
  @theme clean
  @width 400
```

**Spec Syntax:**
```
uiwire clean
    %title: Login Form
    %width: 400
```

### 2. Block Termination

| Demo Files | v7 Spec |
|------------|---------|
| `EndVertical` | `/Vertical` |
| `EndCard` | `/Card` |
| `EndForm` | `/Form` |

**Demo:** Uses `End` prefix  
**Spec:** Uses `/` prefix (consistent with HTML/XML closing tags)

### 3. Controls

| Control | Demo Syntax | v7 Spec Syntax |
|---------|-------------|----------------|
| Button | `Button "id"` + `@label "text"` | `Button "text" :id` |
| Input | `Input "id"` + `@type email` | `TextInput "placeholder" :id` |
| Label | `Label "text"` + `@style muted` | `Label "text"` |
| Checkbox | `Checkbox "id"` + `@label "text"` | `Checkbox "text" :id` |
| Dropdown | `Select "id"` with `Option` | `Dropdown :id` with `Option` |

**Demo Button:**
```
Button "login"
  @label "Sign In"
  @style primary
  @action submit
```

**Spec Button:**
```
Button "Sign In" :login primary
```

### 4. Layouts

| Layout | Demo Syntax | v7 Spec Syntax |
|--------|-------------|----------------|
| Vertical | `Vertical` + `@spacing 24` | `Vertical gap=24` |
| Horizontal | `Horizontal` + `@spacing 16` | `Horizontal gap=16` |
| Grid | `Grid "id"` + `@columns 4` | `Grid cols=4 rows=n gap=n` |

**Demo Layout:**
```
Vertical
  @align center
  @spacing 24
  @padding 40
  ...
EndVertical
```

**Spec Layout:**
```
Vertical gap=24 align=center padding=40
    ...
/Vertical
```

### 5. IDs and Attributes

| Feature | Demo Files | v7 Spec |
|---------|------------|---------|
| ID | String as first argument | `:id` prefix |
| Binding | Not shown | `?binding` prefix |
| Navigation | `@href` / `@action` | `@Target` suffix |

**Demo:**
```
Input "email"
  @type email
  @placeholder "Enter your email"
  @required
```

**Spec:**
```
TextInput "Enter your email" :email required
```

### 6. Components Not in Spec

The demos use components that don't exist in the v7 spec:

| Demo Component | Status | Notes |
|----------------|--------|-------|
| `Screen` | ❌ Not in spec | Use `uiwire` document wrapper |
| `Form` | ❌ Not in spec | Not a wireframe concern |
| `Navbar` | ❌ Not in spec | Use `Header` section |
| `Logo` | ❌ Not in spec | Use `Image` |
| `Input` (generic) | ❌ Not in spec | Use `TextInput`, `NumberInput`, etc. |
| `Select` | ❌ Not in spec | Use `Dropdown` |
| `Content` | ✅ In spec | Matches |
| `Sidebar` | ✅ In spec | Matches |
| `Chart` | ❌ Not in spec | Not core wireframe |
| `Table`/`TableRow` | ⚠️ Partial | Spec uses markdown tables |
| `Avatar` | ✅ In spec | Matches (but different syntax) |
| `Badge` | ✅ In spec | Matches (but different syntax) |
| `Heading` | ⚠️ Partial | Spec uses `Label "**Bold**"` for emphasis |
| `Text` | ❌ Not in spec | Use `Label` |
| `Link` | ❌ Not in spec | Use `Label "text" @Target` |
| `Divider` | ❌ Not in spec | Use `Separator` |
| `MenuItem` | ✅ In spec | Matches |

---

## Recommendation: Update Demo Files

### Rationale

1. **Spec syntax is more concise**
   - Demo: 5+ lines for a button
   - Spec: 1 line for a button

2. **Spec syntax is more readable**
   - Inline attributes are scannable
   - No need to jump between element and attributes

3. **Spec uses consistent patterns**
   - `/Keyword` closing is predictable
   - `:id` and `?binding` prefixes are consistent

4. **Spec is AI-friendly**
   - Fewer tokens to generate
   - Clearer structure

5. **Demo syntax conflicts with parser**
   - Current parser implements v7 spec
   - Demo files generate many "Unexpected token" errors

### Migration Effort

| File | Lines | Complexity |
|------|-------|------------|
| `login.wire` | 74 | Simple form |
| `dashboard.wire` | 243 | Complex, many components |
| `contact-form.wire` | 112 | Medium form |

---

## Proposed Demo Rewrites

### login.wire (v7 Spec)

```wire
uiwire clean
    %title: Login Form

    Vertical align=center gap=24 padding=40
        
        // Logo
        Image "logo" w=120 h=120
        
        // Login form
        Card
            Vertical gap=16
                Label "**Welcome Back**"
                
                Vertical gap=8
                    Label "Email Address"
                    TextInput "Enter your email" :txtEmail required
                /Vertical
                
                Vertical gap=8
                    Label "Password"
                    PasswordInput "Enter your password" :txtPass required
                /Vertical
                
                Checkbox "Remember me" :chkRemember
                
                Button "Sign In" :btnLogin primary
            /Vertical
        /Card
        
        Separator
        
        // Social login
        Horizontal gap=12
            Button "Google" :btnGoogle secondary
            Button "GitHub" :btnGithub secondary
        /Horizontal
        
        Label "Don't have an account? Sign up" @Register
        
    /Vertical
/uiwire
```

### contact-form.wire (v7 Spec)

```wire
uiwire clean
    %title: Contact Us

    Card padding=32
        Vertical gap=24
            
            // Header
            Vertical gap=8 align=center
                Label "**Get in Touch**"
                Label "We'd love to hear from you. Send us a message!"
            /Vertical
            
            // Form fields
            Vertical gap=20
                
                // Name row
                Horizontal gap=16
                    Vertical gap=4
                        Label "First Name:"
                        TextInput "John" :txtFirst required
                    /Vertical
                    Vertical gap=4
                        Label "Last Name:"
                        TextInput "Doe" :txtLast required
                    /Vertical
                /Horizontal
                
                // Email
                Vertical gap=4
                    Label "Email Address:"
                    TextInput "john@example.com" :txtEmail required
                /Vertical
                
                // Phone
                Vertical gap=4
                    Label "Phone Number:"
                    TextInput "+1 (555) 123-4567" :txtPhone
                /Vertical
                
                // Subject
                Vertical gap=4
                    Label "Subject:"
                    Dropdown :ddlSubject required
                        Option "Select a subject"
                        Option "General Inquiry"
                        Option "Support Request"
                        Option "Feature Request"
                        Option "Bug Report"
                    /Dropdown
                /Vertical
                
                // Message
                Vertical gap=4
                    Label "Message:"
                    TextArea "Tell us what's on your mind..." :txtMessage rows=5 required
                /Vertical
                
                Checkbox "I agree to the Terms of Service" :chkTerms required
                
                Button "Send Message" :btnSubmit primary
                
            /Vertical
        /Vertical
    /Card
/uiwire
```

### dashboard.wire (v7 Spec)

```wire
uiwire clean
    %title: Analytics Dashboard

    Dock
        Header dock=top h=60
            Horizontal padding=16 gap=16
                Icon $chart
                Label "**Analytics Pro**"
                Spacer
                TextInput "Search..." :txtSearch w=250
                Avatar "JD" :avUser
                Hamburger :mnuUser
                    MenuItem "Profile" @Profile
                    MenuItem "Settings" @Settings
                    Separator
                    MenuItem "Logout" @Logout
                /Hamburger
            /Horizontal
        /Header
        
        Sidebar dock=left w=240
            Menu :mnuNav
                MenuItem "Dashboard" icon=$home @Dashboard
                MenuItem "Analytics" icon=$chart @Analytics
                MenuItem "Reports" icon=$file @Reports
                MenuItem "Users" icon=$users @Users
                MenuItem "Settings" icon=$settings @Settings
            /Menu
        /Sidebar
        
        Content dock=fill
            Scroll padding=24
                Vertical gap=24
                    
                    // Header
                    Horizontal
                        Label "**Dashboard Overview**"
                        Spacer
                        Button "Export" secondary
                        Button "Refresh" primary
                    /Horizontal
                    
                    // Stats cards
                    Grid cols=4 gap=16
                        Card padding=20
                            Vertical gap=8
                                Label "Total Users"
                                Label "**24,521**"
                                Badge "+12.5%" type=success
                            /Vertical
                        /Card
                        Card padding=20
                            Vertical gap=8
                                Label "Revenue"
                                Label "**$84,230**"
                                Badge "+8.2%" type=success
                            /Vertical
                        /Card
                        Card padding=20
                            Vertical gap=8
                                Label "Orders"
                                Label "**1,429**"
                                Badge "-2.4%" type=error
                            /Vertical
                        /Card
                        Card padding=20
                            Vertical gap=8
                                Label "Conversion"
                                Label "**3.24%**"
                                Badge "0%" type=neutral
                            /Vertical
                        /Card
                    /Grid
                    
                    // Activity table
                    Card padding=20
                        Vertical gap=16
                            Horizontal
                                Label "**Recent Activity**"
                                Spacer
                                Label "View All" @Activity
                            /Horizontal
                            
                            Table :tblActivity
                                | User | Action | Date | Status |
                                |------|--------|------|--------|
                                | John Doe | Purchased Plan | 2 hours ago | Completed |
                                | Jane Smith | Signed Up | 4 hours ago | New |
                                | Bob Wilson | Updated Profile | Yesterday | Completed |
                            /Table
                        /Vertical
                    /Card
                    
                /Vertical
            /Scroll
        /Content
    /Dock
/uiwire
```

---

## Components to Add to Spec (Optional)

If we want to support the demo use cases fully, consider adding:

| Component | Priority | Rationale |
|-----------|----------|-----------|
| `Heading` | Medium | Cleaner than `Label "**text**"` |
| `Link` | Medium | Explicit hyperlink control |
| `Form` | Low | Semantic grouping (but not wireframe core) |
| `Chart` | Low | Placeholder for charts |

---

## Action Items

1. **Immediate:** Rewrite demo files to use v7 spec syntax
2. **Immediate:** Verify demos parse without errors
3. **Later:** Consider spec additions for missing components
4. **Later:** Update `index.html` demo viewer if needed

---

## Conclusion

The demo files represent an older or alternative syntax design. The v7 spec is:
- More concise
- More consistent  
- Already implemented in the parser
- Better for AI generation

**Decision: Update demo files to match v7 spec.**
