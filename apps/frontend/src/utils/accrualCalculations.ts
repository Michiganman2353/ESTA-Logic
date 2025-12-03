/**
 * Accrual Calculation Utilities
 *
 * @deprecated This module violates the microkernel architecture.
 * All compliance calculations should be performed by the kernel via WASM modules.
 *
 * ARCHITECTURAL NOTE (2025-12):
 * Per the ESTA-Logic Architecture Enforcement Report, frontend components
 * must not encode compliance logic. The frontend is an "untrusted client"
 * that should request computation from the kernel.
 *
 * MIGRATION PATH:
 * Instead of using these functions directly, use the kernel service:
 *
 * ```typescript
 * import { kernelClient } from '@/services/kernel';
 *
 * // Preferred approach - delegate to kernel
 * const result = await kernelClient.calculateAccrual(hoursWorked, employerSize);
 * ```
 *
 * These functions are retained temporarily for backward compatibility
 * but will be removed in a future release. All new code should use
 * the kernel service.
 *
 * See: docs/ARCHITECTURE_ENFORCEMENT_REPORT.md
 * See: docs/architecture/MICROKERNEL_STATUS.md
 *
 * Michigan ESTA Rules (for reference only - logic lives in WASM):
 * - Large employers (≥10 employees): 1 hour per 30 hours worked, up to 72 hours/year
 * - Small employers (<10 employees): 40 hours annually (paid) + 32 hours (unpaid)
 * - Accrual begins at start of employment
 * - Unused hours carry over to next year (subject to caps)
 */

import { ComplianceRules } from '@/types';

/**
 * Calculate sick time accrual based on hours worked
 *
 * @deprecated Use kernelClient.calculateAccrual() instead.
 * This function violates the microkernel architecture by computing
 * compliance logic in the frontend.
 *
 * @param hoursWorked - Number of hours worked in the period
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Number of sick time hours accrued
 */
export function calculateAccrualForHours(
  hoursWorked: number,
  employerSize: 'small' | 'large'
): number {
  if (employerSize === 'large') {
    // Large employers: 1 hour per 30 hours worked
    return hoursWorked / 30;
  } else {
    // Small employers accrue annually, not per-period
    // This would typically be granted at year start
    return 0;
  }
}

/**
 * Get maximum accrual limits for employer size
 *
 * @deprecated Use kernel service for compliance rules.
 * This function violates the microkernel architecture.
 *
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns ComplianceRules object with limits
 */
export function getMaxAccrualForEmployerSize(
  employerSize: 'small' | 'large'
): ComplianceRules {
  if (employerSize === 'large') {
    return {
      employerSize: 'large',
      accrualRate: 1 / 30,
      maxPaidHoursPerYear: 72,
      maxUnpaidHoursPerYear: 0,
      carryoverCap: 72,
      auditRetentionYears: 3,
    };
  } else {
    return {
      employerSize: 'small',
      accrualRate: 0, // Annual grant, not per-hour accrual
      maxPaidHoursPerYear: 40,
      maxUnpaidHoursPerYear: 32,
      carryoverCap: 40,
      auditRetentionYears: 3,
    };
  }
}

/**
 * Calculate carryover hours to next year
 *
 * @deprecated Use kernel service for carryover calculation.
 * This function violates the microkernel architecture.
 *
 * @param currentBalance - Current unused sick time balance
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Hours that will carry over to next year
 */
export function calculateCarryover(
  currentBalance: number,
  employerSize: 'small' | 'large'
): number {
  const rules = getMaxAccrualForEmployerSize(employerSize);
  return Math.min(currentBalance, rules.carryoverCap);
}

/**
 * Calculate available sick time hours
 *
 * @deprecated Use kernel service for balance calculation.
 * This function violates the microkernel architecture.
 *
 * @param yearlyAccrued - Hours accrued this year
 * @param paidHoursUsed - Paid hours used this year
 * @param unpaidHoursUsed - Unpaid hours used this year (small employers only)
 * @param carryoverHours - Hours carried over from previous year
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Object with available paid and unpaid hours
 */
export function calculateAvailableHours(
  yearlyAccrued: number,
  paidHoursUsed: number,
  unpaidHoursUsed: number,
  carryoverHours: number,
  employerSize: 'small' | 'large'
): { availablePaid: number; availableUnpaid: number } {
  const rules = getMaxAccrualForEmployerSize(employerSize);

  const totalAccrued = yearlyAccrued + carryoverHours;
  const cappedAccrued = Math.min(totalAccrued, rules.maxPaidHoursPerYear);
  const availablePaid = Math.max(0, cappedAccrued - paidHoursUsed);

  if (employerSize === 'small') {
    const availableUnpaid = Math.max(
      0,
      rules.maxUnpaidHoursPerYear - unpaidHoursUsed
    );
    return { availablePaid, availableUnpaid };
  }

  return { availablePaid, availableUnpaid: 0 };
}

/**
 * Check if a usage request is within allowed limits
 *
 * @deprecated Use kernel service for usage validation.
 * This function violates the microkernel architecture.
 *
 * @param requestedHours - Hours requested for sick time use
 * @param availablePaid - Available paid sick time hours
 * @param availableUnpaid - Available unpaid sick time hours (small employers only)
 * @param isPaid - Whether the request is for paid sick time
 * @returns Boolean indicating if request is valid
 */
export function isWithinUsageLimit(
  requestedHours: number,
  availablePaid: number,
  availableUnpaid: number,
  isPaid: boolean
): boolean {
  if (isPaid) {
    return requestedHours <= availablePaid;
  } else {
    return requestedHours <= availableUnpaid;
  }
}

/**
 * Calculate total hours worked required to accrue target hours
 *
 * @deprecated Use kernel service for accrual projections.
 * This function violates the microkernel architecture.
 *
 * @param targetAccrualHours - Desired sick time hours to accrue
 * @param employerSize - Size of employer ('small' or 'large')
 * @returns Number of hours that need to be worked
 */
export function calculateHoursNeededForAccrual(
  targetAccrualHours: number,
  employerSize: 'small' | 'large'
): number {
  if (employerSize === 'large') {
    // 30 hours worked = 1 hour accrued
    return targetAccrualHours * 30;
  } else {
    // Small employers grant annually, not based on hours worked
    return 0;
  }
}

/**
 * Format hours as human-readable string
 * @param hours - Number of hours
 * @param showDecimals - Whether to show decimal places
 * @returns Formatted string (e.g., "8 hours", "8.5 hours")
 */
export function formatHours(
  hours: number,
  showDecimals: boolean = true
): string {
  const formatted = showDecimals
    ? hours.toFixed(1)
    : Math.round(hours).toString();
  return `${formatted} ${hours === 1 ? 'hour' : 'hours'}`;
}
