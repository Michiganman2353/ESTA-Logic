# ADR 008: Data Portability Strategy

**Status**: RFC (Request for Comments)  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team, Architecture Review Board  
**Extends**: [ADR 006](./006-adapter-pattern.md) (Adapter Pattern for Persistence Isolation)

## Abstract

This RFC defines the data portability strategy for ESTA-Logic, enabling:

1. **Firestore adapter abstraction** for database-agnostic operations
2. **Migration path** to Postgres/Supabase for enterprise deployments
3. **Multi-tenant sharding model** for horizontal scaling

## Context

### Current State

ESTA-Logic uses Firebase Firestore as the primary database. While Firestore provides excellent developer experience and real-time capabilities, enterprise customers require:

- **Data sovereignty**: Data must reside in specific geographic regions
- **Self-hosting options**: Some enterprises cannot use cloud services
- **SQL compatibility**: Existing tooling and reporting integrations
- **Cost predictability**: Firestore costs scale with operations, not storage

### Strategic Drivers

| Driver              | Business Need         | Technical Implication         |
| ------------------- | --------------------- | ----------------------------- |
| Enterprise sales    | On-premise deployment | Database abstraction required |
| Compliance          | Data residency        | Multi-region support          |
| Cost optimization   | Predictable pricing   | Alternative database options  |
| Vendor independence | Reduce lock-in        | Standardized interfaces       |

## Specification

### 1. Adapter Abstraction Layer

#### 1.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Accrual Service │ Employee Service │ Audit Service        ││
│  └────────┬────────────────┬────────────────┬──────────────────┘│
│           │                │                │                    │
├───────────┴────────────────┴────────────────┴────────────────────┤
│                    Repository Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  EmployeeRepo │ AccrualRepo │ AuditLogRepo │ TenantRepo     ││
│  └────────┬────────────────┬────────────────┬──────────────────┘│
│           │                │                │                    │
├───────────┴────────────────┴────────────────┴────────────────────┤
│                    Adapter Interface                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   DataAdapter<T>                             ││
│  │  find() │ create() │ update() │ delete() │ transaction()   ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│     ┌────────────────────────┼────────────────────────┐         │
│     │                        │                        │         │
│     ▼                        ▼                        ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │  Firestore   │    │   Postgres   │    │   SQLite     │      │
│  │   Adapter    │    │   Adapter    │    │   Adapter    │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.2 Core Interfaces

```typescript
// libs/data-adapter/src/types.ts

/**
 * Result type for all adapter operations
 */
export type AdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AdapterError };

/**
 * Base entity interface - all entities must have these fields
 */
export interface Entity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Query specification for find operations
 */
export interface QuerySpec<T> {
  where?: WhereClause<T>[];
  orderBy?: OrderByClause<T>[];
  limit?: number;
  offset?: number;
  cursor?: string;
}

export interface WhereClause<T> {
  field: keyof T;
  operator: WhereOperator;
  value: unknown;
}

export type WhereOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not-in'
  | 'contains'
  | 'starts-with';

export interface OrderByClause<T> {
  field: keyof T;
  direction: 'asc' | 'desc';
}
```

#### 1.3 DataAdapter Interface

```typescript
/**
 * Generic data adapter interface
 * All database implementations must conform to this interface
 */
export interface DataAdapter<T extends Entity> {
  /**
   * Find a single entity by ID
   */
  findById(id: string): Promise<AdapterResult<T | null>>;

  /**
   * Find multiple entities matching query
   */
  findMany(query: QuerySpec<T>): Promise<AdapterResult<PaginatedResult<T>>>;

  /**
   * Create a new entity
   */
  create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AdapterResult<T>>;

  /**
   * Update an existing entity
   */
  update(
    id: string,
    data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<AdapterResult<T>>;

  /**
   * Delete an entity
   */
  delete(id: string): Promise<AdapterResult<void>>;

  /**
   * Count entities matching query
   */
  count(query?: QuerySpec<T>): Promise<AdapterResult<number>>;

  /**
   * Check if entity exists
   */
  exists(id: string): Promise<AdapterResult<boolean>>;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  cursor?: string;
}
```

#### 1.4 Transaction Support

