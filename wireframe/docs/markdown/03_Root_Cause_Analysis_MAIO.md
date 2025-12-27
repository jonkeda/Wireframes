# Root Cause Analysis: Wireframe Rendering in Markdown All in One

**Date:** December 27, 2025  
**Issue:** Wireframe code blocks not rendering in Markdown All in One (MAIO) extension preview  
**Status:** Analysis Complete

---

## Executive Summary

The Wireframe extension's markdown-it plugin **is correctly implemented** for VS Code's built-in markdown preview, but it **does not work** with "Markdown All in One" (MAIO) because MAIO uses its **own independent markdown engine** that does not discover or call third-party `extendMarkdownIt` functions the same way VS Code's built-in preview does.

---

## 1. How VS Code's Built-in Markdown Preview Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                VS Code (markdown-language-features)         │
├─────────────────────────────────────────────────────────────┤
│  1. Scans all extensions for:                               │
│     - package.json: "markdown.markdownItPlugins": true      │
│                                                             │
│  2. For each extension with markdownItPlugins:              │
│     - Calls extension.activate()                            │
│     - Gets extension.exports.extendMarkdownIt               │
│     - Calls extendMarkdownIt(md) to get modified md         │
│                                                             │
│  3. Chains all plugins together into one markdown-it        │
│     instance used for rendering                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Code (from microsoft/vscode)

**File:** `extensions/markdown-language-features/src/markdownExtensions.ts`

```typescript
function getContributedMarkdownItPlugins(
  contributes: any,
  extension: vscode.Extension<any>
): Map<string, Thenable<(md: any) => any>> {
  const map = new Map<string, Thenable<(md: any) => any>>();
  if (contributes['markdown.markdownItPlugins']) {
    map.set(extension.id, extension.activate().then(() => {
      if (extension.exports?.extendMarkdownIt) {
        return (md: any) => extension.exports.extendMarkdownIt(md);
      }
      return (md: any) => md;
    }));
  }
  return map;
}
```

### Our Extension Implementation

**File:** `packages/vscode-extension/package.json`
```json
{
  "contributes": {
    "markdown.markdownItPlugins": true
  }
}
```

**File:** `packages/vscode-extension/src/extension.ts`
```typescript
export function activate(context: vscode.ExtensionContext) {
  // ... extension setup ...
  
  return {
    extendMarkdownIt(md: MarkdownItInstance) {
      // Add wireframe fence rule
      md.renderer.rules.fence = (tokens, idx, ...) => {
        if (info === 'wireframe' || info === 'wire') {
          return renderWireframeToHtml(source, themeName);
        }
        // fall back to original
      };
      return md;
    }
  };
}
```

**✅ This works correctly with VS Code's built-in markdown preview** because:
1. VS Code scans for `markdown.markdownItPlugins: true`
2. Calls our `activate()` function
3. Gets the `extendMarkdownIt` from our exports
4. Calls it with the markdown-it instance

---

