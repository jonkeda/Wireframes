# 5. The hooks

Part of [the plan](000-Readme.md). What makes the picture follow the text without anyone asking: two commands
Claude Code runs at fixed moments of a session.

**Built on 2026-11-19**, after the investigation the owner asked for. What was read and what was tried is in
[510-HooksFindings.md](510-HooksFindings.md); this document is the design as those findings left it. The first
sketch it replaces is in the repository's history.

## The two commands

| Command | Event | Does | May stop the agent |
| --- | --- | --- | --- |
| `wire hook after-write` | `PostToolUse` of Write and Edit, for a `.md` or `.wire` file | Renders the wireframes of the file that was written; hands the agent the errors of what it wrote | It is told, and goes on to fix it |
| `wire hook before-stop` | `Stop` | Checks the files the first command handled in this session: no error left, no picture stale or missing | Yes, once |

Both read the hook's event as JSON from standard input, so the settings hold no script. They are in
`dotnet/src/Wireframe.Cli/Hooks.cs`; the entries that run them are in `plugin/hooks/hooks.json`.

## After a write

```json
{ "type": "command", "command": "wire", "args": ["hook", "after-write"], "if": "Edit(*.md)", "timeout": 20 }
```

Four such entries under the matcher `Edit|Write`: Edit and Write, each for `*.md` and `*.wire`. An `if` holds one
rule, and the rule names the tool, so it takes four. The command is started directly (`args`), not through a shell:
through a shell the same run took 170 ms in place of 90.

What it does, in order:

1. Reads `tool_input.file_path`. No such field, not a full path, not a `.md`, `.markdown` or `.wire` file, or the
   file is gone: exit 0, nothing said.
2. A Markdown file that holds no `wireframe` block, and that it did not handle earlier in the session: exit 0,
   nothing said, nothing written. A read of the file and a search for one word.
3. Writes the file's path into the session's list (below), once.
4. Renders the file as `wire <file>` does: each SVG whose source changed is written, the SVG of a block that went
   is deleted.
5. No errors: exit 0, nothing said.
6. Errors: the tool's own lines on standard error, a last line that names the file and says what to do, exit 2.

```text
spec.md(11,19): error: Unterminated string literal
spec.md#login: 2 error(s); no output written
In C:\work\docs\spec.md. The picture of a block with an error was not written. Fix the block; the picture follows your edit.
```

| Rule | Why |
| --- | --- |
| It never changes the file that was written | A hook that edits what the agent just edited makes the agent's next edit fail |
| It writes only SVGs the tool wrote before, or new ones | The tool's own rule: a picture without the stamp line is not overwritten or deleted |
| It says nothing when all is well | With exit 0 nothing reaches the agent or the person anyway; the only way to say "3 rendered" is a warning |
| Errors go by exit code 2, not by `additionalContext` | Both reach the agent (tried). An error in what it just wrote is an error, and exit 2 is named one |
| The hint to use `--force` is taken out of the message | It is for a person at a terminal; an agent that follows it writes the picture of a broken block |
| A failure of the hook itself is one line on standard error and exit 1 | Claude Code shows that and blocks nothing |

## Before the agent stops

```json
{ "type": "command", "command": "wire", "args": ["hook", "before-stop"], "timeout": 30 }
```

1. `WIRE_HOOK_STOP=off` in the environment, or `stop_hook_active` true in the event: exit 0.
2. Reads the session's list. `wire --check` on each file in it that still exists. It renders nothing.
3. All current: exit 0, nothing said.
4. Otherwise it answers `{"decision":"block","reason":"…"}` with the check's own lines per folder, and what to do:
   fix the error, run `wire <file>` for a stale or missing picture, stop again.

It is the net under the first command for a file it handled and that was then changed another way: by a shell
command, or left with an error.

**What it does not catch:** a wireframe file the session changed only by a shell command. The stop event names no
changed files, and no event comes for a shell's write, so such a file is never in the list. The build's
`wire --check` catches it.

