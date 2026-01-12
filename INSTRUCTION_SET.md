# ESTA-Logic Instruction Set

**Version:** 1.0.0  
**Status:** Canonical  
**Classification:** Ring 0 - Kernel ISA  
**Authority:** ESTA-Logic Core Team

---

## Purpose

This document defines the **ESTA Instruction Set Architecture (ESTA-ISA)**: the complete set of primitive operations that constitute the kernel's computational model.

Just as x86 or ARM define hardware instruction sets, ESTA-ISA defines the **domain instruction set** for legal compliance computation.

---

## Philosophy

**Laws are not executed. Laws are instructions.**

Every legal requirement becomes a primitive operation. Every compliance calculation is a sequence of instructions. Every domain becomes an instruction module.

---

## Instruction Set Architecture

### ISA Classification

```
ESTA-ISA v1.0 (Ring 0)
├─ Arithmetic Instructions    (12 ops)
├─ Temporal Instructions       (8 ops)
├─ Validation Instructions     (10 ops)
├─ Transformation Instructions (6 ops)
├─ Aggregation Instructions    (5 ops)
└─ Proof Instructions          (7 ops)

Total: 48 primitive instructions
```

---

## Instruction Categories

### 1. Arithmetic Instructions

**Purpose:** Basic mathematical operations on domain values

| Opcode | Name | Signature | Description |
|--------|------|-----------|-------------|
| `ADD` | Add Hours | `(Hours, Hours) → Hours` | Add two hour values |
| `SUB` | Subtract Hours | `(Hours, Hours) → Hours \| Null` | Subtract hours (null if negative) |
| `MUL` | Multiply Rate | `(Hours, Rate) → Hours` | Multiply hours by accrual rate |
| `DIV` | Divide Hours | `(Hours, Divisor) → Hours` | Divide hours by divisor |
| `MIN` | Minimum Hours | `(Hours, Hours) → Hours` | Return minimum of two values |
| `MAX` | Maximum Hours | `(Hours, Hours) → Hours` | Return maximum of two values |
| `CAP` | Cap Value | `(Hours, Cap) → Hours` | Enforce maximum cap |
| `FLOOR` | Floor Value | `(Hours) → Hours` | Round down to integer |
| `CEIL` | Ceiling Value | `(Hours) → Hours` | Round up to integer |
| `ROUND` | Round Value | `(Hours, Precision) → Hours` | Round to precision |
| `ABS` | Absolute Value | `(Hours) → Hours` | Absolute value |
| `NEG` | Negate Value | `(Hours) → Hours` | Negate (for adjustments) |

**Example:**

```typescript
// Accrual calculation: (hours_worked / 30) capped at max
const accrual = CAP(DIV(hoursWorked, 30), maximumBalance);
```

### 2. Temporal Instructions

**Purpose:** Time-based calculations and comparisons

| Opcode | Name | Signature | Description |
|--------|------|-----------|-------------|
| `DATE_DIFF` | Date Difference | `(Date, Date) → Days` | Days between dates |
| `DATE_ADD` | Add Days | `(Date, Days) → Date` | Add days to date |
| `DATE_CMP` | Compare Dates | `(Date, Date) → Ordering` | Compare two dates |
| `DATE_IN_RANGE` | Date In Range | `(Date, DateRange) → Bool` | Check if date in range |
| `YEAR_START` | Year Start | `(Date) → Date` | First day of year |
| `YEAR_END` | Year End | `(Date) → Date` | Last day of year |
| `EFFECTIVE_LAW` | Effective Law | `(Date, Jurisdiction) → LawVersion` | Get law version for date |
| `TIME_ELAPSED` | Time Elapsed | `(Date, Date) → Duration` | Duration between timestamps |

**Example:**

```typescript
// Check if employee is eligible (90 days since hire)
const daysEmployed = DATE_DIFF(currentDate, hireDate);
const isEligible = daysEmployed >= 90;
```

### 3. Validation Instructions

**Purpose:** Constraint checking and invariant enforcement

| Opcode | Name | Signature | Description |
|--------|------|-----------|-------------|
| `CHK_NON_NEG` | Check Non-Negative | `(Hours) → Result<Hours>` | Validate non-negative |
| `CHK_RANGE` | Check Range | `(Hours, Min, Max) → Result<Hours>` | Validate within range |
| `CHK_DATE_VALID` | Check Valid Date | `(String) → Result<Date>` | Validate ISO date |
| `CHK_FUTURE` | Check Not Future | `(Date, Date) → Result<Date>` | Validate not in future |
| `CHK_POLICY` | Check Policy Match | `(Policy, EmployerSize) → Result<Policy>` | Validate policy for size |
| `CHK_BALANCE` | Check Sufficient Balance | `(Hours, Hours) → Result<()>` | Validate sufficient balance |
| `CHK_ELIGIBILITY` | Check Eligibility | `(Employee, Date) → Result<()>` | Validate employee eligible |
| `CHK_STATUTE` | Check Statute Compliance | `(Operation, Statute) → Result<()>` | Validate against statute |
| `CHK_INVARIANT` | Check Invariant | `(State, Invariant) → Result<()>` | Validate state invariant |
| `CHK_CONSTRAINT` | Check Constraint | `(Value, Constraint) → Result<()>` | Validate constraint |

