/**
 * Accrual Engine Service Tests
 *
 * Tests for the accrual engine's pure calculation functions.
 *
 * @module test/architecture/accrual-engine.test
 */

import { describe, it, expect } from 'vitest';
import {
  handleAccrualCalculate,
  handleCarryoverCalculate,
  handleBalanceQuery,
  ACCRUAL_RATE,
  MAX_ACCRUAL_SMALL,
  MAX_ACCRUAL_LARGE,
} from '../../services/accrual-engine/handlers/accrual';

describe('Accrual Engine Calculations', () => {
  describe('handleAccrualCalculate', () => {
    it('should calculate accrual at 1:30 rate', () => {
      const result = handleAccrualCalculate({
        employeeId: 'emp-1',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-15',
        hoursWorked: 80,
        employerSize: 'large',
        existingBalance: 0,
        carryoverFromPreviousYear: 0,
      });

      // 80 hours worked / 30 = 2.67 hours accrued
      expect(result.hoursAccrued).toBeCloseTo(80 / 30, 2);
      expect(result.calculation.accrualRate).toBe(ACCRUAL_RATE);
    });

    it('should cap accrual at 40 hours for small employers', () => {
      const result = handleAccrualCalculate({
        employeeId: 'emp-1',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        hoursWorked: 2000,
        employerSize: 'small',
        existingBalance: 38,
        carryoverFromPreviousYear: 0,
      });

      // Should cap at 40, so only 2 hours can be added
      expect(result.newBalance).toBe(MAX_ACCRUAL_SMALL);
      expect(result.isAtMax).toBe(true);
    });

    it('should cap accrual at 72 hours for large employers', () => {
      const result = handleAccrualCalculate({
        employeeId: 'emp-1',
        periodStart: '2025-01-01',
        periodEnd: '2025-12-31',
        hoursWorked: 3000,
        employerSize: 'large',
        existingBalance: 70,
        carryoverFromPreviousYear: 0,
      });

      // Should cap at 72, so only 2 hours can be added
      expect(result.newBalance).toBe(MAX_ACCRUAL_LARGE);
      expect(result.isAtMax).toBe(true);
    });

    it('should be deterministic', () => {
      const request = {
        employeeId: 'emp-1',
        periodStart: '2025-01-01',
        periodEnd: '2025-01-15',
        hoursWorked: 80,
        employerSize: 'large' as const,
        existingBalance: 10,
        carryoverFromPreviousYear: 5,
      };

      // Same input should always produce same output
      const result1 = handleAccrualCalculate(request);
      const result2 = handleAccrualCalculate(request);

      expect(result1).toEqual(result2);
    });
  });

  describe('handleCarryoverCalculate', () => {
    it('should allow full carryover within limits for small employers', () => {
      const result = handleCarryoverCalculate({
        employeeId: 'emp-1',
        yearEndBalance: 30,
        employerSize: 'small',
        yearEndDate: '2025-12-31',
      });

      expect(result.carryoverAmount).toBe(30);
      expect(result.forfeitedAmount).toBe(0);
      expect(result.newYearStartBalance).toBe(30);
    });

    it('should forfeit excess for small employers', () => {
      const result = handleCarryoverCalculate({
        employeeId: 'emp-1',
        yearEndBalance: 50,
        employerSize: 'small',
        yearEndDate: '2025-12-31',
      });

      expect(result.carryoverAmount).toBe(40);
      expect(result.forfeitedAmount).toBe(10);
      expect(result.newYearStartBalance).toBe(40);
    });

    it('should allow full carryover within limits for large employers', () => {
      const result = handleCarryoverCalculate({
        employeeId: 'emp-1',
        yearEndBalance: 60,
        employerSize: 'large',
        yearEndDate: '2025-12-31',
      });

      expect(result.carryoverAmount).toBe(60);
      expect(result.forfeitedAmount).toBe(0);
      expect(result.newYearStartBalance).toBe(60);
    });

    it('should forfeit excess for large employers', () => {
      const result = handleCarryoverCalculate({
        employeeId: 'emp-1',
        yearEndBalance: 100,
        employerSize: 'large',
        yearEndDate: '2025-12-31',
      });

      expect(result.carryoverAmount).toBe(72);
      expect(result.forfeitedAmount).toBe(28);
      expect(result.newYearStartBalance).toBe(72);
    });
  });

  describe('handleBalanceQuery', () => {
    it('should return correct balance information', () => {
      const result = handleBalanceQuery(
        { employeeId: 'emp-1', asOfDate: '2025-06-15' },
        {
          currentBalance: 25,
          usedThisYear: 8,
          accruedThisYear: 20,
          carryoverFromLastYear: 13,
          employerSize: 'large',
        }
      );

      expect(result.employeeId).toBe('emp-1');
      expect(result.currentBalance).toBe(25);
      expect(result.usedThisYear).toBe(8);
      expect(result.accruedThisYear).toBe(20);
      expect(result.carryoverFromLastYear).toBe(13);
      expect(result.maxAllowed).toBe(MAX_ACCRUAL_LARGE);
      expect(result.asOfDate).toBe('2025-06-15');
    });

    it('should use today for missing asOfDate', () => {
      const result = handleBalanceQuery(
        { employeeId: 'emp-1' },
        {
          currentBalance: 10,
          usedThisYear: 0,
          accruedThisYear: 10,
          carryoverFromLastYear: 0,
          employerSize: 'small',
        }
      );

      expect(result.asOfDate).toBeDefined();
      expect(result.maxAllowed).toBe(MAX_ACCRUAL_SMALL);
    });
  });
});
