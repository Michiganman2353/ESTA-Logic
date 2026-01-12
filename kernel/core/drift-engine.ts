/**
 * ESTA-Logic Compliance Drift Engine
 *
 * Error dissipation architecture: errors must not accumulate.
 * They must be absorbed, classified, and neutralized.
 *
 * @module kernel/core/drift-engine
 */

import type { ISODate } from '../utils';
import type { TimeCapsule } from './time-capsule';
import type { ProofObject, StatuteReference } from './proof-system';

/**
 * Error severity classification
 */
export enum ErrorClass {
  /** Informational - no compliance impact */
  INFORMATIONAL = 'INFORMATIONAL',

  /** Operational - affects efficiency but not compliance */
  OPERATIONAL = 'OPERATIONAL',

  /** Legal - compliance violation (system must halt) */
  LEGAL = 'LEGAL',
}

/**
 * Drift severity
 */
export type DriftSeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Compliance drift
 */
export interface ComplianceDrift {
  /** Unique drift identifier */
  driftId: string;

  /** When drift was detected */
  detectedAt: ISODate;

  /** Type of drift */
  type: DriftType;

  /** Severity */
  severity: DriftSeverity;

  /** Error classification */
  errorClass: ErrorClass;

  /** Description */
  description: string;

  /** Metric that drifted */
  metric: string;

  /** Expected value */
  expectedValue: unknown;

  /** Actual value */
  actualValue: unknown;

  /** Deviation magnitude */
  deviation: number;

  /** Trend */
  trend: 'IMPROVING' | 'STABLE' | 'DEGRADING';

  /** Affected entities */
  affectedEntities: string[];

  /** Potential statute violations */
  potentialViolations?: StatuteReference[];

  /** Recommended corrections */
  corrections: Correction[];

  /** Is this drift quarantined */
  quarantined: boolean;

  /** Quarantine reason */
  quarantineReason?: string;
}

/**
 * Types of drift
 */
export enum DriftType {
  /** Data inconsistency */
  DATA_INCONSISTENCY = 'DATA_INCONSISTENCY',

  /** Calculation divergence */
  CALCULATION_DIVERGENCE = 'CALCULATION_DIVERGENCE',

  /** Policy misconfiguration */
  POLICY_MISCONFIGURATION = 'POLICY_MISCONFIGURATION',

  /** State corruption */
  STATE_CORRUPTION = 'STATE_CORRUPTION',

  /** Temporal anomaly */
  TEMPORAL_ANOMALY = 'TEMPORAL_ANOMALY',

  /** Constraint violation */
  CONSTRAINT_VIOLATION = 'CONSTRAINT_VIOLATION',

  /** Law version mismatch */
  LAW_VERSION_MISMATCH = 'LAW_VERSION_MISMATCH',
}

/**
 * Correction action
 */
export interface Correction {
  /** Action type */
  action: CorrectionAction;

  /** Description */
  description: string;

  /** Is this correction reversible */
  reversible: boolean;

  /** Estimated impact */
  impact: string;

  /** Required authority level */
  requiresAuthority: 'SYSTEM' | 'ADMIN' | 'AUDITOR';

  /** Steps to execute */
  steps: string[];

  /** Validation criteria */
  validation: string;
}

/**
 * Correction actions
 */
export enum CorrectionAction {
  RECALCULATE = 'RECALCULATE',
  QUARANTINE = 'QUARANTINE',
  NOTIFY_ADMIN = 'NOTIFY_ADMIN',
  AUTO_CORRECT = 'AUTO_CORRECT',
  REQUEST_AUDIT = 'REQUEST_AUDIT',
  HALT_OPERATIONS = 'HALT_OPERATIONS',
}

/**
 * Drift detection result
 */
export interface DriftDetectionResult {
  /** Drifts detected */
  drifts: ComplianceDrift[];

  /** Overall system health */
  systemHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';

  /** Recommendations */
  recommendations: string[];

  /** Quarantined items */
  quarantined: number;

  /** Neutralized items */
  neutralized: number;
}

/**
 * Detect data inconsistencies
 */
