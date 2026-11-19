---
name: wireframe-render
description: Render, regenerate or check the SVG pictures of UI wireframes written in the Wireframe text language, with the `wire` tool - for one file, a folder of Markdown documents and `.wire` files, or "everything that is stale" - and report what was written, what was already current and what could not be rendered. Use when asked to render or re-render wireframes, to refresh or regenerate their pictures or SVGs, to check whether the pictures are up to date, or when a hook or a build reports a stale or missing wireframe picture. Not for writing or changing the wireframe text itself.
---

# Render wireframes

The pictures follow the text. This skill makes them current and says what it found; it changes no wireframe.

## The rules

1. **The text is the source.** An SVG is written by the tool. Never write or edit one by hand.
2. **Check before you write.** `--check` reads and writes nothing.
3. **A wireframe with an error gets no picture**, and you say so. You do not fix the wireframe here; that is the
   `wireframe-update` skill, when asked.
4. **Show what you rendered** when it is one or two pictures; for a folder, give the list.

## Steps

1. **What is asked:** one file, a folder, or everything that is stale.
2. **Check.**

   ```bash
   wire docs/spec.md --check
   ```

   For a folder, name the folder: every `.wire`, `.md` and `.markdown` file under it is taken. A pattern in a
   file's name works too, in any shell:

   ```bash
   wire docs --check
   ```

   It prints a line per picture that is missing or stale and per wireframe with an error, and ends with exit code
   1 when there is any. Exit code 0: everything is current, and you are done; say so.
3. **Render what is not current.**

   ```bash
   wire docs/spec.md
   ```

   A picture whose source did not change is not written again. A block that is gone has its picture deleted, when
   the tool wrote that picture. Add `--link` only for a document that already has picture lines between
   `<!-- wire:image -->` markers.
4. **Report**, in four short lists as they apply: written, already current, deleted, and not rendered with the
   error of each (`file(line,column): error: …`).

## Things to know

- **`--check` must be given the same options the render was given.** A picture rendered with `-t sketch` or
  `-w 800` is stale to a check without them. Use the options the repository's build or hook uses; when you do not
  know them, look for a wireframe config file or the hook's command before you render everything anew.
- **A new version of the tool makes every picture stale**, because the picture's first line names the version.
  When `--check` reports every picture at once, that is the likely cause: say so before rendering them all.
- **A picture the tool did not write is never overwritten or deleted.** The tool reports it; leave it, and say so.
- **For machines:** `--json` gives the same result as data, with a `status` per picture.

## Do not

- Edit a wireframe to make it render.
- Delete an SVG by hand.
- Render with other options than the repository uses, to make a check pass.

## When the MCP server is there

`wireframe_check` for step 2 and `wireframe_render_document` for step 3 do the same and need no shell.
