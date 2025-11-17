# ESTA Tracker - Git Branching Strategy

## Overview

This document outlines the Git branching strategy for the ESTA Tracker project. Our branching model is designed to support organized development, clear feature separation, and smooth deployment workflows.

## Branch Hierarchy

```
main (production)
 └── develop (integration)
      ├── feature/section-1-vision-purpose (vision documents & goals)
      └── feature/section-3-core-features (core feature development)
```

## Branch Types

### 1. Main Branch (`main`)

**Purpose:** The production-ready branch containing stable, released code.

**Characteristics:**
- Always deployable
- Protected branch with strict merge requirements
- Direct commits are not allowed
- Only receives merges from `develop` after thorough testing

**Usage:**
```bash
# Main branch should never be directly modified
# All changes come through develop via pull requests
```

### 2. Development Branch (`develop`)

**Purpose:** Integration branch for ongoing development work.

**Characteristics:**
- Branches off from: `main`
- Merges back into: `main` (for releases)
- Feature branches are created from `develop`
- Contains the latest delivered development changes

**Usage:**
```bash
# Create develop branch (done automatically by setup script)
git checkout -b develop main

# Keep develop up to date with main
git checkout develop
git merge main
```

### 3. Feature Branches

Feature branches are used to develop specific features or sections of the application.

#### Feature Branch: `feature/section-1-vision-purpose`

**Purpose:** Development of vision documents, goals, and strategic planning components.

**Scope:**
- Vision & Purpose documentation
- Strategic planning features
- Goal tracking components
- Business strategy implementations

**Characteristics:**
- Branches off from: `develop`
- Merges back into: `develop`
- Naming convention: `feature/section-1-vision-purpose`

**Usage:**
```bash
# Create feature branch (done automatically by setup script)
git checkout -b feature/section-1-vision-purpose develop

# Work on your feature
git add .
git commit -m "Add vision document structure"

# Push changes
git push origin feature/section-1-vision-purpose

# When feature is complete, create PR to develop
```

**Related Sections:**
- Section 1: Vision & Purpose
- Long-term roadmap planning
- Business strategy documentation

#### Feature Branch: `feature/section-3-core-features`

**Purpose:** Development of core application features and functionality.

**Scope:**
- Sick Time Accrual Engine (3.1)
- PTO Request System (3.2)
- Multi-Day Absence Documentation (3.3)
- Compliance AI Assistant (3.4)
- Notice Submission & Final Review System (3.5)
- Hours Import Options (3.6)
- Offboarding Wizard (3.7)
- Document Library (3.8)
- Company-Wide Calendar System (3.9)
- Advanced Reporting Suite (3.10)
- HR Notes & Incident Logs (3.11)
- Automated Compliance Certificate (3.12)

**Characteristics:**
- Branches off from: `develop`
- Merges back into: `develop`
- Naming convention: `feature/section-3-core-features`

**Usage:**
```bash
# Create feature branch (done automatically by setup script)
git checkout -b feature/section-3-core-features develop

# Work on your feature
git add .
git commit -m "Implement accrual engine"

# Push changes
git push origin feature/section-3-core-features

# When feature is complete, create PR to develop
```

**Related Sections:**
- Section 3: Core Features (Powerhouse Set)
- All 12 core feature implementations

## Automated Branch Setup

### Quick Start

To automatically set up all branches according to this strategy:

```bash
# Make the script executable
chmod +x scripts/setup-branches.sh

# Run the setup script
./scripts/setup-branches.sh
```

### What the Script Does

The `scripts/setup-branches.sh` script will:

1. ✅ Ensure `main` branch exists (creates if needed)
2. ✅ Create `develop` branch from `main`
3. ✅ Create `feature/section-1-vision-purpose` from `develop`
4. ✅ Create `feature/section-3-core-features` from `develop`
5. ✅ Push all branches to remote
6. ✅ Return you to your original branch
7. ✅ Display the branch hierarchy

### Script Features

- **Idempotent:** Safe to run multiple times
- **Smart Detection:** Checks for existing branches before creating
- **Colored Output:** Clear visual feedback during execution
- **Error Handling:** Stops on errors to prevent inconsistent state
- **Automatic Push:** Sets up remote tracking branches

