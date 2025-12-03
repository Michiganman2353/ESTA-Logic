/**
 * Adapter Isolation Layer
 *
 * ============================================================================
 * MICROKERNEL ARCHITECTURE - PERSISTENCE ADAPTER BOUNDARY
 * ============================================================================
 *
 * This module defines the formal interfaces for persistence adapters.
 * All persistence operations MUST go through these interfaces.
 *
 * ARCHITECTURAL ROLE: Capability-Bounded I/O
 * - Adapters are EXTERNAL, UNTRUSTED providers
 * - They CANNOT execute business logic
 * - They CANNOT perform ESTA compliance calculations
 * - All operations require capability tokens from the kernel
 *
 * Key Design Principles:
 * 1. No business logic may import Firebase SDK or raw types directly
 * 2. All persistence is behind formal adapter interfaces
 * 3. Adapters are tenant-scoped for multi-tenancy isolation
 * 4. All operations are capability-checked before execution
 *
 * The adapter pattern provides:
 * - Clean separation between business logic and persistence
 * - Testability through mock implementations
 * - Portability to different storage backends
 * - Consistent error handling
 * - Kernel-controlled access via capabilities
 *
 * Reference: docs/ENGINEERING_PRINCIPLES.md
 * ============================================================================
 *
 * @module adapter
 */

import type { TenantId, CapabilityId } from './capability.js';

// ============================================================================
// SECTION 1: ADAPTER ERROR TYPES
// ============================================================================

/**
 * Base error type for adapter operations
 */
export type AdapterError =
  | { type: 'not_found'; resource: string; id: string }
  | { type: 'unauthorized'; message: string }
  | { type: 'forbidden'; message: string }
  | { type: 'conflict'; message: string }
  | { type: 'validation'; errors: readonly string[] }
  | { type: 'connection'; message: string }
  | { type: 'timeout'; operationMs: number }
  | { type: 'rate_limited'; retryAfterMs: number }
  | { type: 'internal'; message: string };

/**
 * Result type for adapter operations
 */
export type AdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AdapterError };

/**
 * Create a success result
 */
export function ok<T>(value: T): AdapterResult<T> {
  return { ok: true, value };
}

/**
 * Create a failure result
 */
export function err<T>(error: AdapterError): AdapterResult<T> {
  return { ok: false, error };
}

/**
 * Map over a result
 */
export function mapResult<T, U>(
  result: AdapterResult<T>,
  fn: (value: T) => U
): AdapterResult<U> {
  if (result.ok) {
    return { ok: true, value: fn(result.value) };
  }
  return result;
}

/**
 * Flat map over a result
 */
export function flatMapResult<T, U>(
  result: AdapterResult<T>,
  fn: (value: T) => AdapterResult<U>
): AdapterResult<U> {
  if (result.ok) {
    return fn(result.value);
  }
  return result;
}

// ============================================================================
// SECTION 2: QUERY TYPES
// ============================================================================

/**
 * Query filter operators
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'contains'
  | 'starts_with'
  | 'ends_with';

/**
 * Query filter condition
 */
export interface FilterCondition {
  readonly field: string;
  readonly operator: FilterOperator;
  readonly value: unknown;
}

/**
 * Query sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Query sort specification
 */
export interface SortSpec {
  readonly field: string;
  readonly direction: SortDirection;
}

/**
 * Query specification for listing/searching
 */
export interface QuerySpec {
  /** Filter conditions (AND) */
  readonly filters?: readonly FilterCondition[];
  /** Sort specifications */
  readonly orderBy?: readonly SortSpec[];
  /** Maximum results to return */
  readonly limit?: number;
  /** Offset for pagination */
  readonly offset?: number;
  /** Cursor for cursor-based pagination */
  readonly cursor?: string;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  /** Result items */
  readonly items: readonly T[];
  /** Total count (if available) */
  readonly totalCount?: number;
  /** Next page cursor */
  readonly nextCursor?: string;
  /** Has more results */
  readonly hasMore: boolean;
}

// ============================================================================
// SECTION 3: ENTITY METADATA
// ============================================================================

/**
 * Entity metadata present on all persisted entities
 */
export interface EntityMetadata {
  /** Unique identifier */
  readonly id: string;
  /** Tenant this entity belongs to */
  readonly tenantId: string;
  /** Creation timestamp */
  readonly createdAt: number;
  /** Last update timestamp */
  readonly updatedAt: number;
  /** Version for optimistic concurrency */
  readonly version: number;
  /** User who created this entity */
  readonly createdBy?: string;
  /** User who last updated this entity */
  readonly updatedBy?: string;
}

