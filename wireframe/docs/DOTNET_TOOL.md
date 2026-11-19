# The .NET tool: `wire`

`wire` reads the Wireframe language and writes SVG, as the TypeScript tool does, without Node. Both are held to
one set of cases (`conformance/cases`): the same source gives the same SVG, byte for byte.

It is one program with four faces: a command, an MCP server, the hooks of Claude Code, and the tool the plugin's
skills call.

## Build and run

It needs the .NET 10 SDK.

```bash
dotnet build dotnet/Wireframe.slnx
dotnet test dotnet/Wireframe.slnx
dotnet dotnet/src/Wireframe.Cli/bin/Debug/net10.0/wire.dll --version
```

As a .NET tool (the package is `wireframe.cli`, the command `wire`):

```bash
dotnet pack dotnet/src/Wireframe.Cli -c Release
dotnet tool install --global wireframe.cli --add-source dotnet/src/Wireframe.Cli/bin/Release
wire --version
```

## A first picture

```bash
wire login.wire              # writes login.svg beside it
wire login.wire -o - > x.svg # to standard output
wire --validate login.wire   # checks, writes nothing
```

## Wireframes in a Markdown document

A fenced block with the language `wireframe` is a wireframe. Give it an id, so its picture keeps its name when
the document changes:

````markdown
```wireframe id=login
wireframe clean
    Label "Sign in"
/wireframe
```
````

```bash
wire spec.md          # writes spec.login.svg beside the document; the document is not changed
wire spec.md --link   # also writes an image line under each block, between <!-- wire:image --> markers
wire --check docs     # writes nothing; exit 1 when a picture is missing or stale, or a block has an error
```

A folder stands for every `.wire`, `.md` and `.markdown` file under it; a name with `*` or `?` for the files that
fit. A block without an id is named by its number in the document (`spec.1.svg`).

Every picture of a block starts with one comment line: the tool's version, the document and block, a hash of the
source, and the options. `--check` compares that line and renders nothing. The tool never overwrites or deletes a
picture that does not carry the line.

## Options

`wire --help` is the reference. The ones used most:

| Option | Does |
| --- | --- |
| `-o, --output <path>` | The output file, `-` for standard output, or a folder for several inputs |
| `--out-dir <folder>` | The pictures under this folder, in the inputs' folder layout |
| `-t, --theme <name>` | `clean`, `sketch`, `blueprint`, `realistic`; otherwise the document's own first line |
| `-w, --width`, `-h, --height` | The picture's width, and its least height |
| `-v, --validate` | Check only |
| `--check` | Write nothing; exit 1 when something is not current |
| `--link` | Image lines in a Markdown document |
| `--block <id\|n>` | One block of a Markdown document |
| `--stdin` | One wireframe from standard input |
| `--json` | Diagnostics and results as JSON |
| `--watch` | Render again when a file changes |
| `-f, --force` | Write the picture of a source with errors too |

Errors are printed as `file(line,column): error: message`, with a Markdown document's own line and column. The
exit code is 0 when all went well, 1 when a source has an error or cannot be read or written, 2 for a wrong
command line.

Other commands: `wire parse <file>` prints the parse tree as JSON; `wire components [<name>]` lists the words of
the language.

## The MCP server

```bash
wire mcp --root <folder>
```

It speaks MCP over standard input and output, and reads and writes only under the root (the current folder when
none is given). Tools: `wireframe_validate`, `wireframe_render`, `wireframe_render_document`, `wireframe_check`,
`wireframe_components`, `wireframe_examples`. In a client's configuration:

```json
{ "mcpServers": { "wireframe": { "command": "wire", "args": ["mcp", "--root", "."] } } }
```

`wireframe_render` gives the SVG as text. With `image: true` it also gives it as an image of type
`image/svg+xml`; ask for that only in a client known to take SVG images.

## Claude Code: the plugin

`plugin/` holds three skills (`wireframe-create`, `wireframe-update`, `wireframe-render`) and two hooks. The
hooks render a `.md` or `.wire` file's wireframes after the agent wrote it, hand the agent the errors, and check
before it stops that no picture it touched is stale. See `plugin/README.md`. `wire` must be on the path.

## In a build and before a commit

```bash
wire --check docs
```

fails the step when a picture is stale or missing.

## What it does not do yet

- PNG: `--format svg` is the only format.
- A single program compiled ahead of time; the tool needs the .NET runtime, or is published as a single file with
  the runtime in it (`dotnet publish -r <rid> --self-contained -p:PublishSingleFile=true`).
