# ESTA-Logic Constraints

**Version:** 1.0.0  
**Status:** Canonical  
**Classification:** Ring 0 - Reality Constraints

---

## Purpose

This document defines the **immutable constraints** that govern ESTA-Logic. These are not validations. They are not checks. They are the laws of physics for this system.

**Core Principle:** Illegal states must be unrepresentable, not caught.

---

## Philosophy: Constraints Over Configuration

### Wrong Approach: Runtime Validation

```typescript
// ❌ BAD: Allows invalid state to temporarily exist
function setSickTimeBalance(employee: Employee, balance: number) {
  if (balance < 0) {
    throw new Error('Balance cannot be negative');
  }
  employee.balance = balance; // Negative value existed momentarily
}
```

**Problem:** Invalid state exists between creation and validation. This creates attack surfaces and logic bugs.

### Correct Approach: Type-Level Constraints

```typescript
// ✅ GOOD: Invalid state cannot be constructed
type NonNegativeBalance = number & { readonly __brand: 'NonNegative' };

function createBalance(value: number): NonNegativeBalance | null {
  if (value < 0) return null;
  return value as NonNegativeBalance;
}

// Compiler prevents this:
const invalid: NonNegativeBalance = -5; // Type error
```

**Benefit:** Invalid state is **impossible**, not **prevented**.

---

## Michigan ESTA Constraints

### 1. Balance Constraints

#### Cannot Be Negative

```typescript
type SickTimeBalance = number & { readonly __brand: 'NonNegative' };

function createSickTimeBalance(hours: number): SickTimeBalance | null {
  if (hours < 0) return null;
  return hours as SickTimeBalance;
}
```

**Invariant:** `balance >= 0` for all time

#### Cannot Exceed Statutory Maximum

```typescript
type SmallEmployerBalance = number & {
  readonly __brand: 'SmallEmployer';
  readonly __max: 40;
};

type LargeEmployerBalance = number & {
  readonly __brand: 'LargeEmployer';
  readonly __max: 72;
};

function createSmallEmployerBalance(
  hours: number
): SmallEmployerBalance | null {
  if (hours < 0 || hours > 40) return null;
  return hours as SmallEmployerBalance;
}
```

**Invariant:**

- Small employers: `0 <= balance <= 40`
- Large employers: `0 <= balance <= 72`

### 2. Accrual Constraints

#### Cannot Accrue Before Employment

```typescript
interface AccrualPeriod {
  startDate: ISODate;
  endDate: ISODate;
  employeeHireDate: ISODate;
}

function isValidAccrualPeriod(period: AccrualPeriod): boolean {
  return period.startDate >= period.employeeHireDate;
}
```

**Invariant:** `accrualStart >= hireDate`

#### Cannot Accrue Beyond Cap

```typescript
function calculateCappedAccrual(
  currentBalance: SickTimeBalance,
  newAccrual: Hours,
  cap: Hours
): SickTimeBalance {
  const uncapped = currentBalance + newAccrual;
  const capped = Math.min(uncapped, cap);
  return capped as SickTimeBalance; // Safe: always <= cap
}
```

**Invariant:** `balance + accrual <= cap` (excess is lost, not stored)

### 3. Usage Constraints

#### Cannot Use More Than Available

```typescript
interface UsageRequest {
  requestedHours: Hours;
  availableBalance: SickTimeBalance;
}

type UsageApproval =
  | { approved: true; deductedHours: Hours }
  | { approved: false; reason: 'INSUFFICIENT_BALANCE' };

function validateUsage(request: UsageRequest): UsageApproval {
  if (request.requestedHours > request.availableBalance) {
    return { approved: false, reason: 'INSUFFICIENT_BALANCE' };
  }
  return { approved: true, deductedHours: request.requestedHours };
}
```

**Invariant:** `usage <= balance`

#### Cannot Use Before Accrual

```typescript
interface Usage {
  usedAt: ISODate;
  accruedAt: ISODate;
}

function isTemporallyValid(usage: Usage): boolean {
  return usage.usedAt >= usage.accruedAt;
}
```

**Invariant:** `usageDate >= accrualDate`

### 4. Employer Size Constraints

#### Must Be Classified

```typescript
enum EmployerSize {
  SMALL = 'SMALL', // < 10 employees
  LARGE = 'LARGE', // >= 10 employees
}

type EmployeeCount = number & { readonly __brand: 'EmployeeCount' };

function classifyEmployer(count: EmployeeCount): EmployerSize {
  return count < 10 ? EmployerSize.SMALL : EmployerSize.LARGE;
}
```

**Invariant:** Every employer has exactly one classification at any time

#### Size Determines Policy

```typescript
interface EmployerPolicy {
  size: EmployerSize;
  maxBalance: Hours;
  annualUsageLimit: Hours;
  carryoverRules: CarryoverPolicy;
}

const POLICIES: Record<EmployerSize, EmployerPolicy> = {
  [EmployerSize.SMALL]: {
    size: EmployerSize.SMALL,
    maxBalance: 40,
    annualUsageLimit: 40,
    carryoverRules: { maxCarryover: 40, resetDate: 'ANNIVERSARY' },
  },
  [EmployerSize.LARGE]: {
    size: EmployerSize.LARGE,
    maxBalance: 72,
    annualUsageLimit: 72,
    carryoverRules: { maxCarryover: 72, resetDate: 'ANNIVERSARY' },
  },
};
```