export function detectDataInconsistencies(
  data: unknown[],
  validationRules: ValidationRule[]
): ComplianceDrift[] {
  const drifts: ComplianceDrift[] = [];

  for (const item of data) {
    for (const rule of validationRules) {
      const result = rule.validate(item);

      if (!result.valid) {
        drifts.push({
          driftId: generateDriftId(),
          detectedAt: new Date().toISOString() as ISODate,
          type: DriftType.DATA_INCONSISTENCY,
          severity: result.severity,
          errorClass: ErrorClass.OPERATIONAL,
          description: result.message,
          metric: rule.metric,
          expectedValue: result.expected,
          actualValue: result.actual,
          deviation: calculateDeviation(result.expected, result.actual),
          trend: 'STABLE',
          affectedEntities: [extractEntityId(item)],
          corrections: generateCorrections(
            DriftType.DATA_INCONSISTENCY,
            result
          ),
          quarantined: false,
        });
      }
    }
  }

  return drifts;
}

/**
 * Detect calculation divergence
 */
export function detectCalculationDivergence(
  original: ProofObject,
  recalculated: ProofObject
): ComplianceDrift | null {
  // Check if outputs match
  const outputsMatch =
    JSON.stringify(original.outputs) === JSON.stringify(recalculated.outputs);

  if (outputsMatch) {
    return null; // No divergence
  }

  // Calculate deviation
  const deviation = calculateOutputDeviation(
    original.outputs,
    recalculated.outputs
  );

  return {
    driftId: generateDriftId(),
    detectedAt: new Date().toISOString() as ISODate,
    type: DriftType.CALCULATION_DIVERGENCE,
    severity: classifyDeviationSeverity(deviation),
    errorClass: ErrorClass.LEGAL, // Calculation differences are legal issues
    description: 'Recalculation produced different results',
    metric: 'calculation_output',
    expectedValue: original.outputs,
    actualValue: recalculated.outputs,
    deviation,
    trend: 'DEGRADING',
    affectedEntities: [original.proofId],
    potentialViolations: original.statuteReferences,
    corrections: [
      {
        action: CorrectionAction.REQUEST_AUDIT,
        description: 'Calculation divergence requires audit review',
        reversible: false,
        impact: 'May require recalculation of dependent values',
        requiresAuthority: 'AUDITOR',
        steps: [
          'Compare execution traces',
          'Identify source of divergence',
          'Determine correct result',
          'Create correction time capsule',
        ],
        validation: 'Auditor must certify correction',
      },
    ],
    quarantined: true,
    quarantineReason: 'Automatic quarantine due to calculation divergence',
  };
}

/**
 * Detect impossible states
 */
export function detectImpossibleStates(
  state: unknown,
  constraints: Constraint[]
): ComplianceDrift[] {
  const drifts: ComplianceDrift[] = [];

  for (const constraint of constraints) {
    if (!constraint.check(state)) {
      drifts.push({
        driftId: generateDriftId(),
        detectedAt: new Date().toISOString() as ISODate,
        type: DriftType.CONSTRAINT_VIOLATION,
        severity: 'CRITICAL',
        errorClass: ErrorClass.LEGAL,
        description: `Constraint violation: ${constraint.description}`,
        metric: constraint.metric,
        expectedValue: constraint.expected,
        actualValue: constraint.getActual(state),
        deviation: 100, // Binary: constraint is violated
        trend: 'DEGRADING',
        affectedEntities: [extractEntityId(state)],
        potentialViolations: constraint.statute
          ? [constraint.statute]
          : undefined,
        corrections: [
          {
            action: CorrectionAction.HALT_OPERATIONS,
            description: 'Impossible state detected - halt until resolved',
            reversible: false,
            impact: 'System operations halted for affected entity',
            requiresAuthority: 'ADMIN',
            steps: [
              'Identify how impossible state was created',
              'Restore valid state from time capsule',
              'Fix root cause',
              'Resume operations',
            ],
            validation: 'All constraints must pass',
          },
        ],
        quarantined: true,
        quarantineReason:
          'Impossible state cannot exist - quarantined immediately',
      });
    }
  }

  return drifts;
}

