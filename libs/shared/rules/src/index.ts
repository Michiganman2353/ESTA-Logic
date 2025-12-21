/**
 * Centralized Business Rules and Decision Schemas
 *
 * Single source of truth for ESTA compliance rules, employer size thresholds,
 * accrual rates, and other business decision logic.
 *
 * This module provides configuration values derived from Michigan's Earned Sick Time Act (ESTA).
 * Effective February 21, 2025, these regulations require Michigan employers to provide paid sick time.
 *
 * Note: These values reflect the law as enacted. If amended, this module should be updated accordingly.
 *
 * It does NOT perform calculations - those are delegated to the kernel/WASM modules.
 */

/**
 * Employer size categories for ESTA compliance
 */
export type EmployerSize = 'small' | 'large';

/**
 * ESTA 2025 compliance thresholds
 */
export const ESTA_THRESHOLDS = {
  /**
   * Employee count threshold that determines employer size category.
   * Under 50 = small employer
   * 50 or more = large employer
   */
  LARGE_EMPLOYER_THRESHOLD: 50,

  /**
   * Accrual rate for large employers (hours of sick time per hours worked)
   * Michigan ESTA: 1 hour per 30 hours worked
   */
  ACCRUAL_RATE_HOURS: 30,

  /**
   * Maximum accrual for small employers (hours per year)
   */
  SMALL_EMPLOYER_MAX_ACCRUAL: 40,

  /**
   * Maximum accrual for large employers (hours per year)
   */
  LARGE_EMPLOYER_MAX_ACCRUAL: 72,

  /**
   * Maximum usage for small employers (hours per year)
   */
  SMALL_EMPLOYER_MAX_USAGE: 40,

  /**
   * Maximum usage for large employers (hours per year)
   */
  LARGE_EMPLOYER_MAX_USAGE: 72,

  /**
   * Maximum carryover for small employers (hours)
   */
  SMALL_EMPLOYER_MAX_CARRYOVER: 40,

  /**
   * Maximum carryover for large employers (hours)
   */
  LARGE_EMPLOYER_MAX_CARRYOVER: 72,
} as const;

/**
 * Retention periods in years based on ESTA 2025 requirements
 */
export const RETENTION_PERIODS = {
  APPROVED: 7,
  DENIED: 5,
  WITHDRAWN: 3,
  CANCELLED: 3,
  PAYMENT: 7,
  AUDIT_LOG: 7,
  COMMUNICATION: 5,
  EMPLOYEE_RECORD: 7,
  EMPLOYER_RECORD: 7,
  POLICY_VERSION: 10,
  COMPLIANCE_REPORT: 7,
  GOVERNMENT_REQUEST: 10,
} as const;

/**
 * Determine employer size based on employee count
 */
export function getEmployerSize(employeeCount: number): EmployerSize {
  return employeeCount >= ESTA_THRESHOLDS.LARGE_EMPLOYER_THRESHOLD
    ? 'large'
    : 'small';
}

/**
 * Get maximum accrual hours for employer size
 */
export function getMaxAccrual(employerSize: EmployerSize): number {
  return employerSize === 'large'
    ? ESTA_THRESHOLDS.LARGE_EMPLOYER_MAX_ACCRUAL
    : ESTA_THRESHOLDS.SMALL_EMPLOYER_MAX_ACCRUAL;
}

/**
 * Get maximum usage hours for employer size
 */
export function getMaxUsage(employerSize: EmployerSize): number {
  return employerSize === 'large'
    ? ESTA_THRESHOLDS.LARGE_EMPLOYER_MAX_USAGE
    : ESTA_THRESHOLDS.SMALL_EMPLOYER_MAX_USAGE;
}

/**
 * Get maximum carryover hours for employer size
 */
export function getMaxCarryover(employerSize: EmployerSize): number {
  return employerSize === 'large'
    ? ESTA_THRESHOLDS.LARGE_EMPLOYER_MAX_CARRYOVER
    : ESTA_THRESHOLDS.SMALL_EMPLOYER_MAX_CARRYOVER;
}

/**
 * Decision schema for sick time request approval
 */
export interface SickTimeDecisionSchema {
  requestId: string;
  employeeId: string;
  employerSize: EmployerSize;
  requestedHours: number;
  availableBalance: number;
  decision: 'approved' | 'denied' | 'pending';
  reason: string;
  timestamp: Date;
  decidedBy?: string;
}

/**
 * Create a decision record for sick time request
 */
export function createSickTimeDecision(params: {
  requestId: string;
  employeeId: string;
  employerSize: EmployerSize;
  requestedHours: number;
  availableBalance: number;
  decidedBy?: string;
}): SickTimeDecisionSchema {
  const canApprove = params.requestedHours <= params.availableBalance;
  const maxUsage = getMaxUsage(params.employerSize);

  let decision: 'approved' | 'denied' = 'approved';
  let reason = 'Request approved - sufficient balance available';

  if (!canApprove) {
    decision = 'denied';
    reason = `Insufficient balance. Requested: ${params.requestedHours} hours, Available: ${params.availableBalance} hours`;
  } else if (params.requestedHours > maxUsage) {
    decision = 'denied';
    reason = `Request exceeds maximum usage limit of ${maxUsage} hours for ${params.employerSize} employer`;
  }

  return {
    requestId: params.requestId,
    employeeId: params.employeeId,
    employerSize: params.employerSize,
    requestedHours: params.requestedHours,
    availableBalance: params.availableBalance,
    decision,
    reason,
    timestamp: new Date(),
    decidedBy: params.decidedBy,
  };
}

/**
 * Policy type definitions
 */
export type PolicyType =
  | 'ACCRUAL'
  | 'RETENTION'
  | 'ACCESS'
  | 'SECURITY'
  | 'NOTIFICATION';

/**
 * Application status types
 */
export type ApplicationStatus =
  | 'pending'
  | 'approved'
  | 'denied'
  | 'withdrawn'
  | 'cancelled';

/**
 * Get retention period based on application status
 */
export function getRetentionPeriodForStatus(status: ApplicationStatus): number {
  switch (status) {
    case 'approved':
      return RETENTION_PERIODS.APPROVED;
    case 'denied':
      return RETENTION_PERIODS.DENIED;
    case 'withdrawn':
      return RETENTION_PERIODS.WITHDRAWN;
    case 'cancelled':
      return RETENTION_PERIODS.CANCELLED;
    case 'pending':
      return RETENTION_PERIODS.APPROVED; // Default to longest until finalized
    default:
      return RETENTION_PERIODS.APPROVED;
  }
}

/**
 * Accrual policy configuration
 */
export interface AccrualPolicyConfig {
  employerSize: EmployerSize;
  accrualRate: number; // Hours worked per hour accrued
  maxAccrual: number;
  maxUsage: number;
  maxCarryover: number;
  isAnnualGrant: boolean; // True for small employers
}

/**
 * Get accrual policy configuration for employer
 */
export function getAccrualPolicy(
  employerSize: EmployerSize
): AccrualPolicyConfig {
  return {
    employerSize,
    accrualRate: ESTA_THRESHOLDS.ACCRUAL_RATE_HOURS,
    maxAccrual: getMaxAccrual(employerSize),
    maxUsage: getMaxUsage(employerSize),
    maxCarryover: getMaxCarryover(employerSize),
    isAnnualGrant: employerSize === 'small',
  };
}
