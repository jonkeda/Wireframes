# Step 7: what building the MCP server showed

Step 7 of [the plan](000-Readme.md), done on 2026-11-19 by a delegated agent and checked by the session that
delegated it. It was built before the hooks (steps 5a and 5b) because it does not depend on them. The design is
[300-McpServer.md](300-McpServer.md); the task list is [600-Tasklist.md](600-Tasklist.md).

## The gate

| | |
| --- | --- |
| `dotnet build Wireframe.slnx` | 0 warnings, 0 errors |
| `dotnet test Wireframe.slnx` | 2,451 passed, 0 failed, 0 skipped: 43 new |
| By hand | An `initialize`, a notification and tool calls piped into `wire mcp`: one line of JSON per request, none for the notification, nothing on standard error, exit 0 when the input closed |
| Run again by the delegating session | The same; a validate call gave the two errors of a wrong word with `isError`; a path that climbs out of the root was refused with a message that says why |
| The design's own gate: a client that has no shell writes a wireframe and shows the picture | **Not met.** No real client was connected. Everything was driven by a test client that writes and reads lines |

## What was written

In `dotnet/src/Wireframe.Mcp`: the loop that reads and answers requests (`McpServer.cs`), the six tools
(`WireframeTools.cs`), their descriptions and schemas (`ToolDefinitions.cs`), the guard on paths (`RootFolder.cs`),
the embedded reference and examples (`Library.cs`, `Resources/reference.md`). No package is used: the protocol is
written by hand.

**The server does not have its own way of rendering a file.** It is handed the tool's own command and runs it
in-process with `--json`. So the stamp rules, the refusal to write over a picture the tool did not write, the
deleting of a gone block's picture and the wording are one implementation, the command's. For that the command got
one new option: `--block <id|n>`, one block of one Markdown file.

## The tools

| Tool | Takes | Gives |
| --- | --- | --- |
| `wireframe_validate` | `source` or `path`; `block` | The errors in the command's words, with the document's line and column; "is valid" otherwise |
| `wireframe_render` | The same, and `theme`, `width`, `height`, `write`, `output`, `force`, `image` | Errors first. Then the SVG as text and as an image; with `write`, the path and no SVG text |
| `wireframe_render_document` | `path` of a Markdown file, `theme`, `width`, `link` | A line per block's picture: written, unchanged, deleted, not written |
| `wireframe_check` | `path` of a file or a folder | The pictures that are missing, stale or left over. Writes nothing |
| `wireframe_components` | `name` | The list, a line per kind; or one word: what it is, whether it closes, the attributes the examples use with it, a short example |
| `wireframe_examples` | `about` | Up to three whole examples that parse; without a word, their titles |

Resources: `wireframe://reference` and `wireframe://components/{name}`.

## Decisions the design had left open

| Question | Decided |
| --- | --- |
| Which protocol | The versions that begin with a handshake: 2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05. It answers with the one the client asked for |
| When a result is an error | When the command would end with exit 1 (a wireframe with errors, a stale picture, a file that could not be written), and for input that cannot be used (no such file, outside the root). A protocol error only for a request that is itself wrong |
| A Markdown file with several blocks and no `block` | An error that lists the blocks and names `wireframe_render_document` |
| Writing from a source given inline | Needs `output`, an `.svg` path under the root |
| An argument the tool does not know | Refused: a misspelled `write` is not passed over |
| A folder for `wireframe_check` | `.wire`, `.md`, `.markdown`; not hidden folders, `node_modules`, `bin`, `obj`, linked folders |

## What is not sure

| What | Why it matters |
| --- | --- |
| **The newest protocol is not spoken.** The specification of 2026-07-28 has no handshake; this server answers its first request with "no such method". A client that speaks both should fall back to the handshake; a client that speaks only the new one will not work | To try with the clients we use, before anyone relies on the server |
| **The picture may break a conversation.** The render tool gives the SVG as an image of type `image/svg+xml`. As far as is known the model takes PNG, JPEG, GIF and WebP. If a client passes the SVG image on to the model, the request may fail. **Changed later the same day: the image is given only with `image: true`**, so nothing fails by default | The design's open question, now with stakes. To try first; if it fails, the default becomes `false`, and PNG (the owner's "later") moves up |
| A root given as a Windows short path (`C:\Users\NAME~1\…`) | A link that points inside the root may be refused: the comparison is of text. Links that lead out are refused, which is the side that matters |
| The five examples of `EXAMPLES.md` that do not parse | They are left out when the server loads the examples, and a test holds that. Their text is still inside the program file, because the whole document is embedded |

