# The language's faults, fixed

On 2026-11-19 the owner asked for the faults found while the .NET implementation was written to be fixed. They
were recorded in [620](620-Step1Findings.md), [630](630-Step2And3Findings.md), [660](660-Step6Findings.md) and
[670](670-ClientTrial.md). Each fix is in both implementations and in the conformance set, which now has 396
cases (25 new ones, `extra-…`, one per fixed behaviour). Both test suites pass: 890 in TypeScript, 2,628 in .NET,
and the two renderers give the same bytes for every case in all four themes.

The tool is version 0.1.0, so a picture the old one drew counts as stale and is drawn again.

## The cause behind most of them

**The parser made "component" nodes, and the renderer drew components only as a box.** The drawing code for a
tab, a menu item, a table, a tree, a stepper was there, written for "control" nodes the parser never makes for
those words. So a `Tabs` showed a frame and no tab names, a `Menu` a frame and no items, and a `Table`, a `Tree`,
a `List`, a `Stepper`, a `DataGrid`, a `Hamburger` and a `Hover` nothing at all. The fix gives each component a
layout of its own and hands it to the drawing code that was waiting.

## Fixed

| What | Now |
| --- | --- |
| `Table` drew nothing | Three forms draw: rows written `\| a \| b \|` (the rows above the `\|---\|` line are the header), `Row` elements holding `Cell`s, and `rows=`/`cols=` as a placeholder |
| `Tabs`, `Menu`, `Tree`, `List`, `Accordion`, `Expander`, `Stepper`, `DataGrid`, `Breadcrumb`, `Hamburger`, `Hover`, `Alert` drew a frame or nothing | Each draws. A `Tabs` shows the content of its `active` tab; a `TreeItem` its own items when `expanded`; an `AccordionSection` or `Expander` its content when `expanded`; an `Alert` its text |
| `Step`, `BreadcrumbItem`, `Row`, `Cell` and the `Column…` words did not parse | They are the parts of `Stepper`, `Breadcrumb`, `Table` and `DataGrid`, and are read and drawn. 27 of the documentation's examples that failed now parse |
| A `title="…"` on a card, a modal or a dialog was not drawn | Drawn as the first line, bold; the content starts below it. A dialog's title no longer lies over its content |
| `width=`, `height=` and `justify=` did nothing | `width` and `height` are `w` and `h`. `justify=end`, `center` and `between` place the children of a `Horizontal` |
| `w=` and `h=` on a section were ignored, and a card took the whole height of the page | A section is as wide as its room and as high as its content, or as `w=` and `h=` say. In a `Dock` it fills its region as before |
| The colour of a text was never seen (a tab's, a link's, a page number's) | The class that styles every text sets `fill` too and wins over an attribute; the colour is now a style |
| `filter="url(#shadow)"` pointed at nothing | The filter is defined when a card, a menu or a toast is drawn |
| An unterminated string was reported twice | Once |
| A document that was never closed reported nothing | "Expected /wireframe to close document" |
| A backslash as the last character added the text "undefined" | It adds nothing |
| `constructor`, `toString`, `valueOf` and other names of JavaScript's objects were taken for keywords | They are words like any other |
| A section docked at the bottom was placed for one height and sized with another | One height |
| A card had two spaces before its filter attribute | One |
| An `aria-label` kept the `**` of a bold text | Without them |
| `page="2"` or `steps="3"`, a number written as text, highlighted nothing | Read as the number |
| Very deep nesting ended the .NET process | Both implementations stop at 200 levels with "Elements are nested more than 200 deep" |

## Not fixed

| What | Why |
| --- | --- |
| An attribute nothing reads is accepted without a word | Left on purpose. The language is also a source for specifications, and an attribute may be meant for another reader than the renderer; a warning would need a kind of diagnostic that is not an error, in both tools. The skills say which attributes do something |
| A dropdown always says `aria-expanded="false"`; a tree item says it only when `expanded` is written | Not done |
| A button's width is measured on one text and drawn from another; a grid clips a child and not that child's children | Not done; no case shows them |
| An icon can be set on a layout; `dock` is not checked; an attribute named `__proto__` is dropped | Not done |
| The documentation uses words that are not in the language: `RadioButton`, `RadioGroup`, `Group`, `ListItem`, `Bubble`, `Textarea` | The documentation's faults. 40 of the set's cases still hold errors, most of them these |
| The widths of texts are estimates (8 a character), so a breadcrumb's separators stand unevenly | As it was |

## What changed for someone who has wireframes

Every picture changes: a card's shadow is now defined, and a card is as high as its content. Tables, tabs,
menus and the rest appear where there was nothing. A document that was never closed, or uses a word that is not
in the language, now reports it. `wire --check` calls every picture stale once, because the tool's version is in
each picture's first line.
