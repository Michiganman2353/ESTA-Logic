# ESTA-Logic Time Model

**Version:** 1.0.0  
**Status:** Canonical  
**Classification:** Ring 0 - Temporal Foundation

---

## Purpose

This document defines how ESTA-Logic treats time not as a dimension that passes, but as a **first-class constraint** that shapes legal reality.

**Core Principle:** Truth does not retroactively mutate. What was correct on March 3rd, 2026 remains correct forever, even when law changes.

---

## The Problem with Naive Time

Traditional systems treat time as:

```typescript
const now = Date.now(); // Hidden global state
const balance = calculateBalance(employee); // Implicit "as of now"
```

This is **fundamentally broken** for compliance because:

1. **Non-Reproducible**: Running the same calculation tomorrow gives different results
2. **Non-Auditable**: Cannot prove what was computed at a specific moment
3. **Non-Defensible**: Historical calculations cannot be reconstructed
4. **Legally Dangerous**: Retroactive mutations create liability

---

## ESTA-Logic Time Model

### Time is Explicit

Every computation receives time as a **parameter**, never reads it from environment:

```typescript
// ❌ INVALID: Implicit time
function getCurrentBalance(employee: Employee): Balance {
  const now = Date.now();
  return calculateBalance(employee, now);
}

// ✅ VALID: Explicit time
function getBalanceAt(
  employee: Employee,
  asOfDate: ISODate,
  lawVersion: LawVersion
): Balance {
  return calculateBalance(employee, asOfDate, lawVersion);
}
```

### Time is Immutable

Once a calculation is performed at time T with law version L:

```typescript
const result_t1 = compute(state, { time: t1, law: v1 });
```

That result remains **eternally valid** for those coordinates:

```typescript
// Years later, same inputs → same outputs
const result_t1_later = compute(state, { time: t1, law: v1 });

assert.deepEqual(result_t1, result_t1_later); // MUST be identical
```

### Time Creates Dimensions

A calculation exists in a 3D space:

```
        Law Version
             ↑
             |
   v2024.2.0 •─────•─────•
             │     │     │
   v2024.1.0 •─────•─────• → Time
             │     │     │
   v2023.1.0 •─────•─────•
            Jan   Mar   Dec
```

Each point (time, law version, state) produces a unique result.

---

## Time Capsule Architecture

### Calculation Record

Every calculation creates an immutable time capsule:

```typescript
interface TimeCapsule<T> {
  // Temporal coordinates
  calculatedAt: ISODate;
  effectiveDate: ISODate;
  lawVersion: SemanticVersion;

  // Input snapshot
  inputs: DeepFrozen<CalculationInputs>;

  // Output snapshot
  outputs: DeepFrozen<T>;

  // Computational proof
  proof: ProofObject;

  // Immutability guarantee
  seal: CryptographicSeal;
}
```

### Immutability Seal

```typescript
interface CryptographicSeal {
  algorithm: 'SHA-256';
  hash: string; // Hash of (inputs + outputs + proof)
  timestamp: ISODate;
  signedBy: SystemIdentity;
}
```

Any attempt to modify a sealed capsule is **cryptographically detectable**.

---

## Recalculation vs. Mutation

### Mutation is Forbidden

```typescript
// ❌ FORBIDDEN: Retroactive change
employee.balance = newValue; // Changes history
employee.accrualRate = newRate; // Rewrites past
```

### Recalculation is Explicit

```typescript
// ✅ ALLOWED: Explicit recalculation
const recalculation = {
  reason: RecalculationReason.LAW_CHANGED,
  originalCapsule: capsule_v1,
  newLawVersion: 'v2024.2.0',
  authorizedBy: auditor,
  effectiveDate: '2024-07-01',
};

const newCapsule = kernel.recalculate(
  recalculation.originalCapsule.inputs,
  recalculation.newLawVersion,
  recalculation.effectiveDate
);
```

**Both capsules remain valid.** The system maintains:

- What we believed on date X (original capsule)
- What we recalculated on date Y (new capsule)
- Why recalculation occurred (audit trail)

---

## Historical Queries

The system can answer:

### 1. "What was the balance on date X?"

```typescript
const balance = getBalanceAt(employee, '2024-03-03');
```

### 2. "What did we believe the balance was on date X?"

```typescript
const believed = getCalculationAt(employee, '2024-03-03');
// Returns the time capsule created nearest to that date
```

### 3. "How has the calculation changed over time?"

```typescript
const timeline = getCalculationTimeline(employee);
// Returns all time capsules in chronological order
```

### 4. "What would the balance be if law X applied?"

```typescript
const hypothetical = calculateWith(
  employee,
  currentDate,
  hypotheticalLawVersion
);
```

---

## Law Versioning

### Version Semantics

```typescript
interface LawVersion {
  version: SemanticVersion; // e.g., "2024.1.0"
  jurisdiction: 'MI' | 'CA' | 'NY' | ...;
  effectiveDate: ISODate;
  sunset Date?: ISODate;
  amendmentOf?: SemanticVersion;
  changelog: LegalChange[];
}
```

### Semantic Versioning for Law

- **Major**: Fundamental rule change (e.g., accrual rate changes)
- **Minor**: New provision added (e.g., new exemption category)
- **Patch**: Clarification without behavioral change

