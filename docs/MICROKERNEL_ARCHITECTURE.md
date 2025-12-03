# ESTA-Logic Microkernel Architecture

## Operational Intent

ESTA-Logic is a **microkernel compliance OS** where:

- The **kernel orchestrates** all operations
- **Sandboxed WASM modules** perform deterministic compliance computation
- The **frontend** requests service from the kernel (untrusted client)
- **Persistence adapters** act as purely externalized I/O capabilities
- Each **subsystem is a discrete "organism"** in the ecosystem
- The **kernel is the sole conductor** of the orchestration layer

---

## Responsibility Map

### Kernel Layer

| Component           | Location              | Responsibility                                        |
| ------------------- | --------------------- | ----------------------------------------------------- |
| Rust Kernel         | `engine/esta-kernel/` | WASM execution, fuel metering, capability enforcement |
| Gleam Kernel        | `estalogic_kernel/`   | Process lifecycle, message passing, scheduling        |
| Gleam Protocol      | `estalogic_protocol/` | Message format, reliability guarantees                |
| Gleam Observability | `estalogic_observe/`  | Log integrity, tracing                                |

**The Kernel:**

- Owns execution orchestration
- Owns module lifecycle
- Owns capability issuance and enforcement
- Does NOT contain business rules
- Does NOT contain policy logic
- Remains minimal, deterministic, and side-effect-free except through capabilities

### WASM Modules (Pure Compliance Logic)

| Component           | Location                                       | Responsibility                          |
| ------------------- | ---------------------------------------------- | --------------------------------------- |
| Accrual Engine WASM | `libs/accrual-engine-wasm/`                    | Deterministic ESTA accrual calculations |
| Accrual Engine TS   | `libs/accrual-engine/`                         | Reference implementation (TypeScript)   |
| Compliance Engine   | `libs/accrual-engine/src/compliance-engine.ts` | Ruleset-driven compliance logic         |

**WASM Modules:**

- Pure functions over byte-buffer inputs
- No nondeterministic operations
- No direct external state access
- Request capabilities through formal kernel APIs
- No UI-aware code
- Reviewable as independent, auditable logic

### Frontend (Untrusted Client)

| Component      | Location                               | Responsibility                      |
| -------------- | -------------------------------------- | ----------------------------------- |
| React App      | `apps/frontend/`                       | UI rendering, user interaction      |
| Kernel Service | `apps/frontend/src/services/kernel.ts` | Kernel invocation (NOT computation) |
| Utils          | `apps/frontend/src/utils/`             | Formatting ONLY (no business logic) |

**Frontend:**

- Does NOT encode compliance logic
- Does NOT compute accruals
- NEVER bypasses kernel APIs
- Does NOT reach into persistence adapters directly
- Is a pass-through: `UI → Kernel Invocation → WASM Module → Result`

### Persistence Adapters (External I/O)

| Component        | Location                                 | Responsibility                            |
| ---------------- | ---------------------------------------- | ----------------------------------------- |
| Firestore Rules  | `firestore.rules`                        | Access control ONLY (no business logic)   |
| Kernel Boundary  | `libs/kernel-boundary/`                  | Adapter interfaces, capability validation |
| Firebase Service | `apps/frontend/src/services/firebase.ts` | Firebase instance (no logic)              |

**Persistence Adapters:**

- External, untrusted providers
- Cannot execute logic
- Cannot store inconsistent representations
- Cannot introduce side-effects without kernel oversight

### Backend Services

| Component          | Location                                         | Responsibility                              |
| ------------------ | ------------------------------------------------ | ------------------------------------------- |
| Express API        | `apps/backend/`                                  | HTTP routing, authentication, rate limiting |
| Compliance Service | `apps/backend/src/services/complianceService.ts` | Record-keeping metadata (NOT calculations)  |

**Backend Services:**

- Route requests to kernel
- Enforce authentication
- DO NOT duplicate compliance logic
- Invoke kernel for ESTA calculations

---

## Architectural Invariants

### 1. The Kernel Is Sovereign

The kernel:

