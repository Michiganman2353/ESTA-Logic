import { describe, it, expect } from 'vitest';
import {
  calculateAccruedHours,
  calculateCappedAccrual,
  calculateAnnualUseLimit,
  calculateAvailableForUse,
  calculateBalance,
  HOURS_TO_ACCRUE_PER_HOUR,
  MAX_ACCRUAL_SMALL_EMPLOYER,
  MAX_ACCRUAL_LARGE_EMPLOYER,
} from './index';

describe('calculateAccruedHours', () => {
  it('calculates accrual for 30 hours (should be 1 hour)', () => {
    expect(calculateAccruedHours(30)).toBeCloseTo(1, 6);
  });

  it('calculates accrual for 40 hours', () => {
    expect(calculateAccruedHours(40)).toBeCloseTo(1.333333, 6);
  });

  it('calculates accrual for 60 hours (should be 2 hours)', () => {
    expect(calculateAccruedHours(60)).toBeCloseTo(2, 6);
  });

  it('returns 0 for zero hours', () => {
    expect(calculateAccruedHours(0)).toBe(0);
  });

  it('throws on negative hours', () => {
    expect(() => calculateAccruedHours(-1)).toThrow(
      'hoursWorked must be a non-negative finite number'
    );
  });

  it('throws on NaN', () => {
    expect(() => calculateAccruedHours(NaN)).toThrow(
      'hoursWorked must be a non-negative finite number'
    );
  });

  it('throws on Infinity', () => {
    expect(() => calculateAccruedHours(Infinity)).toThrow(
      'hoursWorked must be a non-negative finite number'
    );
  });
});

describe('accrual versus annual use', () => {
  it('does not cap earned hours for a small employer at 40', () => {
    expect(calculateAccruedHours(1800)).toBe(60);
    expect(calculateCappedAccrual(1800, 10)).toBe(60);
    expect(calculateAnnualUseLimit(10)).toBe(40);
    expect(calculateAvailableForUse(60, 0, 10)).toBe(40);
    expect(calculateAvailableForUse(55, 30, 10)).toBe(10);
  });

  it('does not cap earned hours for other employers at 72', () => {
    expect(calculateAccruedHours(2700)).toBe(90);
    expect(calculateCappedAccrual(2700, 11)).toBe(90);
    expect(calculateAnnualUseLimit(11)).toBe(72);
    expect(calculateAvailableForUse(90, 18, 11)).toBe(54);
  });

  it('caps annual use, not the bank: a 30-hour bank permits only 30 hours', () => {
    expect(calculateAvailableForUse(30, 0, 11)).toBe(30);
    expect(calculateAvailableForUse(90, 73, 11)).toBe(0);
  });

  it('validates employer size and use inputs', () => {
    expect(() => calculateAnnualUseLimit(0)).toThrow('positive integer');
    expect(() => calculateCappedAccrual(100, -5)).toThrow('positive integer');
    expect(() => calculateAnnualUseLimit(1.5)).toThrow('positive integer');
    expect(() => calculateAvailableForUse(-1, 0, 11)).toThrow('non-negative');
  });
});

describe('calculateBalance', () => {
  it('calculates correct balance', () => {
    expect(calculateBalance(20, 5)).toBe(15);
  });

  it('returns 0 when used exceeds accrued', () => {
    expect(calculateBalance(5, 10)).toBe(0);
  });

  it('returns full accrued when nothing used', () => {
    expect(calculateBalance(40, 0)).toBe(40);
  });

  it('throws on negative accrued', () => {
    expect(() => calculateBalance(-1, 0)).toThrow(
      'accrued must be a non-negative finite number'
    );
  });

  it('throws on negative used', () => {
    expect(() => calculateBalance(10, -1)).toThrow(
      'used must be a non-negative finite number'
    );
  });
});

describe('constants', () => {
  it('has correct accrual rate (1 per 30)', () => {
    expect(HOURS_TO_ACCRUE_PER_HOUR).toBeCloseTo(1 / 30, 10);
  });

  it('has correct historical small-employer annual use alias', () => {
    expect(MAX_ACCRUAL_SMALL_EMPLOYER).toBe(40);
  });

  it('has correct historical standard-employer annual use alias', () => {
    expect(MAX_ACCRUAL_LARGE_EMPLOYER).toBe(72);
  });
});