## Workflow Guidelines

### Starting New Work

1. **Ensure you have the latest code:**
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Choose or create appropriate feature branch:**
   ```bash
   # For vision/strategy work
   git checkout feature/section-1-vision-purpose
   
   # For core features
   git checkout feature/section-3-core-features
   ```

3. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   git push origin <branch-name>
   ```

### Merging Changes

1. **Create Pull Request:**
   - From your feature branch to `develop`
   - Provide clear description of changes
   - Link related issues

2. **Code Review:**
   - Request review from team members
   - Address feedback
   - Ensure CI/CD checks pass

3. **Merge:**
   - Squash and merge or merge commit (team preference)
   - Delete feature branch after merge (optional)

### Releasing to Production

1. **Prepare Release:**
   ```bash
   git checkout main
   git merge develop
   ```

2. **Tag Release:**
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```

3. **Deploy:**
   - Automatic deployment from `main` via CI/CD

## Branch Protection Rules

### Recommended Settings for `main`

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging
- ✅ Include administrators in restrictions
- ✅ Restrict who can push to matching branches

### Recommended Settings for `develop`

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
- ⚠️ Allow force pushes by administrators only (for cleanup)

## Best Practices

### Commit Messages

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
feat(accrual): implement sick time accrual engine
fix(calendar): resolve date range calculation bug
docs(readme): update installation instructions
```

### Pull Requests

**Good PR Titles:**
- "Add sick time accrual calculation logic"
- "Fix PTO request approval workflow"
- "Update vision document with Q2 goals"

**PR Description Should Include:**
- What changed and why
- How to test the changes
- Screenshots (for UI changes)
- Related issue numbers

### Branch Naming Conventions

While the main feature branches are predefined, additional branches may follow:

- `feature/` - New features
- `bugfix/` - Bug fixes
- `hotfix/` - Urgent production fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring

**Examples:**
```bash
feature/user-authentication
bugfix/calendar-timezone-issue
hotfix/security-patch-v1.2.1
docs/api-documentation
refactor/database-schema
```

## Syncing Branches

### Keep Feature Branch Updated with Develop

```bash
git checkout feature/section-1-vision-purpose
git fetch origin
git merge origin/develop
```

Or using rebase (if preferred):

```bash
git checkout feature/section-1-vision-purpose
git fetch origin
git rebase origin/develop
```

### Keep Develop Updated with Main

```bash
git checkout develop
git fetch origin
git merge origin/main
git push origin develop
```

## Troubleshooting

### Branch Already Exists

If you encounter an error that a branch already exists:

```bash
# List all branches
git branch -a

# Delete local branch if needed
git branch -D <branch-name>

# Re-run setup script
./scripts/setup-branches.sh
```

### Merge Conflicts

1. **Identify conflicts:**
   ```bash
   git status
   ```

2. **Resolve conflicts manually:**
   - Open conflicting files
   - Look for conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
   - Edit to resolve
   - Save files

3. **Complete merge:**
   ```bash
   git add .
   git commit -m "Resolve merge conflicts"
   ```

### Reset to Remote State

If you need to reset your local branch to match remote:

```bash
git fetch origin
git reset --hard origin/<branch-name>
```

⚠️ **Warning:** This will discard all local changes!

## CI/CD Integration

### Automatic Testing

- All branches: Run tests on push
- Feature branches: Run tests on PR to develop
- Develop branch: Run full test suite + integration tests
- Main branch: Run full test suite + deployment checks

### Deployment Triggers

- `main` branch: Automatic deployment to production
- `develop` branch: Automatic deployment to staging
- Feature branches: Preview deployments (optional)

## Additional Resources

- [Git Flow Model](https://nvie.com/posts/a-successful-git-branching-model/)
- [GitHub Flow](https://guides.github.com/introduction/flow/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## Support

For questions or issues with the branching strategy:
1. Review this documentation
2. Check existing issues on GitHub
3. Contact the development team
4. Refer to the project README.md

---

**Last Updated:** 2025-11-17  
**Version:** 1.0.0  
**Maintainer:** ESTA Tracker Development Team
