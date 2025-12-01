/**
 * Tests for Signed Tenant Identifier System
 */

import { describe, expect, it } from 'vitest';
import {
  signTenantId,
  verifyTenantId,
  generateSecureTenantId,
  deriveTenantScope,
  isLegacyEmployerCode,
  isSignedTenantId,
} from '../tenant-identifier';

describe('Signed Tenant Identifier System', () => {
  // 32-byte secret key for tests (exactly 32 characters)
  const TEST_SECRET = 'this-is-a-32-byte-secret-key!!!!';

  describe('signTenantId', () => {
    it('should generate a valid signed tenant identifier', () => {
      const signedId = signTenantId('tenant_abc123', {
        secretKey: TEST_SECRET,
      });

      expect(signedId).toBeDefined();
      expect(signedId.startsWith('v1.')).toBe(true);
      expect(signedId.split('.').length).toBe(4);
    });

    it('should generate different signatures for different tenants', () => {
      const signedId1 = signTenantId('tenant_abc123', {
        secretKey: TEST_SECRET,
      });
      const signedId2 = signTenantId('tenant_xyz789', {
        secretKey: TEST_SECRET,
      });

      expect(signedId1).not.toBe(signedId2);
    });

    it('should throw error for short secret keys', () => {
      expect(() =>
        signTenantId('tenant_abc123', {
          secretKey: 'short',
        })
      ).toThrow('Secret key must be at least 32 bytes');
    });

    it('should accept Buffer as secret key', () => {
      const signedId = signTenantId('tenant_abc123', {
        secretKey: Buffer.from(TEST_SECRET),
      });

      expect(signedId).toBeDefined();
    });
  });

  describe('verifyTenantId', () => {
    it('should verify a valid signed tenant identifier', () => {
      const signedId = signTenantId('tenant_abc123', {
        secretKey: TEST_SECRET,
      });

      const result = verifyTenantId(signedId, {
        secretKey: TEST_SECRET,
      });

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.tenantId).toBe('tenant_abc123');
        expect(result.issuedAt).toBeLessThanOrEqual(Date.now());
      }
    });

    it('should reject tampered signature', () => {
      const signedId = signTenantId('tenant_abc123', {
        secretKey: TEST_SECRET,
      });

      // Tamper with the signature
      const parts = signedId.split('.');
      parts[3] = 'tampered' + parts[3]?.substring(8);
      const tamperedId = parts.join('.');

      const result = verifyTenantId(tamperedId, {
        secretKey: TEST_SECRET,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(['invalid_signature', 'tampering_detected']).toContain(
          result.error
        );
      }
    });

    it('should reject expired tokens', () => {
      const signedId = signTenantId('tenant_abc123', {
        secretKey: TEST_SECRET,
      });

      const result = verifyTenantId(signedId, {
        secretKey: TEST_SECRET,
        expirationMs: -1, // Already expired
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('expired');
      }
    });

    it('should reject invalid format', () => {
      const result = verifyTenantId('invalid-format', {
        secretKey: TEST_SECRET,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('invalid_format');
      }
    });

    it('should reject wrong secret key', () => {
      const signedId = signTenantId('tenant_abc123', {
        secretKey: TEST_SECRET,
      });

      const result = verifyTenantId(signedId, {
        secretKey: 'wrong-32-byte-secret-key!!!!----',
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.error).toBe('invalid_signature');
      }
    });
  });

  describe('generateSecureTenantId', () => {
    it('should generate a tenant ID with default prefix', () => {
      const tenantId = generateSecureTenantId();

      expect(tenantId).toMatch(/^tenant_[a-f0-9]{32}$/);
    });

    it('should generate a tenant ID with custom prefix', () => {
      const tenantId = generateSecureTenantId('org');

      expect(tenantId).toMatch(/^org_[a-f0-9]{32}$/);
    });

    it('should generate unique IDs', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        ids.add(generateSecureTenantId());
      }

      expect(ids.size).toBe(100);
    });
  });

  describe('deriveTenantScope', () => {
    it('should derive a scoped identifier', () => {
      const scope = deriveTenantScope(
        'tenant_abc123',
        'employees',
        TEST_SECRET
      );

      expect(scope).toMatch(/^employees_[a-f0-9]{24}$/);
    });

    it('should generate consistent results for same input', () => {
      const scope1 = deriveTenantScope(
        'tenant_abc123',
        'employees',
        TEST_SECRET
      );
      const scope2 = deriveTenantScope(
        'tenant_abc123',
        'employees',
        TEST_SECRET
      );

      expect(scope1).toBe(scope2);
    });

    it('should generate different results for different tenants', () => {
      const scope1 = deriveTenantScope(
        'tenant_abc123',
        'employees',
        TEST_SECRET
      );
      const scope2 = deriveTenantScope(
        'tenant_xyz789',
        'employees',
        TEST_SECRET
      );

      expect(scope1).not.toBe(scope2);
    });

    it('should generate different results for different scopes', () => {
      const scope1 = deriveTenantScope(
        'tenant_abc123',
        'employees',
        TEST_SECRET
      );
      const scope2 = deriveTenantScope(
        'tenant_abc123',
        'timesheets',
        TEST_SECRET
      );

      expect(scope1).not.toBe(scope2);
    });
  });

  describe('isLegacyEmployerCode', () => {
    it('should detect 4-digit codes', () => {
      expect(isLegacyEmployerCode('1234')).toBe(true);
      expect(isLegacyEmployerCode('0001')).toBe(true);
      expect(isLegacyEmployerCode('9999')).toBe(true);
    });

    it('should reject non-4-digit values', () => {
      expect(isLegacyEmployerCode('123')).toBe(false);
      expect(isLegacyEmployerCode('12345')).toBe(false);
      expect(isLegacyEmployerCode('abcd')).toBe(false);
      expect(isLegacyEmployerCode('v1.abc.xyz.sig')).toBe(false);
    });
  });

  describe('isSignedTenantId', () => {
    it('should detect signed tenant IDs', () => {
      const signedId = signTenantId('tenant_abc123', {
        secretKey: TEST_SECRET,
      });

      expect(isSignedTenantId(signedId)).toBe(true);
    });

    it('should reject legacy codes', () => {
      expect(isSignedTenantId('1234')).toBe(false);
      expect(isSignedTenantId('ABCD1234')).toBe(false);
    });

    it('should reject malformed signed IDs', () => {
      expect(isSignedTenantId('v1.abc.xyz')).toBe(false); // Missing signature
      expect(isSignedTenantId('abc.def.ghi.jkl')).toBe(false); // Missing version
    });
  });
});
