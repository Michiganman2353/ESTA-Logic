/**
 * ESTA Redis Client - Upstash Redis client configuration
 *
 * This module provides a configured Redis client using Upstash's REST API.
 * Environment variables are required for connection.
 */

import { Redis } from '@upstash/redis';

/**
 * Create and export the Redis client instance.
 * Uses environment variables for configuration.
 *
 * Required environment variables:
 * - UPSTASH_REDIS_REST_URL: The Upstash Redis REST endpoint URL
 * - UPSTASH_REDIS_REST_TOKEN: The Upstash Redis REST authentication token
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL ?? '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN ?? '',
});

export { Redis };
