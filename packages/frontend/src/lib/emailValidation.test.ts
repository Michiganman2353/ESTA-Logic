import { describe, it, expect } from 'vitest';
import { validateEmailFormat, isValidEmail } from './emailValidation';

describe('Email Validation', () => {
  describe('validateEmailFormat', () => {
    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@company.com',
        'admin@test.co.uk',
        'test.email+tag@example.org',
        'user_name@domain.com',
        'user-name@domain-name.com',
      ];

      validEmails.forEach(email => {
        const result = validateEmailFormat(email);
        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty or missing email', () => {
      const result1 = validateEmailFormat('');
      expect(result1.valid).toBe(false);
      expect(result1.error).toContain('required');

      const result2 = validateEmailFormat('   ');
      expect(result2.valid).toBe(false);
      expect(result2.error).toContain('required');
    });

    it('should reject emails without @ symbol', () => {
      const result = validateEmailFormat('userexample.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid email');
    });

    it('should reject emails without domain', () => {
      const result = validateEmailFormat('user@');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid email');
    });

    it('should reject emails without local part', () => {
      const result = validateEmailFormat('@example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid email');
    });

    it('should reject emails without top-level domain', () => {
      const result = validateEmailFormat('user@example');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('top-level domain');
    });

    it('should reject emails with consecutive dots', () => {
      const result = validateEmailFormat('user..name@example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('consecutive dots');
    });

    it('should reject emails that are too long', () => {
      const longLocal = 'a'.repeat(255);
      const result = validateEmailFormat(`${longLocal}@example.com`);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too long');
    });

    it('should reject disposable email addresses', () => {
      const disposableEmails = [
        'test@tempmail.com',
        'user@mailinator.com',
        'temp@10minutemail.com',
      ];

      disposableEmails.forEach(email => {
        const result = validateEmailFormat(email);
        expect(result.valid).toBe(false);
        expect(result.error).toContain('disposable');
      });
    });

    it('should trim whitespace from email', () => {
      const result = validateEmailFormat('  user@example.com  ');
      expect(result.valid).toBe(true);
    });

    it('should reject multiple @ symbols', () => {
      const result = validateEmailFormat('user@domain@example.com');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid email');
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid emails', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test@company.co.uk')).toBe(true);
    });

    it('should return false for invalid emails', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@tempmail.com')).toBe(false);
    });
  });
});
