# ESTA-Logic Architecture Enforcement Report

**Version**: 1.0.0  
**Date**: December 2025  
**Status**: Active Analysis

---

## Executive Summary

This document provides a comprehensive analysis of the ESTA-Logic codebase against the microkernel compliance OS architectural doctrine. The analysis identifies architectural violations, maps file responsibilities, prescribes remediation, and documents ecosystem harmonization requirements.

**Key Findings:**

- The system is currently a **Modular Monolith** transitioning toward a **Verified Microkernel** architecture
- Core architectural components exist (kernel-boundary, WASM module, capability system) but enforcement is incomplete
- Frontend contains duplicated compliance logic violating the "UI as untrusted client" doctrine
- Documentation contains competing architectural worldviews requiring consolidation
- Persistence layer properly abstracted but not yet fully isolated from business logic

---

## I. Violations List

### Category Legend

| Code | Category               | Description                            |
| ---- | ---------------------- | -------------------------------------- |
| BV   | Boundary Violation     | Cross-layer access violation           |
| DV   | Determinism Violation  | Non-deterministic behavior             |
| CV   | Capability Violation   | Bypasses capability system             |
| OV   | Ownership Violation    | Unclear module ownership               |
| PV   | Purity Violation       | Side-effects in pure logic             |
| DCV  | Documentation Conflict | Documentation contradicts architecture |

---

### P0 - Critical Violations (Correctness Impact)

#### 1. Frontend Compliance Logic Duplication

**File**: `apps/frontend/src/utils/accrualCalculations.ts`  
**Lines**: 33-156  
**Category**: BV (Boundary Violation)  
**Severity**: P0 - Critical  
**Violation**: Frontend contains complete compliance calculation logic

```typescript
// Line 33-45: Frontend computing accrual - VIOLATION
export function calculateAccrualForHours(
  hoursWorked: number,
  employerSize: 'small' | 'large'
): number {
  if (employerSize === 'large') {
    // Large employers: 1 hour per 30 hours worked
    return hoursWorked / 30; // BUSINESS LOGIC IN UI
  }
  // ...
}
```

**Principle Violated**: "Frontend Is an Untrusted Client" - UI must not encode compliance logic

**Remediation**:

1. Remove all accrual calculation functions from frontend
2. Replace with kernel API calls via `apps/frontend/src/services/kernel.ts`
3. Frontend should only display results from kernel responses

---

#### 2. Firestore Rules Contain Business Logic

**File**: `firestore.rules`  
**Lines**: 186-189  
**Category**: BV, CV  
**Severity**: P0 - Critical  
**Violation**: Firestore security rules encode ESTA compliance validation

```
// Line 186-189: Business logic in security rules - VIOLATION
(!('hoursWorked' in request.resource.data) ||
  (request.resource.data.hoursWorked >= 0 && request.resource.data.hoursWorked <= 24));
```

**Principle Violated**: "Persistence Is an External Capability" - Adapters cannot execute logic

**Remediation**:

1. Move validation to kernel-side validators
2. Firestore rules should only enforce authentication and tenant isolation
3. Business validation occurs before persistence via kernel capability checks

---

#### 3. Backend Routes Bypass Kernel

**File**: `apps/backend/src/routes/compliance.ts`  
**Lines**: 1-740  
**Category**: BV, CV  
**Severity**: P0 - Critical  
**Violation**: Backend routes directly invoke compliance services without kernel mediation

```typescript
// Line 80-86: Direct service call without kernel - VIOLATION
const metadata = createRetentionMetadata({
  recordType,
  recordId,
  tenantId,
  applicationStatus,
});
```

**Principle Violated**: "Kernel Is Sovereign" - All compliance operations must go through kernel

**Remediation**:

1. Wrap service calls in kernel message dispatch
2. Add capability validation before each operation
3. Route through IPC message bus for auditability

---

### P1 - Structural Violations

#### 4. TypeScript Accrual Engine Parallel to WASM

**File**: `libs/accrual-engine/src/calculator.ts`  
**Lines**: 1-185  
**Category**: OV (Ownership Violation)  
**Severity**: P1  
**Violation**: Dual accrual engines (TS and WASM) create logic competition

The TypeScript engine at `libs/accrual-engine/` and WASM engine at `libs/accrual-engine-wasm/` both implement accrual logic. This creates ecosystem competition.

**Principle Violated**: "No Inter-Service Competition" - Subsystems must not fight for territory

