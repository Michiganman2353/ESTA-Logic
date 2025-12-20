/**
 * Tests for TrustEngine
 */

import { describe, it, expect } from 'vitest';
import { TrustEngine } from '../TrustEngine';

describe('TrustEngine', () => {
  it('should return all trust signals as true', () => {
    const signals = TrustEngine.getTrustSignals();

    expect(signals.encryption).toBe(true);
    expect(signals.complianceBacked).toBe(true);
    expect(signals.auditReady).toBe(true);
    expect(signals.timestamped).toBe(true);
    expect(signals.legalAligned).toBe(true);
  });

  it('should accept optional user context', () => {
    const userContext = {
      employeeCount: 25,
      industry: 'Healthcare',
    };

    const signals = TrustEngine.getTrustSignals(userContext);

    expect(signals).toBeDefined();
    expect(signals.encryption).toBe(true);
  });

  it('should return high trust level for all signals true', () => {
    const signals = TrustEngine.getTrustSignals();
    const level = TrustEngine.getTrustLevel(signals);

    expect(level).toBe('high');
  });

  it('should return medium trust level for partial signals', () => {
    const signals = {
      encryption: true,
      complianceBacked: true,
      auditReady: false,
      timestamped: false,
      legalAligned: false,
    };

    const level = TrustEngine.getTrustLevel(signals);

    expect(level).toBe('medium');
  });

  it('should return low trust level for few signals', () => {
    const signals = {
      encryption: true,
      complianceBacked: false,
      auditReady: false,
      timestamped: false,
      legalAligned: false,
    };

    const level = TrustEngine.getTrustLevel(signals);

    expect(level).toBe('low');
  });

  it('should calculate trust score correctly', () => {
    const signals = TrustEngine.getTrustSignals();
    const score = TrustEngine.getTrustScore(signals);

    expect(score).toBe(100);
  });

  it('should calculate partial trust score', () => {
    const signals = {
      encryption: true,
      complianceBacked: true,
      auditReady: true,
      timestamped: false,
      legalAligned: false,
    };

    const score = TrustEngine.getTrustScore(signals);

    expect(score).toBe(60);
  });
});
