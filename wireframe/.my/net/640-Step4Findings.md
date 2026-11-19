# Step 4: what building the command-line tool showed

Step 4 of [the plan](000-Readme.md), done on 2026-11-19 by a delegated agent and checked by the session that
delegated it. The design is [200-Cli.md](200-Cli.md); the task list is [600-Tasklist.md](600-Tasklist.md).

## The gate

| | |
| --- | --- |
| `dotnet build Wireframe.slnx` | 0 warnings, 0 errors |
| `dotnet test Wireframe.slnx` | 2,408 passed, 0 failed, 0 skipped: the 2,295 from before and 113 new |
| The examples in `docs` render by one call | 34 of 34, exit 0; rendered at 800 by 600 they are the checked-in pictures, to the byte |
| The same bytes as the TypeScript tool | Checked by the delegating session: `demos/login.wire` in the sketch theme, written by both tools, is the same file |
| A Markdown file's blocks render beside it | Yes. Tried by the delegating session on a document with a good block and a bad one: the good one is written as `spec.login.svg`, the bad one's errors carry the document's own line and column, exit 1 |
| `docs/EXAMPLES.md`, on a copy | 24 of its 29 blocks render; 5 have errors of their own (see below), so the call ends with exit 1 and `--check` after it does too |
| A machine without Node runs it | Nothing in the build, the tests or the tool starts Node. Not tried on a machine that has none |

The gate is met for the tool. The one line that is not clean, `EXAMPLES.md`, fails for a reason that is the
documentation's, not the tool's: finding h of step 1.

## What was written

| File | What |
| --- | --- |
| `src/Wireframe/Markdown/WireframeBlocks.cs` | The `wireframe` blocks of a Markdown text: each with its number, its id, its source, and where it is in the document |
| `src/Wireframe.Cli/WireCli.cs`, `Session.cs` | The tool: `WireCli.Run(args, stdin, stdout, stderr, folder)`, and the work per kind of input |
| `CliOptions.cs`, `CliConfig.cs` | The arguments, read by hand as the TypeScript tool does; the config file |
| `Stamp.cs` | The first line of an SVG the tool wrote for a block |
| `AtomicFile.cs` | A file written beside its target and moved; a held file tried again for a second |
| `MarkdownLinks.cs` | `--link` |
| `Components.cs` | `wire components`, from the parser's own tables |
| `Wireframe.Cli.csproj` | The program is `wire`, version 0.0.9; packs as the .NET tool `wireframe.cli` |
| Five test files | The blocks (12 tests); every test of the TypeScript tool, ported; Markdown, check, JSON, standard input, link, components, a held file, watch, wrong calls; ten cases in four themes against the set |

## Decisions the design had left open

| Question | Decided |
| --- | --- |
| **Where the stamp line goes** | An SVG of a Markdown block always starts with it. An SVG of a `.wire` file has it only with `--stamp`, so `wire x.wire` writes exactly the library's bytes, as the TypeScript tool does and as the set needs |
| What `--check` compares | The stamp line, when the SVG has one. A `.wire` file's SVG without one is rendered and compared. A block's SVG without one is stale |
| What the stamp holds | The tool's version, the document, the block, a hash of the source, the theme, the width and the height. **So `--check` must be given the options the render was given**, and a new version of the tool makes every picture stale |
| What the tool may delete | Only an SVG whose stamp names this document. It will not write over a block's SVG that has no stamp |
| A block's id | A letter or an underscore first; then letters, digits, `-`, `_`. A number alone would clash with a block's number. A bad or a double id is an error at the fence |
| A block that moved | One note that suggests ids, when a numbered picture's hash is another block's source now |
| `--link` | An image line between two marker comments, right under the block, indented as the block is. A second run changes nothing |
| A file that did not change | Is not written again, so its time stays: a hook and `--watch` do not see a change that is none |
| `--json` | As designed, with a `status` per file that the design did not have: written, unchanged, failed, valid, invalid, up-to-date, stale, missing, orphan, deleted, unreadable |

## Where it differs from the TypeScript tool

| What | TypeScript | .NET | Why |
| --- | --- | --- | --- |
| A diagnostic's form | `file:3:5: error:` | `file(3,5): error:` | The design asked for the form editors and build logs read |
| A wrong call | Some messages come without the hint to run `--help` | Every one has it | No reason to keep the gaps |
| The help text | | Also describes the new options | |
| A file that is not there | Exit 1 | Exit 1 | The design's table said 2; the TypeScript tool's own test says 1, and that was followed. **The design is to be corrected** |

## Packaging, measured on this machine

| As | Works | `wire --version` |
| --- | --- | --- |
| The .NET tool (`dotnet tool install wireframe.cli`) | Yes: packed, installed, run | 68 ms |
| One file, with the runtime in it | Yes; 74 MB | 51 ms; a whole render of a login form 87 ms |
| Compiled ahead of time | **Not built**: the machine has no C++ build tools. The compile step itself passes with no warnings. It is behind a switch (`-p:Aot=true`), off by default | Not measured |

The plan wanted the compiled-ahead build so a hook is not felt. At 51 ms for a start and 87 ms for a render the
plain single file is already under the hooks' limit of 200 ms; the ahead-of-time build would mainly make the file
smaller. To decide when the hooks' cost is measured (try D of [510-HooksFindings.md](510-HooksFindings.md)).

## Not built from the design

| What | Why |
| --- | --- |
| A component's attributes in `wire components` | The parser has no table of them: an attribute is any word with a value. The command lists the keywords, their kind, whether they close, the modifiers and the themes. A table of attributes would be new, and both sides would have to keep it |
| Diagnostic codes | The library has none (step 1) |
| A fence inside a quote (`> `) | `WireframeBlocks` does not read it; a list is read by a simpler rule than CommonMark's |
| Whether VS Code's Markdown preview accepts an id after `wireframe` | Not tried |

## What it showed about the documentation

`docs/EXAMPLES.md` cannot be rendered whole by either implementation: 5 of its 29 blocks use `BreadcrumbItem`,
`Step`, `ColumnText`, `Row` and `Cell`, which the parser does not read. With the tool this is now one call to see:

```powershell
wire docs/EXAMPLES.md --validate
```

It is the same finding as step 1's h, seen from the user's side: **the getting-started examples of the language do
not all work.**
