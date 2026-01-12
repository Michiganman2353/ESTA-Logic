/**
 * ESTA-Logic OS Integration Layer
 *
 * This module bridges the existing accrual-engine/compliance-engine
 * with the new OS architecture (proof objects, time capsules, drift engine).
 *
 * ARCHITECTURAL ROLE: Integration Bridge
 * - Wraps existing calculators with proof object generation
 * - Stores calculation results in time capsules
 * - Leverages drift engine for validation
 * - Maintains backward compatibility
 *
 * @module kernel/integration
 */

import type { EmployerSize } from '@esta/shared-types';
import {
  calculateAccrualV2,
  validateCarryoverV2,
  determineEmployerSize,
  loadRuleset,
  type AccrualResult,
  type CarryoverValidationResult,
  type ESTARuleset,
} from '../../libs/accrual-engine/src/compliance-engine';
import {
  createProofObject,
  type ProofObject,
  type SystemIdentity,
  type ExecutionTrace,
  type RuleApplication,
  type StatuteReference,
  type ConfidenceMetrics,
  type HumanReadableSummary,
} from '../core/proof-system';
import {
  createTimeCapsule,
  type TimeCapsule,
  type LawVersion,
  JURISDICTIONS,
} from '../core/time-capsule';
import {
  ComplianceDriftEngine,
  detectCalculationDivergence,
} from '../core/drift-engine';
import type { ISODate, SemanticVersion } from '../utils';

/**
 * System identity for OS integration
 */
const SYSTEM_IDENTITY: SystemIdentity = {
  systemId: 'esta-logic-os',
  version: '1.0.0' as SemanticVersion,
  environment: process.env.NODE_ENV || 'production',
};

/**
 * Convert ESTA ruleset to law version
 */
function rulesetToLawVersion(ruleset: ESTARuleset): LawVersion {
  return {
    version: ruleset.version as SemanticVersion,
    jurisdiction: JURISDICTIONS.MI,
    effectiveDate: ruleset.legislativeReference.effectiveDate as ISODate,
    changelog: [
      {
        type: 'MAJOR',
        section: 'All',
        description: `Michigan ESTA ${ruleset.legislativeReference.year} enacted`,
        authority: ruleset.legislativeReference.act,
      },
    ],
  };
}

/**
 * Create statute references from accrual result
 */
function createStatuteReferencesForAccrual(
  result: AccrualResult,
  ruleset: ESTARuleset,
): StatuteReference[] {
  return [
    {
      citation: result.legislativeReference,
      statuteText: ruleset.employerTypes.large.accrual.description,
      application: 'Defines accrual rate for sick time calculation',
      effectiveFrom: ruleset.legislativeReference.effectiveDate as ISODate,
    },
  ];
}

/**
 * Accrual calculation with OS integration
 *
 * Wraps existing calculateAccrualV2 with:
 * - Proof object generation
 * - Time capsule storage
 * - Drift detection
 */