```typescript
/**
 * Transaction interface for atomic operations
 */
export interface Transaction {
  /**
   * Get adapter for entity type within transaction
   */
  adapter<T extends Entity>(entityType: string): TransactionalAdapter<T>;

  /**
   * Commit all changes
   */
  commit(): Promise<AdapterResult<void>>;

  /**
   * Rollback all changes
   */
  rollback(): Promise<AdapterResult<void>>;
}

/**
 * Adapter within a transaction context
 */
export interface TransactionalAdapter<T extends Entity> extends Omit<
  DataAdapter<T>,
  'transaction'
> {
  // Same operations but within transaction context
}

/**
 * Factory for creating adapters
 */
export interface AdapterFactory {
  /**
   * Create an adapter for an entity type
   */
  createAdapter<T extends Entity>(entityType: string): DataAdapter<T>;

  /**
   * Begin a transaction
   */
  beginTransaction(options?: TransactionOptions): Promise<Transaction>;

  /**
   * Health check
   */
  healthCheck(): Promise<HealthCheckResult>;
}

export interface TransactionOptions {
  isolationLevel?: 'read-committed' | 'repeatable-read' | 'serializable';
  timeout?: number;
  retryOnConflict?: boolean;
}
```

### 2. Firestore Adapter Implementation

```typescript
// libs/data-adapter/src/adapters/firestore.ts

import { Firestore, CollectionReference } from 'firebase-admin/firestore';

export class FirestoreAdapter<T extends Entity> implements DataAdapter<T> {
  private collection: CollectionReference;

  constructor(
    private db: Firestore,
    private collectionPath: string,
    private tenantId: string
  ) {
    this.collection = db
      .collection('tenants')
      .doc(tenantId)
      .collection(collectionPath);
  }

  async findById(id: string): Promise<AdapterResult<T | null>> {
    try {
      const doc = await this.collection.doc(id).get();
      if (!doc.exists) {
        return { ok: true, value: null };
      }
      return { ok: true, value: this.mapDocument(doc) };
    } catch (error) {
      return { ok: false, error: this.mapError(error) };
    }
  }

  async findMany(
    query: QuerySpec<T>
  ): Promise<AdapterResult<PaginatedResult<T>>> {
    try {
      let ref: FirebaseFirestore.Query = this.collection;

      // Apply where clauses
      for (const where of query.where ?? []) {
        ref = ref.where(
          String(where.field),
          this.mapOperator(where.operator),
          where.value
        );
      }

      // Apply ordering
      for (const orderBy of query.orderBy ?? []) {
        ref = ref.orderBy(String(orderBy.field), orderBy.direction);
      }

      // Apply pagination
      if (query.cursor) {
        const cursorDoc = await this.collection.doc(query.cursor).get();
        ref = ref.startAfter(cursorDoc);
      }

      if (query.limit) {
        ref = ref.limit(query.limit + 1); // Fetch one extra for hasMore
      }

      const snapshot = await ref.get();
      const hasMore = query.limit ? snapshot.docs.length > query.limit : false;
      const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

      return {
        ok: true,
        value: {
          data: docs.map((doc) => this.mapDocument(doc)),
          total: docs.length,
          hasMore,
          cursor: docs.length > 0 ? docs[docs.length - 1].id : undefined,
        },
      };
    } catch (error) {
      return { ok: false, error: this.mapError(error) };
    }
  }

  // ... other methods
}
```

### 3. Postgres/Supabase Adapter Implementation