/**
 * Add metadata to an entity
 */
export function withMetadata<T>(
  entity: T,
  metadata: EntityMetadata
): T & EntityMetadata {
  return { ...entity, ...metadata };
}

// ============================================================================
// SECTION 4: REPOSITORY INTERFACE
// ============================================================================

/**
 * Generic repository interface for CRUD operations
 *
 * @template T - Entity type
 * @template CreateInput - Input type for creating entities
 * @template UpdateInput - Input type for updating entities
 */
export interface Repository<T, CreateInput, UpdateInput> {
  /**
   * Find an entity by ID
   */
  findById(id: string): Promise<AdapterResult<T | null>>;

  /**
   * Find entities matching a query
   */
  find(query: QuerySpec): Promise<AdapterResult<PaginatedResult<T>>>;

  /**
   * Find one entity matching a query
   */
  findOne(query: QuerySpec): Promise<AdapterResult<T | null>>;

  /**
   * Create a new entity
   */
  create(input: CreateInput): Promise<AdapterResult<T>>;

  /**
   * Update an existing entity
   */
  update(id: string, input: UpdateInput): Promise<AdapterResult<T>>;

  /**
   * Delete an entity
   */
  delete(id: string): Promise<AdapterResult<void>>;

  /**
   * Check if an entity exists
   */
  exists(id: string): Promise<AdapterResult<boolean>>;

  /**
   * Count entities matching a query
   */
  count(query?: QuerySpec): Promise<AdapterResult<number>>;
}

// ============================================================================
// SECTION 5: TENANT-SCOPED REPOSITORY
// ============================================================================

/**
 * Tenant-scoped repository context
 */
export interface RepositoryContext {
  /** Tenant ID for all operations */
  readonly tenantId: TenantId;
  /** User ID performing the operation */
  readonly userId?: string;
  /** Capabilities for authorization */
  readonly capabilities: readonly CapabilityId[];
  /** Current timestamp */
  readonly now: number;
}

/**
 * Tenant-scoped repository interface
 *
 * All operations are automatically scoped to the tenant in the context.
 */
export interface TenantScopedRepository<
  T,
  CreateInput,
  UpdateInput,
> extends Repository<T, CreateInput, UpdateInput> {
  /**
   * Get the repository context
   */
  getContext(): RepositoryContext;

  /**
   * Create a new repository with a different context
   */
  withContext(
    context: RepositoryContext
  ): TenantScopedRepository<T, CreateInput, UpdateInput>;
}

// ============================================================================
// SECTION 6: SPECIFIC ADAPTER INTERFACES
// ============================================================================

/**
 * Employee entity
 */
export interface Employee {
  readonly id: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly hireDate: number;
  readonly role: 'employee' | 'manager' | 'admin';
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly version: number;
}

/**
 * Employee create input
 */
export interface EmployeeCreateInput {
  readonly userId: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly hireDate: number;
  readonly role?: 'employee' | 'manager' | 'admin';
}

/**
 * Employee update input
 */
export interface EmployeeUpdateInput {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly hireDate?: number;
  readonly role?: 'employee' | 'manager' | 'admin';
}

/**
 * Employee repository interface
 */
export interface EmployeeRepository extends TenantScopedRepository<
  Employee,
  EmployeeCreateInput,
  EmployeeUpdateInput
> {
  /**
   * Find employee by email
   */
  findByEmail(email: string): Promise<AdapterResult<Employee | null>>;

  /**
   * Find employee by user ID
   */
  findByUserId(userId: string): Promise<AdapterResult<Employee | null>>;
}

/**
 * Accrual record entity
 */
export interface AccrualRecord {
  readonly id: string;
  readonly tenantId: string;
  readonly employeeId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly hoursWorked: number;
  readonly hoursAccrued: number;
  readonly hoursUsed: number;
  readonly balance: number;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly version: number;
}

/**
 * Accrual record create input
 */
export interface AccrualRecordCreateInput {
  readonly employeeId: string;
  readonly periodStart: number;
  readonly periodEnd: number;
  readonly hoursWorked: number;
  readonly hoursAccrued: number;
  readonly hoursUsed?: number;
}

/**
 * Accrual record update input
 */
export interface AccrualRecordUpdateInput {
  readonly hoursWorked?: number;
  readonly hoursAccrued?: number;
  readonly hoursUsed?: number;
  readonly balance?: number;
}

/**
 * Accrual repository interface
 */
export interface AccrualRepository extends TenantScopedRepository<
  AccrualRecord,
  AccrualRecordCreateInput,
  AccrualRecordUpdateInput
