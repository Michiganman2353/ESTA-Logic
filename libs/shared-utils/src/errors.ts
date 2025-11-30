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
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  BAD_REQUEST = 'BAD_REQUEST',

  // Authentication errors (401-level)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Authorization errors (403-level)
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  FORBIDDEN = 'FORBIDDEN',
  TENANT_ACCESS_DENIED = 'TENANT_ACCESS_DENIED',

  // Not found errors (404-level)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  EMPLOYER_NOT_FOUND = 'EMPLOYER_NOT_FOUND',

  // Method not allowed (405)
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',

  // Business logic errors (422-level)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_SICK_TIME = 'INSUFFICIENT_SICK_TIME',
  INVALID_DATE_RANGE = 'INVALID_DATE_RANGE',

  // Server errors (500-level)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // Encryption/Decryption errors
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  INVALID_KEY = 'INVALID_KEY',
  KMS_ERROR = 'KMS_ERROR',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',

  // Camera/Media errors
  CAMERA_ACCESS_DENIED = 'CAMERA_ACCESS_DENIED',
  MEDIA_ERROR = 'MEDIA_ERROR',

  // Document errors
  DOCUMENT_UPLOAD_FAILED = 'DOCUMENT_UPLOAD_FAILED',
  DOCUMENT_DOWNLOAD_FAILED = 'DOCUMENT_DOWNLOAD_FAILED',
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
 * Create an unauthorized error (401)
 */
export function unauthorizedError(message: string = 'Unauthorized'): AppError {
  return new AppError(message, ErrorCode.UNAUTHORIZED, 401);
}

/**
 * Create a forbidden error (403)
 */
export function forbiddenError(message: string = 'Forbidden'): AppError {
  return new AppError(message, ErrorCode.FORBIDDEN, 403);
}

/**
 * Create a bad request error (400)
 */
export function badRequestError(
  message: string = 'Bad request',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.BAD_REQUEST, 400, details);
}

/**
 * Create an internal server error (500)
 */
export function internalError(
  message: string = 'Internal server error',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.INTERNAL_ERROR, 500, details);
}

/**
 * Create an encryption failed error
 */
export function encryptionError(
  message: string = 'Encryption failed',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.ENCRYPTION_FAILED, 500, details);
}

/**
 * Create a decryption failed error
 */
export function decryptionError(
  message: string = 'Decryption failed',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.DECRYPTION_FAILED, 500, details);
}

/**
 * Create a network error
 */
export function networkError(
  message: string = 'Network error',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.NETWORK_ERROR, 503, details, true);
}

/**
 * Create an invalid payload error
 */
export function invalidPayloadError(
  message: string = 'Invalid payload',
  details?: Record<string, unknown>
): AppError {
  return new AppError(message, ErrorCode.INVALID_PAYLOAD, 400, details);
}

/**
 * Create a method not allowed error
 */
export function methodNotAllowedError(method: string = 'Method'): AppError {
  return new AppError(
    `${method} not allowed`,
    ErrorCode.METHOD_NOT_ALLOWED,
    405
  );
}

/**
 * Create a tenant access denied error
 */
export function tenantAccessDeniedError(tenantId?: string): AppError {
  const message = tenantId
    ? `You do not have access to tenant '${tenantId}'`
    : 'You do not have access to this tenant';
  return new AppError(message, ErrorCode.TENANT_ACCESS_DENIED, 403);
}

/**
 * Create a document operation error
 */
export function documentError(
  operation: 'upload' | 'download',
  message?: string
): AppError {
  const code =
    operation === 'upload'
      ? ErrorCode.DOCUMENT_UPLOAD_FAILED
      : ErrorCode.DOCUMENT_DOWNLOAD_FAILED;
  const defaultMessage =
    operation === 'upload'
      ? 'Failed to upload document'
      : 'Failed to download and decrypt document';
  return new AppError(message || defaultMessage, code, 500);
}

