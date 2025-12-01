/**
 * Role-Based Access Control (RBAC) Claims
 *
 * Implements least-privilege access model for ESTA Tracker.
 * Each role has explicitly defined permissions - no ambient authority.
 *
 * @module rbac-claims
 */

import { z } from 'zod';

// ============================================================================
// SECTION 1: ROLE DEFINITIONS
// ============================================================================

/**
 * User roles in the ESTA system
 */
export const UserRole = {
  /** System administrator with full access */
  ADMIN: 'admin',
  /** Employer/Manager with tenant management rights */
  EMPLOYER: 'employer',
  /** Regular employee with limited access */
  EMPLOYEE: 'employee',
  /** Read-only auditor role */
  AUDITOR: 'auditor',
  /** Service account for backend operations */
  SERVICE: 'service',
} as const;

export type UserRoleType = (typeof UserRole)[keyof typeof UserRole];

/** Zod schema for UserRole */
export const UserRoleSchema = z.enum([
  UserRole.ADMIN,
  UserRole.EMPLOYER,
  UserRole.EMPLOYEE,
  UserRole.AUDITOR,
  UserRole.SERVICE,
]);

// ============================================================================
// SECTION 2: PERMISSION DEFINITIONS
// ============================================================================

/**
 * Fine-grained permissions for resources
 */
export const Permission = {
  // User management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_READ_SELF: 'user:read:self',
  USER_UPDATE_SELF: 'user:update:self',

  // Employee management
  EMPLOYEE_CREATE: 'employee:create',
  EMPLOYEE_READ: 'employee:read',
  EMPLOYEE_UPDATE: 'employee:update',
  EMPLOYEE_DELETE: 'employee:delete',
  EMPLOYEE_READ_SELF: 'employee:read:self',

  // Work logs
  WORKLOG_CREATE: 'worklog:create',
  WORKLOG_READ: 'worklog:read',
  WORKLOG_UPDATE: 'worklog:update',
  WORKLOG_DELETE: 'worklog:delete',
  WORKLOG_READ_SELF: 'worklog:read:self',

  // Sick time requests
  REQUEST_CREATE: 'request:create',
  REQUEST_READ: 'request:read',
  REQUEST_UPDATE: 'request:update',
  REQUEST_APPROVE: 'request:approve',
  REQUEST_DENY: 'request:deny',
  REQUEST_READ_SELF: 'request:read:self',

  // Accrual data
  ACCRUAL_READ: 'accrual:read',
  ACCRUAL_CALCULATE: 'accrual:calculate',
  ACCRUAL_READ_SELF: 'accrual:read:self',

  // Tenant/Employer management
  TENANT_CREATE: 'tenant:create',
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',

  // Audit logs
  AUDIT_READ: 'audit:read',
  AUDIT_CREATE: 'audit:create',
  AUDIT_EXPORT: 'audit:export',

  // Reports
  REPORT_READ: 'report:read',
  REPORT_CREATE: 'report:create',
  REPORT_EXPORT: 'report:export',

  // System administration
  SYSTEM_CONFIG: 'system:config',
  SYSTEM_METRICS: 'system:metrics',
  SYSTEM_MAINTENANCE: 'system:maintenance',
} as const;

export type PermissionType = (typeof Permission)[keyof typeof Permission];

/** Zod schema for Permission */
export const PermissionSchema = z.enum([
  Permission.USER_CREATE,
  Permission.USER_READ,
  Permission.USER_UPDATE,
  Permission.USER_DELETE,
  Permission.USER_READ_SELF,
  Permission.USER_UPDATE_SELF,
  Permission.EMPLOYEE_CREATE,
  Permission.EMPLOYEE_READ,
  Permission.EMPLOYEE_UPDATE,
  Permission.EMPLOYEE_DELETE,
  Permission.EMPLOYEE_READ_SELF,
  Permission.WORKLOG_CREATE,
  Permission.WORKLOG_READ,
  Permission.WORKLOG_UPDATE,
  Permission.WORKLOG_DELETE,
  Permission.WORKLOG_READ_SELF,
  Permission.REQUEST_CREATE,
  Permission.REQUEST_READ,
  Permission.REQUEST_UPDATE,
  Permission.REQUEST_APPROVE,
  Permission.REQUEST_DENY,
  Permission.REQUEST_READ_SELF,
  Permission.ACCRUAL_READ,
  Permission.ACCRUAL_CALCULATE,
  Permission.ACCRUAL_READ_SELF,
  Permission.TENANT_CREATE,
  Permission.TENANT_READ,
  Permission.TENANT_UPDATE,
  Permission.TENANT_DELETE,
  Permission.AUDIT_READ,
  Permission.AUDIT_CREATE,
  Permission.AUDIT_EXPORT,
  Permission.REPORT_READ,
  Permission.REPORT_CREATE,
  Permission.REPORT_EXPORT,
  Permission.SYSTEM_CONFIG,
  Permission.SYSTEM_METRICS,
  Permission.SYSTEM_MAINTENANCE,
]);

