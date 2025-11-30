/**
 * ESTA Rate Limiting - Request rate limiting functionality
 *
 * This module provides rate limiting capabilities for API requests,
 * particularly useful for third-party integrations like QuickBooks or Gusto.
 */

import { redis } from './client.js';

/**
 * Check if a request should be rate limited.
 *
 * Note: This implementation uses separate incr and expire commands.
 * While there's a theoretical race condition if the process fails between
 * these commands, Upstash Redis REST API doesn't support Lua scripts.
 * The window is short and the consequence is just a persistent key that
 * will eventually be cleaned up.
 *
 * @param key - The rate limit key (e.g., `ratelimit:gusto:${firmId}`)
 * @param limit - Maximum number of requests allowed in the window (default: 100)
 * @param window - Time window in seconds (default: 3600 = 1 hour)
 * @returns true if rate limited, false if request is allowed
 */
export async function isRateLimited(
  key: string,
  limit = 100,
  window = 3600
): Promise<boolean> {
  const count = await redis.incr(key);
  if (count === 1) {
    // Set expiry only on first increment to establish the window
    await redis.expire(key, window);
  }
  return count > limit;
}

/**
 * Get the current request count for a rate limit key.
 *
 * @param key - The rate limit key
 * @returns Current request count, or 0 if key doesn't exist
 */
export async function getRateLimitCount(key: string): Promise<number> {
  const count = await redis.get<number>(key);
  return count ?? 0;
}

/**
 * Reset a rate limit counter.
 *
 * @param key - The rate limit key to reset
 */
export async function resetRateLimit(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Create a rate limit key for a specific service and firm.
 *
 * @param service - The service name (e.g., 'gusto', 'quickbooks')
 * @param firmId - The firm identifier
 * @returns Formatted rate limit key
 */
export function createRateLimitKey(service: string, firmId: string): string {
  return `ratelimit:${service}:${firmId}`;
}
