# Data Display Components

This document covers tables, data grids, and data presentation components.

## Table

Basic table with rows and columns.

```wireframe
wireframe clean
    Table rows=5 cols=3 w=400
/wireframe
```

### Table Attributes
- `rows` - Number of data rows (including header)
- `cols` - Number of columns

## Row and Cell (Table Building Blocks)

Build custom table structures.

```wireframe
wireframe clean
    Table w=400
        Row selected
            Cell "Name"
            Cell "Email"
            Cell "Status"
        /Row
        Row
            Cell "John Doe"
            Cell "john@example.com"
            Cell "Active"
        /Row
        Row
            Cell "Jane Smith"
            Cell "jane@example.com"
            Cell "Pending"
        /Row
    /Table
/wireframe
```

### Cell Alignment

```wireframe
wireframe clean
    Table w=400
        Row selected
            Cell "Left"
            Cell "Center" align=center
            Cell "Right" align=right
        /Row
    /Table
/wireframe
```

## DataGrid

Advanced data grid with typed columns.

```wireframe
wireframe clean
    DataGrid rows=5 cols=4 w=500
/wireframe
```

### DataGrid with Row Selection

```wireframe
wireframe clean
    DataGrid rows=5 cols=3 w=400 selected
/wireframe
```

The `selected` modifier adds a checkbox column for row selection.

## Typed Columns

Define column types for appropriate data display.

```wireframe
wireframe clean
    DataGrid rows=5 w=600
        ColumnText "Name"
        ColumnDate "Created"
        ColumnNumber "Count"
        ColumnCheckbox "Active"
    /DataGrid
/wireframe
```

### Available Column Types

| Column Type | Display | Use Case |
|-------------|---------|----------|
| `ColumnText` | Text string | Names, descriptions |
| `ColumnDate` | MM/DD/YYYY format | Dates, timestamps |
| `ColumnNumber` | Numeric value | Counts, amounts |
| `ColumnCheckbox` | Checkbox | Boolean states |
| `ColumnImage` | Image thumbnail | Photos, avatars |
| `ColumnLink` | Clickable link | URLs, references |
| `ColumnButton` | Action button | Row actions |

### Complete DataGrid Example

```wireframe
wireframe clean
    DataGrid rows=6 w=700 selected
        ColumnText "Product Name"
        ColumnNumber "Price"
        ColumnNumber "Stock"
        ColumnDate "Added"
        ColumnCheckbox "Featured"
        ColumnButton "Actions"
    /DataGrid
/wireframe
```

## Toast Notifications

Temporary notification messages.

```wireframe
wireframe clean
    Vertical gap=8
        Toast "File saved successfully" variant=success
        Toast "New message received" variant=info
        Toast "Network connection slow" variant=warning
        Toast "Failed to upload file" variant=error
/wireframe
```

### Toast Variants
- `variant=info` - Informational (blue)
- `variant=success` - Success message (green)
- `variant=warning` - Warning message (yellow)
- `variant=error` - Error message (red)

## Alert

Inline alert messages.

```wireframe
wireframe clean
    Vertical gap=8 w=400
        Alert type=info
            Label "This is an informational message"
        /Alert
        Alert type=success
            Label "Operation completed successfully"
        /Alert
        Alert type=warning
            Label "Please review your settings"
        /Alert
        Alert type=error
            Label "An error occurred"
        /Alert
/wireframe
```

## Complete Data Display Example

Dashboard with data grid and stats.

```wireframe
wireframe clean
    Vertical w=800 gap=20 padding=20
        Heading "Orders Dashboard" level=1
        
        Horizontal gap=16
            Card w=180 padding=16
                Vertical gap=4
                    Label "Total Orders"
                    Heading "1,234" level=2
                    Badge "12%" variant=success
                /Vertical
            /Card
            Card w=180 padding=16
                Vertical gap=4
                    Label "Revenue"
                    Heading "$45,678" level=2
                    Badge "5%" variant=success
                /Vertical
            /Card
            Card w=180 padding=16
                Vertical gap=4
                    Label "Pending"
                    Heading "23" level=2
                    Badge "Warning" variant=warning
                /Vertical
            /Card
            Card w=180 padding=16
                Vertical gap=4
                    Label "Cancelled"
                    Heading "5" level=2
                    Badge "2" variant=error
                /Vertical
            /Card
        /Horizontal
        
        Card padding=16
            Vertical gap=16
                Horizontal gap=8
                    Heading "Recent Orders" level=3
                    Spacer
                    TextInput placeholder="Search orders..." w=200
                    Dropdown "Status"
                        Option "All"
                        Option "Pending"
                        Option "Shipped"
                        Option "Delivered"
                    /Dropdown
                /Horizontal
                
                DataGrid rows=6 w=100% selected
                    ColumnText "Order ID"
                    ColumnText "Customer"
                    ColumnDate "Date"
                    ColumnNumber "Amount"
                    ColumnCheckbox "Paid"
                    ColumnButton "View"
                /DataGrid
                
                Horizontal gap=8
                    Label "Showing 1-10 of 234"
                    Spacer
                    Pagination page=1 total=24
                /Horizontal
            /Vertical
        /Card
    /Vertical
/wireframe
```

## User List with Avatars

```wireframe
wireframe clean
    Card w=400 padding=16
        Vertical gap=16
            Heading "Team Members" level=3
            
            Vertical gap=12
                Horizontal gap=12
                    Avatar "JD" size=lg
                    Vertical gap=2
                        Label "**John Doe**"
                        Label "john@example.com" 
                        Badge "Admin" variant=info
                    /Vertical
                    Spacer
                    IconButton icon=more
                /Horizontal
                
                Separator
                
                Horizontal gap=12
                    Avatar "JS" size=lg
                    Vertical gap=2
                        Label "**Jane Smith**"
                        Label "jane@example.com"
                        Badge "Member"
                    /Vertical
                    Spacer
                    IconButton icon=more
                /Horizontal
                
                Separator
                
                Horizontal gap=12
                    Avatar "BW" size=lg
                    Vertical gap=2
                        Label "**Bob Wilson**"
                        Label "bob@example.com"
                        Badge "Guest" variant=warning
                    /Vertical
                    Spacer
                    IconButton icon=more
                /Horizontal
            /Vertical
        /Vertical
    /Card
/wireframe
```
