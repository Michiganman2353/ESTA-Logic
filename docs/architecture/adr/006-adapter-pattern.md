# ADR 006: Adapter Pattern for Persistence Isolation

**Status**: Implemented (Partial)  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team  
**Replaces**: N/A

## Context

ESTA-Logic currently has direct Firebase SDK dependencies in some backend routes. This creates several problems:

1. **Testing Difficulty**: Unit tests require Firebase emulator or mocks
2. **Vendor Lock-In**: Business logic tied to Firebase data model
3. **Multi-Tenancy Leaks**: Tenant isolation relies on discipline, not enforcement
4. **Portability**: Cannot easily switch to different database

### Current Problems

```typescript
// ❌ Current: Direct Firebase import in route
import { db } from '@esta/firebase';

async function getEmployee(id: string) {
  const doc = await db.collection('employees').doc(id).get();
  return doc.data();
}
```

### Desired State

```typescript
// ✅ Target: Adapter-based access
async function getEmployee(
  repo: EmployeeRepository,
  id: string,
  tenantId: TenantId
) {
  return repo.findById(tenantId, id);
}
```

## Decision

We adopt the **Repository Pattern** with tenant-scoped adapters.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Accrual Service │ Employee Service │ PTO Request Service  ││
│  │       ▼                  ▼                   ▼              ││
│  │  Repository<Employee>   Repository<Accrual>  Repository<PTO>││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│                        Adapter Layer                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    AdapterFactory                          │  │
│  │   createRepository()  │  createTransaction()  │  health() │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                   │
│        ┌─────────────────────┼─────────────────────┐            │
│        │                     │                     │            │
│        ▼                     ▼                     ▼            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Firebase   │  │   SQLite     │  │   Postgres   │          │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Repository Interface

```typescript
// libs/kernel-boundary/src/adapter.ts

/**
 * Base repository interface
 * All data access goes through this abstraction
 */
export interface Repository<T, CreateInput, UpdateInput> {
  findById(id: string): Promise<AdapterResult<T | null>>;

  findMany(query: QuerySpec): Promise<AdapterResult<PaginatedResult<T>>>;

  create(input: CreateInput): Promise<AdapterResult<T>>;

  update(id: string, input: UpdateInput): Promise<AdapterResult<T>>;

  delete(id: string): Promise<AdapterResult<void>>;
}

/**
 * Tenant-scoped repository
 * All queries automatically scoped to tenant
 */
export interface TenantScopedRepository<
  T,
  CreateInput,
  UpdateInput,
> extends Repository<T, CreateInput, UpdateInput> {
  readonly tenantId: TenantId;
}
```

### Query Specification

```typescript
export interface QuerySpec {
  filters?: FilterCondition[];
  sort?: SortSpec[];
  pagination?: {
    limit: number;
    offset?: number;
    cursor?: string;
  };
  select?: string[]; // Field projection
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: unknown;
}

export type FilterOperator =
  | 'eq' // Equal
  | 'neq' // Not equal
  | 'gt' // Greater than
  | 'gte' // Greater or equal
  | 'lt' // Less than
  | 'lte' // Less or equal
  | 'in' // In array
  | 'nin' // Not in array
  | 'contains' // String contains
  | 'startsWith';
```

### Adapter Factory

```typescript
export interface AdapterFactory {
  /**
   * Create a tenant-scoped repository
   */
  createRepository<T, CreateInput, UpdateInput>(
    entityType: string,
    tenantId: TenantId
  ): TenantScopedRepository<T, CreateInput, UpdateInput>;

  /**
   * Check adapter health
   */
  health(): Promise<HealthCheckResult>;
}

export interface TransactionalAdapterFactory extends AdapterFactory {
  /**
   * Begin a transaction
   */
  beginTransaction(options?: TransactionOptions): Promise<Transaction>;
}
```

### Specific Repositories

