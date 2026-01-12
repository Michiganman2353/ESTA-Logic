# OS Integration Guide

## Purpose

This document explains how the new ESTA-Logic OS architecture integrates with the existing accrual-engine and compliance systems. The integration ensures both systems work cohesively without duplication or conflict.

---

## Architecture Overview

### Before (Existing System)

```
┌─────────────────────────────────────┐
│   libs/accrual-engine               │
│   ├── compliance-engine.ts          │
│   │   - calculateAccrualV2()        │
│   │   - validateCarryoverV2()       │
│   │   - loadRuleset()               │
│   ├── calculator.ts                 │
│   ├── validator.ts                  │
│   └── esta2025-ruleset.json         │
└─────────────────────────────────────┘
         │
         v
    (Returns calculation results)
```

### After (Integrated System)

```
┌─────────────────────────────────────┐
│   kernel/integration/os-bridge.ts   │
│   (Wraps existing calculations)     │
└─────────────────────────────────────┘
         │
         ├──> libs/accrual-engine (unchanged)
         │    - Performs actual calculation
         │
         └──> kernel/core (new OS features)
              ├── Proof objects (immutable records)
              ├── Time capsules (historical truth)
              ├── Drift engine (error detection)
              └── Predictive engine (forecasting)
```

---

## Integration Pattern

### The Bridge Functions

The integration module provides "bridge functions" that wrap existing calculations with OS features:

```typescript
// Old way (still works)
import { calculateAccrualV2 } from '@esta-tracker/accrual-engine';
const result = calculateAccrualV2(hoursWorked, employerSize, yearlyAccrued);

// New way (OS-enhanced)
import { calculateAccrualWithProof } from '@esta-logic/kernel/integration';
const { result, proof, capsule } = await calculateAccrualWithProof(
  hoursWorked,
  employerSize,
  yearlyAccrued,
  {
    employeeId: 'EMP-001',
    capsuleRepository: myRepository,
    driftEngine: myDriftEngine,
  }
);
```

### What the Bridge Adds

1. **Proof Objects**: Every calculation gets an immutable, cryptographically sealed record
2. **Time Capsules**: Results stored with law version, timestamps, and audit trails
3. **Drift Detection**: Automatic verification that recalculations match original results
4. **Human-Readable Explanations**: Regulator-friendly summaries generated automatically

---

## Key Integration Functions

### 1. `calculateAccrualWithProof()`

Wraps `calculateAccrualV2()` from accrual-engine.

**Input:**
- Same parameters as `calculateAccrualV2()`
- Optional: `employeeId`, `capsuleRepository`, `driftEngine`

**Output:**
```typescript
{
  result: AccrualResult;        // Original calculation result
  proof: ProofObject;           // Immutable proof with seal
  capsule?: TimeCapsule;        // Stored if repository provided
  driftDetected?: boolean;      // True if drift engine found issues
}
```

**Usage:**
```typescript
const { result, proof } = await calculateAccrualWithProof(
  80,           // hours worked
  'large',      // employer size
  45.5,         // yearly accrued
  {
    employeeId: 'EMP-123',
    employerId: 'EMPLOYER-ABC',
  }
);

// Use result.accrued for business logic (same as before)
// Use proof for audit/compliance needs
console.log(explainProof(proof)); // Human-readable explanation
```

### 2. `validateCarryoverWithProof()`

Wraps `validateCarryoverV2()` from accrual-engine.

**Usage:**
```typescript
const { result, proof } = await validateCarryoverWithProof(
  35,      // current balance
  'small', // employer size
  {
    employeeId: 'EMP-456',
  }
);

if (!result.valid) {
  console.error('Carryover validation failed:', result.errors);
}

// Proof object documents why validation passed/failed
```

### 3. `determineEmployerSizeWithProof()`

Wraps `determineEmployerSize()` from accrual-engine.

**Usage:**
```typescript
const { size, proof } = determineEmployerSizeWithProof(12);
// size: 'large'
// proof: Documents threshold determination with statute references
```

---

## Migration Strategy

### Phase 1: Backward Compatibility (Current)

- **Existing code continues to work unchanged**
- accrual-engine functions are **not modified**
- OS features are **opt-in** via integration module

```typescript
// This still works exactly as before
import { calculateAccrualV2 } from '@esta-tracker/accrual-engine';
const result = calculateAccrualV2(80, 'large', 45.5);
```

### Phase 2: Gradual Enhancement (Recommended)

- Identify critical paths (regulatory audits, compliance reports)
- Switch those paths to OS-enhanced versions
- Keep non-critical paths on original functions

```typescript
// Critical path: Use OS features
if (isAuditContext) {
  const { result, proof } = await calculateAccrualWithProof(...);
  await storeProofForAudit(proof);
}
// Normal path: Use original
else {
  const result = calculateAccrualV2(...);
}
```

