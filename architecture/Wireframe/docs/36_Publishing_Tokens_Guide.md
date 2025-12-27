# Publishing Tokens Guide

**Date:** December 27, 2025  
**Document:** 36 (Updated)

This guide explains how to configure authentication for publishing the Wireframe packages to npm, VS Code Marketplace, and Open VSX.

---

## Overview

| Registry | Authentication Method | Token Required? |
|----------|----------------------|-----------------|
| npm | **Trusted Publishers (OIDC)** | ❌ No token needed |
| VS Code Marketplace | Personal Access Token (PAT) | ✅ Yes (`VSCE_TOKEN`) |
| Open VSX | Access Token | ✅ Yes (`OVSX_TOKEN`) |

---

## 1. npm - Trusted Publishers (Recommended)

npm now supports **Trusted Publishers** using OpenID Connect (OIDC). This eliminates the need for long-lived npm tokens entirely!

### How It Works

1. You configure a trust relationship between npm and your GitHub Actions workflow
2. GitHub Actions generates short-lived OIDC tokens during each publish
3. npm verifies the token and allows publishing - no secrets needed!

### Benefits Over Traditional Tokens

- ✅ No long-lived tokens to manage or rotate
- ✅ No risk of token exposure in logs
- ✅ Cryptographically signed, tamper-proof
- ✅ Automatic provenance attestation
- ✅ Tokens cannot be extracted or reused

### Prerequisites

- npm CLI version **11.5.1 or later**
- GitHub-hosted runners (self-hosted not currently supported)
- Public repository (for provenance generation)

### Step 1: Create npm Organization (if needed)

If using scoped packages (`@jonkeda/*`):

