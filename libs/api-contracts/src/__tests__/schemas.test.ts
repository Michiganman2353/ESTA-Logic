/**
 * API Contracts Schema Validation Tests
 * 
 * Ensures all contract schemas correctly validate expected data
 */

import { describe, it, expect } from 'vitest';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  RegisterEmployeeRequestSchema,
  RegisterManagerRequestSchema,
  UserDtoSchema,
} from '../v1/auth.js';
import {
  AccrualBalanceDtoSchema,
  WorkLogDtoSchema,
  LogWorkHoursRequestSchema,
} from '../v1/accrual.js';
import {
  SickTimeRequestDtoSchema,
  CreateRequestRequestSchema,
} from '../v1/requests.js';

describe('Auth Contract Schemas', () => {
  describe('LoginRequestSchema', () => {
    it('should accept valid login request with password', () => {
      const valid = {
        email: 'user@example.com',
        password: 'password123',
      };
      expect(() => LoginRequestSchema.parse(valid)).not.toThrow();
    });

    it('should accept valid login request with idToken', () => {
      const valid = {
        email: 'user@example.com',
        idToken: 'firebase-id-token',
      };
      expect(() => LoginRequestSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'not-an-email',
        password: 'password123',
      };
      expect(() => LoginRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe('UserDtoSchema', () => {
    it('should accept valid user DTO', () => {
      const valid = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'employee',
        employerSize: 'small',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(() => UserDtoSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid role', () => {
      const invalid = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'invalid-role',
        employerSize: 'small',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      };
      expect(() => UserDtoSchema.parse(invalid)).toThrow();
    });
  });

  describe('RegisterEmployeeRequestSchema', () => {
    it('should accept valid employee registration', () => {
      const valid = {
        email: 'employee@example.com',
        password: 'securePassword123',
        name: 'Jane Doe',
      };
      expect(() => RegisterEmployeeRequestSchema.parse(valid)).not.toThrow();
    });

    it('should reject password shorter than 8 characters', () => {
      const invalid = {
        email: 'employee@example.com',
        password: 'short',
        name: 'Jane Doe',
      };
      expect(() => RegisterEmployeeRequestSchema.parse(invalid)).toThrow();
    });
  });

  describe('RegisterManagerRequestSchema', () => {
    it('should accept valid manager registration', () => {
      const valid = {
        email: 'manager@example.com',
        password: 'securePassword123',
        name: 'John Manager',
        companyName: 'Acme Corp',
        employeeCount: 15,
      };
      expect(() => RegisterManagerRequestSchema.parse(valid)).not.toThrow();
    });

    it('should reject negative employee count', () => {
      const invalid = {
        email: 'manager@example.com',
        password: 'securePassword123',
        name: 'John Manager',
        companyName: 'Acme Corp',
        employeeCount: 0,
      };
      expect(() => RegisterManagerRequestSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Accrual Contract Schemas', () => {
  describe('AccrualBalanceDtoSchema', () => {
    it('should accept valid accrual balance', () => {
      const valid = {
        userId: 'user-123',
        yearlyAccrued: 40,
        paidHoursUsed: 10,
        unpaidHoursUsed: 0,
        carryoverHours: 5,
        availablePaidHours: 35,
        availableUnpaidHours: 0,
        year: 2024,
      };
      expect(() => AccrualBalanceDtoSchema.parse(valid)).not.toThrow();
    });

    it('should reject negative hours', () => {
      const invalid = {
        userId: 'user-123',
        yearlyAccrued: -5,
        paidHoursUsed: 10,
        unpaidHoursUsed: 0,
        carryoverHours: 5,
        availablePaidHours: 35,
        availableUnpaidHours: 0,
        year: 2024,
      };
      expect(() => AccrualBalanceDtoSchema.parse(invalid)).toThrow();
    });
  });

  describe('LogWorkHoursRequestSchema', () => {
    it('should accept valid work hours log', () => {
      const valid = {
        userId: 'user-123',
        hours: 8,
        date: '2024-01-01T09:00:00.000Z',
        source: 'manual',
      };
      expect(() => LogWorkHoursRequestSchema.parse(valid)).not.toThrow();
    });

    it('should reject more than 24 hours', () => {
      const invalid = {
        userId: 'user-123',
        hours: 25,
        date: '2024-01-01T09:00:00.000Z',
        source: 'manual',
      };
      expect(() => LogWorkHoursRequestSchema.parse(invalid)).toThrow();
    });
  });
});

describe('Request Contract Schemas', () => {
  describe('CreateRequestRequestSchema', () => {
    it('should accept valid sick time request', () => {
      const valid = {
        hours: 8,
        isPaid: true,
        category: 'illness',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-01T23:59:59.000Z',
        reason: 'Flu symptoms',
      };
      expect(() => CreateRequestRequestSchema.parse(valid)).not.toThrow();
    });

    it('should reject more than 72 hours', () => {
      const invalid = {
        hours: 80,
        isPaid: true,
        category: 'illness',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-10T23:59:59.000Z',
      };
      expect(() => CreateRequestRequestSchema.parse(invalid)).toThrow();
    });

    it('should reject invalid category', () => {
      const invalid = {
        hours: 8,
        isPaid: true,
        category: 'vacation',
        startDate: '2024-01-01T00:00:00.000Z',
        endDate: '2024-01-01T23:59:59.000Z',
      };
      expect(() => CreateRequestRequestSchema.parse(invalid)).toThrow();
    });
  });
});
