# Publishing Guide

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Active

---

## Overview

This guide covers publishing the Wireframe DSL packages to npm and the VS Code extension to the Visual Studio Marketplace.

---

## Package Versions

All packages should have synchronized versions. Current packages:

| Package | npm | Description |
|---------|-----|-------------|
| `@jonkeda/wireframe-core` | [npm](https://www.npmjs.com/package/@jonkeda/wireframe-core) | Core parser, lexer, and renderer |
| `@jonkeda/wireframe-themes` | [npm](https://www.npmjs.com/package/@jonkeda/wireframe-themes) | Theme definitions |
| `@jonkeda/wireframe-mermaid` | [npm](https://www.npmjs.com/package/@jonkeda/wireframe-mermaid) | Mermaid.js integration |
| `@jonkeda/wireframe-cli` | [npm](https://www.npmjs.com/package/@jonkeda/wireframe-cli) | Command-line interface |
| `wireframe-vscode` | [Marketplace](https://marketplace.visualstudio.com/items?itemName=jonkeda.wireframe-vscode) | VS Code extension |

---

## Automated Publishing (CI/CD)

### Trigger
Publishing is triggered automatically when a GitHub Release is created.

### Workflow
The `.github/workflows/ci.yml` workflow handles:
1. **Build** - Compiles all packages
2. **Test** - Runs test suite
3. **Publish npm** - Publishes 4 npm packages
4. **Publish VS Code** - Publishes extension to Marketplace and Open VSX

### Required Secrets
Configure these in GitHub repository settings → Secrets and variables → Actions:

| Secret | Description | How to Get |
|--------|-------------|------------|
| `NPM_TOKEN` | npm Granular Access Token | [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens) |
| `VSCE_TOKEN` | VS Code Marketplace PAT | [Azure DevOps PAT](https://dev.azure.com/) |
| `OVSX_TOKEN` | Open VSX Token | [open-vsx.org](https://open-vsx.org/) |

### Creating NPM_TOKEN (Granular Access Token)
1. Go to https://www.npmjs.com/settings/jonkeda/tokens
2. Click **Generate New Token** → **Granular Access Token**
3. Configure:
   - **Token name:** `github-actions-publish`
   - **Expiration:** 90 days or longer
   - **Packages:** Select all 4 `@jonkeda/*` packages
   - **Permissions:** Read and write
4. Copy and add to GitHub as `NPM_TOKEN`

---

## Manual Publishing

### Prerequisites
```bash
# Login to npm (opens browser)
npm login

# Verify login
npm whoami
```

### Step 1: Bump Versions
```powershell
# From wireframe/ directory - bump all packages
cd wireframe

# Update version in all package.json files
# Replace X.X.X with new version
Get-ChildItem -Recurse -Filter "package.json" | 
  Where-Object { $_.FullName -notmatch "node_modules" } | 
  ForEach-Object { 
    $content = Get-Content $_.FullName -Raw
    if ($content -match '"version":\s*"OLD_VERSION"') { 
      $newContent = $content -replace '"version":\s*"OLD_VERSION"', '"version": "NEW_VERSION"'
      Set-Content $_.FullName $newContent -NoNewline
      Write-Host "Updated: $($_.FullName)" 
    } 
  }
```

### Step 2: Build All Packages
```bash
cd wireframe
pnpm build
```

### Step 3: Publish npm Packages (in order)
```bash
# Core first (no dependencies)
pnpm --filter @jonkeda/wireframe-core publish --access public --no-git-checks

# Themes (depends on core)
pnpm --filter @jonkeda/wireframe-themes publish --access public --no-git-checks

# Mermaid (depends on core)
pnpm --filter @jonkeda/wireframe-mermaid publish --access public --no-git-checks

# CLI (depends on core)
pnpm --filter @jonkeda/wireframe-cli publish --access public --no-git-checks
```

### Step 4: Publish VS Code Extension
```bash
cd packages/vscode-extension

# Clean old packages
Remove-Item *.vsix -ErrorAction SilentlyContinue

# Build production bundle
pnpm build:prod

# Package
npx @vscode/vsce package --no-dependencies --allow-missing-repository

# Publish to VS Code Marketplace
npx @vscode/vsce publish --packagePath *.vsix

# Publish to Open VSX (optional)
npx ovsx publish *.vsix -p $OVSX_TOKEN
```

### Step 5: Git Tag and Release
```bash
# Commit version bump
git add -A
git commit -m "chore: bump all packages to vX.X.X"

# Create tag
git tag vX.X.X

# Push
git push
git push --tags

# Create GitHub release (optional - for changelog)
gh release create vX.X.X --title "vX.X.X" --notes "Release notes..."
```

---

## Troubleshooting

### npm: ENEEDAUTH
```
npm error code ENEEDAUTH
npm error need auth This command requires you to be logged in
```
**Solution:** Run `npm login` and authenticate in browser.

### npm: E404 Not Found
```
npm error 404 Not Found - PUT https://registry.npmjs.org/@jonkeda%2f...
```
**Causes:**
1. Package doesn't exist yet (first publish must be manual)
2. Token doesn't have write access to this package
3. Token expired

**Solution:** Use `npm login` for interactive auth, or regenerate token with correct permissions.

### VS Code: Version already exists
```
Error: jonkeda.wireframe-vscode vX.X.X already exists
```
**Cause:** Attempting to publish same version twice.
**Solution:** Bump version in `packages/vscode-extension/package.json`.

### VS Code: Old version being published
**Cause:** Stale `.vsix` file from previous build.
**Solution:** Delete `*.vsix` files before packaging:
```bash
Remove-Item *.vsix -ErrorAction SilentlyContinue
```

### CI: Checkout wrong version
**Cause:** GitHub Actions checkout uses main branch instead of release tag.
**Solution:** Ensure workflow has:
```yaml
- uses: actions/checkout@v4
  with:
    ref: ${{ github.event.release.tag_name }}
```

---

## Version Checklist

Before publishing, verify:

- [ ] All `package.json` files have same version
- [ ] `CHANGELOG.md` updated (if exists)
- [ ] All tests pass: `pnpm test:run`
- [ ] Build succeeds: `pnpm build`
- [ ] No uncommitted changes: `git status`

---

## Links

- **npm packages:** https://www.npmjs.com/org/jonkeda
- **VS Code Marketplace:** https://marketplace.visualstudio.com/manage/publishers/jonkeda
- **GitHub Releases:** https://github.com/jonkeda/Wireframes/releases
- **GitHub Actions:** https://github.com/jonkeda/Wireframes/actions

---

*Publishing Guide v1.0 - December 2025*
