/**
 * Accrual calculation utilities.
 *
 * This module is the frontend-facing application service for ESTA calculations.
 * It calls the authoritative pure compliance engine directly. There is no
 * kernel boot process, IPC layer, WASM bridge, plugin runtime, or network hop.
 */

import { calculateAccrual } from '@esta-tracker/accrual-engine';

/** Format an hour value for display. */
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
 * Calculate accrued time through the authoritative compliance engine.
 *
 * The existing public async contract is retained so callers do not need to
 * change during the migration. Calculations themselves are synchronous and
 * deterministic.
 */
export async function requestAccrualCalculation(
  minutesWorked: number,
  employerSize: 'small' | 'large'
): Promise<{ accruedMinutes: number; success: boolean; error?: string }> {
  if (!Number.isFinite(minutesWorked) || minutesWorked < 0) {
    return {
      accruedMinutes: 0,
      success: false,
      error: 'Minutes worked must be a non-negative finite number',
    };
  }

  try {
    const hoursWorked = minutesToHours(minutesWorked);
    const result = calculateAccrual(hoursWorked, employerSize, 0);

    return {
      accruedMinutes: hoursToMinutes(result.accrued),
      success: true,
    };
  } catch (error) {
    return {
      accruedMinutes: 0,
      success: false,
      error:
        error instanceof Error ? error.message : 'Accrual calculation failed',
    };
  }
}

/**
 * Validate an employee balance without a runtime orchestration layer.
 *
 * Accrued and used values are already normalized to minutes by the caller.
 * A balance is valid when both values are finite/non-negative and usage does
 * not exceed accrued time.
 */
export async function requestBalanceValidation(
  employeeId: string,
  accruedMinutes: number,
  usedMinutes: number
): Promise<{ valid: boolean; balance: number; errors: string[] }> {
  const errors: string[] = [];

  if (!employeeId.trim()) {
    errors.push('Employee identifier is required');
  }
  if (!Number.isFinite(accruedMinutes) || accruedMinutes < 0) {
    errors.push('Accrued minutes must be a non-negative finite number');
  }
  if (!Number.isFinite(usedMinutes) || usedMinutes < 0) {
    errors.push('Used minutes must be a non-negative finite number');
  }

  const balance = Math.max(0, accruedMinutes - usedMinutes);

  if (errors.length === 0 && usedMinutes > accruedMinutes) {
    errors.push('Used time exceeds accrued time');
  }

  return {
    valid: errors.length === 0,
    balance,
    errors,
  };
}

/** Convert hours to whole minutes for storage and display boundaries. */
export function hoursToMinutes(hours: number): number {
  return Math.round(hours * 60);
}

/** Convert stored minutes to hours. */
export function minutesToHours(minutes: number): number {
  return minutes / 60;
}