**Invariant:** Policy is deterministic function of size

### 5. Carryover Constraints

#### Cannot Carry Over More Than Balance

```typescript
interface CarryoverCalculation {
  currentBalance: SickTimeBalance;
  maxCarryover: Hours;
}

function calculateCarryover(calc: CarryoverCalculation): Hours {
  return Math.min(calc.currentBalance, calc.maxCarryover);
}
```

**Invariant:** `carryover <= min(balance, maxCarryover)`

#### Carryover Creates New Balance

```typescript
interface YearTransition {
  previousYearBalance: SickTimeBalance;
  carryover: Hours;
  newYearStart: ISODate;
}

function createNewYearBalance(transition: YearTransition): SickTimeBalance {
  // Previous year balance is irrelevant (except for carryover)
  // New year starts with only carried-over hours
  return transition.carryover as SickTimeBalance;
}
```

**Invariant:** `newYearBalance = carryover` (not cumulative)

### 6. Time Constraints

#### Dates Must Be Valid

```typescript
type ISODate = string & { readonly __brand: 'ISODate' };

function createISODate(dateString: string): ISODate | null {
  const parsed = new Date(dateString);
  if (isNaN(parsed.getTime())) return null;
  return dateString as ISODate;
}
```

**Invariant:** All dates are valid ISO 8601 strings

#### Future Dates Forbidden for Facts

```typescript
function validateFactDate(factDate: ISODate, systemTime: ISODate): boolean {
  return factDate <= systemTime;
}
```

**Invariant:** `factDate <= now` (cannot record future facts)

### 7. Law Version Constraints

#### Must Reference Valid Version

```typescript
interface LawVersion {
  version: SemanticVersion;
  effectiveDate: ISODate;
  jurisdiction: Jurisdiction;
}

const LAW_REGISTRY: Map<SemanticVersion, LawVersion> = new Map();

function getLawVersion(version: SemanticVersion): LawVersion | null {
  return LAW_REGISTRY.get(version) ?? null;
}
```

**Invariant:** All referenced law versions must exist in registry

#### Calculation Must Use Appropriate Version

```typescript
function getApplicableLaw(
  calculationDate: ISODate,
  jurisdiction: Jurisdiction
): LawVersion {
  // Find law version effective on that date
  const versions = Array.from(LAW_REGISTRY.values())
    .filter((v) => v.jurisdiction === jurisdiction)
    .filter((v) => v.effectiveDate <= calculationDate)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  return versions[0]; // Most recent version before calculation date
}
```

**Invariant:** `lawVersion.effectiveDate <= calculationDate`

---

## Impossible States

These states **cannot be represented** in the type system:

### 1. Negative Sick Time

```typescript
// This will not compile:
const balance: SickTimeBalance = -5;
```

### 2. Balance Above Cap

```typescript
// This will not compile:
const balance: SmallEmployerBalance = 50; // Max is 40
```

### 3. Usage Before Eligibility

```typescript
interface EligibilityAwareUsage {
  employee: Employee;
  usageRequest: UsageRequest;
  eligibilityDate: ISODate;
}

type UsageDecision =
  | { allowed: true; deduction: Hours }
  | { allowed: false; reason: 'NOT_YET_ELIGIBLE' | 'INSUFFICIENT_BALANCE' };
```

### 4. Retroactive Policy Changes

```typescript
interface PolicyChange {
  effectiveDate: ISODate;
  changedAt: ISODate;
  newPolicy: EmployerPolicy;
}

// Constraint: Cannot make policy effective in the past
function validatePolicyChange(change: PolicyChange, now: ISODate): boolean {
  return change.effectiveDate >= now;
}
```

### 5. Fractional Employees

```typescript
type EmployeeCount = number & { readonly __brand: 'EmployeeCount' };

function createEmployeeCount(count: number): EmployeeCount | null {
  if (count < 0 || !Number.isInteger(count)) return null;
  return count as EmployeeCount;
}
```

---

## Constraint Violations

When constraints are violated, the system does not throw exceptions. It returns typed impossibilities:

```typescript
type ConstraintResult<T> =
  | { valid: true; value: T }
  | { valid: false; violations: ConstraintViolation[] };

interface ConstraintViolation {
  constraint: ConstraintId;
  reason: string;
  attemptedValue: unknown;
  legalRange?: { min: number; max: number };
  statute?: StatuteReference;
}
```

### Example: Balance Validation