```typescript
// libs/data-adapter/src/adapters/postgres.ts

import { Pool, PoolClient } from 'pg';

export class PostgresAdapter<T extends Entity> implements DataAdapter<T> {
  constructor(
    private pool: Pool,
    private tableName: string,
    private tenantId: string
  ) {}

  async findById(id: string): Promise<AdapterResult<T | null>> {
    try {
      const result = await this.pool.query(
        `SELECT * FROM ${this.tableName} WHERE id = $1 AND tenant_id = $2`,
        [id, this.tenantId]
      );
      if (result.rows.length === 0) {
        return { ok: true, value: null };
      }
      return { ok: true, value: this.mapRow(result.rows[0]) };
    } catch (error) {
      return { ok: false, error: this.mapError(error) };
    }
  }

  async findMany(
    query: QuerySpec<T>
  ): Promise<AdapterResult<PaginatedResult<T>>> {
    try {
      const { sql, params } = this.buildQuery(query);
      const result = await this.pool.query(sql, params);

      // Note: For production, consider:
      // 1. Using cursor-based pagination without count queries
      // 2. Caching count results with short TTL
      // 3. Using approximate counts for large tables
      const countResult = await this.pool.query(
        `SELECT COUNT(*) FROM ${this.tableName} WHERE tenant_id = $1`,
        [this.tenantId]
      );

      return {
        ok: true,
        value: {
          data: result.rows.map((row) => this.mapRow(row)),
          total: parseInt(countResult.rows[0].count, 10),
          hasMore: query.offset
            ? parseInt(countResult.rows[0].count, 10) >
              query.offset + result.rows.length
            : false,
        },
      };
    } catch (error) {
      return { ok: false, error: this.mapError(error) };
    }
  }

  // Schema definition for allowed fields (set during construction)
  private readonly allowedFields: Set<string> = new Set();

  private validateFieldName(field: string): string {
    // Security: Validate field names against schema to prevent SQL injection
    // Field names must be pre-registered in allowedFields during adapter setup
    if (!this.allowedFields.has(field)) {
      throw new Error(`Invalid field name: ${field}. Field not in schema.`);
    }
    // Additional safety: only allow alphanumeric and underscores
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field)) {
      throw new Error(`Invalid field name format: ${field}`);
    }
    return field;
  }

  private buildQuery(query: QuerySpec<T>): { sql: string; params: unknown[] } {
    const params: unknown[] = [this.tenantId];
    let sql = `SELECT * FROM ${this.tableName} WHERE tenant_id = $1`;

    // Add where clauses with field validation
    for (const where of query.where ?? []) {
      const validField = this.validateFieldName(String(where.field));
      params.push(where.value);
      sql += ` AND ${validField} ${this.sqlOperator(where.operator)} $${params.length}`;
    }

    // Add ordering with field validation
    if (query.orderBy?.length) {
      const orderClauses = query.orderBy.map((o) => {
        const validField = this.validateFieldName(String(o.field));
        return `${validField} ${o.direction.toUpperCase()}`;
      });
      sql += ` ORDER BY ${orderClauses.join(', ')}`;
    }

    // Add pagination
    if (query.limit) {
      sql += ` LIMIT ${query.limit}`;
    }
    if (query.offset) {
      sql += ` OFFSET ${query.offset}`;
    }

    return { sql, params };
  }

  private sqlOperator(op: WhereOperator): string {
    const map: Record<WhereOperator, string> = {
      eq: '=',
      neq: '!=',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      in: 'IN',
      'not-in': 'NOT IN',
      contains: 'LIKE',
      'starts-with': 'LIKE',
    };
    return map[op];
  }

  // ... other methods
}
```

### 4. Multi-Tenant Sharding Model

#### 4.1 Sharding Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shard Router                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  tenant_id → shard_id mapping                               ││
│  │  Consistent hashing with virtual nodes                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│     ┌────────────────────────┼────────────────────────┐         │
│     │                        │                        │         │
│     ▼                        ▼                        ▼         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Shard 1    │    │   Shard 2    │    │   Shard 3    │      │
│  │  Tenants A-F │    │  Tenants G-N │    │  Tenants O-Z │      │
│  │   Region:US  │    │   Region:EU  │    │   Region:US  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

#### 4.2 Shard Configuration

```typescript
// libs/data-adapter/src/sharding/config.ts

export interface ShardConfig {
  id: string;
  region: string;
  connectionString: string;
  readonly: boolean;
  weight: number; // For load balancing
}

export interface ShardingStrategy {
  /**
   * Get shard for a tenant
   */
  getShardForTenant(tenantId: string): ShardConfig;

  /**
   * Get all shards for a query that spans tenants
   */
  getShardsForQuery(tenantIds: string[]): ShardConfig[];

  /**
   * Rebalance tenant to different shard
   */
  rebalanceTenant(tenantId: string, targetShardId: string): Promise<void>;
}
```

#### 4.3 Consistent Hashing Implementation

```typescript
// libs/data-adapter/src/sharding/consistent-hash.ts

import { createHash } from 'crypto';

export class ConsistentHashRing {
  private ring: Map<number, ShardConfig> = new Map();
  private sortedKeys: number[] = [];
  private virtualNodes: number;

  constructor(shards: ShardConfig[], virtualNodes = 150) {
    this.virtualNodes = virtualNodes;
    for (const shard of shards) {
      this.addShard(shard);
    }
  }

  addShard(shard: ShardConfig): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const key = this.hash(`${shard.id}:${i}`);
      this.ring.set(key, shard);
      this.sortedKeys.push(key);
    }
    this.sortedKeys.sort((a, b) => a - b);
  }

  removeShard(shardId: string): void {
    for (let i = 0; i < this.virtualNodes; i++) {
      const key = this.hash(`${shardId}:${i}`);
      this.ring.delete(key);
      const index = this.sortedKeys.indexOf(key);
      if (index > -1) {
        this.sortedKeys.splice(index, 1);
      }
    }
  }

  getShard(tenantId: string): ShardConfig {
    if (this.ring.size === 0) {
      throw new Error('No shards available');
    }

    const hash = this.hash(tenantId);
    const index = this.binarySearch(hash);
    const key = this.sortedKeys[index];
    return this.ring.get(key)!;
  }

  private hash(key: string): number {
    const hash = createHash('md5').update(key).digest();
    return hash.readUInt32BE(0);
  }

  private binarySearch(hash: number): number {
    let low = 0;
    let high = this.sortedKeys.length - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.sortedKeys[mid] < hash) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return low >= this.sortedKeys.length ? 0 : low;
  }
}
```

