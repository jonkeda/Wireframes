# Steps 2 and 3: what porting the layout and the renderer showed

Steps 2 and 3 of [the plan](000-Readme.md), done on 2026-11-19 by a delegated agent and checked by the session that
delegated it. The task list is [600-Tasklist.md](600-Tasklist.md).

## The gate

| | |
| --- | --- |
| `dotnet build Wireframe.slnx --no-incremental` | 0 warnings, 0 errors, on `net10.0` and `netstandard2.0` |
| `dotnet test Wireframe.slnx` | 2,295 passed, 0 failed, 0 skipped |
| SVGs the same as their file, to the byte | clean 371 of 371, sketch 371 of 371, blueprint 371 of 371, realistic 371 of 371 |
| The comparison | Text equality, after the two things the script itself does (line ends to line feeds, one line feed at the end). No tolerance, no case skipped or named |
| That the comparison can fail | Shown: with the line-end rule broken on purpose the tests failed and named the line and column |
| The set | Unchanged: `node scripts/conformance.mjs check` is clean |

**The owner's decision 1 is met: the same bytes, for every case in every theme.** Nothing had to be changed on the
TypeScript side to get there, and no case is on a list of exceptions.

## What was written

In `dotnet/src/Wireframe` (the library is now about 6,400 lines):

| File | What |
| --- | --- |
| `Rendering/WireframeRenderer.cs` | `WireframeRenderer.Render(document, options)` and `RenderOptions` (theme, width, height, padding, accessible, title, description, language) |
| `WireframeCompiler.cs` | `WireframeCompiler.Compile(source, options)`: the SVG and the diagnostics. Named so because a class `Wireframe` would clash with the namespace |
| `Rendering/LayoutEngine.cs` | Grid, Vertical, Horizontal, Dock, Canvas, Scroll, Repeat, Conditional |
| `Rendering/SvgRenderer.cs` | A method per control and component, the templates copied as they are |
| `Rendering/Theme.cs` | The four themes and the lookup by name |
| `Rendering/Sketch.cs` | The pen: its generator, a line, a rectangle, a rounded rectangle |
| `Rendering/SvgText.cs`, `Accessibility.cs` | Escaping and the rounding of numbers in the SVG; roles and aria attributes |
| `Rendering/Js.cs` | JavaScript's rules for numbers and text, and a value that is undefined, a number, a string or a boolean |

In the tests: `RenderConformanceTests.cs` (a test per case per theme), `SvgDiff.cs` (says where two SVGs first
differ), `RenderingJsTests.cs` (43 tests that pin JavaScript's rules to values taken once from Node).

## JavaScript's rules that .NET does not share

Each is a function in `Rendering/Js.cs` or `Syntax/JsText.cs`, with a test. A later change to the renderer on
either side meets these.

| Rule | Where it bites |
| --- | --- |
| A number as text is `Number.prototype.toString`, never the platform's own formatting | Everywhere a number goes into the SVG |
| `toFixed(1)` rounds the double's exact decimal value: `1.45` gives "1.4", `0.25` gives "0.3", `-0.04` gives "-0.0" | The sketch pen |
| `Math.round` rounds a half toward plus infinity and keeps minus zero | The rounding of the SVG's numbers |
| `Math.max` and `Math.min` pass a not-a-number on, and put plus zero above minus zero | Layout, renderer |
| `x \|\| default` takes the default for 0 and for not-a-number | Size attributes |
| The pen's generator multiplies in doubles, so the low bits are lost before the bitwise and | The sketch theme. A test pins Node's sequence for one seed |
| `parseFloat` takes the longest number at the start; `Number(text)` takes the whole text or nothing; `parseInt` stops at the first other character | `w=`, `canvas=`, `grid=`, `cols=`, `rows=` |
| A value typed number, string or boolean is compared with `===`: the text "2" is not the number 2 | Pagination's page, a stepper's current step |
| A lookup in a table is by the value as text, so `level=2` and `level="2"` find the same | Heading sizes, avatar sizes, variants' colours |
| Upper case can give more letters than it took (ß gives SS) | An avatar's initials |
| A `replace` with a text replaces the first place only | A card's shadow |
| A map keyed by the node itself, not by what it holds | Grid placement |
| A text over several lines in a source file with Windows line ends still holds line feeds | Every template of several lines |

## What looks wrong in the renderer, and was copied on purpose

Not fixed: the set records what the implementation draws. Each is for the owner to decide.

| # | What | Where in the TypeScript | Shown by |
| --- | --- | --- | --- |
| 1 | A section docked at the bottom is placed for a footer's height (48) and sized with a header's (56) | `layoutDock` against `layoutSection` | `doc-00-language-specification-013` and `-051`, `doc-03-containers-layouts-006` |
| 2 | **`filter="url(#shadow)"` points at a definition that is never written.** The SVG's definitions are always empty, which also leaves a line of two spaces in every picture | `render`; Menu, Toast, Card | Every case |
| 3 | A card gets two spaces before its filter attribute | `renderSection`'s replace | `demo-login` |
| 4 | A dropdown always says `aria-expanded="false"`: whether it is open is never passed on | `withAria`, `getAriaAttributes` | `demo-contact-form` |
| 5 | A tree item says `aria-expanded` only when `expanded` is written | `getAriaAttributes` | The tree item cases |
| 6 | An `aria-label` falls back to the placeholder and keeps the `**bold**` marks of the text | `withAria` | `demo-login` |
| 7 | A page or a step given as text (`page="2"`) is used in sums and never matches when compared, so nothing is highlighted | Pagination, Stepper | No case |
| 8 | A button's width is measured on one text and its label drawn from another; a heading's and a link's use the same for both | `getControlSize` | No case |
| 9 | A grid clips a child to its cell and not that child's own children | `layoutGrid` | No case |

Number 2 means **no card, menu or toast has a shadow in any picture today**, in either implementation. It is the
finding a user would see first.

## Not ported, and why

| What | Why |
| --- | --- |
| Themes a caller registers (`registerTheme` and its kin) | It is a list the whole process shares and can change. The .NET options take a theme's name, and the four built in are known. To be designed when someone needs their own theme |
| A sketched circle, ellipse and free path | The renderer never calls them |
| A sketched rounded rectangle | Ported, and never reached: the sketch theme's radius is 0 |
| What a lookup of `constructor` or `__proto__` gives in JavaScript | No case uses them, and what JavaScript prints there is a function's source |

## Not checked

- **`netstandard2.0` on the old .NET Framework.** It builds. Its numbers as text depend on formatting that may
  round differently there, and the tests run on `net10.0` only.
- **Speed.** The plan's limit (the largest example in under 50 ms) was not measured. All 2,295 tests run in under a
  second, which says it is not far off; a measurement is still owed.

## What this does to the plan

- The task "one function that writes a number, one that rounds, a fixed order of attributes, in the TypeScript
  renderer" is closed without work: the bytes are the same without it.
- The two steps were sized at nine days and took one delegated run of about a quarter of an hour, after step 0 made
  the gate mechanical. The sizes of the steps that are left are probably too large in the same way where a gate is
  as exact, and not where it is not: the hooks' investigation and the skills' trials have no such gate.
