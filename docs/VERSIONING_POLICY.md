# ESTA Tracker Versioning Policy

This document outlines the versioning policy for the ESTA Tracker monorepo.

## Semantic Versioning

All packages in this monorepo follow [Semantic Versioning 2.0.0](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality additions
- **PATCH** version for backwards-compatible bug fixes

## Package Versioning

### Independent Versioning

Each package in the monorepo maintains its own version number. This allows for:

- Granular release control
- Clear change tracking per package
- Flexibility in release schedules

### Version Constraints

| Package                  | Version Pattern | Notes                               |
| ------------------------ | --------------- | ----------------------------------- |
| `@esta/shared-types`     | `1.x.x`         | Core types, high stability required |
| `@esta/core`             | `0.x.x`         | Business logic, pre-1.0 development |
| `@esta/firebase-adapter` | `0.x.x`         | Firebase integration                |
| `accrual-engine`         | `1.x.x`         | Accrual calculations                |
| `shared-utils`           | `1.x.x`         | Utility functions                   |
| `frontend`               | `2.x.x`         | React application                   |
| `backend`                | `2.x.x`         | Express API server                  |

## Version Synchronization

### Root Package Version

The root `package.json` version (`2.0.0`) represents the overall monorepo version and is used for:

- Deployment tagging
- Release notes
- Overall project milestones

### Breaking Change Coordination

When a shared package has a breaking change:

1. Bump the shared package MAJOR version
2. Update all dependent packages to use the new version
3. Bump dependent packages' MINOR or PATCH version as appropriate
4. Document the change in CHANGELOG.md

## Release Process

### Pre-release Versions

For testing and preview releases:

- Alpha: `x.x.x-alpha.N`
- Beta: `x.x.x-beta.N`
- Release Candidate: `x.x.x-rc.N`

### Production Releases

1. Ensure all tests pass
2. Update CHANGELOG.md
3. Run `npm version <major|minor|patch>` in the appropriate package
4. Create a git tag
5. Push changes and tags

## Dependency Version Constraints

### Internal Dependencies

Use `file:` references for workspace packages:

```json
{
  "dependencies": {
    "@esta/shared-types": "file:../../libs/shared-types"
  }
}
```

### External Dependencies

- Use caret (`^`) for non-critical dependencies
- Use exact versions for critical or problematic packages
- Document any pinned versions in this file

### Pinned Dependencies

| Dependency       | Version   | Reason                        |
| ---------------- | --------- | ----------------------------- |
| `react`          | `^18.2.0` | Stability, override conflicts |
| `react-dom`      | `^18.2.0` | Must match react version      |
| `path-to-regexp` | `6.3.0`   | Security fix for @vercel/node |

## Version Checking

Run the following to check for outdated dependencies:

```bash
npm outdated
```

Run the following to check for version conflicts:

```bash
npm ls --all
```

## Changelog

All notable changes should be documented in the root `CHANGELOG.md` following the [Keep a Changelog](https://keepachangelog.com/) format.

## Questions

For questions about versioning, consult the development team or open a discussion in the repository.
