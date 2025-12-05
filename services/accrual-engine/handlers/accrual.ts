/**
 * ESTA-Logic Accrual Engine - Message Handlers
 *
 * Pure function handlers for accrual calculations.
 * All state is passed in via messages - no side effects.
 *
 * @module services/accrual-engine/handlers
 */

import type {
  IPCMessage,
  AccrualCalculateRequest,
  AccrualCalculateResult,
  CarryoverCalculateRequest,
  CarryoverCalculateResult,
  SickTimeBalanceQuery,
  SickTimeBalanceResponse,
} from '../../../kernel/abi/messages';

// ============================================================================
// ESTA 2025 CONSTANTS
// ============================================================================

/** Accrual rate: 1 hour per 30 hours worked */
const ACCRUAL_RATE = 1 / 30;

/** Maximum accrual for small employers (< 10 employees): 40 hours */
const MAX_ACCRUAL_SMALL = 40;

/** Maximum accrual for large employers (>= 10 employees): 72 hours */
const MAX_ACCRUAL_LARGE = 72;

/** Maximum carryover for small employers */
const MAX_CARRYOVER_SMALL = 40;

/** Maximum carryover for large employers */
const MAX_CARRYOVER_LARGE = 72;

// ============================================================================
// HANDLER: Calculate Accrual
// ============================================================================

/**
 * Calculate sick time accrual for a pay period.
 *
 * This is a pure function - given the same inputs, it always produces
 * the same outputs. No external state is accessed.
 */
export function handleAccrualCalculate(
  request: AccrualCalculateRequest
): AccrualCalculateResult {
  const {
    employeeId,
    periodStart,
    periodEnd,
    hoursWorked,
    employerSize,
    existingBalance,
    carryoverFromPreviousYear: _carryover,
  } = request;

  // Determine max based on employer size
  const maxBalance =
    employerSize === 'small' ? MAX_ACCRUAL_SMALL : MAX_ACCRUAL_LARGE;

  // Calculate raw accrual
  const rawAccrual = hoursWorked * ACCRUAL_RATE;

  // Calculate new balance (capped at max)
  const potentialBalance = existingBalance + rawAccrual;
  const newBalance = Math.min(potentialBalance, maxBalance);

  // Calculate applied accrual (may be less than raw if at cap)
  const appliedAccrual = newBalance - existingBalance;

  return {
    employeeId,
    periodStart,
    periodEnd,
    hoursAccrued: appliedAccrual,
    newBalance,
    maxBalance,
    isAtMax: newBalance >= maxBalance,
    calculation: {
      accrualRate: ACCRUAL_RATE,
      hoursWorked,
      rawAccrual,
      appliedAccrual,
    },
  };
}

// ============================================================================
// HANDLER: Calculate Carryover
// ============================================================================

/**
 * Calculate year-end carryover.
 *
 * Per ESTA 2025:
 * - Small employers: Up to 40 hours carry over
 * - Large employers: Up to 72 hours carry over
 */
export function handleCarryoverCalculate(
  request: CarryoverCalculateRequest
): CarryoverCalculateResult {
  const {
    employeeId,
    yearEndBalance,
    employerSize,
    yearEndDate: _yearEndDate,
  } = request;

  // Determine max carryover based on employer size
  const maxCarryover =
    employerSize === 'small' ? MAX_CARRYOVER_SMALL : MAX_CARRYOVER_LARGE;

  // Calculate carryover and forfeited amounts
  const carryoverAmount = Math.min(yearEndBalance, maxCarryover);
  const forfeitedAmount = Math.max(0, yearEndBalance - maxCarryover);

  return {
    employeeId,
    yearEndBalance,
    carryoverAmount,
    forfeitedAmount,
    newYearStartBalance: carryoverAmount,
  };
}

// ============================================================================
// HANDLER: Get Balance
// ============================================================================

/**
 * Get current sick time balance.
 *
 * Note: This handler receives pre-calculated data from the kernel.
 * The accrual engine does not access the database directly.
 */
export function handleBalanceQuery(
  query: SickTimeBalanceQuery,
  data: {
    currentBalance: number;
    usedThisYear: number;
    accruedThisYear: number;
    carryoverFromLastYear: number;
    employerSize: 'small' | 'large';
  }
): SickTimeBalanceResponse {
  const maxAllowed =
    data.employerSize === 'small' ? MAX_ACCRUAL_SMALL : MAX_ACCRUAL_LARGE;

  return {
    employeeId: query.employeeId,
    currentBalance: data.currentBalance,
    usedThisYear: data.usedThisYear,
    accruedThisYear: data.accruedThisYear,
    carryoverFromLastYear: data.carryoverFromLastYear,
    maxAllowed,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    asOfDate: query.asOfDate ?? new Date().toISOString().split('T')[0]!,
  };
}

// ============================================================================
// MESSAGE ROUTER
// ============================================================================

/**
 * Main message handler for the accrual engine.
 *
 * Routes incoming IPC messages to the appropriate handler.
 */
export function handleMessage(message: IPCMessage): IPCMessage {
  const { opcode, payload, metadata } = message;

  let result: unknown;
  let error: string | null = null;

  try {
    switch (opcode) {
      case 'accrual.calculate':
        result = handleAccrualCalculate(payload as AccrualCalculateRequest);
        break;

      case 'accrual.carryover':
        result = handleCarryoverCalculate(payload as CarryoverCalculateRequest);
        break;

      case 'accrual.balance':
        // Balance queries require additional data from the caller
        if (
          !payload ||
          typeof payload !== 'object' ||
          !('query' in payload) ||
          !('data' in payload)
        ) {
          throw new Error('Balance query requires both query and data fields');
        }
        const balancePayload = payload as {
          query: SickTimeBalanceQuery;
          data: Parameters<typeof handleBalanceQuery>[1];
        };
        result = handleBalanceQuery(balancePayload.query, balancePayload.data);
        break;

      default:
        error = `Unknown opcode: ${opcode}`;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Create response message
  return {
    type: 'Response',
    source: 'accrual-engine',
    target: message.source,
    opcode: `${opcode}.response`,
    payload: error ? { error } : result,
    metadata: {
      messageId: `${metadata.messageId}-response`,
      correlationId: metadata.messageId,
      timestamp: new Date().toISOString(),
      priority: 'high',
      schemaVersion: 1,
    },
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export { ACCRUAL_RATE, MAX_ACCRUAL_SMALL, MAX_ACCRUAL_LARGE };
