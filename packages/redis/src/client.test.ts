/**
 * Redis Client Tests
 *
 * Tests for the Redis client module that provides an in-memory fallback
 * when Upstash Redis is not configured (e.g., in CI/test environments).
 *
 * NOTE: These tests verify the mock Redis implementation which is used
 * as a fallback when UPSTASH_REDIS_URL and UPSTASH_REDIS_TOKEN are not set.
 *
 * Fix History:
 * - Resolved duplicate --passWithNoTests flag issue by removing it from
 *   package.json test script (should only be passed by CI command).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import redis from './client';

describe('Redis Client', () => {
  beforeEach(async () => {
    // Clean up any existing keys before each test
    // Since we're using in-memory mock, we can use pattern matching
    const testKeys = await redis.keys('test:*');
    if (testKeys.length > 0) {
      await redis.del(...testKeys);
    }
  });

  describe('Basic Operations', () => {
    it('should set and get a string value', async () => {
      const result = await redis.set('test:key1', 'value1');
      expect(result).toBe('OK');

      const value = await redis.get('test:key1');
      expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const value = await redis.get('test:nonexistent');
      expect(value).toBeNull();
    });

    it('should delete a key', async () => {
      await redis.set('test:toDelete', 'value');
      const count = await redis.del('test:toDelete');
      expect(count).toBe(1);

      const value = await redis.get('test:toDelete');
      expect(value).toBeNull();
    });

    it('should delete multiple keys', async () => {
      await redis.set('test:multi1', 'value1');
      await redis.set('test:multi2', 'value2');

      const count = await redis.del('test:multi1', 'test:multi2');
      expect(count).toBe(2);
    });

    it('should return 0 when deleting non-existent keys', async () => {
      const count = await redis.del('test:doesNotExist');
      expect(count).toBe(0);
    });

    it('should respond to ping', async () => {
      const result = await redis.ping();
      expect(result).toBe('PONG');
    });
  });

  describe('SETEX with TTL', () => {
    it('should set a key with expiration', async () => {
      const result = await redis.setex('test:ttlKey', 60, 'value');
      expect(result).toBe('OK');

      const value = await redis.get('test:ttlKey');
      expect(value).toBe('value');
    });

    it('should report TTL for a key with expiration', async () => {
      await redis.setex('test:ttlCheck', 300, 'value');
      const ttl = await redis.ttl('test:ttlCheck');

      // TTL should be positive and close to 300
      expect(ttl).toBeGreaterThan(0);
      expect(ttl).toBeLessThanOrEqual(300);
    });

    it('should return -1 for keys without TTL', async () => {
      await redis.set('test:noTtl', 'value');
      const ttl = await redis.ttl('test:noTtl');
      expect(ttl).toBe(-1);
    });
  });

  describe('MGET - Multiple Get', () => {
    it('should get multiple values at once', async () => {
      await redis.set('test:mget1', 'value1');
      await redis.set('test:mget2', 'value2');
      await redis.set('test:mget3', 'value3');

      const values = await redis.mget('test:mget1', 'test:mget2', 'test:mget3');
      expect(values).toEqual(['value1', 'value2', 'value3']);
    });

    it('should return null for missing keys in mget', async () => {
      await redis.set('test:exists', 'value');

      const values = await redis.mget('test:exists', 'test:missing');
      expect(values).toEqual(['value', null]);
    });
  });

  describe('KEYS - Pattern Matching', () => {
    it('should find keys matching a pattern', async () => {
      await redis.set('test:pattern:a', '1');
      await redis.set('test:pattern:b', '2');
      await redis.set('test:other:c', '3');

      const keys = await redis.keys('test:pattern:*');
      expect(keys).toHaveLength(2);
      expect(keys).toContain('test:pattern:a');
      expect(keys).toContain('test:pattern:b');
    });

    it('should return empty array when no keys match', async () => {
      const keys = await redis.keys('nonexistent:*');
      expect(keys).toEqual([]);
    });
  });
});
