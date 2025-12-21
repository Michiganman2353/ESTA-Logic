/**
 * Tests for centralized validation library
 */

import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidZipCode,
  isInRange,
  isNonEmptyString,
  validatePassword,
  validateRequiredFields,
} from '../index';

describe('Centralized Validation', () => {
  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.email@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('no@domain')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('MyP@ssw0rd!');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak');
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateRequiredFields', () => {
    it('should pass when all required fields are present', () => {
      const data = { name: 'John', email: 'john@example.com' };
      expect(() => {
        validateRequiredFields(data, ['name', 'email'], 'user data');
      }).not.toThrow();
    });

    it('should throw when required fields are missing', () => {
      const data = { name: 'John' };
      expect(() => {
        validateRequiredFields(data, ['name', 'email'], 'user data');
      }).toThrow(/missing required fields/);
    });
  });
});
