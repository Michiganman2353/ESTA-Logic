# Deprecations and Archive Log

**Last Updated:** 2025-12-15  
**Purpose:** Document removed/archived code and the rationale for cleanup decisions.

## Overview

This document tracks code that has been removed or archived as part of the repository cleanup initiative. The goal is to maintain a lean, maintainable codebase focused on active production code while preserving history for reference.

## Archival Criteria

Code is marked for removal/archival when it meets one or more criteria:

1. **Unreferenced:** Not imported or used by any active code
2. **Experimental:** Research/prototype code not used in production
3. **Superseded:** Replaced by a better implementation
4. **Stale:** Untouched for 12+ months with no active development
5. **Duplicate:** Redundant with other implementations
6. **No CI Coverage:** Not tested or built by any CI workflow

## Proposed Archival - Phase 1

### Experimental Gleam Modules (Ready for Archive)

**Decision:** Archive experimental Gleam microkernel modules  
**Rationale:** These are research/experimental implementations not used in production. The TypeScript `libs/kernel-boundary` serves as the documented port.

**Directories to Archive:**

1. **estalogic_kernel/** (292KB)
   - **Purpose:** Gleam-based kernel implementation with security, isolation, and runtime safety
   - **Status:** Experimental research, not imported by active code
   - **Imports:** None in production apps
   - **Last Active:** Research phase
   - **Preservation:** Port concepts documented in `libs/kernel-boundary/`

2. **estalogic_protocol/** (100KB)
   - **Purpose:** Protocol definitions and reliability layer
   - **Status:** Experimental messaging fabric
   - **Imports:** None in production apps
   - **Preservation:** Concepts ported to `libs/kernel-boundary/src/ipc.ts`

3. **estalogic_drivers/** (148KB)
   - **Purpose:** Driver implementations for Kafka, Postgres, Redis
   - **Status:** Experimental, not integrated
   - **Imports:** None in production apps
   - **Alternative:** `packages/redis` for production Redis usage

4. **estalogic_observe/** (124KB)
   - **Purpose:** Observability layer
   - **Status:** Experimental
   - **Imports:** None in production apps

**Archive Location:** `archive/gleam-microkernel-research/`  
**Documentation:** Archive README explaining the research and learnings

### Experimental Directories (Ready for Archive)

5. **oracle/** (12KB)
   - **Purpose:** Unclear - contains only a `scenes/` directory
   - **Status:** No clear purpose, not referenced
   - **Imports:** None
   - **Recommendation:** Archive or remove entirely

6. **nix-repro/** (36KB)
   - **Purpose:** Nix reproducible build exploration
   - **Status:** Experimental, has dedicated workflow `nix-repro.yml`
   - **Imports:** None in production code
   - **Decision:** Keep if Nix builds are planned, otherwise archive
   - **Workflow:** `nix-repro.yml` should be archived with it

### Minimal/Placeholder Directories (Evaluation Needed)

7. **apps/web/** (16KB)
   - **Purpose:** SvelteKit web framework exploration
   - **Status:** Minimal implementation, only `src/routes/` exists
   - **Decision Needed:** Is this active development or abandoned prototype?
   - **Recommendation:** Archive if no active development planned

8. **apps/desktop/** (48KB)
   - **Purpose:** Tauri desktop application wrapper
   - **Status:** Early development, only `src-tauri/` configuration
   - **Decision Needed:** Is desktop app in active roadmap?
   - **Recommendation:** Keep if planned, otherwise archive

## Duplicate Configuration Files (Consolidation Needed)

### ESLint Configuration Duplication

**Issue:** Multiple ESLint configurations exist creating inconsistency

**Files:**

- Root: `.eslintrc.json` (Nx workspace rules)
- Root: `eslint.config.js` (Flat config with Tauri plugin)
- apps/backend: `.eslintrc.cjs` + `eslint.config.js`
- apps/frontend: `.eslintrc.cjs` + `eslint.config.js`
- apps/marketing: `eslint.config.js`

**Decision:** Consolidate to single approach per ESLint v9+ flat config standard

- **Keep:** `eslint.config.js` (root and per-app as needed)
- **Remove:** `.eslintrc.json` and `.eslintrc.cjs` files (legacy format)
- **Rationale:** Flat config is the future standard, more maintainable

### Formatter Competition

**Issue:** Both Prettier and Biome configured

**Files:**

- `.prettierrc` - Prettier configuration (in use)
- `biome.json` - Biome configuration (parallel implementation)

**Decision:** Standardize on Prettier

- **Keep:** `.prettierrc` + `prettier-plugin-tailwindcss`
- **Remove:** `biome.json`
- **Rationale:** Prettier is actively used in package.json scripts and CI; Biome is configured but not actively used

## Redundant CI/CD Workflows (Consolidation Candidates)

### Duplicate/Overlapping Workflows

Current: **14 workflow files**

**Primary Workflows (Keep):**

1. `ci.yml` - Main CI/CD pipeline (comprehensive, well-maintained)
2. `codeql-analysis.yml` - Security scanning (required)
3. `security-audit.yml` - Dependency audits (required)

**Specialized Workflows (Evaluate):** 4. `gleam-ci.yml` - If gleam modules archived, remove 5. `helix-tests.yml` - If helix package active, keep; otherwise consolidate to main CI 6. `wasm-build.yml` - If WASM builds active, keep; otherwise consolidate 7. `mutation-testing.yml` - If used, keep; otherwise remove (expensive) 8. `nix-repro.yml` - If nix-repro archived, remove

**Redundant/Overlapping (Consider Consolidation):** 9. `ci-elite.yml` - Duplicate of `ci.yml` with "Elite Grade" branding - merge or remove 10. `security-gates.yml` - Overlaps with `security-audit.yml` - consolidate 11. `typecheck-augment.yml` - Type checking covered in main CI - consolidate 12. `sentinel.yml` - AI threat simulation - evaluate if actively used 13. `secret-scan.yml` - May overlap with CodeQL - evaluate

**Utility Workflows (Keep):** 14. `update-package-lock.yml` - Useful automation

**Recommendation:** Reduce from 14 to ~6-8 focused workflows

## Documentation Consolidation (Phase 2)

### Current State

- **Total:** 83 markdown files in `docs/`
- **Root Level:** 20+ documentation files
- **Problem:** Too many similar/overlapping docs, hard to find canonical source

### Keep (Authoritative Docs)

- `README.md` - Primary documentation entry point
- `ARCHITECTURE.md` - High-level architecture
- `QUICK_START.md` - Getting started guide
- `CONTRIBUTING.md` - Contribution guidelines
- `SECURITY.md` - Security overview
- `CHANGELOG.md` - Version history
- `MIGRATION.md` - Migration guides
- `BUILD.md` - Build instructions
- `SETUP_GUIDE.md` - Setup instructions

### Consolidate/Remove Candidates

- Multiple similar docs:
  - `docs/ARCHITECTURE_QUICK_REFERENCE.md` vs `ARCHITECTURE.md`
  - `docs/DIAGNOSTIC_REPORT.md` vs `docs/DIAGNOSIS_REPORT.md` (duplicate?)
  - `docs/PR-SUMMARY.md` vs `docs/PR_SUMMARY.md` (duplicate naming)
  - `NODE_VERSION_MIGRATION.md` - one-time migration, can be archived

### Archive Candidates (Superseded/Historical)

- `docs/POST_MORTEM_REGISTRATION_CICD.md` - Historical post-mortem
- `docs/FIREBASE_MIGRATION_GUIDE.md` - If migration complete
- Old migration guides that are no longer relevant

**Next Steps:** Detailed doc audit to consolidate overlapping content

## Dependencies Cleanup (Phase 3)

### Duplicate package-lock.json Files

**Issue:** Multiple packages have their own `package-lock.json` despite npm workspaces

**Files Found:**

- `packages/redis/package-lock.json`
- Potentially others in subdirectories

**Decision:** Remove duplicate lockfiles

- **Keep:** Root `package-lock.json` only
- **Remove:** All subdirectory `package-lock.json` files
- **Rationale:** npm workspaces manages all deps from root

### Unused Dependencies Audit

**Status:** Needs detailed analysis

- Compare package.json deps vs actual imports
- Remove unused dependencies
- Update outdated dependencies (within semver ranges)

## Implementation Status

### Phase 1: Documentation ✅

- [x] Create DIRECTORY_TREE.md
- [x] Create DEPRECATIONS.md
- [ ] Create archive/ directory structure

### Phase 2: Archive Experimental Code

- [ ] Create `archive/gleam-microkernel-research/`
- [ ] Move estalogic\_\* directories to archive
- [ ] Move oracle/ to archive (or delete)
- [ ] Evaluate and archive nix-repro/ if not needed
- [ ] Archive or remove apps/web/ if unused
- [ ] Evaluate apps/desktop/ status

### Phase 3: Consolidate Configuration

- [ ] Migrate to flat ESLint config only
- [ ] Remove legacy .eslintrc.\* files
- [ ] Remove biome.json (standardize on Prettier)
- [ ] Remove duplicate ESLint configs in apps

### Phase 4: Consolidate CI/CD

- [ ] Consolidate duplicate workflows
- [ ] Remove workflows for archived code
- [ ] Update remaining workflows for efficiency

### Phase 5: Documentation Cleanup

- [ ] Audit and consolidate duplicate docs
- [ ] Archive historical/superseded docs
- [ ] Update README with current state

### Phase 6: Dependencies

- [ ] Remove duplicate lockfiles
- [ ] Audit unused dependencies
- [ ] Update outdated dependencies

## Preservation Strategy

All archived code will be preserved in one of two ways:

1. **Git History:** Code remains accessible via git history with tags
2. **Archive Directory:** `archive/[category]/` with README explaining context
3. **Documentation:** Key concepts/learnings documented in active codebase

**Archive Structure:**

```
archive/
├── gleam-microkernel-research/
│   ├── README.md (explains research and learnings)
│   ├── estalogic_kernel/
│   ├── estalogic_protocol/
│   ├── estalogic_drivers/
│   └── estalogic_observe/
├── experimental-frameworks/
│   ├── oracle/
│   └── nix-repro/
└── superseded-configs/
    └── legacy-eslint/
```

## Rollback Plan

If archived code needs to be restored:

1. Code is available in `archive/` directory
2. Code is available in git history (tagged before archival)
3. Archive README provides context and restoration instructions

---

**Next Review:** Quarterly review of archived code for permanent deletion consideration
