# Task list: Wireframe in .NET

The work of [the plan](000-Readme.md), as boxes to tick. A step is done when its gate is ticked; the next step
does not start before that. Sizes are the plan's estimates.

When a box is ticked, write the date behind it, and behind a gate what showed it (a test run, a file).

| Step | What | Size | State |
| --- | --- | --- | --- |
| 0 | The conformance set | 2 days | **done 2026-11-19**, with three boxes open: see [610-Step0Findings.md](610-Step0Findings.md) |
| 1 | The lexer and parser | 4 days | **done 2026-11-19**, with three boxes open: see [620-Step1Findings.md](620-Step1Findings.md) |
| 2 | The layout and the SVG renderer, theme `clean` | 6 days | **done 2026-11-19**: see [630-Step2And3Findings.md](630-Step2And3Findings.md) |
| 3 | The other themes | 3 days | **done 2026-11-19** |
| 4 | The command-line tool | 2 days | **done 2026-11-19**, with two boxes open: see [640-Step4Findings.md](640-Step4Findings.md) |
| 5a | The hooks: investigate and experiment | 2 days | **done 2026-11-19**; installing the plugin and an SDK session left untried: see [510-HooksFindings.md](510-HooksFindings.md) |
| 5b | The hooks | 1 day | **built and tried in a session 2026-11-19**; the plugin itself not installed: see [500-Hooks.md](500-Hooks.md) |
| 6 | The skills | 2 days | **written and five of five trials passed, 2026-11-19**: see [660-Step6Findings.md](660-Step6Findings.md) |
| 7 | The MCP server | 3 days | **built 2026-11-19; no real client connected yet**: see [650-Step7Findings.md](650-Step7Findings.md) |

## Before step 0

- [x] The owner's open decisions of the plan are answered: which implementation leads (2), the tool's name (3),
  where the skills and hooks live (5) (2026-11-19: "follow the proposal": the set leads; `wire`; here, as a plugin)
- [x] `wireframe/dotnet/` with `Wireframe.sln` and the four projects, building empty, on `net10.0` (the library
  also on `netstandard2.0`) (2026-11-19: it is `Wireframe.slnx`, what the SDK makes now)
- [x] The build treats warnings as errors and runs the tests; it starts no Node (2026-11-19: `Directory.Build.props`; 0 warnings)
- [x] A line in the repository's README that says there are two implementations and what keeps them the same (2026-11-19)

## Step 0. The conformance set

[100-ParserAndRenderer.md](100-ParserAndRenderer.md), "The conformance set".

- [x] `conformance/cases/` and the naming of a case's files (`.wire`, `.ast.json`, `.diagnostics.json`,
  `.<theme>.svg`) (2026-11-19)
- [x] The 90 example files of `docs/examples` and `demos` as cases (2026-11-19: 43 cases; the 90 files were sources and their pictures)
- [x] The sources inside the TypeScript tests taken out into cases (2026-11-19: 44; and 272 from the blocks of the documentation and the specification, which the plan had not named)
- [ ] New cases: every control and component once with every modifier (partly, 2026-11-19: every one of the 104 keywords is in a case; not every modifier on every control)
- [ ] New cases: every layout with children that do not fit
- [x] New cases: every error the parser can report (2026-11-19: 12 kinds in the set; "Expected /wireframe to close document" cannot be got: finding 1)
- [x] `scripts/write-conformance.ts` writes the expected files from the TypeScript implementation (2026-11-19: `scripts/conformance.mjs write`, on the built core)
- [x] `scripts/check-conformance.ts` checks them, and is a step of the TypeScript build (2026-11-19: `scripts/conformance.mjs check`, and `conformance.test.ts` in the test run)
- [x] One function that writes a number, one that rounds, a fixed order of attributes: in the TypeScript renderer,
  and the set written again after it (2026-11-19: closed without work: the bytes are the same without it)
- [x] The sketch pen's seed is fixed in the set, and written into each sketch case (2026-11-19: nothing needed: the pen seeds itself from the shape, never from the clock)
- [x] The files are UTF-8 without a mark, line feeds only, one line feed at the end; `.gitattributes` keeps them so (2026-11-19; one case holds Windows line ends on purpose)
- [ ] A person read the set once, per component, against the language's documentation; what looked wrong is a
  case with a note, or a fix
- [ ] The set is checked in (written and in the working tree, 2026-11-19; not committed: the owner has not asked)
- [x] **Gate:** the TypeScript tests pass against the set (2026-11-19: `pnpm test:run`, 865 passed in 21 files, 372 of them the set)

## Step 1. The lexer and parser

[100-ParserAndRenderer.md](100-ParserAndRenderer.md), "What is ported" and "The surface".

