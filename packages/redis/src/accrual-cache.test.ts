/**
 * Accrual Cache Tests
 *
 * Tests for the accrual snapshot caching module that provides
 * deterministic caching for compliance reporting.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { invalidateAllTenantCache } from './cache-service';
import {
  getAccrualSnapshotKey,
  cacheAccrualSnapshot,
  getCachedAccrualSnapshot,
  getOrComputeAccrualSnapshot,
  cacheDashboardSnapshot,
  getCachedDashboardSnapshot,
  getOrComputeDashboardSnapshot,
  cacheEmployerAccrualAggregate,
  getCachedEmployerAccrualAggregate,
  batchGetAccrualSnapshots,
  invalidateEmployeeAccrualCache,
  invalidateDashboardCache,
  type AccrualSnapshot,
  type DashboardSnapshot,
  type EmployerAccrualAggregate,
} from './accrual-cache';

describe('Accrual Cache', () => {
  const testTenantId = 'accrual-test-tenant';
  const testEmployeeId = 'emp-001';
  const testDate = '2025-01-15';

  beforeEach(async () => {
    await invalidateAllTenantCache(testTenantId);
  });

  describe('getAccrualSnapshotKey', () => {
    it('should generate deterministic cache key', () => {
      const key = getAccrualSnapshotKey('emp123', '2025-03-15');
      expect(key).toBe('emp123:2025-03-15');
    });
  });

  describe('cacheAccrualSnapshot and getCachedAccrualSnapshot', () => {
    const createSnapshot = (
      overrides: Partial<AccrualSnapshot> = {}
    ): AccrualSnapshot => ({
      employeeId: testEmployeeId,
      tenantId: testTenantId,
      snapshotDate: testDate,
      availablePaidHours: 40,
      availableUnpaidHours: 0,
      yearlyAccrued: 48,
      yearlyUsed: 8,
      carryoverFromPriorYear: 0,
      calculatedAt: new Date().toISOString(),
      version: 1,
      ...overrides,
    });

    it('should cache and retrieve accrual snapshot', async () => {
      const snapshot = createSnapshot();

      await cacheAccrualSnapshot(snapshot);

      const result = await getCachedAccrualSnapshot(
        testTenantId,
        testEmployeeId,
        testDate
      );

      expect(result.hit).toBe(true);
      expect(result.data).toEqual(snapshot);
    });

    it('should return cache miss for non-cached snapshot', async () => {
      const result = await getCachedAccrualSnapshot(
        testTenantId,
        'nonexistent-emp',
        testDate
      );

      expect(result.hit).toBe(false);
      expect(result.data).toBeNull();
    });

    it('should handle custom TTL', async () => {
      const snapshot = createSnapshot();

      await cacheAccrualSnapshot(snapshot, 600);

      const result = await getCachedAccrualSnapshot(
        testTenantId,
        testEmployeeId,
        testDate
      );

      expect(result.hit).toBe(true);
      expect(result.ttl).toBeDefined();
      expect(result.ttl).toBeLessThanOrEqual(600);
    });
  });

  describe('getOrComputeAccrualSnapshot', () => {
    it('should return cached value if exists', async () => {
      const snapshot: AccrualSnapshot = {
        employeeId: testEmployeeId,
        tenantId: testTenantId,
        snapshotDate: testDate,
        availablePaidHours: 40,
        availableUnpaidHours: 0,
        yearlyAccrued: 48,
        yearlyUsed: 8,
        carryoverFromPriorYear: 0,
        calculatedAt: new Date().toISOString(),
        version: 1,
      };

      await cacheAccrualSnapshot(snapshot);

      let computeCalled = false;
      const result = await getOrComputeAccrualSnapshot(
        testTenantId,
        testEmployeeId,
        testDate,
        async () => {
          computeCalled = true;
          return { ...snapshot, version: 999 };
        }
      );

      expect(computeCalled).toBe(false);
      expect(result.version).toBe(1);
    });

    it('should compute and cache value on miss', async () => {
      const computed: AccrualSnapshot = {
        employeeId: testEmployeeId,
        tenantId: testTenantId,
        snapshotDate: '2025-02-01',
        availablePaidHours: 20,
        availableUnpaidHours: 0,
        yearlyAccrued: 24,
        yearlyUsed: 4,
        carryoverFromPriorYear: 0,
        calculatedAt: new Date().toISOString(),
        version: 1,
      };

      const result = await getOrComputeAccrualSnapshot(
        testTenantId,
        testEmployeeId,
        '2025-02-01',
        async () => computed
      );

      expect(result).toEqual(computed);

      // Verify it was cached
      const cached = await getCachedAccrualSnapshot(
        testTenantId,
        testEmployeeId,
        '2025-02-01'
      );
      expect(cached.hit).toBe(true);
    });
  });

  describe('Dashboard Snapshot Caching', () => {
    const createDashboardSnapshot = (): DashboardSnapshot => ({
      tenantId: testTenantId,
      snapshotDate: testDate,
      totalEmployees: 50,
      totalAccruedHours: 2400,
      totalUsedHours: 400,
      totalAvailableHours: 2000,
      pendingRequests: 5,
      approvedRequestsThisMonth: 12,
      complianceScore: 98,
      calculatedAt: new Date().toISOString(),
    });

    it('should cache and retrieve dashboard snapshot', async () => {
      const snapshot = createDashboardSnapshot();

      await cacheDashboardSnapshot(snapshot);

      const result = await getCachedDashboardSnapshot(testTenantId, testDate);

      expect(result.hit).toBe(true);
      expect(result.data).toEqual(snapshot);
    });

    it('should use getOrComputeDashboardSnapshot correctly', async () => {
      const snapshot = createDashboardSnapshot();

      const result = await getOrComputeDashboardSnapshot(
        testTenantId,
        '2025-03-01',
        async () => snapshot
      );

      expect(result.totalEmployees).toBe(50);

      // Second call should use cache
      let factoryCalled = false;
      await getOrComputeDashboardSnapshot(
        testTenantId,
        '2025-03-01',
        async () => {
          factoryCalled = true;
          return snapshot;
        }
      );

      expect(factoryCalled).toBe(false);
    });
  });

  describe('Employer Accrual Aggregate Caching', () => {
    const createAggregate = (): EmployerAccrualAggregate => ({
      employerId: 'employer-001',
      tenantId: testTenantId,
      snapshotDate: testDate,
      employees: [
        {
          id: 'emp-001',
          name: 'John Doe',
          availablePaid: 40,
          availableUnpaid: 0,
          yearlyAccrued: 48,
          yearlyUsed: 8,
        },
        {
          id: 'emp-002',
          name: 'Jane Smith',
          availablePaid: 32,
          availableUnpaid: 0,
          yearlyAccrued: 40,
          yearlyUsed: 8,
        },
      ],
      totals: {
        totalAccrued: 88,
        totalUsed: 16,
        totalAvailable: 72,
      },
      calculatedAt: new Date().toISOString(),
    });

    it('should cache and retrieve employer aggregate', async () => {
      const aggregate = createAggregate();

      await cacheEmployerAccrualAggregate(aggregate);

      const result = await getCachedEmployerAccrualAggregate(
        testTenantId,
        'employer-001',
        testDate
      );

      expect(result.hit).toBe(true);
      expect(result.data?.employees).toHaveLength(2);
      expect(result.data?.totals.totalAvailable).toBe(72);
    });
  });

  describe('batchGetAccrualSnapshots', () => {
    it('should batch retrieve multiple snapshots', async () => {
      // Cache two snapshots
      const snapshot1: AccrualSnapshot = {
        employeeId: 'emp-batch-1',
        tenantId: testTenantId,
        snapshotDate: testDate,
        availablePaidHours: 10,
        availableUnpaidHours: 0,
        yearlyAccrued: 12,
        yearlyUsed: 2,
        carryoverFromPriorYear: 0,
        calculatedAt: new Date().toISOString(),
        version: 1,
      };

      const snapshot2: AccrualSnapshot = {
        ...snapshot1,
        employeeId: 'emp-batch-2',
        availablePaidHours: 20,
      };

      await cacheAccrualSnapshot(snapshot1);
      await cacheAccrualSnapshot(snapshot2);

      const results = await batchGetAccrualSnapshots(
        testTenantId,
        ['emp-batch-1', 'emp-batch-2', 'emp-batch-missing'],
        testDate
      );

      expect(results.size).toBe(3);
      expect(results.get('emp-batch-1:2025-01-15')?.hit).toBe(true);
      expect(results.get('emp-batch-2:2025-01-15')?.hit).toBe(true);
      expect(results.get('emp-batch-missing:2025-01-15')?.hit).toBe(false);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate employee accrual cache', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const snapshot: AccrualSnapshot = {
        employeeId: 'emp-invalidate',
        tenantId: testTenantId,
        snapshotDate: today,
        availablePaidHours: 10,
        availableUnpaidHours: 0,
        yearlyAccrued: 12,
        yearlyUsed: 2,
        carryoverFromPriorYear: 0,
        calculatedAt: new Date().toISOString(),
        version: 1,
      };

      await cacheAccrualSnapshot(snapshot);

      await invalidateEmployeeAccrualCache(testTenantId, 'emp-invalidate');

      const result = await getCachedAccrualSnapshot(
        testTenantId,
        'emp-invalidate',
        today
      );
      expect(result.hit).toBe(false);
    });

    it('should invalidate dashboard cache', async () => {
      const today = new Date().toISOString().slice(0, 10);
      const snapshot: DashboardSnapshot = {
        tenantId: testTenantId,
        snapshotDate: today,
        totalEmployees: 10,
        totalAccruedHours: 100,
        totalUsedHours: 10,
        totalAvailableHours: 90,
        pendingRequests: 2,
        approvedRequestsThisMonth: 5,
        complianceScore: 100,
        calculatedAt: new Date().toISOString(),
      };

      await cacheDashboardSnapshot(snapshot);

      await invalidateDashboardCache(testTenantId);

      const result = await getCachedDashboardSnapshot(testTenantId, today);
      expect(result.hit).toBe(false);
    });
  });
});