1. Go to [npmjs.com/org/create](https://www.npmjs.com/org/create)
2. Organization name: `jonkeda`
3. Choose plan (free is fine for public packages)
4. Click **Create**

### Step 2: Publish Package First Time (Manual)

Before configuring trusted publishers, you need to publish each package at least once:

```bash
# Login to npm
npm login

# Publish each package
cd wireframe/packages/core
npm publish --access public

cd ../cli
npm publish --access public

# etc.
```

### Step 3: Configure Trusted Publisher on npm

For **each package** you want to publish via GitHub Actions:

1. Go to [npmjs.com](https://www.npmjs.com/) and navigate to your package
2. Click **Settings** (gear icon)
3. Find the **Trusted Publisher** section
4. Click **GitHub Actions**
5. Fill in the fields:

| Field | Value |
|-------|-------|
| Organization or user | `jonkeda` (your GitHub username/org) |
| Repository | `wireframe` (your repo name) |
| Workflow filename | `ci.yml` (must match exactly, including extension) |
| Environment name | (optional) Leave blank or use `npm-publish` |

6. Click **Save**

> ⚠️ Repeat this for each package: `@jonkeda/wireframe-core`, `@jonkeda/wireframe-cli`, etc.

### Step 4: Update GitHub Actions Workflow

Add the `id-token: write` permission to your workflow:

```yaml
jobs:
  publish-npm:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write  # Required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm -r publish --access public
        # No NODE_AUTH_TOKEN needed!
```

### Troubleshooting npm Trusted Publishers

**"Unable to authenticate" error:**
- Verify workflow filename matches exactly (case-sensitive, include `.yml`)
- Ensure you're using GitHub-hosted runners
- Check `id-token: write` permission is set

**Private dependencies:**
If you have private dependencies, you still need a read-only token for `npm install`:

```yaml
- run: pnpm install
  env:
    NODE_AUTH_TOKEN: ${{ secrets.NPM_READ_TOKEN }}
- run: pnpm -r publish --access public
  # Publish uses OIDC - no token needed
```

---

## 2. VS Code Marketplace Token (VSCE_TOKEN)

The VS Code Marketplace **does not support OIDC** yet. You still need a Personal Access Token (PAT) from Azure DevOps.

### Step 1: Create Azure DevOps Organization

1. Go to [dev.azure.com](https://dev.azure.com/)
2. Sign in with your Microsoft account
3. If prompted, create a new organization:
   - Organization name: `jonkeda` (or any name)
   - Click **Continue**

### Step 2: Create VS Code Marketplace Publisher

1. Go to [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage)
2. Sign in with the same Microsoft account
3. Click **Create publisher**
4. Fill in the details:
   - **ID**: `jonkeda` (this goes in your extension's `package.json` as `"publisher"`)
   - **Name**: `jonkeda` (display name)
5. Click **Create**

### Step 3: Generate Personal Access Token (PAT)

1. Go to [dev.azure.com](https://dev.azure.com/)
2. Click **User settings** (icon next to your avatar) → **Personal access tokens**
3. Click **+ New Token**
4. Configure the token:

| Field | Value |
|-------|-------|
| Name | `VS Code Marketplace - Wireframe` |
| Organization | `All accessible organizations` |
| Expiration | Custom (set to 1 year max) |
| Scopes | **Custom defined** |

5. Click **Show all scopes** at the bottom
6. Find **Marketplace** and check:
   - ✅ **Acquire**
   - ✅ **Manage**
   - ✅ **Publish**
7. Click **Create**
8. **Copy the token immediately!** It won't be shown again.

### Step 4: Add to GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VSCE_TOKEN`
5. Value: Paste your Azure DevOps PAT
6. Click **Add secret**

---

## 3. Open VSX Token (OVSX_TOKEN)

Open VSX **does not support OIDC** yet. You need a traditional access token.

### Prerequisites

- GitHub account (for login)
- Eclipse account (for Publisher Agreement)

### Step 1: Create Eclipse Account

1. Go to [accounts.eclipse.org/user/register](https://accounts.eclipse.org/user/register)
2. **Important:** Fill in the GitHub Username field with your exact GitHub username
3. Complete registration

### Step 2: Log in and Sign Publisher Agreement

1. Go to [open-vsx.org](https://open-vsx.org/)
2. Click **Log in** (top right) and sign in with GitHub
3. Click your username → **Settings**
4. Click **Log in with Eclipse**
5. After success, click **Show Publisher Agreement**
6. Read and click **Agree**

### Step 3: Generate Access Token

1. Go to [open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens)
2. Click **Generate New Token**
3. Enter description: `GitHub Actions - Wireframe`
4. Click **Generate Token**
5. **Copy the token immediately!** It won't be shown again.

### Step 4: Create Namespace

Before publishing, create a namespace matching your publisher ID:

```bash
npx ovsx create-namespace jonkeda -p YOUR_TOKEN
```

Or via the web interface:
1. Go to [open-vsx.org/user-settings/namespaces](https://open-vsx.org/user-settings/namespaces)
2. Click **Create Namespace**
3. Enter namespace: `jonkeda`
4. Click **Create**

### Step 5: Add to GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OVSX_TOKEN`
5. Value: Paste your Open VSX token
6. Click **Add secret**

---

## Summary: GitHub Secrets Required

| Secret Name | Required? | Source | Purpose |
|-------------|-----------|--------|---------|
| `NPM_TOKEN` | ❌ No | Not needed | Use Trusted Publishers instead |
| `NPM_READ_TOKEN` | Optional | npmjs.com | Only if you have private dependencies |
| `VSCE_TOKEN` | ✅ Yes | Azure DevOps | Publish to VS Code Marketplace |
| `OVSX_TOKEN` | ✅ Yes | open-vsx.org | Publish to Open VSX |

---

## CI/CD Workflow Example

See `.github/workflows/ci.yml` for the complete workflow. Key points:

```yaml
# npm uses OIDC - no token needed
permissions:
  id-token: write
  contents: read

# VS Code and Open VSX still need tokens
env:
  VSCE_PAT: ${{ secrets.VSCE_TOKEN }}
  OVSX_PAT: ${{ secrets.OVSX_TOKEN }}
```

---

## Manual Publishing Commands

### npm (with Trusted Publishers)

```bash
# No login needed for trusted publishers in CI
# For local development:
npm login
pnpm -r publish --access public
```

### VS Code Extension

```bash
# Install vsce
npm install -g @vscode/vsce

# Login with PAT
vsce login jonkeda
# Paste your PAT when prompted

# Publish
cd wireframe/packages/vscode-extension
vsce package
vsce publish
```

### Open VSX

```bash
# Install ovsx
npm install -g ovsx

# Publish
cd wireframe/packages/vscode-extension
ovsx publish -p YOUR_OVSX_TOKEN
```

---

## Security Best Practices

### For npm Trusted Publishers
- ✅ Use OIDC instead of tokens - much more secure
- ✅ Consider restricting traditional token access once trusted publishers work
- ✅ Enable "Require two-factor authentication and disallow tokens" for maximum security

### For All Tokens
1. **Never commit tokens** to your repository
2. **Set expiration dates** on tokens when possible
3. **Use minimal scopes** - only grant permissions needed
4. **Rotate tokens** periodically (every 6-12 months)
5. **Revoke tokens** if compromised

### Revoking Tokens

| Service | How to Revoke |
|---------|---------------|
| Azure DevOps (VSCE) | [dev.azure.com](https://dev.azure.com/) → User settings → PATs → Revoke |
| Open VSX | [open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens) → Delete |

---

## Future: OIDC Support Status

| Registry | OIDC Status |
|----------|-------------|
| npm | ✅ **Supported** (Trusted Publishers) |
| PyPI | ✅ Supported |
| RubyGems | ✅ Supported |
| VS Code Marketplace | ❌ Not supported yet |
| Open VSX | ❌ Not supported yet |

We recommend checking for updates as more registries adopt the OpenSSF Trusted Publishers standard.

---

## Troubleshooting

### npm: Trusted publisher not working
- Workflow filename must match exactly (case-sensitive)
- Must use GitHub-hosted runners
- Check `id-token: write` permission
- Verify the package name matches what's configured on npm

### VSCE: "Access Denied"
- Verify the PAT has Marketplace permissions
- Check the publisher ID matches in `package.json`
- Ensure the PAT hasn't expired

### Open VSX: "Namespace not found"
- Create the namespace first
- Namespace must match the `publisher` in `package.json`

### GitHub Actions: "Secret not found"
- Secrets are case-sensitive: `VSCE_TOKEN` not `vsce_token`
- Check the secret is in the correct repository
