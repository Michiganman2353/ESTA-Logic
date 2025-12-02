/**
 * ESTA 2025 Compliance Engine v2
 *
 * Configurable, ruleset-driven compliance engine for Michigan ESTA 2025.
 * This engine loads rules from a JSON configuration file to ensure
 * deterministic behavior that can be audited and verified.
 *
 * Legislative Reference: Michigan Employee Earned Sick Time Act (ESTA) 2025
 */

import type { EmployerSize } from '@esta/shared-types';
import rulesetData from './esta2025-ruleset.json';

// =====================================================
// TYPES
// =====================================================

/**
 * Accrual method types
 */
export type AccrualMethod = 'hourly' | 'annual_grant';

/**
 * Employer type configuration from ruleset
 */
export interface EmployerTypeConfig {
  minEmployees: number;
  maxEmployees: number | null;
  effectiveDate: string;
  accrual: {
    method: AccrualMethod;
    rate: number;
    denominator: number;
    annualGrant?: number;
    description: string;
  };
  caps: {
    accrualCapPerYear: number;
    usageCapPerYear: number;
    carryoverCap: number;
  };
  paidTime: {
    maxPaidHoursPerYear: number;
    maxUnpaidHoursPerYear: number;
  };
  waitingPeriod: {
    maxDays: number;
    description: string;
  };
}

/**
 * Loaded ruleset configuration
 */
export interface ESTARuleset {
  version: string;
  legislativeReference: {
    act: string;
    year: number;
    effectiveDate: string;
    sections: {
      accrualRate: string;
      waitingPeriod: string;
      caps: string;
      carryover: string;
      smallEmployerDelay: string;
      frontloading: string;
    };
  };
  effectiveDates: {
    generalEffective: string;
    smallEmployerEffective: string;
  };
  employerSizeThreshold: number;
  employerTypes: {
    large: EmployerTypeConfig;
    small: EmployerTypeConfig;
  };
  carryoverRules: {
    allowed: boolean;
    expirationPeriod: number | null;
    usageCapAppliesAfterCarryover: boolean;
    description: string;
  };
  frontloadingRules: {
    allowed: boolean;
    largeEmployer: {
      frontloadAmount: number;
      eliminatesAccrualTracking: boolean;
      description: string;
    };
    smallEmployer: {
      frontloadAmount: number;
      eliminatesAccrualTracking: boolean;
      description: string;
    };
  };
  tenureBasedRates: {
    /** Whether tenure-based rates are enabled */
    enabled: boolean;
    /** Description of tenure-based rate policy */
    description: string;
    /** Historical context or legislative note about why this setting exists */
    legislativeNote: string;
  };
  recordKeepingRequirements: {
    retentionYears: number;
    requiredRecords: string[];
  };
}

/**
 * Result of effective date check
 */
export interface EffectiveDateResult {
  isEffective: boolean;
  effectiveDate: Date;
  daysUntilEffective: number;
  reason?: string;
}

/**
 * Accrual calculation result
 */
export interface AccrualResult {
  accrued: number;
  method: AccrualMethod;
  cap: number;
  remaining: number;
  capped: boolean;
  legislativeReference: string;
}

/**
 * Carryover validation result
 */
export interface CarryoverValidationResult {
  valid: boolean;
  carryoverAmount: number;
  forfeitedAmount: number;
  cap: number;
  errors: string[];
}

// =====================================================
// RULESET LOADING AND VALIDATION
// =====================================================

/**
 * Load and parse the ESTA 2025 ruleset
 */
export function loadRuleset(): ESTARuleset {
  return rulesetData as ESTARuleset;
}

/**
 * Get the current ruleset version
 */
export function getRulesetVersion(): string {
  const ruleset = loadRuleset();
  return ruleset.version;
}

/**
 * Validate ruleset integrity for compliance drift detection
 *
 * @returns Validation result with any discrepancies
 */
