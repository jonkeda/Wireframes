# The Wireframe language on one page

Only what the parser reads today. Every example here validates (`wire reference.md --validate`); when a form is not
on this page, ask the tool (`wire components <name>`) and try it before you rely on it.

## The shape of a wireframe

```wireframe id=shape
wireframe clean
    %title: The shape

    // A line that starts with two slashes is a comment
    Vertical gap=16 padding=24
        Label "**A bold label**"
        Label "A plain label"
    /Vertical
/wireframe
```

- The first line is `wireframe` and a style: `clean`, `sketch`, `blueprint` or `realistic`. The last is `/wireframe`.
- Indentation is four spaces a level, and it is the structure: a child is indented under its parent.
- Something that holds other things is closed by its own name with a slash: `Vertical` … `/Vertical`.
- A text is in double quotes. `**…**` in a text is bold.
- `:name` gives an element an id (`:txtEmail`). Give one to every field a rule, a test or a later change will name.
- `@Target` says where a click leads (`Label "Sign up" @Register`).
- `name=value` is an attribute (`gap=16`, `w=300`); a bare word is a modifier (`primary`).
- **An attribute nothing reads is accepted and does nothing**: no error is given, so a misspelt one is silent. The
  ones that do something: `w` and `h` (also written `width` and `height`), `gap`, `padding`, `cols`, `rows`,
  `align`, `justify`, `title`, `level`, `size`, `variant`, `type`, `value`, `page`, `total`, `steps`, `current`,
  `dock`, and `canvas`, `x`, `y` in a `Canvas`.

## Layouts: how things are placed

| Layout | Places its children | Attributes that matter |
| --- | --- | --- |
| `Vertical` | Under each other | `gap`, `padding`, `align=center` |
| `Horizontal` | Beside each other | `gap`, `padding`, `justify=end`, `center` or `between` for where they stand when they do not fill the row |
| `Grid` | In columns, row after row | `cols` (2 when left out), `gap` |
| `Dock` | Against the edges, the rest in the middle | Its children say `dock=top`, `left`, `right`, `bottom` or `fill` |

`Spacer` in a `Horizontal` pushes what follows to the far side. `Separator` is a line.

```wireframe id=layouts
wireframe clean
    Vertical gap=16 padding=16
        Horizontal gap=8
            Label "**Invoices**"
            Spacer
            Button "+ Invoice" primary
        /Horizontal
        Grid cols=3 gap=8
            Card padding=16
                Label "Open"
                Heading "12" level=2
            /Card
            Card padding=16
                Label "Overdue"
                Heading "3" level=2
            /Card
            Card padding=16
                Label "Paid"
                Heading "48" level=2
            /Card
        /Grid
    /Vertical
/wireframe
```

## Sections: the parts of a page

`Header`, `Footer`, `Sidebar`, `Content`, `Toolbar`, `StatusBar`, `Card`, `Panel`, `Modal`, `Drawer`. Each holds
children and is closed by its name. A width or a height is `w=` and `h=`; without them a section is as wide as the
room it has and as high as what it holds. `title="…"` is drawn as its first line, in bold.

## The controls that cover most screens

| For | Write |
| --- | --- |
| A text | `Label "Email"`; a title `Heading "Orders" level=1` (1 to 4) |
| A text field | `TextInput "placeholder" :txtName`; a secret `PasswordInput "…"`; several lines `TextArea "…"` |
| A number, a date | `NumberInput "0"`, `DateInput "2026-01-31"` |
| A choice from a list | `Dropdown` with an `Option "…"` per choice, closed by `/Dropdown`; the chosen one says `selected` |
| Yes or no | `Checkbox "Remember me"` (`checked`), `Switch "Notify me"` (`checked`) |
| One of a few | A `Radio "…"` per choice; the chosen one says `selected` |
| An action | `Button "Save" primary`; a lesser one `secondary`; one that cannot be used `disabled` |
| A link | `Link "Forgot password?" @Forgot` |
| A picture | `Image "logo" w=120 h=120`; a person `Avatar "JD"` |
| A status | `Badge "New"`, `Chip "Tag"`, `Progress value=60` |
| Pages of a list | `Pagination page=1 total=10` |

Modifiers a field may carry: `required`, `disabled`, `readonly`.

## Components

