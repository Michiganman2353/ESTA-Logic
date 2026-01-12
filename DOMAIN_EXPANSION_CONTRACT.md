# ESTA-Logic Domain Expansion Contract

**Version:** 1.0.0  
**Status:** Canonical  
**Classification:** Ring 0 - Extension Protocol  
**Authority:** ESTA-Logic Core Team

---

## Purpose

This document defines the **canonical protocol** for extending the ESTA-Logic kernel to new legal domains, jurisdictions, and compliance requirements.

The kernel is designed to host **any reality where correctness, provability, and trust are non-negotiable**.

---

## Philosophy

**Once the kernel is frozen:**
- Laws become instructions
- Domains become modules  
- Products become shells

**Nothing above it can corrupt it.**  
**Nothing below it can replace it.**

---

## Domain Extension Model

### What Is a Domain?

A **domain** is a self-contained legal or regulatory system with:

1. **Statutory Rules**: Codified legal requirements
2. **Computational Model**: How rules translate to calculations
3. **Proof Requirements**: Evidence standards for compliance
4. **Temporal Scope**: Effective dates and versioning

**Examples:**
- Michigan ESTA (current)
- California Paid Sick Leave
- Federal FMLA
- OSHA Recordkeeping
- GDPR Data Rights
- HIPAA Privacy Rules

---

## Extension Contract

### Non-Negotiable Requirements

Every domain extension MUST:

1. **Be Deterministic**: Same inputs → Same outputs, always
2. **Be Stateless**: No hidden state or ambient context
3. **Be Pure**: No side effects or I/O operations
4. **Be Versioned**: Explicit semantic versioning
5. **Be Documented**: Complete statute mapping
6. **Be Tested**: 100% test coverage with property-based tests
7. **Be Auditable**: Generate complete proof objects

### Forbidden Behaviors

Domain extensions MUST NOT:

- ❌ Mutate kernel state
- ❌ Access external resources (files, network, database)
- ❌ Depend on other domains
- ❌ Use implicit time or randomness
- ❌ Perform I/O operations
- ❌ Introduce nondeterminism

---

## Domain Module Structure

### Canonical Template

```typescript
/**
 * Domain Module: [Domain Name]
 * 
 * Jurisdiction: [State/Federal/International]
 * Statute: [Legal Citation]
 * Effective Date: [ISO Date]
 * Version: [Semantic Version]
 */

export interface DomainModule {
  // Module metadata
  metadata: DomainMetadata;
  
  // Instruction set extensions
  instructions: Instruction[];
  
  // Domain-specific types
  types: TypeDefinitions;
  
  // Validation rules
  invariants: Invariant[];
  
  // Statute mappings
  statutes: StatuteRegistry;
}
```

### Metadata Specification

```typescript
interface DomainMetadata {
  // Unique domain identifier
  id: DomainId; // e.g., "michigan-esta"
  
  // Human-readable name
  name: string; // e.g., "Michigan Earned Sick Time Act"
  
  // Semantic version
  version: SemanticVersion; // e.g., "1.0.0"
  
  // Legal jurisdiction
  jurisdiction: Jurisdiction; // e.g., "US-MI"
  
  // Primary statute reference
  statute: StatuteReference; // e.g., "MCL 408.963"
  
  // Effective date range
  effectiveFrom: ISODate;
  effectiveTo?: ISODate; // null = current
  
  // Kernel version compatibility
  kernelVersion: SemanticVersionRange; // e.g., "^1.0.0"
  
  // Domain dependencies (rare, avoid if possible)
  dependencies?: DomainId[];
}
```

---

## Instruction Extension Protocol

### Adding Domain Instructions

Domain modules extend the kernel instruction set:

```typescript
interface DomainInstruction<I, O> extends Instruction<I, O> {
  // Domain namespace (prevents collisions)
  namespace: DomainId;
  
  // Full qualified opcode
  opcode: Opcode; // e.g., "ESTA_ACCRUAL_CALC"
  
  // Statute mapping
  statute: StatuteReference;
  
  // Implementation
  execute: (input: I, context: ExecutionContext) => Result<O>;
}
```

### Instruction Naming Convention

```
[DOMAIN]_[CATEGORY]_[ACTION]

Examples:
- ESTA_ACCRUAL_CALC      (Michigan ESTA accrual calculation)
- CA_PSL_CARRYOVER_CALC  (California PSL carryover)
- FMLA_ELIGIBILITY_CHECK (Federal FMLA eligibility)
- GDPR_CONSENT_VALIDATE  (GDPR consent validation)
```

