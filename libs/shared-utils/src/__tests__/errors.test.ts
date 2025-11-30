import { describe, it, expect } from 'vitest';
import {
  AppError,
  ErrorCode,
  ok,
  err,
  isAppError,
  isError,
  getErrorMessage,
  tryCatch,
  tryCatchSync,
  validationError,
  notFoundError,
  permissionDeniedError,
  authenticationRequiredError,
  unauthorizedError,
  forbiddenError,
  badRequestError,
  internalError,
  encryptionError,
  decryptionError,
  networkError,
  invalidPayloadError,
  methodNotAllowedError,
  tenantAccessDeniedError,
  documentError,
  ERROR_MESSAGES,
  getErrorMessageForCode,
  isNetworkError,
  getErrorStatusCode,
  getErrorCode,
} from '../errors';

describe('AppError', () => {
  it('should create an error with default values', () => {
    const error = new AppError('Something went wrong');
    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should create an error with custom values', () => {
    const error = new AppError(
      'Invalid input',
      ErrorCode.VALIDATION_ERROR,
      400,
      { field: 'email' }
    );
    expect(error.message).toBe('Invalid input');
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.details).toEqual({ field: 'email' });
  });

  it('should convert to JSON correctly', () => {
    const error = new AppError('Test error', ErrorCode.VALIDATION_ERROR, 400);
    const json = error.toJSON();
    expect(json).toEqual({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Test error',
        details: undefined,
      },
    });
  });
});

describe('Result type helpers', () => {
  it('ok() should create a successful result', () => {
    const result = ok({ value: 42 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ value: 42 });
    }
  });

  it('err() should create a failed result', () => {
    const error = new AppError('Failed');
    const result = err(error);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Failed');
    }
  });
});

