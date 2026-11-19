# The Wireframe language in one page

Wireframe describes a screen as text: one element per line, nesting by indentation. This page says what the
parser reads (the keyword tables of the .NET parser and the conformance cases that parse without errors), not
more. Check a wireframe with `wireframe_validate`; see it with `wireframe_render`.

```wireframe
wireframe clean
    %title: Login
    Card padding=24 w=360
        Vertical gap=12
            Heading "Welcome back" level=2
            TextInput "Email" :email required
            PasswordInput "Password" :password required
            Checkbox "Remember me"
            Button "Sign in" :signIn primary @Dashboard
        /Vertical
    /Card
/wireframe
```

## The document

- `wireframe <style>` opens it; the style is `clean`, `sketch`, `blueprint` or `realistic` (another word is an
  error: `Unknown wireframe style`). The style is optional, and so is the whole header: elements may stand alone.
- `/wireframe` closes it. The parser reads nothing after it: whatever follows is ignored, without an error.
- `%name: value` lines right after the header are the document's attributes: `%title: Login`, and
  `%show: else` (draw the `else` branch of every `if`).
- Comments: `// to the end of the line` and `/* across lines */`.

## Nesting

- Indentation decides what holds what: a line indented under an element is its child. Spaces, or tabs counted as
  four. Going back to an indentation that was never used is an error (`Inconsistent indentation`).
- An element that holds children may end with `/Name` at its own indentation (`/Card`, `/Vertical`). Closing is
  customary and makes the end clear; a `/Name` with nothing of that name open is an error
  (`Unexpected /Card: no Card is open here`), and an unknown one too (`Unknown closing keyword /Foo`).

## One element: one line

```
Keyword "text" :id ?binding @Target $icon modifier name=value
```

All parts after the keyword are optional and may come in any order (the text first).

| Part | Meaning |
| --- | --- |
| `"text"` or `'text'` | The label, caption or title. For `TextInput`, `NumberInput`, `DateInput`, `PasswordInput`, `TextArea` and `Dropdown` it is the placeholder. Escapes: `\n`, `\t`, `\"`. A string must end on its line (`Unterminated string literal`). `"**Bold**"` draws the text bold |
| `:id` | A name for the element (letters, digits, `_`). Unique in the document (`Duplicate ID: email`) |
| `?binding` | The data it shows: `?user.name` |
| `@Target` | Where it leads: `@Dashboard`, `@:back`, `@:modal:HelpDialog` |
| `$icon` | An icon: `$home`, `$icon:settings`. `Icon $star` and `IconButton $search "Search"` take it first |
| modifier | A word: `primary`, `secondary`, `required`, `disabled`, `checked`, `selected`, `readonly`, `editable`, `active`, `expanded`, `removable`, `circle`, `indeterminate`, `completed`, `border` |
| `name=value` | An attribute. No spaces around `=`; a value with spaces is quoted: `title="Edit user"`. Numbers are numbers, `true` and `false` are booleans |

Any word may be an attribute; the renderer reads these:

| Attribute | On | Does |
| --- | --- | --- |
| `w=`, `h=` | any element | Width, height in pixels (`w=320`) |
| `gap=`, `padding=` | layouts, sections | Space between children; space inside |
| `cols=`, `rows=` | `Grid`; `Table`, `DataGrid` without rows | Columns and rows (Grid: 2 columns by default) |
| `grid=row,col,rowSpan,colSpan` | a child of `Grid` | Its cell, from 0: `grid=0,0,1,2` spans two columns |
| `canvas=x,y` (or `x=`, `y=`) | a child of `Canvas` | Its position |
| `dock=top`, `bottom`, `left`, `right`, `fill` | `Header`, `Footer`, `Sidebar`, `Content` in a `Dock` | Its edge |
| `level=` | `Heading` | 1 to 6 |
| `value=`, `min=`, `max=` | `Progress`, `Slider` | The amount |
| `size=xs`, `sm`, `md`, `lg`, `xl` | `Avatar` | Its size |
| `variant=` | `Badge`, `Toast` (`info`, `success`, `warning`, `error`), `Skeleton` (`text`, `circular`, `rectangular`) | Its look |
| `type=` | `Alert` | `info`, `success`, `warning`, `error` |
| `page=`, `total=` | `Pagination` | Current page, number of pages |
| `steps=`, `current=` | `Stepper` | Number of steps, the current one |

