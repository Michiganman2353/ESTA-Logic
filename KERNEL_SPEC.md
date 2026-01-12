# ESTA-Logic Kernel Specification

**Version:** 1.0.0  
**Status:** Canonical  
**Classification:** Ring 0 - Operating System Foundation

---

## Purpose

This document defines the ESTA-Logic kernel: the foundational execution environment for rule-governed domains. The kernel is not middleware. It is not a framework. It is the bedrock upon which legal reality is computed.

---

## Kernel Properties (Non-Negotiable)

The kernel operates at **Ring 0** - the highest privilege level - with absolute requirements:

### 1. Pure Functions Only

```typescript
// ✅ VALID: Pure function
function calculateAccrual(hours: number, rate: number): number {
  return hours * rate;
}

// ❌ INVALID: Side effects
function calculateAccrual(hours: number): number {
  console.log('Calculating...'); // I/O forbidden
  return hours * getRate(); // External state access forbidden
}
```

**Enforcement:** All kernel functions must be:

- Deterministic (same inputs → same outputs, always)
- Side-effect free
- Stateless
- Independently testable

### 2. No I/O Operations

The kernel does not touch:

- File systems
- Databases
- Network
- Console/stdout
- Time (except as explicit parameter)

**Rationale:** I/O introduces non-determinism. The kernel must be a pure mathematical function from legal state to legal state.

### 3. No Persistence Layer Awareness

The kernel does not know about:

- Firebase
- PostgreSQL
- Redis
- Local storage
- Session storage

**Rationale:** Persistence is a Ring 1+ concern. The kernel computes truth; other layers persist truth.

### 4. No Time Assumptions

```typescript
// ❌ INVALID: Hidden time dependency
function isExpired(policy: Policy): boolean {
  return policy.expiresAt < Date.now(); // Implicit time
}

// ✅ VALID: Time as explicit parameter
function isExpired(policy: Policy, currentTime: number): boolean {
  return policy.expiresAt < currentTime;
}
```

**Rationale:** Time must be explicit. Historical calculations must be reproducible at any future point.

### 5. No UI Awareness

The kernel does not know about:

- React
- Components
- Routing
- User interactions
- Display concerns

**Rationale:** UI is presentation. Kernel is computation. They must remain forever separated.

### 6. No Framework Dependencies

The kernel depends only on:

- TypeScript standard library
- Mathematics
- Logic

**Rationale:** Frameworks evolve. Mathematics is eternal.

---

## Kernel Responsibilities

### 1. Define What Can Exist

The kernel contains the complete state space of legal possibilities:

```typescript
interface LegalState {
  employeeHoursWorked: NonNegativeNumber; // Cannot be negative
  sickTimeAccrued: BoundedNumber<0, 72>; // Michigan ESTA max
  policyEffectiveDate: LegalDate; // Must be valid Michigan ESTA date
  employerSize: EmployerSize; // Must be valid classification
}
```

### 2. Define What Cannot Exist

Illegal states are **unrepresentable**, not validated:

```typescript
// ❌ WRONG: Runtime validation
function validateBalance(balance: number): boolean {
  return balance >= 0; // Allows negative to exist momentarily
}

// ✅ CORRECT: Type-level enforcement
type NonNegativeBalance = number & { __brand: 'NonNegative' };

function createBalance(value: number): NonNegativeBalance | null {
  if (value < 0) return null;
  return value as NonNegativeBalance;
}
```

### 3. Enforce Invariants

The kernel guards these invariants across all operations:

1. **Accrual Monotonicity**: Sick time only increases (unless used)
2. **Cap Enforcement**: Balance ≤ statutory maximum
3. **Temporal Consistency**: No retroactive mutations without explicit recalculation
4. **Legal Alignment**: All operations conform to Michigan ESTA statutes

### 4. Execute Law as Mathematics

```typescript
interface MichiganESTALaw {
  accrualRate: (employerSize: EmployerSize) => AccrualRate;
  maximumBalance: (employerSize: EmployerSize) => Hours;
  carryoverRules: (employerSize: EmployerSize, year: Year) => CarryoverPolicy;
  usageCaps: (employerSize: EmployerSize) => UsagePolicy;
}
```

Every legal rule has a corresponding mathematical function. The law is the specification; the kernel is the implementation.

### 5. Emit Reasoning Artifacts

Every kernel execution produces:

```typescript
interface ProofObject {
  inputs: KernelInputs;
  outputs: KernelOutputs;
  ruleIds: RuleId[];
  statuteReferences: StatuteReference[];
  effectiveDate: ISODate;
  lawVersion: SemanticVersion;
  systemConfidence: Percentage;
  computationTrace: ExecutionTrace;
}
```

These artifacts are **regulator-readable** and **survive subpoenas**.

---

## Kernel API Surface

### Input Contract