```typescript
function validateBalance(
  value: number,
  employerSize: EmployerSize
): ConstraintResult<SickTimeBalance> {
  const max = employerSize === EmployerSize.SMALL ? 40 : 72;

  if (value < 0) {
    return {
      valid: false,
      violations: [
        {
          constraint: 'BALANCE_NON_NEGATIVE',
          reason: 'Sick time balance cannot be negative',
          attemptedValue: value,
          legalRange: { min: 0, max },
          statute: { citation: 'Michigan ESTA 2025, Section 3(b)' },
        },
      ],
    };
  }

  if (value > max) {
    return {
      valid: false,
      violations: [
        {
          constraint: 'BALANCE_BELOW_CAP',
          reason: `Balance cannot exceed ${max} hours for ${employerSize} employers`,
          attemptedValue: value,
          legalRange: { min: 0, max },
          statute: { citation: 'Michigan ESTA 2025, Section 3(c)' },
        },
      ],
    };
  }

  return { valid: true, value: value as SickTimeBalance };
}
```

---

## Enforcement Mechanisms

### 1. TypeScript Type System

Primary enforcement through branded types:

```typescript
type Hours = number & { readonly __brand: 'Hours' };
type Days = number & { readonly __brand: 'Days' };

// Compiler prevents:
const hours: Hours = someDays; // Type error
```

### 2. Constructor Functions

All values must be created through validation:

```typescript
// Only way to create a SickTimeBalance
function createBalance(value: number): SickTimeBalance | null;

// Direct assignment forbidden
employee.balance = 50; // Type error - must use constructor
```

### 3. Immutability

Once created, constrained values cannot be modified:

```typescript
interface Employee {
  readonly id: EmployeeId;
  readonly balance: SickTimeBalance; // readonly
}

// This is impossible:
employee.balance = newValue; // Compile error
```

### 4. Kernel Validation

The kernel enforces constraints at execution boundaries:

```typescript
function kernelExecute<T>(
  operation: KernelOperation,
  inputs: unknown
): KernelResult<T> {
  // Validate all constraints before execution
  const validated = validateAllConstraints(inputs);

  if (!validated.valid) {
    return {
      success: false,
      reason: 'CONSTRAINT_VIOLATION',
      violations: validated.violations,
    };
  }

  // Execute with guaranteed-valid inputs
  return executeOperation(operation, validated.value);
}
```

---

## Testing Constraints

### Property-Based Tests

```typescript
test('balance is always non-negative', () => {
  forAll(arbitraryEmployeeState(), (state) => {
    const result = kernel.calculateBalance(state);
    assert(result.balance >= 0);
  });
});

test('balance never exceeds cap', () => {
  forAll(arbitraryEmployeeState(), (state) => {
    const result = kernel.calculateBalance(state);
    const cap = state.employerSize === 'SMALL' ? 40 : 72;
    assert(result.balance <= cap);
  });
});
```

### Boundary Tests

```typescript
test('exactly at cap is allowed', () => {
  const balance = createSmallEmployerBalance(40);
  assert(balance !== null);
});

test('one cent above cap is forbidden', () => {
  const balance = createSmallEmployerBalance(40.01);
  assert(balance === null);
});
```

### Impossible State Tests

```typescript
test('negative balance cannot be constructed', () => {
  const balance = createBalance(-1);
  assert(balance === null);
});

test('future fact date is rejected', () => {
  const futureDate = '2099-12-31';
  const result = validateFactDate(futureDate, '2024-01-01');
  assert(result === false);
});
```

---

## Constraint Catalog

| Constraint ID            | Description           | Statute    |
| ------------------------ | --------------------- | ---------- |
| `BALANCE_NON_NEGATIVE`   | Balance ≥ 0           | ESTA §3(b) |
| `BALANCE_BELOW_CAP`      | Balance ≤ cap         | ESTA §3(c) |
| `ACCRUAL_AFTER_HIRE`     | Accrual ≥ hire date   | ESTA §3(a) |
| `USAGE_BELOW_BALANCE`    | Usage ≤ balance       | ESTA §4(a) |
| `USAGE_AFTER_ACCRUAL`    | Usage ≥ accrual       | ESTA §4(b) |
| `CARRYOVER_BELOW_MAX`    | Carryover ≤ max       | ESTA §5(a) |
| `DATE_IS_VALID`          | Valid ISO 8601        | Technical  |
| `FACT_NOT_FUTURE`        | Fact ≤ now            | Technical  |
| `LAW_VERSION_EXISTS`     | Version in registry   | Technical  |
| `LAW_VERSION_APPLICABLE` | Version ≤ calc date   | Technical  |
| `EMPLOYEE_COUNT_INTEGER` | Count is integer      | Technical  |
| `EMPLOYER_SIZE_VALID`    | Size ∈ {SMALL, LARGE} | ESTA §2    |

---

## Philosophy

**This system works like physics: some things simply cannot happen.**

You cannot have negative mass. You cannot exceed light speed. You cannot have negative sick time.

These are not rules to break. They are the fabric of reality in this domain.

---

## References

- **Kernel Spec**: See `KERNEL_SPEC.md`
- **Time Model**: See `TIME_MODEL.md`
- **Proof Objects**: See `PROOF_OBJECTS.md`

---

**Last Updated:** 2026-01-12  
**Authority:** ESTA-Logic Core Team  
**Status:** Canonical Law