**Remediation**:

1. Designate WASM engine as canonical compliance engine
2. Convert TS accrual-engine to thin wrapper that calls WASM
3. Mark TS engine functions as deprecated with migration path

---

#### 5. Compliance Engine Uses Date.now()

**File**: `libs/accrual-engine/src/compliance-engine.ts`  
**Lines**: 261-286  
**Category**: DV (Determinism Violation)  
**Severity**: P1  
**Violation**: Default parameter uses current date

```typescript
// Line 263: Non-deterministic default - VIOLATION
export function checkEffectiveDate(
  employerSize: EmployerSize,
  asOfDate: Date = new Date()  // NON-DETERMINISTIC
): EffectiveDateResult {
```

**Principle Violated**: "WASM Modules Must Be Pure and Deterministic"

**Remediation**:

1. Remove default `new Date()` parameter
2. Require explicit timestamp from caller
3. Timestamp should be provided by kernel as authoritative time source

---

#### 6. Missing Capability Enforcement in Kernel Client

**File**: `apps/frontend/src/services/kernel.ts`  
**Lines**: 140-159  
**Category**: CV  
**Severity**: P1  
**Violation**: Kernel client does not validate capabilities before operations

```typescript
// Line 140-158: No capability check before kernel invocation
private async invoke<T>(
  command: string,
  args: Record<string, unknown> = {}
): Promise<KernelResponse<T>> {
  const tauriInvoke = await getTauriInvoke();
  // NO CAPABILITY VALIDATION
  if (tauriInvoke) {
    return await tauriInvoke(command, args);
  }
```

**Principle Violated**: "Capability Safety Check" - Actions must not bypass capability system

**Remediation**:

1. Add capability token to all kernel invocations
2. Kernel verifies capability before executing command
3. Frontend requests capabilities through auth flow

---

### P2 - Documentation Violations

#### 7. Competing Architecture Documents

**Files Affected**:

- `docs/ARCHITECTURE_QUICK_REFERENCE.md`
- `docs/architecture/MICROKERNEL_STATUS.md`
- `docs/ENGINEERING_ECOSYSTEM.md`
- `docs/MONOREPO_GUIDE.md`
- `docs/architecture/architecture.md`

**Category**: DCV  
**Severity**: P2  
**Violation**: Multiple documents describe different architectural paradigms

**Conflicts Identified**:

- Some docs describe "domain services" pattern (monolithic)
- Others describe microkernel with WASM modules
- Conflicting guidance on database access patterns

**Remediation**:

1. Consolidate into single canonical `ARCHITECTURE.md`
2. Archive outdated documents with deprecation notice
3. Create clear decision tree for developers

---

#### 8. README References Outdated Patterns

**File**: `README.md` (if applicable)  
**Category**: DCV  
**Severity**: P2  
**Violation**: May reference direct Firebase access patterns

**Remediation**: Update to reference adapter interfaces

---

### P3 - Performance/Style Violations

#### 9. Message Bus Uses Math.random()

**File**: `libs/kernel-boundary/src/ipc.ts`  
**Lines**: 597-601  
**Category**: DV  
**Severity**: P3  
**Violation**: Message ID generation uses non-deterministic random

```typescript
// Lines 597-601: Non-deterministic ID generation
export function generateMessageId(timestamp: number): MessageId {
  return {
    high: timestamp,
    low: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER), // NON-DETERMINISTIC
  };
}
```

**Remediation**:

1. Use cryptographically secure PRNG seeded by kernel
2. Or accept ID from kernel as authoritative source

---

#### 10. In-Memory Repository Uses Math.random()

**File**: `libs/kernel-boundary/src/adapter.ts`  
**Lines**: 631-632  
**Category**: DV  
**Severity**: P3  
**Violation**: Mock repository generates IDs with non-deterministic random

