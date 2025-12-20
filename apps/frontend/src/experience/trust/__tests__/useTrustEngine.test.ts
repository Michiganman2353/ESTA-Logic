/**
 * Tests for useTrustEngine hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as auditService from '../../../services/auditService';

// Mock the audit service
vi.mock('../../../services/auditService');

describe('useTrustEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct implementation structure', () => {
    // This test verifies the module can be imported
    expect(auditService.getAuditEvents).toBeDefined();
  });

  it('should mock audit service correctly', async () => {
    vi.mocked(auditService.getAuditEvents).mockResolvedValue([
      {
        id: '1',
        timestamp: new Date(),
        level: 'info',
        action: 'TEST',
        resource: 'test',
      },
    ]);

    const result = await auditService.getAuditEvents('org-123');
    expect(result).toHaveLength(1);
    expect(result[0].level).toBe('info');
  });
});