## The keywords

| Kind | Keywords |
| --- | --- |
| Layouts (hold children) | `Vertical`, `Horizontal`, `Grid`, `Dock`, `Canvas`, `Scroll` |
| Sections (hold children) | `Card`, `Panel`, `Header`, `Footer`, `Sidebar`, `Content`, `Toolbar`, `StatusBar`, `Modal`, `Drawer` |
| Controls (one line) | `Button`, `IconButton`, `Label`, `Heading`, `Link`, `TextInput`, `NumberInput`, `DateInput`, `PasswordInput`, `TextArea`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Dropdown`, `Option`, `Separator`, `Spacer`, `Icon`, `Image`, `Avatar`, `Badge`, `Chip`, `Progress`, `Pagination`, `Toast`, `Skeleton` |
| Components (hold children) | `Tabs`/`Tab`, `Accordion`/`AccordionSection`, `Expander`, `Menu`/`MenuItem`, `Hamburger`, `Breadcrumb`, `Tree`/`TreeItem`, `List`, `Table`, `DataGrid`/`Column`, `Dialog`, `Alert`, `Hover`, `Stepper` |
| Flow | `Repeat`, `if`, `else` |
| Data sections | `data`, `fields`, `validations`, `calculations`, `rules`, `component` |

Keywords are case-sensitive. A line starting with a word that is not in the language is an error (`Unexpected
token: Bubble`). The parts of components: `Tab` in `Tabs`, `MenuItem` in `Menu`, `Step` in `Stepper`,
`BreadcrumbItem` in `Breadcrumb`, `Row` and `Cell` in `Table`, `TreeItem` in `Tree`, `AccordionSection` in
`Accordion`, and `ColumnText`, `ColumnDate`, `ColumnNumber`, `ColumnCheckbox`, `ColumnImage`, `ColumnLink`,
`ColumnButton` in `DataGrid`.

## Content that is not elements

```wireframe
wireframe clean
    Table :users
        | Name | Email | Role |
        |------|-------|------|
        | Ann  | ann@example.com | Admin |
    /Table
    Tree
        + Documents
            - Report.pdf
        - Notes.txt
    /Tree
    List
        - First item
        - Second item
    /List
    Dropdown "Colour" "Red" "Green" "Blue"
/wireframe
```

- `Table`: Markdown table rows; a row of only `|`, `-`, `:` is the separator, and the rows above it are drawn as the
  header. Or `Row` … `/Row` elements holding `Cell "text"` lines. With neither, `rows=` and `cols=` draw a placeholder.
- `Tree`: `+ branch` (its items indented under it) and `- leaf`; or `TreeItem "Name"` elements.
- `List`: `- item` lines.
- `Dropdown`: options as strings after the placeholder, or `Option "Red" selected` lines under it.

## Repeat and if

```wireframe
wireframe clean
    Repeat 3
        Card
            Label "Repeated card"
        /Card
    /Repeat
    Repeat 2 Button "Inline"
    if signedIn
        Button "Log out"
    else
        Button "Log in"
    /if
/wireframe
```

The `if` condition is free text to the end of the line (an `if` without one is an error). The `then` branch is
drawn, or the `else` branch with `%show: else`. `else if` chains.

## Data sections

At the document's top level, after its elements and before `/wireframe` (after it they are not read): `data`,
`fields`, `validations`, `calculations`, `rules`, each holding Markdown table rows and ending with its closing word
(`/data`). A row with more cells than the header is an error. `component Name params` holds elements and ends
with `/component`. They describe the screen's data; they are not drawn.

```wireframe
wireframe clean
    Label "Users"
    data
        | name | role |
        |------|------|
        | Ann  | Admin |
    /data
/wireframe
```

## Layout in short

- The document stacks its top elements vertically. `Vertical` stacks, `Horizontal` lines up, `Spacer` pushes the
  rest to the far end, `Grid` places in cells, `Canvas` places by position, `Dock` puts `Header`, `Footer`,
  `Sidebar` at its edges and `Content` in the middle, `Scroll` holds content taller than itself.
- The picture is as wide as its content needs, 800 pixels at most, unless the render is given a width.

## Errors

An error reads `file(line,column): error: message`; in a Markdown document the line and column are the
document's. A wireframe with errors is still drawn when asked (`force`), as far as it was understood.
