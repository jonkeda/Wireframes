# Release/Publish Issues - Root Cause Analysis

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** In Progress

---

## Issue 1: npm Publish Authentication Failure

### Error Message
```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in to https://registry.npmjs.org/
npm error need auth You need to authorize this machine using `npm adduser`
```

### Root Cause
The `publish-npm` job in CI is using `pnpm publish` but npm authentication is not configured correctly. The workflow sets `NODE_AUTH_TOKEN` environment variable, but:

1. The job may need `NPM_TOKEN` secret to be set in repository settings
2. Or OIDC Trusted Publishers needs to be configured properly

**Current Workflow:**
```yaml
- name: Publish @jonkeda/wireframe-core
  run: pnpm --filter @jonkeda/wireframe-core publish --access public --no-git-checks
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Solution
✅ **Fixed**: Configured npm Trusted Publishers (OIDC) for all packages. Removed `NODE_AUTH_TOKEN` from workflow - OIDC authentication is now used with `--provenance` flag.

---

## Issue 2: VS Code Extension Build - Cannot Resolve @jonkeda/wireframe-core

### Error Message
```
Error: Could not resolve "@jonkeda/wireframe-core"
The module "./dist/index.js" was not found on the file system
```

### Root Cause
In the `publish-vscode` job, the workflow:
1. Checks out the code
2. Installs dependencies
3. Runs `pnpm build:prod` for vscode-extension

**The Problem:** The workflow does NOT run `pnpm build` to compile the core package first. The vscode-extension's esbuild tries to bundle `@jonkeda/wireframe-core`, but the `dist/` folder doesn't exist because the core package was never built.

**Current Workflow:**
```yaml
- name: Install dependencies
  working-directory: wireframe
  run: pnpm install --frozen-lockfile

- name: Build VS Code extension  # ❌ Missing: pnpm build first!
  working-directory: wireframe/packages/vscode-extension
  run: pnpm build:prod
```

### Solution
Add a step to build all packages before building the VS Code extension:
```yaml
- name: Build all packages
  working-directory: wireframe
  run: pnpm build

- name: Build VS Code extension
  working-directory: wireframe/packages/vscode-extension
  run: pnpm build:prod
```

---

## Implementation Plan

1. ✅ Create this document
2. ✅ Fix Issue 1: Configured npm Trusted Publishers (OIDC), removed NODE_AUTH_TOKEN
3. ✅ Fix Issue 2: Added `pnpm build` step before vscode extension build in publish-vscode job
4. ✅ Fix Issue 3: Checkout release tag explicitly (was checking out main instead of tag)
5. ⏳ Commit and push fixes
6. ⏳ Create new release to test

---

*Release/Publish Issues Analysis v1.0 - December 2025*