### Phase 3: Full Migration (Future)

- All calculations use OS-enhanced versions
- Time capsule repository always provided
- Drift engine always active
- Complete historical audit trail

---

## How Systems Coexist

### No Duplication

The OS architecture does **not** duplicate calculation logic:

- ✅ accrual-engine **performs** calculations
- ✅ OS architecture **wraps & enhances** calculations
- ❌ OS architecture does **not** re-implement calculation rules

### Clear Separation of Concerns

| System | Responsibility |
|--------|----------------|
| **accrual-engine** | Michigan ESTA calculation logic |
| **Proof System** | Immutable record of calculations |
| **Time Capsule** | Historical truth preservation |
| **Drift Engine** | Error detection & quarantine |
| **Predictive Engine** | Future state forecasting |
| **Integration Bridge** | Connects old & new seamlessly |

### Evolution Path

```
Current State:
  accrual-engine (libs)
        ↓
  Direct calculation results

Integrated State:
  accrual-engine (libs)
        ↓
  Integration Bridge (kernel/integration)
        ↓
  OS-Enhanced Results
        ├── Original result (same as before)
        ├── Proof object (new)
        ├── Time capsule (new)
        └── Drift detection (new)
```

---

## Testing Integration

Tests verify both systems work together:

```typescript
// Test that OS wrapper produces same results as original
test('OS bridge returns identical calculation results', () => {
  const original = calculateAccrualV2(80, 'large', 45.5);
  const { result } = await calculateAccrualWithProof(80, 'large', 45.5);
  
  expect(result).toEqual(original); // Must match exactly
});

// Test that proof objects are generated
test('OS bridge generates proof objects', () => {
  const { proof } = await calculateAccrualWithProof(80, 'large', 45.5);
  
  expect(proof.operation).toBe('accrual.calculate');
  expect(proof.seal).toBeDefined();
  expect(verifySeal(proof)).toBe(true);
});
```

---

## Benefits of Integration

### For Existing Code
- ✅ **Zero breaking changes** - existing code works unchanged
- ✅ **Opt-in enhancement** - use OS features when needed
- ✅ **Gradual migration** - no big-bang rewrites

### For New Features
- ✅ **Audit trail** - every calculation has immutable proof
- ✅ **Historical queries** - "what did we calculate on date X?"
- ✅ **Error detection** - drift engine catches inconsistencies
- ✅ **Regulator-ready** - human-readable explanations built-in

### For Compliance
- ✅ **Legal defensibility** - cryptographically sealed proofs
- ✅ **Time capsules** - truth never retroactively mutates
- ✅ **Statute grounding** - every decision references law
- ✅ **Complete audit trail** - nothing is lost or forgotten

---

## Example: Complete Integration

```typescript
import { calculateAccrualWithProof } from '@esta-logic/kernel/integration';
import { InMemoryTimeCapsuleRepository } from '@esta-logic/kernel/core';
import { ComplianceDriftEngine } from '@esta-logic/kernel/core';

// Set up OS components
const repository = new InMemoryTimeCapsuleRepository();
const driftEngine = new ComplianceDriftEngine();

// Calculate with full OS features
const { result, proof, capsule, driftDetected } = 
  await calculateAccrualWithProof(
    80,           // hours worked
    'large',      // employer size
    45.5,         // yearly accrued
    {
      asOfDate: new Date('2024-03-15'),
      employeeId: 'EMP-001',
      employerId: 'EMPLOYER-ABC',
      capsuleRepository: repository,
      driftEngine,
    }
  );

// Use result (same as original accrual-engine)
console.log(`Accrued: ${result.accrued} hours`);
console.log(`Capped: ${result.capped}`);

// Use proof for audit
if (auditContext) {
  await exportProofForRegulator(proof);
}

// Check for drift
if (driftDetected) {
  await notifyAdminOfDrift();
}

// Query historical capsule later
const historicalBelief = await repository.getNearestTo(
  '2024-03-15' as ISODate,
  { employeeId: 'EMP-001' }
);
// Returns exact calculation as it existed on that date
```

---

## Conclusion

The integration architecture ensures:

1. **Backward compatibility**: Existing code works unchanged
2. **Cohesive operation**: New and old systems complement, not compete
3. **Gradual enhancement**: Opt-in to OS features as needed
4. **No duplication**: One source of truth for calculations
5. **Enhanced value**: Audit trails, historical truth, drift detection

The accrual-engine remains the authoritative calculation logic. The OS architecture wraps it with enterprise-grade features for compliance, auditability, and legal defensibility.

---

**Last Updated:** 2026-01-12  
**Status:** Integration Complete  
**Compatibility:** 100% backward compatible
