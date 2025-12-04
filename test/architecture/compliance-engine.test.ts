/**
 * Compliance Engine Service Tests
 *
 * Tests for ESTA 2025 compliance checking.
 *
 * @module test/architecture/compliance-engine.test
 */

import { describe, it, expect } from 'vitest';
import {
  checkCompliance,
  ESTA_RULES,
} from '../../services/compliance-engine/handlers/compliance';

describe('Compliance Engine', () => {
  describe('ESTA Rules', () => {
    it('should have all required ESTA 2025 rules', () => {
      const ruleIds = ESTA_RULES.map((r) => r.id);

      expect(ruleIds).toContain('ESTA-001'); // Accrual Rate
      expect(ruleIds).toContain('ESTA-002'); // Maximum Accrual Cap
      expect(ruleIds).toContain('ESTA-003'); // Minimum Increment
      expect(ruleIds).toContain('ESTA-004'); // Carryover Limits
      expect(ruleIds).toContain('ESTA-005'); // Notice Requirements
      expect(ruleIds).toContain('ESTA-006'); // Documentation Threshold
      expect(ruleIds).toContain('ESTA-007'); // Waiting Period
      expect(ruleIds).toContain('ESTA-008'); // Retaliation Prohibition
    });

    it('should categorize rules correctly', () => {
      const categories = new Set(ESTA_RULES.map((r) => r.category));

      expect(categories.has('accrual')).toBe(true);
      expect(categories.has('usage')).toBe(true);
      expect(categories.has('carryover')).toBe(true);
      expect(categories.has('notice')).toBe(true);
      expect(categories.has('documentation')).toBe(true);
    });
  });

  describe('checkCompliance', () => {
    it('should pass for compliant accrual', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'accrual',
        data: {
          hoursWorked: 30,
          hoursAccrued: 1, // Exactly 1:30 ratio
          balance: 20,
          employerSize: 'large',
        },
      });

      expect(result.compliant).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should fail for incorrect accrual rate', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'accrual',
        data: {
          hoursWorked: 30,
          hoursAccrued: 2, // Should be 1 hour
          balance: 20,
          employerSize: 'large',
        },
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.code === 'ESTA-001')).toBe(true);
    });

    it('should fail for balance exceeding maximum', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'accrual',
        data: {
          balance: 50, // Exceeds 40 for small employer
          employerSize: 'small',
        },
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.code === 'ESTA-002')).toBe(true);
    });

    it('should warn for usage below minimum increment', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'usage',
        data: {
          hoursUsed: 0.5, // Below 1 hour minimum
        },
      });

      expect(result.warnings.some((w) => w.code === 'ESTA-003')).toBe(true);
    });

    it('should fail for carryover exceeding limits', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'carryover',
        data: {
          carryoverAmount: 80, // Exceeds 72 for large employer
          employerSize: 'large',
        },
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.code === 'ESTA-004')).toBe(true);
    });

    it('should warn for missing notice on foreseeable absence', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'usage',
        data: {
          foreseeable: true,
          noticeDays: 0,
        },
      });

      expect(result.warnings.some((w) => w.code === 'ESTA-005')).toBe(true);
    });

    it('should warn for documentation requirements', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'usage',
        data: {
          consecutiveDays: 4,
          hasDocumentation: false,
        },
      });

      expect(result.warnings.some((w) => w.code === 'ESTA-006')).toBe(true);
    });

    it('should fail for usage before waiting period', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'usage',
        data: {
          daysEmployed: 60,
          isFirstUsage: true,
        },
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.code === 'ESTA-007')).toBe(true);
    });

    it('should flag potential retaliation', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'usage',
        data: {
          hasAdverseAction: true,
          daysAfterUsageToAdverseAction: 30,
        },
      });

      expect(result.compliant).toBe(false);
      expect(result.violations.some((v) => v.code === 'ESTA-008')).toBe(true);
    });

    it('should generate audit trail', () => {
      const result = checkCompliance({
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'accrual',
        data: {},
      });

      expect(result.auditTrail).toBeDefined();
      const auditData = JSON.parse(result.auditTrail);
      expect(auditData.tenantId).toBe('tenant-1');
      expect(auditData.employeeId).toBe('emp-1');
      expect(auditData.action).toBe('accrual');
      expect(auditData.timestamp).toBeDefined();
    });
  });

  describe('Determinism', () => {
    it('should produce identical results for identical inputs', () => {
      const request = {
        tenantId: 'tenant-1',
        employeeId: 'emp-1',
        action: 'accrual' as const,
        data: {
          hoursWorked: 40,
          hoursAccrued: 40 / 30,
          balance: 20,
          employerSize: 'large',
        },
      };

      const result1 = checkCompliance(request);
      const result2 = checkCompliance(request);

      // Results should be identical (except audit trail timestamps)
      expect(result1.compliant).toBe(result2.compliant);
      expect(result1.violations).toEqual(result2.violations);
      expect(result1.warnings).toEqual(result2.warnings);
    });
  });
});