- Owns execution orchestration
- Owns module lifecycle
- Owns capability issuance and enforcement
- Does NOT contain business rules
- Does NOT contain policy logic
- Must remain minimal, deterministic, and side-effect-free

### 2. WASM Modules Must Be Pure and Deterministic

Every WASM module:

- Is a pure function over byte-buffer inputs
- May NOT perform nondeterministic operations
- May NOT directly access any external state
- Must request capabilities through formal kernel APIs
- Must NOT contain UI-aware code
- Must be reviewable as independent, auditable logic

**Prohibited in WASM modules:**

- I/O operations
- Random numbers
- Floating-point inconsistencies
- Time access (use kernel-provided timestamps)
- Side effects

### 3. Frontend Is an Untrusted Client

The React/Tauri frontend:

- Must NOT encode compliance logic
- Must NOT compute accruals
- Must NEVER bypass kernel APIs
- Must NOT reach into persistence adapters directly

Data flow:

```
UI Event → Kernel Service → Kernel IPC → WASM Module → Result → UI Update
```

### 4. Persistence Is an External Capability

Persistence adapters (Firestore, LocalStorage, IndexedDB):

- Cannot execute logic
- Cannot store inconsistent representations
- Cannot introduce side-effects without kernel oversight
- Must enforce access control ONLY
- Business validation happens BEFORE persistence (in kernel)

### 5. Non-Interference

Subsystems:

- Cannot directly call each other
- Must communicate through kernel-mediated channels
- Cannot share mutable state
- Cannot bypass capability checks

---

## File Classification

### Files That MUST NOT Contain Business Logic

| File Pattern                      | Reason                                 |
| --------------------------------- | -------------------------------------- |
| `apps/frontend/src/**/*.ts(x)`    | Frontend is untrusted                  |
| `firestore.rules`                 | Persistence is external                |
| `storage.rules`                   | Persistence is external                |
| `apps/frontend/src/services/*.ts` | Service layer invokes, doesn't compute |

### Files That SHOULD Contain Business Logic

| File Pattern                        | Reason                         |
| ----------------------------------- | ------------------------------ |
| `libs/accrual-engine/src/*.ts`      | Authoritative compliance logic |
| `libs/accrual-engine-wasm/src/*.rs` | Deterministic WASM module      |
| `engine/esta-kernel/src/*.rs`       | Kernel orchestration           |
| `estalogic_kernel/src/*.gleam`      | Process/message management     |

---

## Verification Checklist

When reviewing code, verify:

1. **Ownership Check**: Does this code belong to Kernel / WASM Module / Adapter / Frontend?
2. **Boundary Violation Check**: Does this code cross layers improperly?
3. **Determinism Check**: Any nondeterministic behavior present?
4. **Capability Safety Check**: Is there an action that bypasses the capability system?
5. **Module Purity Check**: For WASM-bound logic, does it contain stateful or I/O side effects?

---

## Migration Notes

### Deprecated Functions

The following functions in `apps/frontend/src/utils/accrualCalculations.ts` are deprecated and will throw errors:

- `getMaxAccrualForEmployerSize()` - Use kernel APIs
- `calculateCarryover()` - Use kernel APIs
- `calculateAvailableHours()` - Use kernel APIs
- `isWithinUsageLimit()` - Use kernel APIs
- `calculateHoursNeededForAccrual()` - Use kernel APIs
- `calculateAccrualForHours()` - Use `requestAccrualCalculation()`

### Correct Usage

```typescript
// WRONG - Frontend performing computation
const accrued = calculateAccrualForHours(hoursWorked, 'large');

// CORRECT - Delegating to kernel
const result = await requestAccrualCalculation(minutesWorked, 'large');
if (result.success) {
  const accruedHours = minutesToHours(result.accruedMinutes);
}
```

---

## References

- `docs/ENGINEERING_PRINCIPLES.md` - Core engineering principles
- `docs/abi/kernel_contract.md` - Kernel ABI specification
- `estalogic_kernel/src/abi.gleam` - Type-level ABI definitions
- `engine/esta-kernel/src/kernel.rs` - Rust kernel implementation
