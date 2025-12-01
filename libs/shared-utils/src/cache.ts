// libs/shared-utils/src/cache.ts
/**
 * Simple cache wrapper: tries to use Redis if `REDIS_URL` exists,
 * otherwise uses an in-memory map which is safe for CI/tests/local dev.
 */

interface RedisLikeClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  setEx(key: string, seconds: number, value: string): Promise<unknown>;
  connect(): Promise<void>;
}

let redisClient: RedisLikeClient | null = null;
const inMemoryMap = new Map<string, string>();
const ttlTimers = new Map<string, ReturnType<typeof setTimeout>>();
let initPromise: Promise<void> | null = null;

/**
 * Safely loads the redis module at runtime if available.
 * The module path is hardcoded and validated to prevent code injection.
 */
async function tryLoadRedis(): Promise<{
  createClient: (options: { url: string }) => RedisLikeClient;
} | null> {
  // The only allowed module path - hardcoded for security
  const REDIS_MODULE_PATH = 'redis';
  try {
    // Try/catch around dynamic import - if redis is not installed, this will fail
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const redisModule = require(REDIS_MODULE_PATH) as {
      createClient: (options: { url: string }) => RedisLikeClient;
    };
    return redisModule;
  } catch {
    // Redis module not available
    return null;
  }
}

async function doInit(): Promise<void> {
  if (redisClient) return;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    // No redis on CI or local, continue with in-memory
    return;
  }
  try {
    const redisModule = await tryLoadRedis();
    if (!redisModule || !redisModule.createClient) {
      return;
    }
    redisClient = redisModule.createClient({ url: redisUrl });
    await redisClient.connect();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn(
      '[cache] Redis init failed, falling back to in-memory cache',
      err instanceof Error ? err.message : err
    );
    redisClient = null;
  }
}

export async function initCacheIfNeeded(): Promise<void> {
  if (!initPromise) {
    initPromise = doInit();
  }
  await initPromise;
}

export async function cacheSet(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<void> {
  await initCacheIfNeeded();
  if (redisClient) {
    try {
      if (ttlSeconds) await redisClient.setEx(key, ttlSeconds, value);
      else await redisClient.set(key, value);
      return;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[cache] Redis set failed; writing to memory',
        err instanceof Error ? err.message : err
      );
    }
  }
  // Clear any existing timer for this key
  const existingTimer = ttlTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
    ttlTimers.delete(key);
  }
  inMemoryMap.set(key, value);
  if (ttlSeconds) {
    const timer = setTimeout(() => {
      inMemoryMap.delete(key);
      ttlTimers.delete(key);
    }, ttlSeconds * 1000);
    ttlTimers.set(key, timer);
  }
}

export async function cacheGet(key: string): Promise<string | null> {
  await initCacheIfNeeded();
  if (redisClient) {
    try {
      return await redisClient.get(key);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(
        '[cache] Redis get failed; falling back to memory',
        err instanceof Error ? err.message : err
      );
    }
  }
  return inMemoryMap.get(key) ?? null;
}

/**
 * Clear the in-memory cache and all TTL timers (useful for tests)
 */
export function clearInMemoryCache(): void {
  // Clear all pending timers to prevent memory leaks
  for (const timer of ttlTimers.values()) {
    clearTimeout(timer);
  }
  ttlTimers.clear();
  inMemoryMap.clear();
}

export default {
  initCacheIfNeeded,
  cacheSet,
  cacheGet,
  clearInMemoryCache,
};
