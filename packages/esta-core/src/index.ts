/**
 * ESTA Core - Pure business logic for Michigan ESTA compliance calculations
 *
 * This package contains core accrual and computation logic that is
 * independent of any storage or framework dependencies.
 */

// Accrual rate: 1 hour per 30 hours worked (Michigan ESTA)
export const HOURS_TO_ACCRUE_PER_HOUR = 1 / 30; // ~0.0333333333

// Michigan ESTA permits employers to limit *annual use* to these amounts;
// employees can accrue more than they are permitted to use in a given year.
export const MAX_ANNUAL_USE_SMALL_EMPLOYER = 40;
export const MAX_ANNUAL_USE_LARGE_EMPLOYER = 72;

/** @deprecated The historical name is misleading; use MAX_ANNUAL_USE_SMALL_EMPLOYER. */
export const MAX_ACCRUAL_SMALL_EMPLOYER = MAX_ANNUAL_USE_SMALL_EMPLOYER;
/** @deprecated The historical name is misleading; use MAX_ANNUAL_USE_LARGE_EMPLOYER. */
export const MAX_ACCRUAL_LARGE_EMPLOYER = MAX_ANNUAL_USE_LARGE_EMPLOYER;

/**
 * Calculate accrued sick time hours based on hours worked.
 *
 * Michigan ESTA mandates 1 hour of earned sick time per 30 hours worked.
 *
 * @param hoursWorked - Total hours worked in the accrual period
 * @returns Accrued sick time hours (to 6 decimal places)
 * @throws Error if hoursWorked is not a non-negative finite number
 */
export function calculateAccruedHours(hoursWorked: number): number {
  if (!Number.isFinite(hoursWorked) || hoursWorked < 0) {
    throw new Error('hoursWorked must be a non-negative finite number');
  }
  return +(hoursWorked * HOURS_TO_ACCRUE_PER_HOUR).toFixed(6);
}

/**
 * @deprecated Historical API name was legally inaccurate: annual 40/72 hour
 * limits are USE limits, not accrual caps. This compatibility method now
 * returns the full accrual; new callers should use calculateAccruedHours.
 */
export function calculateCappedAccrual(
  hoursWorked: number,
  employeeCount: number
): number {
  validateEmployeeCount(employeeCount);
  return calculateAccruedHours(hoursWorked);
}

/** Validates the employer-size input, not historical 20-week classification. */
function validateEmployeeCount(employeeCount: number): void {
  if (!Number.isSafeInteger(employeeCount) || employeeCount < 1) {
    throw new Error('employeeCount must be a positive integer');
  }
}

/**
 * Maximum annual earned-sick-time USE an employer may choose to allow.
 * Employer classification and any higher employer policy must be determined
 * separately, including the statutory employee-count history.
 */
export function calculateAnnualUseLimit(employeeCount: number): number {
  validateEmployeeCount(employeeCount);
  return employeeCount <= 10
    ? MAX_ANNUAL_USE_SMALL_EMPLOYER
    : MAX_ANNUAL_USE_LARGE_EMPLOYER;
}

/**
 * Maximum hours currently usable under the default annual use limit,
 * BEFORE eligibility, waiting periods, employer higher-limit policy,
 * accrual carryover, and other statutory details are considered.
 *
 * `availableBank` means unused accrued/frontloaded hours already in the
 * current bank. `usedThisYear` means hours used in the benefit year.
 */
export function calculateAvailableForUse(
  availableBank: number,
  usedThisYear: number,
  employeeCount: number
): number {
  if (!Number.isFinite(availableBank) || availableBank < 0 ||
      !Number.isFinite(usedThisYear) || usedThisYear < 0) {
    throw new Error('Available and used hours must be non-negative finite numbers');
  }
  const remainingUse = Math.max(0, calculateAnnualUseLimit(employeeCount) - usedThisYear);
  return Math.min(availableBank, remainingUse);
}

/**
 * Calculate remaining sick time balance.
 *
 * @param accrued - Total accrued sick time hours
 * @param used - Total used sick time hours
 * @returns Remaining sick time balance
 * @throws Error if inputs are invalid
 */
export function calculateBalance(accrued: number, used: number): number {
  if (!Number.isFinite(accrued) || accrued < 0) {
    throw new Error('accrued must be a non-negative finite number');
  }
  if (!Number.isFinite(used) || used < 0) {
    throw new Error('used must be a non-negative finite number');
  }
  return Math.max(0, accrued - used);
}
