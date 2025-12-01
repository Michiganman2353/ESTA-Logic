/**
 * Accrual Snapshot Caching
 *
 * Deterministic caching for accrual calculations and report snapshots.
 * Designed for compliance reporting where reproducibility is critical.
 *
 * Features:
 * - Immutable snapshots with content-addressable keys
 * - Snapshot versioning for audit trail
 * - Bulk employee accrual caching
 * - Dashboard aggregate caching
 */

import {
  setCache,
  getCache,
  deleteCache,
  getOrSetCache,
  batchGetCache,
  CACHE_PREFIX,
  DEFAULT_TTL,
  type CacheResult,
} from './cache-service';

/**
 * Accrual balance snapshot for caching
 */
export interface AccrualSnapshot {
  employeeId: string;
  tenantId: string;
  snapshotDate: string; // ISO date string
  availablePaidHours: number;
  availableUnpaidHours: number;
  yearlyAccrued: number;
  yearlyUsed: number;
  carryoverFromPriorYear: number;
  calculatedAt: string; // ISO timestamp
  version: number;
}

/**
 * Dashboard aggregate snapshot
 */
export interface DashboardSnapshot {
  tenantId: string;
  snapshotDate: string;
  totalEmployees: number;
  totalAccruedHours: number;
  totalUsedHours: number;
  totalAvailableHours: number;
  pendingRequests: number;
  approvedRequestsThisMonth: number;
  complianceScore: number;
  calculatedAt: string;
}

/**
 * Bulk accrual data for employer dashboard
 */
export interface EmployerAccrualAggregate {
  employerId: string;
  tenantId: string;
  snapshotDate: string;
  employees: {
    id: string;
    name: string;
    availablePaid: number;
    availableUnpaid: number;
    yearlyAccrued: number;
    yearlyUsed: number;
  }[];
  totals: {
    totalAccrued: number;
    totalUsed: number;
    totalAvailable: number;
  };
  calculatedAt: string;
}

/**
 * Generate a deterministic cache key for an accrual snapshot
 *
 * @param employeeId - Employee identifier
 * @param snapshotDate - Date of the snapshot (YYYY-MM-DD)
 * @returns Deterministic cache key
 */
export function getAccrualSnapshotKey(
  employeeId: string,
  snapshotDate: string
): string {
  return `${employeeId}:${snapshotDate}`;
}

/**
 * Cache an accrual snapshot
 *
 * @param snapshot - Accrual snapshot to cache
 * @param ttlSeconds - TTL in seconds (default: 24 hours)
 */
export async function cacheAccrualSnapshot(
  snapshot: AccrualSnapshot,
  ttlSeconds: number = DEFAULT_TTL.SNAPSHOT
): Promise<void> {
  const key = getAccrualSnapshotKey(snapshot.employeeId, snapshot.snapshotDate);
  await setCache(
    snapshot.tenantId,
    CACHE_PREFIX.SNAPSHOT,
    key,
    snapshot,
    ttlSeconds
  );
}

/**
 * Get a cached accrual snapshot
 *
 * @param tenantId - Tenant identifier
 * @param employeeId - Employee identifier
 * @param snapshotDate - Date of the snapshot (YYYY-MM-DD)
 * @returns Cached snapshot or null
 */
export async function getCachedAccrualSnapshot(
  tenantId: string,
  employeeId: string,
  snapshotDate: string
): Promise<CacheResult<AccrualSnapshot>> {
  const key = getAccrualSnapshotKey(employeeId, snapshotDate);
  return getCache<AccrualSnapshot>(tenantId, CACHE_PREFIX.SNAPSHOT, key);
}

/**
 * Get or compute an accrual snapshot
 *
 * @param tenantId - Tenant identifier
 * @param employeeId - Employee identifier
 * @param snapshotDate - Date of the snapshot
 * @param computeSnapshot - Function to compute snapshot on cache miss
 * @returns Cached or freshly computed snapshot
 */
export async function getOrComputeAccrualSnapshot(
  tenantId: string,
  employeeId: string,
  snapshotDate: string,
  computeSnapshot: () => Promise<AccrualSnapshot>
): Promise<AccrualSnapshot> {
  const key = getAccrualSnapshotKey(employeeId, snapshotDate);
  return getOrSetCache(
    tenantId,
    CACHE_PREFIX.SNAPSHOT,
    key,
    computeSnapshot,
    DEFAULT_TTL.SNAPSHOT
  );
}

/**
 * Cache dashboard aggregate data
 *
 * @param snapshot - Dashboard snapshot to cache
 * @param ttlSeconds - TTL in seconds (default: 5 minutes)
 */
