# The Wireframe plugin for Claude Code

Skills for working with wireframes written in the Wireframe language. They call the tool `wire` (the .NET tool
`wireframe.cli`, or the single file), which must be on the path, for the skills and for the hooks.

Install it from this repository (Claude Code 2.1.275 or later):

```
/plugin install wireframe --marketplace jonkeda/Wireframes
```

or from a checkout: `claude plugin marketplace add <the repository's folder>`, then
`claude plugin install wireframe@wireframes`. The tool comes separately: `dotnet tool install --global wireframe.cli`.

It also brings the MCP server (`wire mcp`, `.mcp.json`): the tools `wireframe_validate`, `wireframe_render`,
`wireframe_render_document`, `wireframe_check`, `wireframe_components` and `wireframe_examples`.

| Skill | For |
| --- | --- |
| `wireframe-create` | A new wireframe: written, validated, rendered, shown |
| `wireframe-update` | A change to a wireframe that exists, changing only what was asked |
| `wireframe-render` | Making the pictures current, or checking that they are |

`skills/wireframe-create/reference.md` is the language on one page; every example in it validates.

The skills are tried by five small tasks with a known outcome: `node scripts/skill-trials.mjs list`. `prepare`
writes their starting files, a fresh agent with only the skill does each, `judge` says which passed.

## Hooks

`hooks/hooks.json` makes the picture follow the text without a word said.

| When | Runs | Does |
| --- | --- | --- |
| After a Write or an Edit of a `.md` or `.wire` file | `wire hook after-write` | Renders the wireframes of that file. An error in a block goes to the agent, which fixes it |
| Before the agent stops | `wire hook before-stop` | Checks the files handled in the session. An error left, or a picture stale or missing, sends the agent back once |

A file without a wireframe costs a read and nothing else; when all is well nothing is said. To switch the second
hook off, set `WIRE_HOOK_STOP=off` (a project's settings, under `env`). A wireframe changed only by a shell
command is seen by neither hook: `wire --check` in the build catches it.
