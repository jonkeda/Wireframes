# Root Cause Analysis: Vditor-Based Markdown Editors

## Document Information

- **Created**: 2025-01-15
- **Status**: Analysis Complete
- **Issue**: Wireframe code blocks not rendering in Vditor-based markdown editors
- **Related**: [03_Root_Cause_Analysis_MAIO.md](03_Root_Cause_Analysis_MAIO.md)

---

## 1. Executive Summary

Vditor-based markdown editors (such as "vscode all markdown" by tobiastao and "vscode-markdown-editor" by zaaack) use a completely different rendering architecture than VS Code's built-in markdown preview. These editors:

1. **Do NOT use VS Code's markdown-it preview infrastructure**
2. **Use Vditor's internal Lute parser** (a Go-based markdown parser compiled to WASM)
3. **Run in a WebView panel**, completely isolated from the extension host
4. **Have their own extensibility model** based on DOM post-processing

**Bottom Line**: Our current `extendMarkdownIt()` integration will **NEVER** work with Vditor-based editors because they don't use markdown-it.

---

## 2. What is Vditor?

### 2.1 Overview

[Vditor](https://github.com/Vanessa219/vditor) is a popular browser-based markdown editor (10.5k+ GitHub stars) with:

- WYSIWYG (Rich Text) mode
- Instant Rendering (Typora-like) mode
- Split View mode

### 2.2 Key Technical Details

| Aspect | Vditor | VS Code Built-in |
|--------|--------|------------------|
| **Parser** | Lute (Go → WASM) | markdown-it (JavaScript) |
| **Extensibility** | DOM post-processing | markdown-it plugins |
| **Rendering** | Client-side (WebView) | Extension host + WebView |
| **Code Block Handling** | CSS class detection (`.language-xxx`) | Token-based plugins |

### 2.3 Lute Parser

Vditor uses [Lute](https://github.com/88250/lute), a Go-based markdown parser that:

- Compiles to WebAssembly for browser execution
- Supports custom renderers via `SetJSRenderers()`
- Has its own AST structure (not markdown-it compatible)

---

## 3. How Vditor Handles Special Code Blocks

### 3.1 The Adapter Pattern

Vditor uses an "adapter" pattern for rendering special code blocks like Mermaid:

```typescript
// From: Vanessa219/vditor/src/ts/markdown/adapterRender.ts

export const mermaidRenderAdapter = {
  getCode: (el: Element) => el.textContent,
  getElements: (element: HTMLElement | Document) => element.querySelectorAll(".language-mermaid"),
};

export const chartRenderAdapter = {
  getCode: (el: HTMLElement) => el.innerText,
  getElements: (el: HTMLElement | Document) => el.querySelectorAll(".language-echarts"),
};

// Similar adapters for: math, smiles, markmap, mindmap, graphviz, flowchart, plantuml, abc
```

### 3.2 Post-Rendering Process

After Lute converts markdown to HTML, Vditor runs post-processors:

```typescript
// From: Vanessa219/vditor/src/ts/markdown/previewRender.ts

export const previewRender = async (previewElement: HTMLDivElement, markdown: string, options?: IPreviewOptions) => {
  // 1. Convert markdown to HTML using Lute
  let html = await md2html(markdown, mergedOptions);
  
  // 2. Insert HTML into DOM
  previewElement.innerHTML = html;
  
  // 3. Post-process special code blocks
  mermaidRender(previewElement, mergedOptions.cdn, mergedOptions.mode);
  chartRender(previewElement, mergedOptions.cdn, mergedOptions.mode);
  graphvizRender(previewElement, mergedOptions.cdn);
  flowchartRender(previewElement, mergedOptions.cdn);
  plantumlRender(previewElement, mergedOptions.cdn);
  // ... etc
};
```

### 3.3 Individual Renderers

Each renderer:
1. Queries the DOM for elements with `.language-xxx` class
2. Extracts the code content
3. Replaces the content with rendered output

Example (Mermaid):

```typescript
// From: Vanessa219/vditor/src/ts/markdown/mermaidRender.ts

export const mermaidRender = (element: HTMLElement | Document, cdn: string, theme: string) => {
  const mermaidElements = mermaidRenderAdapter.getElements(element);
  if (mermaidElements.length === 0) return;

  addScript(`${cdn}/dist/js/mermaid/mermaid.min.js`, "vditorMermaidScript").then(() => {
    mermaidElements.forEach(async (item) => {
      const code = mermaidRenderAdapter.getCode(item);
      const mermaidData = await mermaid.render(id, item.textContent);
      item.innerHTML = mermaidData.svg;
      item.setAttribute("data-processed", "true");
    });
  });
};
```

---

## 4. VS Code Extensions Using Vditor

### 4.1 Known Extensions

| Extension | ID | Author | Installs | Status |
|-----------|---|--------|----------|--------|
| vscode all markdown | tobiastao.vscode-md | tobiastao | 30k+ | Active |
| vscode-markdown-editor | zaaack.markdown-editor | zaaack | ~500 stars | Active |

### 4.2 How They Work

These extensions:

1. **Open markdown files in a WebView panel** (not VS Code's preview)
2. **Load Vditor library** in the WebView
3. **Initialize Vditor** with the file content
4. **Sync changes** between the editor and the file

```typescript
// From: zaaack/vscode-markdown-editor/media-src/src/main.ts

import Vditor from 'vditor'

function initVditor(msg) {
  window.vditor = new Vditor('app', {
    width: '100%',
    height: '100%',
    value: msg.content,
    mode: 'ir', // Instant Rendering mode
    // ...
  })
}
```

### 4.3 WebView Isolation

The WebView is **completely isolated** from the VS Code extension host:

- No access to VS Code APIs
- No access to other extensions
- Communication only via `postMessage()`
- Cannot call `extendMarkdownIt()` or access markdown-it

---

## 5. Why Our Current Approach Doesn't Work

### 5.1 Architecture Mismatch

```
┌─────────────────────────────────────────────────────────────────────┐
│                        VS Code Process                               │
├─────────────────────────────────────────────────────────────────────┤
│  Extension Host                                                      │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │ Wireframe Extension │    │ Vditor Extension (e.g., vscode-md)  │ │
│  │                     │    │                                     │ │
│  │  extendMarkdownIt() │    │  createWebviewPanel()               │ │
│  │         │           │    │         │                           │ │
│  └─────────┼───────────┘    └─────────┼───────────────────────────┘ │
│            │                          │                              │
│            ▼                          ▼                              │
│  ┌─────────────────────┐    ┌─────────────────────────────────────┐ │
│  │ Built-in Markdown   │    │ WebView Panel                       │ │
│  │ Preview (markdown-it│    │ ┌─────────────────────────────────┐ │ │
│  │                     │    │ │ Vditor (JavaScript library)     │ │ │
│  │ ✓ Uses our plugin   │    │ │                                 │ │ │
│  └─────────────────────┘    │ │ ✗ Lute parser (WASM)            │ │ │
│                             │ │ ✗ Own rendering pipeline        │ │ │
│                             │ │ ✗ No markdown-it                │ │ │
│                             │ └─────────────────────────────────┘ │ │
│                             └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 The Problem

| What We Do | What Vditor Does |
|------------|------------------|
| Register markdown-it plugin | Load Vditor in WebView |
| Intercept `fence` tokens | Use Lute to parse markdown |
| Render `wireframe` blocks as SVG | Look for `.language-xxx` in DOM |
| Return HTML to VS Code | Replace matched elements |

**The two systems never interact.**

---

## 6. Potential Solutions

### 6.1 Option A: Integration with Vditor Extensions (NOT RECOMMENDED)

**Approach**: Contact extension authors to integrate our renderer.

**Challenges**:
- Multiple extensions to support
- Each has different codebases
- Requires coordination with third-party maintainers
- No standard plugin API in Vditor

**Verdict**: ❌ Not practical

### 6.2 Option B: Create a Vditor Plugin (MEDIUM EFFORT)

**Approach**: Create a Vditor-compatible renderer that could be loaded by Vditor extensions.

**Implementation**:
```typescript
// wireframeRenderAdapter.ts
export const wireframeRenderAdapter = {
  getCode: (el: Element) => el.textContent,
  getElements: (el: HTMLElement | Document) => 
    el.querySelectorAll(".language-wireframe, .language-wire"),
};

// wireframeRender.ts
export const wireframeRender = (element: HTMLElement | Document) => {
  const wireframeElements = wireframeRenderAdapter.getElements(element);
  wireframeElements.forEach((item) => {
    const code = wireframeRenderAdapter.getCode(item);
    const svg = renderWireframeToSvg(code);
    item.innerHTML = svg;
    item.setAttribute("data-processed", "true");
  });
};
```

**Challenges**:
- Would need to publish as NPM package
- Vditor extension authors would need to import it
- Still requires third-party coordination
- Vditor runs in browser context (need browser-compatible build)

**Verdict**: ⚠️ Possible but requires ecosystem buy-in

### 6.3 Option C: Create Our Own Markdown Editor Extension (HIGH EFFORT)

**Approach**: Fork or create a Vditor-based extension with Wireframe support built-in.

**Implementation**:
- Fork zaaack/vscode-markdown-editor
- Add wireframe rendering to previewRender pipeline
- Publish as separate extension

**Verdict**: ⚠️ High maintenance burden, duplicates functionality

### 6.4 Option D: Documentation & User Guidance (RECOMMENDED)

**Approach**: Document the limitation and guide users to use VS Code's built-in preview.

**Implementation**:
1. Add clear documentation about supported preview methods
2. Provide instructions for using built-in markdown preview
3. Note that Vditor-based editors are not compatible

**Verdict**: ✅ Practical, honest, low effort

### 6.5 Option E: Hybrid Approach (RECOMMENDED)

**Approach**: Support VS Code's built-in preview (current) + investigate if Vditor extensions have hooks.

**Implementation**:
1. Keep current markdown-it integration for built-in preview
2. Investigate if vscode-md or vscode-markdown-editor have extension points
3. Document limitations clearly

**Verdict**: ✅ Best balance of effort and coverage

---

## 7. Debugging: Which Editor is the User Using?

### 7.1 Check Active Extensions

The user should check if they have Vditor-based extensions installed:

1. Open Command Palette (Ctrl+Shift+P)
2. Run "Extensions: Show Installed Extensions"
3. Search for:
   - "vscode all markdown" (tobiastao.vscode-md)
   - "Markdown Editor" (zaaack.markdown-editor)

### 7.2 How to Use VS Code Built-in Preview

If using a Vditor extension, switch to built-in preview:

1. Open a `.md` file
2. Press `Ctrl+Shift+V` (or `Cmd+Shift+V` on Mac)
3. Or click the preview icon in the editor toolbar
4. Or run "Markdown: Open Preview" from Command Palette

**Important**: "Markdown All in One" uses VS Code's built-in preview, so our extension should work with it.

### 7.3 Verify Wireframe Extension is Active

Check the "Wireframe" output channel:

1. View → Output
2. Select "Wireframe" from dropdown
3. Look for:
   - `[Wireframe] Extension activated successfully`
   - `[Wireframe] extendMarkdownIt called by VS Code`

If you don't see the second message when opening markdown preview, the extension isn't being used.

---

## 8. Recommended Action Plan

### Phase 1: Documentation (Immediate)

1. ✅ Create this analysis document
2. [ ] Update README with supported preview methods
3. [ ] Add troubleshooting section for Vditor users
4. [ ] Create FAQ entry about extension compatibility

### Phase 2: Investigation (Short-term)

1. [ ] Investigate if Markdown All in One works (it should, as it uses built-in preview)
2. [ ] Test with VS Code's built-in preview directly (Ctrl+Shift+V)
3. [ ] Verify our activation events are working
4. [ ] Add more debug logging

### Phase 3: Future Consideration (Long-term)

1. [ ] Consider creating browser-compatible build of wireframe-core
2. [ ] Explore Vditor plugin development if there's user demand
3. [ ] Monitor Vditor ecosystem for plugin standardization

---

## 9. Conclusion

The wireframe extension's markdown preview integration is designed for VS Code's built-in markdown preview (markdown-it based). Vditor-based extensions use a completely different rendering pipeline that we cannot extend through the standard VS Code markdown API.

**For users experiencing issues:**
1. Verify you're using VS Code's built-in markdown preview (Ctrl+Shift+V)
2. Check the "Wireframe" output channel for debug messages
3. Disable Vditor-based extensions if you need wireframe rendering

**Technical reality:**
- VS Code built-in preview: ✅ Supported
- Markdown All in One: ✅ Supported (delegates to built-in)
- Vditor-based editors: ❌ Not supported (different architecture)

---

## 10. References

- [Vditor GitHub Repository](https://github.com/Vanessa219/vditor)
- [Lute Markdown Parser](https://github.com/88250/lute)
- [vscode-markdown-editor](https://github.com/zaaack/vscode-markdown-editor)
- [VS Code Markdown Extension API](https://code.visualstudio.com/api/extension-guides/markdown-extension)
- [markdown-it](https://github.com/markdown-it/markdown-it)
