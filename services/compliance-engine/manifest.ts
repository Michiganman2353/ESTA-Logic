/**
 * ESTA-Logic Compliance Engine Service Manifest
 *
 * This service handles ESTA 2025 compliance checking and policy enforcement.
 * It runs entirely in WASM and consumes rule updates as data, not code.
 *
 * @module services/compliance-engine
 */

import type { ModuleManifest } from '../../kernel/loader';
import type { Priority } from '../../kernel/core';

export const manifest: ModuleManifest = {
  moduleId: 'compliance-engine',
  version: '1.0.0',
  name: 'ESTA Compliance Engine',
  description:
    'Policy enforcement and compliance checking per Michigan ESTA 2025',
  requiredCapabilities: [
    {
      resourceType: 'channel',
      resourcePattern: 'compliance.*',
      rights: { read: true, write: true },
      optional: false,
      reason: 'Receive compliance check requests and emit results',
    },
    {
      resourceType: 'channel',
      resourcePattern: 'policy.*',
      rights: { read: true },
      optional: false,
      reason: 'Receive policy rule updates',
    },
    {
      resourceType: 'audit_log',
      resourcePattern: 'compliance.*',
      rights: { write: true },
      optional: false,
      reason: 'Log all compliance evaluations for regulatory audit',
    },
  ],
  allowedSyscalls: ['sys.time.now', 'sys.audit.log'],
  allowedChannels: [
    { pattern: 'compliance.*', publish: true, subscribe: true },
    { pattern: 'policy.*', publish: false, subscribe: true },
    { pattern: 'audit.compliance', publish: true, subscribe: false },
  ],
  resourceLimits: {
    maxMemoryBytes: 16 * 1024 * 1024, // 16 MB (needs room for policy rules)
    maxExecutionTimeMs: 1000, // 1s per evaluation
    maxQueueDepth: 200,
    maxConcurrentRequests: 50,
    cpuQuotaMs: 100, // 10% CPU
  },
  entryPoint: 'handleMessage',
  dependencies: [],
  priority: 'high' as Priority, // Compliance checks are high priority
  moduleType: 'service',
};

export default manifest;