## Not built from the design

- Diagnostic codes and suggested fixes: the library has none (step 1).
- A table of each component's attributes: the parser has none. The components tool shows the attributes the
  documentation's examples use, which is not the same as the ones the renderer reads (see
  [660-Step6Findings.md](660-Step6Findings.md)).
- PNG: later, by the owner's decision.

## Added to the tool after this step

`wire` now takes a folder (every `.wire`, `.md` and `.markdown` file under it) and a wildcard in a file's name, read
by the tool itself. Found while writing the skills: `wire docs/*.md` works in Bash, whose shell expands it, and
failed in PowerShell. Four tests; 2,455 pass.

## Installed, and connected by a real client (2026-11-19, later)

| What | Seen |
| --- | --- |
| `wire` on the path | Packed and installed as the global .NET tool `wireframe.cli` 0.0.9 |
| The plugin's MCP server | `plugin/.mcp.json`: `wire mcp`, with the session's folder as its root |
| A marketplace | `.claude-plugin/marketplace.json` at the repository's root, the plugin at `./wireframe/plugin`. `claude plugin validate` passes both (it asks for an icon and nothing else) |
| Installing | `claude plugin marketplace add <the repository's folder>`, then `claude plugin install wireframe@wireframes`: user scope, read in place from the folder. `claude plugin details`: 3 skills, hooks on `PostToolUse` and `Stop`, 1 MCP server, about 460 tokens added to every session |
| A real client starts it | Claude Code 2.1.326 (the desktop app's own program, run headless) loaded the plugin, connected the server over stdio in 406 ms, listed its six tools as `mcp__plugin_wireframe_wireframe__wireframe_…` and the three skills as `wireframe:wireframe-create` and so on, and closed the server cleanly. So the protocol the server speaks is one this client takes |

**Not seen yet: a model using the tools.** The headless client could not reach a model (its own sign-in has expired;
the app's sessions sign in another way), and a plugin loads only when a session starts, so the session that
installed it cannot try it. A trial for a new session is written out (seven steps: the tools without a shell, the
hook after a write, the picture as an image, the resources, a skill, the hook before stopping); its findings go to
`670-ClientTrial.md`. Until it has run, the gate stays open and the picture as an image is untried.

## A model used it (2026-11-19, the same evening)

A new session of the desktop app ran the trial; what it saw is in [670-ClientTrial.md](670-ClientTrial.md), and
its result was checked afterwards with `wire --check`. All seven steps passed, the skill's in part.

| What | Seen |
| --- | --- |
| The tools without a shell | A sign-in form written, validated, rendered and checked with the MCP tools alone. The gate is met |
| Paths | Relative to the session's folder (the server's root), not to the document's folder. The agent's first try, relative to its own trial folder, was refused with a clear message |
| The picture as an image | **The model does not see it.** The client saves the SVG under the session's `tool-results` and tells the model "Binary content (image/svg+xml) saved to …". Nothing fails. The image stays off by default: it adds a file and no picture |
| The resource | `wireframe://reference` was listed and read |
| The hooks, from the installed plugin | After a Write the picture was there with no word said. An error came back as a "blocking error" with the tool's lines and "This hook comes from the wireframe@wireframes plugin". A change by a shell command sent the agent back at the stop |
| The plugin in the session that installed it | Its tools and skills appeared there too, a turn later, without a new session |

What the trial's agent noted and was confirmed here: `w=300` on a card that is the wireframe's only element is not
applied (the card is drawn 768 wide). What it noted and is as designed or known: the shadow filter that is never
defined (630), a password placeholder drawn as dots, and that the update skill's "copy the picture aside" has no
way without a shell.
