# CI/CD Workflow Consolidation Plan

**Date:** 2025-12-15  
**Status:** Proposed Consolidation

## Current State: 12 Workflows

### Primary Workflows (Keep)

1. **ci.yml** - Main CI/CD pipeline ✅
   - Comprehensive test, build, and deploy workflow
   - Includes: lockfile verification, tests, builds, E2E, deployments
   - Well-maintained and production-critical
2. **codeql-analysis.yml** - Code security scanning ✅
   - GitHub's built-in security scanner
   - Required for security compliance
   - Separate from CI for scheduled scanning

3. **update-package-lock.yml** - Automated lockfile updates ✅
   - Useful automation for dependency management
   - Runs on schedule, doesn't block PR merges

### Redundant Workflows (Consolidate or Remove)

4. **ci-elite.yml** - Duplicate of ci.yml with "Elite Grade" branding
   - **Decision:** DELETE - Redundant with ci.yml
   - **Rationale:** Duplicate CI pipeline with no meaningful differences
   - Main `ci.yml` already comprehensive

5. **security-audit.yml** vs **security-gates.yml** - Overlapping security checks
   - **Decision:** Keep **security-audit.yml**, remove **security-gates.yml**
   - **Rationale:** Both run npm audit and dependency scanning
   - Consolidate to avoid duplicate work

6. **secret-scan.yml** - Secret scanning with gitleaks
   - **Decision:** KEEP (separate concern)
   - **Rationale:** Specialized secret detection, runs on schedule
   - Different from CodeQL's scanning focus

7. **typecheck-augment.yml** - Type checking + Gleam setup
   - **Decision:** DELETE - Redundant with ci.yml
   - **Rationale:**
     - Type checking already in ci.yml (`typecheck` target)
     - Gleam modules archived, no longer needed
   - Main CI already runs typecheck on affected projects

### Specialized Workflows (Evaluate)

8. **helix-tests.yml** - Helix package Gleam tests
   - **Decision:** DELETE - Helix is experimental Gleam package
   - **Rationale:** Package uses Gleam, which we've archived research for
   - If helix becomes production-critical, tests should be in main CI

9. **wasm-build.yml** - WASM compilation
   - **Decision:** KEEP (for now) - Monitor usage
   - **Rationale:**
     - If `libs/accrual-engine-wasm` becomes production, this is needed
     - If unused for 3+ months, consolidate to main CI or remove

10. **mutation-testing.yml** - Mutation testing
    - **Decision:** KEEP (optional/scheduled) - Expensive but valuable
    - **Rationale:**
      - Runs on schedule, not blocking PRs
      - Provides value for test quality metrics
      - Resource-intensive, appropriate to keep separate

11. **sentinel.yml** - AI threat simulation
    - **Decision:** EVALUATE - Purpose unclear
    - **Recommendation:** Review if actively used, otherwise DELETE
    - If AI testing is valuable, document its purpose

## Consolidation Actions

### Immediate Deletions (Low Risk)

```bash
# Remove duplicate/redundant workflows
rm .github/workflows/ci-elite.yml           # Duplicate of ci.yml
rm .github/workflows/typecheck-augment.yml  # Covered by ci.yml
rm .github/workflows/security-gates.yml     # Overlaps with security-audit.yml
rm .github/workflows/helix-tests.yml        # Gleam package experimental
```

### Evaluate and Decide

- **wasm-build.yml** - Keep if WASM builds are active, remove if unused
- **sentinel.yml** - Document purpose or remove

### Keep As-Is

- ci.yml (primary)
- codeql-analysis.yml (security)
- security-audit.yml (dependency audit)
- secret-scan.yml (secret detection)
- update-package-lock.yml (automation)
- mutation-testing.yml (optional quality gate)

## Expected Result

**Before:** 12 workflows  
**After:** 6-8 workflows (depending on evaluation decisions)

### Core Production Workflows (6)

1. ci.yml - Main CI/CD
2. codeql-analysis.yml - Security scanning
3. security-audit.yml - Dependency auditing
4. secret-scan.yml - Secret detection
5. update-package-lock.yml - Automation
6. mutation-testing.yml - Quality metrics

### Optional (2)

7. wasm-build.yml - If WASM is production-ready
8. sentinel.yml - If AI testing is valuable

## Benefits

1. **Reduced Complexity:** Fewer workflows to maintain
2. **Faster CI:** No duplicate work across workflows
3. **Clearer Purpose:** Each workflow has distinct responsibility
4. **Lower Cost:** Reduced GitHub Actions minutes
5. **Easier Debugging:** Fewer places to look for failures

## Migration Steps

1. ✅ Archive gleam-ci.yml and nix-repro.yml (done - code archived)
2. Document this consolidation plan
3. Remove ci-elite.yml (duplicate)
4. Remove typecheck-augment.yml (redundant)
5. Remove security-gates.yml (overlaps with security-audit.yml)
6. Remove helix-tests.yml (experimental Gleam package)
7. Evaluate wasm-build.yml usage over next sprint
8. Evaluate sentinel.yml purpose and usage
9. Update documentation to reflect new CI structure

## Rollback Plan

All removed workflows are:

1. Preserved in git history
2. Can be restored with `git checkout <commit> -- .github/workflows/<file>.yml`
3. Documented in this file for context

---

**Next Review:** After 1 month, evaluate if remaining workflows are all necessary
