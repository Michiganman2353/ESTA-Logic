/**
 * Accrual Calculation Utilities - KERNEL FACADE
 *
 * ============================================================================
 * MICROKERNEL ARCHITECTURE COMPLIANCE NOTICE
 * ============================================================================
 *
 * This module is a FACADE that delegates all compliance calculations to the
 * kernel. The frontend is an UNTRUSTED CLIENT and must never perform domain
 * logic directly.
 *
 * All accrual calculations are performed by:
 * 1. WASM modules (libs/accrual-engine-wasm) for deterministic computation
 * 2. Kernel orchestration (engine/esta-kernel) for lifecycle management
 * 3. Accrual engine library (libs/accrual-engine) as the authoritative source
 *
 * This file provides UI-friendly wrappers that invoke the kernel service.
 * It does NOT contain business logic - only formatting and kernel invocation.
 *
 * Reference: docs/ENGINEERING_PRINCIPLES.md
 * ============================================================================
 */

import { kernelClient } from '@/services/kernel';

/**
 * Formatting utility - pure presentation logic (allowed in frontend)
 *
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

/**
 * Request accrual calculation from the kernel.
 *
 * This is a kernel invocation - the frontend does NOT compute accruals.
 * The kernel delegates to the WASM accrual module for deterministic calculation.
 *
 * @param minutesWorked - Minutes worked in the period
 * @param employerSize - Size of employer ('small' | 'large')
 * @returns Promise resolving to accrued minutes from kernel
 */
export async function requestAccrualCalculation(
  minutesWorked: number,
  employerSize: 'small' | 'large'
): Promise<{ accruedMinutes: number; success: boolean; error?: string }> {
  try {
    const response = await kernelClient.calculateAccrual(
      minutesWorked,
      employerSize
    );

    if (response.success && response.data) {
      return {
        accruedMinutes: response.data.accrued_minutes,
        success: true,
      };
    }

    return {
      accruedMinutes: 0,
      success: false,
      error: response.error ?? 'Unknown error',
    };
  } catch (error) {
    return {
      accruedMinutes: 0,
      success: false,
      error:
        error instanceof Error ? error.message : 'Kernel invocation failed',
    };
  }
}

/**
 * Request balance validation from the kernel.
 *
 * This is a kernel invocation - the frontend does NOT validate balances.
 *
 * @param employeeId - Employee identifier
 * @param accruedMinutes - Total accrued minutes
 * @param usedMinutes - Total used minutes
 * @returns Promise resolving to validation result from kernel
 */
export async function requestBalanceValidation(
  employeeId: string,
  accruedMinutes: number,
  usedMinutes: number
): Promise<{ valid: boolean; balance: number; errors: string[] }> {
  try {
    const response = await kernelClient.validateAccrual(
      employeeId,
      accruedMinutes,
      usedMinutes
    );

    if (response.success && response.data) {
      return {
        valid: response.data.valid,
        balance: response.data.balance,
        errors: response.data.validation_errors ?? [],
      };
    }

    return {
      valid: false,
      balance: 0,
      errors: [response.error ?? 'Validation failed'],
    };
  } catch (error) {
    return {
      valid: false,
      balance: 0,
      errors: [
        error instanceof Error ? error.message : 'Kernel invocation failed',
      ],
    };
  }
}

/**
 * Convert hours to minutes for kernel communication.
 * The kernel operates on minutes for precision.
 *
 * @param hours - Hours value
 * @returns Minutes value
 */
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

/**
 * Convert minutes to hours for UI display.
 *
 * @param minutes - Minutes value
 * @returns Hours value
 */
export function minutesToHours(minutes: number): number {
  return minutes / 60;
}

// ============================================================================
// DEPRECATED FUNCTIONS - DO NOT USE
// These are retained for backwards compatibility during migration.
// All new code MUST use kernel invocation methods above.
// ============================================================================

/**
 * @deprecated Use requestAccrualCalculation() instead.
 * This function performs client-side calculation which violates the
 * microkernel architecture. It will be removed in a future release.
 *
 * WARNING: Returns 0 to force migration to kernel invocation.
 * If you see 0 accrual values, this is intentional - migrate to
 * requestAccrualCalculation() which invokes the kernel.
 */
export function calculateAccrualForHours(
  _hoursWorked: number,
  _employerSize: 'small' | 'large'
): number {
  console.warn(
    '[DEPRECATED] calculateAccrualForHours() performs client-side calculation. ' +
      'Use requestAccrualCalculation() to invoke the kernel instead. ' +
      'Returning 0 to force migration.'
  );
  // Return 0 to force migration to kernel invocation
  // This is intentional - callers must migrate to requestAccrualCalculation()
  return 0;
}

/**
 * @deprecated Business logic must not exist in frontend.
 * Use kernel APIs to retrieve compliance rules.
 */
export function getMaxAccrualForEmployerSize(
  _employerSize: 'small' | 'large'
): never {
  throw new Error(
    '[ARCHITECTURE VIOLATION] getMaxAccrualForEmployerSize() contains business logic. ' +
      'Compliance rules must be retrieved from the kernel, not computed in the frontend.'
  );
}

/**
 * @deprecated Business logic must not exist in frontend.
 * Use kernel APIs to calculate carryover.
 */
export function calculateCarryover(
  _currentBalance: number,
  _employerSize: 'small' | 'large'
): never {
  throw new Error(
    '[ARCHITECTURE VIOLATION] calculateCarryover() contains business logic. ' +
      'Carryover calculations must be performed by the kernel/WASM module.'
  );
}

/**
 * @deprecated Business logic must not exist in frontend.
 * Use kernel APIs to calculate available hours.
 */
export function calculateAvailableHours(
  _yearlyAccrued: number,
  _paidHoursUsed: number,
  _unpaidHoursUsed: number,
  _carryoverHours: number,
  _employerSize: 'small' | 'large'
): never {
  throw new Error(
    '[ARCHITECTURE VIOLATION] calculateAvailableHours() contains business logic. ' +
      'Balance calculations must be performed by the kernel/WASM module.'
  );
}

/**
 * @deprecated Business logic must not exist in frontend.
 * Use kernel APIs for usage limit validation.
 */
export function isWithinUsageLimit(
  _requestedHours: number,
  _availablePaid: number,
  _availableUnpaid: number,
  _isPaid: boolean
): never {
  throw new Error(
    '[ARCHITECTURE VIOLATION] isWithinUsageLimit() contains business logic. ' +
      'Usage validation must be performed by the kernel/WASM module.'
  );
}

/**
 * @deprecated Business logic must not exist in frontend.
 * Use kernel APIs to calculate hours needed.
 */
export function calculateHoursNeededForAccrual(
  _targetAccrualHours: number,
  _employerSize: 'small' | 'large'
): never {
  throw new Error(
    '[ARCHITECTURE VIOLATION] calculateHoursNeededForAccrual() contains business logic. ' +
      'Accrual calculations must be performed by the kernel/WASM module.'
  );
}