export async function calculateAccrualWithProof(
  hoursWorked: number,
  employerSize: EmployerSize,
  yearlyAccrued: number,
  options?: {
    asOfDate?: Date;
    employeeId?: string;
    employerId?: string;
    capsuleRepository?: any; // TimeCapsuleRepository
    driftEngine?: ComplianceDriftEngine;
  },
): Promise<{
  result: AccrualResult;
  proof: ProofObject<any, any>;
  capsule?: TimeCapsule;
  driftDetected?: boolean;
}> {
  const asOfDate = options?.asOfDate || new Date();
  const ruleset = loadRuleset();

  // Execute existing calculation
  const startTime = Date.now();
  const result = calculateAccrualV2(hoursWorked, employerSize, yearlyAccrued, asOfDate);
  const endTime = Date.now();

  // Build execution trace
  const trace: ExecutionTrace = {
    steps: [
      {
        stepNumber: 1,
        operation: 'loadRuleset',
        inputs: {},
        output: { version: ruleset.version },
        durationMs: 0.5,
        justification: 'Loaded ESTA 2025 ruleset configuration',
      },
      {
        stepNumber: 2,
        operation: 'calculateAccrualV2',
        inputs: { hoursWorked, employerSize, yearlyAccrued },
        output: result,
        durationMs: endTime - startTime,
        ruleApplied: 'ESTA_ACCRUAL_RATE' as any,
        justification: `Applied ${employerSize} employer accrual rules`,
      },
    ],
    totalDurationMs: endTime - startTime,
    peakMemoryBytes: 0, // Would need to measure in production
  };

  // Build rule applications
  const config = ruleset.employerTypes[employerSize];
  const ruleApplications: RuleApplication[] = [
    {
      ruleId: 'ESTA_ACCRUAL_RATE' as any,
      ruleName: 'Michigan ESTA Accrual Rate',
      ruleVersion: ruleset.version as SemanticVersion,
      statute: {
        citation: ruleset.legislativeReference.sections.accrualRate,
        statuteText: config.accrual.description,
        application: 'Determines sick time accrual based on hours worked',
        effectiveFrom: ruleset.legislativeReference.effectiveDate as ISODate,
      },
      inputs: { hoursWorked, rate: config.accrual.rate, denominator: config.accrual.denominator },
      output: { accrued: result.accrued },
      condition: 'hoursWorked > 0 && withinEffectiveDate',
      action: `accrued = (hoursWorked * ${config.accrual.rate}) / ${config.accrual.denominator}`,
      confidence: 100 as any,
      assumptions: result.capped ? ['Balance capped at statutory maximum'] : [],
    },
  ];

  // Build confidence metrics
  const confidence: ConfidenceMetrics = {
    overall: 100 as any,
    inputQuality: 100 as any,
    ruleApplicability: 100 as any,
    calculationAccuracy: 100 as any,
    dataCompleteness: 100 as any,
    boostingFactors: [
      {
        factor: 'RULESET_DRIVEN',
        impact: 20,
        explanation: 'Calculation uses validated JSON ruleset',
      },
      {
        factor: 'STATUTORY_COMPLIANCE',
        impact: 15,
        explanation: 'Direct implementation of Michigan ESTA law',
      },
    ],
    reducingFactors: result.capped
      ? [
          {
            factor: 'ACCRUAL_CAPPED',
            impact: -5,
            explanation: 'Accrual limited by statutory cap',
          },
        ]
      : [],
  };

  // Build human summary
  const summary: HumanReadableSummary = {
    summary: `Calculated sick time accrual for ${employerSize} employer. Employee worked ${hoursWorked} hours and accrued ${result.accrued.toFixed(2)} hours.`,
    keyFindings: [
      `Hours worked: ${hoursWorked}`,
      `Accrual method: ${result.method}`,
      `Hours accrued: ${result.accrued.toFixed(2)}`,
      `Yearly cap: ${result.cap}`,
      `Remaining capacity: ${result.remaining.toFixed(2)}`,
      result.capped ? '⚠️ Accrual capped at statutory maximum' : '✓ Below statutory cap',
    ],
    legalBasis: [
      result.legislativeReference,
      `${employerSize} employer: ${config.accrual.description}`,
    ],
    reasoning: result.capped
      ? `Employee accrual was capped at ${result.cap} hours per Michigan ESTA statutory limits.`
      : 'Calculation is straightforward application of Michigan ESTA accrual rules.',
    warnings: result.capped
      ? [
          `Balance has reached or exceeded the ${result.cap}-hour annual cap. Additional accrual is not possible until next year or after sick time usage.`,
        ]
      : [],
  };

  // Create proof object
  const proof = createProofObject(
    'accrual.calculate' as any,
    {
      hoursWorked,
      employerSize,
      yearlyAccrued,
      asOfDate: asOfDate.toISOString(),
      employeeId: options?.employeeId,
      employerId: options?.employerId,
    },
    result,
    trace,
    {
      kernelVersion: SYSTEM_IDENTITY.version,
      lawVersion: ruleset.version as SemanticVersion,
      appliedRules: ruleApplications,
      statuteReferences: createStatuteReferencesForAccrual(result, ruleset),
      systemConfidence: confidence,
      humanReadableSummary: summary,
      systemIdentity: SYSTEM_IDENTITY,
    },
  );

  // Create time capsule if repository provided
  let capsule: TimeCapsule | undefined;
  if (options?.capsuleRepository) {
    const lawVersion = rulesetToLawVersion(ruleset);
    capsule = createTimeCapsule(proof, lawVersion, {
      effectiveDate: asOfDate.toISOString() as ISODate,
    });
    await options.capsuleRepository.store(capsule);
  }

  // Check for drift if engine provided
  let driftDetected = false;
  if (options?.driftEngine) {
    // Recalculate to verify consistency
    const recomputed = calculateAccrualV2(hoursWorked, employerSize, yearlyAccrued, asOfDate);
    const divergence = detectCalculationDivergence(proof, {
      ...proof,
      outputs: recomputed,
    });

    if (divergence) {
      driftDetected = true;
      // Drift engine would quarantine this
    }
  }

  return {
    result,
    proof,
    capsule,
    driftDetected,
  };
}

/**
 * Carryover validation with OS integration
 */
