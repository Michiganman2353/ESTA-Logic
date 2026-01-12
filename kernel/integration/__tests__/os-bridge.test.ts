/**
 * OS Integration Tests
 *
 * Validates that the OS bridge correctly wraps existing accrual-engine
 * functions while adding OS features (proof objects, time capsules).
 */

import { describe, it, expect } from 'vitest';
import { calculateAccrualV2 } from '../../../libs/accrual-engine/src/compliance-engine';
import {
  calculateAccrualWithProof,
  validateCarryoverWithProof,
  determineEmployerSizeWithProof,
} from '../os-bridge';
import { verifySeal } from '../../core/proof-system';
import { InMemoryTimeCapsuleRepository } from '../../core/time-capsule';
import { ComplianceDriftEngine } from '../../core/drift-engine';

describe('OS Integration Bridge', () => {
  describe('calculateAccrualWithProof', () => {
    it('should return identical results to original function', async () => {
      // Original calculation
      const original = calculateAccrualV2(80, 'large', 45.5);

      // OS-enhanced calculation
      const { result } = await calculateAccrualWithProof(80, 'large', 45.5);

      // Results must be identical
      expect(result.accrued).toBe(original.accrued);
      expect(result.cap).toBe(original.cap);
      expect(result.remaining).toBe(original.remaining);
      expect(result.capped).toBe(original.capped);
      expect(result.method).toBe(original.method);
    });

    it('should generate valid proof object', async () => {
      const { proof } = await calculateAccrualWithProof(80, 'large', 45.5, {
        employeeId: 'EMP-001',
        employerId: 'EMPLOYER-ABC',
      });

      // Proof must have required fields
      expect(proof.proofId).toBeDefined();
      expect(proof.operation).toBe('accrual.calculate');
      expect(proof.inputs).toEqual(
        expect.objectContaining({
          hoursWorked: 80,
          employerSize: 'large',
          yearlyAccrued: 45.5,
        }),
      );

      // Proof must be sealed
      expect(proof.seal).toBeDefined();
      expect(proof.seal.algorithm).toBe('SHA-256');

      // Seal must be valid
      expect(verifySeal(proof)).toBe(true);
    });

    it('should include execution trace', async () => {
      const { proof } = await calculateAccrualWithProof(80, 'large', 45.5);

      expect(proof.executionTrace.steps).toBeDefined();
      expect(proof.executionTrace.steps.length).toBeGreaterThan(0);
      // Duration can be 0 or greater (very fast operations)
      expect(proof.executionTrace.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should include statute references', async () => {
      const { proof } = await calculateAccrualWithProof(80, 'large', 45.5);

      expect(proof.statuteReferences).toBeDefined();
      expect(proof.statuteReferences.length).toBeGreaterThan(0);
      expect(proof.statuteReferences[0].citation).toBeDefined();
    });

    it('should include human-readable summary', async () => {
      const { proof } = await calculateAccrualWithProof(80, 'large', 45.5);

      expect(proof.humanReadableSummary.summary).toBeDefined();
      expect(proof.humanReadableSummary.keyFindings).toBeDefined();
      expect(proof.humanReadableSummary.legalBasis).toBeDefined();
      expect(proof.humanReadableSummary.reasoning).toBeDefined();
    });

    it('should store time capsule if repository provided', async () => {
      const repository = new InMemoryTimeCapsuleRepository();

      const { capsule } = await calculateAccrualWithProof(80, 'large', 45.5, {
        employeeId: 'EMP-001',
        capsuleRepository: repository,
      });

      expect(capsule).toBeDefined();
      expect(capsule!.proof).toBeDefined();
      expect(capsule!.lawVersion).toBeDefined();
      expect(capsule!.isActive).toBe(true);

      // Verify capsule was stored
      const retrieved = await repository.retrieve(capsule!.id);
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe(capsule!.id);
    });

    it('should detect drift if enabled', async () => {
      const driftEngine = new ComplianceDriftEngine();

      // First calculation (no drift expected)
      const { driftDetected } = await calculateAccrualWithProof(80, 'large', 45.5, {
        driftEngine,
      });

      // Should not detect drift (calculation matches itself)
      expect(driftDetected).toBe(false);
    });

    it('should handle capped accruals', async () => {
      const { result, proof } = await calculateAccrualWithProof(
        80,
        'large',
        70, // Near cap of 72
      );

      expect(result.capped).toBe(true);
      // Check that warnings array exists and has cap-related message
      expect(proof.humanReadableSummary.warnings.length).toBeGreaterThan(0);
      expect(proof.humanReadableSummary.warnings[0]).toContain('cap');
    });
  });

  describe('validateCarryoverWithProof', () => {
    it('should return identical results to original function', async () => {
      const { validateCarryoverV2 } = await import(
        '../../../libs/accrual-engine/src/compliance-engine'
      );

      const original = validateCarryoverV2(35, 'small');
      const { result } = await validateCarryoverWithProof(35, 'small');

      expect(result.valid).toBe(original.valid);
      expect(result.carryoverAmount).toBe(original.carryoverAmount);
      expect(result.forfeitedAmount).toBe(original.forfeitedAmount);
      expect(result.cap).toBe(original.cap);
    });

    it('should generate valid proof object', async () => {
      const { proof } = await validateCarryoverWithProof(35, 'small', {
        employeeId: 'EMP-002',
      });

      expect(proof.operation).toBe('carryover.validate');
      expect(verifySeal(proof)).toBe(true);
    });
  });

  describe('determineEmployerSizeWithProof', () => {
    it('should return identical results to original function', async () => {
      const { determineEmployerSize } = await import(
        '../../../libs/accrual-engine/src/compliance-engine'
      );

      const original = determineEmployerSize(12);
      const { size } = determineEmployerSizeWithProof(12);

      expect(size).toBe(original);
    });

    it('should generate valid proof object', () => {
      const { proof } = determineEmployerSizeWithProof(12);

      expect(proof.operation).toBe('employer.determineSize');
      expect(verifySeal(proof)).toBe(true);
      expect(proof.inputs).toEqual({ employeeCount: 12 });
      expect(proof.outputs).toEqual({ size: 'large' });
    });

    it('should correctly classify small employers', () => {
      const { size, proof } = determineEmployerSizeWithProof(8);

      expect(size).toBe('small');
      expect(proof.outputs).toEqual({ size: 'small' });
    });

    it('should correctly classify large employers', () => {
      const { size, proof } = determineEmployerSizeWithProof(15);

      expect(size).toBe('large');
      expect(proof.outputs).toEqual({ size: 'large' });
    });
  });

  describe('Integration with Time Capsules', () => {
    it('should create queryable historical record', async () => {
      const repository = new InMemoryTimeCapsuleRepository();

      // Perform calculation and store capsule
      await calculateAccrualWithProof(80, 'large', 45.5, {
        employeeId: 'EMP-001',
        asOfDate: new Date('2024-03-15'),
        capsuleRepository: repository,
      });

      // Query timeline
      const timeline = await repository.getTimeline('EMP-001', 'employee');

      expect(timeline).toHaveLength(1);
      expect(timeline[0].proof.inputs).toMatchObject({
        hoursWorked: 80,
        employerSize: 'large',
      });
    });

    it('should maintain multiple calculations in timeline', async () => {
      const repository = new InMemoryTimeCapsuleRepository();

      // Multiple calculations for same employee
      await calculateAccrualWithProof(80, 'large', 0, {
        employeeId: 'EMP-001',
        capsuleRepository: repository,
      });

      await calculateAccrualWithProof(80, 'large', 2.67, {
        employeeId: 'EMP-001',
        capsuleRepository: repository,
      });

      const timeline = await repository.getTimeline('EMP-001', 'employee');

      expect(timeline).toHaveLength(2);
      expect(timeline[0].proof.inputs.yearlyAccrued).toBe(0);
      expect(timeline[1].proof.inputs.yearlyAccrued).toBe(2.67);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without optional parameters', async () => {
      // Should work with minimal parameters (just like original)
      const { result, proof } = await calculateAccrualWithProof(80, 'large', 45.5);

      expect(result).toBeDefined();
      expect(proof).toBeDefined();
    });

    it('should not require repository or drift engine', async () => {
      const { result, proof, capsule, driftDetected } = await calculateAccrualWithProof(
        80,
        'large',
        45.5,
      );

      expect(result).toBeDefined();
      expect(proof).toBeDefined();
      expect(capsule).toBeUndefined(); // Not provided
      // driftDetected is false when no engine provided (not undefined)
      expect(driftDetected).toBe(false);
    });
  });
});