## 2. How Markdown All in One Works

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                Markdown All in One (MAIO)                    │
├─────────────────────────────────────────────────────────────┤
│  Has its OWN markdown-it engine (not VS Code's)             │
│                                                             │
│  1. Creates a NEW markdown-it instance                      │
│  2. Adds its OWN plugins:                                   │
│     - markdown-it-task-lists                                │
│     - markdown-it-github-alerts                             │
│     - @neilsustc/markdown-it-katex (if math enabled)        │
│                                                             │
│  3. ALSO scans other extensions and calls their             │
│     extendMarkdownIt - BUT with different timing/context    │
│                                                             │
│  4. Has BLACKLIST that excludes certain extensions:         │
│     - "vscode.markdown-language-features" (deadlock)        │
│     - "yzhang.markdown-all-in-one" (itself)                 │
│                                                             │
│  5. Uses this engine for:                                   │
│     - Print to HTML                                         │
│     - TOC generation                                        │
│     - Internal processing                                   │
│                                                             │
│  BUT: For PREVIEW, it delegates to VS Code's built-in       │
│       preview via "markdown.showPreviewToSide" command!     │
└─────────────────────────────────────────────────────────────┘
```

### Key Code (from yzhang-gh/vscode-markdown)

**File:** `src/markdownExtensions.ts`

```typescript
// MAIO discovers and loads other extensions' markdown-it plugins
function getContributedMarkdownItPlugin(extension: IVscodeMarkdownExtension) {
  return async (md) => {
    const exports = await extension.activate();
    if (exports && exports.extendMarkdownIt) {
      return exports.extendMarkdownIt(md);
    }
    return md;
  };
}
```

**File:** `src/markdownEngine.ts`

```typescript
// MAIO creates its own engine and chains plugins
private async newEngine() {
  let md = new MarkdownIt({ html: true, highlight: ... });
  
  // MAIO's own plugins first
  extendMarkdownIt(md);
  
  // Then third-party plugins
  for (const contribute of this.contributionsProvider.contributions) {
    if (contribute.extendMarkdownIt) {
      md = await contribute.extendMarkdownIt(md);
    }
  }
  return md;
}
```

**File:** `src/preview.ts`

```typescript
// For actual preview display, MAIO delegates to VS Code
async function autoPreviewToSide(editor: vscode.TextEditor) {
  await vscode.commands.executeCommand("markdown.showPreviewToSide");
}
```

---

## 3. Root Cause Analysis

### Finding: MAIO Preview Uses VS Code's Built-in Preview

Looking at MAIO's `preview.ts`:

```typescript
await vscode.commands.executeCommand("markdown.showPreviewToSide");
```

**MAIO's preview is just a wrapper around VS Code's built-in markdown preview!**

This means:
- When you open a markdown preview through MAIO, it's actually VS Code's `markdown-language-features` rendering it
- Our `extendMarkdownIt` SHOULD be called by VS Code's preview engine
- MAIO's own markdown-it engine is only used for non-preview features (Print to HTML, TOC generation, etc.)

### The Real Problem

If our plugin works with VS Code's built-in preview but not when triggered through MAIO, the issue is likely one of:

1. **Activation Timing Issue**
   - Our extension may not be activated when MAIO triggers the preview
   - Our `activationEvents` only includes `onLanguage:wireframe`
   - When viewing a markdown file, our extension isn't activated

2. **Extension Not Discovered**
   - VS Code scans for `markdown.markdownItPlugins` at specific times
   - If our extension isn't active, it won't be discovered

3. **MAIO Blacklist**
   - MAIO has an `Extension_Blacklist` - check if we're somehow excluded

---

## 4. Verification Steps

### Test 1: Check if VS Code's Built-in Preview Works

1. Disable "Markdown All in One" extension
2. Open a markdown file with wireframe code block
3. Use `Ctrl+Shift+V` to open VS Code's built-in preview
4. Check if wireframe renders

**Expected:** Should work if our implementation is correct

### Test 2: Check Activation

1. Open VS Code Developer Tools (`Help > Toggle Developer Tools`)
2. Go to Console
3. Look for errors related to our extension
4. Check if `jonkeda.wireframe-vscode` appears in loaded extensions

### Test 3: Check Extension Discovery

In console, run:
```javascript
// List all extensions with markdownItPlugins
vscode.extensions.all
  .filter(e => e.packageJSON?.contributes?.['markdown.markdownItPlugins'])
  .map(e => e.id)
```

---

## 5. Identified Issues & Fixes

### Issue 1: Activation Events Too Restrictive

**Current:**
```json
{
  "activationEvents": [
    "onLanguage:wireframe"
  ]
}
```

**Problem:** Extension only activates when a `.wire` file is opened. When viewing markdown, extension is not active, so `extendMarkdownIt` is never registered.

**Fix:** Add activation event for markdown preview:
```json
{
  "activationEvents": [
    "onLanguage:wireframe",
    "onLanguage:markdown"
  ]
}
```

Or even better, let VS Code auto-activate based on contributions:
```json
{
  "activationEvents": []
}
```

VS Code automatically adds implicit activation events for `markdown.markdownItPlugins`.

### Issue 2: Extension Discovery Timing

VS Code's markdown-language-features scans for plugins when it initializes. If our extension isn't active yet, it won't be found.

**Fix:** Ensure extension is activated before markdown preview opens by:
1. Removing restrictive activation events
2. Making the extension activate on markdown language

### Issue 3: Potential Type Issues

Our `extendMarkdownIt` function uses custom types that may not match what VS Code expects.

**Current:**
```typescript
interface MarkdownItInstance {
  renderer: {
    rules: {
      fence?: (...) => string;
    };
  };
}
```

**Recommendation:** Use `any` type for compatibility:
```typescript
return {
  extendMarkdownIt(md: any) {
    // ...
    return md;
  }
};
```

---

## 6. Verification: MAIO's Role

### Does MAIO Interfere?

Looking at MAIO's code:

1. **MAIO doesn't block other extensions** - It has a blacklist but only for known problematic extensions
2. **MAIO's preview is VS Code's preview** - It just calls `markdown.showPreviewToSide`
3. **MAIO's own engine is separate** - Used only for Print/TOC/internal features

### Conclusion

MAIO itself is NOT blocking our extension. The issue is that:
1. Our extension needs to be activated when viewing markdown
2. Our `activationEvents` is too restrictive
3. VS Code needs to know about our `extendMarkdownIt` before it builds its preview engine

---

## 7. Recommended Fixes

### Priority 1: Update Activation Events

```json
{
  "activationEvents": [
    "onLanguage:wireframe",
    "onLanguage:markdown"
  ]
}
```

### Priority 2: Simplify Types

```typescript
export function activate(context: vscode.ExtensionContext) {
  // ... setup ...
  
  return {
    extendMarkdownIt(md: any): any {
      const defaultFence = md.renderer.rules.fence;
      
      md.renderer.rules.fence = (tokens: any[], idx: number, options: any, env: any, self: any) => {
        const token = tokens[idx];
        const info = token.info.trim().toLowerCase();
        
        if (info === 'wireframe' || info === 'wire') {
          return renderWireframeToHtml(token.content, getThemeName());
        }
        
        return defaultFence 
          ? defaultFence(tokens, idx, options, env, self)
          : self.renderToken(tokens, idx, options);
      };
      
      return md;
    }
  };
}
```

### Priority 3: Add Debug Logging

```typescript
export function activate(context: vscode.ExtensionContext) {
  console.log('[Wireframe] Extension activated');
  
  return {
    extendMarkdownIt(md: any): any {
      console.log('[Wireframe] extendMarkdownIt called');
      // ... implementation ...
      return md;
    }
  };
}
```

---

## 8. Alternative Approaches

If the above fixes don't work, consider these alternatives:

### Approach A: Preview Scripts Only

Instead of `markdown.markdownItPlugins`, use only `markdown.previewScripts`:

```json
{
  "contributes": {
    "markdown.previewScripts": ["./dist/markdown-preview.js"]
  }
}
```

The script runs in the preview webview and can post-process the rendered HTML.

**Pros:** Works independently of markdown-it plugin discovery  
**Cons:** Post-processing is less elegant, may have timing issues

### Approach B: Register as a markdown-it Plugin Package

Create the markdown-it plugin as an npm package that MAIO (and others) can explicitly load.

### Approach C: WebView-based Rendering

Use `markdown.previewScripts` to inject JavaScript that:
1. Finds all code blocks with `wireframe` language
2. Renders them client-side

```javascript
// markdown-preview.js
document.querySelectorAll('pre > code.language-wireframe').forEach(block => {
  const svg = renderWireframe(block.textContent);
  block.parentElement.outerHTML = svg;
});
```

---

## 9. Test Plan After Fix

1. **Test VS Code Built-in Preview**
   - Open markdown with wireframe block
   - Use `Ctrl+K V` or `Ctrl+Shift+V`
   - Verify wireframe renders

2. **Test with MAIO Installed**
   - Enable MAIO
   - Open markdown with wireframe block
   - Use MAIO's preview command
   - Verify wireframe renders

3. **Test Activation**
   - Close all editors
   - Open a markdown file directly
   - Open preview
   - Check that wireframe renders without opening a .wire file first

4. **Test Print to HTML (MAIO feature)**
   - Use MAIO's "Print to HTML" command
   - Verify wireframe is rendered in output (this uses MAIO's own engine)

---

## 10. Summary

| Component | Status | Notes |
|-----------|--------|-------|
| Our package.json | ✅ Correct | `markdown.markdownItPlugins: true` is set |
| Our extendMarkdownIt | ✅ Correct | Returns md with fence rule |
| Activation Events | ❌ Issue | Only `onLanguage:wireframe` - too restrictive |
| MAIO Blocking | ❌ Not an issue | MAIO delegates to VS Code for preview |
| VS Code Discovery | ⚠️ Depends | Requires our extension to be active |

### Root Cause
**Our extension is not activated when viewing markdown files, so VS Code cannot discover and call our `extendMarkdownIt` function.**

### Solution
**Add `onLanguage:markdown` to `activationEvents` to ensure our extension is active when markdown previews are rendered.**

---

## References

- [VS Code Markdown Extension API](https://code.visualstudio.com/api/extension-guides/markdown-extension)
- [Markdown All in One Source](https://github.com/yzhang-gh/vscode-markdown)
- [VS Code markdown-language-features](https://github.com/microsoft/vscode/tree/main/extensions/markdown-language-features)
