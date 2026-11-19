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
- **An attribute the renderer does not know is accepted and does nothing.** No error is given. The ones that do
  something: `w`, `h`, `gap`, `padding`, `cols`, `rows`, `align`, `level`, `size`, `variant`, `type`, `value`,
  `page`, `total`, `steps`, `current`, `dock`, and `canvas`, `x`, `y` in a `Canvas`. `width`, `height`, `justify`
  and `title` are not among them, whatever an older example shows.

## Layouts: how things are placed

| Layout | Places its children | Attributes that matter |
| --- | --- | --- |
| `Vertical` | Under each other | `gap`, `padding`, `align=center` |
| `Horizontal` | Beside each other | `gap`, `padding` |
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
children and is closed by its name. A width or a height is `w=` and `h=`. **A `title="…"` on a card, a modal or a
dialog is not drawn**: put the title in as a bold `Label`.

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
| Tabs | `Tabs` with a `Tab "…"` per tab, the open one `active`, closed by `/Tabs` |
| A table | A `Grid cols=3` of `Label`s, row after row: the first row the column names in bold (`Label "**Number**"`), then two or three rows of sample values. Put it in a `Card` for a border. **Do not use `Table`: it validates and draws nothing** |
| A dialog | `Dialog` … `/Dialog`, with its title as a bold `Label` inside |
| A menu | `Menu` with a `MenuItem "…"` per line, closed by `/Menu` |
| A breadcrumb | `Breadcrumb` with a `Link "…"` per step and a `Label "…"` for the last, closed by `/Breadcrumb` |
| Steps of a flow | `Stepper steps=4 current=2`, with a `Label "…"` per step when they have names, closed by `/Stepper` |
| A message | `Alert type=warning` … `/Alert` |

**Do not use** `Step`, `BreadcrumbItem`, `Row`, `Cell`, `ColumnText` and the other `Column…` words. The
documentation shows them and the parser does not read them: they give "Unexpected token".

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
        Card
            Grid cols=4 gap=8
                Label "**Number**"
                Label "**Customer**"
                Label "**Date**"
                Label "**Total**"
                Label "2026-0041"
                Label "Acme"
                Label "3 Nov 2026"
                Label "€ 120.00"
                Label "2026-0042"
                Label "Globex"
                Label "5 Nov 2026"
                Label "€ 75.50"
            /Grid
        /Card
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