### Effective Date Handling

```typescript
function getApplicableLaw(
  calculationDate: ISODate,
  jurisdiction: Jurisdiction
): LawVersion {
  // Find law version effective on that date
  return lawRegistry.getEffectiveVersion(calculationDate, jurisdiction);
}
```

---

## Time Travel Safety

### Forward Time Travel (Prediction)

```typescript
// Calculate future state based on current trends
const futureBalance = predictBalanceAt(
  employee,
  currentDate,
  futureDate,
  assumptions
);
```

**Constraint:** Clearly marked as prediction, not fact.

### Backward Time Travel (Historical Analysis)

```typescript
// Calculate what should have been
const historicalResult = calculateBalanceAt(
  employee,
  pastDate,
  lawVersionAtThatTime
);
```

**Guarantee:** Result is identical to what would have been calculated at that time.

---

## Temporal Invariants

These must always hold:

### 1. Monotonic Calculation Time

```typescript
// Calculations are never backdated
assert(calculation.calculatedAt >= previous.calculatedAt);
```

### 2. Immutable History

```typescript
// Once sealed, capsules never change
const capsule_t0 = getCalculation(id);
// ... time passes ...
const capsule_t1 = getCalculation(id);

assert.deepEqual(capsule_t0.seal, capsule_t1.seal);
```

### 3. Law Version Consistency

```typescript
// Same (time, law, state) → same result
const result1 = calculate(state, time, lawV1);
const result2 = calculate(state, time, lawV1);

assert.deepEqual(result1, result2);
```

### 4. Temporal Ordering

```typescript
// Events cannot cause their own past
assert(event.occurredAt >= event.causedBy.occurredAt);
```

---

## Clock Sources

The system recognizes three types of time:

### 1. Wall Clock Time

```typescript
type WallClockTime = ISODate; // RFC 3339
// e.g., "2024-03-03T14:30:00Z"
```

Used for: Audit timestamps, user-visible dates

### 2. Legal Time

```typescript
type LegalTime = {
  date: LocalDate; // "2024-03-03"
  timezone: IANATimezone; // "America/Detroit"
  jurisdiction: Jurisdiction; // "MI"
};
```

Used for: Statutory calculations (Michigan time matters for ESTA)

### 3. System Time

```typescript
type SystemTime = {
  nanoseconds: bigint; // Monotonic system clock
  clockSource: 'MONOTONIC' | 'NTP_SYNCED';
};
```

Used for: Performance measurement, event ordering

---

## Time-Related Errors

```typescript
enum TemporalError {
  TIME_TRAVEL_VIOLATION = 'Cannot modify sealed historical record',
  CLOCK_SKEW = 'System clock is not synchronized',
  FUTURE_DATE_FORBIDDEN = 'Cannot calculate beyond legal horizon',
  LAW_VERSION_UNAVAILABLE = 'No law version for specified date',
  TEMPORAL_PARADOX = 'Event creates causal loop',
}
```

---

## Performance Considerations

### Caching Time Capsules

```typescript
// Capsules are immutable → cache forever
const cache = new Map<CapsuleId, TimeCapsule>();

function getCapsule(id: CapsuleId): TimeCapsule {
  return cache.get(id) ?? loadFromStorage(id);
}
```

### Indexing by Time

```typescript
// Efficient temporal queries
interface TemporalIndex {
  byCalculationDate: BTree<ISODate, CapsuleId[]>;
  byEffectiveDate: BTree<ISODate, CapsuleId[]>;
  byLawVersion: Map<SemanticVersion, CapsuleId[]>;
}
```

---

## Migration Strategy

When upgrading time model:

1. **Existing capsules remain valid**: Never rewrite history
2. **New calculations use new model**: Forward-looking only
3. **Dual-model period**: Support both during transition
4. **Complete audit trail**: Document migration reasoning

---

## Legal Defensibility

This time model ensures:

✅ **Reproducibility**: Any calculation can be exactly reproduced  
✅ **Auditability**: Complete record of what was believed when  
✅ **Immutability**: Historical records are tamper-evident  
✅ **Traceability**: Every result traces to specific law version  
✅ **Defensibility**: Can prove compliance at any historical point

---

## System Capabilities

### "What did we believe on March 3rd, 2026?"

```typescript
const belief = getCapsuleNearestTo('2026-03-03', employee.id);
// Returns: Exact calculation as it existed on that date
```

### "Is this calculation still valid?"

```typescript
const isValid = validateCapsule(capsule);
// Checks: Seal intact, law version applicable, no superseding calculation
```

### "Why did this result change?"

```typescript
const diff = compareCapsules(capsule_v1, capsule_v2);
// Returns: Detailed change explanation with legal reasoning
```

---

## Philosophical Foundation

**Time is not a river that flows. It is a coordinate system in which legal facts exist.**

Every calculation is a point in (time × law × state) space. That point is eternal. The system does not rewrite history; it creates new calculations at new coordinates.

This is how we preserve truth across time.

---

## References

- **Kernel Spec**: See `KERNEL_SPEC.md`
- **Constraints**: See `CONSTRAINTS.md`
- **Proof Objects**: See `PROOF_OBJECTS.md`

---

**Last Updated:** 2026-01-12  
**Authority:** ESTA-Logic Core Team  
**Status:** Canonical Law
