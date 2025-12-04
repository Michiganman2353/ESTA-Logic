/**
 * ESTA-Logic Microkernel Utilities
 *
 * Common utility functions used across kernel modules.
 *
 * @module kernel/utils
 */

// ============================================================================
// SECTION 1: RESULT TYPES
// ============================================================================

/** Result type for operations that can fail */
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

/** Create a success result */
export function ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value };
}

/** Create an error result */
export function err<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}

/** Map over a result */
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.ok) {
    return { ok: true, value: fn(result.value) };
  }
  return result;
}

/** FlatMap over a result */
export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

/** Unwrap a result or throw */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw new Error(`Unwrap failed: ${JSON.stringify(result.error)}`);
}

/** Unwrap a result or return default */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.ok) {
    return result.value;
  }
  return defaultValue;
}

// ============================================================================
// SECTION 2: OPTION TYPES
// ============================================================================

/** Option type for nullable values */
export type Option<T> = { some: true; value: T } | { some: false };

/** Create a some option */
export function some<T>(value: T): Option<T> {
  return { some: true, value };
}

/** Create a none option */
export function none<T>(): Option<T> {
  return { some: false };
}

/** Map over an option */
export function mapOption<T, U>(
  option: Option<T>,
  fn: (value: T) => U
): Option<U> {
  if (option.some) {
    return { some: true, value: fn(option.value) };
  }
  return option;
}

/** Unwrap an option or throw */
export function unwrapOption<T>(option: Option<T>): T {
  if (option.some) {
    return option.value;
  }
  throw new Error('Unwrap failed: Option is None');
}

/** Unwrap an option or return default */
export function unwrapOptionOr<T>(option: Option<T>, defaultValue: T): T {
  if (option.some) {
    return option.value;
  }
  return defaultValue;
}

// ============================================================================
// SECTION 3: ID GENERATION
// ============================================================================

/** Generate a unique ID */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 11);
  return `${timestamp}-${random}`;
}

/** Generate a UUID v4 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Generate a short ID (8 characters) */
export function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============================================================================
// SECTION 4: TIME UTILITIES
// ============================================================================

/** Get current timestamp in milliseconds */
export function nowMs(): number {
  return Date.now();
}

/** Get current timestamp in nanoseconds (approximate) */
export function nowNanos(): bigint {
  return BigInt(Date.now()) * BigInt(1_000_000);
}

/** Format duration in human-readable format */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  if (ms < 60000) {
    return `${(ms / 1000).toFixed(2)}s`;
  }
  if (ms < 3600000) {
    return `${(ms / 60000).toFixed(2)}m`;
  }
  return `${(ms / 3600000).toFixed(2)}h`;
}

/** Parse ISO 8601 date string to timestamp */
export function parseISODate(dateStr: string): number {
  return new Date(dateStr).getTime();
}

/** Format timestamp as ISO 8601 string */
export function formatISODate(timestamp: number): string {
  return new Date(timestamp).toISOString();
}

// ============================================================================
// SECTION 5: VALIDATION UTILITIES
// ============================================================================

/** Check if value is a non-empty string */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/** Check if value is a positive integer */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

/** Check if value is a non-negative integer */
export function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/** Check if value is a valid email */
export function isValidEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/** Check if value is a valid semver */
export function isValidSemver(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  const semverRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/;
  return semverRegex.test(value);
}

// ============================================================================
// SECTION 6: COLLECTION UTILITIES
// ============================================================================

/** Group array by key */
export function groupBy<T, K extends string | number>(
  array: readonly T[],
  keyFn: (item: T) => K
): Map<K, T[]> {
  const map = new Map<K, T[]>();
  for (const item of array) {
    const key = keyFn(item);
    const group = map.get(key) ?? [];
    group.push(item);
    map.set(key, group);
  }
  return map;
}

/** Partition array by predicate */
export function partition<T>(
  array: readonly T[],
  predicate: (item: T) => boolean
): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];
  for (const item of array) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }
  return [pass, fail];
}

/** Unique array by key */
export function uniqueBy<T, K>(
  array: readonly T[],
  keyFn: (item: T) => K
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];
  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

/** Sort array by multiple keys */
export function sortBy<T>(
  array: readonly T[],
  ...comparators: Array<(a: T, b: T) => number>
): T[] {
  return [...array].sort((a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) return result;
    }
    return 0;
  });
}

/** Create a comparator for a numeric key */
export function compareByNumber<T>(
  keyFn: (item: T) => number,
  direction: 'asc' | 'desc' = 'asc'
): (a: T, b: T) => number {
  return (a, b) => {
    const diff = keyFn(a) - keyFn(b);
    return direction === 'asc' ? diff : -diff;
  };
}

