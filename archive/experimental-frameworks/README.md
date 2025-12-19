# Experimental Frameworks Archive

**Archived:** 2025-12-15  
**Reason:** Experimental prototypes not integrated into production workflow

## Contents

### oracle/

**Original Location:** Root directory  
**Purpose:** Unknown/unclear - contains only a `scenes/` subdirectory  
**Size:** 12KB  
**Last Modified:** Unknown  
**Reason for Archival:** No clear purpose, not referenced in any production code

### nix-repro/

**Original Location:** Root directory  
**Purpose:** Nix reproducible build system exploration  
**Size:** 36KB  
**Related Workflow:** `.github/workflows/nix-repro.yml`  
**Last Active:** Research phase  
**Reason for Archival:**

- Not integrated into production build process
- npm/Node.js toolchain is the standard for this project
- Nix adds complexity without clear benefit for current team
- Dedicated CI workflow not essential

**Note:** If reproducible builds become a requirement, this research can be restored. For now, package-lock.json provides sufficient reproducibility for the npm ecosystem.

## Restoration Instructions

### To Restore oracle/

1. Copy `archive/experimental-frameworks/oracle/` back to project root
2. Document its purpose and integration points
3. Ensure it has tests and CI coverage

### To Restore nix-repro/

1. Copy `archive/experimental-frameworks/nix-repro/` back to project root
2. Re-enable `.github/workflows/nix-repro.yml` (if archived)
3. Install Nix package manager locally
4. Run `nix-build` or equivalent
5. Document Nix setup in README

## Why These Were Experimental

Both of these represented explorations into alternative approaches:

- **oracle:** Purpose unclear, possibly abandoned early in development
- **nix-repro:** Alternative build system for reproducibility

Neither was integrated into the core development workflow or had active champions driving adoption.

---

**Decision Point:** If reproducible builds become critical, consider:

1. Docker-based builds (simpler for team)
2. GitHub Actions cache (already in use)
3. Deterministic build flags in npm (NODE_OPTIONS, etc.)
4. Only then, consider restoring Nix if other approaches insufficient
