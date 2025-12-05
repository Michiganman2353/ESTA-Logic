/**
 * Microkernel Loader Tests
 */

import { describe, it, expect } from 'vitest';
import {
  createMockMicrokernel,
  DEFAULT_KERNEL_PATH,
  type AccrualResult,
} from './microkernel.js';

describe('Microkernel Mock', () => {
  const kernel = createMockMicrokernel();

  describe('version', () => {
    it('returns version string', () => {
      const version = kernel.version();
      expect(version).toContain('ESTA-Logic Gleam Microkernel');
      expect(version).toContain('v0.1.0');
    });
  });

  describe('compute_accrual', () => {
    it('calculates 1 hour per 30 hours worked', () => {
      expect(kernel.compute_accrual(30)).toBe(1);
      expect(kernel.compute_accrual(60)).toBe(2);
      expect(kernel.compute_accrual(90)).toBe(3);
    });

    it('floors partial hours', () => {
      expect(kernel.compute_accrual(29)).toBe(0);
      expect(kernel.compute_accrual(59)).toBe(1);
    });

    it('handles zero hours', () => {
      expect(kernel.compute_accrual(0)).toBe(0);
    });
  });

  describe('employer_cap', () => {
    it('returns 40 hours for small employers (<=10)', () => {
      expect(kernel.employer_cap(1)).toBe(40);
      expect(kernel.employer_cap(10)).toBe(40);
    });

    it('returns 72 hours for large employers (>10)', () => {
      expect(kernel.employer_cap(11)).toBe(72);
      expect(kernel.employer_cap(100)).toBe(72);
    });
  });

  describe('calculate_with_cap', () => {
    it('calculates accrual under cap', () => {
      const result = kernel.calculate_with_cap(300, 15);
      expect(result.hours_accrued).toBe(10); // 300 / 30
      expect(result.cap).toBe(72); // Large employer
      expect(result.total).toBe(10); // Under cap
    });

    it('enforces cap for small employers', () => {
      const result = kernel.calculate_with_cap(1500, 5);
      expect(result.hours_accrued).toBe(50); // 1500 / 30
      expect(result.cap).toBe(40); // Small employer
      expect(result.total).toBe(40); // Capped
    });

    it('enforces cap for large employers', () => {
      const result = kernel.calculate_with_cap(3000, 50);
      expect(result.hours_accrued).toBe(100); // 3000 / 30
      expect(result.cap).toBe(72); // Large employer
      expect(result.total).toBe(72); // Capped
    });
  });
});

describe('Module Constants', () => {
  it('exports default kernel path', () => {
    expect(DEFAULT_KERNEL_PATH).toBe('/logic/wasm_build/index.mjs');
  });
});
