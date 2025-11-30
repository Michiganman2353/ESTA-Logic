/**
 * Error Handling Utilities
 *
 * Centralized error handling patterns for consistent error management
 * across the ESTA Tracker application.
 */

/**
 * Application error codes for categorizing errors
 */
export enum ErrorCode {
  // Validation errors (400-level)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_FILE_SIZE = 'INVALID_FILE_SIZE',

  // Authentication errors (401-level)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',

  // Authorization errors (403-level)
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',
  ACCOUNT_PENDING_APPROVAL = 'ACCOUNT_PENDING_APPROVAL',

  // HTTP Method errors (405-level)
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',

  // Not found errors (404-level)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  EMPLOYER_NOT_FOUND = 'EMPLOYER_NOT_FOUND',

  // Business logic errors (422-level)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_SICK_TIME = 'INSUFFICIENT_SICK_TIME',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',

  // Encryption/Decryption errors (500-level)
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  LEGACY_KEY_REQUIRED = 'LEGACY_KEY_REQUIRED',

  // Document/File errors
  DOCUMENT_DOWNLOAD_FAILED = 'DOCUMENT_DOWNLOAD_FAILED',
  DOCUMENT_UPLOAD_FAILED = 'DOCUMENT_UPLOAD_FAILED',

  // Camera/Media errors
  CAMERA_ACCESS_DENIED = 'CAMERA_ACCESS_DENIED',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Server errors (500-level)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
}

/**
 * Custom application error with structured error information
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.INTERNAL_ERROR,
    statusCode: number = 500,
    details?: Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where error was thrown (Node.js only)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a safe JSON representation for API responses
   */
  toJSON(): Record<string, unknown> {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
      },
    };
  }
}

/**
 * Result type for operations that can fail
 * Use this instead of throwing exceptions for expected failure cases
 */
export type Result<T, E = AppError> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Create a successful result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Create a failed result
 */
export function err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard to check if a value is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if a value is a standard Error
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (isAppError(error)) {
    return error.message;
  }
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

/**
 * Wrap an async function to catch errors and return a Result
 */
export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, AppError>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    if (isAppError(error)) {
      return err(error);
    }
    return err(
      new AppError(getErrorMessage(error), ErrorCode.INTERNAL_ERROR, 500, {
        originalError: String(error),
      })
    );
  }
}

/**
 * Wrap a synchronous function to catch errors and return a Result
 */
export function tryCatchSync<T>(fn: () => T): Result<T, AppError> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    if (isAppError(error)) {
      return err(error);
    }
    return err(
      new AppError(getErrorMessage(error), ErrorCode.INTERNAL_ERROR, 500, {
        originalError: String(error),
      })
    );
  }
}

/**
 * Create a validation error with field-specific details
 */
export function validationError(
  message: string,
  fieldErrors?: Record<string, string>
): AppError {
  return new AppError(message, ErrorCode.VALIDATION_ERROR, 400, {
    fieldErrors,
  });
}

/**
 * Create a not found error
 */
export function notFoundError(resource: string, id?: string): AppError {
  const message = id
    ? `${resource} with ID '${id}' not found`
    : `${resource} not found`;
  return new AppError(message, ErrorCode.RESOURCE_NOT_FOUND, 404);
}

/**
 * Create a permission denied error
 */
export function permissionDeniedError(action?: string): AppError {
  const message = action ? `Permission denied: ${action}` : 'Permission denied';
  return new AppError(message, ErrorCode.PERMISSION_DENIED, 403);
}

/**
 * Create an authentication required error
 */
export function authenticationRequiredError(): AppError {
  return new AppError(
    'Authentication required',
    ErrorCode.AUTHENTICATION_REQUIRED,
    401
  );
}

/**
 * Mapping of error codes to user-friendly messages for UI display.
 * These messages are safe to show to end users.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
  [ErrorCode.INVALID_INPUT]: 'The provided input is invalid.',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Please fill in all required fields.',
  [ErrorCode.INVALID_PAYLOAD]: 'Invalid request data.',
  [ErrorCode.INVALID_FILE_TYPE]: 'File type is not supported.',
  [ErrorCode.INVALID_FILE_SIZE]: 'File size exceeds the allowed limit.',

  // Authentication errors
  [ErrorCode.AUTHENTICATION_REQUIRED]: 'Please sign in to continue.',
  [ErrorCode.INVALID_CREDENTIALS]:
    'Invalid email or password. Please try again.',
  [ErrorCode.TOKEN_EXPIRED]: 'Your session has expired. Please sign in again.',

  // Authorization errors
  [ErrorCode.PERMISSION_DENIED]:
    'You do not have permission to perform this action.',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]:
    'You do not have permission to decrypt this data.',
  [ErrorCode.TENANT_ACCESS_DENIED]:
    "You do not have access to this tenant's data.",
  [ErrorCode.ACCOUNT_PENDING_APPROVAL]:
    'Your account is pending approval. Please wait for an administrator to activate your account, or contact support if you believe this is an error.',

  // HTTP Method errors
  [ErrorCode.METHOD_NOT_ALLOWED]: 'This operation is not allowed.',

  // Not found errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource was not found.',
  [ErrorCode.EMPLOYEE_NOT_FOUND]: 'Employee not found.',
  [ErrorCode.EMPLOYER_NOT_FOUND]: 'Employer not found.',

  // Business logic errors
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'This action violates business rules.',
  [ErrorCode.INSUFFICIENT_SICK_TIME]: 'Insufficient sick time balance.',
  [ErrorCode.INVALID_DATE_RANGE]: 'The selected date range is invalid.',

  // Encryption/Decryption errors
  [ErrorCode.DECRYPTION_FAILED]: 'Failed to decrypt data.',
  [ErrorCode.ENCRYPTION_FAILED]: 'Failed to encrypt data.',
  [ErrorCode.LEGACY_KEY_REQUIRED]:
    'Legacy mode requires privateKey parameter. Consider migrating to KMS.',

  // Document/File errors
  [ErrorCode.DOCUMENT_DOWNLOAD_FAILED]:
    'Failed to download and decrypt document.',
  [ErrorCode.DOCUMENT_UPLOAD_FAILED]: 'Failed to upload document.',

  // Camera/Media errors
  [ErrorCode.CAMERA_ACCESS_DENIED]:
    'Unable to access camera. Please ensure camera permissions are granted.',

  // Network errors
  [ErrorCode.NETWORK_ERROR]:
    'Unable to connect to server. Please check your internet connection and try again.',

  // Server errors
  [ErrorCode.INTERNAL_ERROR]:
    'An unexpected error occurred. Please try again later.',
  [ErrorCode.DATABASE_ERROR]:
    'A database error occurred. Please try again later.',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]:
    'An external service error occurred. Please try again later.',
  [ErrorCode.SERVER_ERROR]:
    'Server error. Please try again later or contact support if the problem persists.',
};

/**
 * Get user-friendly message for an error code
 */
export function getUserFriendlyMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ErrorCode.INTERNAL_ERROR];
}
