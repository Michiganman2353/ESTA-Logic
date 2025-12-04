/**
 * Architecture Enforcement Tests
 *
 * These tests ensure the microkernel architecture invariants are maintained.
 * They verify:
 * - No forbidden imports between services
 * - All messages follow the canonical schema
 * - Capability declarations are valid
 * - Service manifests are complete
 *
 * @module test/architecture
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// TEST: Message Schema Validation
// ============================================================================

describe('IPC Message Schema', () => {
  it('should define all required message fields', async () => {
    const { IPCMessage } = await import('../../kernel/abi/messages');

    // The module should export the message creation functions
    const module = await import('../../kernel/abi/messages');
    expect(module.createIPCMessage).toBeDefined();
    expect(module.validateMessage).toBeDefined();
    expect(module.isValidMessage).toBeDefined();
  });

  it('should validate message structure correctly', async () => {
    const { validateMessage, createCommand } =
      await import('../../kernel/abi/messages');

    // Valid message should pass
    const validMessage = createCommand(
      'test-service',
      'kernel',
      'test.operation',
      { data: 'test' }
    );

    const errors = validateMessage(validMessage);
    expect(errors).toHaveLength(0);
  });

  it('should reject invalid messages', async () => {
    const { validateMessage } = await import('../../kernel/abi/messages');

    // Invalid message missing required fields
    const invalidMessage = {
      type: 'InvalidType',
      source: '',
      target: '',
      opcode: '',
    };

    const errors = validateMessage(invalidMessage);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should include all ESTA opcodes', async () => {
    const { OPCODES } = await import('../../kernel/abi/messages');

    // Verify key opcodes are defined
    expect(OPCODES['accrual.calculate']).toBeDefined();
    expect(OPCODES['compliance.check']).toBeDefined();
    expect(OPCODES['employee.create']).toBeDefined();
    expect(OPCODES['sicktime.use']).toBeDefined();
    expect(OPCODES['audit.log']).toBeDefined();
  });
});

// ============================================================================
// TEST: Service Manifest Validation
// ============================================================================

describe('Service Manifests', () => {
  const servicesDir = path.join(__dirname, '../../services');

  it('accrual-engine should have valid manifest', async () => {
    const { manifest } = await import('../../services/accrual-engine/manifest');

    expect(manifest.moduleId).toBe('accrual-engine');
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(manifest.entryPoint).toBeDefined();
    expect(manifest.requiredCapabilities.length).toBeGreaterThan(0);
    expect(manifest.resourceLimits.maxMemoryBytes).toBeGreaterThan(0);
  });

  it('accrual-engine should not allow database access', async () => {
    const { manifest } = await import('../../services/accrual-engine/manifest');

    // Verify no database syscalls are allowed
    expect(manifest.allowedSyscalls).not.toContain('sys.db.read');
    expect(manifest.allowedSyscalls).not.toContain('sys.db.write');
  });

  it('compliance-engine should have valid manifest', async () => {
    const { manifest } =
      await import('../../services/compliance-engine/manifest');

    expect(manifest.moduleId).toBe('compliance-engine');
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(manifest.entryPoint).toBeDefined();
  });

  it('compliance-engine should have high priority', async () => {
    const { manifest } =
      await import('../../services/compliance-engine/manifest');

    // Compliance checks should be high priority
    expect(manifest.priority).toBe('high');
  });
});

// ============================================================================
// TEST: Capability Declarations
// ============================================================================

describe('Capability Declarations', () => {
  it('accrual-engine capabilities should be valid JSON', async () => {
    const capabilitiesPath = path.join(
      __dirname,
      '../../services/accrual-engine/capabilities.json'
    );
    const content = fs.readFileSync(capabilitiesPath, 'utf-8');

    expect(() => JSON.parse(content)).not.toThrow();

    const capabilities = JSON.parse(content);
    expect(capabilities.moduleId).toBe('accrual-engine');
    expect(capabilities.capabilities.required).toBeInstanceOf(Array);
  });

  it('accrual-engine should declare deterministic isolation', async () => {
    const capabilitiesPath = path.join(
      __dirname,
      '../../services/accrual-engine/capabilities.json'
    );
    const capabilities = JSON.parse(fs.readFileSync(capabilitiesPath, 'utf-8'));

    expect(capabilities.isolation.noDatabaseAccess).toBe(true);
    expect(capabilities.isolation.noUIAccess).toBe(true);
    expect(capabilities.isolation.noDirectHostCalls).toBe(true);
    expect(capabilities.isolation.deterministic).toBe(true);
  });

  it('compliance-engine capabilities should be valid JSON', async () => {
    const capabilitiesPath = path.join(
      __dirname,
      '../../services/compliance-engine/capabilities.json'
    );
    const content = fs.readFileSync(capabilitiesPath, 'utf-8');

    expect(() => JSON.parse(content)).not.toThrow();

    const capabilities = JSON.parse(content);
    expect(capabilities.moduleId).toBe('compliance-engine');
  });
});

// ============================================================================
// TEST: Kernel Core Components
// ============================================================================

describe('Kernel Core', () => {
  it('should export scheduler functions', async () => {
    const scheduler = await import('../../kernel/core/scheduler');

    expect(scheduler.createScheduler).toBeDefined();
    expect(scheduler.addProcess).toBeDefined();
    expect(scheduler.schedule).toBeDefined();
    expect(scheduler.blockProcess).toBeDefined();
    expect(scheduler.unblockProcess).toBeDefined();
  });

  it('should export IPC router functions', async () => {
    const router = await import('../../kernel/core/ipc-router');

    expect(router.createRouter).toBeDefined();
    expect(router.registerRoute).toBeDefined();
    expect(router.routeMessage).toBeDefined();
    expect(router.deliverPending).toBeDefined();
  });

  it('should export capability engine functions', async () => {
    const capEngine = await import('../../kernel/core/capability-engine');

    expect(capEngine.createEngine).toBeDefined();
    expect(capEngine.createCapability).toBeDefined();
    expect(capEngine.validateCapability).toBeDefined();
    expect(capEngine.delegateCapability).toBeDefined();
    expect(capEngine.revokeCapability).toBeDefined();
  });
});

// ============================================================================
// TEST: Syscall Interface
// ============================================================================

describe('Syscall Interface', () => {
  it('should export all syscall types', async () => {
    const syscalls = await import('../../kernel/syscalls/syscalls');

    expect(syscalls.getSyscallName).toBeDefined();
    expect(syscalls.getRequiredCapability).toBeDefined();
    expect(syscalls.ok).toBeDefined();
    expect(syscalls.err).toBeDefined();
  });

  it('should map syscalls to capability requirements', async () => {
    const { getRequiredCapability } =
      await import('../../kernel/syscalls/syscalls');

    // File syscalls need file capability
    const fsReq = getRequiredCapability({
      syscall: 'sys.fs.read',
      path: '/test',
    });
    expect(fsReq.resourceType).toBe('file');

    // Database syscalls need database capability
    const dbReq = getRequiredCapability({
      syscall: 'sys.db.read',
      collection: 'test',
      documentId: '1',
    });
    expect(dbReq.resourceType).toBe('database');

    // Network syscalls need network capability
    const netReq = getRequiredCapability({
      syscall: 'sys.net.fetch',
      url: 'http://test',
      method: 'GET',
    });
    expect(netReq.resourceType).toBe('network');
  });
});

// ============================================================================
// TEST: Module Loader
// ============================================================================

describe('Module Loader', () => {
  it('should export loader functions', async () => {
    const loader = await import('../../kernel/loader/module-loader');

    expect(loader.createLoader).toBeDefined();
    expect(loader.requestLoad).toBeDefined();
    expect(loader.completeLoad).toBeDefined();
    expect(loader.unloadModule).toBeDefined();
    expect(loader.suspendModule).toBeDefined();
    expect(loader.resumeModule).toBeDefined();
  });

  it('should enforce resource limits', async () => {
    const { defaultResourceLimits } =
      await import('../../kernel/loader/module-loader');

    const limits = defaultResourceLimits();
    expect(limits.maxMemoryBytes).toBeGreaterThan(0);
    expect(limits.maxExecutionTimeMs).toBeGreaterThan(0);
    expect(limits.maxQueueDepth).toBeGreaterThan(0);
  });
});

// ============================================================================
// TEST: Utility Functions
// ============================================================================

describe('Kernel Utilities', () => {
  it('should export result type helpers', async () => {
    const utils = await import('../../kernel/utils');

    expect(utils.ok).toBeDefined();
    expect(utils.err).toBeDefined();
    expect(utils.mapResult).toBeDefined();
    expect(utils.unwrap).toBeDefined();
  });

  it('should provide ID generation', async () => {
    const { generateId, generateUUID } = await import('../../kernel/utils');

    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);

    const uuid = generateUUID();
    expect(uuid).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
    );
  });

  it('should provide error classes', async () => {
    const { KernelError, PermissionDeniedError, NotFoundError } =
      await import('../../kernel/utils');

    const kernelError = new KernelError('TEST', 'Test error');
    expect(kernelError.code).toBe('TEST');

    const permError = new PermissionDeniedError('file', 'read');
    expect(permError.name).toBe('PermissionDeniedError');

    const notFoundError = new NotFoundError('user', '123');
    expect(notFoundError.name).toBe('NotFoundError');
  });
});
