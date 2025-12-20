/**
 * Tests for PersonalizationEngine
 */

import { describe, it, expect } from 'vitest';
import { PersonalizationEngine } from '../PersonalizationEngine';

describe('PersonalizationEngine', () => {
  it('should derive simple profile for small business', () => {
    const data = {
      employeeCount: 5,
      industry: 'Retail',
    };

    const profile = PersonalizationEngine.deriveProfile(data);

    expect(profile.size).toBe(5);
    expect(profile.industry).toBe('Retail');
    expect(profile.complexityLevel).toBe('simple');
    expect(profile.experienceLevel).toBe('beginner');
  });

  it('should derive standard profile for medium business', () => {
    const data = {
      employeeCount: 25,
      industry: 'Healthcare',
    };

    const profile = PersonalizationEngine.deriveProfile(data);

    expect(profile.complexityLevel).toBe('standard');
    expect(profile.experienceLevel).toBe('intermediate');
  });

  it('should derive enterprise profile for large business', () => {
    const data = {
      employeeCount: 100,
      industry: 'Manufacturing',
    };

    const profile = PersonalizationEngine.deriveProfile(data);

    expect(profile.complexityLevel).toBe('enterprise');
  });

  it('should personalize flow for enterprise profile', () => {
    const profile = {
      size: 100,
      complexityLevel: 'enterprise' as const,
      experienceLevel: 'intermediate' as const,
      needsGuidance: true,
    };

    const flow = PersonalizationEngine.personalizeFlow(profile);

    expect(flow).toBe('enterprisePath');
  });

  it('should personalize flow for simple profile', () => {
    const profile = {
      size: 5,
      complexityLevel: 'simple' as const,
      experienceLevel: 'advanced' as const,
      needsGuidance: false,
    };

    const flow = PersonalizationEngine.personalizeFlow(profile);

    expect(flow).toBe('quickPath');
  });

  it('should get recommended steps for enterprise', () => {
    const profile = {
      size: 100,
      complexityLevel: 'enterprise' as const,
      experienceLevel: 'intermediate' as const,
      needsGuidance: true,
    };

    const steps = PersonalizationEngine.getRecommendedSteps(profile);

    expect(steps).toContain('locations');
    expect(steps).toContain('integration');
  });

  it('should get industry customization for healthcare', () => {
    const customization =
      PersonalizationEngine.getIndustryCustomization('healthcare');

    expect(customization.language).toBe('healthcare-specific');
    expect(customization.examples).toContain('nurses');
  });

  it('should get generic customization for unknown industry', () => {
    const customization =
      PersonalizationEngine.getIndustryCustomization('unknown');

    expect(customization.language).toBe('general');
    expect(customization.examples).toContain('employees');
  });
});