```typescript
// Lines 631-632: Non-deterministic ID generation (context.now applied, Math.random remains)
const generateId = (): string =>
  `${context.now.toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
```

**Note**: The Date.now() was already replaced with context.now, but Math.random() still violates determinism.

**Remediation**:

1. Accept ID generator from context for full determinism
2. Use seeded PRNG for predictable test behavior

---

## II. Responsibility Map

### Kernel Layer (`estalogic_kernel/`)

| File                            | Responsibility           | Status     |
| ------------------------------- | ------------------------ | ---------- |
| `src/abi.gleam`                 | Type-level ABI contracts | ✅ Correct |
| `src/security/cap_system.gleam` | Capability enforcement   | ✅ Correct |
| `src/isolation/`                | Process isolation        | ✅ Correct |
| `src/runtime/`                  | WASM runtime management  | ✅ Correct |

### WASM Modules (`libs/accrual-engine-wasm/`)

| File         | Responsibility           | Status     |
| ------------ | ------------------------ | ---------- |
| `src/lib.rs` | Pure accrual computation | ✅ Correct |
| `tests/`     | Deterministic tests      | ✅ Correct |

### Kernel Boundary (`libs/kernel-boundary/`)

| File                | Responsibility              | Status      |
| ------------------- | --------------------------- | ----------- |
| `src/capability.ts` | Capability types/validation | ✅ Correct  |
| `src/adapter.ts`    | Persistence abstraction     | ✅ Correct  |
| `src/ipc.ts`        | Message-based IPC           | ⚠️ Minor DV |

### Frontend (`apps/frontend/`)

| File                               | Responsibility         | Status                    |
| ---------------------------------- | ---------------------- | ------------------------- |
| `src/services/kernel.ts`           | Kernel API client      | ⚠️ Missing capability     |
| `src/services/firebase.ts`         | Firebase re-export     | ✅ Correct (thin wrapper) |
| `src/utils/accrualCalculations.ts` | **SHOULD NOT EXIST**   | ❌ VIOLATION              |
| `src/components/`                  | UI presentation        | ✅ Correct                |
| `src/contexts/`                    | React state management | ✅ Correct                |

### Backend (`apps/backend/`)

| File                       | Responsibility           | Status                       |
| -------------------------- | ------------------------ | ---------------------------- |
| `src/routes/accrual.ts`    | Accrual API endpoints    | ⚠️ Needs kernel mediation    |
| `src/routes/compliance.ts` | Compliance API endpoints | ❌ Bypasses kernel           |
| `src/middleware/`          | Express middleware       | ✅ Correct                   |
| `src/services/`            | Business logic services  | ⚠️ Should be kernel-mediated |

### Shared Libraries (`libs/`)

| Package          | Responsibility       | Status               |
| ---------------- | -------------------- | -------------------- |
| `accrual-engine` | TS accrual logic     | ⚠️ Duplicate of WASM |
| `shared-types`   | Type definitions     | ✅ Correct           |
| `shared-utils`   | Utility functions    | ✅ Correct           |
| `esta-firebase`  | Firebase SDK wrapper | ✅ Correct           |

### Persistence (`firestore.rules`, `functions/`)

| Component         | Responsibility  | Status                     |
| ----------------- | --------------- | -------------------------- |
| `firestore.rules` | Access control  | ❌ Contains business logic |
| `functions/`      | Cloud Functions | ⚠️ Need audit              |

### Protocol Layer (`estalogic_protocol/`)

| File                    | Responsibility        | Status     |
| ----------------------- | --------------------- | ---------- |
| `src/message.gleam`     | Message schemas       | ✅ Correct |
| `src/reliability.gleam` | Reliability semantics | ✅ Correct |

### Documentation (`docs/`)

| File                                 | Status                 |
| ------------------------------------ | ---------------------- |
| `architecture/MICROKERNEL_STATUS.md` | ✅ Canonical           |
| `ARCHITECTURE_QUICK_REFERENCE.md`    | ⚠️ Needs consolidation |
| `ENGINEERING_ECOSYSTEM.md`           | ⚠️ Partially outdated  |
| `MONOREPO_GUIDE.md`                  | ⚠️ Needs update        |

---

## III. Required Refactors

### Priority 0 (Correctness - Immediate)

| ID    | Task                                        | Effort | Impact   |
| ----- | ------------------------------------------- | ------ | -------- |
| R-001 | Remove accrualCalculations.ts from frontend | 2h     | Critical |
| R-002 | Remove business logic from firestore.rules  | 4h     | Critical |
| R-003 | Add kernel mediation to compliance routes   | 8h     | Critical |

### Priority 1 (Structural - Sprint)

| ID    | Task                                     | Effort | Impact |
| ----- | ---------------------------------------- | ------ | ------ |
| R-004 | Designate WASM as canonical engine       | 4h     | High   |
| R-005 | Add capability tokens to kernel client   | 6h     | High   |
| R-006 | Remove Date.now() from compliance-engine | 2h     | Medium |
| R-007 | Create Firebase adapter implementation   | 8h     | High   |

### Priority 2 (Documentation - Backlog)

| ID    | Task                                     | Effort | Impact |
| ----- | ---------------------------------------- | ------ | ------ |
| R-008 | Consolidate architecture documentation   | 4h     | Medium |
| R-009 | Archive deprecated docs                  | 2h     | Low    |
| R-010 | Update README with architecture overview | 2h     | Medium |

### Priority 3 (Polish - Future)

| ID    | Task                                   | Effort | Impact |
| ----- | -------------------------------------- | ------ | ------ |
| R-011 | Replace Math.random() with secure PRNG | 1h     | Low    |
| R-012 | Deterministic ID generation in adapter | 1h     | Low    |

---

## IV. Ecosystem Harmonization Report

### Organisms (Subsystems) Identified

```
┌─────────────────────────────────────────────────────────────────┐
│                    ESTA-Logic ECOSYSTEM                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   KERNEL     │  │    WASM      │  │   PROTOCOL   │           │
│  │   (Gleam)    │  │   MODULES    │  │   (Gleam)    │           │
│  │   SOVEREIGN  │  │   PURE       │  │   CONTRACTS  │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│         └────────────┬────┴────────────────┘                    │
│                      │                                           │
│              ┌───────┴────────┐                                  │
│              │ KERNEL-BOUNDARY│  <── TypeScript Port             │
│              │   (TS Types)   │                                  │
│              └───────┬────────┘                                  │
│                      │                                           │
│     ┌────────────────┼────────────────────┐                     │
│     │                │                    │                      │
│  ┌──┴───┐      ┌─────┴─────┐       ┌──────┴─────┐               │
│  │FRONT │      │  BACKEND  │       │  ADAPTERS  │               │
│  │ END  │      │  (Express)│       │ (Firebase) │               │
│  └──┬───┘      └─────┬─────┘       └──────┬─────┘               │
│     │                │                    │                      │
│     │    UNTRUSTED   │   MEDIATED        │  EXTERNAL            │
│     └────────────────┴────────────────────┘                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Interference Zones

#### Zone 1: TypeScript vs WASM Accrual Engines

**Location**: `libs/accrual-engine/` vs `libs/accrual-engine-wasm/`  
**Issue**: Both implement the same accrual calculation logic  
**Resolution**: WASM module is canonical; TS engine becomes wrapper/deprecated

#### Zone 2: Frontend Business Logic

**Location**: `apps/frontend/src/utils/accrualCalculations.ts`  
**Issue**: Frontend duplicates kernel-level compliance logic  
**Resolution**: Delete file; use kernel service exclusively

#### Zone 3: Firestore Rules Business Validation

**Location**: `firestore.rules` lines 186-189, 212-215  
**Issue**: Security rules encode ESTA-specific constraints  
**Resolution**: Move validation to kernel; rules enforce auth only

### Communication Pathways

| From     | To       | Current            | Target                       |
| -------- | -------- | ------------------ | ---------------------------- |
| Frontend | Kernel   | Direct Tauri IPC   | ✅ Correct                   |
| Frontend | Firebase | SDK re-export      | ⚠️ Should go through adapter |
| Backend  | Services | Direct call        | ❌ Should use IPC bus        |
| Backend  | Firebase | Admin SDK          | ⚠️ Should use adapter        |
| Kernel   | WASM     | Host functions     | ✅ Correct                   |
| Kernel   | Adapters | Capability-checked | 🔄 In Progress               |

### Dual Ownership Issues

| Entity        | Owner 1         | Owner 2          | Resolution                 |
| ------------- | --------------- | ---------------- | -------------------------- |
| Accrual Logic | TS Engine       | WASM Engine      | WASM is canonical          |
| Validation    | Firestore Rules | Backend Services | Backend only               |
| Auth State    | AuthContext     | Firebase         | AuthContext wraps Firebase |

### Logic Duplication Map

| Logic                   | Location 1          | Location 2            | Location 3        |
| ----------------------- | ------------------- | --------------------- | ----------------- |
| Accrual Rate (1:30)     | `accrual-engine`    | `accrual-engine-wasm` | `frontend/utils`  |
| Cap Limits (72/40)      | `accrual-engine`    | `compliance-engine`   | `firestore.rules` |
| Employer Size Threshold | `compliance-engine` | `shared-utils`        | N/A               |

### Porous Boundaries

| Boundary           | Issue                      | Fix                    |
| ------------------ | -------------------------- | ---------------------- |
| Kernel → UI        | Frontend computes accruals | Remove UI calculations |
| Adapter → Business | Firestore validates data   | Move to kernel         |
| Backend → Kernel   | Routes skip kernel         | Add mediation layer    |

---

## V. Architectural Doctrine Compliance Checklist

### Kernel Sovereignty ❌ Partial

- [x] Kernel owns type-level contracts (Gleam ABI)
- [x] Kernel owns capability definitions
- [ ] Kernel mediates all compliance operations
- [ ] Kernel issues capabilities to userland

### WASM Module Purity ✅ Compliant

- [x] Deterministic accrual computation
- [x] No I/O in WASM module
- [x] Uses integer arithmetic (no floating point)
- [x] BTreeMap for deterministic serialization

### Frontend Untrusted ❌ Violated

- [ ] No compliance logic in frontend
- [x] Uses kernel service for operations
- [ ] Does not compute accruals locally

### Persistence External ❌ Partial

- [x] Adapter interfaces defined
- [x] Repository pattern implemented
- [ ] No business logic in rules
- [ ] Adapters capability-checked

### Documentation Clarity ⚠️ Mixed

- [x] Microkernel status documented
- [ ] No conflicting architectural views
- [ ] Single canonical architecture doc

---

## VI. Remediation Implementation Order

```
Phase 1: Critical Fixes (Week 1)
├── R-001: Remove frontend accrualCalculations.ts
├── R-002: Strip business logic from firestore.rules
└── R-003: Add kernel mediation to backend routes

Phase 2: Structural Alignment (Weeks 2-3)
├── R-004: Consolidate to WASM engine
├── R-005: Implement capability tokens
├── R-006: Fix determinism violations
└── R-007: Create Firebase adapter

Phase 3: Documentation (Week 4)
├── R-008: Consolidate architecture docs
├── R-009: Archive deprecated docs
└── R-010: Update README

Phase 4: Polish (Ongoing)
├── R-011: Secure PRNG for IDs
└── R-012: Deterministic mock adapters
```

---

## VII. Appendix: File Inventory

### Files Requiring Modification

1. `apps/frontend/src/utils/accrualCalculations.ts` - DELETE
2. `firestore.rules` - MODIFY (remove business logic)
3. `apps/backend/src/routes/compliance.ts` - MODIFY (add kernel)
4. `libs/accrual-engine/src/compliance-engine.ts` - MODIFY (determinism)
5. `apps/frontend/src/services/kernel.ts` - MODIFY (capabilities)
6. `libs/kernel-boundary/src/ipc.ts` - MODIFY (deterministic IDs)

### Files Correctly Aligned

1. `libs/accrual-engine-wasm/src/lib.rs` - CORRECT
2. `libs/kernel-boundary/src/capability.ts` - CORRECT
3. `libs/kernel-boundary/src/adapter.ts` - MOSTLY CORRECT
4. `estalogic_kernel/src/abi.gleam` - CORRECT
5. `estalogic_protocol/src/message.gleam` - CORRECT

### Documentation to Consolidate

1. `docs/ARCHITECTURE_QUICK_REFERENCE.md`
2. `docs/architecture/MICROKERNEL_STATUS.md` (canonical)
3. `docs/ENGINEERING_ECOSYSTEM.md`
4. `docs/MONOREPO_GUIDE.md`
5. `docs/architecture/architecture.md`

---

## VIII. Conclusion

The ESTA-Logic codebase demonstrates strong architectural intentions with well-designed kernel contracts, capability types, and WASM modules. However, enforcement gaps exist where userland (frontend, backend routes, persistence rules) contains duplicated or improperly placed compliance logic.

**Immediate Actions Required:**

1. Delete `apps/frontend/src/utils/accrualCalculations.ts`
2. Remove ESTA-specific validation from `firestore.rules`
3. Add kernel mediation layer to backend compliance routes

**Success Metrics:**

- Zero compliance calculations in frontend
- All persistence access through adapter interfaces
- Single source of truth for accrual logic (WASM module)
- Consolidated architecture documentation

The microkernel architecture vision is achievable with focused remediation following the prioritized refactor list above.

---

_Report generated as part of Architecture Enforcement, Isolation Doctrine, and Ecosystem Harmony initiative._
