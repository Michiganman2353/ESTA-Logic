/**
 * Enterprise Roles - Role-based access control definitions
 * Defines permission tiers for multi-tenant enterprise governance
 */

export const Roles = {
  OWNER: 'OWNER',
  HR_ADMIN: 'HR_ADMIN',
  MANAGER: 'MANAGER',
  AUDITOR: 'AUDITOR',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export type RoleType = (typeof Roles)[keyof typeof Roles];

export interface RolePermissions {
  canManageOrganization: boolean;
  canManageEmployees: boolean;
  canViewReports: boolean;
  canExportData: boolean;
  canApproveRequests: boolean;
  canViewOwnData: boolean;
  canEditPolicies: boolean;
  canAccessAuditLog: boolean;
}

/**
 * Get permissions for a specific role
 */
export function getRolePermissions(role: RoleType): RolePermissions {
  switch (role) {
    case Roles.OWNER:
      return {
        canManageOrganization: true,
        canManageEmployees: true,
        canViewReports: true,
        canExportData: true,
        canApproveRequests: true,
        canViewOwnData: true,
        canEditPolicies: true,
        canAccessAuditLog: true,
      };

    case Roles.HR_ADMIN:
      return {
        canManageOrganization: false,
        canManageEmployees: true,
        canViewReports: true,
        canExportData: true,
        canApproveRequests: true,
        canViewOwnData: true,
        canEditPolicies: true,
        canAccessAuditLog: true,
      };

    case Roles.MANAGER:
      return {
        canManageOrganization: false,
        canManageEmployees: false,
        canViewReports: true,
        canExportData: false,
        canApproveRequests: true,
        canViewOwnData: true,
        canEditPolicies: false,
        canAccessAuditLog: false,
      };

    case Roles.AUDITOR:
      return {
        canManageOrganization: false,
        canManageEmployees: false,
        canViewReports: true,
        canExportData: true,
        canApproveRequests: false,
        canViewOwnData: true,
        canEditPolicies: false,
        canAccessAuditLog: true,
      };

    case Roles.EMPLOYEE:
    default:
      return {
        canManageOrganization: false,
        canManageEmployees: false,
        canViewReports: false,
        canExportData: false,
        canApproveRequests: false,
        canViewOwnData: true,
        canEditPolicies: false,
        canAccessAuditLog: false,
      };
  }
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: RoleType,
  permission: keyof RolePermissions
): boolean {
  const permissions = getRolePermissions(role);
  return permissions[permission];
}

/**
 * Get role hierarchy level (higher number = more permissions)
 */
export function getRoleLevel(role: RoleType): number {
  switch (role) {
    case Roles.OWNER:
      return 5;
    case Roles.HR_ADMIN:
      return 4;
    case Roles.MANAGER:
      return 3;
    case Roles.AUDITOR:
      return 2;
    case Roles.EMPLOYEE:
      return 1;
    default:
      return 0;
  }
}

/**
 * Check if role A has higher authority than role B
 */
export function hasHigherAuthority(roleA: RoleType, roleB: RoleType): boolean {
  return getRoleLevel(roleA) > getRoleLevel(roleB);
}