### Example: Michigan ESTA Accrual Instruction

```typescript
export const ESTA_ACCRUAL_CALC: DomainInstruction<
  AccrualInput,
  AccrualOutput
> = {
  namespace: 'michigan-esta',
  opcode: 'ESTA_ACCRUAL_CALC',
  name: 'Calculate ESTA Sick Time Accrual',
  version: '1.0.0',
  
  statute: {
    citation: 'MCL 408.963, Section 3(a)',
    url: 'https://legislature.mi.gov/...',
  },
  
  execute(input: AccrualInput, context: ExecutionContext): Result<AccrualOutput> {
    // 1. Validate inputs
    const validatedHours = CHK_NON_NEG(input.hoursWorked);
    if (!validatedHours.success) return validatedHours;
    
    // 2. Determine employer policy
    const size = CLASSIFY_SIZE(input.employerEmployeeCount);
    const policy = DETERMINE_POLICY(size);
    
    // 3. Calculate accrual (1 hour per 30 hours worked)
    const accrualRate = 1 / 30;
    const uncappedAccrual = MUL(validatedHours.value, accrualRate);
    
    // 4. Apply statutory cap
    const cappedAccrual = CAP(uncappedAccrual, policy.maxBalance);
    
    // 5. Create proof object
    let proof = PROOF_CREATE(input, { accrual: cappedAccrual });
    proof = CITE_STATUTE(proof, this.statute);
    proof = STAMP_TIME(proof, context.timestamp);
    
    return ok({
      accrual: cappedAccrual,
      policy: policy,
      proof: SEAL_PROOF(proof),
    });
  },
  
  invariants: [
    'accrual >= 0',
    'accrual <= policy.maxBalance',
    'accrual = hoursWorked / 30 (capped)',
  ],
  
  deterministic: true,
};
```

---

## Type System Extension

### Domain-Specific Types

Domains define their own branded types:

```typescript
// Michigan ESTA types
type MichiganSickTimeBalance = Hours & { 
  readonly __domain: 'michigan-esta';
  readonly __type: 'balance';
};

type MichiganEmployerSize = 
  | 'SMALL'  // < 10 employees
  | 'LARGE'; // >= 10 employees

// California PSL types (different rules)
type CaliforniaPSLBalance = Hours & {
  readonly __domain: 'california-psl';
  readonly __type: 'balance';
};

type CaliforniaEmployerSize = 
  | 'SMALL'   // < 26 employees
  | 'MEDIUM'  // 26-100 employees
  | 'LARGE';  // > 100 employees
```

**Note:** Type namespacing prevents conflicts between domains with different rules.

---

## Validation & Invariants

### Domain Invariant Specification

```typescript
interface DomainInvariant {
  id: InvariantId;
  description: string;
  statute: StatuteReference;
  
  // Predicate that must hold for all domain states
  check: (state: DomainState) => boolean;
  
  // Error message when violated
  violationMessage: (state: DomainState) => string;
}
```

### Example: ESTA Balance Invariants

```typescript
const ESTA_INVARIANTS: DomainInvariant[] = [
  {
    id: 'ESTA_BALANCE_NON_NEGATIVE',
    description: 'Sick time balance cannot be negative',
    statute: { citation: 'MCL 408.963, Section 3(b)' },
    check: (state) => state.balance >= 0,
    violationMessage: (state) => 
      `Balance ${state.balance} violates non-negative requirement`,
  },
  {
    id: 'ESTA_BALANCE_BELOW_CAP',
    description: 'Balance cannot exceed statutory maximum',
    statute: { citation: 'MCL 408.963, Section 3(c)' },
    check: (state) => {
      const cap = state.employerSize === 'SMALL' ? 40 : 72;
      return state.balance <= cap;
    },
    violationMessage: (state) => {
      const cap = state.employerSize === 'SMALL' ? 40 : 72;
      return `Balance ${state.balance} exceeds cap ${cap}`;
    },
  },
];
```

---

## Statute Mapping

### Statute Registry Format

Every domain maintains a complete statute registry:

```typescript
interface StatuteRegistry {
  jurisdiction: Jurisdiction;
  primaryStatute: StatuteReference;
  sections: StatuteSection[];
}

interface StatuteSection {
  citation: string;          // e.g., "Section 3(a)"
  fullCitation: string;      // e.g., "MCL 408.963, Section 3(a)"
  url?: string;              // Official statute URL
  effectiveDate: ISODate;
  supersedes?: string;       // Previous statute it replaces
  
  // Human-readable description
  description: string;
  
  // Which kernel operations implement this section
  implementedBy: Opcode[];
}
```