#### 4.4 Tenant Placement Policy

```typescript
// libs/data-adapter/src/sharding/placement.ts

export interface PlacementPolicy {
  /**
   * Determine which shard a new tenant should be placed on
   */
  selectShard(tenant: TenantInfo, availableShards: ShardConfig[]): ShardConfig;
}

export interface TenantInfo {
  id: string;
  region: string;
  tier: 'free' | 'starter' | 'professional' | 'enterprise';
  expectedEmployeeCount: number;
}

/**
 * Region-aware placement policy
 * - Place tenant in their preferred region
 * - Distribute load within region
 * - Enterprise tenants get dedicated shards
 */
export class RegionAwarePlacement implements PlacementPolicy {
  selectShard(tenant: TenantInfo, shards: ShardConfig[]): ShardConfig {
    // Filter shards by region
    const regionalShards = shards.filter((s) => s.region === tenant.region);
    if (regionalShards.length === 0) {
      throw new Error(`No shards available in region ${tenant.region}`);
    }

    // Enterprise tenants get least-loaded shard
    if (tenant.tier === 'enterprise') {
      return this.leastLoadedShard(regionalShards);
    }

    // Others use consistent hashing
    const ring = new ConsistentHashRing(regionalShards);
    return ring.getShard(tenant.id);
  }

  private leastLoadedShard(shards: ShardConfig[]): ShardConfig {
    // In production, query actual load metrics
    return shards.reduce((least, shard) =>
      shard.weight < least.weight ? shard : least
    );
  }
}
```

### 5. Migration Strategy

#### 5.1 Migration Phases

```
Phase 1: Abstraction (Current)
├── Implement adapter interfaces
├── Create Firestore adapter
├── Update existing code to use adapters
└── No data migration required

Phase 2: Dual-Write (Transition)
├── Deploy Postgres infrastructure
├── Implement Postgres adapter
├── Enable dual-write mode
├── Verify data consistency
└── Shadow reads for validation

Phase 3: Cutover (Migration)
├── Backfill historical data
├── Switch read traffic to Postgres
├── Monitor for issues
├── Disable Firestore writes
└── Archive Firestore data
```

#### 5.2 Dual-Write Adapter

```typescript
// libs/data-adapter/src/adapters/dual-write.ts

export class DualWriteAdapter<T extends Entity> implements DataAdapter<T> {
  constructor(
    private primary: DataAdapter<T>,
    private secondary: DataAdapter<T>,
    private options: DualWriteOptions
  ) {}

  async create(
    data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<AdapterResult<T>> {
    // Write to primary
    const primaryResult = await this.primary.create(data);
    if (!primaryResult.ok) {
      return primaryResult;
    }

    // Async write to secondary (fire and forget with retry)
    this.writeToSecondary('create', primaryResult.value);

    return primaryResult;
  }

  async findById(id: string): Promise<AdapterResult<T | null>> {
    const result = await this.primary.findById(id);

    // Shadow read for validation
    if (this.options.shadowReads) {
      this.shadowRead(id, result);
    }

    return result;
  }

  private async shadowRead(
    id: string,
    primaryResult: AdapterResult<T | null>
  ): Promise<void> {
    const secondaryResult = await this.secondary.findById(id);

    if (!this.resultsMatch(primaryResult, secondaryResult)) {
      this.options.onMismatch?.({
        operation: 'findById',
        id,
        primary: primaryResult,
        secondary: secondaryResult,
      });
    }
  }

  // ... other methods
}

export interface DualWriteOptions {
  shadowReads: boolean;
  retrySecondary: boolean;
  onMismatch?: (mismatch: DataMismatch) => void;
}
```

#### 5.3 Data Migration Tool