```typescript
interface KernelRequest {
  operation: KernelOperation;
  context: LegalContext;
  timestamp: ISODate; // Explicit time
  lawVersion: SemanticVersion; // Explicit law version
}
```

### Output Contract

```typescript
interface KernelResponse<T> {
  result: T;
  proof: ProofObject;
  warnings: Warning[];
  constraints: Constraint[];
}
```

### Core Operations

```typescript
enum KernelOperation {
  CALCULATE_ACCRUAL = 'accrual.calculate',
  VALIDATE_USAGE = 'usage.validate',
  CHECK_COMPLIANCE = 'compliance.check',
  COMPUTE_CARRYOVER = 'carryover.compute',
  PREDICT_EXHAUSTION = 'prediction.exhaustion',
  VERIFY_INVARIANTS = 'invariants.verify',
}
```

---

## Error Handling

Errors in the kernel are **typed impossibilities**, not exceptions:

```typescript
type KernelResult<T> =
  | { success: true; value: T; proof: ProofObject }
  | { success: false; reason: ImpossibilityReason; proof: ProofObject };

enum ImpossibilityReason {
  INVALID_STATE = 'State violates invariant',
  MISSING_CONTEXT = 'Required legal context absent',
  CONSTRAINT_VIOLATION = 'Operation would create illegal state',
  INSUFFICIENT_DATA = 'Cannot compute without additional inputs',
}
```

No exceptions are thrown. Impossibilities are returned as typed values.

---

## Performance Requirements

| Metric      | Requirement         | Rationale                                |
| ----------- | ------------------- | ---------------------------------------- |
| Latency     | p99 < 10ms          | User-facing operations must feel instant |
| Throughput  | 10,000 ops/sec/core | Batch processing scalability             |
| Memory      | < 50MB resident     | Kernel must be lightweight               |
| Determinism | 100%                | No probabilistic operations              |

---

## Security Model

The kernel operates in a **zero-trust environment**:

1. **No Ambient Authority**: Every operation requires explicit capability
2. **Least Privilege**: Kernel exposes minimal API surface
3. **Fail-Safe Defaults**: Unknown states → rejection, not assumption
4. **Complete Audit Trail**: Every operation logged with proof

---

## Testing Requirements

Kernel correctness is proven via:

### Property-Based Tests

```typescript
test('accrual never exceeds statutory maximum', () => {
  forAll(validEmployeeState(), (state) => {
    const result = kernel.calculateAccrual(state);
    assert(result.balance <= getStatutoryMax(state.employerSize));
  });
});
```

### Invariant Tests

```typescript
test('time travel does not corrupt truth', () => {
  const state2024 = createState(2024);
  const result2024 = kernel.compute(state2024);

  // Years later, recalculate with same inputs
  const result2026 = kernel.compute(state2024);

  assert.deepEqual(result2024, result2026); // Must be identical
});
```

### Contradiction Tests

```typescript
test('impossible states are unrepresentable', () => {
  const invalid = createBalance(-5); // Attempt negative balance
  assert(invalid === null); // Must be rejected at construction
});
```

---

## Versioning & Evolution

### Law Version Management

```typescript
interface LawVersion {
  version: SemanticVersion;
  effectiveDate: ISODate;
  jurisdiction: Jurisdiction;
  changelog: LegalChange[];
}
```

When Michigan ESTA law changes, the kernel receives a new version. Old versions remain available for historical recalculation.

### Backward Compatibility Guarantee

**All historical calculations remain valid.**

```typescript
// Calculation from 2024 must remain reproducible in 2030
const result2024 = kernel.compute(state, { lawVersion: '2024.1.0' });
const result2030 = kernel.compute(state, { lawVersion: '2024.1.0' });

assert.deepEqual(result2024, result2030);
```

---

## Deployment Model

The kernel is **deployment-agnostic**:

- ✅ Browser (WebAssembly)
- ✅ Node.js
- ✅ Serverless functions
- ✅ Edge computing
- ✅ Embedded systems

**Requirement:** Identical behavior across all environments.

---

## What the Kernel Is Not

The kernel is **not**:

- ❌ A web framework
- ❌ A database ORM
- ❌ A UI library
- ❌ A REST API
- ❌ A configuration system
- ❌ A rules engine (it **is** the rules)

---

## Philosophical Foundation

**The kernel is to ESTA what physics is to the universe: the non-negotiable rules from which all behavior emerges.**

If it cannot be expressed in the kernel, it does not exist. If the kernel rejects it, it is impossible. If the kernel emits it, it is truth.

---

## References

- **Time Model**: See `TIME_MODEL.md`
- **Constraints**: See `CONSTRAINTS.md`
- **Proof Objects**: See `PROOF_OBJECTS.md`
- **Predictive Engine**: See `PREDICTIVE_ENGINE.md`

---

**Last Updated:** 2026-01-12  
**Authority:** ESTA-Logic Core Team  
**Status:** Canonical Law
