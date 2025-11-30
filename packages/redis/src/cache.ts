/**
 * ESTA Cache - Prediction and computation caching functionality
 *
 * This module provides caching capabilities for expensive computations,
 * such as ML model predictions.
 */

import { redis } from './client.js';

const DEFAULT_TTL = 86400; // 24 hours in seconds

/**
 * Cache options for storing values
 */
export interface CacheOptions {
  /** Time-to-live in seconds (default: 86400 = 24 hours) */
  ttl?: number;
}

/**
 * Safely parse JSON from cache, returning null if parsing fails.
 */
function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

/**
 * Get a cached prediction or compute and cache it.
 *
 * @param employeeId - The employee identifier
 * @param month - The month identifier (e.g., '2025-01')
 * @param computeFn - Function to compute the prediction if not cached
 * @param options - Cache options
 * @returns The prediction value (from cache or freshly computed)
 */
export async function getCachedPrediction<T>(
  employeeId: string,
  month: string,
  computeFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cacheKey = `prediction:${employeeId}:${month}`;
  const ttl = options.ttl ?? DEFAULT_TTL;

  const cached = await redis.get<string>(cacheKey);
  if (cached !== null) {
    const parsed = safeJsonParse<T>(cached);
    if (parsed !== null) {
      return parsed;
    }
    // Cached value was corrupted, invalidate it
    await redis.del(cacheKey);
  }

  const prediction = await computeFn();
  await redis.set(cacheKey, JSON.stringify(prediction), { ex: ttl });
  return prediction;
}

/**
 * Get a value from cache.
 *
 * @param key - The cache key
 * @returns The cached value, or null if not found or corrupted
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  const cached = await redis.get<string>(key);
  if (cached === null) {
    return null;
  }
  return safeJsonParse<T>(cached);
}

/**
 * Set a value in cache with optional TTL.
 *
 * @param key - The cache key
 * @param value - The value to cache
 * @param options - Cache options
 */
export async function setInCache<T>(
  key: string,
  value: T,
  options: CacheOptions = {}
): Promise<void> {
  const ttl = options.ttl ?? DEFAULT_TTL;
  await redis.set(key, JSON.stringify(value), { ex: ttl });
}

/**
 * Invalidate a cache entry.
 *
 * @param key - The cache key to invalidate
 */
export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}

/**
 * Create a prediction cache key.
 *
 * @param employeeId - The employee identifier
 * @param month - The month identifier
 * @returns Formatted cache key
 */
export function createPredictionCacheKey(
  employeeId: string,
  month: string
): string {
  return `prediction:${employeeId}:${month}`;
}
