# 3. The MCP server

Part of [the plan](000-Readme.md). The same library, offered to a model as tools: for a client that has no shell,
and for showing a picture inline in the conversation.

## When it is worth having

With a shell, `wire` and the skills do everything below. The server earns its place in three cases:

| Case | Why the command does not do |
| --- | --- |
| A client with no shell (a chat client, a hosted agent) | It can call tools and nothing else |
| The picture in the conversation | A tool result can carry an image; a command's output cannot |
| The language's reference on demand | A model asks for one component's attributes instead of reading a whole document |

So it is built last, on the tool, and it is small.

## How it runs

`wire mcp`: a subcommand of the tool, speaking MCP over standard input and output. One program to install, one
version. It reads and writes only under the folder it was started in (or `--root <folder>`); a path outside it is
refused.

```json
{ "mcpServers": { "wireframe": { "command": "wire", "args": ["mcp"] } } }
```

### Updating the tool while sessions are open: `wire mcp-host`

A session's `wire mcp` runs from the tool's installed files and holds them, so `dotnet tool update` is refused
while any session is open (seen in [the client trial](670-ClientTrial.md)). `wire mcp-host` is the server a session
starts instead, after Bruinet's `bruinet mcp-host`:

- It copies a **build folder** (`--build`, default `wire/mcp` under the user's local application data) to a snapshot
  under `--runs` (default its sibling `run`) and runs `dotnet exec <snapshot>/wire.dll mcp --root <folder>` as a child.
- Each line of the client goes to the child, each of its lines back. The answer to `initialize` is passed on with
  `capabilities.tools.listChanged` set to true.
- Every two seconds it reads `mcp.stamp` in the build folder (without one: `wire.dll`'s write time). On a new value it
  waits for the requests in flight (two minutes at most), starts a new child from a new snapshot, replays the
  session's `initialize` to it (the answer kept back), sends `notifications/tools/list_changed`, and ends the old one.
- The first time, the build folder is filled from the tool's own files; a tool newer than the build folder replaces
  it. A single-file tool with an empty build folder has nothing to start a child from and serves as `wire mcp`.

Nothing holds the build folder, so `dotnet/update-mcp.ps1` (publish, copy, then the stamp) always goes through.

```json
{ "mcpServers": { "wireframe": { "command": "wire", "args": ["mcp-host"] } } }
```

What it does not cover:

- The host is still the installed `wire`. Updating the global tool itself (a change to the host, or to the hooks'
  `wire hook`, which run the installed tool) still needs every session closed.
- So after `update-mcp.ps1` the server may render with a newer renderer than the hooks and a shell's `wire` until the
  global tool is updated too; a picture one wrote can look stale to the other when the renderer changed between them.
- A child that ends by itself is not started again; the host says so on standard error.

## The tools

Six, each doing one thing.

| Tool | Takes | Gives |
| --- | --- | --- |
| `wireframe_validate` | `source`, or `path` (a `.wire` file, or a Markdown file with an optional `block`) | The diagnostics: severity, code, message, line, column, and a suggested fix where there is one |
| `wireframe_render` | The same, and `theme`, `width`, `write` (default false) | The SVG as text, the diagnostics, and the picture as an image when the client takes one. With `write`: the file's path |
| `wireframe_render_document` | `path` of a Markdown file, `theme`, `link` | What `wire <file.md>` does: each block's SVG beside the document, and what was written, unchanged, or deleted |
| `wireframe_check` | `path` of a file or a folder | The blocks whose SVG is missing or stale. Writes nothing |
| `wireframe_components` | `name` (optional) | Without a name: every control, component, layout and section, a line each. With one: its attributes, modifiers, what it may hold, and a three-line example |
| `wireframe_examples` | `about` (a word: `form`, `table`, `dialog`) | Up to three complete examples from the documentation that fit |

No tool edits a wireframe. A model edits text well with the tools it has; what it lacks is the reference and the
check, and those are here.

## Results a model can use

- **Diagnostics come first and are complete.** A render with an error says the error, where, and the fix, before
  anything else. The picture of a broken wireframe is only given when asked (`force`).
- **Positions are the file's.** For a block in a Markdown file the line is the document's line.
- **Small.** `wireframe_components` without a name is a list, not the manual. The SVG text is left out of a result
  when the picture was given and the file was written; a model does not need 40 KB of paths.
- **The same words as the tool.** A diagnostic reads the same in the server, the command and the hook.

## The picture

An MCP result can hold an image. Clients differ in what they draw: PNG and JPEG everywhere, SVG in some.

Decided by the owner (2026-11-19): SVG now, PNG from SVG later.

| Version | Does |
| --- | --- |
| First | Gives the SVG as text, and as an image of type SVG. A client that draws it shows it; one that does not still has the file |
| Later | A PNG made from the SVG, beside it, for a client that draws no SVG. A step of its own, with a drawing library in .NET chosen then |

Until then the skills say: after a render, show the file (in Claude Code's desktop app, the SVG opens in the file
pane).

## Resources and prompts

| | |
| --- | --- |
| Resources | `wireframe://reference` (the language in one page) and `wireframe://components/<name>`. The same text the tools give, for a client that prefers to attach it |
| Prompts | None in the first version. The skills are the prompts, and they live with the client |

## Tests

- Each tool through a test client: a call, its result's shape.
- A path outside the root is refused, by a tool that reads and by one that writes.
- `wireframe_render` of each conformance case gives the case's SVG.
- The server started and stopped a hundred times leaves no process and no file.

## Open

- Whether Claude Code draws an SVG image from a tool result today. To be tried before the picture's design is
  fixed; it decides whether PNG is needed at all.
- Whether the server should also watch a folder and render on change. Proposed: no. That is the hook's job where
  there are hooks, and `wire --watch` where there are not.