> {
  /**
   * Find accruals for an employee
   */
  findByEmployee(
    employeeId: string,
    query?: QuerySpec
  ): Promise<AdapterResult<PaginatedResult<AccrualRecord>>>;

  /**
   * Find accruals in a date range
   */
  findByDateRange(
    startDate: number,
    endDate: number,
    query?: QuerySpec
  ): Promise<AdapterResult<PaginatedResult<AccrualRecord>>>;

  /**
   * Get current balance for an employee
   */
  getCurrentBalance(employeeId: string): Promise<AdapterResult<number>>;
}

/**
 * Audit log entry
 */
export interface AuditLogEntry {
  readonly id: string;
  readonly tenantId: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly userId?: string;
  readonly timestamp: number;
  readonly details: Record<string, unknown>;
  readonly traceId?: string;
}

/**
 * Audit log create input
 */
export interface AuditLogCreateInput {
  readonly action: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly userId?: string;
  readonly details?: Record<string, unknown>;
  readonly traceId?: string;
}

/**
 * Audit log repository interface
 */
export interface AuditLogRepository {
  /**
   * Log an audit event
   */
  log(entry: AuditLogCreateInput): Promise<AdapterResult<AuditLogEntry>>;

  /**
   * Find audit logs
   */
  find(
    query: QuerySpec
  ): Promise<AdapterResult<PaginatedResult<AuditLogEntry>>>;

  /**
   * Find audit logs for a resource
   */
  findByResource(
    resourceType: string,
    resourceId: string,
    query?: QuerySpec
  ): Promise<AdapterResult<PaginatedResult<AuditLogEntry>>>;

  /**
   * Find audit logs by user
   */
  findByUser(
    userId: string,
    query?: QuerySpec
  ): Promise<AdapterResult<PaginatedResult<AuditLogEntry>>>;
}

// ============================================================================
// SECTION 7: ADAPTER FACTORY
// ============================================================================

/**
 * Adapter factory for creating tenant-scoped repositories
 */
export interface AdapterFactory {
  /**
   * Create an employee repository
   */
  createEmployeeRepository(context: RepositoryContext): EmployeeRepository;

  /**
   * Create an accrual repository
   */
  createAccrualRepository(context: RepositoryContext): AccrualRepository;

  /**
   * Create an audit log repository
   */
  createAuditLogRepository(context: RepositoryContext): AuditLogRepository;
}

// ============================================================================
// SECTION 8: TRANSACTION SUPPORT
// ============================================================================

/**
 * Transaction isolation level
 */
export type IsolationLevel =
  | 'read_uncommitted'
  | 'read_committed'
  | 'repeatable_read'
  | 'serializable';

/**
 * Transaction options
 */
export interface TransactionOptions {
  /** Isolation level */
  readonly isolationLevel?: IsolationLevel;
  /** Timeout in milliseconds */
  readonly timeoutMs?: number;
  /** Whether the transaction is read-only */
  readonly readOnly?: boolean;
}

/**
 * Transaction interface
 */
export interface Transaction {
  /**
   * Commit the transaction
   */
  commit(): Promise<AdapterResult<void>>;

  /**
   * Rollback the transaction
   */
  rollback(): Promise<AdapterResult<void>>;
}

/**
 * Transactional adapter factory
 */
export interface TransactionalAdapterFactory extends AdapterFactory {
  /**
   * Run operations in a transaction
   */
  runInTransaction<T>(
    fn: (factory: AdapterFactory) => Promise<T>,
    options?: TransactionOptions
  ): Promise<AdapterResult<T>>;
}

// ============================================================================
// SECTION 9: HEALTH CHECK
// ============================================================================

/**
 * Health status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Health check result
 */
export interface HealthCheckResult {
  /** Overall status */
  readonly status: HealthStatus;
  /** Last successful check timestamp */
  readonly lastSuccessfulCheck?: number;
  /** Error message if unhealthy */
  readonly error?: string;
  /** Additional details */
  readonly details?: Record<string, unknown>;
}

/**
 * Health checkable adapter
 */
export interface HealthCheckable {
  /**
   * Check adapter health
   */
  healthCheck(): Promise<HealthCheckResult>;
}

// ============================================================================
// SECTION 10: MOCK ADAPTER FOR TESTING
// ============================================================================

/**
 * In-memory storage for mock adapter
 */
export interface InMemoryStorage<T> {
  readonly items: Map<string, T>;
}

/**
 * Create an in-memory repository for testing
 */
export function createInMemoryRepository<
  T extends EntityMetadata,
  CreateInput,
  UpdateInput,
