# 1. The parser and renderer in .NET

Part of [the plan](000-Readme.md). The library `Wireframe`: source text in, a syntax tree with diagnostics out,
and from the tree an SVG.

## What is ported

From `packages/core/src`, by its own structure:

| TypeScript | Lines | .NET | Notes |
| --- | --- | --- | --- |
| `lexer/tokens.ts`, `lexer/lexer.ts` | 1,400 | `Wireframe.Syntax.Lexer`, `Token`, `TokenKind` | Indentation makes blocks (indent and dedent tokens); about 90 kinds of token |
| `parser/ast.ts` | 480 | `Wireframe.Syntax` records: `DocumentNode`, `LayoutNode`, `SectionNode`, `ControlNode`, `ComponentNode`, `RepeatNode`, `ConditionalNode`, `DataSectionNode` | The same names and fields, so a tree written as JSON is the same on both sides |
| `parser/parser.ts` | 1,170 | `Wireframe.Syntax.Parser` | It recovers from an error and goes on; the errors come with the tree |
| `renderer/layout.ts` | 950 | `Wireframe.Rendering.Layout` | Grid, Vertical, Horizontal, Dock, Canvas, Scroll |
| `renderer/svg-renderer.ts`, `control-helpers.ts`, `types.ts` | 1,700 | `Wireframe.Rendering.SvgRenderer` | A method per control and component |
| `renderer/theme.ts`, `sketch.ts` | 600 | `Wireframe.Rendering.Theme`, `SketchPen` | Four themes; the sketch pen's seeded generator written out the same |
| `accessibility.ts` | 320 | `Wireframe.Rendering.Accessibility` | Titles and roles in the SVG |
| `cache.ts`, `performance.ts` | 490 | Not ported | A command that runs once has no use for them; the server keeps its own small cache |

Not ported: the Mermaid plugin and the VS Code extension. They stay on TypeScript.

## The surface

Small, and the same three calls the TypeScript `index.ts` gives.

```csharp
ParseResult result = WireframeParser.Parse(source);          // result.Document, result.Diagnostics
string svg = WireframeRenderer.Render(result.Document, new RenderOptions { Theme = "sketch", Width = 800 });
RenderResult both = Wireframe.Compile(source, options);      // parse and render; no SVG when an error is not recoverable
```

| Type | Holds |
| --- | --- |
| `Diagnostic` | Severity, a code (`WF012`), a message, line and column, the length, and for some a fix ("did you mean `TextInput`?") |
| `RenderOptions` | Theme, width, minimum height, a seed for the sketch theme, whether to write accessibility attributes, whether to draw on errors |
| `WireframeBlocks` | The `wireframe` blocks of a Markdown text: each with its lines in the file, its source, and its id when it has one. Used by the tool, the server and the hooks |

Every public type is immutable. Nothing reads a file, a clock or the environment: the library is text in, text out,
so it runs anywhere and its tests need nothing.

## The conformance set: step 0

A folder `conformance/` at the root of `wireframe/`, used by both implementations' tests.

| Per case | File |
| --- | --- |
| The source | `cases/<name>.wire` |
| Its syntax tree | `cases/<name>.ast.json` |
| Its diagnostics | `cases/<name>.diagnostics.json` |
| Its SVG, per theme | `cases/<name>.<theme>.svg` |

Where the cases come from:

1. The 90 example files under `docs/examples` and `demos`.
2. The sources inside the 351 TypeScript tests, taken out into files: each test that parses or renders a string.
3. Cases written for what the tests do not reach: every control and component once with every modifier, and every
   error the parser can report.

The TypeScript implementation writes the expected files once, by a script (`scripts/write-conformance.ts`). A
second script checks them. From then on:

- a file of the set changes only in a commit that says the language changed;
- both implementations' test runs fail when they differ from the set.

## The same bytes

Decided by the owner (2026-11-19): the same bytes are preferred. So that is the gate of steps 2 and 3, not a wish:
the .NET renderer's SVG of every case is the conformance set's SVG, byte for byte. What makes that possible: text
is measured by a rule, not a font; the layout is arithmetic; the sketch pen's randomness is a generator that can
be written out.

What will be in the way, and what the port does about each:

| Difference | Rule for both sides |
| --- | --- |
| How a number is written (`12.5`, `12.50`, `12.500000001`) | One function that writes a number: at most two decimals, no trailing zeros, a dot. Written into the TypeScript side too if it does not have it |
| The order of attributes on an element | The renderer writes them in a fixed order, not as a dictionary gives them |
| Rounding halves | Away from zero, on both sides, in one named function |
| Text escaping | The same five characters |
| The random generator of the sketch pen | The generator's code, ported line for line, with whole numbers only |

A case that still differs after these is a fault to find, and it is found before the step is called done. Where
the fault is in the TypeScript side (a number written as the platform happens to write it, attributes in an order
that is an accident), that side is changed, the set is written again, and both are held to it.

A comparison of the two SVGs as trees, with numbers within 0.01, is kept as a **tool for finding** such a fault:
it says which element and which number differ. It is not a way to pass. If one case cannot be made the same at a
fair cost, it is not passed quietly: it is listed with its cause and put to the owner.

The line ends and the encoding are part of "the same bytes": UTF-8 without a mark at the start, line feeds only,
one line feed at the end, on every platform.

## Tests

| Kind | What |
| --- | --- |
| Conformance | Every case of the set: tree, diagnostics, SVG per theme |
| Unit | The lexer's indentation, the parser's recovery, each layout by itself |
| Markdown | `WireframeBlocks`: fences with and without an id, a block inside a list, a fence in a code block that is not a wireframe |
| Property | A source the parser accepted, written back from its tree and parsed again, gives the same tree |
| Speed | The largest example parses and renders in under 50 ms; the hooks rely on it |

## Risks

| Risk | What is done |
| --- | --- |
| The port follows the TypeScript code's accidents (a bug both now have) | The set's cases are read by a person once, per component, against the language's documentation |
| The language changes on one side while the port is under way | Step 0 freezes it: a change during the port goes into the set first |
| The layout differs in ways the examples do not show | Step 0's third source of cases: every layout with children that do not fit |