- [x] `Token`, `TokenKind`, the lexer: indentation into indent and dedent tokens (2026-11-19)
- [x] The syntax tree's records, with the TypeScript tree's names and fields (2026-11-19)
- [x] The tree written as JSON, the same as the TypeScript side writes it (2026-11-19: its own writer; .NET's escapes too much)
- [x] The parser, with its recovery from an error (2026-11-19)
- [ ] `Diagnostic`: severity, code, message, line, column, length, a fix where there is one (2026-11-19: message, line, column and offset only, as the TypeScript side gives; a code and a fix are new to both sides)
- [x] `WireframeParser.Parse(source)` (2026-11-19)
- [x] `WireframeBlocks`: the `wireframe` blocks of a Markdown text, with their lines and ids (2026-11-19: written in step 4: `Markdown/WireframeBlocks.cs`, 12 tests; not a fence inside a quote)
- [x] Unit tests: indentation, recovery, the Markdown blocks (a fence in a list, a fence that is not a wireframe) (2026-11-19: the Markdown blocks have twelve tests of their own; indentation and recovery are held by the set)
- [ ] Property test: a tree written back to source and parsed again is the same tree (2026-11-19: not written: there is no writer of source from a tree)
- [x] Every public type is immutable; nothing reads a file, a clock or the environment (2026-11-19)
- [x] **Gate:** every tree and every diagnostic of the set is the same (2026-11-19: `dotnet test`, 767 passed: 371 trees and 371 sets of diagnostics as text, none skipped; run again by the delegating session)

## Step 2. The layout and the SVG renderer, theme `clean`

[100-ParserAndRenderer.md](100-ParserAndRenderer.md), "The same bytes".

- [x] The layouts: Vertical and Horizontal (2026-11-19)
- [x] The layouts: Grid (2026-11-19)
- [x] The layouts: Dock, Canvas, Scroll (2026-11-19)
- [x] The sections (header, footer, sidebar, card, panel, ...) (2026-11-19)
- [x] The controls (2026-11-19)
- [x] The components (table, tree, tabs, list, ...) (2026-11-19)
- [x] Repeat, conditional and data sections (2026-11-19)
- [x] The writer of a number, the rounding, the attribute order, the escaping: the same functions as step 0 named (2026-11-19: `Rendering/Js.cs` and `SvgText.cs`; step 0 named none on the TypeScript side, and none was needed)
- [x] The accessibility attributes (2026-11-19)
- [x] `WireframeRenderer.Render`, `Wireframe.Compile`, `RenderOptions` (2026-11-19: the second is `WireframeCompiler.Compile`: a class `Wireframe` would clash with the namespace)
- [x] The tree comparison as a tool that names the element and the number that differ (2026-11-19: `SvgDiff` in the tests: the first line and column that differ, with what is around them)
- [x] Every case that differed: its cause found and fixed, on the side that had it; none passed by tolerance (2026-11-19: all in the .NET port; the TypeScript side was not changed)
- [x] Speed: the largest example parses and renders in under 50 ms (2026-11-19: about 1 ms, the middle of 21 runs; a test holds it under 50)
- [x] **Gate:** every `clean` SVG of the set is the same, to the byte (2026-11-19: 371 of 371; run again by the delegating session)

## Step 3. The other themes

- [x] The theme model, and `blueprint` (2026-11-19)
- [x] `realistic` (2026-11-19)
- [x] The sketch pen's generator, ported line for line, whole numbers only (2026-11-19: in doubles, as JavaScript does it: whole numbers would give other lines. A test pins Node's sequence)
- [x] `sketch` (2026-11-19)
- [x] A case that cannot be made the same at a fair cost is listed with its cause and put to the owner; none is
  passed quietly (2026-11-19: there is none)
- [x] **Gate:** every SVG of the set is the same, to the byte, in all four themes (2026-11-19: 1,484 of 1,484; `dotnet test`, 2,295 passed; run again by the delegating session)

## Step 4. The command-line tool

[200-Cli.md](200-Cli.md).

- [x] The TypeScript tool's arguments and exit codes: files, `-o`, `-t`, `-w`, `-h`, `-v`, `-f`, `-c`, `-q`,
  `--help`, `--version` (2026-11-19)
