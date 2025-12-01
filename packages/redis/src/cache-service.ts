/**
 * Tenant-Scoped Caching Service
 *
 * Provides tenant-isolated caching with configurable TTL for
 * multi-tenant ESTA Tracker deployments.
 *
 * Features:
 * - Tenant-scoped key namespacing
 * - Configurable TTL per cache type
 * - Automatic serialization/deserialization
 * - Cache invalidation patterns
 */

import redis from './client';

/**
 * Default TTL values in seconds for different cache types
 */
export const DEFAULT_TTL = {
  /** Short-lived cache for frequently changing data */
  SHORT: 60, // 1 minute
  /** Medium-lived cache for session-like data */
  MEDIUM: 300, // 5 minutes
  /** Long-lived cache for relatively stable data */
  LONG: 1800, // 30 minutes
  /** Extended cache for rarely changing data */
  EXTENDED: 3600, // 1 hour
  /** Snapshot cache for deterministic report data */
  SNAPSHOT: 86400, // 24 hours
} as const;

/**
 * Cache key prefixes for different data types
 */
export const CACHE_PREFIX = {
  ACCRUAL: 'accrual',
  EMPLOYEE: 'employee',
  EMPLOYER: 'employer',
  WORKLOGS: 'worklogs',
  REQUESTS: 'requests',
  DASHBOARD: 'dashboard',
  SNAPSHOT: 'snapshot',
} as const;

export type CachePrefix = (typeof CACHE_PREFIX)[keyof typeof CACHE_PREFIX];

/**
 * Cache operation result
 */
export interface CacheResult<T> {
  hit: boolean;
  data: T | null;
  ttl?: number;
}

/**
 * Build a tenant-scoped cache key
 *
 * @param tenantId - Tenant identifier for scoping
 * @param prefix - Cache prefix for data type
 * @param parts - Additional key parts
 * @returns Formatted cache key
 */
export function buildCacheKey(
  tenantId: string,
  prefix: CachePrefix,
  ...parts: string[]
): string {
  const keyParts = ['esta', tenantId, prefix, ...parts];
  return keyParts.join(':');
}

/**
 * Set a value in the cache with tenant scoping
 *
 * @param tenantId - Tenant identifier
 * @param prefix - Cache prefix
 * @param key - Cache key (without tenant prefix)
 * @param value - Value to cache
 * @param ttlSeconds - Time to live in seconds
 */
export async function setCache<T>(
  tenantId: string,
  prefix: CachePrefix,
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL.MEDIUM
): Promise<void> {
  const cacheKey = buildCacheKey(tenantId, prefix, key);
  const serialized = JSON.stringify(value);
  await redis.setex(cacheKey, ttlSeconds, serialized);
}

/**
 * Get a value from the cache with tenant scoping
 *
 * @param tenantId - Tenant identifier
 * @param prefix - Cache prefix
 * @param key - Cache key (without tenant prefix)
 * @returns Cache result with hit status and data
 */
export async function getCache<T>(
  tenantId: string,
  prefix: CachePrefix,
  key: string
): Promise<CacheResult<T>> {
  const cacheKey = buildCacheKey(tenantId, prefix, key);
  const cached = await redis.get(cacheKey);

  if (cached === null) {
    return { hit: false, data: null };
  }

  try {
    const data = JSON.parse(cached as string) as T;
    const ttl = await redis.ttl(cacheKey);
    return { hit: true, data, ttl };
  } catch {
    // Invalid JSON, treat as cache miss
    return { hit: false, data: null };
  }
}

/**
 * Delete a value from the cache
 *
 * @param tenantId - Tenant identifier
 * @param prefix - Cache prefix
 * @param key - Cache key (without tenant prefix)
 */
export async function deleteCache(
  tenantId: string,
  prefix: CachePrefix,
  key: string
): Promise<void> {
  const cacheKey = buildCacheKey(tenantId, prefix, key);
  await redis.del(cacheKey);
}

/**
 * Invalidate all cache entries for a tenant and prefix
 *
 * @param tenantId - Tenant identifier
 * @param prefix - Cache prefix to invalidate
 */
export async function invalidateTenantCache(
  tenantId: string,
  prefix: CachePrefix
): Promise<number> {
  const pattern = buildCacheKey(tenantId, prefix, '*');
  const keys = await redis.keys(pattern);

  if (keys.length === 0) {
    return 0;
  }

  await redis.del(...keys);
  return keys.length;
}

/**
 * Invalidate all cache entries for a tenant
 *
 * @param tenantId - Tenant identifier
 */
export async function invalidateAllTenantCache(
  tenantId: string
): Promise<number> {
  const pattern = `esta:${tenantId}:*`;
  const keys = await redis.keys(pattern);

  if (keys.length === 0) {
    return 0;
  }

  await redis.del(...keys);
  return keys.length;
}

/**
 * Get or set cache value with a factory function
 *
 * @param tenantId - Tenant identifier
 * @param prefix - Cache prefix
 * @param key - Cache key
 * @param factory - Function to generate value on cache miss
 * @param ttlSeconds - Time to live in seconds
 * @returns Cached or freshly generated value
 */
export async function getOrSetCache<T>(
  tenantId: string,
  prefix: CachePrefix,
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL.MEDIUM
): Promise<T> {
  const cached = await getCache<T>(tenantId, prefix, key);

  if (cached.hit && cached.data !== null) {
    return cached.data;
  }

  const value = await factory();
  await setCache(tenantId, prefix, key, value, ttlSeconds);
  return value;
}

/**
 * Batch get multiple cache values
 *
 * @param tenantId - Tenant identifier
 * @param prefix - Cache prefix
 * @param keys - Array of cache keys
 * @returns Map of key to cache results
 */
export async function batchGetCache<T>(
  tenantId: string,
  prefix: CachePrefix,
  keys: string[]
): Promise<Map<string, CacheResult<T>>> {
  const results = new Map<string, CacheResult<T>>();
  const cacheKeys = keys.map((key) => buildCacheKey(tenantId, prefix, key));

  const values = (await redis.mget(...cacheKeys)) as (string | null)[];

  keys.forEach((key, index) => {
    const value = values[index];
    if (value === null || value === undefined) {
      results.set(key, { hit: false, data: null });
    } else {
      try {
        const data = JSON.parse(value) as T;
        results.set(key, { hit: true, data });
      } catch {
        results.set(key, { hit: false, data: null });
      }
    }
  });

  return results;
}

/**
 * Check if Redis is available
 *
 * @returns True if Redis is reachable
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