```typescript
// Employee Repository
export interface EmployeeRepository extends TenantScopedRepository<
  Employee,
  EmployeeCreateInput,
  EmployeeUpdateInput
> {
  findByEmail(email: string): Promise<AdapterResult<Employee | null>>;

  findActiveByDepartment(
    department: string
  ): Promise<AdapterResult<Employee[]>>;
}

// Accrual Repository
export interface AccrualRepository extends TenantScopedRepository<
  AccrualRecord,
  AccrualRecordCreateInput,
  AccrualRecordUpdateInput
> {
  findByEmployeeId(employeeId: string): Promise<AdapterResult<AccrualRecord[]>>;

  findByPeriod(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<AdapterResult<AccrualRecord[]>>;
}

// Audit Log Repository (Append-Only)
export interface AuditLogRepository {
  readonly tenantId: TenantId;

  append(entry: AuditLogCreateInput): Promise<AdapterResult<AuditLogEntry>>;

  findByEntityId(entityId: string): Promise<AdapterResult<AuditLogEntry[]>>;

  findByTimeRange(
    startTime: Date,
    endTime: Date
  ): Promise<AdapterResult<AuditLogEntry[]>>;
}
```

## Implementation

### Firebase Adapter (Production)

```typescript
// libs/adapters/firebase/src/employee-repository.ts
export class FirebaseEmployeeRepository implements EmployeeRepository {
  readonly tenantId: TenantId;
  private readonly collection: CollectionReference;

  constructor(db: Firestore, tenantId: TenantId) {
    this.tenantId = tenantId;
    // All queries automatically scoped to tenant
    this.collection = db
      .collection('tenants')
      .doc(tenantId.value)
      .collection('employees');
  }

  async findById(id: string): Promise<AdapterResult<Employee | null>> {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) return ok(null);
      return ok(this.mapDocument(doc));
    } catch (error) {
      return err({ type: 'database_error', cause: error });
    }
  }

  // ... other methods
}
```

### In-Memory Adapter (Testing)

```typescript
// libs/kernel-boundary/src/adapter.ts
export function createInMemoryRepository<T extends { id: string }>(
  storage?: InMemoryStorage<T>
): Repository<T, Omit<T, 'id'>, Partial<T>> {
  const data = storage ?? new Map<string, T>();

  return {
    async findById(id) {
      const entity = data.get(id);
      return ok(entity ?? null);
    },

    async create(input) {
      const id = generateId();
      const entity = { ...input, id } as T;
      data.set(id, entity);
      return ok(entity);
    },

    // ... other methods
  };
}
```

### Migration Path

#### Phase 1: Interface Definition (Complete)

- [x] Define `Repository` interface
- [x] Define `AdapterFactory` interface
- [x] Define entity-specific repositories

#### Phase 2: In-Memory Implementation (Complete)

- [x] Implement `createInMemoryRepository`
- [x] Add unit tests

#### Phase 3: Firebase Adapter (In Progress)

- [ ] Create `FirebaseAdapterFactory`
- [ ] Implement `FirebaseEmployeeRepository`
- [ ] Implement `FirebaseAccrualRepository`
- [ ] Implement `FirebaseAuditLogRepository`

#### Phase 4: Route Migration (Planned)

- [ ] Update backend routes to use repositories
- [ ] Remove direct Firebase SDK imports from routes
- [ ] Add integration tests

## Result Types

All adapter operations return `AdapterResult<T>`:

```typescript
export type AdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AdapterError };

export type AdapterError =
  | { type: 'not_found'; entityType: string; id: string }
  | { type: 'already_exists'; entityType: string; id: string }
  | { type: 'validation_error'; field: string; message: string }
  | { type: 'database_error'; cause: unknown }
  | { type: 'permission_denied'; reason: string }
  | { type: 'transaction_conflict'; retryable: boolean }
  | { type: 'connection_error'; retryable: boolean };
```

## Consequences

### Positive

- **Testability**: Easy to test with in-memory adapters
- **Portability**: Swap databases without changing business logic
- **Tenant Isolation**: Enforced at repository construction time
- **Type Safety**: Compile-time guarantees for data shapes
- **Consistency**: Single pattern for all data access

### Negative

- **Boilerplate**: More code than direct SDK usage
- **Indirection**: Additional layer between code and database
- **Performance**: Slight overhead from abstraction

### Mitigations

- **Code Generation**: Future tooling to generate repositories
- **Lazy Loading**: Only create repositories when needed
- **Caching**: Add caching layer in adapter if needed

## References

- [Kernel Boundary Package](../../libs/kernel-boundary/)
- [Martin Fowler: Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Gleam Driver Specifications](../../estalogic_drivers/) (relative to repository root)

## Revision History

| Version | Date       | Author    | Changes          |
| ------- | ---------- | --------- | ---------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial decision |
