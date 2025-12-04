/**
 * ESTA-Logic Accrual Engine Service Manifest
 *
 * This service handles all sick time accrual calculations according to ESTA 2025 rules.
 * It operates as a pure WASM module with:
 * - No database access (receives data via IPC)
 * - No UI access
 * - No direct host calls
 * - Deterministic calculations only
 *
 * @module services/accrual-engine
 */

import type { ModuleManifest } from '../../kernel/loader';
import type { Priority } from '../../kernel/core';

export const manifest: ModuleManifest = {
  moduleId: 'accrual-engine',
  version: '1.0.0',
  name: 'ESTA Accrual Engine',
  description:
    'Deterministic sick time accrual calculations per Michigan ESTA 2025',
  requiredCapabilities: [
    {
      resourceType: 'channel',
      resourcePattern: 'accrual.*',
      rights: { read: true, write: true },
      optional: false,
      reason: 'Receive accrual requests and emit results',
    },
    {
      resourceType: 'audit_log',
      resourcePattern: 'accrual.*',
      rights: { write: true },
      optional: false,
      reason: 'Log all accrual calculations for compliance',
    },
  ],
  allowedSyscalls: [
    'sys.time.now', // For timestamps
    'sys.audit.log', // For audit logging
  ],
  allowedChannels: [
    { pattern: 'accrual.*', publish: true, subscribe: true },
    { pattern: 'audit.accrual', publish: true, subscribe: false },
  ],
  resourceLimits: {
    maxMemoryBytes: 8 * 1024 * 1024, // 8 MB
    maxExecutionTimeMs: 500, // 500ms per calculation
    maxQueueDepth: 100,
    maxConcurrentRequests: 20,
    cpuQuotaMs: 50, // 5% CPU
  },
  entryPoint: 'handleMessage',
  dependencies: [],
  priority: 'normal' as Priority,
  moduleType: 'service',
};

export default manifest;