describe('Type guards', () => {
  it('isAppError should identify AppError instances', () => {
    const appError = new AppError('Test');
    const regularError = new Error('Test');

    expect(isAppError(appError)).toBe(true);
    expect(isAppError(regularError)).toBe(false);
    expect(isAppError('string')).toBe(false);
    expect(isAppError(null)).toBe(false);
  });

  it('isError should identify Error instances', () => {
    const appError = new AppError('Test');
    const regularError = new Error('Test');

    expect(isError(appError)).toBe(true);
    expect(isError(regularError)).toBe(true);
    expect(isError('string')).toBe(false);
    expect(isError(null)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('should extract message from AppError', () => {
    const error = new AppError('App error message');
    expect(getErrorMessage(error)).toBe('App error message');
  });

  it('should extract message from regular Error', () => {
    const error = new Error('Regular error message');
    expect(getErrorMessage(error)).toBe('Regular error message');
  });

  it('should return string directly', () => {
    expect(getErrorMessage('String error')).toBe('String error');
  });

  it('should return default message for unknown types', () => {
    expect(getErrorMessage(null)).toBe('An unexpected error occurred');
    expect(getErrorMessage(42)).toBe('An unexpected error occurred');
    expect(getErrorMessage({})).toBe('An unexpected error occurred');
  });
});

describe('tryCatch', () => {
  it('should return ok result on success', async () => {
    const result = await tryCatch(async () => 'success');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('success');
    }
  });

  it('should return err result with AppError on failure', async () => {
    const appError = new AppError('Test', ErrorCode.VALIDATION_ERROR, 400);
    const result = await tryCatch(async () => {
      throw appError;
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.VALIDATION_ERROR);
    }
  });

  it('should wrap regular errors in AppError', async () => {
    const result = await tryCatch(async () => {
      throw new Error('Regular error');
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR);
      expect(result.error.message).toBe('Regular error');
    }
  });
});

describe('tryCatchSync', () => {
  it('should return ok result on success', () => {
    const result = tryCatchSync(() => 'success');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toBe('success');
    }
  });

  it('should return err result on failure', () => {
    const result = tryCatchSync(() => {
      throw new Error('Sync error');
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.message).toBe('Sync error');
    }
  });
});

describe('Error factory functions', () => {
  it('validationError should create validation error', () => {
    const error = validationError('Invalid data', { email: 'Required' });
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.statusCode).toBe(400);
    expect(error.details?.fieldErrors).toEqual({ email: 'Required' });
  });

  it('notFoundError should create not found error', () => {
    const error = notFoundError('Employee', '123');
    expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Employee with ID '123' not found");
  });

  it('notFoundError should work without ID', () => {
    const error = notFoundError('Resource');
    expect(error.message).toBe('Resource not found');
  });

  it('permissionDeniedError should create permission error', () => {
    const error = permissionDeniedError('view records');
    expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Permission denied: view records');
  });

  it('authenticationRequiredError should create auth error', () => {
    const error = authenticationRequiredError();
    expect(error.code).toBe(ErrorCode.AUTHENTICATION_REQUIRED);
    expect(error.statusCode).toBe(401);
  });

  it('unauthorizedError should create 401 error', () => {
    const error = unauthorizedError('Custom unauthorized');
    expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Custom unauthorized');
  });

  it('unauthorizedError should use default message', () => {
    const error = unauthorizedError();
    expect(error.message).toBe('Unauthorized');
  });

  it('forbiddenError should create 403 error', () => {
    const error = forbiddenError('Custom forbidden');
    expect(error.code).toBe(ErrorCode.FORBIDDEN);
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Custom forbidden');
  });

  it('badRequestError should create 400 error', () => {
    const error = badRequestError('Invalid input', { field: 'email' });
    expect(error.code).toBe(ErrorCode.BAD_REQUEST);
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Invalid input');
    expect(error.details).toEqual({ field: 'email' });
  });

  it('internalError should create 500 error', () => {
    const error = internalError('Server crashed');
    expect(error.code).toBe(ErrorCode.INTERNAL_ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Server crashed');
  });

  it('encryptionError should create encryption error', () => {
    const error = encryptionError('Key generation failed');
    expect(error.code).toBe(ErrorCode.ENCRYPTION_FAILED);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Key generation failed');
  });

  it('decryptionError should create decryption error', () => {
    const error = decryptionError('Invalid key');
    expect(error.code).toBe(ErrorCode.DECRYPTION_FAILED);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Invalid key');
  });

  it('networkError should create network error', () => {
    const error = networkError('Connection timeout');
    expect(error.code).toBe(ErrorCode.NETWORK_ERROR);
    expect(error.statusCode).toBe(503);
    expect(error.message).toBe('Connection timeout');
    expect(error.isOperational).toBe(true);
  });

  it('invalidPayloadError should create invalid payload error', () => {
    const error = invalidPayloadError('Missing required fields');
    expect(error.code).toBe(ErrorCode.INVALID_PAYLOAD);
    expect(error.statusCode).toBe(400);
  });

  it('methodNotAllowedError should create 405 error', () => {
    const error = methodNotAllowedError('GET');
    expect(error.code).toBe(ErrorCode.METHOD_NOT_ALLOWED);
    expect(error.statusCode).toBe(405);
    expect(error.message).toBe('GET not allowed');
  });

  it('tenantAccessDeniedError should create tenant access error with tenant ID', () => {
    const error = tenantAccessDeniedError('tenant123');
    expect(error.code).toBe(ErrorCode.TENANT_ACCESS_DENIED);
    expect(error.statusCode).toBe(403);
    expect(error.message).toContain('tenant123');
  });

  it('tenantAccessDeniedError should work without tenant ID', () => {
    const error = tenantAccessDeniedError();
    expect(error.message).toBe('You do not have access to this tenant');
  });

  it('documentError should create upload error', () => {
    const error = documentError('upload');
    expect(error.code).toBe(ErrorCode.DOCUMENT_UPLOAD_FAILED);
    expect(error.statusCode).toBe(500);
    expect(error.message).toBe('Failed to upload document');
  });

  it('documentError should create download error', () => {
    const error = documentError('download', 'Custom download error');
    expect(error.code).toBe(ErrorCode.DOCUMENT_DOWNLOAD_FAILED);
    expect(error.message).toBe('Custom download error');
  });
});

describe('ERROR_MESSAGES', () => {
  it('should have messages for all error codes', () => {
    for (const code of Object.values(ErrorCode)) {
      expect(ERROR_MESSAGES[code as ErrorCode]).toBeDefined();
      expect(typeof ERROR_MESSAGES[code as ErrorCode]).toBe('string');
    }
  });

  it('getErrorMessageForCode should return appropriate message', () => {
    expect(getErrorMessageForCode(ErrorCode.INVALID_CREDENTIALS)).toBe(
      'Invalid email or password'
    );
    expect(getErrorMessageForCode(ErrorCode.NETWORK_ERROR)).toContain(
      'Unable to connect'
    );
  });
});

describe('Network error utilities', () => {
  it('isNetworkError should detect network errors', () => {
    expect(isNetworkError({ isNetworkError: true })).toBe(true);
    expect(isNetworkError({ isNetworkError: false })).toBe(false);
    expect(isNetworkError(new Error('test'))).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError('string')).toBe(false);
  });

  it('getErrorStatusCode should extract status from AppError', () => {
    const error = new AppError('Test', ErrorCode.BAD_REQUEST, 400);
    expect(getErrorStatusCode(error)).toBe(400);
  });

  it('getErrorStatusCode should extract status from plain object', () => {
    expect(getErrorStatusCode({ status: 401 })).toBe(401);
  });

  it('getErrorStatusCode should return undefined for unknown types', () => {
    expect(getErrorStatusCode('string')).toBeUndefined();
    expect(getErrorStatusCode(null)).toBeUndefined();
  });

  it('getErrorCode should extract code from AppError', () => {
    const error = new AppError('Test', ErrorCode.BAD_REQUEST, 400);
    expect(getErrorCode(error)).toBe(ErrorCode.BAD_REQUEST);
  });

  it('getErrorCode should extract code from plain object', () => {
    expect(getErrorCode({ code: ErrorCode.NETWORK_ERROR })).toBe(
      ErrorCode.NETWORK_ERROR
    );
  });
});