```typescript
// scripts/migrate-to-postgres.ts

interface MigrationConfig {
  sourceAdapter: AdapterFactory;
  targetAdapter: AdapterFactory;
  batchSize: number;
  concurrency: number;
  entityTypes: string[];
  tenantIds?: string[]; // Migrate specific tenants, or all if undefined
}

async function migrateData(config: MigrationConfig): Promise<MigrationReport> {
  const report: MigrationReport = {
    startTime: new Date(),
    entityCounts: {},
    errors: [],
  };

  for (const entityType of config.entityTypes) {
    console.log(`Migrating ${entityType}...`);

    let cursor: string | undefined;
    let count = 0;

    while (true) {
      const source = config.sourceAdapter.createAdapter(entityType);
      const target = config.targetAdapter.createAdapter(entityType);

      const result = await source.findMany({
        limit: config.batchSize,
        cursor,
      });

      if (!result.ok) {
        report.errors.push({ entityType, error: result.error });
        break;
      }

      if (result.value.data.length === 0) {
        break;
      }

      // Batch insert into target
      await Promise.all(
        result.value.data.map((entity) => target.create(entity))
      );

      count += result.value.data.length;
      cursor = result.value.cursor;

      if (!result.value.hasMore) {
        break;
      }
    }

    report.entityCounts[entityType] = count;
  }

  report.endTime = new Date();
  return report;
}
```

### 6. Database Schema for Postgres

```sql
-- migrations/001_initial_schema.sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenant table
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    settings JSONB DEFAULT '{}'::jsonb,
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free',
    shard_id VARCHAR(50)
);

CREATE INDEX idx_tenants_shard ON tenants(shard_id);

-- Employees table
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    hire_date DATE NOT NULL,
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX idx_employees_tenant ON employees(tenant_id);
CREATE INDEX idx_employees_email ON employees(tenant_id, email);

-- Accrual records table
CREATE TABLE accrual_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    employee_id UUID NOT NULL REFERENCES employees(id),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    hours_worked DECIMAL(10, 6) NOT NULL,
    hours_accrued DECIMAL(10, 6) NOT NULL,
    rate_applied JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_accrual_tenant ON accrual_records(tenant_id);
CREATE INDEX idx_accrual_employee ON accrual_records(employee_id);
CREATE INDEX idx_accrual_period ON accrual_records(period_start, period_end);

-- Audit log (append-only)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    actor_id UUID,
    changes JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);

-- Row-level security
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE accrual_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies (application provides tenant_id in connection)
CREATE POLICY tenant_isolation ON employees
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON accrual_records
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

CREATE POLICY tenant_isolation ON audit_log
    FOR ALL
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

## Consequences

### Positive

- **Database flexibility** switch between Firestore, Postgres, or hybrid
- **Vendor independence** no single database lock-in
- **Enterprise readiness** self-hosted option for large employers
- **Horizontal scaling** multi-tenant sharding enables growth
- **Data sovereignty** regional shard placement for compliance

### Negative

- **Complexity** additional abstraction layer
- **Testing burden** must test all adapter implementations
- **Performance overhead** abstraction adds latency
- **Migration risk** data migration can cause issues

### Mitigations

- **Performance testing** benchmark adapter implementations
- **Comprehensive tests** adapter conformance test suite
- **Gradual migration** dual-write with shadow reads
- **Rollback plan** maintain Firestore access during migration

## Implementation Phases

### Phase 1: Foundation (Q1 2026)

- [ ] Define adapter interfaces
- [ ] Implement Firestore adapter
- [ ] Create in-memory adapter for testing
- [ ] Update backend routes to use adapters

### Phase 2: Postgres Support (Q2 2026)

- [ ] Implement Postgres adapter
- [ ] Create database schema and migrations
- [ ] Implement dual-write adapter
- [ ] Deploy Postgres infrastructure

### Phase 3: Sharding (Q3 2026)

- [ ] Implement consistent hash ring
- [ ] Create shard router
- [ ] Add tenant placement policy
- [ ] Deploy multi-region shards

### Phase 4: Migration (Q4 2026)

- [ ] Create migration tooling
- [ ] Migrate pilot customers to Postgres
- [ ] Validate data consistency
- [ ] Full production cutover

## References

- [ADR 006: Adapter Pattern](./006-adapter-pattern.md)
- [Firebase Migration Guide](../../FIREBASE_MIGRATION_GUIDE.md)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Consistent Hashing Paper](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/chash.pdf)

## Revision History

| Version | Date       | Author    | Changes           |
| ------- | ---------- | --------- | ----------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial RFC draft |