**It sends the agent back once per turn of the person, and not at all after another stop hook did.**
`stop_hook_active` stays true for the rest of that turn (seen: a third stop in one turn was let through).

## The session's list

`wire-hook-<session_id>.txt` in the event's `scratchpad_dir`; where the event has none, in the system's temporary
folder. One full path per line. The first command adds to it; the second reads it. Nothing removes it: the
scratch folder is the session's and goes with it.

A subagent's writes are handled like any other (tried).

## Installing

The hooks are part of the plugin (`plugin/hooks/hooks.json`), beside the skills. Installing the plugin brings
them; nothing is written into a project's or a person's settings. `wire` must be on the path.

One hook of a plugin cannot be switched off, only all hooks or the whole plugin. So the end hook has its own
switch, `WIRE_HOOK_STOP=off` (in a project's settings under `env`). The first has none: without a wireframe in
the file it does nothing.

## What it costs

Measured on 2026-11-19, a debug build on Windows, a hundred runs of the command as a process:

| Case | Middle | Slowest |
| --- | --- | --- |
| A file that is not Markdown (the `if` keeps the hook from starting at all in a session) | 88 ms | 117 ms |
| A Markdown file without a block | 88 ms | 122 ms |
| A document of ten blocks | 147 ms | 193 ms |

Starting the program is 65 ms of each. Nothing is added to the conversation when all is well. Once in a first
series a run took 9 seconds (the first start of a newly built program); it did not come back.

The single-file build compiled ahead of time is not needed for the limit of 200 ms. It would take most of the
65 ms away and is worth doing when the tool is shipped that way anyway.

## Not hooks

| Idea | Why not |
| --- | --- |
| A hook before a write that refuses a wireframe with an error | An agent writes a wireframe in steps; refusing a half-done block stops the way it works |
| A hook that renders every wireframe at the start of a session | Slow, and it changes files nobody asked to change. `wire --check` in the build is the place for that |
| A hook that shows the picture | A hook can say a path; opening a file is the client's and the skill's |
| `FileChanged`, to catch a file a shell command changed | Tried with a file's name and with `*.md`: it never came. See the findings |
| `PostToolBatch`, one render after several edits at once | It works (tried), but the event has no `if`, so the command would start after every batch of any tools |

## Outside Claude Code

| Place | How |
| --- | --- |
| A git commit | A pre-commit hook: `wire --check` on the staged `.md` and `.wire` files |
| A build | `wire --check <folder>` as a step: a stale picture fails the build |
| An editor without the extension | `wire --watch <file>` |

```sh
#!/bin/sh
# .git/hooks/pre-commit
git diff --cached --name-only --diff-filter=ACM -- '*.md' '*.wire' | while IFS= read -r f; do
  wire --check --quiet -- "$f" || exit 1
done
```

## Tests

`dotnet/tests/Wireframe.Tests/WireHookTests.cs`, 22 tests: the event as JSON for a `.cs` file, a Markdown file
without a block, one with a block, one with an error, a `.wire` file, a file that is gone, an event that is not
JSON; an edit, a second edit, an edit that removes the block; the end hook with nothing to say, with a stale
picture and an error, when it already sent the agent back, and for a deleted file.

Tried in a real session (the desktop app, 2026-11-19), from a settings file with the plugin's own entries: a
written document with an error brought the error to the agent; the corrected edit said nothing and the pictures
were there; a picture made stale by a shell command sent the agent back at the stop.

## Open

- **The plugin's own `hooks/hooks.json` was not loaded as a plugin.** The same entries were tried from a settings
  file. Installing the plugin and seeing them run is still to do.
- **`wire` not on the path** blocks nothing and says nothing to the agent (tried): the pictures then simply do not
  follow. The person's view of that failure was not looked at.
- **What the person sees** of an exit code 2 or a block in the desktop app was not looked at from the person's
  side. The owner saw this session's two trials.
- **Other agents.** The design is for Claude Code. An agent without hooks gets the same from the skills' last step
  and the build's `--check`.
