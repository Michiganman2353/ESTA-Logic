# Phase 1: Architecture & File Structure Normalization

**Phase:** 1 of 6  
**Status:** 📋 Planning  
**Priority:** High  
**Dependencies:** Phase 0 (Governance)  
**Estimated Duration:** 2-3 weeks  
**Lead:** TBD

---

## 🎯 Objective

**Establish structural order while preserving logic integrity.**

Transform the current file and folder structure into a predictable, industry-standard organization that reduces navigation friction and improves developer productivity — without changing any functional behavior.

---

## 📊 Current State Analysis

### Current Directory Structure

```
/
├── api/              # Backend API endpoints
├── app/              # Legacy app structure
├── apps/             # Nx workspace apps
├── archive/          # Historical artifacts
├── content/          # Content and copy
├── demo/             # Demo scripts
├── docs/             # Documentation
├── e2e/              # E2E tests
├── engine/           # Business logic engine
├── examples/         # Example code
├── functions/        # Firebase functions
├── infra/            # Infrastructure code
├── kernel/           # Microkernel core
├── libs/             # Shared libraries
├── logic/            # Gleam logic modules
├── packages/         # Workspace packages
├── scripts/          # Build/utility scripts
├── services/         # WASM services
├── test/             # Test infrastructure
└── tests/            # Additional tests
```

### Problems Identified

1. **Overlapping Purposes:**
   - `libs/`, `packages/`, and `logic/` all contain shared code
   - `test/` and `tests/` contain test infrastructure
   - `app/` and `apps/` serve similar purposes

2. **Unclear Organization:**
   - Difficult to know where new code should go
   - No clear distinction between platform, core, and application layers
   - Inconsistent naming conventions

3. **Navigation Friction:**
   - Developers waste time searching for files
   - Onboarding takes longer than necessary
   - Architectural boundaries are unclear

4. **Maintenance Burden:**
   - Redundant folder structures
   - Unclear ownership of different areas
   - Difficult to enforce architectural rules

---

## 🎯 Target Architecture

### New Standardized Structure

```
/
├── core/                      # ESTA-Logic Core System
│   ├── engine/                # Business logic engines
│   │   ├── accrual/           # Sick time accrual engine
│   │   ├── compliance/        # ESTA compliance engine
│   │   └── risk/              # Risk assessment engine
│   ├── logic/                 # Domain logic (Gleam/TypeScript)
│   │   ├── gleam-core/        # Gleam logic modules
│   │   └── typescript-core/   # TypeScript logic modules
│   ├── compliance/            # Compliance rules and validation
│   │   ├── esta-2025/         # Michigan ESTA 2025 rules
│   │   └── validators/        # Compliance validators
│   └── security/              # Security and capability system
│       ├── capabilities/      # Capability definitions
│       └── auth/              # Authentication logic
│
├── app/                       # Application Layer
│   ├── ui/                    # UI components and flows
│   │   ├── components/        # Reusable UI components
│   │   ├── flows/             # User flow implementations
│   │   └── views/             # Page views
│   ├── state/                 # Application state management
│   └── hooks/                 # React hooks and composables
│
├── platform/                  # Platform & Infrastructure
│   ├── vercel/                # Vercel deployment configs
│   ├── firebase/              # Firebase integration
│   ├── runtime/               # Runtime configuration
│   └── deploy/                # Deployment scripts
│
├── shared/                    # Shared Libraries
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── constants/             # Constants and enums
│   └── contracts/             # API contracts and interfaces
│
├── kernel/                    # Microkernel Core (unchanged)
│   ├── core/                  # Kernel core modules
│   ├── abi/                   # WASM ABI definitions
│   ├── loader/                # Module loader
│   ├── syscalls/              # System call interface
│   └── utils/                 # Kernel utilities
│
├── services/                  # WASM Service Modules (unchanged)
│   ├── accrual-engine/        # Accrual service
│   └── compliance-engine/     # Compliance service
│
├── apps/                      # Nx Workspace Applications
│   ├── frontend/              # Main React frontend
│   ├── backend/               # Express backend API
│   ├── desktop/               # Tauri desktop app
│   └── marketing/             # Marketing site
│
├── api/                       # Backend API (Vercel Functions)
│   ├── v1/                    # API v1 endpoints
│   ├── background/            # Background jobs
│   ├── secure/                # Secure endpoints
│   └── edge/                  # Edge functions
│
├── infra/                     # Infrastructure as Code
│   └── firebase/              # Firebase configuration
│
├── content/                   # Content & UX Writing
│   ├── marketing/             # Marketing copy
│   └── ux-writing/            # In-app copy
│
├── docs/                      # Documentation
│   ├── architecture/          # Architecture docs
│   ├── api/                   # API documentation
│   ├── setup/                 # Setup guides
│   └── security/              # Security documentation
│
├── test/                      # Testing Infrastructure
│   ├── e2e/                   # E2E tests (Playwright)
│   ├── integration/           # Integration tests
│   ├── performance/           # Performance tests
│   ├── architecture/          # Architectural tests
│   └── fixtures/              # Test fixtures and mocks
│
├── scripts/                   # Build & Utility Scripts
│   └── lib/                   # Script libraries
│
├── archive/                   # Historical Artifacts (unchanged)
│   ├── experimental-frameworks/
│   ├── gleam-microkernel-research/
│   └── historical-docs/
│
└── examples/                  # Example Code & Demos
    └── demos/                 # Demo applications
```

