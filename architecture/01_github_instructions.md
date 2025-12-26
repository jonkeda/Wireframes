# GitHub Instructions

This document provides guidelines for working with this repository using GitHub.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Repository Setup](#repository-setup)
3. [Branch Strategy](#branch-strategy)
4. [Commit Guidelines](#commit-guidelines)
5. [Pull Request Process](#pull-request-process)
6. [Code Review Guidelines](#code-review-guidelines)
7. [Issue Management](#issue-management)

---

## Getting Started

### Prerequisites

- Git installed on your local machine
- GitHub account with access to this repository
- Code editor of your choice (VS Code recommended)

### Cloning the Repository

```bash
# Clone via HTTPS
git clone https://github.com/jonkeda/Wireframes.git

# Clone via SSH (recommended)
git clone git@github.com:jonkeda/Wireframes.git

# Navigate into the project directory
cd Wireframes
```

### Initial Configuration

Configure your Git identity for this repository:

```bash
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

---

## Repository Setup

### Remote Configuration

```bash
# View current remotes
git remote -v

# Add upstream remote (if forked)
git remote add upstream https://github.com/jonkeda/Wireframes.git

# Fetch from upstream
git fetch upstream
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge upstream main into your local main
git checkout main
git merge upstream/main

# Push updates to your fork
git push origin main
```

---

## Branch Strategy

### Branch Naming Convention

Use descriptive branch names following this pattern:

| Type | Pattern | Example |
|------|---------|---------|
| Feature | `feature/<description>` | `feature/add-wireframe-export` |
| Bug Fix | `fix/<description>` | `fix/rendering-issue` |
| Documentation | `docs/<description>` | `docs/update-readme` |
| Refactor | `refactor/<description>` | `refactor/diagram-parser` |
| Hotfix | `hotfix/<description>` | `hotfix/critical-security-fix` |

### Creating a New Branch

```bash
# Ensure you're on main and up-to-date
git checkout main
git pull origin main

# Create and switch to a new branch
git checkout -b feature/your-feature-name
```

### Main Branches

- **`main`**: Production-ready code. All releases are made from this branch.
- **Feature branches**: Short-lived branches for developing new features or fixes.

---

## Commit Guidelines

### Commit Message Format

Follow the conventional commits specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, semicolons, etc.)
- **refactor**: Code refactoring without feature changes
- **test**: Adding or updating tests
- **chore**: Maintenance tasks (build, dependencies, etc.)

### Examples

```bash
# Simple commit
git commit -m "feat(wireframe): add export to PNG functionality"

# Commit with body
git commit -m "fix(parser): resolve null reference exception

The parser was failing when encountering empty diagram blocks.
Added null check before processing diagram content.

Fixes #123"
```

### Best Practices

- Keep commits atomic and focused on a single change
- Write clear, descriptive commit messages
- Reference issue numbers when applicable
- Commit early and often

---

## Pull Request Process

### Before Creating a PR

1. Ensure your branch is up-to-date with `main`
2. Run all tests locally
3. Review your changes for any debug code or unintended modifications
4. Update documentation if needed

### Creating a Pull Request

1. Push your branch to GitHub:
   ```bash
   git push origin feature/your-feature-name
   ```

2. Navigate to the repository on GitHub

3. Click "Compare & pull request"

4. Fill out the PR template:
   - **Title**: Clear, descriptive title following commit conventions
   - **Description**: Explain what changes were made and why
   - **Related Issues**: Link any related issues using `Fixes #123` or `Relates to #123`
   - **Testing**: Describe how the changes were tested

### PR Title Format

```
<type>(<scope>): <description>
```

Example: `feat(wireframe): add drag-and-drop support for components`

### After Creating a PR

- Respond to review comments promptly
- Make requested changes in new commits (don't force-push during review)
- Request re-review after addressing feedback

---

## Code Review Guidelines

### For Reviewers

- Review within 24-48 hours when possible
- Be constructive and respectful in feedback
- Focus on:
  - Code correctness and logic
  - Adherence to project conventions
  - Test coverage
  - Documentation
  - Performance implications

### Review Comments

Use these prefixes for clarity:

- **`nit:`** - Minor suggestion, non-blocking
- **`question:`** - Seeking clarification
- **`suggestion:`** - Recommended improvement
- **`blocking:`** - Must be addressed before merge

### Approval Criteria

- At least one approval required
- All CI checks must pass
- No unresolved blocking comments
- Branch must be up-to-date with `main`

---

## Issue Management

### Creating Issues

Use the appropriate issue template and include:

- **Clear title**: Descriptive summary of the issue
- **Description**: Detailed explanation
- **Steps to reproduce**: For bugs
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Screenshots**: If applicable
- **Environment**: OS, browser, version info

### Issue Labels

| Label | Description |
|-------|-------------|
| `bug` | Something isn't working |
| `enhancement` | New feature request |
| `documentation` | Documentation improvements |
| `good first issue` | Good for newcomers |
| `help wanted` | Extra attention needed |
| `priority: high` | High priority item |
| `priority: low` | Low priority item |

### Linking Issues to PRs

Reference issues in PR descriptions:

```markdown
Fixes #123          <!-- Closes issue when PR is merged -->
Closes #123         <!-- Closes issue when PR is merged -->
Relates to #123     <!-- Links without auto-closing -->
Part of #123        <!-- Links without auto-closing -->
```

---

## Additional Resources

- [GitHub Flow Documentation](https://docs.github.com/en/get-started/quickstart/github-flow)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Git Best Practices](https://git-scm.com/book/en/v2)

---

*Last updated: 2025*
