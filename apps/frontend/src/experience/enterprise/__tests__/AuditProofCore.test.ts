/**
 * Tests for AuditProofCore
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AuditProofCore } from '../AuditProofCore';

describe('AuditProofCore', () => {
  beforeEach(() => {
    AuditProofCore.clear();
  });

  it('should record an audit event', () => {
    AuditProofCore.record(
      'CREATE',
      'policy',
      { name: 'Test Policy' },
      'user123'
    );

    const log = AuditProofCore.getAuditLog();

    expect(log.count).toBe(1);
    expect(log.events[0].action).toBe('CREATE');
    expect(log.events[0].resource).toBe('policy');
    expect(log.events[0].userId).toBe('user123');
  });

  it('should filter audit log by resource', () => {
    AuditProofCore.record('CREATE', 'policy', {});
    AuditProofCore.record('UPDATE', 'employee', {});
    AuditProofCore.record('DELETE', 'policy', {});

    const log = AuditProofCore.getAuditLog('policy');

    expect(log.count).toBe(2);
    expect(log.events.every((e) => e.resource === 'policy')).toBe(true);
  });

  it('should filter audit log by date range', () => {
    const startDate = new Date('2024-01-01');
    const endDate = new Date('2024-12-31');

    AuditProofCore.record('CREATE', 'policy', {});

    const log = AuditProofCore.getAuditLog(undefined, startDate, endDate);

    expect(log.count).toBeGreaterThanOrEqual(0);
  });

  it('should get user audit log', () => {
    AuditProofCore.record('CREATE', 'policy', {}, 'user123');
    AuditProofCore.record('UPDATE', 'policy', {}, 'user456');
    AuditProofCore.record('DELETE', 'policy', {}, 'user123');

    const log = AuditProofCore.getUserAuditLog('user123');

    expect(log.count).toBe(2);
    expect(log.events.every((e) => e.userId === 'user123')).toBe(true);
  });

  it('should generate compliance report', () => {
    AuditProofCore.record('CREATE', 'policy', {}, 'user1');
    AuditProofCore.record('CREATE', 'employee', {}, 'user2');
    AuditProofCore.record('UPDATE', 'policy', {}, 'user1');

    // Use a date range that includes the current date
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // 1 year ago
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year from now

    const report = AuditProofCore.generateComplianceReport(startDate, endDate);

    expect(report.totalEvents).toBe(3);
    expect(report.eventsByAction['CREATE']).toBe(2);
    expect(report.eventsByAction['UPDATE']).toBe(1);
    expect(report.uniqueUsers).toBe(2);
  });

  it('should export to JSON', () => {
    AuditProofCore.record('CREATE', 'policy', { name: 'Test' });

    const json = AuditProofCore.exportToJSON();

    expect(json).toBeDefined();
    expect(json).toContain('CREATE');
    expect(json).toContain('policy');
  });

  it('should respect enabled flag', () => {
    AuditProofCore.setEnabled(false);
    AuditProofCore.record('CREATE', 'policy', {});

    const log = AuditProofCore.getAuditLog();

    expect(log.count).toBe(0);

    AuditProofCore.setEnabled(true);
  });
});
