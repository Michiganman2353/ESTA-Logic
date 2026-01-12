# ESTA-Logic Proof Objects

**Version:** 1.0.0  
**Status:** Canonical  
**Classification:** Ring 0 - Institutional Memory

---

## Purpose

This document defines **proof objects**: immutable artifacts that explain _what was computed_, _why it was computed_, and _how to verify it_.

**Core Principle:** This is not logging. This is institutional memory that survives subpoenas.

---

## What is a Proof Object?

A proof object is a **self-contained, cryptographically sealed explanation** of a kernel computation.

```typescript
interface ProofObject {
  // Identity
  proofId: ProofId;
  timestamp: ISODate;

  // Computation context
  operation: KernelOperation;
  kernelVersion: SemanticVersion;
  lawVersion: SemanticVersion;

  // Inputs (frozen)
  inputs: DeepFrozen<KernelInputs>;

  // Outputs (frozen)
  outputs: DeepFrozen<KernelOutputs>;

  // Legal justification
  appliedRules: RuleApplication[];
  statuteReferences: StatuteReference[];

  // Reasoning trace
  executionTrace: ExecutionStep[];

  // Quality metrics
  systemConfidence: Percentage;
  warnings: Warning[];
  assumptions: Assumption[];

  // Immutability guarantee
  seal: CryptographicSeal;

  // Human explanation
  humanReadableSummary: string;
}
```

---

## Proof Object Properties

### 1. Self-Contained

A proof object contains **everything needed** to understand and verify the computation:

```typescript
// No external dependencies - all context is included
function verifyProof(proof: ProofObject): VerificationResult {
  // All information is in the proof object itself
  return {
    valid: verifySeal(proof.seal),
    reproducible: recomputeOutputs(proof.inputs) === proof.outputs,
    legallySound: validateStatuteReferences(proof.statuteReferences),
  };
}
```

### 2. Immutable

Once created, proof objects **never change**:

```typescript
interface CryptographicSeal {
  algorithm: 'SHA-256';
  hash: string; // Hash of entire proof object
  timestamp: ISODate;
  signedBy: SystemIdentity;
  nonce: string; // Prevents hash collisions
}

function createSeal(proof: Omit<ProofObject, 'seal'>): CryptographicSeal {
  const canonical = JSON.stringify(proof); // Deterministic serialization
  const hash = sha256(canonical);

  return {
    algorithm: 'SHA-256',
    hash,
    timestamp: nowISO(),
    signedBy: getSystemIdentity(),
    nonce: generateNonce(),
  };
}
```

Any modification is **cryptographically detectable**:

```typescript
function verifySeal(proof: ProofObject): boolean {
  const { seal, ...content } = proof;
  const recomputed = createSeal(content);
  return recomputed.hash === seal.hash;
}
```

### 3. Regulator-Readable

Proof objects are designed for **human comprehension**, not just machines:

```typescript
interface HumanReadableSummary {
  // Plain English explanation
  summary: string;

  // Key findings highlighted
  keyFindings: string[];

  // Legal basis explained
  legalBasis: string[];

  // Decision reasoning
  reasoning: string;

  // Any concerns
  warnings: string[];
}
```

**Example:**

```typescript
{
  summary: "Calculated sick time accrual for employee John Smith for pay period ending 2024-03-15. Employee worked 80 hours and accrued 2.67 hours of sick time under Michigan ESTA regulations.",

  keyFindings: [
    "Employee worked 80 hours during this pay period",
    "Accrual rate: 1 hour per 30 hours worked (large employer)",
    "2.67 hours accrued (80 ÷ 30 = 2.67)",
    "New balance: 15.5 hours (previously 12.83 hours)",
    "Balance is below 72-hour cap for large employers"
  ],

  legalBasis: [
    "Michigan ESTA 2025, Section 3(a): Employees accrue 1 hour per 30 hours worked",
    "Michigan ESTA 2025, Section 3(c): Large employers (≥10 employees) have 72-hour annual maximum",
    "Employer size: 45 employees (classified as large employer)"
  ],

  reasoning: "This calculation is straightforward application of Michigan ESTA statutory requirements. The employee is well below the annual maximum, and all inputs have been verified. High confidence in accuracy.",

  warnings: []
}
```

### 4. Legally Defensible

Proof objects are designed to withstand legal scrutiny:

