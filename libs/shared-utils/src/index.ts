/**
 * Shared utility functions for ESTA Tracker
 *
 * Common utilities used across frontend, backend, and serverless functions
 *
 * NOTE: This file exports browser-safe utilities only.
 * For server-only utilities that use Node.js modules (like 'crypto'),
 * import from '@esta-tracker/shared-utils/server':
 *
 * ```typescript
 * // Frontend (browser-safe)
 * import { ErrorCode, ERROR_MESSAGES } from '@esta-tracker/shared-utils';
 *
 * // Backend (server-only)
 * import { createTenantId, verifyTenantId } from '@esta-tracker/shared-utils/server';
 * ```
 */

// Browser-safe exports only
export * from './date.js';
export * from './validation.js';
export * from './formatting.js';
export * from './constants.js';
export * from './errors.js';
export * from './rbac-claims.js';

// NOTE: tenant-identifier.js uses Node.js 'crypto' module and is NOT browser-safe.
// Import from '@esta-tracker/shared-utils/server' for server-side use.
