/**
 * Application Constants
 *
 * Centralized constants to replace magic numbers and strings throughout the codebase.
 */

// ============================================================================
// User & Account Limits
// ============================================================================

export const USER_LIMITS = {
  /** Maximum number of employees allowed per employer */
  MAX_EMPLOYEES: 10000,
  /** Minimum number of employees */
  MIN_EMPLOYEES: 1,
  /** Maximum email address length */
  MAX_EMAIL_LENGTH: 254,
  /** Minimum name length */
  MIN_NAME_LENGTH: 2,
  /** Maximum name length */
  MAX_NAME_LENGTH: 100,
  /** Maximum company name length */
  MAX_COMPANY_NAME_LENGTH: 200,
  /** Minimum company name length */
  MIN_COMPANY_NAME_LENGTH: 2,
} as const;

// ============================================================================
// User Status
// ============================================================================

export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type UserStatusType = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// ============================================================================
// User Roles (avoid conflict with rbac-claims.ts)
// ============================================================================

export const APP_USER_ROLES = {
  ADMIN: 'admin',
  EMPLOYER: 'employer',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  AUDITOR: 'auditor',
  SERVICE: 'service',
} as const;

export type AppUserRole = (typeof APP_USER_ROLES)[keyof typeof APP_USER_ROLES];

// ============================================================================
// Employer Size Classification
// ============================================================================

export const EMPLOYER_SIZE = {
  SMALL: 'small',
  LARGE: 'large',
} as const;

export type EmployerSizeType =
  (typeof EMPLOYER_SIZE)[keyof typeof EMPLOYER_SIZE];

/** Threshold: Employers with 10+ employees are considered "large" */
export const LARGE_EMPLOYER_THRESHOLD = 10;

// ============================================================================
// Rate Limiting
// ============================================================================

export const RATE_LIMITS = {
  /** Login attempts allowed per time window */
  LOGIN_ATTEMPTS: 10,
  /** Employee registration attempts allowed per time window */
  EMPLOYEE_REGISTRATION_ATTEMPTS: 5,
  /** Manager registration attempts allowed per time window */
  MANAGER_REGISTRATION_ATTEMPTS: 3,
  /** Time window for rate limiting in milliseconds (5 minutes) */
  RATE_LIMIT_WINDOW_MS: 300000,
} as const;

// ============================================================================
// Retry Configuration
// ============================================================================

export const RETRY_CONFIG = {
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  /** Initial delay between retries in milliseconds */
  INITIAL_DELAY_MS: 1000,
  /** Delay multiplier for exponential backoff */
  BACKOFF_MULTIPLIER: 2,
  /** Maximum retry attempts for email operations */
  EMAIL_MAX_RETRIES: 2,
  /** Initial delay for email operations */
  EMAIL_INITIAL_DELAY_MS: 2000,
} as const;

// ============================================================================
// Firebase Auth Error Codes
// ============================================================================

export const AUTH_ERROR_CODES = {
  EMAIL_ALREADY_IN_USE: 'auth/email-already-in-use',
  INVALID_EMAIL: 'auth/invalid-email',
  WEAK_PASSWORD: 'auth/weak-password',
  INVALID_CREDENTIAL: 'auth/invalid-credential',
  USER_NOT_FOUND: 'auth/user-not-found',
  WRONG_PASSWORD: 'auth/wrong-password',
  TOO_MANY_REQUESTS: 'auth/too-many-requests',
  USER_DISABLED: 'auth/user-disabled',
  CONFIGURATION_NOT_FOUND: 'auth/configuration-not-found',
  NETWORK_REQUEST_FAILED: 'auth/network-request-failed',
  TIMEOUT: 'auth/timeout',
} as const;

/** Array of auth errors that should not trigger retries */
export const NON_RETRYABLE_AUTH_ERRORS = [
  AUTH_ERROR_CODES.EMAIL_ALREADY_IN_USE,
  AUTH_ERROR_CODES.INVALID_EMAIL,
  AUTH_ERROR_CODES.WEAK_PASSWORD,
  AUTH_ERROR_CODES.INVALID_CREDENTIAL,
  AUTH_ERROR_CODES.USER_NOT_FOUND,
  AUTH_ERROR_CODES.WRONG_PASSWORD,
  AUTH_ERROR_CODES.TOO_MANY_REQUESTS,
] as const;

// ============================================================================
// Password Requirements
// ============================================================================

export const PASSWORD_REQUIREMENTS = {
  /** Minimum password length */
  MIN_LENGTH: 8,
  /** Maximum password length */
  MAX_LENGTH: 128,
  /** Require at least one uppercase letter */
  REQUIRE_UPPERCASE: false,
  /** Require at least one lowercase letter */
  REQUIRE_LOWERCASE: false,
  /** Require at least one number */
  REQUIRE_NUMBER: false,
  /** Require at least one special character */
  REQUIRE_SPECIAL: false,
} as const;

// ============================================================================
// Tenant/Employer Codes
// ============================================================================

export const TENANT_CODE = {
  /** Legacy tenant code length (8 alphanumeric characters) */
  LEGACY_LENGTH: 8,
  /** New employer code length (4 digits) */
  EMPLOYER_CODE_LENGTH: 4,
  /** Characters allowed in legacy tenant codes */
  ALLOWED_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
} as const;

// ============================================================================
// API & Network
// ============================================================================

export const API_CONFIG = {
  /** API version prefix */
  VERSION_PREFIX: '/api/v1',
  /** Default request timeout in milliseconds */
  DEFAULT_TIMEOUT_MS: 30000,
  /** Maximum request body size in bytes */
  MAX_REQUEST_SIZE_BYTES: 10 * 1024 * 1024, // 10 MB
} as const;

// ============================================================================
// Time & Date
// ============================================================================

export const TIME = {
  /** Milliseconds in one second */
  SECOND_MS: 1000,
  /** Milliseconds in one minute */
  MINUTE_MS: 60 * 1000,
  /** Milliseconds in one hour */
  HOUR_MS: 60 * 60 * 1000,
  /** Milliseconds in one day */
  DAY_MS: 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// Michigan ESTA Law Constants
// ============================================================================

export const ESTA_LAW = {
  /** Accrual rate for large employers: 1 hour per 30 hours worked */
  LARGE_EMPLOYER_ACCRUAL_RATE: 1 / 30,
  /** Maximum accrual hours per year for small employers */
  SMALL_EMPLOYER_MAX_HOURS: 40,
  /** Maximum accrual hours per year for large employers */
  LARGE_EMPLOYER_MAX_HOURS: 72,
  /** Annual grant for small employers */
  SMALL_EMPLOYER_ANNUAL_GRANT: 40,
} as const;

// ============================================================================
// Export type-safe constant accessor
// ============================================================================

export const APP_CONSTANTS = {
  USER_LIMITS,
  USER_STATUS,
  APP_USER_ROLES,
  EMPLOYER_SIZE,
  LARGE_EMPLOYER_THRESHOLD,
  RATE_LIMITS,
  RETRY_CONFIG,
  AUTH_ERROR_CODES,
  NON_RETRYABLE_AUTH_ERRORS,
  PASSWORD_REQUIREMENTS,
  TENANT_CODE,
  API_CONFIG,
  TIME,
  ESTA_LAW,
} as const;
