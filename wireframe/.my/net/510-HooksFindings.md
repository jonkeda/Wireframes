# The hooks: what the investigation found

Step 5a of [the plan](000-Readme.md): the investigation the owner asked for before the hooks are designed for good.
This is its **first half, the reading** (2026-11-19). The second half, the experiments in a real session, is not
done; "Still to try" below says which.

Read by a delegated agent from Claude Code's documentation as it was that day: the hooks reference, the hooks guide,
the plugin components page and the plugin manifest reference (all under `code.claude.com/docs/en`). The hooks
reference is long and was read in parts, so a field's exact spelling is to be confirmed when the hooks are written.
Not read: the Agent SDK's hooks, the settings reference, the permissions page.

## What the documentation says, per question of 500

| # | Question | Answer | Settled? |
| --- | --- | --- | --- |
| 1 | What does the event after a write hold, and for which tools does it come? | The event is `PostToolUse` ("after a tool call succeeds"). Its input has `tool_name`, `tool_input`, `tool_response`, `tool_use_id`, with `session_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `hook_event_name`, and `agent_id` in a subagent. For Write, `tool_input.file_path` is the file, always as a full path. A matcher `"Edit\|Write"` is a list of exact names. **It does not come for a file a shell command changed** | Mostly. Edit's own fields, and whether other writing tools exist, are not in the pages read: to try |
| 2 | How does a hook hand a message to the agent? | Two ways. Exit code 2: the hook's standard error is shown to the agent; the tool has already run, so nothing is undone. Or exit 0 with JSON on standard output: `hookSpecificOutput.additionalContext` is added to the agent's context beside the tool's result | Yes for the mechanism. Whether the agent then acts on it: to try |
| 3 | What does the person see? | With exit 0, a `PostToolUse` hook "shows nothing in the transcript", and its standard output does not reach the agent. A `systemMessage` in the JSON is a warning shown to the person | Yes: a line like "3 wireframes rendered" is not shown. To say it, it must be a `systemMessage`, and that is a warning, so it is not said |
| 4 | Can a hook at the end send the agent back, and does the event say it already did? | The event is `Stop`. It blocks with `{"decision":"block","reason":"…"}` or exit code 2. Its input has `stop_hook_active`: true when the agent is already going on because of a stop hook. Claude Code itself stops after 8 such turns in a row | Yes |
| 5 | Does the end event say which files the session changed? | No. It has `last_assistant_message`, `background_tasks`, `session_crons`, and no list of files | Yes: the hooks keep their own list, or ask git |
| 6 | What does a hook cost? | Not in the documentation. A command hook may take 600 seconds before it is cut off; several hooks of one event run at the same time | To try |
| 7 | What happens when a hook fails or its command is not there? | Nothing is blocked: the action goes on, and the transcript has a notice of a hook error. Only a hook marked `onFailure: "block"` stops things | Yes: "a broken hook must not stop the work" is how it is anyway |
| 8 | Does a hook run for a subagent's writes, and in every client? | Yes: hooks from settings and plugins "also run inside subagents", and "wherever it runs": terminal, IDE extensions, the desktop app, cloud sessions. A headless session treats the folder as trusted, so a repository's hooks run without being asked | Yes, by the documentation. Worth one try in the desktop app |
| 9 | How does a plugin bring hooks, and can one be switched off? | `hooks/hooks.json` at the plugin's root, the same shape as in settings, with `${CLAUDE_PLUGIN_ROOT}` for the plugin's folder. Skills are `skills/<name>/SKILL.md`. **One hook cannot be switched off**: only all hooks (`"disableAllHooks": true`), or the plugin | Yes |
| 10 | Does a file a hook writes set the hook off again? | `PostToolUse` is tied to tool calls, and a hook's write is not one. But there is a separate event, `FileChanged`, driven by a watcher of the file system; whether a hook's own write sets that off is not said | Yes for `PostToolUse`. To try if `FileChanged` is used |

## What else the reading turned up

| What | Why it matters here |
| --- | --- |
| An `if` on a hook: one permission rule, such as `"Edit(*.md)"`, and the hook runs only when the tool call fits it | The hook need not start at all for a file that cannot hold a wireframe. One rule per hook, so four entries: Write and Edit, for `.md` and for `.wire` |
| `FileChanged`: fires when a watched file changes on disk, however it changed. The guide names it as the way to catch a file a shell command rewrote | It could replace the end-of-turn net for files changed by a command. Its watch entries are literal file names in the working folder, which may be too narrow for "every Markdown file": to try |
| `PostToolBatch`: after a whole batch of tool calls that ran together | One render after several edits at once, in place of one per edit |
| A hook marked `async: true` does not hold the agent up; what it says arrives on the next turn, and it cannot block | A slow render need not be felt. The diagnostics would come a turn late |
| `scratchpad_dir` in every hook's input, and `CLAUDE_PLUGIN_DATA` for a plugin's own folder | Where the hooks keep the list of files they rendered this session (question 5) |
| A change to a settings file is picked up while the session runs | The experiments need no restart between tries |
| Hooks of several settings files add up; none replaces another | A project's hooks and a plugin's both run. The same handler in two settings files runs once; a plugin's copy runs beside it |
| Other kinds of hook than a command: a call over HTTP, an MCP tool, a prompt to a model, an agent | An MCP tool as a hook would let the hook be the server's own `wireframe_validate`. Not needed while the command does it |

## What this changes in the design of 500

| The first sketch said | Now |
| --- | --- |
| The hook returns at once for a file that holds no wireframe | Still, and before that the `if` keeps it from starting for other kinds of file |
| It says one line to the person when it wrote something | Dropped: with exit 0 nothing is shown, and the only way to say it is a warning |
| Diagnostics go to the agent "with the code that hands its message to the agent" | Exit code 2 with the diagnostics on standard error. To be tried against JSON with `additionalContext`, which does not look like an error |
| The end hook takes the session's changed files "from the event's record" | The event has none. The first hook writes each file it handled into a list under `scratchpad_dir`; the end hook reads it |
| The end hook sends the agent back once, "when the event says it was already sent back, it exits 0" | As designed: that is `stop_hook_active` |
| A failure of the hook itself is a line to the person and exit 0 | Nothing to build: a failing hook blocks nothing by default |
| Installing adds two entries to the project's settings | The plugin carries `hooks/hooks.json`; nothing is written into anyone's settings |
| A project can switch one hook off | It cannot. The end hook therefore gets its own switch: an environment variable or a line in the project's wireframe config that the command reads |

## What was tried

On 2026-11-19, in a real session of the desktop app, with the owner's leave: a throwaway hook in the project's
`.claude/settings.local.json` that wrote what it was given to a log, and answered as a file beside it said. The
settings file and its folder were removed afterwards. The installed `claude` command does not start under the
machine's Node, so no headless session was used.

| # | Tried | Seen |
| --- | --- | --- |
| A | A Write and an Edit, the whole input logged | Every event: `session_id`, `transcript_path`, `cwd`, `scratchpad_dir`, `prompt_id`, `permission_mode`, `effort`, `hook_event_name`. `PostToolUse` adds `tool_name`, `tool_input`, `tool_response`, `tool_use_id`, `duration_ms`. Write: `tool_input` has `file_path`, `content`; `tool_response` has `type`, `filePath`, `content`, `originalFile`, `structuredPatch`, `userModified`. Edit: `tool_input` has `file_path`, `old_string`, `new_string`, `replace_all`; `tool_response` the same in camel case, with `originalFile` and `structuredPatch`. `file_path` is a full path with the system's own separators. `cwd` is where the session stands at that moment, and it moved during the session; `CLAUDE_PROJECT_DIR` in the environment is the project's root |
| B | A file written by a shell command | No `Edit` or `Write` event. The shell's own `PostToolUse` has `stdout`, `stderr`, `interrupted`, and no list of files. The tools that write a file in this client are Write, Edit and NotebookEdit; there is no multi-edit |
| C | The same edit answered three ways | Exit 2 with text on standard error reached the agent as "PostToolUse:Edit hook blocking error from command: …". Exit 0 with `additionalContext` reached it as "PostToolUse:Edit hook additional context: …". Exit 0 with plain text on standard output reached nobody. Both of the first two arrive straight after the tool's result. How each looks to the person was not seen from the person's side |
| D | The cost | Nothing is added to the conversation by a hook that exits 0. In time, 30 runs each: a shell that does nothing 38 ms; `wire --version` 65 ms; `wire --check` on a document of one block 90 ms, through a shell 169 ms; a render 111 ms. So the hook is started without a shell (`args`). The built hook, 100 runs: 88 ms for a file without a wireframe, 147 ms (slowest 193) for a document of ten blocks. Not done: a hundred edits in a session timed with and without the hook |
| E | `FileChanged`, with a file's name as matcher and with `*.md`, added while the session ran | It never came: not for a file created or changed by a shell command in the project's root, nor in the folder the session stood in. Whether it needs to be there when the session starts was not tried. Not used |
| F | A stop hook that blocks twice | The block reached the agent as "Stop hook feedback: …" and the turn went on. The first event had `stop_hook_active` false, the second true. The event also has `last_assistant_message`, `background_tasks`, `session_crons`, and no files. A third stop in the same turn, by the real hook, was let through: `stop_hook_active` stays true for the rest of the person's turn (most likely; that stop was not logged). After the person's next message it blocked again |
| G | The plugin's entries (`command`, `args`, `if`) with the built tool, from the settings file | They ran: an error in a written document came to the agent, a corrected edit said nothing and wrote the pictures, a picture made stale by a shell command sent the agent back at the stop. The plugin itself was not installed |
| H | A matcher in lower case, `edit\|write`, beside `Edit\|Write` | It never ran. Matchers care about case |

Also seen:

| What | Why it matters |
| --- | --- |
| `"if": "Edit(*.md)"` ran for an Edit of a `.md` file only, `"if": "Write(*.md)"` for a Write only, neither for a `.txt` file; a file outside the project fitted by its full path | Four entries keep the hook from starting for any other file |
| `PostToolBatch` came once after three tool calls sent together, with `tool_calls`: each call's name, input and its result as text | One render per batch is possible. Not used: the event has no `if` |
| The settings file was picked up at once, though the project had no `.claude` folder when the session began | No restart to try a hook |
| Several hooks of one event ran in the same second | As the documentation says |

Tried later the same day, with the same logging hook:

| Tried | Seen |
| --- | --- |
| A hook that exits 1 with text on standard error | Nothing reached the agent; the edit stood |
| A hook that sleeps 15 seconds, with a `timeout` of 4 | Cut off after about 4 seconds; nothing reached the agent |
| A command that does not exist, started directly (`args`) and through a shell | Nothing reached the agent; the write stood |
| A Write by a subagent | The hook ran, with `agent_id` and `agent_type` in its input. The subagent saw no message |

Not tried: an SDK session (question 8); installing and removing the plugin (question 9).