### Example: Michigan ESTA Statute Registry

```typescript
const MICHIGAN_ESTA_STATUTES: StatuteRegistry = {
  jurisdiction: 'US-MI',
  primaryStatute: {
    citation: 'MCL 408.963',
    url: 'https://legislature.mi.gov/Laws/MCL?objectName=mcl-408-963',
  },
  sections: [
    {
      citation: 'Section 2',
      fullCitation: 'MCL 408.963, Section 2',
      effectiveDate: '2025-02-21',
      description: 'Definitions - Employer size classifications',
      implementedBy: ['CLASSIFY_SIZE', 'DETERMINE_POLICY'],
    },
    {
      citation: 'Section 3(a)',
      fullCitation: 'MCL 408.963, Section 3(a)',
      effectiveDate: '2025-02-21',
      description: 'Accrual rate - 1 hour per 30 hours worked',
      implementedBy: ['ESTA_ACCRUAL_CALC'],
    },
    {
      citation: 'Section 3(b)',
      fullCitation: 'MCL 408.963, Section 3(b)',
      effectiveDate: '2025-02-21',
      description: 'Balance constraints - Non-negative requirement',
      implementedBy: ['CHK_NON_NEG', 'CHK_BALANCE'],
    },
    {
      citation: 'Section 3(c)',
      fullCitation: 'MCL 408.963, Section 3(c)',
      effectiveDate: '2025-02-21',
      description: 'Maximum balance - 40/72 hours based on employer size',
      implementedBy: ['CAP', 'CHK_RANGE'],
    },
  ],
};
```

---

## Versioning & Evolution

### Law Version Management

Laws change over time. The kernel handles this through versioning:

```typescript
interface LawVersion {
  version: SemanticVersion;
  jurisdiction: Jurisdiction;
  effectiveDate: ISODate;
  expiryDate?: ISODate; // null = current
  
  // Changes from previous version
  changelog: LegalChange[];
}

interface LegalChange {
  type: 'NEW_REQUIREMENT' | 'MODIFIED_RULE' | 'REPEALED_SECTION';
  statute: StatuteReference;
  description: string;
  migrationStrategy?: string;
}
```

### Example: ESTA Law Evolution

```typescript
const ESTA_VERSIONS: LawVersion[] = [
  {
    version: '1.0.0',
    jurisdiction: 'US-MI',
    effectiveDate: '2025-02-21',
    changelog: [
      {
        type: 'NEW_REQUIREMENT',
        statute: { citation: 'MCL 408.963' },
        description: 'Initial ESTA law enacted',
      },
    ],
  },
  // Future version (hypothetical)
  {
    version: '1.1.0',
    jurisdiction: 'US-MI',
    effectiveDate: '2026-01-01',
    changelog: [
      {
        type: 'MODIFIED_RULE',
        statute: { citation: 'MCL 408.963, Section 3(a)' },
        description: 'Accrual rate changed to 1 hour per 25 hours',
        migrationStrategy: 'All calculations after 2026-01-01 use new rate',
      },
    ],
  },
];
```

### Historical Calculation Guarantee

**All historical calculations remain reproducible:**

```typescript
// Calculation from 2025 using 2025 law
const result2025 = kernelExecute(
  ESTA_ACCRUAL_CALC,
  input,
  { 
    timestamp: '2025-06-01T00:00:00Z',
    lawVersion: '1.0.0',
  }
);

// Same calculation in 2027 using 2025 law
const result2027 = kernelExecute(
  ESTA_ACCRUAL_CALC,
  input,
  {
    timestamp: '2025-06-01T00:00:00Z', // Historical timestamp
    lawVersion: '1.0.0',                // Historical law version
  }
);

// Results must be identical
assert.deepStrictEqual(result2025, result2027);
```

---

## Domain Isolation

### No Cross-Domain Dependencies

Domains are **completely isolated**:

```typescript
// ❌ FORBIDDEN: Domain depending on another domain
import { calculateMichiganAccrual } from '../michigan-esta';

// ✅ ALLOWED: Domains can share kernel primitives
import { ADD, SUB, MUL } from '../kernel/instructions';
```

**Rationale:** 
- Ensures domains can be loaded/unloaded independently
- Prevents cascading law changes
- Maintains audit trail clarity