export function validateRulesetIntegrity(): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const ruleset = loadRuleset();
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate employer size threshold
  if (ruleset.employerSizeThreshold !== 10) {
    errors.push(
      `Invalid employer size threshold: expected 10, got ${ruleset.employerSizeThreshold}`
    );
  }

  // Validate large employer accrual rate
  const largeAccrual = ruleset.employerTypes.large.accrual;
  if (largeAccrual.rate !== 1 || largeAccrual.denominator !== 30) {
    errors.push(
      `Invalid large employer accrual rate: expected 1:30, got ${largeAccrual.rate}:${largeAccrual.denominator}`
    );
  }

  // Validate large employer caps
  const largeCaps = ruleset.employerTypes.large.caps;
  if (largeCaps.accrualCapPerYear !== 72) {
    errors.push(
      `Invalid large employer accrual cap: expected 72, got ${largeCaps.accrualCapPerYear}`
    );
  }

  // Validate small employer caps
  const smallCaps = ruleset.employerTypes.small.caps;
  if (smallCaps.accrualCapPerYear !== 40) {
    errors.push(
      `Invalid small employer accrual cap: expected 40, got ${smallCaps.accrualCapPerYear}`
    );
  }

  // Validate waiting period
  const waitingPeriod = ruleset.employerTypes.large.waitingPeriod.maxDays;
  if (waitingPeriod !== 120) {
    errors.push(
      `Invalid waiting period: expected 120 days, got ${waitingPeriod}`
    );
  }

  // Validate carryover caps
  if (largeCaps.carryoverCap !== 72) {
    errors.push(
      `Invalid large employer carryover cap: expected 72, got ${largeCaps.carryoverCap}`
    );
  }
  if (smallCaps.carryoverCap !== 40) {
    errors.push(
      `Invalid small employer carryover cap: expected 40, got ${smallCaps.carryoverCap}`
    );
  }

  // Validate small employer effective date
  if (ruleset.effectiveDates.smallEmployerEffective !== '2025-10-01') {
    errors.push(
      `Invalid small employer effective date: expected 2025-10-01, got ${ruleset.effectiveDates.smallEmployerEffective}`
    );
  }

  // Check for tenure-based rates (should be disabled per final law)
  if (ruleset.tenureBasedRates.enabled) {
    warnings.push(
      'Tenure-based rates are enabled but were removed from final ESTA 2025 law'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// =====================================================
// EFFECTIVE DATE ENGINE
// =====================================================

/**
 * Check if ESTA rules are effective for a given employer type and date
 *
 * @param employerSize - Size of employer ('small' or 'large')
 * @param asOfDate - Date to check effectiveness
 * @returns Effective date check result
 */
export function checkEffectiveDate(
  employerSize: EmployerSize,
  asOfDate: Date = new Date()
): EffectiveDateResult {
  const ruleset = loadRuleset();
  const effectiveDateStr =
    employerSize === 'small'
      ? ruleset.effectiveDates.smallEmployerEffective
      : ruleset.effectiveDates.generalEffective;

  const effectiveDate = new Date(effectiveDateStr);
  const daysUntilEffective = Math.ceil(
    (effectiveDate.getTime() - asOfDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isEffective = asOfDate >= effectiveDate;

  return {
    isEffective,
    effectiveDate,
    daysUntilEffective: Math.max(0, daysUntilEffective),
    reason: isEffective
      ? undefined
      : `ESTA not yet effective for ${employerSize} employers until ${effectiveDateStr}`,
  };
}

/**
 * Get the small employer delay date (October 1, 2025)
 */
export function getSmallEmployerDelayDate(): Date {
  const ruleset = loadRuleset();
  return new Date(ruleset.effectiveDates.smallEmployerEffective);
}

/**
 * Check if small employer delay applies
 *
 * @param asOfDate - Date to check
 * @returns True if still in small employer delay period
 */
export function isInSmallEmployerDelayPeriod(
  asOfDate: Date = new Date()
): boolean {
  const delayDate = getSmallEmployerDelayDate();
  return asOfDate < delayDate;
}

// =====================================================
// ACCRUAL CALCULATIONS
// =====================================================

/**
 * Calculate accrual using ruleset-driven logic
 *
 * @param hoursWorked - Hours worked in the period
 * @param employerSize - Size of employer
 * @param yearlyAccrued - Hours already accrued this year
 * @param asOfDate - Date of calculation (for effective date checking)
 * @returns Detailed accrual calculation result
 */
export function calculateAccrualV2(
  hoursWorked: number,
  employerSize: EmployerSize,
  yearlyAccrued: number,
  asOfDate: Date = new Date()
): AccrualResult {
  const ruleset = loadRuleset();
  const config = ruleset.employerTypes[employerSize];

  // Check effective date
  const effectiveCheck = checkEffectiveDate(employerSize, asOfDate);
  if (!effectiveCheck.isEffective) {
    return {
      accrued: 0,
      method: config.accrual.method as AccrualMethod,
      cap: config.caps.accrualCapPerYear,
      remaining: config.caps.accrualCapPerYear,
      capped: false,
      legislativeReference: `${ruleset.legislativeReference.sections.smallEmployerDelay} - ${effectiveCheck.reason}`,
    };
  }

  const cap = config.caps.accrualCapPerYear;
  const remaining = Math.max(0, cap - yearlyAccrued);

  // Small employers use annual grant, not per-hour accrual
  if (config.accrual.method === 'annual_grant') {
    return {
      accrued: 0,
      method: 'annual_grant',
      cap,
      remaining,
      capped: yearlyAccrued >= cap,
      legislativeReference: ruleset.legislativeReference.sections.accrualRate,
    };
  }

  // Large employers: 1 hour per 30 hours worked (per ESTA 2025 §5(1))
  const rate = config.accrual.rate;
  const denominator = config.accrual.denominator;
  const rawAccrued = (hoursWorked * rate) / denominator;
  const accrued = Math.min(rawAccrued, remaining);

  return {
    accrued,
    method: 'hourly',
    cap,
    remaining,
    capped: yearlyAccrued >= cap || yearlyAccrued + rawAccrued > cap,
    legislativeReference: ruleset.legislativeReference.sections.accrualRate,
  };
}

/**
 * Calculate annual frontload amount for employer
 *
 * @param employerSize - Size of employer
 * @returns Frontload amount in hours
 */
export function calculateFrontloadAmount(employerSize: EmployerSize): number {
  const ruleset = loadRuleset();

  if (!ruleset.frontloadingRules.allowed) {
    return 0;
  }

  const frontloadConfig =
    employerSize === 'small'
      ? ruleset.frontloadingRules.smallEmployer
      : ruleset.frontloadingRules.largeEmployer;

  return frontloadConfig.frontloadAmount;
}

/**
 * Check if frontloading eliminates accrual tracking requirement
 *
 * @param employerSize - Size of employer
 * @returns True if frontloading eliminates need for accrual tracking
 */
export function frontloadingEliminatesTracking(
  employerSize: EmployerSize
): boolean {
  const ruleset = loadRuleset();

  if (!ruleset.frontloadingRules.allowed) {
    return false;
  }

  const frontloadConfig =
    employerSize === 'small'
      ? ruleset.frontloadingRules.smallEmployer
      : ruleset.frontloadingRules.largeEmployer;

  return frontloadConfig.eliminatesAccrualTracking;
}

// =====================================================
// CARRYOVER VALIDATION
// =====================================================

/**
 * Validate and calculate carryover with ruleset-driven caps
 *
 * @param currentBalance - Current unused balance
 * @param employerSize - Size of employer
 * @returns Detailed carryover validation result
 */
export function validateCarryoverV2(
  currentBalance: number,
  employerSize: EmployerSize
): CarryoverValidationResult {
  const ruleset = loadRuleset();
  const errors: string[] = [];

  if (!ruleset.carryoverRules.allowed) {
    return {
      valid: false,
      carryoverAmount: 0,
      forfeitedAmount: currentBalance,
      cap: 0,
      errors: ['Carryover is not allowed under current rules'],
    };
  }

  const config = ruleset.employerTypes[employerSize];
  const cap = config.caps.carryoverCap;

  if (currentBalance < 0) {
    errors.push('Balance cannot be negative');
  }

  const carryoverAmount = Math.min(Math.max(0, currentBalance), cap);
  const forfeitedAmount = Math.max(0, currentBalance - cap);

  if (forfeitedAmount > 0) {
    // This is not an error, just informational - hours over cap are forfeited
  }

  return {
    valid: errors.length === 0,
    carryoverAmount,
    forfeitedAmount,
    cap,
    errors,
  };
}

// =====================================================
// EMPLOYER SIZE DETERMINATION
// =====================================================

/**
 * Determine employer size using ruleset threshold
 *
 * @param employeeCount - Number of employees
 * @returns Employer size classification
 */
export function determineEmployerSize(employeeCount: number): EmployerSize {
  const ruleset = loadRuleset();
  return employeeCount >= ruleset.employerSizeThreshold ? 'large' : 'small';
}

/**
 * Get employer size threshold from ruleset
 */
export function getEmployerSizeThreshold(): number {
  const ruleset = loadRuleset();
  return ruleset.employerSizeThreshold;
}

// =====================================================
// WAITING PERIOD (120-DAY PROBATION)
// =====================================================

/**
 * Get maximum waiting period days from ruleset
 *
 * @param employerSize - Size of employer
 * @returns Maximum waiting period in days
 */
export function getMaxWaitingPeriodDays(employerSize: EmployerSize): number {
  const ruleset = loadRuleset();
  return ruleset.employerTypes[employerSize].waitingPeriod.maxDays;
}

/**
 * Calculate waiting period end date
 *
 * @param hireDate - Employee hire date
 * @param waitingDays - Days employer requires (max 120)
 * @param employerSize - Size of employer
 * @returns Date when employee can use sick time
 */
export function calculateWaitingPeriodEnd(
  hireDate: Date,
  waitingDays: number,
  employerSize: EmployerSize
): Date {
  const maxDays = getMaxWaitingPeriodDays(employerSize);
  const effectiveDays = Math.min(waitingDays, maxDays);

  const endDate = new Date(hireDate);
  endDate.setDate(endDate.getDate() + effectiveDays);

  return endDate;
}

/**
 * Check if employee is in waiting period
 *
 * @param hireDate - Employee hire date
 * @param currentDate - Current date
 * @param waitingDays - Days employer requires (max 120)
 * @param employerSize - Size of employer
 * @returns True if employee is still in waiting period
 */
export function isInWaitingPeriod(
  hireDate: Date,
  currentDate: Date,
  waitingDays: number,
  employerSize: EmployerSize
): boolean {
  const endDate = calculateWaitingPeriodEnd(
    hireDate,
    waitingDays,
    employerSize
  );
  return currentDate < endDate;
}

// =====================================================
// RECORD KEEPING REQUIREMENTS
// =====================================================

/**
 * Get record retention period from ruleset
 */
export function getRecordRetentionYears(): number {
  const ruleset = loadRuleset();
  return ruleset.recordKeepingRequirements.retentionYears;
}

/**
 * Get required record types from ruleset
 */
export function getRequiredRecords(): string[] {
  const ruleset = loadRuleset();
  return [...ruleset.recordKeepingRequirements.requiredRecords];
}

// =====================================================
// LEGISLATIVE REFERENCE LOOKUP
// =====================================================

/**
 * Get legislative reference for a specific rule
 *
 * @param ruleKey - Key of the rule section
 * @returns Legislative section reference
 */
export function getLegislativeReference(
  ruleKey: keyof ESTARuleset['legislativeReference']['sections']
): string {
  const ruleset = loadRuleset();
  return ruleset.legislativeReference.sections[ruleKey];
}

/**
 * Get full legislative act information
 */
export function getLegislativeActInfo(): {
  act: string;
  year: number;
  effectiveDate: string;
} {
  const ruleset = loadRuleset();
  return {
    act: ruleset.legislativeReference.act,
    year: ruleset.legislativeReference.year,
    effectiveDate: ruleset.legislativeReference.effectiveDate,
  };
}