**Example:**

```typescript
// Validate balance is non-negative and below cap
const validated = CHK_RANGE(balance, 0, employerMaxCap);
```

### 4. Transformation Instructions

**Purpose:** Type conversion and data transformation

| Opcode | Name | Signature | Description |
|--------|------|-----------|-------------|
| `CAST_HOURS` | Cast to Hours | `(Number) → Hours \| Null` | Convert number to Hours type |
| `CAST_DATE` | Cast to Date | `(String) → Date \| Null` | Parse ISO date string |
| `CLASSIFY_SIZE` | Classify Size | `(EmployeeCount) → EmployerSize` | Determine employer size |
| `DETERMINE_POLICY` | Determine Policy | `(EmployerSize) → Policy` | Get policy for size |
| `EXTRACT_YEAR` | Extract Year | `(Date) → Year` | Extract year from date |
| `FORMAT_ISO` | Format ISO Date | `(Date) → String` | Format as ISO 8601 |

**Example:**

```typescript
// Determine applicable policy
const size = CLASSIFY_SIZE(employeeCount);
const policy = DETERMINE_POLICY(size);
```

### 5. Aggregation Instructions

**Purpose:** Collection operations and aggregations

| Opcode | Name | Signature | Description |
|--------|------|-----------|-------------|
| `SUM_HOURS` | Sum Hours | `(Hours[]) → Hours` | Sum array of hours |
| `AVG_HOURS` | Average Hours | `(Hours[]) → Hours` | Average of hours |
| `COUNT` | Count Items | `(Array) → Count` | Count array items |
| `FILTER` | Filter Collection | `(Array, Predicate) → Array` | Filter by predicate |
| `MAP` | Map Collection | `(Array, Transform) → Array` | Transform each item |

**Example:**

```typescript
// Calculate total accrued across all employees
const totalAccrued = SUM_HOURS(employees.map(e => e.balance));
```

### 6. Proof Instructions

**Purpose:** Evidence generation and audit trail creation

| Opcode | Name | Signature | Description |
|--------|------|-----------|-------------|
| `PROOF_CREATE` | Create Proof | `(Inputs, Outputs) → Proof` | Generate proof object |
| `PROOF_SIGN` | Sign Proof | `(Proof) → SignedProof` | Cryptographically sign |
| `PROOF_VERIFY` | Verify Proof | `(SignedProof) → Bool` | Verify proof validity |
| `TRACE_ADD` | Add Trace | `(Trace, Step) → Trace` | Add computation step |
| `CITE_STATUTE` | Cite Statute | `(Proof, Statute) → Proof` | Add statute citation |
| `STAMP_TIME` | Timestamp Proof | `(Proof, Time) → Proof` | Add timestamp |
| `SEAL_PROOF` | Seal Proof | `(Proof) → ImmutableProof` | Make proof immutable |

**Example:**

```typescript
// Create auditable proof of calculation
let proof = PROOF_CREATE(inputs, outputs);
proof = CITE_STATUTE(proof, 'ESTA.2025.3(a)');
proof = STAMP_TIME(proof, executionTime);
const sealed = SEAL_PROOF(proof);
```

---

## Instruction Execution Model

### Execution Context

Every instruction executes within an explicit context:

```typescript
interface ExecutionContext {
  timestamp: Timestamp;          // Explicit time
  lawVersion: SemanticVersion;   // Explicit law version
  jurisdiction: Jurisdiction;    // Explicit jurisdiction
  traceEnabled: boolean;         // Enable computation trace
}
```

### Instruction Format

All instructions follow a uniform format:

```typescript
interface Instruction<I, O> {
  opcode: Opcode;
  name: string;
  version: SemanticVersion;
  
  execute: (
    input: I,
    context: ExecutionContext
  ) => Result<O>;
  
  invariants: Invariant[];
  statute: StatuteReference;
  deterministic: true; // All instructions are deterministic
}
```

### Result Type

All instructions return a `Result` type:

```typescript
type Result<T> = 
  | { success: true; value: T; proof: Proof }
  | { success: false; error: Error; proof: Proof };
```

Even failures produce proof objects for audit trails.

---

## Composite Operations

Complex operations are compositions of primitive instructions:

### Example: Calculate Annual Accrual

```typescript
function calculateAnnualAccrual(
  hoursWorked: Hours[],
  accrualRate: Rate,
  cap: Hours
): Hours {
  // SUM_HOURS: Aggregate all hours worked
  const totalHours = SUM_HOURS(hoursWorked);
  
  // MUL: Apply accrual rate
  const uncappedAccrual = MUL(totalHours, accrualRate);
  
  // CAP: Enforce statutory maximum
  const cappedAccrual = CAP(uncappedAccrual, cap);
  
  // CHK_NON_NEG: Validate result
  return CHK_NON_NEG(cappedAccrual);
}
```