/** Create a comparator for a string key */
export function compareByString<T>(
  keyFn: (item: T) => string,
  direction: 'asc' | 'desc' = 'asc'
): (a: T, b: T) => number {
  return (a, b) => {
    const diff = keyFn(a).localeCompare(keyFn(b));
    return direction === 'asc' ? diff : -diff;
  };
}

// ============================================================================
// SECTION 7: RETRY UTILITIES
// ============================================================================

/** Retry configuration */
export interface RetryConfig {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly maxDelayMs: number;
  readonly backoffMultiplier: number;
}

/** Default retry configuration */
export function defaultRetryConfig(): RetryConfig {
  return {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  };
}

/** Calculate delay for retry attempt */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig
): number {
  const delay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delay, config.maxDelayMs);
}

/** Sleep for specified duration */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Retry an async operation */
export async function retry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = defaultRetryConfig()
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < config.maxAttempts - 1) {
        const delay = calculateRetryDelay(attempt, config);
        await sleep(delay);
      }
    }
  }

  throw lastError ?? new Error('Retry failed');
}

// ============================================================================
// SECTION 8: DEEP CLONE AND MERGE
// ============================================================================

/** Deep clone an object */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (obj instanceof Map) {
    const cloned = new Map();
    obj.forEach((value, key) => {
      cloned.set(deepClone(key), deepClone(value));
    });
    return cloned as unknown as T;
  }

  if (obj instanceof Set) {
    const cloned = new Set();
    obj.forEach((value) => {
      cloned.add(deepClone(value));
    });
    return cloned as unknown as T;
  }

  const cloned: Record<string, unknown> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }
  return cloned as T;
}

/** Deep merge two objects */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = deepClone(target);

  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const sourceValue = source[key];
      const targetValue = result[key];

      if (
        sourceValue !== null &&
        typeof sourceValue === 'object' &&
        !Array.isArray(sourceValue) &&
        targetValue !== null &&
        typeof targetValue === 'object' &&
        !Array.isArray(targetValue)
      ) {
        (result as Record<string, unknown>)[key] = deepMerge(
          targetValue as Record<string, unknown>,
          sourceValue as Record<string, unknown>
        );
      } else {
        (result as Record<string, unknown>)[key] = deepClone(sourceValue);
      }
    }
  }

  return result;
}

// ============================================================================
// SECTION 9: ASSERTION UTILITIES
// ============================================================================

/** Assert that a condition is true */
export function assert(condition: boolean, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

/** Assert that a value is not null or undefined */
export function assertDefined<T>(
  value: T | null | undefined,
  name: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`Expected ${name} to be defined`);
  }
}

/** Assert that a value is a string */
export function assertString(
  value: unknown,
  name: string
): asserts value is string {
  if (typeof value !== 'string') {
    throw new Error(`Expected ${name} to be a string`);
  }
}

/** Assert that a value is a number */
export function assertNumber(
  value: unknown,
  name: string
): asserts value is number {
  if (typeof value !== 'number') {
    throw new Error(`Expected ${name} to be a number`);
  }
}

// ============================================================================
// SECTION 10: ERROR TYPES
// ============================================================================

/** Base error class for kernel errors */
export class KernelError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'KernelError';
    this.code = code;
    this.details = details;
  }
}

/** Permission denied error */
export class PermissionDeniedError extends KernelError {
  constructor(resource: string, operation: string) {
    super(
      'PERMISSION_DENIED',
      `Permission denied: ${operation} on ${resource}`,
      { resource, operation }
    );
    this.name = 'PermissionDeniedError';
  }
}

/** Resource not found error */
export class NotFoundError extends KernelError {
  constructor(resourceType: string, resourceId: string) {
    super('NOT_FOUND', `${resourceType} not found: ${resourceId}`, {
      resourceType,
      resourceId,
    });
    this.name = 'NotFoundError';
  }
}

/** Validation error */
export class ValidationError extends KernelError {
  readonly validationErrors: readonly { field: string; message: string }[];

  constructor(errors: readonly { field: string; message: string }[]) {
    super(
      'VALIDATION_ERROR',
      `Validation failed: ${errors.map((e) => `${e.field}: ${e.message}`).join(', ')}`,
      { errors }
    );
    this.name = 'ValidationError';
    this.validationErrors = errors;
  }
}

/** Timeout error */
export class TimeoutError extends KernelError {
  constructor(operation: string, timeoutMs: number) {
    super('TIMEOUT', `Operation timed out: ${operation} (${timeoutMs}ms)`, {
      operation,
      timeoutMs,
    });
    this.name = 'TimeoutError';
  }
}
