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
});
