---
name: wireframe-update
description: Change a UI wireframe that already exists in the Wireframe text language - add, move, rename, remove or restyle elements in a fenced `wireframe` block of a Markdown document or in a `.wire` file - changing only what was asked, keeping every id that something else points at, then validate, re-render the SVG with the `wire` tool and show before and after. Use when asked to edit, update, tweak, extend or fix a wireframe, to add a field or button to a screen that has a wireframe, or to bring a wireframe in line with a changed spec. Not for a screen that has no wireframe yet (use wireframe-create).
---

# Update a wireframe

Change the least that does what was asked. A wireframe is pointed at: a specification's rule names `:txtEmail`, a
test names `:btnSave`, a picture is linked from a document. What you did not mean to change must still be there.

## The five rules

1. **The text is the source.** An SVG is written by the tool. Never write or edit one by hand.
2. **Validate before showing.** A wireframe with an error is not done.
3. **A block in a document has an id**, so its picture keeps its name. Never change or remove a block's id.
4. **Do not write the language from memory.** Read `../wireframe-create/reference.md`, and ask the tool for a word
   you have not used in this session: `wire components <name>`.
5. **Show the picture.** After a render, open or send the SVG and say its path.

## Steps

1. **Find it.** The file and the block, by its id or the heading it stands under. Read the whole block.
2. **Render it as it is, before you touch it.**

   ```bash
   wire spec.md --validate
   ```

   An error that is there already is not yours: say it, and do not fix it in passing unless asked. Keep the
   picture as it is now, so you can show before and after: it is beside the document, named
   `<document>.<block id>.svg` (`spec.login.svg` for the block `id=login` of `spec.md`). Copy it aside.
3. **Change the fewest lines.** Only the lines the request is about. Keep the order, the spacing, the indentation,
   the style line, and the names of everything that did not change. Do not reformat the block.
4. **Keep what points at it.**
   - Search the repository for each id you would change or remove (`:txtEmail` appears as `txtEmail` in a
     specification's rules, in tests, in other wireframes' `@` targets).
   - An id something names is not renamed. When the request requires it, change every place that names it in the
     same edit, and list those places in your answer.
   - A new element that a rule or a test will name gets an id, in the document's own style of ids.
   - A new field follows its neighbours' shape (the same grouping, a placeholder in their style). It is `required`
     only when the request or a rule of the document says so; say in your answer which you chose.
5. **Validate and render.**

   ```bash
   wire spec.md
   ```

   The tool writes the picture beside the document, wherever you run it from, and never changes the document. A
   clean run prints `✓ spec.md#login → spec.login.svg` and ends with exit code 0. Fix every
   `file(line,column): error: …` line; the line and column are the document's own.
6. **Show before and after, and say what changed** in the wireframe's own words: "Phone added under Email; Remember
   me removed". Say also what you left alone on purpose when it looked wrong.

## What the tool does not tell you

- **An attribute the renderer does not know is accepted and does nothing**: `width=200`, `justify=between`. The
  width is `w=200`. If the block you are changing has such attributes, leave them and mention them; removing them
  is a change nobody asked for.
- **A `title="…"` on a card, a modal or a dialog is not drawn.**
- **A block without an id is named by its number in the document.** Adding a block above it renames its picture.
  If you add a block to a document whose blocks have no ids, say so, and propose ids rather than adding them
  unasked.

## Do not

- Reformat, re-indent or reorder what you were not asked to change.
- Change the style (`wireframe clean` to `sketch`) or the theme.
- "Improve" labels, add fields, or remove what looks unused.
- Edit the SVG, or leave it stale: after your edit the picture is rendered again.

## When the MCP server is there

Use `wireframe_validate` before and after the edit and `wireframe_render` to show the picture; the edit itself is
an ordinary edit of the text.
