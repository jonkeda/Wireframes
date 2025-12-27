# CI/CD Issues

## Document Information
- **Version:** 1.0
- **Date:** December 2025
- **Status:** Open

---

## Issue 1: Lint Errors in Codebase

### Description
Multiple lint errors were discovered during the CI/CD pipeline execution. These need to be addressed to ensure clean builds.

### Action Items
- [ ] Run `pnpm lint` locally to identify all errors
- [ ] Fix ESLint/TypeScript lint issues across all packages
- [ ] Ensure `pnpm lint` passes before committing
- [ ] Consider adding lint check as pre-commit hook

### Commands
```bash
# Check lint errors
pnpm lint

# Auto-fix where possible
pnpm lint --fix
```

---

## Issue 2: Update All Packages to Latest Versions

### Description
Dependencies across all packages should be updated to their latest versions to ensure security patches and new features.

### Action Items
- [ ] Run dependency update check
- [ ] Review breaking changes in major version updates
- [ ] Update dependencies in all packages
- [ ] Run full test suite after updates
- [ ] Update pnpm-lock.yaml

### Commands
```bash
# Check for outdated packages
pnpm outdated

# Update all packages interactively
pnpm update --interactive --latest

# Update all packages (non-interactive)
pnpm update --latest

# Rebuild after updates
pnpm install
pnpm build
pnpm test
```

### Packages to Review
- `packages/core/package.json`
- `packages/cli/package.json`
- `packages/mermaid-plugin/package.json`
- `packages/themes/package.json`
- `packages/vscode-extension/package.json`
- Root `package.json`

---

## Priority
- **Lint Errors:** High - blocking clean CI builds
- **Package Updates:** Medium - should be done periodically

---

*CI/CD Issues v1.0 - December 2025*
