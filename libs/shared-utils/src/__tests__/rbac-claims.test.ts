/**
 * Tests for Role-Based Access Control Claims
 */

import { describe, expect, it } from 'vitest';
import {
  UserRole,
  Permission,
  hasPermission,
  claimsHavePermission,
  claimsHaveAllPermissions,
  claimsHaveAnyPermission,
  getPermissionsForRole,
  buildUserClaims,
  canAccessTenant,
  canAccessEmployee,
  RolePermissions,
} from '../rbac-claims';

describe('Role-Based Access Control', () => {
  describe('RolePermissions', () => {
    it('should define permissions for all roles', () => {
      expect(RolePermissions[UserRole.ADMIN]).toBeDefined();
      expect(RolePermissions[UserRole.EMPLOYER]).toBeDefined();
      expect(RolePermissions[UserRole.EMPLOYEE]).toBeDefined();
      expect(RolePermissions[UserRole.AUDITOR]).toBeDefined();
      expect(RolePermissions[UserRole.SERVICE]).toBeDefined();
    });

    it('should give admin full access', () => {
      const adminPerms = RolePermissions[UserRole.ADMIN];
      expect(adminPerms).toContain(Permission.SYSTEM_CONFIG);
      expect(adminPerms).toContain(Permission.TENANT_DELETE);
      expect(adminPerms).toContain(Permission.USER_DELETE);
    });

    it('should restrict employee to self-access permissions', () => {
      const employeePerms = RolePermissions[UserRole.EMPLOYEE];

      // Employee should have self-access
      expect(employeePerms).toContain(Permission.USER_READ_SELF);
      expect(employeePerms).toContain(Permission.WORKLOG_READ_SELF);
      expect(employeePerms).toContain(Permission.REQUEST_CREATE);

      // Employee should NOT have broad access
      expect(employeePerms).not.toContain(Permission.USER_READ);
      expect(employeePerms).not.toContain(Permission.EMPLOYEE_READ);
      expect(employeePerms).not.toContain(Permission.REQUEST_APPROVE);
    });

    it('should give employer employee management permissions', () => {
      const employerPerms = RolePermissions[UserRole.EMPLOYER];

      expect(employerPerms).toContain(Permission.EMPLOYEE_CREATE);
      expect(employerPerms).toContain(Permission.EMPLOYEE_READ);
      expect(employerPerms).toContain(Permission.REQUEST_APPROVE);
      expect(employerPerms).toContain(Permission.REPORT_EXPORT);

      // Employer should NOT have system admin permissions
      expect(employerPerms).not.toContain(Permission.SYSTEM_CONFIG);
      expect(employerPerms).not.toContain(Permission.TENANT_DELETE);
    });

    it('should give auditor read-only permissions', () => {
      const auditorPerms = RolePermissions[UserRole.AUDITOR];

      // Auditor should have read and export
      expect(auditorPerms).toContain(Permission.EMPLOYEE_READ);
      expect(auditorPerms).toContain(Permission.AUDIT_READ);
      expect(auditorPerms).toContain(Permission.AUDIT_EXPORT);

      // Auditor should NOT have write permissions
      expect(auditorPerms).not.toContain(Permission.EMPLOYEE_CREATE);
      expect(auditorPerms).not.toContain(Permission.REQUEST_APPROVE);
      expect(auditorPerms).not.toContain(Permission.WORKLOG_CREATE);
    });
  });

  describe('hasPermission', () => {
    it('should return true for valid role-permission combination', () => {
      expect(hasPermission(UserRole.ADMIN, Permission.SYSTEM_CONFIG)).toBe(
        true
      );
      expect(hasPermission(UserRole.EMPLOYER, Permission.REQUEST_APPROVE)).toBe(
        true
      );
      expect(hasPermission(UserRole.EMPLOYEE, Permission.REQUEST_CREATE)).toBe(
        true
      );
    });

    it('should return false for invalid role-permission combination', () => {
      expect(hasPermission(UserRole.EMPLOYEE, Permission.REQUEST_APPROVE)).toBe(
        false
      );
      expect(hasPermission(UserRole.AUDITOR, Permission.WORKLOG_CREATE)).toBe(
        false
      );
    });
  });

  describe('buildUserClaims', () => {
    it('should build valid claims for employee', () => {
      const claims = buildUserClaims(
        'user_123',
        'employee@example.com',
        UserRole.EMPLOYEE,
        'tenant_abc',
        'employer_xyz'
      );

      expect(claims.sub).toBe('user_123');
      expect(claims.email).toBe('employee@example.com');
      expect(claims.role).toBe(UserRole.EMPLOYEE);
      expect(claims.tenantId).toBe('tenant_abc');
      expect(claims.employerId).toBe('employer_xyz');
      expect(claims.permissions).toContain(Permission.USER_READ_SELF);
      expect(claims.iat).toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
      expect(claims.exp).toBeGreaterThan(claims.iat);
    });

    it('should include signed tenant ID when provided', () => {
      const claims = buildUserClaims(
        'user_123',
        'employer@example.com',
        UserRole.EMPLOYER,
        'tenant_abc',
        undefined,
        'v1.signed.tenant.id'
      );

      expect(claims.signedTenantId).toBe('v1.signed.tenant.id');
    });
  });

  describe('claimsHavePermission', () => {
    const employeeClaims = buildUserClaims(
      'user_123',
      'employee@example.com',
      UserRole.EMPLOYEE,
      'tenant_abc'
    );

    it('should return true for granted permission', () => {
      expect(
        claimsHavePermission(employeeClaims, Permission.REQUEST_CREATE)
      ).toBe(true);
    });

    it('should return false for denied permission', () => {
      expect(
        claimsHavePermission(employeeClaims, Permission.REQUEST_APPROVE)
      ).toBe(false);
    });
  });

  describe('claimsHaveAllPermissions', () => {
    const employerClaims = buildUserClaims(
      'employer_123',
      'employer@example.com',
      UserRole.EMPLOYER,
      'tenant_abc'
    );

    it('should return true when all permissions are present', () => {
      expect(
        claimsHaveAllPermissions(employerClaims, [
          Permission.EMPLOYEE_READ,
          Permission.REQUEST_APPROVE,
        ])
      ).toBe(true);
    });

    it('should return false when any permission is missing', () => {
      expect(
        claimsHaveAllPermissions(employerClaims, [
          Permission.EMPLOYEE_READ,
          Permission.SYSTEM_CONFIG,
        ])
      ).toBe(false);
    });
  });

  describe('claimsHaveAnyPermission', () => {
    const employeeClaims = buildUserClaims(
      'user_123',
      'employee@example.com',
      UserRole.EMPLOYEE,
      'tenant_abc'
    );

    it('should return true when at least one permission is present', () => {
      expect(
        claimsHaveAnyPermission(employeeClaims, [
          Permission.SYSTEM_CONFIG,
          Permission.REQUEST_CREATE, // Employee has this
        ])
      ).toBe(true);
    });

    it('should return false when no permissions are present', () => {
      expect(
        claimsHaveAnyPermission(employeeClaims, [
          Permission.SYSTEM_CONFIG,
          Permission.REQUEST_APPROVE,
        ])
      ).toBe(false);
    });
  });

  describe('canAccessTenant', () => {
    it('should allow admin to access any tenant', () => {
      const adminClaims = buildUserClaims(
        'admin_123',
        'admin@example.com',
        UserRole.ADMIN,
        'tenant_admin'
      );

      expect(canAccessTenant(adminClaims, 'tenant_other')).toBe(true);
    });

    it('should allow employer to access own tenant only', () => {
      const employerClaims = buildUserClaims(
        'employer_123',
        'employer@example.com',
        UserRole.EMPLOYER,
        'tenant_abc'
      );

      expect(canAccessTenant(employerClaims, 'tenant_abc')).toBe(true);
      expect(canAccessTenant(employerClaims, 'tenant_other')).toBe(false);
    });

    it('should restrict employee to own tenant', () => {
      const employeeClaims = buildUserClaims(
        'user_123',
        'employee@example.com',
        UserRole.EMPLOYEE,
        'tenant_abc'
      );

      expect(canAccessTenant(employeeClaims, 'tenant_abc')).toBe(true);
      expect(canAccessTenant(employeeClaims, 'tenant_other')).toBe(false);
    });
  });

  describe('canAccessEmployee', () => {
    it('should allow self-access', () => {
      const employeeClaims = buildUserClaims(
        'user_123',
        'employee@example.com',
        UserRole.EMPLOYEE,
        'tenant_abc'
      );

      expect(canAccessEmployee(employeeClaims, 'user_123')).toBe(true);
    });

    it('should allow employer to access employees', () => {
      const employerClaims = buildUserClaims(
        'employer_123',
        'employer@example.com',
        UserRole.EMPLOYER,
        'tenant_abc'
      );

      expect(canAccessEmployee(employerClaims, 'other_user')).toBe(true);
    });

    it('should deny employee access to other employees', () => {
      const employeeClaims = buildUserClaims(
        'user_123',
        'employee@example.com',
        UserRole.EMPLOYEE,
        'tenant_abc'
      );

      expect(canAccessEmployee(employeeClaims, 'other_user')).toBe(false);
    });
  });
});
