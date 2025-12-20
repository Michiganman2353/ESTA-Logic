/**
 * Tests for determineOrgProfile function
 */

import { describe, it, expect } from 'vitest';
import { determineOrgProfile } from '../PersonalizationEngine';

describe('determineOrgProfile', () => {
  it('should classify small organization correctly', () => {
    const profile = determineOrgProfile({
      employeeCount: 10,
      industry: 'Retail',
    });

    expect(profile.tier).toBe('SMALL');
    expect(profile.riskLevel).toBe('LOW');
    expect(profile.complianceExpectation).toBe('Standard compliance adherence');
  });

  it('should classify medium organization correctly', () => {
    const profile = determineOrgProfile({
      employeeCount: 100,
      industry: 'Healthcare',
    });

    expect(profile.tier).toBe('MEDIUM');
    expect(profile.riskLevel).toBe('MODERATE');
    expect(profile.complianceExpectation).toBe('Standard compliance adherence');
  });

  it('should classify enterprise organization correctly', () => {
    const profile = determineOrgProfile({
      employeeCount: 500,
      industry: 'Manufacturing',
    });

    expect(profile.tier).toBe('ENTERPRISE');
    expect(profile.riskLevel).toBe('HIGH');
    expect(profile.complianceExpectation).toBe(
      'High scrutiny, strict documentation requirements'
    );
  });

  it('should handle boundary case at 50 employees (MEDIUM)', () => {
    const profile = determineOrgProfile({
      employeeCount: 50,
    });

    expect(profile.tier).toBe('MEDIUM');
    expect(profile.riskLevel).toBe('MODERATE');
  });

  it('should handle boundary case at 250 employees (ENTERPRISE)', () => {
    const profile = determineOrgProfile({
      employeeCount: 250,
    });

    expect(profile.tier).toBe('ENTERPRISE');
    expect(profile.riskLevel).toBe('HIGH');
  });

  it('should work without industry parameter', () => {
    const profile = determineOrgProfile({
      employeeCount: 25,
    });

    expect(profile.tier).toBe('SMALL');
    expect(profile.riskLevel).toBe('LOW');
  });

  it('should handle edge case with 1 employee', () => {
    const profile = determineOrgProfile({
      employeeCount: 1,
    });

    expect(profile.tier).toBe('SMALL');
    expect(profile.riskLevel).toBe('LOW');
  });

  it('should handle very large organization', () => {
    const profile = determineOrgProfile({
      employeeCount: 10000,
    });

    expect(profile.tier).toBe('ENTERPRISE');
    expect(profile.riskLevel).toBe('HIGH');
  });
});
