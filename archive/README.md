# Archive Directory

**Purpose:** Preserve experimental, superseded, or stale code for historical reference while keeping the main codebase lean and focused.

## Contents

### gleam-microkernel-research/

Experimental Gleam-based microkernel implementation. This was research into a WASM-native microkernel architecture with security capabilities, message passing, and driver isolation. Concepts from this research were ported to TypeScript in `libs/kernel-boundary/`.

**Archived:** 2025-12-15  
**Reason:** Experimental research code not used in production  
**Status:** Complete research phase, concepts documented and ported

### experimental-frameworks/

Explorations of alternative build systems and frameworks that were not adopted for production.

**Archived:** 2025-12-15  
**Reason:** Experimental prototypes not integrated into production workflow

### superseded-configs/

Legacy configuration files replaced by newer standards or consolidated approaches.

**Archived:** 2025-12-15  
**Reason:** Standardization on newer configuration formats

## Restoration

If you need to restore any archived code:

1. **From Archive Directory:** Copy the code back to its original location
2. **From Git History:** Use git log and checkout to restore from history
3. **Check DEPRECATIONS.md:** For context on why it was archived and any dependencies

## Deletion Policy

Archived code is reviewed quarterly. Code archived for 6+ months with no restoration requests may be permanently deleted (remaining accessible via git history).

---

**See Also:** [DEPRECATIONS.md](../DEPRECATIONS.md) for detailed archival decisions and rationale.
