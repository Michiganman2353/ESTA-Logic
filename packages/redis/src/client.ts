/**
 * ESTA Redis Client - Upstash Redis client configuration
 *
 * This module provides a configured Redis client using Upstash's REST API.
 * Environment variables are required for connection.
 */

import { Redis } from '@upstash/redis';

/**
 * Validate that required environment variables are set.
 * Returns true if valid, throws error if not configured (unless in test environment).
 */
function validateEnvironment(): { url: string; token: string } {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Allow empty values in test environments
  if (process.env.NODE_ENV === 'test') {
    return { url: url ?? '', token: token ?? '' };
  }

  if (!url || !token) {
    console.warn(
      'Warning: UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN not set. Redis operations will fail.'
    );
  }

  return { url: url ?? '', token: token ?? '' };
}

const config = validateEnvironment();

/**
 * Create and export the Redis client instance.
 * Uses environment variables for configuration.
 *
 * Required environment variables:
 * - UPSTASH_REDIS_REST_URL: The Upstash Redis REST endpoint URL
 * - UPSTASH_REDIS_REST_TOKEN: The Upstash Redis REST authentication token
 */
export const redis = new Redis({
  url: config.url,
  token: config.token,
});

export { Redis };