| For | Write |
| --- | --- |
| Tabs | `Tabs` with a `Tab "…"` per tab, closed by `/Tabs`. What stands under a `Tab` (closed by `/Tab`) is its content; the tab marked `active` is the open one |
| A table | `Table`, then the rows as lines `\| Number \| Customer \| Total \|`, a line `\|---\|---\|---\|` under the header, a line per row, closed by `/Table`. Or `Row` … `/Row` holding a `Cell "…"` per cell, the header row marked `selected`. `Table rows=4 cols=3` alone draws a placeholder |
| A grid of data with typed columns | `DataGrid rows=5` with a `ColumnText "Name"`, `ColumnDate`, `ColumnNumber`, `ColumnCheckbox` … per column, closed by `/DataGrid` |
| A dialog | `Dialog "Title"` … `/Dialog` |
| A menu | `Menu` (or `Menu "Title"`) with a `MenuItem "…"` per line, closed by `/Menu` |
| A breadcrumb | `Breadcrumb` with a `BreadcrumbItem "…"` per step, closed by `/Breadcrumb` |
| Steps of a flow | `Stepper` with a `Step "…"` per step, the done ones `completed` and the current one `active`, closed by `/Stepper`. Without names: `Stepper steps=4 current=2` |
| A tree | `Tree` with `TreeItem "…"` lines, an item's own items indented under it and shown when it says `expanded`; closed by `/Tree` |
| A list | `List` with a line `- item` per item, closed by `/List` |
| Sections that fold | `Accordion` with an `AccordionSection "…"` per section (`expanded` shows its content), closed by `/Accordion` |
| A message | `Alert "Text" type=warning` … `/Alert` (`info`, `success`, `warning`, `error`) |

## Five whole examples

### A form

```wireframe id=form
wireframe clean
    %title: Sign in

    Card
        Vertical gap=16 padding=24
            Label "**Sign in**"
            Vertical gap=8
                Label "Email"
                TextInput "you@example.com" :txtEmail required
            /Vertical
            Vertical gap=8
                Label "Password"
                PasswordInput "Your password" :txtPassword required
            /Vertical
            Checkbox "Remember me" :chkRemember
            Button "Sign in" :btnSignIn primary
            Link "Forgot password?" @Forgot
        /Vertical
    /Card
/wireframe
```

### A list with a filter

```wireframe id=list
wireframe clean
    %title: Invoices

    Vertical gap=16 padding=16
        Horizontal gap=8
            Heading "Invoices" level=1
            Spacer
            Button "+ Invoice" :btnAdd primary
        /Horizontal
        Horizontal gap=8
            TextInput "Search" :txtSearch
            Dropdown :ddStatus
                Option "Any status" selected
                Option "Open"
                Option "Paid"
            /Dropdown
        /Horizontal
        Table
            | Number | Customer | Date | Total |
            |--------|----------|------|-------|
            | 2026-0041 | Acme | 3 Nov 2026 | € 120.00 |
            | 2026-0042 | Globex | 5 Nov 2026 | € 75.50 |
        /Table
        Pagination page=1 total=10
    /Vertical
/wireframe
```

### A dialog

```wireframe id=dialog
wireframe clean
    %title: Delete?

    Dialog
        Vertical gap=16
            Label "**Delete this invoice?**"
            Label "This cannot be undone."
            Horizontal gap=8
                Button "Cancel" :btnCancel
                Button "Delete" :btnDelete primary
            /Horizontal
        /Vertical
    /Dialog
/wireframe
```

### A page with tabs

```wireframe id=tabs
wireframe clean
    %title: Project

    Vertical gap=16 padding=16
        Heading "Project" level=1
        Tabs
            Tab "Overview" active
            Tab "Hours"
            Tab "Invoices"
        /Tabs
        Card padding=16
            Vertical gap=8
                Label "Client"
                Label "**Example Ltd**"
            /Vertical
        /Card
    /Vertical
/wireframe
```

### A settings page

```wireframe id=settings
wireframe clean
    %title: Settings

    Horizontal gap=0
        Sidebar w=200 padding=16
            Menu
                MenuItem "Profile" active
                MenuItem "Notifications"
                MenuItem "Billing"
            /Menu
        /Sidebar
        Content padding=16
            Vertical gap=16
                Heading "Notifications" level=2
                Switch "Email me about new invoices" :swInvoices checked
                Switch "Email me a weekly summary" :swWeekly
                Button "Save" :btnSave primary
            /Vertical
        /Content
    /Horizontal
/wireframe
```
