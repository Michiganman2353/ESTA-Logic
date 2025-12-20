/**
 * Tests for Enterprise Roles and Permissions
 */

import { describe, it, expect } from 'vitest';
import {
  Roles,
  getRolePermissions,
  hasPermission,
  getRoleLevel,
  hasHigherAuthority,
} from '../roles';

describe('Enterprise Roles', () => {
  describe('Role constants', () => {
    it('should define all role types', () => {
      expect(Roles.OWNER).toBe('OWNER');
      expect(Roles.HR_ADMIN).toBe('HR_ADMIN');
      expect(Roles.MANAGER).toBe('MANAGER');
      expect(Roles.AUDITOR).toBe('AUDITOR');
      expect(Roles.EMPLOYEE).toBe('EMPLOYEE');
    });
  });

  describe('getRolePermissions', () => {
    it('should grant all permissions to OWNER', () => {
      const permissions = getRolePermissions(Roles.OWNER);

      expect(permissions.canManageOrganization).toBe(true);
      expect(permissions.canManageEmployees).toBe(true);
      expect(permissions.canViewReports).toBe(true);
      expect(permissions.canExportData).toBe(true);
      expect(permissions.canApproveRequests).toBe(true);
      expect(permissions.canViewOwnData).toBe(true);
      expect(permissions.canEditPolicies).toBe(true);
      expect(permissions.canAccessAuditLog).toBe(true);
    });

    it('should grant appropriate permissions to HR_ADMIN', () => {
      const permissions = getRolePermissions(Roles.HR_ADMIN);

      expect(permissions.canManageOrganization).toBe(false);
      expect(permissions.canManageEmployees).toBe(true);
      expect(permissions.canViewReports).toBe(true);
      expect(permissions.canExportData).toBe(true);
      expect(permissions.canApproveRequests).toBe(true);
      expect(permissions.canEditPolicies).toBe(true);
      expect(permissions.canAccessAuditLog).toBe(true);
    });

    it('should grant limited permissions to MANAGER', () => {
      const permissions = getRolePermissions(Roles.MANAGER);

      expect(permissions.canManageOrganization).toBe(false);
      expect(permissions.canManageEmployees).toBe(false);
      expect(permissions.canViewReports).toBe(true);
      expect(permissions.canApproveRequests).toBe(true);
      expect(permissions.canEditPolicies).toBe(false);
      expect(permissions.canAccessAuditLog).toBe(false);
    });

    it('should grant read-only permissions to AUDITOR', () => {
      const permissions = getRolePermissions(Roles.AUDITOR);

      expect(permissions.canManageOrganization).toBe(false);
      expect(permissions.canManageEmployees).toBe(false);
      expect(permissions.canViewReports).toBe(true);
      expect(permissions.canExportData).toBe(true);
      expect(permissions.canApproveRequests).toBe(false);
      expect(permissions.canEditPolicies).toBe(false);
      expect(permissions.canAccessAuditLog).toBe(true);
    });

    it('should grant minimal permissions to EMPLOYEE', () => {
      const permissions = getRolePermissions(Roles.EMPLOYEE);

      expect(permissions.canManageOrganization).toBe(false);
      expect(permissions.canManageEmployees).toBe(false);
      expect(permissions.canViewReports).toBe(false);
      expect(permissions.canExportData).toBe(false);
      expect(permissions.canApproveRequests).toBe(false);
      expect(permissions.canViewOwnData).toBe(true);
      expect(permissions.canEditPolicies).toBe(false);
      expect(permissions.canAccessAuditLog).toBe(false);
    });
  });

  describe('hasPermission', () => {
    it('should correctly check permissions', () => {
      expect(hasPermission(Roles.OWNER, 'canManageOrganization')).toBe(true);
      expect(hasPermission(Roles.EMPLOYEE, 'canManageOrganization')).toBe(
        false
      );
      expect(hasPermission(Roles.HR_ADMIN, 'canManageEmployees')).toBe(true);
      expect(hasPermission(Roles.MANAGER, 'canViewReports')).toBe(true);
      expect(hasPermission(Roles.AUDITOR, 'canAccessAuditLog')).toBe(true);
    });
  });

  describe('getRoleLevel', () => {
    it('should return correct hierarchy levels', () => {
      expect(getRoleLevel(Roles.OWNER)).toBe(5);
      expect(getRoleLevel(Roles.HR_ADMIN)).toBe(4);
      expect(getRoleLevel(Roles.MANAGER)).toBe(3);
      expect(getRoleLevel(Roles.AUDITOR)).toBe(2);
      expect(getRoleLevel(Roles.EMPLOYEE)).toBe(1);
    });

    it('should return 0 for unknown role', () => {
      expect(getRoleLevel('UNKNOWN' as never)).toBe(0);
    });
  });

  describe('hasHigherAuthority', () => {
    it('should correctly compare role authorities', () => {
      expect(hasHigherAuthority(Roles.OWNER, Roles.EMPLOYEE)).toBe(true);
      expect(hasHigherAuthority(Roles.HR_ADMIN, Roles.MANAGER)).toBe(true);
      expect(hasHigherAuthority(Roles.MANAGER, Roles.HR_ADMIN)).toBe(false);
      expect(hasHigherAuthority(Roles.EMPLOYEE, Roles.OWNER)).toBe(false);
      expect(hasHigherAuthority(Roles.AUDITOR, Roles.EMPLOYEE)).toBe(true);
    });

    it('should return false for equal authority levels', () => {
      expect(hasHigherAuthority(Roles.OWNER, Roles.OWNER)).toBe(false);
      expect(hasHigherAuthority(Roles.MANAGER, Roles.MANAGER)).toBe(false);
    });
  });
});