/**
 * Detect temporal anomalies
 */
export function detectTemporalAnomalies(
  timeline: TimeCapsule[]
): ComplianceDrift[] {
  const drifts: ComplianceDrift[] = [];

  // Check for violations of temporal ordering
  for (let i = 1; i < timeline.length; i++) {
    const prev = timeline[i - 1];
    const curr = timeline[i];

    // Calculated time must be monotonically increasing
    if (curr.calculatedAt < prev.calculatedAt) {
      drifts.push({
        driftId: generateDriftId(),
        detectedAt: new Date().toISOString() as ISODate,
        type: DriftType.TEMPORAL_ANOMALY,
        severity: 'CRITICAL',
        errorClass: ErrorClass.LEGAL,
        description: 'Calculation timestamps are not monotonically increasing',
        metric: 'calculated_at',
        expectedValue: `>= ${prev.calculatedAt}`,
        actualValue: curr.calculatedAt,
        deviation: 100,
        trend: 'DEGRADING',
        affectedEntities: [curr.id],
        corrections: [
          {
            action: CorrectionAction.QUARANTINE,
            description: 'Quarantine temporally anomalous capsule',
            reversible: true,
            impact: 'Capsule removed from active timeline',
            requiresAuthority: 'ADMIN',
            steps: [
              'Verify timestamp is incorrect',
              'Determine correct timestamp',
              'Create corrected capsule',
              'Quarantine original',
            ],
            validation: 'Timeline must be temporally consistent',
          },
        ],
        quarantined: true,
        quarantineReason: 'Temporal anomaly violates time model',
      });
    }
  }

  return drifts;
}

/**
 * Analyze drift trends
 */
export function analyzeDriftTrend(
  drifts: ComplianceDrift[],
  timeframe: { start: ISODate; end: ISODate }
): DriftTrend {
  if (drifts.length === 0) {
    return {
      velocity: 0,
      accelerating: false,
      projection: null,
      health: 'HEALTHY',
    };
  }

  // Calculate drift rate
  const timeSpan =
    new Date(timeframe.end).getTime() - new Date(timeframe.start).getTime();
  const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
  const velocity = drifts.length / daysSpan;

  // Classify health based on drift count and severity
  const criticalCount = drifts.filter((d) => d.severity === 'CRITICAL').length;
  const highCount = drifts.filter((d) => d.severity === 'HIGH').length;

  let health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  if (criticalCount > 0) {
    health = 'CRITICAL';
  } else if (highCount > 0 || drifts.length > 10) {
    health = 'DEGRADED';
  } else {
    health = 'HEALTHY';
  }

  return {
    velocity,
    accelerating: velocity > 0.5, // More than 0.5 drifts per day
    projection: null, // Would calculate when system becomes critical
    health,
  };
}

/**
 * Drift trend
 */
export interface DriftTrend {
  /** Drift rate (drifts per day) */
  velocity: number;

  /** Is drift accelerating */
  accelerating: boolean;

  /** When system will become critical (if trend continues) */
  projection: ISODate | null;

  /** Current health */
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Metric name */
  metric: string;

  /** Validation function */
  validate: (data: unknown) => ValidationResult;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Is valid */
  valid: boolean;

  /** Severity if invalid */
  severity: DriftSeverity;

  /** Message */
  message: string;

  /** Expected value */
  expected: unknown;

  /** Actual value */
  actual: unknown;
}

/**
 * Constraint
 */
export interface Constraint {
  /** Metric name */
  metric: string;

  /** Description */
  description: string;

  /** Check function */
  check: (state: unknown) => boolean;

  /** Get expected value */
  expected: unknown;

  /** Get actual value */
  getActual: (state: unknown) => unknown;

  /** Related statute */
  statute?: StatuteReference;
}

// === Helper Functions ===

