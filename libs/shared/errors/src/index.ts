/**
 * Centralized Error Handling Module
 *
 * Single source of truth for error messages and error handling utilities.
 * Eliminates duplicate error handling patterns across the codebase.
 */

/**
 * Extract error message from various error types
 *
 * This replaces the repeated pattern:
 * `error instanceof Error ? error.message : 'Unknown error'`
 *
 * @param error - Any error object
 * @param defaultMessage - Optional default message (defaults to 'Unknown error')
 * @returns User-friendly error message
 */
export function getErrorMessage(
  error: unknown,
  defaultMessage = 'Unknown error'
): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return defaultMessage;
}

/**
 * Error code constants for consistent error handling
 */
export const ErrorCodes = {
  // Authentication errors
  AUTH_SESSION_EXPIRED: 'auth/session-expired',
  AUTH_INVALID_CREDENTIAL: 'auth/invalid-credential',
  AUTH_USER_NOT_FOUND: 'auth/user-not-found',
  AUTH_EMAIL_IN_USE: 'auth/email-already-in-use',
  AUTH_WEAK_PASSWORD: 'auth/weak-password',
  AUTH_TOO_MANY_REQUESTS: 'auth/too-many-requests',
  AUTH_WRONG_PASSWORD: 'auth/wrong-password',
  AUTH_INVALID_EMAIL: 'auth/invalid-email',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'rate-limit/exceeded',

  // Server errors
  SERVER_ERROR: 'server/error',
  SERVER_CONFIG_ERROR: 'server/configuration-error',

  // Validation errors
  VALIDATION_REQUIRED_FIELD: 'validation/required-field',
  VALIDATION_INVALID_FORMAT: 'validation/invalid-format',

  // Registration errors
  REGISTRATION_FAILED: 'registration/failed',
  REGISTRATION_CLOSED: 'registration/closed',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * Structured error class for application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Check if error is a Firebase auth error with specific code
 */
export function isAuthError(error: unknown, code?: string): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const errorCode = (error as { code: string }).code;

  if (code) {
    return errorCode === code;
  }

  // Check if it's any auth error
  return typeof errorCode === 'string' && errorCode.startsWith('auth/');
}

/**
 * Check if error is retryable (network errors, timeouts, etc.)
 */
export function isRetryableError(error: unknown): boolean {
  const message = getErrorMessage(error).toLowerCase();

  const retryablePatterns = [
    'network',
    'timeout',
    'econnrefused',
    'enotfound',
    'etimedout',
    'unavailable',
    'deadline',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Non-retryable auth error codes
 */
const NON_RETRYABLE_AUTH_CODES = [
  ErrorCodes.AUTH_EMAIL_IN_USE,
  ErrorCodes.AUTH_INVALID_EMAIL,
  ErrorCodes.AUTH_WEAK_PASSWORD,
  ErrorCodes.AUTH_INVALID_CREDENTIAL,
  ErrorCodes.AUTH_USER_NOT_FOUND,
  ErrorCodes.AUTH_WRONG_PASSWORD,
  ErrorCodes.AUTH_TOO_MANY_REQUESTS,
];

/**
 * Check if auth error should not be retried
 */
export function isNonRetryableAuthError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const errorCode = (error as { code: string }).code;
  return NON_RETRYABLE_AUTH_CODES.some((code) => code === errorCode);
}

/**
 * Format error for logging (sanitized)
 */
export function formatErrorForLogging(error: unknown): Record<string, unknown> {
  if (error instanceof AppError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      context: error.context,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  if (error && typeof error === 'object') {
    return { ...error };
  }

  return { error: String(error) };
}

/**
 * Create error response object for API responses
 */
export function createErrorResponse(
  error: unknown,
  statusCode = 500
): {
  success: false;
  error: string;
  code?: string;
  statusCode: number;
} {
  const message = getErrorMessage(error);
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String(error.code)
      : undefined;

  return {
    success: false,
    error: message,
    code,
    statusCode,
  };
}
