# Wireframe in .NET: the plan

Status: proposed (2026-11-19), nothing built. The owner decided four points the same day; they are in "Decided"
below and worked into every part. Asked by the owner: a plan for a .NET parser and renderer, a
command-line tool that generates SVG, an MCP server, skills for creating, updating and rendering wireframes, and
the designs of the hooks.

| | |
| --- | --- |
| What | Wireframe's language read and drawn by .NET, and offered to an agent four ways: a command, an MCP server, skills, hooks |
| Why | The specs that hold wireframes are checked by .NET tools (Bruinet's Spec), and an agent that writes a wireframe should see the picture without Node, a browser or an editor extension |
| What there is | The TypeScript implementation in `packages/`: `core` (lexer, parser, layout, SVG renderer, themes; about 7,300 lines), `cli` (`wire`, about 500 lines), a Mermaid plugin and a VS Code extension. 351 tests, 90 example files (`.wire` with their `.svg`) |
| What stays | The TypeScript implementation. The VS Code extension and the Mermaid plugin run in a browser and keep using it |

## The parts

| # | Part | Document | Depends on |
| --- | --- | --- | --- |
| 1 | The parser and renderer | [100-ParserAndRenderer.md](100-ParserAndRenderer.md) | Nothing |
| 2 | The command-line tool | [200-Cli.md](200-Cli.md) | 1 |
| 3 | The MCP server | [300-McpServer.md](300-McpServer.md) | 1 (and 2 for its packaging) |
| 4 | The skills | [400-Skills.md](400-Skills.md) | 2; better with 3 |
| 5 | The hooks | [500-Hooks.md](500-Hooks.md) | 2 |

The work as boxes to tick, step by step: [600-Tasklist.md](600-Tasklist.md). What each finished step showed:
[610-Step0Findings.md](610-Step0Findings.md), [620-Step1Findings.md](620-Step1Findings.md),
[630-Step2And3Findings.md](630-Step2And3Findings.md), [640-Step4Findings.md](640-Step4Findings.md), [660-Step6Findings.md](660-Step6Findings.md),
[650-Step7Findings.md](650-Step7Findings.md); the hooks'
investigation so far: [510-HooksFindings.md](510-HooksFindings.md).

## Decided (2026-11-19)

| # | Decision | In the owner's words |
| --- | --- | --- |
| 1 | The SVGs of the two implementations are the same to the byte. That is the aim, not a hope | "byte identical is preferred" |
| 2 | The hooks need an investigation and experiments before they are designed for good: a step of their own | "add it to the plan that you will need to investigate and experiment" |
| 3 | SVG now. PNG from SVG is added later | "for now render svg. svg to png should be added later." |
| 4 | A port to .NET, not a wrapper. It ships without Node | ".NET. I also want to be able to ship without node." |

What 4 means in practice: nothing of the .NET parts needs Node, not to run and not to build or test. The
conformance set is written by the TypeScript implementation and **checked in**, so the .NET tests read files and
start nothing.

## The one rule

**Two implementations of one language must not drift.** The language is defined by a set of files both
implementations are held against, not by either implementation's code: every example and test case as a source
file, its syntax tree as JSON, its diagnostics, and its SVG. That set is built first (step 0 below), from the
TypeScript implementation as it is today, and from then on a change to the language is a change to that set.

## The order, with a gate before each next step

| Step | What | Gate |
| --- | --- | --- |
| 0 | The conformance set: sources, trees, diagnostics and SVGs, written by the TypeScript implementation | The TypeScript tests pass against the set |
| 1 | The lexer and parser in .NET | Every tree and every diagnostic of the set is the same |
| 2 | The layout and the SVG renderer, theme `clean` | Every `clean` SVG of the set is the same, to the byte |
| 3 | The other themes (`sketch`, `blueprint`, `realistic`) | Every SVG of the set is the same, to the byte |
| 4 | The command-line tool | The examples in `docs` render by one call; a Markdown file's blocks render beside it; a machine without Node runs it |
| 5a | The hooks: investigate and experiment | A written answer to each open question of 500, each shown by a throwaway hook that was run |
| 5b | The hooks, on the tool | A wireframe written in a session has its SVG a second later, with no word said |
| 6 | The skills | An agent with only the skills writes a login form that validates and renders, first time |
| 7 | The MCP server | The same from a client that has no shell |

Steps 5 and 6 come before 7 on purpose: with a shell, a command and two skills do everything the server does, at a
tenth of the work. The server is for clients that have no shell, and for showing the picture inline.

## Where it goes

`wireframe/dotnet/` in this repository, beside `packages/`: one solution, `Wireframe.sln`.

| Project | What | Target |
| --- | --- | --- |
| `Wireframe` | Lexer, parser, syntax tree, diagnostics, layout, SVG renderer, themes. No dependency but the base library | `net10.0` and `netstandard2.0` |
| `Wireframe.Cli` | The tool `wire`, as a .NET tool and as a single file | `net10.0` |
| `Wireframe.Mcp` | The MCP server (`wire mcp`): a library the tool hosts, over standard input and output | `net10.0` |
| `Wireframe.Tests` | The conformance set and the unit tests | `net10.0` |

The targets follow Bruinet's (`net10.0`). `netstandard2.0` for the library is so that anything can use it, including an analyzer or a Visual Studio
extension. The name of the tool is the open point in "For the owner to decide".

## Sizes

Estimates, from the size of the TypeScript code and its tests.

| Step | Size |
| --- | --- |
| 0 | 2 days |
| 1 | 4 days |
| 2 | 6 days: the layout is where the two will differ first |
| 3 | 3 days |
| 4 | 2 days |
| 5a | 2 days: reading, and small hooks tried in a real session |
| 5b | 1 day |
| 6 | 2 days, most of it trying them |
| 7 | 3 days |

## Where it stands (2026-11-19)

Every step is built. What is ticked and what is not is in [600-Tasklist.md](600-Tasklist.md): 108 of 123 boxes.

| Step | Stands |
| --- | --- |
| 0 to 4 | Done. 371 cases; the .NET renderer gives the TypeScript renderer's bytes in all four themes; `wire` reads `.wire` files and Markdown documents |
| 5 | The hooks were investigated in a real session and built. The plugin's entries ran from a settings file; the plugin itself was not installed |
| 6 | Three skills; five trials kept as a command, five of five passed |
| 7 | The MCP server is built and tested through a test client. **No real client was connected**, so its gate is not met |

Learned and not planned:

- **The language has faults the set now holds as they are**, the same in both implementations, for the owner to
  decide: a `Table` draws nothing; an attribute nothing reads is accepted without a word; a `title=` on a card or
  a dialog is not drawn; `Step`, `Row`, `Cell` and the `Column…` words are keywords that do not parse; the shadow
  filter is never defined; an unterminated string is reported twice. See 620, 630 and 660.
- **The skills had to be written against the tool, not the documentation**, because the two disagree. A trial by
  a fresh agent found what reading did not (the table).
- **A hook costs about 90 ms and nothing in the conversation.** It cannot see a file a shell command changed, and
  it sends the agent back once per turn at most. See 500 and 510.
- **An SVG is not an image a model takes.** The server gives it as text; as an image only when asked. PNG, the
  owner's "later", is what would put the picture in the conversation.

Still open: the MCP server with a real client; the plugin installed as a plugin; the single file compiled ahead
of time (no C++ build tools on this machine); the VS Code preview's change tried in VS Code; diagnostic codes;
more cases for the set (every modifier on every control, layouts whose children do not fit); the new .NET job of
the workflow, which has not run on GitHub. Nothing is committed.

## What is not known

- **How much work the same bytes take.** The owner prefers them (decision 1). The layout measures text by a rule
  (a character is 8 wide), not by a font, so it can be done. Numbers written as text are where it usually breaks:
  how each side rounds and writes 12.50. A case that still differs is a fault to find, on either side, not a
  difference to accept: see 100.
- **The sketch theme's wobble.** It draws with a random generator that takes a seed. The same seed must give the
  same lines on both sides, which means the same generator, written out, not each platform's own.
- **What a client shows of an SVG.** An MCP result can carry an image; whether a client draws an SVG or only PNG
  and JPEG differs per client. See 300. It decides how soon the later PNG (decision 3) is wanted.
- **The hooks' exact shape.** Written from what is known of Claude Code's hooks today. Step 5a finds out, by
  reading and by trying (decision 2). See 500.

## For the owner to decide

1. ~~A port, or a wrapper?~~ **Decided: a port, shipped without Node** (decision 4).
2. **Which implementation leads?** Proposed: neither. The conformance set leads, and a change to the language
   lands in both or in neither.
3. **The tool's name.** The TypeScript tool is `wire`. Proposed: the same name and the same options, so a script
   does not care which one it calls; installed as the .NET tool `wireframe.cli`.
4. ~~PNG.~~ **Decided: SVG now; PNG from SVG later** (decision 3). When it comes it is its own step: a drawing
   library in .NET, chosen then, behind `--format png` and the server's `image` result.
5. **Where the skills and hooks live:** in this repository as a plugin others can install, or in each repository
   that uses wireframes. Proposed: here, as a plugin, with the suites pointing at it.