### Key Improvements

1. **Clear Layering:**
   - `core/` — Domain logic and business rules
   - `app/` — Application layer (UI, state, flows)
   - `platform/` — Infrastructure and deployment
   - `shared/` — Shared utilities and types

2. **Predictable Navigation:**
   - Intuitive folder names
   - Consistent depth and structure
   - Clear purpose for each directory

3. **Better Separation:**
   - Core business logic isolated from UI
   - Platform concerns separated from application logic
   - Clear boundaries for testing

4. **Scalability:**
   - Room for growth within each section
   - Clear place for new features
   - Modular organization

---

## 📋 Migration Plan

### Step 1: Consolidation Mapping

**Consolidate Shared Code:**
- `libs/shared-types` → `shared/types`
- `libs/shared-utils` → `shared/utils`
- `libs/api-contracts` → `shared/contracts`
- `packages/esta-core` → `core/engine` (evaluate contents)
- `logic/gleam-core` → `core/logic/gleam-core`

**Consolidate Engines:**
- `libs/accrual-engine` → `core/engine/accrual`
- `libs/risk-engine` → `core/engine/risk`
- `engine/esta-kernel` → `core/engine/compliance` (evaluate)

**Consolidate Tests:**
- `tests/` → `test/unit/` (evaluate contents)
- `e2e/` → `test/e2e/`
- `test/architecture` → `test/architecture/` (keep)
- `test/performance` → `test/performance/` (keep)

**Consolidate Platform:**
- `infra/firebase` → `platform/firebase`
- Vercel configs → `platform/vercel/` (keep root vercel.json as link)

**Organize Content:**
- `content/marketing` → `content/marketing` (keep)
- `content/ux-writing` → `content/ux-writing` (keep)

### Step 2: Create New Directories

```bash
mkdir -p core/{engine,logic,compliance,security}
mkdir -p core/engine/{accrual,compliance,risk}
mkdir -p core/logic/{gleam-core,typescript-core}
mkdir -p core/compliance/{esta-2025,validators}
mkdir -p core/security/{capabilities,auth}

mkdir -p platform/{vercel,firebase,runtime,deploy}

mkdir -p shared/{types,utils,constants,contracts}

mkdir -p test/{e2e,integration,unit,performance,architecture,fixtures}
```

### Step 3: Move Files (Carefully)

**Order of Operations:**
1. Create all new directories
2. Copy files to new locations (don't delete originals yet)
3. Update all imports and references
4. Run full test suite
5. Fix any broken imports
6. Verify build succeeds
7. Delete original files only after verification

**Import Update Strategy:**
- Use automated tools where possible (TypeScript Language Server, regex)
- Update `tsconfig.json` path mappings
- Update Nx project configurations
- Update webpack/vite configs

### Step 4: Update Configuration Files

**Files to Update:**
- `tsconfig.base.json` — Path mappings
- `nx.json` — Project configurations
- `package.json` — Workspace definitions
- All `project.json` files in apps/libs
- ESLint configuration
- Prettier ignore patterns
- `.gitignore` — Update patterns
- `.vercelignore` — Update patterns

### Step 5: Update Documentation

**Documentation to Update:**
- `ARCHITECTURE.md` — Update structure diagrams
- `docs/DIRECTORY_TREE.md` — Update tree
- `docs/DEVELOPER_ONBOARDING.md` — Update navigation guide
- `README.md` — Update quick start
- All phase documents — Update paths

---

## ✅ Acceptance Criteria

### Functional Requirements

- [ ] No breaking behavior introduced
- [ ] All existing tests pass
- [ ] Build succeeds without errors
- [ ] No functional logic removed or modified
- [ ] All imports resolve correctly
- [ ] Hot reload works in development

### Structural Requirements

- [ ] New directory structure matches specification
- [ ] Old directories cleaned up (moved to archive if needed)
- [ ] No duplicate files between old and new structure
- [ ] Path mappings updated in all configs
- [ ] Nx workspace graph validates

### Quality Requirements

- [ ] Developer navigation friction reduced (measured via survey)
- [ ] Onboarding documentation updated
- [ ] Architecture documentation reflects new structure
- [ ] ESLint rules updated to enforce structure
- [ ] CI builds clean successfully

### Verification Checklist

- [ ] TypeScript compiles with zero errors
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] E2E tests pass
- [ ] Performance tests pass
- [ ] Architectural tests pass (new)
- [ ] Linting passes
- [ ] Build output identical (size, structure)
- [ ] Vercel deployment succeeds
- [ ] Preview deployment smoke test passes

