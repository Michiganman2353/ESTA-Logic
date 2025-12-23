# ESTA-Logic Package Guidelines

**Version**: 1.0.0  
**Last Updated**: 2025-12-23  
**Status**: Active

---

## Overview

This document defines the standards, conventions, and best practices for creating and maintaining packages within the ESTA-Logic monorepo.

---

## Table of Contents

1. [Package Organization](#package-organization)
2. [Naming Conventions](#naming-conventions)
3. [Directory Structure](#directory-structure)
4. [Build Configuration](#build-configuration)
5. [TypeScript Configuration](#typescript-configuration)
6. [Testing Standards](#testing-standards)
7. [Documentation Requirements](#documentation-requirements)
8. [Import Guidelines](#import-guidelines)
9. [Dependency Management](#dependency-management)
10. [Publishing Guidelines](#publishing-guidelines)

---

## Package Organization

### `libs/` vs `packages/` Distinction

**Use `libs/` for:**

- TypeScript/JavaScript shared libraries
- Utilities used across multiple apps
- React components and hooks
- Firebase integrations
- API contracts
- Business logic libraries

**Use `packages/` for:**

- Language-specific packages (Gleam, Rust, Go)
- Platform-specific implementations
- WASM modules
- Non-JavaScript/TypeScript code

### Examples

```
✅ CORRECT
libs/shared-utils/       # TypeScript utilities → libs/
packages/helix/          # Gleam package → packages/
libs/esta-firebase/      # Firebase integration → libs/

✗ INCORRECT
packages/esta-core/      # TypeScript core logic → should be in libs/
```

---

## Naming Conventions

### Package Names

**Format**: `@esta/<package-name>`

**Rules:**

- Always use `@esta/` prefix for workspace packages
- Use kebab-case for package names
- Be descriptive and specific
- Avoid overly generic names

**Examples:**

```json
✅ GOOD
{
  "name": "@esta/shared-types",
  "name": "@esta/accrual-engine",
  "name": "@esta/firebase"
}

✗ AVOID
{
  "name": "@esta-tracker/shared-utils",  // Wrong prefix
  "name": "@esta/utils",                  // Too generic
  "name": "@esta/SharedTypes"             // Wrong case
}
```

### Reserved Prefixes

- `@esta/` - All workspace packages
- `@esta-tracker/` - **Reserved for published npm packages only**
- Avoid custom prefixes within the monorepo

---

## Directory Structure

### Standard Package Structure

```
libs/package-name/
├── src/
│   ├── index.ts              # Main export file
│   ├── types.ts              # Type definitions
│   ├── utils.ts              # Utility functions
│   ├── constants.ts          # Constants
│   └── __tests__/            # Tests
│       ├── index.test.ts
│       └── utils.test.ts
├── dist/                     # Build output (gitignored)
├── package.json              # Package manifest
├── project.json              # Nx project configuration
├── tsconfig.json             # TypeScript config
├── tsconfig.spec.json        # Test TypeScript config
├── vitest.config.ts          # Vitest configuration
├── .eslintrc.json            # ESLint config (if custom)
└── README.md                 # Package documentation
```

### Required Files

Every package **MUST** have:

- [ ] `package.json` - Package metadata and dependencies
- [ ] `project.json` - Nx build targets and configuration
- [ ] `tsconfig.json` - TypeScript compiler options
- [ ] `README.md` - Package documentation
- [ ] `src/index.ts` - Main entry point

### Optional Files

- `vitest.config.ts` - If package has tests
- `tsconfig.spec.json` - If package has tests
- `.eslintrc.json` - If custom linting rules needed

---

## Build Configuration

### package.json

**Minimum Required Fields:**

```json
{
  "name": "@esta/package-name",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint . --ext .ts"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### project.json (Nx Configuration)

**Standard Configuration:**

```json
{
  "name": "package-name",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/package-name/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "libs/package-name/dist",
        "tsConfig": "libs/package-name/tsconfig.json",
        "packageJson": "libs/package-name/package.json",
        "main": "libs/package-name/src/index.ts"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit",
        "cwd": "libs/package-name"
      }
    },
    "test": {
      "executor": "@nx/vite:test",
      "options": {
        "config": "libs/package-name/vitest.config.ts"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "options": {
        "lintFilePatterns": ["libs/package-name/src/**/*.ts"]
      }
    }
  },
  "tags": ["type:lib", "scope:shared"]
}
```

---

## TypeScript Configuration

### tsconfig.json

**Standard Configuration:**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.spec.ts"]
}
```

### Path Alias Registration

**In tsconfig.base.json:**

```json
{
  "paths": {
    "@esta/package-name": ["libs/package-name/dist"],
    "@esta/package-name/*": ["libs/package-name/dist/*"]
  }
}
```

**Rules:**

- Always point to `dist/` directory, not `src/`
- Use wildcard export for subpath access
- Update both main path and wildcard path

---

## Testing Standards

### Test Organization

```
src/
├── feature.ts
└── __tests__/
    ├── feature.test.ts
    └── feature.integration.test.ts
```

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts', '**/*.spec.ts'],
    },
  },
});
```

### Coverage Requirements

- **Minimum**: 80% line coverage
- **Target**: 90% line coverage
- **Critical Paths**: 100% coverage (compliance, accrual, security)

---

## Documentation Requirements

### README.md Template

````markdown
# @esta/package-name

Brief description of the package purpose.

## Installation

```bash
npm install
```
````

## Usage

```typescript
import { feature } from '@esta/package-name';

const result = feature();
```

## API

### `feature()`

Description of the feature.

**Parameters:**

- `param1`: Description

**Returns:**

- Description of return value

**Example:**

```typescript
const result = feature(param1);
```

## Development

```bash
# Build
npm run build

# Test
npm run test

# Typecheck
npm run typecheck

# Lint
npm run lint
```

## License

MIT

````

---

## Import Guidelines

### Internal Imports (Within Package)

```typescript
// ✅ GOOD: Relative imports within same package
import { helper } from './utils/helper';
import { TYPE } from './types';

// ✗ AVOID: Alias imports within same package
import { helper } from '@esta/package-name/utils/helper';
````

### External Imports (Cross-Package)

```typescript
// ✅ GOOD: Workspace package imports
import { Logger } from '@esta/shared-utils';
import { User } from '@esta/shared-types';

// ✗ AVOID: Relative imports to other packages
import { Logger } from '../../../shared-utils/src/logger';
```

### Import Order

1. Node.js built-ins
2. External packages (npm)
3. Workspace packages (`@esta/`)
4. Relative imports (same package)

**Example:**

```typescript
// 1. Node.js built-ins
import { readFile } from 'fs/promises';

// 2. External packages
import { format } from 'date-fns';
import { z } from 'zod';

// 3. Workspace packages
import { Logger } from '@esta/shared-utils';
import { User } from '@esta/shared-types';

// 4. Relative imports
import { helper } from './utils/helper';
import type { Config } from './types';
```

---

## Dependency Management

### Dependency Rules

**Do:**

- Use workspace protocol for internal dependencies: `"@esta/shared-types": "workspace:*"`
- Pin exact versions for critical dependencies
- Use caret (`^`) for most dependencies
- Document why unusual dependencies are needed

**Don't:**

- Add dependencies without justification
- Use different versions of same package across workspace
- Include dependencies only used in one file (inline if possible)

### Peer Dependencies

Declare peer dependencies for packages that should be provided by consuming app:

```json
{
  "peerDependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  }
}
```

### Dependency Audit

Run before adding new dependencies:

```bash
npm audit --audit-level=moderate
```

---

## Publishing Guidelines

### Pre-Publish Checklist

- [ ] Version bumped appropriately (semver)
- [ ] CHANGELOG.md updated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Breaking changes documented
- [ ] Migration guide provided (if breaking)

### Versioning

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Publishing (Future)

Currently, packages are workspace-internal only. If publishing to npm in future:

```bash
# Publish with provenance
npm publish --access public --provenance
```

---

## Package Creation Checklist

When creating a new package:

- [ ] Choose appropriate location (`libs/` or `packages/`)
- [ ] Use `@esta/` prefix for package name
- [ ] Create standard directory structure
- [ ] Add `package.json` with required fields
- [ ] Add `project.json` with Nx targets
- [ ] Add `tsconfig.json` extending base
- [ ] Add `README.md` with documentation
- [ ] Add path alias to `tsconfig.base.json`
- [ ] Add to workspace `package.json` if needed
- [ ] Create initial `src/index.ts`
- [ ] Add tests with vitest
- [ ] Verify build works: `nx build package-name`
- [ ] Verify tests work: `nx test package-name`
- [ ] Verify lint works: `nx lint package-name`

---

## Maintenance Guidelines

### Regular Audits

**Monthly:**

- Review dependencies for updates
- Check for unused dependencies
- Review test coverage

**Quarterly:**

- Audit package organization
- Review documentation accuracy
- Assess package splitting/merging needs

### Deprecation Process

When deprecating a package:

1. Add deprecation notice to README
2. Update package.json with deprecation message
3. Create migration guide
4. Allow 2 minor versions before removal
5. Remove in next major version

---

## Common Pitfalls

### ❌ Avoid These Mistakes

1. **Pointing path alias to `src/` instead of `dist/`**

   ```json
   // ✗ WRONG
   "@esta/package": ["libs/package/src"]

   // ✅ CORRECT
   "@esta/package": ["libs/package/dist"]
   ```

2. **Forgetting to export from index.ts**

   ```typescript
   // ✗ WRONG: Private implementation
   export { internalHelper } from './internal';

   // ✅ CORRECT: Public API only
   export { publicFeature } from './feature';
   ```

3. **Circular dependencies**

   ```typescript
   // ✗ WRONG
   // a.ts imports from b.ts
   // b.ts imports from a.ts

   // ✅ CORRECT: Extract shared code to new package
   ```

4. **Not cleaning before build**

   ```bash
   # ✗ WRONG: Old files may remain
   npm run build

   # ✅ CORRECT: Clean first
   rm -rf dist && npm run build
   ```

---

## Enforcement

### Automated Checks

These are enforced automatically:

- ESLint for code style
- TypeScript for type safety
- Nx for dependency graph integrity
- Vitest for test coverage

### Manual Review

These require manual review:

- Package naming conventions
- Documentation quality
- Dependency justification
- Architecture alignment

---

## Questions & Support

**Questions about package guidelines?**

- Check ARCHITECTURE.md for system design
- Check CONTRIBUTING.md for contribution workflow
- Ask in #engineering Slack channel

**Found an issue with these guidelines?**

- Open an issue with label `documentation`
- Propose changes via PR

---

## Version History

| Version | Date       | Changes                    |
| ------- | ---------- | -------------------------- |
| 1.0.0   | 2025-12-23 | Initial package guidelines |

---

## References

- [Nx Monorepo Documentation](https://nx.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Semantic Versioning](https://semver.org/)
- [npm Package Best Practices](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
