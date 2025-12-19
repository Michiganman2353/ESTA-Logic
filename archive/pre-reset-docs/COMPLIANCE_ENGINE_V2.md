# ESTA 2025 Compliance Engine v2 Documentation

## Overview

The ESTA 2025 Compliance Engine v2 is a deterministic, ruleset-driven engine designed to ensure complete statutory alignment with Michigan's Employee Earned Sick Time Act (ESTA) 2025. This engine eliminates silent divergences and undocumented assumptions by loading rules from a JSON configuration file.

## Legislative Reference

**Act**: Michigan Employee Earned Sick Time Act (ESTA) 2025  
**Effective Date**: February 21, 2025 (Large employers), October 1, 2025 (Small employers)  
**Primary Sections Referenced**:

- §5(1) - Accrual Rate
- §5(2) - Waiting Period
- §5(3) - Caps
- §5(4) - Carryover
- §5(5) - Small Employer Delay
- §5(6) - Frontloading

---

## Rule Tree Diagram

```
ESTA 2025 Compliance Engine
│
├── Employer Size Determination (Threshold: 10 employees)
│   ├── Large Employer (≥10 employees)
│   │   ├── Effective: Feb 21, 2025
│   │   ├── Accrual: 1 hour per 30 hours worked
│   │   ├── Annual Cap: 72 hours
│   │   ├── Carryover Cap: 72 hours
│   │   └── Paid Time Cap: 72 hours/year
│   │
│   └── Small Employer (<10 employees)
│       ├── Effective: Oct 1, 2025 (DELAYED)
│       ├── Accrual: 40-hour annual grant
│       ├── Annual Cap: 40 hours
│       ├── Carryover Cap: 40 hours
│       ├── Paid Time Cap: 40 hours/year
│       └── Unpaid Time Cap: 32 hours/year
│
├── Waiting Period Rules (Max: 120 days)
│   ├── Employer may require up to 120 calendar days
│   ├── Accrual begins from Day 1 (regardless of waiting period)
│   └── Usage allowed after waiting period completes
│
├── Frontloading Option
│   ├── Large Employer: May frontload 72 hours
│   ├── Small Employer: May frontload 40 hours
│   └── Eliminates need for accrual tracking if frontloaded
│
├── Carryover Rules
│   ├── Unused hours carry over to next year
│   ├── Carryover capped at employer-size-specific limit
│   └── Usage cap applies after carryover
│
└── Record Keeping Requirements
    ├── Retention: 3 years minimum
    └── Required Records:
        ├── hours_worked
        ├── sick_time_accrued
        ├── sick_time_used
        └── sick_time_balance
```

---

## Accrual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCRUAL CALCULATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Check Effective Date  │
                  │ (§5(5) Small Delay)   │
                  └───────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
      │ Not Yet     │  │ Large       │  │ Small       │
      │ Effective   │  │ Employer    │  │ Employer    │
      │ Return 0    │  │ (≥10 emp)   │  │ (<10 emp)   │
      └─────────────┘  └─────────────┘  └─────────────┘
                              │               │
                              ▼               ▼
                  ┌───────────────┐  ┌───────────────┐
                  │ Hourly        │  │ Annual Grant  │
                  │ Accrual       │  │ Method        │
                  │ (1:30 ratio)  │  │ (40 hours)    │
                  └───────────────┘  └───────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Apply Annual Cap      │
                  │ (72 large / 40 small) │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Return Accrual Result │
                  │ with Legislative Ref  │
                  └───────────────────────┘
```

---

## Waiting Period Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   120-DAY WAITING PERIOD FLOW                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Employee Hired        │
                  │ Accrual Starts Day 1  │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Does Employer Enforce │
                  │ Waiting Period?       │
                  └───────────────────────┘
                      │           │
                      ▼           ▼
              ┌──────────┐  ┌──────────────┐
              │ No       │  │ Yes          │
              │ Use from │  │ Wait up to   │
              │ Day 1    │  │ 120 days     │
              └──────────┘  └──────────────┘
                                  │
                                  ▼
                  ┌───────────────────────┐
                  │ Cap at 120 Days Max   │
                  │ (Even if >120 set)    │
                  └───────────────────────┘
                                  │
                                  ▼
                  ┌───────────────────────┐
                  │ Use Allowed After     │
                  │ Waiting Period Ends   │
                  └───────────────────────┘
```

---

## Carryover Validation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                  YEAR-END CARRYOVER VALIDATION                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Calculate Current     │
                  │ Unused Balance        │
                  └───────────────────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Determine Employer    │
                  │ Size (Large/Small)    │
                  └───────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
      │ Balance     │  │ Balance     │  │ Balance     │
      │ < 0         │  │ ≤ Cap       │  │ > Cap       │
      │ ERROR       │  │ Full Carry  │  │ Partial     │
      └─────────────┘  └─────────────┘  └─────────────┘
              │               │               │
              ▼               ▼               ▼
      ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
      │ Validation  │  │ Carryover = │  │ Carryover = │
      │ Failed      │  │ Balance     │  │ Cap         │
      │             │  │ Forfeit = 0 │  │ Forfeit =   │
      │             │  │             │  │ Balance-Cap │
      └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Key Compliance Features

### 1. Configurable Legislative Ruleset

The engine loads all rules from `esta2025-ruleset.json`, which includes:

- **Version tracking** for audit trails
- **Legislative section references** for every rule
- **Effective dates** for phased implementation
- **Employer-type-specific configurations**

### 2. Effective-Date-Driven Policy Engine

The engine automatically applies the correct rules based on:

- **General effective date**: February 21, 2025 (large employers)
- **Small employer delay**: October 1, 2025
- **Automatic rejection** of accrual calculations before effective dates