```typescript
interface LegalDefense {
  // Statute citations
  statuteReferences: StatuteReference[];

  // Audit trail
  auditTrail: AuditEntry[];

  // Decision authority
  authorizedBy: SystemIdentity | HumanIdentity;

  // Review history
  reviews: Review[];
}

interface StatuteReference {
  // Official citation
  citation: string; // "Michigan ESTA 2025, Section 3(a)"

  // Exact text
  statuteText: string;

  // Official source
  officialLink: URL;

  // How it applies
  application: string;

  // Effective dates
  effectiveFrom: ISODate;
  effectiveTo?: ISODate;
}
```

---

## Proof Object Components

### 1. Execution Trace

Every computation step is recorded:

```typescript
interface ExecutionTrace {
  steps: ExecutionStep[];
  totalDurationMs: number;
  peakMemoryBytes: number;
}

interface ExecutionStep {
  stepNumber: number;
  operation: string;
  inputs: Record<string, unknown>;
  output: unknown;
  durationMs: number;
  ruleApplied?: RuleId;
  justification: string;
}
```

**Example:**

```typescript
{
  steps: [
    {
      stepNumber: 1,
      operation: 'validateInputs',
      inputs: { hoursWorked: 80, employeeId: 'EMP-123' },
      output: { valid: true },
      durationMs: 0.5,
      justification: 'Input validation successful'
    },
    {
      stepNumber: 2,
      operation: 'getEmployerSize',
      inputs: { employerId: 'EMP-ABC' },
      output: { size: 'LARGE', employeeCount: 45 },
      durationMs: 1.2,
      justification: 'Retrieved employer classification from records'
    },
    {
      stepNumber: 3,
      operation: 'calculateAccrual',
      inputs: { hoursWorked: 80, accrualRate: 1/30 },
      output: { accrued: 2.67 },
      durationMs: 0.1,
      ruleApplied: 'ESTA_ACCRUAL_RATE',
      justification: 'Applied statutory accrual rate: 1 hour per 30 hours worked'
    },
    {
      stepNumber: 4,
      operation: 'updateBalance',
      inputs: { previousBalance: 12.83, accrued: 2.67 },
      output: { newBalance: 15.5 },
      durationMs: 0.1,
      justification: 'Added accrued hours to existing balance'
    },
    {
      stepNumber: 5,
      operation: 'checkCap',
      inputs: { balance: 15.5, cap: 72 },
      output: { belowCap: true },
      durationMs: 0.1,
      ruleApplied: 'ESTA_CAP_CHECK',
      justification: 'Verified balance is below statutory maximum'
    }
  ],
  totalDurationMs: 2.0,
  peakMemoryBytes: 4096
}
```

### 2. Rule Applications

Every rule applied is documented:

```typescript
interface RuleApplication {
  ruleId: RuleId;
  ruleName: string;
  ruleVersion: SemanticVersion;

  // Legal basis
  statute: StatuteReference;

  // How rule was applied
  inputs: Record<string, unknown>;
  output: unknown;

  // Decision logic
  condition: string;
  action: string;

  // Confidence
  confidence: Percentage;
  assumptions: string[];
}
```

**Example:**

```typescript
{
  ruleId: 'ESTA_ACCRUAL_RATE',
  ruleName: 'Michigan ESTA Accrual Rate',
  ruleVersion: '2024.1.0',

  statute: {
    citation: 'Michigan ESTA 2025, Section 3(a)',
    statuteText: 'An employee shall accrue not less than 1 hour of paid sick time for every 30 hours worked.',
    officialLink: 'https://legislature.mi.gov/...',
    application: 'Defines base accrual rate for all employers',
    effectiveFrom: '2025-02-21',
  },

  inputs: {
    hoursWorked: 80,
    employerSize: 'LARGE'
  },

  output: {
    hoursAccrued: 2.67
  },

  condition: 'hoursWorked > 0',
  action: 'accrued = hoursWorked / 30',

  confidence: 100,
  assumptions: []
}
```

### 3. System Confidence

The system declares its confidence in every result:

```typescript
interface ConfidenceMetrics {
  // Overall confidence (0-100)
  overall: Percentage;

  // Component confidences
  inputQuality: Percentage;
  ruleApplicability: Percentage;
  calculationAccuracy: Percentage;
  dataCompleteness: Percentage;

  // Confidence factors
  boostingFactors: ConfidenceFactor[];
  reducingFactors: ConfidenceFactor[];
}

interface ConfidenceFactor {
  factor: string;
  impact: number; // -100 to +100
  explanation: string;
}
```

