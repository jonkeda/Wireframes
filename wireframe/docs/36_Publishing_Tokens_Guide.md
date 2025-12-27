# Publishing Tokens Guide

**Date:** December 27, 2025  
**Document:** 36

This guide explains how to create the authentication tokens required for publishing the Wireframe packages to npm, VS Code Marketplace, and Open VSX.

---

## Overview

| Token | Purpose | Where Used |
|-------|---------|------------|
| `NPM_TOKEN` | Publish packages to npmjs.com | GitHub Actions |
| `VSCE_TOKEN` | Publish extension to VS Code Marketplace | GitHub Actions |
| `OVSX_TOKEN` | Publish extension to Open VSX Registry | GitHub Actions |

---

## 1. npm Token (NPM_TOKEN)

The npm token allows automated publishing of packages to the npm registry.

### Prerequisites
- npm account at [npmjs.com](https://www.npmjs.com/)
- If using scoped packages (`@jonkeda/*`), you need an npm organization

### Create npm Organization (if needed)

1. Go to [npmjs.com/org/create](https://www.npmjs.com/org/create)
2. Organization name: `jonkeda`
3. Choose plan (free is fine for public packages)
4. Click **Create**

### Generate npm Token

1. **Log in** to [npmjs.com](https://www.npmjs.com/)

2. Click your **profile avatar** (top right) → **Access Tokens**
   
   Or go directly to: [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens)

3. Click **Generate New Token** → **Classic Token**

4. Select token type:
   - **Automation** (recommended for CI/CD)
   - This type bypasses 2FA for publishing

5. Enter a name: `GitHub Actions - Wireframe`

6. Click **Generate Token**

7. **Copy the token immediately!** It won't be shown again.
   
   Token format: `npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Add to GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste your npm token
6. Click **Add secret**

---

## 2. VS Code Marketplace Token (VSCE_TOKEN)

The VSCE token is a Personal Access Token (PAT) from Azure DevOps that allows publishing to the VS Code Marketplace.

### Prerequisites
- Microsoft account
- Azure DevOps organization (free)
- VS Code Marketplace publisher

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
   - Other fields are optional

5. Click **Create**

### Step 3: Generate Personal Access Token (PAT)

1. Go to [dev.azure.com](https://dev.azure.com/)

2. Click **User settings** (icon next to your avatar) → **Personal access tokens**

   Or go to: `https://dev.azure.com/YOUR_ORG/_usersSettings/tokens`

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

### Add to GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `VSCE_TOKEN`
5. Value: Paste your Azure DevOps PAT
6. Click **Add secret**

### Verify Publisher in Extension

Ensure your `wireframe/packages/vscode/package.json` has:

```json
{
  "publisher": "jonkeda",
  ...
}
```

---

## 3. Open VSX Token (OVSX_TOKEN)

Open VSX is an open-source alternative VS Code extension registry, used by VS Code forks like VSCodium.

### Prerequisites
- GitHub account (for login)

### Generate Open VSX Token

1. Go to [open-vsx.org](https://open-vsx.org/)

2. Click **Log in** (top right) and sign in with GitHub

3. Click your **username** (top right) → **Settings**
   
   Or go to: [open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens)

4. Under **Access Tokens**, click **Generate New Token**

5. Enter a description: `GitHub Actions - Wireframe`

6. Click **Generate Token**

7. **Copy the token immediately!** It won't be shown again.

### Create Namespace (if needed)

Before publishing, you need a namespace matching your publisher ID:

1. Go to [open-vsx.org/user-settings/namespaces](https://open-vsx.org/user-settings/namespaces)

2. Click **Create Namespace**

3. Enter namespace: `jonkeda`

4. Click **Create**

### Add to GitHub Secrets

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `OVSX_TOKEN`
5. Value: Paste your Open VSX token
6. Click **Add secret**

---

## Summary: All GitHub Secrets

After completing the steps above, your repository should have these secrets:

| Secret Name | Source | Purpose |
|-------------|--------|---------|
| `NPM_TOKEN` | npmjs.com | Publish npm packages |
| `VSCE_TOKEN` | Azure DevOps | Publish to VS Code Marketplace |
| `OVSX_TOKEN` | open-vsx.org | Publish to Open VSX |

To verify, go to: **Repository** → **Settings** → **Secrets and variables** → **Actions**

---

## Manual Publishing Commands

If you need to publish manually (without GitHub Actions):

### npm Packages

```bash
# Login (one-time)
npm login

# Publish all packages
cd wireframe
pnpm build
pnpm -r publish --access public
```

### VS Code Extension

```bash
# Install vsce (one-time)
npm install -g @vscode/vsce

# Login with PAT (one-time)
vsce login jonkeda
# Paste your PAT when prompted

# Package and publish
cd wireframe/packages/vscode
vsce package
vsce publish
```

### Open VSX

```bash
# Install ovsx (one-time)
npm install -g ovsx

# Publish (uses token from environment or parameter)
cd wireframe/packages/vscode
ovsx publish -p YOUR_OVSX_TOKEN
```

---

## Token Security Best Practices

1. **Never commit tokens** to your repository
2. **Use automation tokens** for CI/CD (npm)
3. **Set expiration dates** on tokens when possible
4. **Use minimal scopes** - only grant permissions needed
5. **Rotate tokens** periodically (every 6-12 months)
6. **Revoke tokens** if compromised

### Revoking Tokens

| Service | How to Revoke |
|---------|---------------|
| npm | [npmjs.com/settings/tokens](https://www.npmjs.com/settings/tokens) → Delete |
| Azure DevOps | [dev.azure.com](https://dev.azure.com/) → User settings → PATs → Revoke |
| Open VSX | [open-vsx.org/user-settings/tokens](https://open-vsx.org/user-settings/tokens) → Delete |

---

## Troubleshooting

### npm: "403 Forbidden"
- Check if the token has publish permissions
- Verify you're a member of the `@jonkeda` organization
- Ensure packages are set to `"access": "public"` in package.json

### VSCE: "Access Denied"
- Verify the PAT has Marketplace permissions
- Check the publisher ID matches in `package.json`
- Ensure the PAT hasn't expired

### Open VSX: "Namespace not found"
- Create the namespace first (see step above)
- Namespace must match the `publisher` in `package.json`

### GitHub Actions: "Secret not found"
- Secrets are case-sensitive: `NPM_TOKEN` not `npm_token`
- Check the secret is in the correct repository
- Verify no typos in the secret name
