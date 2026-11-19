# Step 1: what porting the lexer and parser showed

Step 1 of [the plan](000-Readme.md), done on 2026-11-19 by a delegated agent and checked by the session that
delegated it. The task list is [600-Tasklist.md](600-Tasklist.md).

## The gate

| | |
| --- | --- |
| `dotnet build Wireframe.slnx` | 0 warnings, 0 errors, on `net10.0` and `netstandard2.0` |
| `dotnet test Wireframe.slnx` | 767 passed, 0 failed, 0 skipped |
| Of those | 371 trees and 371 sets of diagnostics, each the same text as its file; a count of the cases; 24 unit tests |
| The set | Unchanged: `node scripts/conformance.mjs check` is clean |
| Node | The .NET build and tests start none |

No case is skipped, named in the test, or compared loosely.

## What was written

In `dotnet/src/Wireframe` (about 3,000 lines):

| File | What |
| --- | --- |
| `WireframeParser.cs` | The entry point: `WireframeParser.Parse(source)` |
| `Syntax/TokenKind.cs`, `Token.cs`, `Keywords.cs` | The tokens and the tables of keywords |
| `Syntax/Lexer.cs` | The lexer, ported line for line |
| `Syntax/Nodes.cs` | The tree as immutable records, with the TypeScript tree's names and fields |
| `Syntax/Parser.cs` | The parser, with the same recovery |
| `Syntax/Diagnostic.cs` | `Diagnostic` (message, line, column, offset) and `ParseResult` |
| `Syntax/JsText.cs` | JavaScript's `trim`, `Number.prototype.toString`, `parseInt`, and its test of what is a number |
| `Syntax/JsJson.cs`, `SyntaxJson.cs` | A JSON writer that writes what `JSON.stringify(sorted(value), null, 2)` writes |

In `dotnet/tests/Wireframe.Tests`: `ConformanceTests.cs` (a tree test and a diagnostics test per case; the files read
as raw bytes) and `JsTextTests.cs`.

## What had to be copied from JavaScript, exactly

The renderer's port meets each of these again.

| What | How it was done |
| --- | --- |
| A number as text | `Number.prototype.toString` written out by hand: the shortest digits that read back as the same number, then JavaScript's layout. Plain between 1e-7 and 1e21, with an exponent outside (`1e+21`, `1.5e-7`); `-0` is `0` |
| A number that is not finite, in JSON | `null` |
| A string in JSON | Only `"`, `\`, the five short escapes and other control characters are escaped; `<`, `>`, `&`, `'` and non-ASCII text stay as they are. A lone surrogate is escaped |
| The order of an object's keys | Keys that look like array indexes come first, in the order of their numbers, whatever was sorted; then the rest by code unit. It matters for a data section whose column headers are numbers |
| An attribute's value | A number only when written exactly as JavaScript would write it: `1`, `1.5`, `1e+21`, even `Infinity`. `1.0`, `-0`, `01` and `1e21` stay text |
| A file's own characters | A source file that holds an escape for a line separator was changed into the character itself by the editor tool on Windows and broke the build; the table of white space is written as numbers |

## What looks wrong in the language, and was copied on purpose

Fixed later for a, b, c, d (keywords) and h: see [680-LanguageFixes.md](680-LanguageFixes.md). At the time:
not fixed: the set records what the implementation does. Each is for the owner to decide; a decision to change one
is a change to the set, in both implementations.

| # | What | Where in the TypeScript | Shown by |
| --- | --- | --- | --- |
| a | An unterminated string is reported twice | `lexer.ts`, `scanString` | `extra-error-unterminated-string`, `…-at-end` |
| b | A document that is never closed reports nothing | `parser.ts`, `parseDocument`: it says "Expected /wireframe…" only when it is not at the end of the input | `extra-error-document-not-closed` |
| c | A backslash as the last character of the source adds the text "undefined" to the string | `lexer.ts`, `readEscape`, reading past the end | A unit test; no case |
| d | Some words find properties of JavaScript's own objects: `constructor`, `toString`, `valueOf`, `__proto__`. `wireframe toString` gives no "Unknown wireframe style"; an attribute or a table column named `__proto__` is dropped | `KEYWORDS[value]` is a lookup in a plain object | No case |
| e | An icon can be set on a layout, a section and a repeat, though the tree declares it for controls and components only | `parseElementModifiers` | The trees |
| f | `dock` is not checked: it can be a number or `true`; `dock=0` and `dock=""` are dropped | `parseSection` | No case |
| g | See "An attribute's value" above | | |
| h | **Several keywords are read by the lexer and never by the parser:** `Step`, `BreadcrumbItem`, `Row`, `Cell` and the typed `Column…` words. They give "Unexpected token" (60 times for `Cell` alone), and `/Row` gives "Unknown closing keyword" | `isComponentToken` leaves them out | `doc-05-data-display-002`, `doc-00-language-specification-038`, and many more |
| i | An unexpected indent is reported as "Unexpected token:" followed by spaces | | `demo-phase2-showcase`, `doc-00-language-specification-001` |
| j | On a line that ends in Windows line ends, the line-end token starts at column 0 of the next line | The token's start is worked out from a one-character value after two were read | In the port; no expected file shows a column 0 |
| k | Smaller: a `Repeat` count is read with `parseInt` (`2.5` is 2, `50%` is 50, a negative count is kept); the style in "Unknown wireframe style" is shown in lower case; a `component` header takes every token to the end of the line; `Desktop`, `Tablet`, `Mobile`, `ELSE_IF` and `ERROR` are kinds of token that are never made | | |

**Finding h is the cause of step 0's largest finding**: 58 of the documentation's 272 blocks do not parse cleanly
because the documentation uses words the parser does not read. It is the first thing for the owner to decide.

## What the .NET port cannot do the same

| What | Why |
| --- | --- |
| Very deep nesting | The TypeScript parser catches a stack overflow and reports "Unexpected parser error". .NET cannot catch one: such a source would end the process. No case has it. To be solved before the tool is used on sources nobody checked: a depth limit, in both implementations |
| Rare characters | Letters are told by .NET's Unicode tables, not Node's, and lower case by .NET's rule. They could differ on rare characters; no case does |
| `netstandard2.0` on the old .NET Framework | Number formatting there may round differently. The tests run on `net10.0` only |

## Not done in step 1

| Task of the list | State |
| --- | --- |
| `Diagnostic` with a code, a length and a fix | It has message, line, column and offset: what the TypeScript side gives. Codes and fixes are new to both sides and would change the set |
| `WireframeBlocks`: the `wireframe` blocks of a Markdown text | Not written. The tool (step 4) needs it; nothing before does |
| Property test: a tree written back to source and parsed again | Not written: there is no writer of source from a tree |
| Unit tests of indentation and recovery by themselves | The set covers them; no tests of their own |

## Left behind by the agent

Three log files at the root of the E: drive (`E:\tmp_build.txt`, `E:\tmp_build2.txt`, `E:\tmp_test.txt`). The agent
was refused when it tried to delete them, and the delegating session did not delete them for it. They are for the
owner to remove.