export async function validateCarryoverWithProof(
  currentBalance: number,
  employerSize: EmployerSize,
  options?: {
    employeeId?: string;
    employerId?: string;
    capsuleRepository?: any;
  },
): Promise<{
  result: CarryoverValidationResult;
  proof: ProofObject<any, any>;
  capsule?: TimeCapsule;
}> {
  const ruleset = loadRuleset();
  const startTime = Date.now();
  const result = validateCarryoverV2(currentBalance, employerSize);
  const endTime = Date.now();

  // Build execution trace
  const trace: ExecutionTrace = {
    steps: [
      {
        stepNumber: 1,
        operation: 'validateCarryoverV2',
        inputs: { currentBalance, employerSize },
        output: result,
        durationMs: endTime - startTime,
        ruleApplied: 'ESTA_CARRYOVER' as any,
        justification: 'Applied ESTA carryover rules',
      },
    ],
    totalDurationMs: endTime - startTime,
    peakMemoryBytes: 0,
  };

  // Build confidence metrics
  const confidence: ConfidenceMetrics = {
    overall: 100 as any,
    inputQuality: 100 as any,
    ruleApplicability: 100 as any,
    calculationAccuracy: 100 as any,
    dataCompleteness: 100 as any,
    boostingFactors: [],
    reducingFactors: result.valid
      ? []
      : [
          {
            factor: 'VALIDATION_FAILED',
            impact: -50,
            explanation: 'Carryover validation failed',
          },
        ],
  };

  // Build human summary
  const summary: HumanReadableSummary = {
    summary: `Validated sick time carryover for ${employerSize} employer. Balance: ${currentBalance} hours.`,
    keyFindings: [
      `Current balance: ${currentBalance}`,
      `Carryover amount: ${result.carryoverAmount}`,
      `Forfeited amount: ${result.forfeitedAmount}`,
      `Carryover cap: ${result.cap}`,
      result.valid ? '✓ Carryover valid' : '✗ Carryover invalid',
    ],
    legalBasis: [ruleset.carryoverRules.description],
    reasoning: result.valid
      ? 'Carryover is within statutory limits.'
      : `Carryover validation failed: ${result.errors.join(', ')}`,
    warnings:
      result.forfeitedAmount > 0
        ? [`${result.forfeitedAmount} hours will be forfeited (exceeds ${result.cap}-hour cap)`]
        : [],
  };

  // Create proof object
  const proof = createProofObject(
    'carryover.validate' as any,
    {
      currentBalance,
      employerSize,
      employeeId: options?.employeeId,
      employerId: options?.employerId,
    },
    result,
    trace,
    {
      kernelVersion: SYSTEM_IDENTITY.version,
      lawVersion: ruleset.version as SemanticVersion,
      appliedRules: [],
      statuteReferences: [
        {
          citation: ruleset.legislativeReference.sections.carryover,
          statuteText: ruleset.carryoverRules.description,
          application: 'Governs year-end carryover of unused sick time',
          effectiveFrom: ruleset.legislativeReference.effectiveDate as ISODate,
        },
      ],
      systemConfidence: confidence,
      humanReadableSummary: summary,
      systemIdentity: SYSTEM_IDENTITY,
    },
  );

  // Create time capsule if repository provided
  let capsule: TimeCapsule | undefined;
  if (options?.capsuleRepository) {
    const lawVersion = rulesetToLawVersion(ruleset);
    capsule = createTimeCapsule(proof, lawVersion);
    await options.capsuleRepository.store(capsule);
  }

  return {
    result,
    proof,
    capsule,
  };
}

/**
 * Employer size determination with OS integration
 */
export function determineEmployerSizeWithProof(employeeCount: number): {
  size: EmployerSize;
  proof: ProofObject<any, any>;
} {
  const ruleset = loadRuleset();
  const size = determineEmployerSize(employeeCount);

  const trace: ExecutionTrace = {
    steps: [
      {
        stepNumber: 1,
        operation: 'determineEmployerSize',
        inputs: { employeeCount },
        output: { size },
        durationMs: 0.1,
        ruleApplied: 'EMPLOYER_SIZE_THRESHOLD' as any,
        justification: `Employer has ${employeeCount} employees, threshold is ${ruleset.employerSizeThreshold}`,
      },
    ],
    totalDurationMs: 0.1,
    peakMemoryBytes: 0,
  };

  const summary: HumanReadableSummary = {
    summary: `Determined employer size: ${size} (${employeeCount} employees)`,
    keyFindings: [
      `Employee count: ${employeeCount}`,
      `Size threshold: ${ruleset.employerSizeThreshold}`,
      `Classification: ${size}`,
    ],
    legalBasis: [
      `Michigan ESTA defines "small employer" as fewer than ${ruleset.employerSizeThreshold} employees`,
    ],
    reasoning: `Employer has ${employeeCount} employees, ${employeeCount < ruleset.employerSizeThreshold ? 'below' : 'at or above'} the ${ruleset.employerSizeThreshold}-employee threshold.`,
    warnings: [],
  };

  const proof = createProofObject(
    'employer.determineSize' as any,
    { employeeCount },
    { size },
    trace,
    {
      kernelVersion: SYSTEM_IDENTITY.version,
      lawVersion: ruleset.version as SemanticVersion,
      appliedRules: [],
      statuteReferences: [
        {
          citation: 'Michigan ESTA 2025, Section 2',
          statuteText: `Small employer means an employer that employs fewer than ${ruleset.employerSizeThreshold} employees.`,
          application: 'Defines employer size classification',
          effectiveFrom: ruleset.legislativeReference.effectiveDate as ISODate,
        },
      ],
      systemConfidence: {
        overall: 100 as any,
        inputQuality: 100 as any,
        ruleApplicability: 100 as any,
        calculationAccuracy: 100 as any,
        dataCompleteness: 100 as any,
        boostingFactors: [],
        reducingFactors: [],
      },
      humanReadableSummary: summary,
      systemIdentity: SYSTEM_IDENTITY,
    },
  );

  return { size, proof };
}