**Example:**

```typescript
{
  overall: 98,

  inputQuality: 100,
  ruleApplicability: 100,
  calculationAccuracy: 100,
  dataCompleteness: 90,

  boostingFactors: [
    {
      factor: 'VERIFIED_INPUTS',
      impact: +10,
      explanation: 'All inputs verified against source of truth'
    },
    {
      factor: 'CLEAR_STATUTE',
      impact: +5,
      explanation: 'Statutory requirement is unambiguous'
    }
  ],

  reducingFactors: [
    {
      factor: 'MISSING_METADATA',
      impact: -2,
      explanation: 'Some optional metadata fields not provided'
    }
  ]
}
```

### 4. Warnings and Assumptions

Transparent about uncertainties:

```typescript
interface Warning {
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  category: WarningCategory;
  message: string;
  recommendation: string;
  statute?: StatuteReference;
}

interface Assumption {
  assumption: string;
  justification: string;
  confidence: Percentage;
  alternative?: string;
}
```

**Example:**

```typescript
{
  warnings: [
    {
      severity: 'MEDIUM',
      category: 'DATA_QUALITY',
      message: 'Employee hire date is within 30 days of first accrual',
      recommendation: 'Verify hire date for accuracy',
      statute: null
    }
  ],

  assumptions: [
    {
      assumption: 'Employee worked in Michigan during this period',
      justification: 'Employer primary location is Michigan; employee record shows no out-of-state work',
      confidence: 95,
      alternative: 'If employee worked out of state, different accrual rules may apply'
    }
  ]
}
```

---

## Proof Object Lifecycle

### 1. Creation

```typescript
function createProof(
  operation: KernelOperation,
  inputs: KernelInputs,
  outputs: KernelOutputs,
  trace: ExecutionTrace
): ProofObject {
  const proof: Omit<ProofObject, 'seal'> = {
    proofId: generateProofId(),
    timestamp: nowISO(),
    operation,
    kernelVersion: KERNEL_VERSION,
    lawVersion: getCurrentLawVersion(),
    inputs: deepFreeze(inputs),
    outputs: deepFreeze(outputs),
    appliedRules: extractRules(trace),
    statuteReferences: extractStatutes(trace),
    executionTrace: trace.steps,
    systemConfidence: calculateConfidence(trace),
    warnings: detectWarnings(trace),
    assumptions: extractAssumptions(trace),
    humanReadableSummary: generateSummary(operation, inputs, outputs, trace),
  };

  const seal = createSeal(proof);

  return { ...proof, seal };
}
```

### 2. Storage

```typescript
interface ProofStorage {
  // Store proof immutably
  store(proof: ProofObject): Promise<void>;

  // Retrieve by ID
  retrieve(proofId: ProofId): Promise<ProofObject | null>;

  // Query by criteria
  query(criteria: ProofQuery): Promise<ProofObject[]>;

  // Verify integrity
  verify(proofId: ProofId): Promise<VerificationResult>;
}
```

### 3. Verification

```typescript
interface VerificationResult {
  // Seal integrity
  sealValid: boolean;

  // Reproducibility
  reproducible: boolean;
  recomputedOutputs?: unknown;

  // Legal validity
  statutesValid: boolean;
  lawVersionApplicable: boolean;

  // Overall verdict
  verdict: 'VALID' | 'INVALID' | 'CANNOT_VERIFY';
  issues: VerificationIssue[];
}

function verifyProof(proof: ProofObject): VerificationResult {
  // 1. Check seal
  const sealValid = verifySeal(proof);

  // 2. Recompute outputs
  const recomputed = kernel.execute(proof.operation, proof.inputs);
  const reproducible = deepEqual(recomputed, proof.outputs);

  // 3. Validate statutes
  const statutesValid = proof.statuteReferences.every(validateStatute);
  const lawVersionApplicable = isLawVersionApplicable(
    proof.lawVersion,
    proof.timestamp
  );

  const verdict =
    sealValid && reproducible && statutesValid && lawVersionApplicable
      ? 'VALID'
      : 'INVALID';

  return {
    sealValid,
    reproducible,
    recomputedOutputs: recomputed,
    statutesValid,
    lawVersionApplicable,
    verdict,
    issues: collectIssues({
      sealValid,
      reproducible,
      statutesValid,
      lawVersionApplicable,
    }),
  };
}
```

---

