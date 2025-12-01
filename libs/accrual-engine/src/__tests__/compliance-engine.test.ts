import { describe, it, expect, beforeAll } from 'vitest';
import {
  loadRuleset,
  getRulesetVersion,
  validateRulesetIntegrity,
  checkEffectiveDate,
  getSmallEmployerDelayDate,
  isInSmallEmployerDelayPeriod,
  calculateAccrualV2,
  calculateFrontloadAmount,
  frontloadingEliminatesTracking,
  validateCarryoverV2,
  determineEmployerSize,
  getEmployerSizeThreshold,
  getMaxWaitingPeriodDays,
  calculateWaitingPeriodEnd,
  isInWaitingPeriod,
  getRecordRetentionYears,
  getRequiredRecords,
  getLegislativeReference,
  getLegislativeActInfo,
} from '../compliance-engine';

describe('ESTA 2025 Compliance Engine v2', () => {
  /**
   * Ruleset Loading and Validation
   */
  describe('Ruleset Loading', () => {
    it('should load ruleset successfully', () => {
      const ruleset = loadRuleset();
      expect(ruleset).toBeDefined();
      expect(ruleset.version).toBeDefined();
    });

    it('should return correct ruleset version', () => {
      const version = getRulesetVersion();
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it('should validate ruleset integrity with no errors', () => {
      const result = validateRulesetIntegrity();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should have correct legislative reference', () => {
      const info = getLegislativeActInfo();
      expect(info.act).toBe('Michigan Employee Earned Sick Time Act (ESTA)');
      expect(info.year).toBe(2025);
      expect(info.effectiveDate).toBe('2025-02-21');
    });
  });

  /**
   * Deterministic Accrual Rate Tests (1:30 ratio per §5(1))
   */
  describe('1:30 Accrual Rate - Large Employers', () => {
    it('should accrue exactly 1 hour for 30 hours worked', () => {
      const result = calculateAccrualV2(30, 'large', 0, new Date('2025-03-01'));
      expect(result.accrued).toBe(1);
      expect(result.method).toBe('hourly');
    });

    it('should accrue exactly 2 hours for 60 hours worked', () => {
      const result = calculateAccrualV2(60, 'large', 0, new Date('2025-03-01'));
      expect(result.accrued).toBe(2);
    });

    it('should accrue fractional hours for partial periods', () => {
      const result = calculateAccrualV2(45, 'large', 0, new Date('2025-03-01'));
      expect(result.accrued).toBe(1.5);
    });

    it('should accrue 0.5 hours for 15 hours worked', () => {
      const result = calculateAccrualV2(15, 'large', 0, new Date('2025-03-01'));
      expect(result.accrued).toBeCloseTo(0.5, 10);
    });

    it('should respect 72-hour annual cap', () => {
      const result = calculateAccrualV2(
        30,
        'large',
        72,
        new Date('2025-03-01')
      );
      expect(result.accrued).toBe(0);
      expect(result.capped).toBe(true);
    });

    it('should cap accrual at remaining capacity', () => {
      const result = calculateAccrualV2(
        90,
        'large',
        70,
        new Date('2025-03-01')
      );
      // 90 hours would accrue 3 hours, but only 2 hours of capacity remain
      expect(result.accrued).toBe(2);
      expect(result.capped).toBe(true);
    });

    it('should include legislative reference in result', () => {
      const result = calculateAccrualV2(30, 'large', 0, new Date('2025-03-01'));
      expect(result.legislativeReference).toBe('§5(1)');
    });
  });

  /**
   * Small Employer Annual Grant Tests
   */
  describe('Small Employer Annual Grant', () => {
    it('should return 0 for hourly accrual (uses annual grant)', () => {
      const result = calculateAccrualV2(30, 'small', 0, new Date('2025-11-01'));
      expect(result.accrued).toBe(0);
      expect(result.method).toBe('annual_grant');
    });

    it('should have 40-hour cap', () => {
      const result = calculateAccrualV2(30, 'small', 0, new Date('2025-11-01'));
      expect(result.cap).toBe(40);
    });

    it('should calculate remaining capacity correctly', () => {
      const result = calculateAccrualV2(
        30,
        'small',
        25,
        new Date('2025-11-01')
      );
      expect(result.remaining).toBe(15);
    });
  });

  /**
   * 120-Day Waiting Period Tests (§5(2))
   */
  describe('120-Day Waiting Period', () => {
    it('should return max 120 days for large employers', () => {
      const maxDays = getMaxWaitingPeriodDays('large');
      expect(maxDays).toBe(120);
    });

    it('should return max 120 days for small employers', () => {
      const maxDays = getMaxWaitingPeriodDays('small');
      expect(maxDays).toBe(120);
    });

    it('should calculate correct waiting period end date', () => {
      const hireDate = new Date('2025-01-01');
      const endDate = calculateWaitingPeriodEnd(hireDate, 120, 'large');
      expect(endDate.toISOString().split('T')[0]).toBe('2025-05-01');
    });

    it('should cap waiting days at 120 even if employer requests more', () => {
      const hireDate = new Date('2025-01-01');
      const endDate = calculateWaitingPeriodEnd(hireDate, 180, 'large');
      // Should use 120, not 180
      expect(endDate.toISOString().split('T')[0]).toBe('2025-05-01');
    });

    it('should correctly identify employee in waiting period', () => {
      const hireDate = new Date('2025-01-01');
      const currentDate = new Date('2025-03-01'); // 59 days after hire
      expect(isInWaitingPeriod(hireDate, currentDate, 120, 'large')).toBe(true);
    });

    it('should correctly identify employee past waiting period', () => {
      const hireDate = new Date('2025-01-01');
      const currentDate = new Date('2025-06-01'); // 151 days after hire
      expect(isInWaitingPeriod(hireDate, currentDate, 120, 'large')).toBe(
        false
      );
    });

    it('should handle 0-day waiting period (immediate eligibility)', () => {
      const hireDate = new Date('2025-01-01');
      const currentDate = new Date('2025-01-02');
      expect(isInWaitingPeriod(hireDate, currentDate, 0, 'large')).toBe(false);
    });
  });

  /**
   * Small Employer Delay Tests (October 1, 2025 - §5(5))
   */
  describe('Small Employer Delay (Oct 1, 2025)', () => {
    it('should return October 1, 2025 as small employer effective date', () => {
      const delayDate = getSmallEmployerDelayDate();
      expect(delayDate.toISOString().split('T')[0]).toBe('2025-10-01');
    });

    it('should identify delay period before October 1, 2025', () => {
      const beforeDelay = new Date('2025-09-15');
      expect(isInSmallEmployerDelayPeriod(beforeDelay)).toBe(true);
    });

    it('should not be in delay period on October 1, 2025', () => {
      const onDate = new Date('2025-10-01');
      expect(isInSmallEmployerDelayPeriod(onDate)).toBe(false);
    });

    it('should not be in delay period after October 1, 2025', () => {
      const afterDelay = new Date('2025-11-01');
      expect(isInSmallEmployerDelayPeriod(afterDelay)).toBe(false);
    });

    it('should return 0 accrual for small employers before Oct 1', () => {
      const result = calculateAccrualV2(30, 'small', 0, new Date('2025-03-01'));
      expect(result.accrued).toBe(0);
      expect(result.legislativeReference).toContain('not yet effective');
    });

    it('should allow accrual for small employers after Oct 1', () => {
      const result = calculateAccrualV2(30, 'small', 0, new Date('2025-11-01'));
      // Small employers use annual grant, so accrued is still 0 but effective
      expect(result.accrued).toBe(0);
      expect(result.method).toBe('annual_grant');
      expect(result.legislativeReference).toBe('§5(1)');
    });

    it('should check effective date for small employers', () => {
      const beforeResult = checkEffectiveDate('small', new Date('2025-03-01'));
      expect(beforeResult.isEffective).toBe(false);
      expect(beforeResult.daysUntilEffective).toBeGreaterThan(0);

      const afterResult = checkEffectiveDate('small', new Date('2025-11-01'));
      expect(afterResult.isEffective).toBe(true);
      expect(afterResult.daysUntilEffective).toBe(0);
    });

    it('should allow accrual for large employers from Feb 21, 2025', () => {
      const result = checkEffectiveDate('large', new Date('2025-03-01'));
      expect(result.isEffective).toBe(true);
    });
  });

  /**
   * Frontloading vs Accrual Parity Tests (§5(6))
   */
  describe('Frontloading vs Accrual Parity', () => {
    it('should return 72-hour frontload for large employers', () => {
      const amount = calculateFrontloadAmount('large');
      expect(amount).toBe(72);
    });

    it('should return 40-hour frontload for small employers', () => {
      const amount = calculateFrontloadAmount('small');
      expect(amount).toBe(40);
    });

    it('should indicate frontloading eliminates tracking for large employers', () => {
      expect(frontloadingEliminatesTracking('large')).toBe(true);
    });

    it('should indicate frontloading eliminates tracking for small employers', () => {
      expect(frontloadingEliminatesTracking('small')).toBe(true);
    });

    it('should have parity between accrual cap and frontload amount for large', () => {
      const frontload = calculateFrontloadAmount('large');
      const result = calculateAccrualV2(0, 'large', 0, new Date('2025-03-01'));
      expect(frontload).toBe(result.cap);
    });

    it('should have parity between accrual cap and frontload amount for small', () => {
      const frontload = calculateFrontloadAmount('small');
      const result = calculateAccrualV2(0, 'small', 0, new Date('2025-11-01'));
      expect(frontload).toBe(result.cap);
    });
  });

  /**
   * Carryover Rules and Annual Caps Tests (§5(4))
   */
  describe('Carryover Rules and Annual Caps', () => {
    it('should allow full carryover when under cap for large employer', () => {
      const result = validateCarryoverV2(50, 'large');
      expect(result.valid).toBe(true);
      expect(result.carryoverAmount).toBe(50);
      expect(result.forfeitedAmount).toBe(0);
      expect(result.cap).toBe(72);
    });

    it('should cap carryover at 72 for large employers', () => {
      const result = validateCarryoverV2(100, 'large');
      expect(result.valid).toBe(true);
      expect(result.carryoverAmount).toBe(72);
      expect(result.forfeitedAmount).toBe(28);
    });

    it('should allow full carryover when under cap for small employer', () => {
      const result = validateCarryoverV2(30, 'small');
      expect(result.valid).toBe(true);
      expect(result.carryoverAmount).toBe(30);
      expect(result.forfeitedAmount).toBe(0);
      expect(result.cap).toBe(40);
    });

    it('should cap carryover at 40 for small employers', () => {
      const result = validateCarryoverV2(60, 'small');
      expect(result.valid).toBe(true);
      expect(result.carryoverAmount).toBe(40);
      expect(result.forfeitedAmount).toBe(20);
    });

    it('should handle exact cap amount', () => {
      const largeResult = validateCarryoverV2(72, 'large');
      expect(largeResult.carryoverAmount).toBe(72);
      expect(largeResult.forfeitedAmount).toBe(0);

      const smallResult = validateCarryoverV2(40, 'small');
      expect(smallResult.carryoverAmount).toBe(40);
      expect(smallResult.forfeitedAmount).toBe(0);
    });

    it('should handle zero balance', () => {
      const result = validateCarryoverV2(0, 'large');
      expect(result.valid).toBe(true);
      expect(result.carryoverAmount).toBe(0);
      expect(result.forfeitedAmount).toBe(0);
    });

    it('should reject negative balance', () => {
      const result = validateCarryoverV2(-10, 'large');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Balance cannot be negative');
    });
  });

  /**
   * Employer Size Determination Tests
   */
  describe('Employer Size Determination', () => {
    it('should return 10 as employer size threshold', () => {
      expect(getEmployerSizeThreshold()).toBe(10);
    });

    it('should classify 9 employees as small employer', () => {
      expect(determineEmployerSize(9)).toBe('small');
    });

    it('should classify 10 employees as large employer', () => {
      expect(determineEmployerSize(10)).toBe('large');
    });

    it('should classify 100 employees as large employer', () => {
      expect(determineEmployerSize(100)).toBe('large');
    });

    it('should classify 1 employee as small employer', () => {
      expect(determineEmployerSize(1)).toBe('small');
    });
  });

  /**
   * Record Keeping Requirements Tests
   */
  describe('Record Keeping Requirements', () => {
    it('should require 3-year retention', () => {
      expect(getRecordRetentionYears()).toBe(3);
    });

    it('should require hours_worked in records', () => {
      const records = getRequiredRecords();
      expect(records).toContain('hours_worked');
    });

    it('should require sick_time_accrued in records', () => {
      const records = getRequiredRecords();
      expect(records).toContain('sick_time_accrued');
    });

    it('should require sick_time_used in records', () => {
      const records = getRequiredRecords();
      expect(records).toContain('sick_time_used');
    });

    it('should require sick_time_balance in records', () => {
      const records = getRequiredRecords();
      expect(records).toContain('sick_time_balance');
    });
  });

  /**
   * Legislative Reference Tests
   */
  describe('Legislative References', () => {
    it('should return correct reference for accrualRate', () => {
      expect(getLegislativeReference('accrualRate')).toBe('§5(1)');
    });

    it('should return correct reference for waitingPeriod', () => {
      expect(getLegislativeReference('waitingPeriod')).toBe('§5(2)');
    });

    it('should return correct reference for caps', () => {
      expect(getLegislativeReference('caps')).toBe('§5(3)');
    });

    it('should return correct reference for carryover', () => {
      expect(getLegislativeReference('carryover')).toBe('§5(4)');
    });

    it('should return correct reference for smallEmployerDelay', () => {
      expect(getLegislativeReference('smallEmployerDelay')).toBe('§5(5)');
    });

    it('should return correct reference for frontloading', () => {
      expect(getLegislativeReference('frontloading')).toBe('§5(6)');
    });
  });

  /**
   * Edge Case Tests
   */
  describe('Edge Cases', () => {
    it('should handle exactly 0 hours worked', () => {
      const result = calculateAccrualV2(0, 'large', 0, new Date('2025-03-01'));
      expect(result.accrued).toBe(0);
      expect(result.capped).toBe(false);
    });

    it('should handle very large hours worked (2000+ hours/year)', () => {
      // 2000 hours / 30 = 66.67 hours accrued, under 72 cap
      const result = calculateAccrualV2(
        2000,
        'large',
        0,
        new Date('2025-03-01')
      );
      expect(result.accrued).toBeCloseTo(66.67, 1);
      expect(result.capped).toBe(false);
    });

    it('should handle exceeding annual cap with single period', () => {
      // 3000 hours / 30 = 100 hours, but capped at 72
      const result = calculateAccrualV2(
        3000,
        'large',
        0,
        new Date('2025-03-01')
      );
      expect(result.accrued).toBe(72);
      expect(result.capped).toBe(true);
    });

    it('should handle employee hired on effective date', () => {
      const result = checkEffectiveDate('large', new Date('2025-02-21'));
      expect(result.isEffective).toBe(true);
    });

    it('should handle date exactly on small employer delay date', () => {
      const result = checkEffectiveDate('small', new Date('2025-10-01'));
      expect(result.isEffective).toBe(true);
    });

    it('should handle partial day calculations', () => {
      // 7.5 hours worked should accrue 0.25 hours
      const result = calculateAccrualV2(
        7.5,
        'large',
        0,
        new Date('2025-03-01')
      );
      expect(result.accrued).toBe(0.25);
    });
  });

  /**
   * Seasonal Worker Tests
   */
  describe('Seasonal Worker Edge Cases', () => {
    it('should accrue same as regular employees (1:30 rate)', () => {
      // Per ESTA 2025, seasonal workers accrue at same rate
      const result = calculateAccrualV2(30, 'large', 0, new Date('2025-03-01'));
      expect(result.accrued).toBe(1);
    });

    it('should have carryover available for seasonal workers', () => {
      const result = validateCarryoverV2(20, 'large');
      expect(result.valid).toBe(true);
      expect(result.carryoverAmount).toBe(20);
    });
  });

  /**
   * Compliance Drift Prevention Tests
   */
  describe('Compliance Drift Prevention', () => {
    it('should fail if accrual rate denominator changes', () => {
      const result = validateRulesetIntegrity();
      // This test ensures the 1:30 rate is maintained
      expect(result.valid).toBe(true);
    });

    it('should fail if employer size threshold changes', () => {
      const result = validateRulesetIntegrity();
      expect(result.valid).toBe(true);
    });

    it('should fail if waiting period maximum changes', () => {
      const result = validateRulesetIntegrity();
      expect(result.valid).toBe(true);
    });

    it('should fail if carryover caps change', () => {
      const result = validateRulesetIntegrity();
      expect(result.valid).toBe(true);
    });

    it('should fail if small employer effective date changes', () => {
      const result = validateRulesetIntegrity();
      expect(result.valid).toBe(true);
    });

    it('should warn if tenure-based rates are enabled', () => {
      const result = validateRulesetIntegrity();
      // Tenure-based rates were removed from final law
      // If enabled, should generate warning
      expect(result.warnings).not.toContain(
        expect.stringContaining('Tenure-based rates are enabled')
      );
    });
  });
});
