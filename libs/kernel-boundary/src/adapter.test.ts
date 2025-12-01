import { describe, it, expect, beforeEach } from 'vitest';
import {
  ok,
  err,
  mapResult,
  flatMapResult,
  createInMemoryRepository,
  type AdapterResult,
  type RepositoryContext,
  type EntityMetadata,
  type InMemoryStorage,
  type TenantScopedRepository,
} from './adapter.js';
import type { TenantId } from './capability.js';

describe('Adapter', () => {
  describe('Result helpers', () => {
    it('should create success result', () => {
      const result = ok(42);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(42);
      }
    });

    it('should create error result', () => {
      const result = err<number>({
        type: 'not_found',
        resource: 'user',
        id: '123',
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('not_found');
      }
    });

    it('should map over success result', () => {
      const result = ok(42);
      const mapped = mapResult(result, (x) => x * 2);

      expect(mapped.ok).toBe(true);
      if (mapped.ok) {
        expect(mapped.value).toBe(84);
      }
    });

    it('should not map over error result', () => {
      const result = err<number>({ type: 'internal', message: 'error' });
      const mapped = mapResult(result, (x) => x * 2);

      expect(mapped.ok).toBe(false);
      if (!mapped.ok) {
        expect(mapped.error.type).toBe('internal');
      }
    });

    it('should flatMap over success result', () => {
      const result = ok(42);
      const flatMapped = flatMapResult(result, (x) => ok(x * 2));

      expect(flatMapped.ok).toBe(true);
      if (flatMapped.ok) {
        expect(flatMapped.value).toBe(84);
      }
    });

    it('should short-circuit flatMap on error', () => {
      const result = ok(42);
      const flatMapped = flatMapResult(result, () =>
        err<number>({ type: 'validation', errors: ['invalid'] })
      );

      expect(flatMapped.ok).toBe(false);
      if (!flatMapped.ok) {
        expect(flatMapped.error.type).toBe('validation');
      }
    });
  });

  describe('InMemoryRepository', () => {
    interface TestEntity extends EntityMetadata {
      name: string;
      value: number;
    }

    interface TestCreateInput {
      name: string;
      value: number;
    }

    interface TestUpdateInput {
      name?: string;
      value?: number;
    }

    let storage: InMemoryStorage<TestEntity>;
    let context: RepositoryContext;
    let repo: TenantScopedRepository<
      TestEntity,
      TestCreateInput,
      TestUpdateInput
    >;

    beforeEach(() => {
      storage = { items: new Map() };
      context = {
        tenantId: { value: 'tenant-1' },
        userId: 'user-1',
        capabilities: [],
        now: Date.now(),
      };

      repo = createInMemoryRepository<
        TestEntity,
        TestCreateInput,
        TestUpdateInput
      >(
        context,
        storage,
        (input, metadata) => ({
          ...metadata,
          name: input.name,
          value: input.value,
        }),
        (entity, input, metadata) => ({
          ...entity,
          ...metadata,
          name: input.name ?? entity.name,
          value: input.value ?? entity.value,
        })
      );
    });

    it('should create an entity', async () => {
      const result = await repo.create({ name: 'Test', value: 42 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.name).toBe('Test');
        expect(result.value.value).toBe(42);
        expect(result.value.tenantId).toBe('tenant-1');
        expect(result.value.version).toBe(1);
      }
    });

    it('should find entity by ID', async () => {
      const createResult = await repo.create({ name: 'Test', value: 42 });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const findResult = await repo.findById(createResult.value.id);

      expect(findResult.ok).toBe(true);
      if (findResult.ok) {
        expect(findResult.value?.name).toBe('Test');
      }
    });

    it('should return null for non-existent entity', async () => {
      const result = await repo.findById('non-existent');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBeNull();
      }
    });

    it('should update an entity', async () => {
      const createResult = await repo.create({ name: 'Test', value: 42 });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const updateResult = await repo.update(createResult.value.id, {
        value: 100,
      });

      expect(updateResult.ok).toBe(true);
      if (updateResult.ok) {
        expect(updateResult.value.name).toBe('Test');
        expect(updateResult.value.value).toBe(100);
        expect(updateResult.value.version).toBe(2);
      }
    });

    it('should return error when updating non-existent entity', async () => {
      const result = await repo.update('non-existent', { value: 100 });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.type).toBe('not_found');
      }
    });

    it('should delete an entity', async () => {
      const createResult = await repo.create({ name: 'Test', value: 42 });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const deleteResult = await repo.delete(createResult.value.id);
      expect(deleteResult.ok).toBe(true);

      const findResult = await repo.findById(createResult.value.id);
      expect(findResult.ok).toBe(true);
      if (findResult.ok) {
        expect(findResult.value).toBeNull();
      }
    });

    it('should check if entity exists', async () => {
      const createResult = await repo.create({ name: 'Test', value: 42 });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      const existsResult = await repo.exists(createResult.value.id);
      expect(existsResult.ok).toBe(true);
      if (existsResult.ok) {
        expect(existsResult.value).toBe(true);
      }

      const notExistsResult = await repo.exists('non-existent');
      expect(notExistsResult.ok).toBe(true);
      if (notExistsResult.ok) {
        expect(notExistsResult.value).toBe(false);
      }
    });

    it('should count entities', async () => {
      await repo.create({ name: 'Test1', value: 1 });
      await repo.create({ name: 'Test2', value: 2 });
      await repo.create({ name: 'Test3', value: 3 });

      const countResult = await repo.count();

      expect(countResult.ok).toBe(true);
      if (countResult.ok) {
        expect(countResult.value).toBe(3);
      }
    });

    it('should find entities with filters', async () => {
      await repo.create({ name: 'Test1', value: 10 });
      await repo.create({ name: 'Test2', value: 20 });
      await repo.create({ name: 'Test3', value: 30 });

      const result = await repo.find({
        filters: [{ field: 'value', operator: 'gt', value: 15 }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(2);
      }
    });

    it('should sort entities', async () => {
      await repo.create({ name: 'B', value: 2 });
      await repo.create({ name: 'A', value: 1 });
      await repo.create({ name: 'C', value: 3 });

      const result = await repo.find({
        orderBy: [{ field: 'name', direction: 'asc' }],
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items[0]?.name).toBe('A');
        expect(result.value.items[1]?.name).toBe('B');
        expect(result.value.items[2]?.name).toBe('C');
      }
    });

    it('should paginate results', async () => {
      await repo.create({ name: 'Test1', value: 1 });
      await repo.create({ name: 'Test2', value: 2 });
      await repo.create({ name: 'Test3', value: 3 });

      const result = await repo.find({ limit: 2, offset: 1 });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.items).toHaveLength(2);
        expect(result.value.totalCount).toBe(3);
        expect(result.value.hasMore).toBe(false);
      }
    });

    it('should isolate entities by tenant', async () => {
      await repo.create({ name: 'Tenant1Entity', value: 1 });

      // Create a repo with different tenant
      const otherContext: RepositoryContext = {
        ...context,
        tenantId: { value: 'tenant-2' },
      };
      const otherRepo = repo.withContext(otherContext);

      await otherRepo.create({ name: 'Tenant2Entity', value: 2 });

      // Each repo should only see its own tenant's entities
      const tenant1Result = await repo.find({});
      const tenant2Result = await otherRepo.find({});

      expect(tenant1Result.ok).toBe(true);
      expect(tenant2Result.ok).toBe(true);

      if (tenant1Result.ok && tenant2Result.ok) {
        expect(tenant1Result.value.items).toHaveLength(1);
        expect(tenant1Result.value.items[0]?.name).toBe('Tenant1Entity');

        expect(tenant2Result.value.items).toHaveLength(1);
        expect(tenant2Result.value.items[0]?.name).toBe('Tenant2Entity');
      }
    });

    it('should prevent cross-tenant updates', async () => {
      const createResult = await repo.create({ name: 'Test', value: 42 });
      expect(createResult.ok).toBe(true);
      if (!createResult.ok) return;

      // Try to update with different tenant
      const otherContext: RepositoryContext = {
        ...context,
        tenantId: { value: 'tenant-2' },
      };
      const otherRepo = repo.withContext(otherContext);

      const updateResult = await otherRepo.update(createResult.value.id, {
        value: 100,
      });

      expect(updateResult.ok).toBe(false);
      if (!updateResult.ok) {
        expect(updateResult.error.type).toBe('forbidden');
      }
    });
  });
});