// ============================================================================
// SECTION 3: ROLE-PERMISSION MAPPING
// ============================================================================

/**
 * Role to permissions mapping
 *
 * Follows least-privilege principle:
 * - Each role gets minimum permissions needed
 * - Self-access permissions for personal data
 * - No implicit inheritance (permissions are explicit)
 */
export const RolePermissions: Record<UserRoleType, readonly PermissionType[]> =
  {
    [UserRole.ADMIN]: [
      // Full access to all resources
      Permission.USER_CREATE,
      Permission.USER_READ,
      Permission.USER_UPDATE,
      Permission.USER_DELETE,
      Permission.USER_READ_SELF,
      Permission.USER_UPDATE_SELF,
      Permission.EMPLOYEE_CREATE,
      Permission.EMPLOYEE_READ,
      Permission.EMPLOYEE_UPDATE,
      Permission.EMPLOYEE_DELETE,
      Permission.EMPLOYEE_READ_SELF,
      Permission.WORKLOG_CREATE,
      Permission.WORKLOG_READ,
      Permission.WORKLOG_UPDATE,
      Permission.WORKLOG_DELETE,
      Permission.WORKLOG_READ_SELF,
      Permission.REQUEST_CREATE,
      Permission.REQUEST_READ,
      Permission.REQUEST_UPDATE,
      Permission.REQUEST_APPROVE,
      Permission.REQUEST_DENY,
      Permission.REQUEST_READ_SELF,
      Permission.ACCRUAL_READ,
      Permission.ACCRUAL_CALCULATE,
      Permission.ACCRUAL_READ_SELF,
      Permission.TENANT_CREATE,
      Permission.TENANT_READ,
      Permission.TENANT_UPDATE,
      Permission.TENANT_DELETE,
      Permission.AUDIT_READ,
      Permission.AUDIT_CREATE,
      Permission.AUDIT_EXPORT,
      Permission.REPORT_READ,
      Permission.REPORT_CREATE,
      Permission.REPORT_EXPORT,
      Permission.SYSTEM_CONFIG,
      Permission.SYSTEM_METRICS,
      Permission.SYSTEM_MAINTENANCE,
    ],

    [UserRole.EMPLOYER]: [
      // Employer/Manager: Manage employees, approve requests, view reports
      Permission.USER_READ_SELF,
      Permission.USER_UPDATE_SELF,
      Permission.EMPLOYEE_CREATE,
      Permission.EMPLOYEE_READ,
      Permission.EMPLOYEE_UPDATE,
      // Note: No EMPLOYEE_DELETE - employees are deactivated, not deleted
      Permission.WORKLOG_CREATE,
      Permission.WORKLOG_READ,
      Permission.WORKLOG_UPDATE,
      Permission.WORKLOG_DELETE,
      Permission.WORKLOG_READ_SELF,
      Permission.REQUEST_READ,
      Permission.REQUEST_APPROVE,
      Permission.REQUEST_DENY,
      Permission.REQUEST_READ_SELF,
      Permission.ACCRUAL_READ,
      Permission.ACCRUAL_CALCULATE,
      Permission.ACCRUAL_READ_SELF,
      Permission.TENANT_READ,
      Permission.TENANT_UPDATE,
      Permission.AUDIT_READ,
      Permission.AUDIT_CREATE,
      Permission.REPORT_READ,
      Permission.REPORT_CREATE,
      Permission.REPORT_EXPORT,
    ],

    [UserRole.EMPLOYEE]: [
      // Employee: View own data, submit requests
      Permission.USER_READ_SELF,
      Permission.USER_UPDATE_SELF,
      Permission.EMPLOYEE_READ_SELF,
      Permission.WORKLOG_READ_SELF,
      Permission.REQUEST_CREATE,
      Permission.REQUEST_READ_SELF,
      Permission.ACCRUAL_READ_SELF,
      Permission.AUDIT_CREATE, // Implicit - for activity logging
    ],

    [UserRole.AUDITOR]: [
      // Auditor: Read-only access for compliance audits
      Permission.USER_READ_SELF,
      Permission.EMPLOYEE_READ,
      Permission.WORKLOG_READ,
      Permission.REQUEST_READ,
      Permission.ACCRUAL_READ,
      Permission.TENANT_READ,
      Permission.AUDIT_READ,
      Permission.AUDIT_EXPORT,
      Permission.REPORT_READ,
      Permission.REPORT_EXPORT,
    ],

    [UserRole.SERVICE]: [
      // Service account: Backend operations only
      Permission.EMPLOYEE_READ,
      Permission.WORKLOG_CREATE,
      Permission.WORKLOG_READ,
      Permission.ACCRUAL_READ,
      Permission.ACCRUAL_CALCULATE,
      Permission.AUDIT_CREATE,
      Permission.SYSTEM_METRICS,
    ],
  } as const;