### Domain Namespacing

All domain resources are namespaced:

```
michigan-esta/
  ├─ instructions/
  │  ├─ ESTA_ACCRUAL_CALC
  │  ├─ ESTA_CARRYOVER_CALC
  │  └─ ESTA_USAGE_VALIDATE
  ├─ types/
  │  ├─ MichiganSickTimeBalance
  │  └─ MichiganEmployerSize
  └─ statutes/
     └─ MCL_408_963

california-psl/
  ├─ instructions/
  │  ├─ CA_PSL_ACCRUAL_CALC
  │  └─ CA_PSL_CARRYOVER_CALC
  ├─ types/
  │  └─ CaliforniaPSLBalance
  └─ statutes/
     └─ CA_AB_1522
```

---

## Testing Requirements

### Domain Test Specification

Every domain MUST include:

1. **Unit Tests**: 100% instruction coverage
2. **Property Tests**: Invariant validation
3. **Integration Tests**: End-to-end scenarios
4. **Statute Tests**: Direct statute compliance verification
5. **Historical Tests**: Time-travel reproducibility
6. **Cross-Environment Tests**: Deployment invariance

### Example: Property-Based Test

```typescript
test('ESTA accrual never exceeds statutory cap', () => {
  forAll(
    arbitraryHoursWorked(),
    arbitraryEmployerSize(),
    (hours, size) => {
      const result = ESTA_ACCRUAL_CALC.execute(
        { hoursWorked: hours, employerSize: size },
        testContext()
      );
      
      const cap = size === 'SMALL' ? 40 : 72;
      assert(result.value.accrual <= cap);
    }
  );
});
```

---

## Domain Registration Protocol

### Registering a New Domain

```typescript
// 1. Define domain module
const californiaPS L: DomainModule = {
  metadata: { /* ... */ },
  instructions: [ /* ... */ ],
  types: { /* ... */ },
  invariants: [ /* ... */ ],
  statutes: { /* ... */ },
};

// 2. Register with kernel
kernel.registerDomain(californiaPSL);

// 3. Domain instructions are now available
const result = kernel.execute('CA_PSL_ACCRUAL_CALC', input, context);
```

### Domain Lifecycle

```
┌─────────────┐
│  Defined    │ ──register──> │ Loaded │
└─────────────┘               └────────┘
                                   │
                              activate│
                                   ▼
                              ┌─────────┐
                              │ Active  │
                              └─────────┘
                                   │
                            deactivate│
                                   ▼
                              ┌─────────┐
                              │Inactive │
                              └─────────┘
```

Inactive domains remain loaded for historical calculations but don't accept new operations.

---

## Domain Expansion Roadmap

### Current

```
ESTA-Logic v1.0
└─ Michigan ESTA (Active)
```

### Phase 2: Multi-State Expansion

```
ESTA-Logic v2.0
├─ Michigan ESTA (Active)
├─ California Paid Sick Leave (New)
├─ New York Sick Leave (New)
└─ Washington Paid Sick Time (New)
```

### Phase 3: Federal & HR Modules

```
ESTA-Logic v3.0
├─ State Modules (16 states)
├─ Federal FMLA (New)
├─ Federal OSHA (New)
└─ PTO/Vacation Tracking (New)
```

### Phase 4: International Expansion

```
ESTA-Logic v4.0
├─ US Modules
├─ Canada Modules (Provincial laws)
├─ UK Modules (Statutory sick pay)
└─ EU Modules (GDPR, Working Time Directive)
```

---

## Canonical Statement

**The domain expansion contract ensures:**

1. **Isolation**: Domains cannot interfere with each other
2. **Determinism**: All calculations remain reproducible
3. **Auditability**: Complete proof trails for all operations
4. **Extensibility**: New domains add without breaking existing ones
5. **Immutability**: Historical laws remain executable forever

**This is not a plugin system.**  
**This is an operating system extension protocol.**

---

## References

- **Kernel Specification**: See `KERNEL_SPEC.md`
- **Deployment Invariance**: See `DEPLOYMENT_INVARIANCE.md`
- **Structural Guarantees**: See `STRUCTURAL_GUARANTEES.md`
- **Instruction Set**: See `INSTRUCTION_SET.md`
- **Constraints**: See `CONSTRAINTS.md`

---

**Last Updated:** 2026-01-12  
**Contract Version:** 1.0.0  
**Stability:** Frozen  
**Breaking Changes:** Never Permitted
