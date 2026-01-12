/**
 * ESTA-Logic Operating System Integration Tests
 *
 * These tests demonstrate the system working as an OS:
 * - Proof objects preserve institutional memory
 * - Time capsules maintain historical truth
 * - Drift engine detects and quarantines errors
 * - Predictive engine forecasts future states
 * - Everything is deterministic and auditable
 */

import { describe, it, expect } from 'vitest';
import {
  createProofObject,
  verifySeal,
  type ProofObject,
  type SystemIdentity,
  type ExecutionTrace,
  type ConfidenceMetrics,
  type HumanReadableSummary,
  type StatuteReference,
} from '../proof-system';
import {
  createTimeCapsule,
  InMemoryTimeCapsuleRepository,
  getHistoricalBelief,
  compareCapsules,
  type LawVersion,
  type RecalculationReason,
} from '../time-capsule';
import {
  ComplianceDriftEngine,
  detectCalculationDivergence,
  detectTemporalAnomalies,
  ErrorClass,
} from '../drift-engine';
import {
  predictAccrualExhaustion,
  predictSizeThreshold,
  EmployerSize,
  type AccrualDataPoint,
  type HiringDataPoint,
} from '../predictive-engine';
import type { ISODate, SemanticVersion } from '../../utils';

describe('ESTA-Logic Operating System Integration', () => {
  const mockSystemIdentity: SystemIdentity = {
    systemId: 'esta-kernel',
    version: '1.0.0' as SemanticVersion,
    environment: 'test',
  };

  const mockLawVersion: LawVersion = {
    version: '2024.1.0' as SemanticVersion,
    jurisdiction: 'MI',
    effectiveDate: '2025-02-21' as ISODate,
    changelog: [],
  };

  const mockStatuteReference: StatuteReference = {
    citation: 'Michigan ESTA 2025, Section 3(a)',
    statuteText:
      'An employee shall accrue not less than 1 hour of paid sick time for every 30 hours worked.',
    application: 'Defines base accrual rate',
    effectiveFrom: '2025-02-21' as ISODate,
  };

  function createMockExecutionTrace(): ExecutionTrace {
    return {
      steps: [
        {
          stepNumber: 1,
          operation: 'calculateAccrual',
          inputs: { hoursWorked: 80 },
          output: { hoursAccrued: 2.67 },
          durationMs: 0.5,
          justification: 'Applied statutory accrual rate',
        },
      ],
      totalDurationMs: 0.5,
      peakMemoryBytes: 4096,
    };
  }

  function createMockConfidenceMetrics(): ConfidenceMetrics {
    return {
      overall: 100 as any,
      inputQuality: 100 as any,
      ruleApplicability: 100 as any,
      calculationAccuracy: 100 as any,
      dataCompleteness: 100 as any,
      boostingFactors: [],
      reducingFactors: [],
    };
  }

  function createMockHumanSummary(): HumanReadableSummary {
    return {
      summary: 'Calculated sick time accrual',
      keyFindings: [],
      legalBasis: [],
      reasoning: 'Applied Michigan ESTA law',
      warnings: [],
    };
  }

  describe('Scenario: Employee Sick Time Lifecycle', () => {
    it('should maintain complete audit trail across time', async () => {
      const repository = new InMemoryTimeCapsuleRepository();

      // Month 1: Initial accrual
      const proof1 = createProofObject(
        'accrual.calculate' as any,
        { employeeId: 'EMP-001', hoursWorked: 80 },
        { hoursAccrued: 2.67, newBalance: 2.67 },
        createMockExecutionTrace(),
        {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [mockStatuteReference],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }
      );

      const capsule1 = createTimeCapsule(proof1, mockLawVersion, {
        effectiveDate: '2024-01-31' as ISODate,
      });

      await repository.store(capsule1);

      // Month 2: Additional accrual
      const proof2 = createProofObject(
        'accrual.calculate' as any,
        { employeeId: 'EMP-001', hoursWorked: 80 },
        { hoursAccrued: 2.67, newBalance: 5.34 },
        createMockExecutionTrace(),
        {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [mockStatuteReference],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }
      );

      const capsule2 = createTimeCapsule(proof2, mockLawVersion, {
        effectiveDate: '2024-02-28' as ISODate,
      });

      await repository.store(capsule2);

      // Query historical state
      const timeline = await repository.getTimeline('EMP-001', 'employee');

      expect(timeline).toHaveLength(2);
      expect(timeline[0].proof.outputs).toEqual({
        hoursAccrued: 2.67,
        newBalance: 2.67,
      });
      expect(timeline[1].proof.outputs).toEqual({
        hoursAccrued: 2.67,
        newBalance: 5.34,
      });

      // All capsules must be sealed and verifiable
      expect(verifySeal(timeline[0].proof)).toBe(true);
      expect(verifySeal(timeline[1].proof)).toBe(true);
    });

    it('should answer: what did we believe on date X?', async () => {
      const repository = new InMemoryTimeCapsuleRepository();

      // Create calculation on March 1
      const proofMarch = createProofObject(
        'accrual.calculate' as any,
        { employeeId: 'EMP-001' },
        { balance: 10 },
        createMockExecutionTrace(),
        {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [mockStatuteReference],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }
      );

      // Override timestamp to simulate March 1
      const capsuleMarch = {
        ...createTimeCapsule(proofMarch, mockLawVersion),
        calculatedAt: '2024-03-01T00:00:00Z' as ISODate,
      };

      await repository.store(capsuleMarch);

      // Create recalculation on April 1 (error discovered)
      const proofApril = createProofObject(
        'accrual.calculate' as any,
        { employeeId: 'EMP-001' },
        { balance: 12 }, // Corrected balance
        createMockExecutionTrace(),
        {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [mockStatuteReference],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }
      );

      const capsuleApril = {
        ...createTimeCapsule(proofApril, mockLawVersion, {
          recalculation: {
            reason: 'ERROR_DISCOVERED' as RecalculationReason,
            originalCapsuleId: capsuleMarch.id,
            authorizedBy: 'admin',
            authorizedAt: '2024-04-01T00:00:00Z' as ISODate,
            effectiveDate: '2024-03-01T00:00:00Z' as ISODate,
          },
        }),
        calculatedAt: '2024-04-01T00:00:00Z' as ISODate,
      };

      await repository.store(capsuleApril);

      // What did we believe on March 15?
      const beliefMarch15 = await getHistoricalBelief(
        repository,
        'EMP-001',
        'employee',
        '2024-03-15T00:00:00Z' as ISODate
      );

      // Should return March calculation (balance: 10)
      expect(beliefMarch15?.proof.outputs).toEqual({ balance: 10 });

      // What do we believe on April 2?
      const beliefApril2 = await getHistoricalBelief(
        repository,
        'EMP-001',
        'employee',
        '2024-04-02T00:00:00Z' as ISODate
      );

      // Should return April recalculation (balance: 12)
      expect(beliefApril2?.proof.outputs).toEqual({ balance: 12 });

      // Both capsules remain valid and verifiable
      expect(capsuleMarch.isActive).toBe(true);
      expect(capsuleApril.isActive).toBe(true);
    });
  });

  describe('Scenario: Drift Detection and Quarantine', () => {
    it('should detect and quarantine calculation divergence', () => {
      const originalProof = createProofObject(
        'accrual.calculate' as any,
        { hoursWorked: 80 },
        { hoursAccrued: 2.67 },
        createMockExecutionTrace(),
        {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [mockStatuteReference],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }
      );

      const recalculatedProof = createProofObject(
        'accrual.calculate' as any,
        { hoursWorked: 80 },
        { hoursAccrued: 3.0 }, // Different result!
        createMockExecutionTrace(),
        {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [mockStatuteReference],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }
      );

      const drift = detectCalculationDivergence(
        originalProof,
        recalculatedProof
      );

      expect(drift).not.toBeNull();
      expect(drift?.errorClass).toBe(ErrorClass.LEGAL);
      expect(drift?.quarantined).toBe(true);
      expect(drift?.severity).toBe('CRITICAL');
    });

    it('should detect temporal anomalies', () => {
      const capsule1 = createTimeCapsule(
        createProofObject('test' as any, {}, {}, createMockExecutionTrace(), {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }),
        mockLawVersion
      );

      // Simulate capsule with earlier timestamp created later (temporal anomaly)
      const capsule2 = {
        ...createTimeCapsule(
          createProofObject('test' as any, {}, {}, createMockExecutionTrace(), {
            kernelVersion: '1.0.0' as SemanticVersion,
            lawVersion: '2024.1.0' as SemanticVersion,
            appliedRules: [],
            statuteReferences: [],
            systemConfidence: createMockConfidenceMetrics(),
            humanReadableSummary: createMockHumanSummary(),
            systemIdentity: mockSystemIdentity,
          }),
          mockLawVersion
        ),
        calculatedAt: '2023-01-01T00:00:00Z' as ISODate, // Earlier than capsule1!
      };

      const drifts = detectTemporalAnomalies([capsule1, capsule2]);

      expect(drifts.length).toBeGreaterThan(0);
      expect(drifts[0].quarantined).toBe(true);
    });

    it('should integrate drift detection into compliance engine', async () => {
      const engine = new ComplianceDriftEngine();

      // Create some test data with temporal issues
      const capsules = [
        {
          ...createTimeCapsule(
            createProofObject(
              'test' as any,
              {},
              {},
              createMockExecutionTrace(),
              {
                kernelVersion: '1.0.0' as SemanticVersion,
                lawVersion: '2024.1.0' as SemanticVersion,
                appliedRules: [],
                statuteReferences: [],
                systemConfidence: createMockConfidenceMetrics(),
                humanReadableSummary: createMockHumanSummary(),
                systemIdentity: mockSystemIdentity,
              }
            ),
            mockLawVersion
          ),
          calculatedAt: '2024-02-01T00:00:00Z' as ISODate,
        },
        {
          ...createTimeCapsule(
            createProofObject(
              'test' as any,
              {},
              {},
              createMockExecutionTrace(),
              {
                kernelVersion: '1.0.0' as SemanticVersion,
                lawVersion: '2024.1.0' as SemanticVersion,
                appliedRules: [],
                statuteReferences: [],
                systemConfidence: createMockConfidenceMetrics(),
                humanReadableSummary: createMockHumanSummary(),
                systemIdentity: mockSystemIdentity,
              }
            ),
            mockLawVersion
          ),
          calculatedAt: '2024-01-01T00:00:00Z' as ISODate, // Temporal anomaly
        },
      ];

      const result = await engine.scan({ timeline: capsules });

      expect(result.drifts.length).toBeGreaterThan(0);
      expect(result.quarantined).toBeGreaterThan(0);
      expect(result.systemHealth).toBe('CRITICAL');
    });
  });

  describe('Scenario: Predictive Compliance', () => {
    it('should predict accrual exhaustion', () => {
      const accrualHistory: AccrualDataPoint[] = [
        {
          date: '2024-01-07' as ISODate,
          hoursWorked: 40 as any,
          hoursAccrued: 1.33 as any,
        },
        {
          date: '2024-01-14' as ISODate,
          hoursWorked: 40 as any,
          hoursAccrued: 1.33 as any,
        },
        {
          date: '2024-01-21' as ISODate,
          hoursWorked: 40 as any,
          hoursAccrued: 1.33 as any,
        },
        {
          date: '2024-01-28' as ISODate,
          hoursWorked: 40 as any,
          hoursAccrued: 1.33 as any,
        },
      ];

      const prediction = predictAccrualExhaustion(
        'EMP-001',
        30 as any, // Current balance: 30 hours
        EmployerSize.SMALL, // Cap at 40 hours
        accrualHistory,
        '2024-01-31' as ISODate
      );

      // With 10 hours remaining and 1.33 hours/week accrual
      // Should exhaust in ~7.5 weeks
      expect(prediction.exhaustionDate).toBeDefined();
      expect(prediction.remainingCapacity).toBe(10);
      expect(prediction.interventions.length).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it('should predict employer size threshold crossing', () => {
      const hiringHistory: HiringDataPoint[] = [
        { month: '2023-10', hires: 1, terminations: 0 },
        { month: '2023-11', hires: 1, terminations: 0 },
        { month: '2023-12', hires: 1, terminations: 0 },
        { month: '2024-01', hires: 1, terminations: 0 },
      ];

      const prediction = predictSizeThreshold(
        'EMP-ABC',
        8, // Currently 8 employees
        hiringHistory,
        '2024-02-01' as ISODate
      );

      expect(prediction).not.toBeNull();
      expect(prediction!.thresholdCrossDate).toBeDefined();
      expect(prediction!.employeesUntilThreshold).toBe(2);
      expect(prediction!.preparations.length).toBeGreaterThan(0);

      // Should recommend updating policy before crossing threshold
      const policyUpdate = prediction!.preparations.find((p) =>
        p.task.includes('HANDBOOK')
      );
      expect(policyUpdate).toBeDefined();
    });
  });

  describe('Scenario: System Invariants', () => {
    it('should maintain temporal consistency across all operations', async () => {
      const repository = new InMemoryTimeCapsuleRepository();
      const engine = new ComplianceDriftEngine();

      // Create a series of calculations
      const dates = ['2024-01-01', '2024-02-01', '2024-03-01', '2024-04-01'];

      for (const date of dates) {
        const proof = createProofObject(
          'accrual.calculate' as any,
          { date },
          { balance: 10 },
          createMockExecutionTrace(),
          {
            kernelVersion: '1.0.0' as SemanticVersion,
            lawVersion: '2024.1.0' as SemanticVersion,
            appliedRules: [],
            statuteReferences: [],
            systemConfidence: createMockConfidenceMetrics(),
            humanReadableSummary: createMockHumanSummary(),
            systemIdentity: mockSystemIdentity,
          }
        );

        const capsule = {
          ...createTimeCapsule(proof, mockLawVersion),
          calculatedAt: `${date}T00:00:00Z` as ISODate,
        };

        await repository.store(capsule);
      }

      // Verify temporal ordering
      const timeline = await repository.query({
        sortBy: 'calculatedAt',
        sortDirection: 'asc',
      });

      for (let i = 1; i < timeline.length; i++) {
        expect(timeline[i].calculatedAt >= timeline[i - 1].calculatedAt).toBe(
          true
        );
      }

      // Scan for temporal anomalies
      const driftResult = await engine.scan({ timeline });

      expect(driftResult.systemHealth).toBe('HEALTHY');
      expect(driftResult.quarantined).toBe(0);
    });

    it('should preserve proof integrity indefinitely', () => {
      const proof = createProofObject(
        'test' as any,
        { input: 'test' },
        { output: 'result' },
        createMockExecutionTrace(),
        {
          kernelVersion: '1.0.0' as SemanticVersion,
          lawVersion: '2024.1.0' as SemanticVersion,
          appliedRules: [],
          statuteReferences: [],
          systemConfidence: createMockConfidenceMetrics(),
          humanReadableSummary: createMockHumanSummary(),
          systemIdentity: mockSystemIdentity,
        }
      );

      // Verify seal
      const initialVerification = verifySeal(proof);
      expect(initialVerification).toBe(true);

      // Simulate serialization/deserialization
      const serialized = JSON.stringify(proof);
      const deserialized = JSON.parse(serialized) as ProofObject;

      // Seal should still be valid
      const afterSerializationVerification = verifySeal(deserialized);
      expect(afterSerializationVerification).toBe(true);

      // Verify structural integrity
      expect(deserialized.proofId).toBe(proof.proofId);
      expect(deserialized.seal.hash).toBe(proof.seal.hash);
    });
  });
});
