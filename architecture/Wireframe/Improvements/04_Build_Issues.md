# Build Issues - Root Cause Analysis

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** In Progress

---

## Issue 1: @types/vscode Version Mismatch

### Error Message
```
@types/vscode ^1.107.0 greater than engines.vscode ^1.85.0. 
Either upgrade engines.vscode or use an older @types/vscode version
```

### Root Cause
The `@types/vscode` package version must match or be lower than the `engines.vscode` version in `package.json`. This ensures type definitions match the VS Code API version the extension targets.

**Current State:**
- `engines.vscode`: `^1.85.0` (minimum VS Code version supported)
- `@types/vscode`: `^1.107.0` (type definitions for VS Code 1.107+)

The type definitions are for a newer VS Code version than what we claim to support.

### Solution Options

**Option A: Upgrade engines.vscode (Recommended)**
- Update `engines.vscode` to `^1.107.0`
- Users will need VS Code 1.107+ to install the extension
- Gives access to latest VS Code APIs

**Option B: Downgrade @types/vscode**
- Keep `engines.vscode` at `^1.85.0` for broader compatibility
- Install `@types/vscode@1.85.0` to match
- May miss newer API type definitions

### Selected Solution
**Option A** - Upgrade engines.vscode to match @types/vscode. VS Code auto-updates, so most users will have recent versions.

---

## Issue 2: Unexpected Console Statement in Tests

### Error Message
```
build: wireframe/packages/core/src/parser/examples.test.ts#L159
Unexpected console statement
```

### Root Cause
ESLint's `no-console` rule flags `console.log` statements. While these are intentional for test output/debugging, the CI treats warnings as failures during the build step.

### Analysis
The test file `examples.test.ts` uses `console.log` to output test summaries and progress information. These are useful for development but trigger ESLint warnings.

### Solution Options

**Option A: Disable no-console for test files**
- Add ESLint override for `*.test.ts` files
- Allows console in tests but not production code

**Option B: Use a proper logging utility**
- Replace console with test reporter
- More complex, overkill for test output

**Option C: Disable specific lines**
- Add `// eslint-disable-next-line no-console` comments
- Tedious for many occurrences

### Selected Solution
**Option A** - The console statements are already only warnings (not errors) and shouldn't fail the build. However, checking if CI is treating warnings as errors.

---

## Implementation Plan

1. ✅ Create this document
2. ⏳ Fix Issue 1: Update engines.vscode to ^1.107.0
3. ⏳ Verify ESLint warnings don't fail build (Issue 2)
4. ⏳ Commit and push fixes

---

*Build Issues Analysis v1.0 - December 2025*