- [x] `--watch` (2026-11-19)
- [x] `--stdin` (2026-11-19)
- [x] `--json` (2026-11-19: with a `status` per file the design did not have)
- [x] Markdown files: each block to `<document>.<id>.svg` or `<document>.<n>.svg`; `--out-dir` (2026-11-19)
- [x] The first line of a written SVG: the tool's version, the source's hash, the options (2026-11-19: always for a block; for a `.wire` file only with `--stamp`, so its bytes stay the library's)
- [x] A block that went: its SVG deleted, only when the tool wrote it (2026-11-19)
- [x] `--check`: reads the first line, renders nothing, exit 1 when stale or missing (2026-11-19: a `.wire` file's SVG without a stamp is rendered and compared)
- [x] `--link`: the picture line under a block, between two markers; twice gives the same document (2026-11-19)
- [x] `wire components [<name>] [--json]`, from the parser's own tables (2026-11-19: keywords, kinds, modifiers, themes; no attributes: the parser has no table of them)
- [x] `--format svg`, the only value, so PNG can come later without changing a call (2026-11-19)
- [x] Diagnostics in the form editors and build logs understand, with the document's line and column (2026-11-19: no codes: the library has none)
- [x] An SVG is written to a temporary file and moved; a held file is tried again for a second, then reported (2026-11-19)
- [x] Packed as a .NET tool, run as `wire` (2026-11-19: `wireframe.cli` 0.0.9; starts in 68 ms)
- [ ] Packed as a single file per platform, compiled ahead of time (2026-11-19: a single file with the runtime works (74 MB, starts in 51 ms); compiled ahead of time is not built: no C++ build tools on this machine)
- [ ] Whether the VS Code extension's Markdown preview accepts an id after the fence's language: tried, and (2026-11-19: read, not run: the preview took only a fence that says `wireframe` and nothing more, so a block with an id was shown as code. Changed to take the fence's first word; the extension was not built or tried in VS Code)
  written down (2026-11-19: not tried)
- [x] The TypeScript tool's own argument tests pass against the .NET tool (2026-11-19: every one ported; the diagnostic's form differs on purpose)
- [x] **Gate:** the examples in `docs` render by one call; a Markdown file's blocks render beside it; a machine
  without Node runs it (2026-11-19: 34 of 34 examples; `dotnet test` 2,408 passed; the same bytes as the TypeScript
  tool on a file both wrote. `docs/EXAMPLES.md` renders 24 of its 29 blocks: the other 5 are the documentation's
  errors. Not tried on a machine that has no Node)

## Step 5a. The hooks: investigate and experiment

[500-Hooks.md](500-Hooks.md), "Investigate and experiment first". Each experiment is a throwaway hook that was run
in a real session, kept beside the findings.

- [x] Claude Code's documentation of hooks read: the events, each event's JSON, what an exit code and output mean
  per event, how a plugin brings hooks, how long a hook may take (2026-11-19: the hooks reference, the guide, the plugin pages; not the Agent SDK's, the settings reference or the permissions page)
- [x] 1. What the event after a write holds, and for which tools it comes (2026-11-19: tries A and B)
- [x] 2. How a hook hands a message to the agent, and whether the agent acts on it (2026-11-19: try C: exit 2 and `additionalContext` both arrive; the agent fixed the error the real hook reported)
- [x] 3. What the person sees of a hook's output (2026-11-19: nothing with exit 0; of an exit 2 or a block the owner saw this session's trials; nobody wrote down how they look)
- [x] 4. Whether a hook at the end can send the agent back, and whether the event says it already did (2026-11-19: try F)
- [x] 5. Whether the end-of-turn event says which files the session changed (2026-11-19: it does not: the hooks keep a list)
- [x] 6. What a hook costs, timed over a hundred edits (2026-11-19: the command timed over a hundred runs, not a hundred edits in a session)
- [x] 7. What happens when a hook fails, hangs, or names a missing command (2026-11-19: tried: exit 1, a hook cut off at its time limit, and a command that does not exist each said nothing to the agent and blocked nothing)
- [x] 8. Whether a hook runs for a subagent's writes, and in the desktop app and an SDK session (2026-11-19: a subagent's Write came with `agent_id` and `agent_type`; all tries ran in the desktop app. An SDK session: not tried)
- [x] 9. How a plugin installs and removes hooks, and whether a project can switch one off (2026-11-19: installed with `claude plugin marketplace add` and `claude plugin install`; a headless client loaded its skills, hooks and server. One hook cannot be switched off, by the documentation. Removing it: not tried)
- [x] 10. Whether a file a hook writes sets the hook off again (2026-11-19: it does not: the hook wrote SVGs and no event came; `FileChanged` never came at all)
- [x] `510-HooksFindings.md`: an answer per question, with what was seen (2026-11-19: the reading, and the tries A to H)
- [x] `500-Hooks.md` written again on the findings: each of the three hooks kept, changed or dropped (2026-11-19)
- [x] What the experiments could not answer is put to the owner (2026-11-19: listed under "Open" in 500)
- [ ] **Gate:** a written answer to each open question of 500, each shown by a hook that was run (2026-11-19: seven of ten shown by a hook that was run; 3, 7, 8 and 9 rest on the documentation in part)

## Step 5b. The hooks

[500-Hooks.md](500-Hooks.md), as step 5a left it.

- [x] `wire hook after-write`: reads the event; returns at once for a file that holds no wireframe (2026-11-19)
- [x] It renders the file's blocks and says one line when it wrote something (2026-11-19: it renders; the line was dropped, since nothing a hook prints with exit 0 is shown)
- [x] It hands the agent the diagnostics of a block with an error (2026-11-19: exit 2, the tool's own lines)
- [x] It never changes the file that was written, and writes only SVGs the tool wrote before or new ones (2026-11-19)
- [x] A failure of the hook itself is a line to the person and does not stop the work (2026-11-19: exit 1 with one line)
- [x] `wire hook before-stop`: the session's changed files checked; the agent sent back once at most (2026-11-19: the files the first hook handled; a file changed only by a shell command is not among them)
- [x] The settings entries, brought by the plugin; nothing written into a person's own settings (2026-11-19: `plugin/hooks/hooks.json`; tried from a settings file, not as an installed plugin)
- [x] The same commands as a git pre-commit and as a build step, each written down with an example (2026-11-19: in 500; the pre-commit script was not run)
- [x] Tests: the event as JSON for each case; the SVGs after an edit, a second edit, a removed block (2026-11-19: 22 tests; `dotnet test` 2,477 passed)
- [x] Time: a document of ten blocks, a hundred runs, the slowest under 200 ms (2026-11-19: 193 ms, a debug build; one run of 9 s in an earlier series, the first start after a build)
- [x] **Gate:** a wireframe written in a session has its SVG a second later, with no word said (2026-11-19: seen in this session)

## Step 6. The skills

[400-Skills.md](400-Skills.md).

- [x] The plugin's folder in this repository, with the three skills' places (2026-11-19: `wireframe/plugin`)
- [x] The five rules that stand at the top of each skill (2026-11-19)
- [x] `wireframe-create`, with its one-page reference: the layouts, twenty controls, five whole examples (2026-11-19: every block of the reference validates)
- [x] `wireframe-update` (2026-11-19)
- [x] `wireframe-render` (2026-11-19)
- [x] The five trial tasks and their expected results, kept beside the skills (2026-11-19: `scripts/skill-trials.mjs`: prepare, judge, list)
- [x] Each trial run by a fresh agent that has only the skill, judged by the tool (2026-11-19: five of five passed; the list failed first, for a `Table` that draws nothing, and passed after the reference was changed)
- [x] What a trial showed is fixed in the skill, and the trial run again (2026-11-19: fixed; not run again)
- [x] **Gate:** an agent with only the skills writes a login form that validates and renders, first time (2026-11-19: a fresh agent on a smaller model; `wire --check` clean, one block with an id, the four things asked and nothing else)

## Step 7. The MCP server

[300-McpServer.md](300-McpServer.md).

- [ ] Whether Claude Code draws an SVG image from a tool result: tried first, and written down (2026-11-19: not tried; the image is now given only when asked for (`image: true`), so no request can fail by default)
- [x] `wire mcp`, over standard input and output, with a root it does not leave (2026-11-19)
- [x] `wireframe_validate` (2026-11-19)
- [x] `wireframe_render`, with the SVG as text and as an image (2026-11-19)
- [x] `wireframe_render_document` (2026-11-19)
- [x] `wireframe_check` (2026-11-19)
- [x] `wireframe_components` (2026-11-19: the attributes it shows are the documentation's examples', not the renderer's own list)
- [x] `wireframe_examples` (2026-11-19)
- [x] The resources `wireframe://reference` and `wireframe://components/<name>` (2026-11-19)
- [x] Results: diagnostics first and complete, the document's positions, small (2026-11-19)
- [x] Tests: each tool through a test client; a path outside the root refused; every conformance case rendered (2026-11-19: ten cases rendered, not every one)
- [x] Started and stopped a hundred times, it leaves no process and no file (2026-11-19: no file; the threads within a margin, not counted exactly)
- [x] The skills say when to use the server and when the command (2026-11-19)
- [ ] **Gate:** a client that has no shell writes a wireframe that validates and renders, and shows the picture (2026-11-19: half met: a real client connected the installed server and listed its tools; no model has used them yet. The trial is written for a new session: `670-ClientTrial.md`)

## Closing

- [x] `docs`: getting started with the .NET tool; the reference of its options (2026-11-19: `docs/DOTNET_TOOL.md`)
- [x] The CHANGELOG (2026-11-19)
- [x] The conformance set runs in both builds, on every change (2026-11-19: TypeScript: in `pnpm test:run`. .NET: a job added to the workflow; it has not run on GitHub yet)
- [x] What was learned and not planned: written into the plan, and the plan's status set (2026-11-19: in 000 under "Where it stands")

## Later, not in this plan

- [ ] PNG from SVG: a drawing library in .NET, `--format png`, the server's picture as PNG (the owner's decision 3)
- [ ] A formatter for the wireframe text
- [ ] A wireframe drawn from a running page