## Use Cases

### 1. Regulatory Audit

Inspector: "Show me how you calculated this employee's sick time on March 15, 2024."

```typescript
const proof = await proofStorage.retrieve('PROOF-2024-03-15-EMP123');

console.log(proof.humanReadableSummary.summary);
// "Calculated sick time accrual for employee John Smith..."

console.log('Legal basis:');
proof.statuteReferences.forEach((ref) => {
  console.log(`- ${ref.citation}: ${ref.application}`);
});

console.log('Calculation steps:');
proof.executionTrace.forEach((step) => {
  console.log(`${step.stepNumber}. ${step.justification}`);
});
```

**Outcome:** Complete, auditable trail from inputs to outputs with legal citations.

### 2. Dispute Resolution

Employee: "I think my balance is wrong."

```typescript
const proofs = await proofStorage.query({
  employeeId: 'EMP-123',
  operation: 'CALCULATE_ACCRUAL',
  dateRange: { start: '2024-01-01', end: '2024-12-31' },
});

proofs.forEach((proof) => {
  console.log(`Date: ${proof.timestamp}`);
  console.log(`Hours worked: ${proof.inputs.hoursWorked}`);
  console.log(`Hours accrued: ${proof.outputs.hoursAccrued}`);
  console.log(`Rule applied: ${proof.appliedRules[0].ruleName}`);
  console.log(`Confidence: ${proof.systemConfidence}%`);
  console.log('---');
});
```

**Outcome:** Complete history of all calculations with full transparency.

### 3. Legal Defense

Lawyer: "Prove your system was compliant with Michigan law on this date."

```typescript
const proof = await proofStorage.retrieve('PROOF-DISPUTED');

// Verify proof is intact
const verification = verifyProof(proof);
console.log(`Proof valid: ${verification.verdict}`);

// Show law version used
console.log(`Law version: ${proof.lawVersion}`);
console.log(`Effective date: ${proof.statuteReferences[0].effectiveFrom}`);

// Show exact statute text
proof.statuteReferences.forEach((ref) => {
  console.log(`Citation: ${ref.citation}`);
  console.log(`Text: "${ref.statuteText}"`);
  console.log(`Source: ${ref.officialLink}`);
});
```

**Outcome:** Cryptographically verified, legally grounded defense.

---

## Storage Strategy

### Immutable Storage

```typescript
// Proofs are append-only, never modified
interface ProofRepository {
  append(proof: ProofObject): Promise<ProofId>;
  // No update() or delete() - immutable
}
```

### Indexing

```typescript
interface ProofIndex {
  byEmployee: Map<EmployeeId, ProofId[]>;
  byDate: BTree<ISODate, ProofId[]>;
  byOperation: Map<KernelOperation, ProofId[]>;
  byLawVersion: Map<SemanticVersion, ProofId[]>;
}
```

### Retention

```typescript
interface RetentionPolicy {
  // Legal requirement: 3 years in Michigan
  minimumRetention: Duration; // 3 years

  // Practical: Keep forever (immutable + cheap storage)
  actualRetention: Duration; // Infinity

  // Archive strategy
  archiveAfter: Duration; // 1 year
  archiveLocation: StorageTier; // 'GLACIER' | 'COLD' | 'HOT'
}
```

---

## Performance Considerations

### Proof Generation Overhead

```typescript
// Target: < 1ms per proof
interface PerformanceTarget {
  maxProofCreationMs: 1;
  maxSealCreationMs: 0.5;
  maxSerializationMs: 0.5;
}
```

### Compression

```typescript
// Proofs compress well (lots of repetitive structure)
interface CompressionStrategy {
  algorithm: 'gzip' | 'brotli';
  level: 6; // Balance speed/size
  expectedRatio: 0.3; // 70% size reduction
}
```

---

## Philosophy

**Proof objects are not logs. Logs are ephemeral. Proofs are eternal.**

A log says "something happened."  
A proof says "here is what happened, why it happened, how to verify it happened, and who to ask if you don't believe it."

This is institutional memory that outlives employees, outlives systems, outlives frameworks.

This is how we preserve truth.

---

## References

- **Kernel Spec**: See `KERNEL_SPEC.md`
- **Time Model**: See `TIME_MODEL.md`
- **Constraints**: See `CONSTRAINTS.md`

---

**Last Updated:** 2026-01-12  
**Authority:** ESTA-Logic Core Team  
**Status:** Canonical Law