function generateDriftId(): string {
  return `DRIFT-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

function calculateDeviation(expected: unknown, actual: unknown): number {
  if (typeof expected === 'number' && typeof actual === 'number') {
    return Math.abs(expected - actual);
  }
  return expected === actual ? 0 : 100;
}

function calculateOutputDeviation(expected: unknown, actual: unknown): number {
  // Simplified - real implementation would be type-aware
  return JSON.stringify(expected) === JSON.stringify(actual) ? 0 : 100;
}

function classifyDeviationSeverity(deviation: number): DriftSeverity {
  if (deviation === 0) return 'NONE';
  if (deviation < 10) return 'LOW';
  if (deviation < 50) return 'MEDIUM';
  if (deviation < 90) return 'HIGH';
  return 'CRITICAL';
}

function extractEntityId(item: unknown): string {
  if (item && typeof item === 'object' && 'id' in item) {
    return String(item.id);
  }
  return 'UNKNOWN';
}

function generateCorrections(
  type: DriftType,
  _result: ValidationResult
): Correction[] {
  // Simplified - real implementation would be more sophisticated
  return [
    {
      action: CorrectionAction.AUTO_CORRECT,
      description: `Auto-correct ${type}`,
      reversible: true,
      impact: 'Data will be normalized to expected value',
      requiresAuthority: 'SYSTEM',
      steps: ['Validate correction', 'Apply correction', 'Verify result'],
      validation: 'Data passes validation rules',
    },
  ];
}

/**
 * Compliance drift engine
 */
export class ComplianceDriftEngine {
  private drifts: ComplianceDrift[] = [];

  /**
   * Scan for drifts
   */
  async scan(context: {
    data?: unknown[];
    validationRules?: ValidationRule[];
    timeline?: TimeCapsule[];
    constraints?: Constraint[];
  }): Promise<DriftDetectionResult> {
    const detectedDrifts: ComplianceDrift[] = [];

    // Detect data inconsistencies
    if (context.data && context.validationRules) {
      detectedDrifts.push(
        ...detectDataInconsistencies(context.data, context.validationRules)
      );
    }

    // Detect temporal anomalies
    if (context.timeline) {
      detectedDrifts.push(...detectTemporalAnomalies(context.timeline));
    }

    // Detect impossible states
    if (context.data && context.constraints) {
      for (const item of context.data) {
        detectedDrifts.push(
          ...detectImpossibleStates(item, context.constraints)
        );
      }
    }

    // Store drifts
    this.drifts.push(...detectedDrifts);

    // Calculate metrics
    const quarantined = detectedDrifts.filter((d) => d.quarantined).length;
    const neutralized = 0; // Would track auto-corrected drifts

    // Determine system health
    const trend = analyzeDriftTrend(detectedDrifts, {
      start: new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString() as ISODate,
      end: new Date().toISOString() as ISODate,
    });

    return {
      drifts: detectedDrifts,
      systemHealth: trend.health,
      recommendations: generateRecommendations(detectedDrifts, trend),
      quarantined,
      neutralized,
    };
  }

  /**
   * Get all drifts
   */
  getAllDrifts(): ComplianceDrift[] {
    return [...this.drifts];
  }

  /**
   * Get active (non-quarantined) drifts
   */
  getActiveDrifts(): ComplianceDrift[] {
    return this.drifts.filter((d) => !d.quarantined);
  }

  /**
   * Quarantine a drift
   */
  quarantine(driftId: string, reason: string): void {
    const drift = this.drifts.find((d) => d.driftId === driftId);
    if (drift) {
      drift.quarantined = true;
      drift.quarantineReason = reason;
    }
  }
}

function generateRecommendations(
  drifts: ComplianceDrift[],
  trend: DriftTrend
): string[] {
  const recommendations: string[] = [];

  if (trend.health === 'CRITICAL') {
    recommendations.push(
      'URGENT: Critical drift detected - immediate action required'
    );
  }

  const legalDrifts = drifts.filter((d) => d.errorClass === ErrorClass.LEGAL);
  if (legalDrifts.length > 0) {
    recommendations.push(
      `${legalDrifts.length} legal compliance drift(s) detected - audit recommended`
    );
  }

  if (trend.accelerating) {
    recommendations.push(
      'Drift rate is accelerating - investigate root causes'
    );
  }

  return recommendations;
}
