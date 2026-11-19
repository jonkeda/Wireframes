# 4. The skills

Part of [the plan](000-Readme.md). Three skills an agent follows: one to create a wireframe, one to update one, one
to render. They call the tool (`wire`) and, where it is there, the MCP server's reference.

## Why three and not one

Each is loaded when its own words are said, and each is short. An agent asked to "add a field to the login screen"
needs the rules for changing an existing wireframe, not the page on how to start one.

| Skill | Loaded when someone asks to | Ends when |
| --- | --- | --- |
| `wireframe-create` | Sketch, draw or mock up a screen, a form, a dialog, a page; put a wireframe in a spec | The wireframe validates, is rendered, and the picture was shown |
| `wireframe-update` | Change a wireframe that exists: add, move, rename, remove, restyle | The same, and nothing changed that was not asked |
| `wireframe-render` | Render, regenerate, refresh or check the pictures of a file or a folder | Every block has a current SVG, or the stale ones are named |

They live in this repository as a plugin (`wireframe/plugin/skills/<name>/SKILL.md`), so a repository that uses
wireframes installs them and does not copy them.

## What every skill says

The same five rules stand at the top of each.

1. **The text is the source.** An SVG is written by the tool, never by hand, and never edited.
2. **Validate before showing.** A wireframe with an error is not shown as done.
3. **A block in a document has an id**, so its picture keeps its name when the document changes.
4. **Do not learn the language from memory.** Ask for the component (`wire components <name>`, or the server's
   `wireframe_components`) before using one for the first time in a session.
5. **Show the picture.** After a render, open or send the SVG; say its path.

## `wireframe-create`

| Step | What |
| --- | --- |
| 1. Ask what is not known | What the screen is for, on what device (the language has `desktop`, `tablet`, `mobile`), which theme the document's other wireframes use. One question at most; otherwise take the document's habits |
| 2. Find the nearest example | `wire components`, and an example of the same kind (`wireframe_examples`, or `docs/examples`). Start from it, not from an empty block |
| 3. Outline first | The layout only: the containers and sections, no controls. Render it. A wrong layout is cheaper to see now |
| 4. Fill in | Controls with the labels the specification uses, word for word. A field the specification names gets an id (`:txtEmail`), so a rule can point at it |
| 5. Validate, render, show | `wire <file> --json`; fix every diagnostic; then the picture |
| 6. Say what was assumed | Anything the request did not say: a field's kind, an order, a button |

What it must not do: invent fields the request does not name, add decoration (icons, avatars, placeholder texts)
that says nothing, or write a second wireframe of a screen that has one.

The skill's reference holds one page: the layouts and when each fits, the twenty controls that cover most screens,
and five whole examples (a form, a list with a filter, a dialog, a page with tabs, a settings page).

## `wireframe-update`

| Step | What |
| --- | --- |
| 1. Find it | The file and the block, by its id or its heading. Read the whole block |
| 2. Render it as it is | So there is a picture of before, and a known-good state: an error that was there already is said, not fixed in passing |
| 3. Change the least | The lines the request is about. Keep ids, order, spacing and the names of things that did not change |
| 4. Keep what points at it | An id that a specification's rule or a test names is not renamed; when it must be, every place that names it is changed in the same edit, and listed |
| 5. Validate, render, show both | Before and after, side by side or one after the other |
| 6. Say what changed | In the wireframe's own words: "Email moved above Name; Remember me removed" |

What it must not do: reformat the block, change the theme, or "improve" what was not asked.

## `wireframe-render`

| Step | What |
| --- | --- |
| 1. What is asked | One file, a folder, or "everything stale" |
| 2. Check first | `wire <path> --check --json`: which blocks are stale or have no picture |
| 3. Render those | `wire <files>`; with `--link` only where the document already has picture lines |
| 4. Report | Written, unchanged, deleted, and any block that has an error and so got no picture |

This skill is also what the hook's message points an agent at when a render failed.

## How the skills are tried

A skill is done when an agent that has only the skill does the work right the first time. For each, three tasks run
by a fresh agent, and judged by the tool, not by reading:

| Skill | Task | Passes when |
| --- | --- | --- |
| create | "A login form with email, password, remember me and a sign-in button, in spec.md" | `wire spec.md --check` is clean; the block has an id; the four things are there and nothing else |
| create | "A list of invoices with a filter on status and a button to add one" | The same; a table and not a list of labels |
| update | "Add a phone field under email" in a block with ids that a rule names | One line added; every id as before |
| update | "Rename the Save button to Create" | One word changed; the SVG differs in that text only |
| render | A folder with ten documents, three stale | Three written, seven untouched |

The tasks and their expected results are kept beside the skills and run again when a skill or the language changes.

## Open

- Whether `wireframe-create` should also read a running page and draw it (a wireframe from a screen). It would
  join this to Bruinet's Scraper. Not in this plan.
