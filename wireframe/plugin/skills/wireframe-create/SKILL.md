---
name: wireframe-create
description: Create a new UI wireframe in the Wireframe text language - a screen, form, dialog, list or page sketched as a fenced `wireframe` block in a Markdown document or as a `.wire` file - then validate it and render its SVG with the `wire` tool and show the picture. Use when asked to sketch, draw, mock up or wireframe a screen, to add a wireframe or a picture of a screen to a spec or a design document, or to show what a form or page would look like. Not for changing a wireframe that already exists (use wireframe-update) or for only regenerating pictures (use wireframe-render).
---

# Create a wireframe

A wireframe is text; the picture is made from it by the tool `wire`. You write the text, the tool checks it and
draws it, and you show the picture.

## The five rules

1. **The text is the source.** An SVG is written by the tool. Never write or edit one by hand.
2. **Validate before showing.** A wireframe with an error is not done.
3. **A block in a document has an id** (`` ```wireframe id=login ``), so its picture keeps its name when the
   document changes.
4. **Do not write the language from memory.** Read [reference.md](reference.md) first, and ask the tool for a word
   you have not used in this session: `wire components <name>`.
5. **Show the picture.** After a render, open or send the SVG and say its path.

## Steps

1. **Ask only what you cannot find out.** What the screen is for and which fields it has come from the request or
   the document. The style comes from the document's other wireframes (their first line: `wireframe clean`,
   `sketch`, `blueprint` or `realistic`); with none, use `clean`. One question at most.
2. **Start from the nearest example**, not from nothing: the five whole examples in [reference.md](reference.md)
   (a form, a list with a filter, a dialog, a page with tabs, a settings page).
3. **Lay it out first.** Write the layouts and sections only, with a `Label` where content will go, and render it.
   A wrong layout is cheapest to see now.
4. **Fill it in.** Use the words of the request or the specification for every label, exactly. Give an id to each
   field and button a rule, a test or a later change will name (`:txtEmail`, `:btnSave`).
5. **Validate and render.**

   For a block in a Markdown document:

   ```bash
   wire spec.md
   ```

   For a `.wire` file:

   ```bash
   wire login.wire
   ```

   The picture is written beside the source, wherever you run the tool from: `<document>.<block id>.svg` for a
   block (`spec.login.svg` for `id=login` in `spec.md`), `login.svg` for `login.wire`. The tool never changes the
   document itself. A clean run says so and ends with exit code 0:

   ```text
   ✓ spec.md#login → spec.login.svg
   ```

   Fix every line it prints as `file(line,column): error: …` and run it again; the line and column are the
   document's own.
6. **Show it and say what you assumed.** Open or send the SVG where you can show a file; where you cannot, give
   its full path. Then list in a sentence or two anything the request did not say and you chose: a field's kind,
   an order, a button, a placeholder.

## What the tool does not tell you

- **An attribute nothing reads is accepted and does nothing.** A misspelt attribute (`widht=200`) gives no error
  and no effect. The attributes that work are listed in the reference.
- **A word that is not in the language is an error at its line** (`Unexpected token: RadioButton`). Older
  documentation uses a few such words; the reference has what to write.

## Do not

- Invent fields, buttons or texts the request does not name.
- Add decoration that says nothing: icons, avatars, sample data beyond a line or two.
- Write a second wireframe of a screen that has one: change that one (the `wireframe-update` skill).
- Leave a block without an id in a document that has more than one wireframe.

## When the MCP server is there

If the tools `wireframe_validate`, `wireframe_render` and `wireframe_components` are available, use them in place of
the command: the same checks, the same messages. `wireframe_render` gives the SVG as text; ask it for the picture
as an image (`image: true`) only in a client you know shows SVG images.
