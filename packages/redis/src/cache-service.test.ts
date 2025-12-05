/**
 * Cache Service Tests
 *
 * Tests for the tenant-scoped caching service that provides
 * isolated caching for multi-tenant deployments.
 *
 * NOTE: These tests verify caching functionality using the in-memory
 * mock Redis client that's used when Upstash is not configured.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import redis from './client';
import {
  buildCacheKey,
  setCache,
  getCache,
  deleteCache,
  invalidateTenantCache,
  invalidateAllTenantCache,
  getOrSetCache,
  batchGetCache,
  isRedisAvailable,
  CACHE_PREFIX,
  DEFAULT_TTL,
} from './cache-service';

describe('Cache Service', () => {
  const testTenantId = 'test-tenant-123';

  beforeEach(async () => {
    // Clean up test tenant cache before each test
    await invalidateAllTenantCache(testTenantId);
  });

  describe('buildCacheKey', () => {
    it('should build a properly formatted cache key', () => {
      const key = buildCacheKey(testTenantId, CACHE_PREFIX.ACCRUAL, 'emp123');
      expect(key).toBe(`esta:${testTenantId}:accrual:emp123`);
    });

    it('should handle multiple key parts', () => {
      const key = buildCacheKey(
        testTenantId,
        CACHE_PREFIX.EMPLOYEE,
        'part1',
        'part2',
        'part3'
      );
      expect(key).toBe(`esta:${testTenantId}:employee:part1:part2:part3`);
    });
  });

  describe('setCache and getCache', () => {
    it('should set and retrieve a cached value', async () => {
      const testData = { id: '123', name: 'Test Employee' };

      await setCache(testTenantId, CACHE_PREFIX.EMPLOYEE, 'emp123', testData);
      const result = await getCache<typeof testData>(
        testTenantId,
        CACHE_PREFIX.EMPLOYEE,
        'emp123'
      );

      expect(result.hit).toBe(true);
      expect(result.data).toEqual(testData);
    });

    it('should return cache miss for non-existent keys', async () => {
      const result = await getCache(
        testTenantId,
        CACHE_PREFIX.EMPLOYEE,
        'nonexistent'
      );

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should respect TTL parameter', async () => {
      const testData = { value: 'test' };

      await setCache(
        testTenantId,
        CACHE_PREFIX.ACCRUAL,
        'ttl-test',
        testData,
        300
      );
      const result = await getCache<typeof testData>(
        testTenantId,
        CACHE_PREFIX.ACCRUAL,
        'ttl-test'
      );

      expect(result.hit).toBe(true);
      expect(result.ttl).toBeDefined();
      expect(result.ttl).toBeGreaterThan(0);
      expect(result.ttl).toBeLessThanOrEqual(300);
    });
  });

  describe('deleteCache', () => {
    it('should delete a cached value', async () => {
      await setCache(testTenantId, CACHE_PREFIX.EMPLOYER, 'to-delete', {
        value: 'test',
      });

      await deleteCache(testTenantId, CACHE_PREFIX.EMPLOYER, 'to-delete');

      const result = await getCache(
        testTenantId,
        CACHE_PREFIX.EMPLOYER,
        'to-delete'
      );
      expect(result.hit).toBe(false);
    });
  });

  describe('invalidateTenantCache', () => {
    it('should invalidate all cache entries for a prefix', async () => {
      // Set multiple cache entries
      await setCache(testTenantId, CACHE_PREFIX.ACCRUAL, 'key1', { v: 1 });
      await setCache(testTenantId, CACHE_PREFIX.ACCRUAL, 'key2', { v: 2 });
      await setCache(testTenantId, CACHE_PREFIX.EMPLOYEE, 'key3', { v: 3 });

      // Invalidate only accrual cache
      const count = await invalidateTenantCache(
        testTenantId,
        CACHE_PREFIX.ACCRUAL
      );
      expect(count).toBe(2);

      // Verify accrual keys are gone
      const result1 = await getCache(
        testTenantId,
        CACHE_PREFIX.ACCRUAL,
        'key1'
      );
      expect(result1.hit).toBe(false);

      // Verify employee key still exists
      const result2 = await getCache(
        testTenantId,
        CACHE_PREFIX.EMPLOYEE,
        'key3'
      );
      expect(result2.hit).toBe(true);
    });

    it('should return 0 when no keys match', async () => {
      const count = await invalidateTenantCache(
        testTenantId,
        CACHE_PREFIX.WORKLOGS
      );
      expect(count).toBe(0);
    });
  });

  describe('invalidateAllTenantCache', () => {
    it('should invalidate all cache entries for a tenant', async () => {
      await setCache(testTenantId, CACHE_PREFIX.ACCRUAL, 'key1', { v: 1 });
      await setCache(testTenantId, CACHE_PREFIX.EMPLOYEE, 'key2', { v: 2 });
      await setCache(testTenantId, CACHE_PREFIX.EMPLOYER, 'key3', { v: 3 });

      const count = await invalidateAllTenantCache(testTenantId);
      expect(count).toBe(3);

      // Verify all keys are gone
      const result1 = await getCache(
        testTenantId,
        CACHE_PREFIX.ACCRUAL,
        'key1'
      );
      const result2 = await getCache(
        testTenantId,
        CACHE_PREFIX.EMPLOYEE,
        'key2'
      );
      const result3 = await getCache(
        testTenantId,
        CACHE_PREFIX.EMPLOYER,
        'key3'
      );

      expect(result1.hit).toBe(false);
      expect(result2.hit).toBe(false);
      expect(result3.hit).toBe(false);
    });
  });

  describe('getOrSetCache', () => {
    it('should return cached value if exists', async () => {
      const existingData = { value: 'existing' };
      await setCache(
        testTenantId,
        CACHE_PREFIX.DASHBOARD,
        'cached',
        existingData
      );

      let factoryCalled = false;
      const result = await getOrSetCache(
        testTenantId,
        CACHE_PREFIX.DASHBOARD,
        'cached',
        async () => {
          factoryCalled = true;
          return { value: 'new' };
        }
      );

      expect(result).toEqual(existingData);
      expect(factoryCalled).toBe(false);
    });

    it('should call factory and cache result on miss', async () => {
      const newData = { value: 'computed' };

      const result = await getOrSetCache(
        testTenantId,
        CACHE_PREFIX.DASHBOARD,
        'new-key',
        async () => newData
      );

      expect(result).toEqual(newData);

      // Verify it was cached
      const cachedResult = await getCache(
        testTenantId,
        CACHE_PREFIX.DASHBOARD,
        'new-key'
      );
      expect(cachedResult.hit).toBe(true);
      expect(cachedResult.data).toEqual(newData);
    });
  });

  describe('batchGetCache', () => {
    it('should retrieve multiple cached values', async () => {
      await setCache(testTenantId, CACHE_PREFIX.REQUESTS, 'req1', { id: 1 });
      await setCache(testTenantId, CACHE_PREFIX.REQUESTS, 'req2', { id: 2 });

      const results = await batchGetCache<{ id: number }>(
        testTenantId,
        CACHE_PREFIX.REQUESTS,
        ['req1', 'req2', 'req3']
      );

      expect(results.get('req1')).toEqual({ hit: true, data: { id: 1 } });
      expect(results.get('req2')).toEqual({ hit: true, data: { id: 2 } });
      expect(results.get('req3')).toEqual({ hit: false, data: null });
    });
  });

  describe('isRedisAvailable', () => {
    it('should return true when redis is available', async () => {
      const available = await isRedisAvailable();
      // Mock redis always responds to ping
      expect(available).toBe(true);
    });
  });

  describe('DEFAULT_TTL constants', () => {
    it('should have correct TTL values', () => {
      expect(DEFAULT_TTL.SHORT).toBe(60);
      expect(DEFAULT_TTL.MEDIUM).toBe(300);
      expect(DEFAULT_TTL.LONG).toBe(1800);
      expect(DEFAULT_TTL.EXTENDED).toBe(3600);
      expect(DEFAULT_TTL.SNAPSHOT).toBe(86400);
    });
  });

  describe('CACHE_PREFIX constants', () => {
    it('should have all required prefixes', () => {
      expect(CACHE_PREFIX.ACCRUAL).toBe('accrual');
      expect(CACHE_PREFIX.EMPLOYEE).toBe('employee');
      expect(CACHE_PREFIX.EMPLOYER).toBe('employer');
      expect(CACHE_PREFIX.WORKLOGS).toBe('worklogs');
      expect(CACHE_PREFIX.REQUESTS).toBe('requests');
      expect(CACHE_PREFIX.DASHBOARD).toBe('dashboard');
      expect(CACHE_PREFIX.SNAPSHOT).toBe('snapshot');
    });
  });
});