>(
  context: RepositoryContext,
  storage: InMemoryStorage<T>,
  createEntity: (input: CreateInput, metadata: EntityMetadata) => T,
  updateEntity: (
    entity: T,
    input: UpdateInput,
    metadata: Partial<EntityMetadata>
  ) => T
): TenantScopedRepository<T, CreateInput, UpdateInput> {
  const generateId = (): string =>
    `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;

  return {
    getContext: () => context,

    withContext(newContext: RepositoryContext) {
      return createInMemoryRepository(
        newContext,
        storage,
        createEntity,
        updateEntity
      );
    },

    async findById(id: string): Promise<AdapterResult<T | null>> {
      const item = storage.items.get(id);
      if (!item) return ok(null);
      if (item.tenantId !== context.tenantId.value) return ok(null);
      return ok(item);
    },

    async find(query: QuerySpec): Promise<AdapterResult<PaginatedResult<T>>> {
      let items = Array.from(storage.items.values()).filter(
        (item) => item.tenantId === context.tenantId.value
      );

      // Apply filters
      if (query.filters) {
        for (const filter of query.filters) {
          items = items.filter((item) => {
            const value = (item as Record<string, unknown>)[filter.field];
            switch (filter.operator) {
              case 'eq':
                return value === filter.value;
              case 'neq':
                return value !== filter.value;
              case 'gt':
                return (value as number) > (filter.value as number);
              case 'gte':
                return (value as number) >= (filter.value as number);
              case 'lt':
                return (value as number) < (filter.value as number);
              case 'lte':
                return (value as number) <= (filter.value as number);
              case 'in':
                return (filter.value as unknown[]).includes(value);
              case 'not_in':
                return !(filter.value as unknown[]).includes(value);
              default:
                return true;
            }
          });
        }
      }

      // Apply sorting
      if (query.orderBy && query.orderBy.length > 0) {
        items.sort((a, b) => {
          for (const sort of query.orderBy!) {
            const aVal = (a as Record<string, unknown>)[sort.field] as
              | string
              | number
              | boolean;
            const bVal = (b as Record<string, unknown>)[sort.field] as
              | string
              | number
              | boolean;
            if (aVal < bVal) return sort.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sort.direction === 'asc' ? 1 : -1;
          }
          return 0;
        });
      }

      const totalCount = items.length;

      // Apply pagination
      const offset = query.offset ?? 0;
      const limit = query.limit ?? 100;
      items = items.slice(offset, offset + limit);

      return ok({
        items,
        totalCount,
        hasMore: offset + items.length < totalCount,
      });
    },

    async findOne(query: QuerySpec): Promise<AdapterResult<T | null>> {
      const result = await this.find({ ...query, limit: 1 });
      if (!result.ok) return result;
      return ok(result.value.items[0] ?? null);
    },

    async create(input: CreateInput): Promise<AdapterResult<T>> {
      const id = generateId();
      const now = context.now;
      const metadata: EntityMetadata = {
        id,
        tenantId: context.tenantId.value,
        createdAt: now,
        updatedAt: now,
        version: 1,
        createdBy: context.userId,
        updatedBy: context.userId,
      };
      const entity = createEntity(input, metadata);
      storage.items.set(id, entity);
      return ok(entity);
    },

    async update(id: string, input: UpdateInput): Promise<AdapterResult<T>> {
      const existing = storage.items.get(id);
      if (!existing) {
        return err({ type: 'not_found', resource: 'entity', id });
      }
      if (existing.tenantId !== context.tenantId.value) {
        return err({
          type: 'forbidden',
          message: 'Cannot update entity from different tenant',
        });
      }
      const now = context.now;
      const updated = updateEntity(existing, input, {
        updatedAt: now,
        version: existing.version + 1,
        updatedBy: context.userId,
      });
      storage.items.set(id, updated);
      return ok(updated);
    },

    async delete(id: string): Promise<AdapterResult<void>> {
      const existing = storage.items.get(id);
      if (!existing) {
        return err({ type: 'not_found', resource: 'entity', id });
      }
      if (existing.tenantId !== context.tenantId.value) {
        return err({
          type: 'forbidden',
          message: 'Cannot delete entity from different tenant',
        });
      }
      storage.items.delete(id);
      return ok(undefined);
    },

    async exists(id: string): Promise<AdapterResult<boolean>> {
      const item = storage.items.get(id);
      return ok(item !== undefined && item.tenantId === context.tenantId.value);
    },

    async count(query?: QuerySpec): Promise<AdapterResult<number>> {
      const result = await this.find(query ?? {});
      if (!result.ok) return result;
      return ok(result.value.totalCount ?? result.value.items.length);
    },
  };
}