// ============================================================================
// SECTION 4: CLAIMS INTERFACE
// ============================================================================

/**
 * User claims embedded in JWT tokens
 */
export interface UserClaims {
  /** User ID */
  sub: string;
  /** User email */
  email: string;
  /** User role */
  role: UserRoleType;
  /** Tenant/Employer ID for data isolation */
  tenantId: string;
  /** Employer profile ID (for employees) */
  employerId?: string;
  /** Permissions array (derived from role) */
  permissions: readonly PermissionType[];
  /** Token issued at (Unix timestamp) */
  iat: number;
  /** Token expiration (Unix timestamp) */
  exp: number;
  /** Signed tenant identifier (for enhanced security) */
  signedTenantId?: string;
}

/** Zod schema for UserClaims */
export const UserClaimsSchema = z.object({
  sub: z.string().min(1),
  email: z.string().email(),
  role: UserRoleSchema,
  tenantId: z.string().min(1),
  employerId: z.string().optional(),
  permissions: z.array(PermissionSchema),
  iat: z.number().int().positive(),
  exp: z.number().int().positive(),
  signedTenantId: z.string().optional(),
});

// ============================================================================
// SECTION 5: AUTHORIZATION HELPERS
// ============================================================================

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  role: UserRoleType,
  permission: PermissionType
): boolean {
  const permissions = RolePermissions[role];
  return permissions.includes(permission);
}

/**
 * Check if claims include a specific permission
 */
export function claimsHavePermission(
  claims: UserClaims,
  permission: PermissionType
): boolean {
  return claims.permissions.includes(permission);
}

/**
 * Check if claims include all of the specified permissions
 */
export function claimsHaveAllPermissions(
  claims: UserClaims,
  permissions: readonly PermissionType[]
): boolean {
  return permissions.every((p) => claims.permissions.includes(p));
}

/**
 * Check if claims include any of the specified permissions
 */
export function claimsHaveAnyPermission(
  claims: UserClaims,
  permissions: readonly PermissionType[]
): boolean {
  return permissions.some((p) => claims.permissions.includes(p));
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(
  role: UserRoleType
): readonly PermissionType[] {
  return RolePermissions[role];
}

/**
 * Build user claims from user data
 */
export function buildUserClaims(
  userId: string,
  email: string,
  role: UserRoleType,
  tenantId: string,
  employerId?: string,
  signedTenantId?: string
): UserClaims {
  const now = Math.floor(Date.now() / 1000);
  const expirationHours = role === UserRole.SERVICE ? 24 : 1;

  return {
    sub: userId,
    email,
    role,
    tenantId,
    employerId,
    permissions: getPermissionsForRole(role),
    iat: now,
    exp: now + expirationHours * 60 * 60,
    signedTenantId,
  };
}

/**
 * Check if user can access a specific tenant's data
 */
export function canAccessTenant(
  claims: UserClaims,
  targetTenantId: string
): boolean {
  // Admins can access all tenants
  if (claims.role === UserRole.ADMIN) {
    return true;
  }

  // Others can only access their own tenant
  return claims.tenantId === targetTenantId;
}

/**
 * Check if user can access a specific employee's data
 */
export function canAccessEmployee(
  claims: UserClaims,
  targetEmployeeId: string
): boolean {
  // Self-access
  if (claims.sub === targetEmployeeId) {
    return true;
  }

  // Employers/Admins can access employees in their tenant
  if (
    claims.role === UserRole.ADMIN ||
    claims.role === UserRole.EMPLOYER ||
    claims.role === UserRole.AUDITOR
  ) {
    // Tenant isolation is checked separately
    return true;
  }

  return false;
}
