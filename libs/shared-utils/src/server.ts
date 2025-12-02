/**
 * Server-only utility functions for ESTA Tracker
 *
 * These utilities use Node.js modules (like 'crypto') and are NOT browser-safe.
 * Only import this module in backend/API/serverless function code.
 *
 * Usage:
 * ```typescript
 * import { createTenantId, verifyTenantId } from '@esta-tracker/shared-utils/server';
 * ```
 */

// Re-export everything from the main index (browser-safe utilities)
export * from './index.js';

// Server-only exports (uses Node.js 'crypto' module)
export * from './tenant-identifier.js';

// Cache utilities with Redis/in-memory fallback
export * from './cache.js';
