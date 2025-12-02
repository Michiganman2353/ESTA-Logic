import { Redis } from '@upstash/redis';

/**
 * Flag to track if initialization warning has been logged
 */
let initWarningLogged = false;

/**
 * In-memory fallback cache for environments without Redis
 */
const inMemoryCache = new Map<string, { value: string; expires?: number }>();

/**
 * Mock Redis client for fallback when Upstash Redis is not configured
 */
const mockRedis = {
  get: async (key: string): Promise<string | null> => {
    const entry = inMemoryCache.get(key);
    if (!entry) return null;
    if (entry.expires && Date.now() > entry.expires) {
      inMemoryCache.delete(key);
      return null;
    }
    return entry.value;
  },
  set: async (key: string, value: string): Promise<string> => {
    inMemoryCache.set(key, { value });
    return 'OK';
  },
  setex: async (
    key: string,
    seconds: number,
    value: string
  ): Promise<string> => {
    inMemoryCache.set(key, { value, expires: Date.now() + seconds * 1000 });
    return 'OK';
  },
  del: async (...keys: string[]): Promise<number> => {
    let count = 0;
    for (const key of keys) {
      if (inMemoryCache.delete(key)) count++;
    }
    return count;
  },
  keys: async (pattern: string): Promise<string[]> => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return Array.from(inMemoryCache.keys()).filter((k) => regex.test(k));
  },
  mget: async <T extends string[]>(...keys: T): Promise<(string | null)[]> => {
    return keys.map((key) => {
      const entry = inMemoryCache.get(key);
      if (!entry) return null;
      if (entry.expires && Date.now() > entry.expires) {
        inMemoryCache.delete(key);
        return null;
      }
      return entry.value;
    });
  },
  ttl: async (key: string): Promise<number> => {
    const entry = inMemoryCache.get(key);
    if (!entry || !entry.expires) return -1;
    const remaining = Math.ceil((entry.expires - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  },
  ping: async (): Promise<string> => 'PONG',
};

/**
 * Create Redis client with fallback to in-memory cache
 * Uses Upstash Redis if environment variables are configured,
 * otherwise falls back to in-memory cache for CI/tests/local development.
 */
function createRedisClient(): typeof mockRedis {
  const url = process.env.UPSTASH_REDIS_URL;
  const token = process.env.UPSTASH_REDIS_TOKEN;

  if (url && token) {
    try {
      const redis = new Redis({ url, token });
      return redis as unknown as typeof mockRedis;
    } catch (err) {
      if (!initWarningLogged) {
        // eslint-disable-next-line no-console
        console.warn(
          '[redis] Failed to initialize Upstash Redis, using in-memory fallback:',
          err instanceof Error ? err.message : err
        );
        initWarningLogged = true;
      }
      return mockRedis;
    }
  }

  // No Redis configuration, use in-memory fallback
  if (!initWarningLogged && process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.warn(
      '[redis] UPSTASH_REDIS_URL/TOKEN not configured, using in-memory fallback'
    );
    initWarningLogged = true;
  }
  return mockRedis;
}

const redis = createRedisClient();

export default redis;