/**
 * Human-readable error messages for error codes
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.VALIDATION_ERROR]: 'Validation failed',
  [ErrorCode.INVALID_INPUT]: 'Invalid input provided',
  [ErrorCode.MISSING_REQUIRED_FIELD]: 'Missing required field',
  [ErrorCode.INVALID_PAYLOAD]: 'Invalid payload',
  [ErrorCode.INVALID_FILE_TYPE]: 'Invalid file type',
  [ErrorCode.FILE_TOO_LARGE]: 'File size exceeds maximum allowed',
  [ErrorCode.BAD_REQUEST]: 'Bad request',
  [ErrorCode.AUTHENTICATION_REQUIRED]: 'Authentication required',
  [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCode.TOKEN_EXPIRED]: 'Session expired, please login again',
  [ErrorCode.UNAUTHORIZED]: 'Unauthorized',
  [ErrorCode.PERMISSION_DENIED]: 'Permission denied',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',
  [ErrorCode.FORBIDDEN]: 'Access forbidden',
  [ErrorCode.TENANT_ACCESS_DENIED]: 'You do not have access to this tenant',
  [ErrorCode.RESOURCE_NOT_FOUND]: 'Resource not found',
  [ErrorCode.EMPLOYEE_NOT_FOUND]: 'Employee not found',
  [ErrorCode.EMPLOYER_NOT_FOUND]: 'Employer not found',
  [ErrorCode.METHOD_NOT_ALLOWED]: 'Method not allowed',
  [ErrorCode.BUSINESS_RULE_VIOLATION]: 'Business rule violation',
  [ErrorCode.INSUFFICIENT_SICK_TIME]: 'Insufficient sick time balance',
  [ErrorCode.INVALID_DATE_RANGE]: 'Invalid date range',
  [ErrorCode.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCode.DATABASE_ERROR]: 'Database error',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'External service error',
  [ErrorCode.ENCRYPTION_FAILED]: 'Encryption failed',
  [ErrorCode.DECRYPTION_FAILED]: 'Decryption failed',
  [ErrorCode.INVALID_KEY]: 'Invalid encryption key',
  [ErrorCode.KMS_ERROR]: 'Key management service error',
  [ErrorCode.NETWORK_ERROR]:
    'Unable to connect to server. Please check your connection.',
  [ErrorCode.TIMEOUT_ERROR]: 'Request timed out',
  [ErrorCode.SERVICE_UNAVAILABLE]: 'Service temporarily unavailable',
  [ErrorCode.CAMERA_ACCESS_DENIED]:
    'Unable to access camera. Please grant camera permissions.',
  [ErrorCode.MEDIA_ERROR]: 'Media error occurred',
  [ErrorCode.DOCUMENT_UPLOAD_FAILED]: 'Failed to upload document',
  [ErrorCode.DOCUMENT_DOWNLOAD_FAILED]:
    'Failed to download and decrypt document',
};

/**
 * Get human-readable message for an error code
 */
export function getErrorMessageForCode(code: ErrorCode): string {
  return ERROR_MESSAGES[code] || 'An unexpected error occurred';
}

/**
 * Type for network-aware errors (used in frontend)
 */
export interface NetworkAwareError {
  isNetworkError?: boolean;
  status?: number;
  message?: string;
  code?: ErrorCode;
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null) {
    return (error as NetworkAwareError).isNetworkError === true;
  }
  return false;
}

/**
 * Get HTTP status code from error
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isAppError(error)) {
    return error.statusCode;
  }
  if (typeof error === 'object' && error !== null) {
    return (error as NetworkAwareError).status;
  }
  return undefined;
}

/**
 * Get error code from error
 */
export function getErrorCode(error: unknown): ErrorCode | undefined {
  if (isAppError(error)) {
    return error.code;
  }
  if (typeof error === 'object' && error !== null) {
    return (error as NetworkAwareError).code;
  }
  return undefined;
}