---

## 🧪 Testing Strategy

### Architectural Tests (New)

Create tests to enforce new structure:

```typescript
// test/architecture/folder-structure.test.ts

describe('Folder Structure Enforcement', () => {
  it('should not have direct imports from app to core', () => {
    // Scan import statements
    // Verify no direct core imports in app layer
  });

  it('should only use shared via path mappings', () => {
    // Verify all shared imports use @shared/* paths
  });

  it('should not have circular dependencies', () => {
    // Use dependency-cruiser or similar
  });
});
```

### Build Comparison

```bash
# Before migration
npm run build > build-before.log

# After migration
npm run build > build-after.log

# Compare outputs
diff build-before.log build-after.log
```

### Import Validation

```bash
# Verify all imports resolve
npx tsc --noEmit

# Check for unused exports
npx ts-prune

# Verify no duplicate exports
npx ts-duplicate-finder
```

---

## ⚠️ Risks & Mitigation

### Risk 1: Broken Imports

**Impact:** High  
**Likelihood:** High  
**Mitigation:**
- Use TypeScript language server for automated refactoring
- Update path mappings before moving files
- Run full test suite after each batch of moves
- Keep old structure until fully verified

### Risk 2: Build Configuration Issues

**Impact:** High  
**Likelihood:** Medium  
**Mitigation:**
- Test build after each config change
- Maintain backup of working configs
- Use Nx migration tools where applicable
- Document all config changes

### Risk 3: Developer Confusion

**Impact:** Medium  
**Likelihood:** High  
**Mitigation:**
- Clear communication before migration
- Update documentation proactively
- Provide migration guide for active branches
- Host team walkthrough session

### Risk 4: CI/CD Failures

**Impact:** High  
**Likelihood:** Medium  
**Mitigation:**
- Test on feature branch first
- Run full CI suite before merging
- Have rollback plan ready
- Deploy to preview environment first

---

## 📈 Success Metrics

### Quantitative Metrics

**Before/After Comparison:**
- Build time (should remain stable ±5%)
- Bundle size (should remain stable ±2%)
- Number of directories at root level (reduce by 30%)
- Average file search time (reduce by 40%)
- Onboarding time (reduce by 25%)

**Code Quality:**
- Duplicate code percentage (establish baseline)
- Cyclomatic complexity (establish baseline)
- Test coverage (maintain or improve)

### Qualitative Metrics

**Developer Feedback:**
- "How easy is it to find files?" (1-10 scale)
- "How clear is the architecture?" (1-10 scale)
- "How confident are you making changes?" (1-10 scale)

**Survey Questions:**
1. Can you quickly find where to add a new feature?
2. Is it clear where different concerns are handled?
3. Is navigation more or less intuitive?

---

## 🔄 Rollback Plan

### Rollback Triggers

- Build failure rate > 20%
- Test failure rate > 10%
- Unable to resolve imports within 4 hours
- Deployment failures
- Team consensus to abort

### Rollback Procedure

1. **Immediate:**
   - Revert merge commit
   - Restore from backup branch
   - Communicate rollback to team

2. **Short-term:**
   - Analyze failure causes
   - Update migration plan
   - Address issues in separate feature branch

3. **Re-attempt:**
   - Fix identified issues
   - Test more thoroughly
   - Retry migration with improvements

---

## 📚 Documentation Deliverables

### Required Documentation

- [ ] Migration guide for developers
- [ ] Updated architecture diagrams
- [ ] Updated onboarding guide
- [ ] Path mapping reference
- [ ] FAQ for common issues
- [ ] Retrospective document

---

## 🎯 Definition of Done

Phase 1 is complete when:

1. ✅ All files moved to new structure
2. ✅ All imports updated and resolving
3. ✅ All tests passing
4. ✅ Build succeeds on CI
5. ✅ Vercel deployment succeeds
6. ✅ Documentation updated
7. ✅ Team walkthrough completed
8. ✅ Architectural tests passing
9. ✅ Code review approved
10. ✅ Merged to main branch
11. ✅ Retrospective document completed

---

## 📞 Communication Plan

### Pre-Migration

- [ ] Team announcement (1 week before)
- [ ] Documentation review session
- [ ] Q&A session for concerns
- [ ] Branch protection reminder

### During Migration

- [ ] Daily progress updates
- [ ] Blocker identification
- [ ] Immediate issue resolution

### Post-Migration

- [ ] Migration summary
- [ ] Lessons learned
- [ ] Updated contribution guide
- [ ] Archive old documentation

---

## 🏁 Next Steps

After Phase 1 completion:

1. Begin Phase 2 planning (DRY Enforcement)
2. Apply learnings to future phases
3. Update charter with timeline estimates
4. Celebrate team success! 🎉

---

**Related Documents:**
- [Modernization Charter](./MODERNIZATION_CHARTER.md)
- [Phase 2: DRY Enforcement](./PHASE_2_DRY_ENFORCEMENT.md)
- [Architecture Guide](../ARCHITECTURE.md)
