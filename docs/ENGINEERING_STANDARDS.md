# ESTA-Logic Engineering Standards Guide

**Version**: 1.0.0  
**Last Updated**: 2025-12-01  
**Status**: Active

This document establishes engineering standards for the ESTA-Logic project to ensure consistent, high-quality contributions.

---

## Table of Contents

1. [Git Workflow](#git-workflow)
2. [Branching Strategy](#branching-strategy)
3. [Commit Conventions](#commit-conventions)
4. [Versioning](#versioning)
5. [Code Review Process](#code-review-process)
6. [Release Process](#release-process)
7. [Documentation Standards](#documentation-standards)

---

## Git Workflow

### Repository Structure

```
main (or master)      # Production-ready code
  │
  └── develop         # Integration branch (optional)
        │
        ├── feature/  # New features
        ├── fix/      # Bug fixes
        ├── docs/     # Documentation
        ├── refactor/ # Code refactoring
        └── chore/    # Maintenance tasks
```

### Daily Workflow

1. **Start Fresh**: Pull latest changes from main
2. **Create Branch**: Branch from main with descriptive name
3. **Make Changes**: Commit early and often
4. **Push Changes**: Push to origin for backup
5. **Open PR**: Request review when ready
6. **Address Feedback**: Iterate based on review
7. **Merge**: Squash merge to main

---

## Branching Strategy

### Branch Naming Convention

```
<type>/<short-description>
```

| Type        | Use Case                                | Example                    |
| ----------- | --------------------------------------- | -------------------------- |
| `feature/`  | New functionality                       | `feature/employee-import`  |
| `fix/`      | Bug fixes                               | `fix/accrual-calculation`  |
| `docs/`     | Documentation only                      | `docs/api-specification`   |
| `refactor/` | Code restructuring (no behavior change) | `refactor/auth-service`    |
| `chore/`    | Build, CI, dependencies                 | `chore/upgrade-typescript` |
| `test/`     | Test additions/fixes                    | `test/accrual-edge-cases`  |
| `hotfix/`   | Urgent production fixes                 | `hotfix/security-patch`    |

### Branch Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      Branch Lifecycle                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Create        Work        PR Review      Merge     Delete  │
│    │            │             │             │          │    │
│    ▼            ▼             ▼             ▼          ▼    │
│  ┌────┐      ┌────┐        ┌────┐        ┌────┐    ┌────┐  │
│  │ git│      │ git│        │Open│        │Squash│   │ git│  │
│  │checkout│  │commit│      │ PR │        │Merge│   │push│  │
│  │ -b │      │    │        │    │        │    │   │:del│  │
│  └────┘      └────┘        └────┘        └────┘    └────┘  │
│                                                              │
│  Max Lifetime: 2 weeks (feature), 3 days (fix/hotfix)       │
└─────────────────────────────────────────────────────────────┘
```

### Protected Branches

| Branch              | Protection                                      |
| ------------------- | ----------------------------------------------- |
| `main`              | Require PR, CI pass, 1+ approval, no force push |
| `develop` (if used) | Require PR, CI pass                             |

---

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Commit Types

| Type       | Description                         | Example                             |
| ---------- | ----------------------------------- | ----------------------------------- |
| `feat`     | New feature                         | `feat(accrual): add overtime bonus` |
| `fix`      | Bug fix                             | `fix(auth): correct token expiry`   |
| `docs`     | Documentation only                  | `docs(readme): update setup guide`  |
| `style`    | Code style (formatting, semicolons) | `style(api): fix linting errors`    |
| `refactor` | Code change without behavior change | `refactor(db): simplify queries`    |
| `perf`     | Performance improvement             | `perf(csv): optimize large imports` |
| `test`     | Add/update tests                    | `test(accrual): edge case coverage` |
| `build`    | Build system or dependencies        | `build(deps): upgrade vitest`       |
| `ci`       | CI configuration                    | `ci(github): add e2e workflow`      |
| `chore`    | Other changes (tooling, etc.)       | `chore(nx): update cache config`    |
| `revert`   | Revert a previous commit            | `revert: feat(accrual): add bonus`  |

### Scope Examples

| Scope      | Description                  |
| ---------- | ---------------------------- |
| `frontend` | Frontend application         |
| `backend`  | Backend API                  |
| `accrual`  | Accrual engine library       |
| `firebase` | Firebase-related code        |
| `auth`     | Authentication/authorization |
| `api`      | API routes                   |
| `db`       | Database/persistence         |
| `ci`       | CI/CD workflows              |
| `deps`     | Dependencies                 |
| `docs`     | Documentation                |

### Good Commit Examples

```bash
# Feature with scope
feat(accrual): implement overtime bonus calculation

Add 8-hour bonus for employees exceeding 160 hours/month.
Includes cap enforcement based on employer size.

Closes #123

# Bug fix with breaking change
fix(api)!: correct date format in accrual response

BREAKING CHANGE: Response date format changed from
MM/DD/YYYY to ISO 8601 (YYYY-MM-DD)

# Documentation
docs(architecture): add ADR for adapter pattern

# Chore with multiple changes
chore: upgrade TypeScript to 5.4

- Update tsconfig for new features
- Fix type errors in shared-types
- Update CI to use latest TS
```

### Commit Message Rules

1. **Subject line**: Max 72 characters, imperative mood
2. **Body**: Wrap at 80 characters, explain what and why
3. **Footer**: Reference issues, note breaking changes
4. **Scope**: Use lowercase, no spaces

---

## Versioning

We follow [Semantic Versioning](https://semver.org/) (SemVer).

### Version Format

```
MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]
```

| Part         | When to Increment                  | Example           |
| ------------ | ---------------------------------- | ----------------- |
| `MAJOR`      | Breaking API changes               | `1.0.0` → `2.0.0` |
| `MINOR`      | New features (backward compatible) | `1.1.0` → `1.2.0` |
| `PATCH`      | Bug fixes (backward compatible)    | `1.1.1` → `1.1.2` |
| `PRERELEASE` | Pre-release versions               | `2.0.0-beta.1`    |
| `BUILD`      | Build metadata (optional)          | `1.0.0+20251201`  |

### Version Sources

| Package Type | Version Source            | Tool                   |
| ------------ | ------------------------- | ---------------------- |
| Root         | `package.json`            | npm version            |
| Libraries    | Individual `package.json` | Nx release             |
| Changelog    | `CHANGELOG.md`            | Conventional Changelog |

### Pre-release Tags

| Tag     | Purpose                       | Example         |
| ------- | ----------------------------- | --------------- |
| `alpha` | Early development, unstable   | `2.0.0-alpha.1` |
| `beta`  | Feature-complete, testing     | `2.0.0-beta.3`  |
| `rc`    | Release candidate, near-final | `2.0.0-rc.1`    |

---

## Code Review Process

### Pull Request Guidelines

#### PR Title Format

Same as commit message:

```
<type>(<scope>): <description>
```

#### PR Description Template

```markdown
## Summary

[Brief description of changes]

## Changes

- [Bullet point list of specific changes]

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests (if applicable)
- [ ] Manual testing completed

## Documentation

- [ ] Code comments added where needed
- [ ] README/docs updated (if applicable)

## Screenshots (if UI changes)

[Before/after screenshots]

## Related Issues

Closes #[issue number]
```

### Review Checklist

Reviewers should check:

- [ ] **Correctness**: Does the code do what it claims?
- [ ] **Tests**: Are there adequate tests?
- [ ] **Types**: Are TypeScript types correct and complete?
- [ ] **Security**: Any security implications?
- [ ] **Performance**: Any performance concerns?
- [ ] **Documentation**: Is the code self-documenting or well-commented?
- [ ] **Style**: Does it follow existing patterns?

### Review Response Times

| PR Type       | Target Response | Target Resolution |
| ------------- | --------------- | ----------------- |
| Hotfix        | 2 hours         | 4 hours           |
| Bug fix       | 1 business day  | 2 business days   |
| Feature       | 1 business day  | 3 business days   |
| Refactor      | 2 business days | 5 business days   |
| Documentation | 1 business day  | 2 business days   |

### Approval Requirements

| Change Type   | Approvals Required |
| ------------- | ------------------ |
| Documentation | 1                  |
| Bug fix       | 1                  |
| Feature       | 2                  |
| Architecture  | 2 + Tech Lead      |
| Security      | 2 + Security Owner |

---

## Release Process

### Release Types

| Type   | Cadence   | Contents                         |
| ------ | --------- | -------------------------------- |
| Major  | As needed | Breaking changes, major features |
| Minor  | Bi-weekly | New features, improvements       |
| Patch  | As needed | Bug fixes, security patches      |
| Hotfix | Emergency | Critical production fixes        |

### Release Checklist

```markdown
## Pre-Release

- [ ] All CI checks passing
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Documentation updated
- [ ] Security audit (for major/minor)

## Release

- [ ] Create release branch (major/minor only)
- [ ] Tag release: `git tag -a v1.2.3 -m "Release v1.2.3"`
- [ ] Push tag: `git push origin v1.2.3`
- [ ] Create GitHub Release with notes
- [ ] Deploy to production

## Post-Release

- [ ] Verify production deployment
- [ ] Monitor error rates
- [ ] Announce release (if significant)
- [ ] Close related milestones/issues
```

### Changelog Format

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2025-12-01

### Added

- Employee CSV import with validation (#123)
- Overtime bonus calculation (#124)

### Changed

- Improved accrual calculation performance (#125)

### Fixed

- Correct carryover calculation for leap years (#126)

### Security

- Updated firebase-admin to fix CVE-XXXX-XXXX (#127)
```

---

## Documentation Standards

### Code Documentation

#### TypeScript/JavaScript

````typescript
/**
 * Calculate sick time accrual based on hours worked
 *
 * @param hoursWorked - Total hours worked in the period
 * @param yearsOfService - Employee's years of service
 * @param employerSize - Number of employees at company
 * @returns Accrual result with regular, bonus, and cap values
 *
 * @example
 * ```ts
 * const accrual = calculateAccrual(160, 3, 50);
 * // { regular: 5.33, bonus: 0, cap: 72 }
 * ```
 */
export function calculateAccrual(
  hoursWorked: number,
  yearsOfService: number,
  employerSize: number
): AccrualResult {
  // Implementation
}
````

#### Gleam

````gleam
/// Calculate ESTA sick time accrual based on hours worked
///
/// ## Parameters
///
/// - `hours` - Total hours worked in the period
/// - `years_service` - Employee's years of service
/// - `employer_size` - Number of employees at company
///
/// ## Returns
///
/// `Accrual` record with regular, bonus, and cap values
///
/// ## Example
///
/// ```gleam
/// let result = calculate(160.0, 3.0, 50)
/// // Accrual(regular: 5.33, bonus: 0.0, cap: 72.0)
/// ```
pub fn calculate(hours: Float, years_service: Float, employer_size: Int) -> Accrual {
  // Implementation
}
````

### Documentation Types

| Type          | Location                 | Format   |
| ------------- | ------------------------ | -------- |
| API Reference | `docs/api/`              | OpenAPI  |
| Architecture  | `docs/architecture/`     | Markdown |
| Guides        | `docs/guides/`           | Markdown |
| ADRs          | `docs/architecture/adr/` | Markdown |
| Runbooks      | `docs/runbooks/`         | Markdown |

### Writing Style

1. **Clear and concise**: Avoid jargon when possible
2. **Imperative mood**: "Configure the environment" not "Configuring..."
3. **Active voice**: "The function calculates" not "is calculated by"
4. **Consistent terminology**: Use the same term for the same concept
5. **Include examples**: Show, don't just tell

---

## Quick Reference

### Common Commands

```bash
# Start feature
git checkout main
git pull origin main
git checkout -b feature/my-feature

# Commit changes
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push -u origin feature/my-feature
# Open PR on GitHub

# After merge, cleanup
git checkout main
git pull origin main
git branch -d feature/my-feature
```

### CI Checks

All PRs must pass:

- [ ] Lint (`npm run lint`)
- [ ] Type check (`npm run typecheck`)
- [ ] Unit tests (`npm test`)
- [ ] Build (`npm run build`)
- [ ] E2E tests (if applicable)

---

## References

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [Engineering Ecosystem](./ENGINEERING_ECOSYSTEM.md)
- [Engineering Principles](./ENGINEERING_PRINCIPLES.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [ADR Index](./architecture/adr/README.md)
