import { describe, it, expect } from 'vitest';
import {
  generateCapabilityId,
  capabilityIdEquals,
  capabilityIdToString,
  parseCapabilityId,
  readOnlyRights,
  readWriteRights,
  fullAccessRights,
  executeOnlyRights,
  attenuateRights,
  hasRequiredRights,
  getMissingRights,
  defaultCapabilityFlags,
} from './capability.js';

describe('Capability', () => {
  describe('CapabilityId', () => {
    it('should generate unique capability IDs', () => {
      const id1 = generateCapabilityId(1, Date.now());
      const id2 = generateCapabilityId(2, Date.now());

      expect(id1.high).toBeDefined();
      expect(id1.low).toBeDefined();
      expect(capabilityIdEquals(id1, id2)).toBe(false);
    });

    it('should compare capability IDs for equality', () => {
      const id1 = { high: 123, low: 456 };
      const id2 = { high: 123, low: 456 };
      const id3 = { high: 123, low: 789 };

      expect(capabilityIdEquals(id1, id2)).toBe(true);
      expect(capabilityIdEquals(id1, id3)).toBe(false);
    });

    it('should convert capability ID to string and back', () => {
      const id = { high: 0x123456789abcdef0, low: 0xfedcba9876543210 };
      const str = capabilityIdToString(id);
      const parsed = parseCapabilityId(str);

      expect(parsed).not.toBeNull();
      expect(parsed?.high).toBe(id.high);
      expect(parsed?.low).toBe(id.low);
    });

    it('should return null for invalid capability ID strings', () => {
      expect(parseCapabilityId('invalid')).toBeNull();
      expect(parseCapabilityId('12345')).toBeNull();
      expect(parseCapabilityId('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toBeNull();
    });
  });

  describe('CapabilityRights', () => {
    it('should create read-only rights', () => {
      const rights = readOnlyRights();

      expect(rights.read).toBe(true);
      expect(rights.list).toBe(true);
      expect(rights.write).toBe(false);
      expect(rights.delete).toBe(false);
      expect(rights.execute).toBe(false);
      expect(rights.create).toBe(false);
      expect(rights.delegate).toBe(false);
      expect(rights.revoke).toBe(false);
    });

    it('should create read-write rights', () => {
      const rights = readWriteRights();

      expect(rights.read).toBe(true);
      expect(rights.write).toBe(true);
      expect(rights.create).toBe(true);
      expect(rights.list).toBe(true);
      expect(rights.delete).toBe(false);
      expect(rights.execute).toBe(false);
      expect(rights.delegate).toBe(false);
      expect(rights.revoke).toBe(false);
    });

    it('should create full access rights', () => {
      const rights = fullAccessRights();

      expect(rights.read).toBe(true);
      expect(rights.write).toBe(true);
      expect(rights.delete).toBe(true);
      expect(rights.execute).toBe(true);
      expect(rights.create).toBe(true);
      expect(rights.list).toBe(true);
      expect(rights.delegate).toBe(true);
      expect(rights.revoke).toBe(true);
    });

    it('should create execute-only rights', () => {
      const rights = executeOnlyRights();

      expect(rights.execute).toBe(true);
      expect(rights.read).toBe(false);
      expect(rights.write).toBe(false);
      expect(rights.delete).toBe(false);
      expect(rights.create).toBe(false);
      expect(rights.list).toBe(false);
      expect(rights.delegate).toBe(false);
      expect(rights.revoke).toBe(false);
    });
  });

  describe('attenuateRights', () => {
    it('should attenuate rights (AND operation)', () => {
      const original = fullAccessRights();
      const requested = readOnlyRights();
      const attenuated = attenuateRights(original, requested);

      expect(attenuated.read).toBe(true);
      expect(attenuated.list).toBe(true);
      expect(attenuated.write).toBe(false);
      expect(attenuated.delete).toBe(false);
    });

    it('should not increase rights', () => {
      const original = readOnlyRights();
      const requested = fullAccessRights();
      const attenuated = attenuateRights(original, requested);

      // Cannot increase rights beyond original
      expect(attenuated.read).toBe(true);
      expect(attenuated.list).toBe(true);
      expect(attenuated.write).toBe(false);
      expect(attenuated.delete).toBe(false);
      expect(attenuated.delegate).toBe(false);
    });
  });

  describe('hasRequiredRights', () => {
    it('should return true when all required rights are present', () => {
      const capability = readWriteRights();
      const required = readOnlyRights();

      expect(hasRequiredRights(capability, required)).toBe(true);
    });

    it('should return false when required rights are missing', () => {
      const capability = readOnlyRights();
      const required = readWriteRights();

      expect(hasRequiredRights(capability, required)).toBe(false);
    });

    it('should handle custom rights', () => {
      const capability = {
        ...readOnlyRights(),
        customRights: ['custom:read', 'custom:write'],
      };
      const required = {
        ...readOnlyRights(),
        customRights: ['custom:read'],
      };

      expect(hasRequiredRights(capability, required)).toBe(true);
    });
  });

  describe('getMissingRights', () => {
    it('should return empty array when all rights are present', () => {
      const capability = fullAccessRights();
      const required = readOnlyRights();

      expect(getMissingRights(capability, required)).toEqual([]);
    });

    it('should return list of missing rights', () => {
      const capability = readOnlyRights();
      const required = readWriteRights();
      const missing = getMissingRights(capability, required);

      expect(missing).toContain('write');
      expect(missing).toContain('create');
      expect(missing).not.toContain('read');
      expect(missing).not.toContain('list');
    });
  });

  describe('defaultCapabilityFlags', () => {
    it('should create default flags with all flags false', () => {
      const flags = defaultCapabilityFlags();

      expect(flags.revoked).toBe(false);
      expect(flags.ephemeral).toBe(false);
      expect(flags.inheritable).toBe(false);
      expect(flags.secureOnly).toBe(false);
      expect(flags.debugOnly).toBe(false);
      expect(flags.admin).toBe(false);
    });
  });
});
