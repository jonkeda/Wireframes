# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

**A second implementation, in .NET** (`dotnet/`, see `docs/DOTNET_TOOL.md`)
- `Wireframe`: the parser and the SVG renderer in .NET (`net10.0` and `netstandard2.0`, no dependencies). The same
  source gives the same SVG as the TypeScript renderer, byte for byte, in all four themes.
- `wire`, a command-line tool: `.wire` files and the `wireframe` blocks of Markdown documents to SVG, `--check`
  for a build, `--link`, `--json`, `--stdin`, folders and patterns as inputs, `parse`, `components`.
- `wire mcp`: an MCP server over standard input and output with six tools, bound to a root folder.
- `wire hook after-write` and `wire hook before-stop`: the hooks of Claude Code that keep a picture in step with
  its text.

**A plugin for Claude Code** (`plugin/`): the skills `wireframe-create`, `wireframe-update` and
`wireframe-render`, and the two hooks. `scripts/skill-trials.mjs` tries the skills.

**The conformance set** (`conformance/cases`, 371 cases): source, parse tree, diagnostics and the SVG in each
theme. Both implementations are tested against it; `pnpm conformance:check` and `dotnet test`.

### Changed

- The VS Code Markdown preview takes a fence with more than the language on it (` ```wireframe id=login `).

### Fixed

**Components draw** (both implementations). The parser made component nodes and the renderer drew them as an
empty box, so most components showed a frame or nothing.
- `Table` draws its rows (`| a | b |` lines, or `Row` and `Cell` elements), or a placeholder for `rows=`/`cols=`.
- `Tabs` (with the content of the `active` tab), `Menu`, `Tree`, `List`, `Accordion`, `Expander`, `Stepper`,
  `DataGrid`, `Breadcrumb`, `Hamburger`, `Hover` and the text of an `Alert` are drawn.
- `Step`, `BreadcrumbItem`, `Row`, `Cell` and the typed `Column…` words are parsed, as parts of their components.

**Layout and drawing**
- `title="…"` on a card, a panel, a modal or a dialog is drawn; a dialog's title no longer lies over its content.
- `width=` and `height=` are read as `w=` and `h=`; `justify=end|center|between` places a `Horizontal`'s children.
- A section is as high as its content and honours `w=` and `h=`; before, a card took the whole height of the page.
- The colour of a text (a tab, a link, a page number) is applied; the class of every text used to win over it.
- The shadow filter that cards, menus and toasts point at is defined.
- A section docked at the bottom has one height; an `aria-label` has no `**`; `page="2"` is read as a number.

**Parser and lexer**
- An unterminated string is reported once; a document that is never closed is reported.
- A backslash as the last character adds nothing; `constructor`, `toString` and the like are ordinary words.
- Elements nested more than 200 deep are an error, in place of a failure of the program.

### Changed

- The command-line tools are version 0.1.0: every picture counts as stale once and is drawn again.

### Known

- An attribute nothing reads is accepted without a word and does nothing.
- The documentation uses a few words that are not in the language (`RadioButton`, `Group`, `ListItem`, `Bubble`).

Fixes from a review of the language as a source for specifications (2026-11-18).

### Fixed

**Parser and lexer** (`@jonkeda/wireframe-core`)
- An empty table cell is kept; before, the cells after it shifted one column left.
- A misspelt closing keyword, or one for a block that is not open, is an error at its own line,
  and the rest of the document is still read; before, everything after it was dropped.
- `if` / `else if` / `else` / `/if` are parsed into a conditional; before, the else branch and
  everything after it were lost.
- The quoted string of `Heading`, `Link`, `Badge` and every non-input control is its text; before,
  a heading rendered the word "Heading".
- Ids, navigation targets and identifiers may contain any letter (`:Categorieën`).
- Data sections may stand anywhere after the screen; tables get `columns` and `records`; a
  `component` section's body is parsed.
- A duplicate id is reported at the id; escapes in quoted attribute values match strings;
  `- ` starts a list item only at the start of a line.
- A second compile of a source with errors reports its errors again (they are no longer cached away).

**Renderer**
- Every text and attribute value is escaped (Avatar initials, theme colours, ARIA values).
- A numeric `grid=` no longer throws; grid rows grow to their tallest child; children of a
  `Horizontal` share its width.
- Numbers in the SVG are rounded to two decimals; each control carries its ARIA role and label.

**CLI** (`@jonkeda/wireframe-cli`)
- Never writes over its input (`spec.txt` → `spec.txt.svg`).
- Errors print as `file:line:column: error: message`; exit code 1 on errors, 2 on a usage error;
  no SVG is written for a file with errors unless `--force`.
- The document's own style is used unless `--theme` is given; `-o -` writes to stdout; several
  inputs go into the output directory; the summary counts correctly; unknown flags are an error;
  `--name=value` works.

**Mermaid plugin**
- Error messages are escaped (a crafted file could inject HTML); the plugin follows Mermaid's
  external diagram API (`loader`, `renderer.draw`); the detector matches only the word `wireframe`.

**VS Code extension**
- The preview has a Content Security Policy and nonces, and escapes error messages; its message
  listener is registered once; diagnostics point at the error's column; the document's own style
  is used unless a default theme is set.

### Added
- `label="…"` and `placeholder="…"` on inputs; `show="else"` on a conditional.
- `wire parse <file>`: the parse tree and errors as JSON.
- Custom themes: `registerTheme` in core (also re-exported by `@jonkeda/wireframe-themes`), found
  by name everywhere; `CompileOptions.theme` accepts a theme object; `createTheme` is synchronous.

### Changed
- Without a width or a height, `compile()`, `render()` and the CLI fit the SVG to the content
  instead of drawing 800 by 600. The layout is still made for 800, so the fitted width is 800 at
  most; a given width is kept, and a given height stays the minimum. The Mermaid plugin and the
  VS Code preview still pass their own configured size.
- `compile()` caches only results without errors.
- The CLI's executable is `dist/bin.js`; `cli.ts` exports `run`, `parseArgs` and helpers for tests.
- The VS Code extension is split into modules; its HTML rendering has no `vscode` import and is tested.
- Build artifacts (`*.vsix`, `test-output.*`) are no longer committed.

## [1.0.0] - 2025-12-27

### 🎉 Initial Release

First stable release of Wireframe, a domain-specific language for UI wireframes.

### Added

#### Core Library (`@jonkeda/wireframe-core`)

**Language Features**
- Complete Wireframe DSL with controls, layouts, sections, and modifiers
- 38 built-in control types covering all common UI patterns
- 6 layout types: Vertical, Horizontal, Grid, Dock, Canvas, Scroll
- Section support: Header, Footer, Sidebar, Content, Card, Modal
- Modifier system with `@` prefix for control customization
- Comment support (single-line `//` and multi-line `/* */`)
- Document directives (`@style`, `@title`, `@width`, `@height`)

**Themes**
- Clean theme - Modern, minimal design (default)
- Sketch theme - Hand-drawn, informal style
- Blueprint theme - Technical, grid-based design
- Realistic theme - Polished, production-like appearance
- Full theme API with customization support

**Performance**
- LRU caching for parsed documents and rendered SVGs
- Benchmarking utilities for performance measurement
- Debounce and throttle helper functions
- Performance collector for timing analysis

**Accessibility**
- WCAG 2.1 compliance checking
- Color contrast ratio calculation
- Theme accessibility auditing
- ARIA role and attribute utilities
- Accessible SVG output with title, description, and roles

**API**
- `compile()` - Compile source to SVG
- `parse()` - Parse source to AST
- `render()` - Render AST to SVG
- `validate()` - Validate source without rendering
- `getTheme()` - Get theme by name
- `createCompiler()` - Create compiler instance

#### VSCode Extension (`@jonkeda/wireframe-vscode`)

- Syntax highlighting with TextMate grammar
- 17 code snippets for common patterns
- Real-time diagnostics and error highlighting
- Auto-completion for controls, layouts, and modifiers
- Hover documentation for keywords
- Live preview panel with hot reload
- Export to SVG and PNG
- Theme switching command
- Keyboard shortcuts (`Ctrl+Shift+V` for preview)

#### CLI Tool (`@jonkeda/wireframe-cli`)

- Compile wireframe files to SVG
- Watch mode for automatic recompilation
- Config file support (JSON)
- Multiple file batch processing
- Output directory configuration
- Theme selection
- Quiet mode for scripting
- Validation without output

#### Mermaid Plugin (`@jonkeda/wireframe-mermaid`)

- Mermaid.js integration
- Multiple diagram prefixes (`wireframe`, `wire`, `wireframe`)
- Configuration API
- Standalone render function
- Error SVG generation for invalid content

### Controls Reference

| Category | Controls |
|----------|----------|
| Basic | Button, IconButton, Label, Heading, Link, Separator, Spacer |
| Input | TextInput, NumberInput, DateInput, PasswordInput, TextArea |
| Selection | Checkbox, Radio, Dropdown, Switch, Slider |
| Display | Icon, Image, Avatar, Badge, Progress, Chip |
| Navigation | Tabs, Tab, Menu, MenuItem, Breadcrumb, Pagination |
| Data | Table, DataGrid, Tree, TreeItem |
| Containers | Accordion, AccordionSection |
| Feedback | Toast, Skeleton, Stepper |

### Test Coverage

- 265 tests passing
- 73% overall coverage
- 88% core module coverage
- Comprehensive tests for lexer, parser, renderer, cache, and accessibility

### Documentation

- Getting Started Guide
- API Reference
- Example Gallery
- Language Specification
- Architecture Documentation

---

## Future Releases

### Planned for 1.1.0
- Custom component definitions
- Theme editor/builder
- Additional icon packs
- Import/export formats

### Planned for 1.2.0
- Real-time collaboration
- Figma plugin
- Adobe XD plugin
- Sketch plugin

### Planned for 2.0.0
- Animation support
- Interactive prototypes
- Design tokens
- Component marketplace