### Example: Validate Usage Request

```typescript
function validateUsageRequest(
  request: UsageRequest,
  balance: Hours,
  eligibilityDate: Date,
  currentDate: Date
): Result<UsageApproval> {
  // CHK_ELIGIBILITY: Check employee is eligible
  const eligible = CHK_ELIGIBILITY(
    request.employee,
    currentDate
  );
  if (!eligible.success) return eligible;
  
  // CHK_BALANCE: Check sufficient balance
  const sufficient = CHK_BALANCE(
    request.hoursRequested,
    balance
  );
  if (!sufficient.success) return sufficient;
  
  // CHK_FUTURE: Ensure request is not in past
  const validDate = CHK_FUTURE(
    request.usageDate,
    currentDate
  );
  if (!validDate.success) return validDate;
  
  return ok(createApproval(request));
}
```

---

## Instruction Immutability

All instructions in ESTA-ISA v1.0 are **frozen**:

- ✅ Signatures are immutable
- ✅ Semantics are immutable
- ✅ Opcodes are immutable
- ✅ Invariants are immutable

**Breaking changes are NEVER permitted.**

### Version Management

New instructions can be added in future versions:

```
ESTA-ISA v1.0 → 48 instructions (frozen)
ESTA-ISA v1.1 → 48 + N new instructions (additive only)
ESTA-ISA v2.0 → Breaking changes (requires major version)
```

All historical instructions remain callable with their original semantics.

---

## Domain Extension Model

New legal domains extend the instruction set:

### Michigan ESTA (Current)

```
ESTA-ISA v1.0
└─ Michigan Module
   ├─ ESTA_ACCRUAL_CALC
   ├─ ESTA_CARRYOVER_CALC
   ├─ ESTA_USAGE_VALIDATE
   └─ ESTA_COMPLIANCE_CHECK
```

### Future: California PSL

```
ESTA-ISA v1.1
├─ Michigan Module (unchanged)
└─ California Module (new)
   ├─ CA_PSL_ACCRUAL_CALC
   ├─ CA_PSL_CARRYOVER_CALC
   └─ CA_PSL_USAGE_VALIDATE
```

Each module is self-contained and isolated. No cross-module dependencies.

---

## Instruction Catalog

### Quick Reference

```
Arithmetic (12):    ADD SUB MUL DIV MIN MAX CAP FLOOR CEIL ROUND ABS NEG
Temporal (8):       DATE_DIFF DATE_ADD DATE_CMP DATE_IN_RANGE 
                    YEAR_START YEAR_END EFFECTIVE_LAW TIME_ELAPSED
Validation (10):    CHK_NON_NEG CHK_RANGE CHK_DATE_VALID CHK_FUTURE 
                    CHK_POLICY CHK_BALANCE CHK_ELIGIBILITY CHK_STATUTE 
                    CHK_INVARIANT CHK_CONSTRAINT
Transformation (6): CAST_HOURS CAST_DATE CLASSIFY_SIZE DETERMINE_POLICY 
                    EXTRACT_YEAR FORMAT_ISO
Aggregation (5):    SUM_HOURS AVG_HOURS COUNT FILTER MAP
Proof (7):          PROOF_CREATE PROOF_SIGN PROOF_VERIFY TRACE_ADD 
                    CITE_STATUTE STAMP_TIME SEAL_PROOF
```

---

## Performance Requirements

| Instruction Class | Latency (p99) | Throughput |
|------------------|---------------|------------|
| Arithmetic       | < 1μs         | 10M ops/s  |
| Temporal         | < 5μs         | 1M ops/s   |
| Validation       | < 10μs        | 500K ops/s |
| Transformation   | < 5μs         | 1M ops/s   |
| Aggregation      | < 100μs       | 100K ops/s |
| Proof            | < 50μs        | 200K ops/s |

All instructions must meet these performance targets across all deployment environments.

---

## Canonical Statement

**ESTA-ISA defines the primitive operations of legal computation.**

Every law becomes a sequence of these instructions.  
Every calculation is provably correct by construction.  
Every domain extends the instruction set without breaking existing code.

**This is not a framework.**  
**This is an instruction set architecture.**

---

## References

- **Kernel Specification**: See `KERNEL_SPEC.md`
- **Deployment Invariance**: See `DEPLOYMENT_INVARIANCE.md`
- **Structural Guarantees**: See `STRUCTURAL_GUARANTEES.md`
- **Domain Expansion**: See `DOMAIN_EXPANSION_CONTRACT.md`
- **Constraints**: See `CONSTRAINTS.md`

---

**Last Updated:** 2026-01-12  
**ISA Version:** 1.0.0  
**Stability:** Frozen  
**Breaking Changes:** Never Permitted