export async function cacheDashboardSnapshot(
  snapshot: DashboardSnapshot,
  ttlSeconds: number = DEFAULT_TTL.MEDIUM
): Promise<void> {
  const key = `dashboard:${snapshot.snapshotDate}`;
  await setCache(
    snapshot.tenantId,
    CACHE_PREFIX.DASHBOARD,
    key,
    snapshot,
    ttlSeconds
  );
}

/**
 * Get cached dashboard snapshot
 *
 * @param tenantId - Tenant identifier
 * @param snapshotDate - Date of the snapshot
 * @returns Cached dashboard snapshot or null
 */
export async function getCachedDashboardSnapshot(
  tenantId: string,
  snapshotDate: string
): Promise<CacheResult<DashboardSnapshot>> {
  const key = `dashboard:${snapshotDate}`;
  return getCache<DashboardSnapshot>(tenantId, CACHE_PREFIX.DASHBOARD, key);
}

/**
 * Get or compute dashboard snapshot
 *
 * @param tenantId - Tenant identifier
 * @param snapshotDate - Date of the snapshot
 * @param computeSnapshot - Function to compute snapshot on cache miss
 * @returns Cached or freshly computed dashboard snapshot
 */
export async function getOrComputeDashboardSnapshot(
  tenantId: string,
  snapshotDate: string,
  computeSnapshot: () => Promise<DashboardSnapshot>
): Promise<DashboardSnapshot> {
  const key = `dashboard:${snapshotDate}`;
  return getOrSetCache(
    tenantId,
    CACHE_PREFIX.DASHBOARD,
    key,
    computeSnapshot,
    DEFAULT_TTL.MEDIUM
  );
}

/**
 * Cache employer accrual aggregate
 *
 * @param aggregate - Employer accrual aggregate to cache
 * @param ttlSeconds - TTL in seconds (default: 5 minutes)
 */
export async function cacheEmployerAccrualAggregate(
  aggregate: EmployerAccrualAggregate,
  ttlSeconds: number = DEFAULT_TTL.MEDIUM
): Promise<void> {
  const key = `aggregate:${aggregate.employerId}:${aggregate.snapshotDate}`;
  await setCache(
    aggregate.tenantId,
    CACHE_PREFIX.ACCRUAL,
    key,
    aggregate,
    ttlSeconds
  );
}

/**
 * Get cached employer accrual aggregate
 *
 * @param tenantId - Tenant identifier
 * @param employerId - Employer identifier
 * @param snapshotDate - Date of the snapshot
 * @returns Cached aggregate or null
 */
export async function getCachedEmployerAccrualAggregate(
  tenantId: string,
  employerId: string,
  snapshotDate: string
): Promise<CacheResult<EmployerAccrualAggregate>> {
  const key = `aggregate:${employerId}:${snapshotDate}`;
  return getCache<EmployerAccrualAggregate>(
    tenantId,
    CACHE_PREFIX.ACCRUAL,
    key
  );
}

/**
 * Batch get employee accrual snapshots
 *
 * @param tenantId - Tenant identifier
 * @param employeeIds - Array of employee identifiers
 * @param snapshotDate - Date of the snapshots
 * @returns Map of employee ID to cache results
 */
export async function batchGetAccrualSnapshots(
  tenantId: string,
  employeeIds: string[],
  snapshotDate: string
): Promise<Map<string, CacheResult<AccrualSnapshot>>> {
  const keys = employeeIds.map((id) => getAccrualSnapshotKey(id, snapshotDate));
  return batchGetCache<AccrualSnapshot>(tenantId, CACHE_PREFIX.SNAPSHOT, keys);
}

/**
 * Invalidate employee accrual cache
 *
 * Call this when an employee's work hours are updated or
 * when sick time is used/approved.
 *
 * @param tenantId - Tenant identifier
 * @param employeeId - Employee identifier
 */
export async function invalidateEmployeeAccrualCache(
  tenantId: string,
  employeeId: string
): Promise<void> {
  // Invalidate today's snapshot
  const today = new Date().toISOString().slice(0, 10);
  const key = getAccrualSnapshotKey(employeeId, today);
  await deleteCache(tenantId, CACHE_PREFIX.SNAPSHOT, key);
}

/**
 * Invalidate dashboard cache for a tenant
 *
 * Call this when any data that affects the dashboard is updated.
 *
 * @param tenantId - Tenant identifier
 */
export async function invalidateDashboardCache(
  tenantId: string
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const key = `dashboard:${today}`;
  await deleteCache(tenantId, CACHE_PREFIX.DASHBOARD, key);
}