### 3. Declarative Employer-Size Rules

Rules are clearly separated by employer size:

| Feature           | Large Employer (≥10) | Small Employer (<10) |
| ----------------- | -------------------- | -------------------- |
| Effective Date    | Feb 21, 2025         | Oct 1, 2025          |
| Accrual Method    | 1 hr / 30 hrs worked | 40-hr annual grant   |
| Accrual Cap       | 72 hours             | 40 hours             |
| Carryover Cap     | 72 hours             | 40 hours             |
| Paid Hours/Year   | 72 hours             | 40 hours             |
| Unpaid Hours/Year | 0 hours              | 32 hours             |
| Waiting Period    | Up to 120 days       | Up to 120 days       |

---

## API Reference

### Accrual Calculation

```typescript
import { calculateAccrualV2 } from '@esta-tracker/accrual-engine';

const result = calculateAccrualV2(
  hoursWorked, // Hours worked in period
  employerSize, // 'small' or 'large'
  yearlyAccrued, // Hours already accrued this year
  asOfDate // Date for effective date checking
);

// Returns:
// {
//   accrued: number,           // Hours accrued this period
//   method: 'hourly' | 'annual_grant',
//   cap: number,               // Annual cap
//   remaining: number,         // Hours remaining before cap
//   capped: boolean,           // Whether cap was reached
//   legislativeReference: string  // §5(1), etc.
// }
```

### Carryover Validation

```typescript
import { validateCarryoverV2 } from '@esta-tracker/accrual-engine';

const result = validateCarryoverV2(
  currentBalance, // Unused hours at year-end
  employerSize // 'small' or 'large'
);

// Returns:
// {
//   valid: boolean,
//   carryoverAmount: number,   // Hours that carry over
//   forfeitedAmount: number,   // Hours forfeited (over cap)
//   cap: number,               // Carryover cap
//   errors: string[]
// }
```

### Effective Date Checking

```typescript
import { checkEffectiveDate } from '@esta-tracker/accrual-engine';

const result = checkEffectiveDate(employerSize, asOfDate);

// Returns:
// {
//   isEffective: boolean,
//   effectiveDate: Date,
//   daysUntilEffective: number,
//   reason?: string
// }
```

### Waiting Period Calculation

```typescript
import {
  calculateWaitingPeriodEnd,
  isInWaitingPeriod,
} from '@esta-tracker/accrual-engine';

const endDate = calculateWaitingPeriodEnd(
  hireDate, // Employee's hire date
  waitingDays, // Days employer requires (max 120)
  employerSize // 'small' or 'large'
);

const inWaiting = isInWaitingPeriod(
  hireDate,
  currentDate,
  waitingDays,
  employerSize
);
```

---

## Compliance Drift Prevention

The engine includes automatic drift detection:

```typescript
import { validateRulesetIntegrity } from '@esta-tracker/accrual-engine';

const validation = validateRulesetIntegrity();

// Returns:
// {
//   valid: boolean,
//   errors: string[],    // Critical rule violations
//   warnings: string[]   // Non-critical issues
// }
```

### Validated Rules

- Employer size threshold (must be 10)
- Large employer accrual rate (must be 1:30)
- Large employer caps (must be 72 hours)
- Small employer caps (must be 40 hours)
- Waiting period maximum (must be 120 days)
- Carryover caps (72 large / 40 small)
- Small employer effective date (must be 2025-10-01)
- Tenure-based rates (must be disabled per final law)

---

## Testing Coverage

The compliance engine includes comprehensive tests:

| Category               | Test Count | Coverage                        |
| ---------------------- | ---------- | ------------------------------- |
| Ruleset Loading        | 4          | Version, integrity, references  |
| 1:30 Accrual Rate      | 7          | All accrual scenarios           |
| Small Employer Grant   | 3          | Annual grant method             |
| 120-Day Waiting Period | 7          | All waiting period scenarios    |
| Small Employer Delay   | 7          | Oct 1, 2025 enforcement         |
| Frontloading Parity    | 6          | Frontload vs accrual comparison |
| Carryover Rules        | 8          | All carryover scenarios         |
| Employer Size          | 5          | Size determination              |
| Record Keeping         | 5          | Retention requirements          |
| Legislative References | 6          | Section mapping                 |
| Edge Cases             | 7          | Boundary conditions             |
| Seasonal Workers       | 2          | Special employee types          |
| Compliance Drift       | 6          | Rule change detection           |

**Total: 72 deterministic tests**

---

## Migration Guide

### From v1 to v2

The v2 engine is designed to work alongside v1 functions:

```typescript
// v1 (existing - still works)
import { calculateAccrual } from '@esta-tracker/accrual-engine';

// v2 (new - ruleset-driven)
import { calculateAccrualV2 } from '@esta-tracker/accrual-engine';
```

Key differences:

1. **v2 checks effective dates** - Returns 0 accrual before effective date
2. **v2 includes legislative references** - Every result references ESTA section
3. **v2 validates carryover caps** - Returns detailed validation results
4. **v2 uses JSON ruleset** - Changes require ruleset updates + test verification

---

## Changelog

### v2025.1.0

- Initial release of Compliance Engine v2
- JSON-based ruleset configuration
- Oct 1, 2025 small employer delay implementation
- Carryover cap validation
- 120-day waiting period enforcement
- Frontloading parity checks
- Comprehensive deterministic test suite
- Legislative reference documentation

---

## Support

For compliance questions or issues:

1. Check the `esta2025-ruleset.json` for current rule values
2. Run `validateRulesetIntegrity()` to detect configuration issues
3. Reference ESTA 2025 legislative sections for authoritative guidance

---

_Document Version: 2025.1.0_  
_Last Updated: December 2024_  
_Compliance Engine Version: v2_
