# Step 0: what building the conformance set showed

Step 0 of [the plan](000-Readme.md), done on 2026-11-19. The set is in `conformance/cases`; the task list is
[600-Tasklist.md](600-Tasklist.md).

## The set

| | |
| --- | --- |
| Cases | 371 |
| Files | 2,597: per case its source, tree, diagnostics and four SVGs |
| Size | 6.3 MB |
| Keywords of the language no case uses | none of 104 |
| Cases with diagnostics | 63 |
| Kinds of diagnostic in the set | 12 |

Where the cases come from:

| Origin | Cases | From |
| --- | --- | --- |
| `example-`, `theme-`, `demo-` | 43 | The `.wire` files of `docs` and `demos` |
| `test-` | 44 | Sources inside the tests of `core` and `cli` |
| `doc-` | 272 | The `wireframe` blocks of `docs/*.md` and of the language's specification (`architecture/Wireframe/docs`). A block that is a part of a wireframe is put in one |
| `extra-` | 12 | Written by hand: the errors and edges nothing else reached |

How it is kept:

| Call (from `wireframe/`) | Does |
| --- | --- |
| `pnpm conformance:collect` | Adds a case for every source it finds that is not a case yet |
| `pnpm conformance:write` | Writes each case's expected files from the TypeScript implementation |
| `pnpm conformance:check` | Exit 1 when a file is not what the implementation gives now |
| `pnpm conformance:coverage` | The keywords no case uses, and how often each kind of diagnostic occurs |
| `pnpm test:run` | Includes `packages/core/src/conformance.test.ts`: every case, against the sources, not the build |

`.gitattributes` keeps the set's bytes as they are: one case holds Windows line ends on purpose.

## Where the plan was changed

| The plan said | What was done | Why |
| --- | --- | --- |
| The scripts are TypeScript (`write-conformance.ts`, `check-conformance.ts`) | One script, `scripts/conformance.mjs`, with three modes, on the built core | The repository has no runner for a TypeScript script; a user of the package sees the build, so the build is what writes the set. The test in `core` holds the sources to the same files |
| The solution is `Wireframe.sln` | `dotnet/Wireframe.slnx` | What the .NET SDK on this machine makes now |
| The 351 tests' sources become cases | 44 did | Most tests build their source from parts, or are one line. The documentation's 272 blocks more than make up for it |

## Good news for the same bytes

- **No number in any of the 1,484 reference SVGs has more than two decimals, and none is written with an
  exponent.** The fear that number writing would break byte equality is not borne out by the set. The task "one
  function that writes a number, in the TypeScript renderer" is not done and may not be needed; step 2 will show.
- **The sketch theme is the same every run.** Its pen takes its seed from the shape's own position and size, never
  from the clock. The task "the sketch pen's seed is fixed in the set" needed nothing.
- **Two runs of the TypeScript implementation give the same files**: `check` after `write` is clean.

## What the port must copy exactly

Found by reading the code for step 0; each is a place where two platforms differ by default.

| Where | What |
| --- | --- |
| The sketch pen's generator (`renderer/sketch.ts`) | `(seed * 1103515245 + 12345) & 0x7fffffff` in JavaScript numbers: the product is larger than a double holds exactly, so the low bits are already lost before the `&`. The .NET port must do the same double arithmetic and the same conversion to a 32-bit whole number, not exact whole-number arithmetic |
| `toFixed(1)` in the pen | JavaScript rounds the double's exact decimal value. .NET's `ToString("F1")` must be checked against it on the set, not assumed |
| A rounded rectangle in the pen | Writes numbers straight into the path with no rounding. None reached the set with long decimals, so either the branch is not taken or the values are whole; step 3 finds out |
| Text measuring (`renderer/layout.ts`) | A character is 8 wide: a rule, not a font. `length` is in UTF-16 units, as .NET's is |
| The tree as JSON | Keys sorted, `undefined` left out, written as `JSON.stringify(value, null, 2)` writes it: .NET's own JSON writer escapes more characters by default, so the port writes its own |

## What looked wrong in the language or its documentation

Not fixed: the set records what the implementation does today. Each is for the owner to decide, and a decision to
change one is a change to the set.

| # | What | Seen in |
| --- | --- | --- |
| 1 | A document that is never closed reports nothing. The parser has a message for it ("Expected /wireframe to close document") that the case does not get | `extra-error-document-not-closed` |
| 2 | An empty source, and a source with no `wireframe` line, report nothing | `extra-error-empty`, `extra-error-no-wireframe-line` |
| 3 | An unterminated string is reported twice at the same place | `extra-error-unterminated-string`, `…-at-end` |
| 4 | `ColumnText` and its kin in a `DataGrid`, written as the documentation's own example writes them, give "Unexpected token" | `extra-modifier-editable-and-booleans`, and the `doc-` cases from `EXAMPLES.md` |
| 5 | 58 of the 272 blocks of the documentation and the specification do not parse cleanly: 510 "Unexpected token", 40 "Unknown closing keyword" | The `doc-` cases with diagnostics |

Number 5 is the largest: either the documentation describes a language the implementation does not read, or the
implementation is behind its specification. Which blocks, and which words, is one run of
`pnpm conformance:coverage` and a look at the `doc-…diagnostics.json` files.

## Not done in step 0

| Task of the list | State |
| --- | --- |
| A person read the set once, per component, against the language's documentation | Not done. The five findings above are what a first look gave; a reading of every case was not made |
| New cases: every control and component once with every modifier | Partly: every keyword is in a case, but not every modifier on every control |
| New cases: every layout with children that do not fit | Not written |
