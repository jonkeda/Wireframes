# Step 6: what writing and trying the skills showed

Step 6 of [the plan](000-Readme.md), done on 2026-11-19. The design is [400-Skills.md](400-Skills.md); the task
list is [600-Tasklist.md](600-Tasklist.md).

## What was written

`wireframe/plugin/`, a plugin for Claude Code:

| File | What |
| --- | --- |
| `.claude-plugin/plugin.json` | The plugin's name and version |
| `skills/wireframe-create/SKILL.md` | A new wireframe: written, validated, rendered, shown |
| `skills/wireframe-create/reference.md` | The language on one page, with five whole examples. Every block in it validates: `wire plugin --validate` |
| `skills/wireframe-update/SKILL.md` | A change to a wireframe that exists, changing only what was asked |
| `skills/wireframe-render/SKILL.md` | Making the pictures current, or checking that they are |
| `README.md` | What the plugin holds |

The hooks came into the plugin later the same day (`hooks/hooks.json`, step 5b).

## The trials

Two of the five trials the design lists were run, each by a fresh agent (a smaller model than the one that wrote the
skills) that was given the skill's path, the tool's path and the user's one-line request, and told to treat the
skill as all it knows of the language. Each was judged by the tool, not by reading.

| Skill | Request | Result | Judged by |
| --- | --- | --- | --- |
| create | "In spec.md, under 'Sign in', add a wireframe of the sign-in form." The document names an email, a password, "Remember me" and "Sign in" | **Passed, first time.** One block with an id; the four things and nothing else: the agent left the reference example's "Forgot password?" link out because the document does not name it | `wire spec.md --check` is clean; one fence with an id; four ids in the block |
| update | "Add a phone field under the email field of the new contact form", in a block whose ids a rule of the document names | **Passed, first time.** Four lines added, none changed or removed; every id as before and one new; the field not marked required because the rule names only name and email | `wire spec.md --check` is clean; the two files differ by four added lines; the ids before are the ids after, plus one |

The design's gate, "an agent with only the skills writes a login form that validates and renders, first time", is
met by the first trial.

Not run: the list with a filter (create), the rename of a button (update), the folder of ten documents (render).
The trials and their expected results are not kept beside the skills yet, so they cannot be run again by a command.

## The trials as a command, and all five run

Later the same day the five trials were written down as a command, `scripts/skill-trials.mjs`:
`prepare <folder>` writes each trial's starting files and its request, `judge <folder>` judges what an agent left
there by the tool and by facts of the text (which lines changed, which ids are there), `list` names them. Each was
given to a fresh agent on a smaller model with only the skill.

| Trial | Result |
| --- | --- |
| 1. The sign-in form (create) | Passed |
| 2. The orders list with a search field and a filter (create) | **Failed, then passed.** The agent wrote `Table rows=5 cols=3`, as the reference's own example did; the three column names of the document were nowhere, and the picture had no table at all (finding 5 below). The reference was changed to build a table from a `Grid` of labels; a second fresh agent passed |
| 3. A phone field under the email field (update) | Passed: one line added, nothing changed, not marked required |
| 4. The Save button renamed (update) | Passed: one line changed, the id kept |
| 5. A folder of ten documents: seven current, two stale, one with an error (render) | Passed: two written, the error reported and not "fixed", no document edited |

Said by more than one agent and not changed: the skills do not say where in a section the block goes (after its
text, all did), and "lay it out first" was skipped again for a small screen.

## What the agents said was missing, and what was changed

| Said | Changed |
| --- | --- |
| "Open or send the SVG" has no answer for an agent that can show no file | The skill says: where you cannot show a file, give its full path |
| The skill never says that the tool leaves the document alone, or what a clean run prints | Both said, with the line a clean run prints |
| The picture's name was given by one example (`spec.login.svg`) and not as a rule | The rule is given: `<document>.<block id>.svg` |
| Where to run the tool from, and where the picture lands | Said: beside the document, wherever the tool is run from |
| Whether a new field is required, and what placeholder it gets | Said: its neighbours' shape; required only when the request or a rule of the document says so; say which was chosen |
| The create agent skipped "lay it out first" because an example already fitted | Left as it is: a fair call for a small form. To watch on a larger screen |

## What writing the reference showed about the language

The reference had to be written against the tool, not against the documentation, because the two disagree. Each of
these is stated in the skills so an agent does not walk into it, and each is for the owner to decide.

| # | What | How it was found |
| --- | --- | --- |
| 1 | **An attribute the renderer does not know is accepted and does nothing.** No error, no warning. The renderer reads `w`, `h`, `gap`, `padding`, `cols`, `rows`, `align`, `level`, `size`, `variant`, `type`, `value`, `page`, `total`, `steps`, `current`, `dock`, and `canvas`, `x`, `y`. `width`, `height` and `justify` are not among them, though the README's own first example writes `justify=between` and the documentation's sidebar example writes `width=200` | The names the layout and the renderer ask for, listed from the code |
| 2 | **A `title="…"` on a card, a modal or a dialog is not drawn.** The documentation's modal and dialog examples use it | Rendered: the title's text is not in the SVG |
| 3 | `Step`, `BreadcrumbItem`, `Row`, `Cell` and the `Column…` words do not parse (step 1's finding h). The working forms are a `Label` or a `Link` per item | The reference's examples, validated |
| 5 | **A `Table` draws nothing.** `Table rows=5 cols=3` validates and leaves the picture empty, in both implementations: the documentation's own example (`conformance/cases/doc-05-data-display-001`) is a white rectangle, and no picture of the set holds a table's "Column 1". The code that would draw it is never reached. A table written with Markdown rows (`| Name | Email |`) parses and is not drawn either. The `Column…` words that would name the columns do not parse (3). The skill's reference used `Table` in its list example until the trial of the orders list showed it; it now builds a table from a `Grid` of labels | The second trial; the set's pictures |
| 4 | The tool did not expand a wildcard or take a folder, so `wire docs/*.md` worked in Bash and failed in PowerShell | Tried. **Fixed** in the tool the same day |

Number 1 is the one an author meets most: a wireframe that validates and renders, and silently ignores half of
what was written. A warning for an attribute nothing reads would be a change to the diagnostics, in both
implementations and in the set.

## Later

The faults in the table above were fixed the same day: see [680-LanguageFixes.md](680-LanguageFixes.md). The
skills and the reference no longer teach the ways round them.

## Open

- The MCP server's `wireframe_components` shows the attributes the documentation's examples use. That is not the
  list the renderer reads (finding 1). The two should be one list, taken from the renderer.
- Whether a fence must have an empty line before it to be read as a block was asked by a trial agent and not
  looked into.
