/**
 * ESTA-Logic Pilot Agent Session Service Manifest
 *
 * This service orchestrates complex multi-step compliance workflows by
 * coordinating between multiple ESTA logic engines (accrual, compliance, etc.)
 * through the kernel's IPC system.
 *
 * A pilot agent session represents a complete end-to-end compliance scenario:
 * - Employee data processing
 * - Accrual calculations
 * - Compliance validation
 * - Audit trail generation
 *
 * Design principles:
 * - Stateless session coordination (state passed via IPC)
 * - No direct service imports (all via kernel messaging)
 * - Deterministic orchestration logic
 * - Comprehensive audit logging
 *
 * @module services/pilot-agent-session
 */

import type { ModuleManifest } from '../../kernel/loader';
import type { Priority } from '../../kernel/core';

export const manifest: ModuleManifest = {
  moduleId: 'pilot-agent-session',
  version: '1.0.0',
  name: 'ESTA Pilot Agent Session',
  description:
    'Orchestrates multi-step compliance workflows across ESTA logic engines',
  requiredCapabilities: [
    {
      resourceType: 'channel',
      resourcePattern: 'session.*',
      rights: { read: true, write: true },
      optional: false,
      reason: 'Receive session requests and emit orchestration results',
    },
    {
      resourceType: 'channel',
      resourcePattern: 'accrual.*',
      rights: { read: true, write: true },
      optional: false,
      reason: 'Communicate with accrual engine for calculations',
    },
    {
      resourceType: 'channel',
      resourcePattern: 'compliance.*',
      rights: { read: true, write: true },
      optional: false,
      reason: 'Communicate with compliance engine for validation',
    },
    {
      resourceType: 'audit_log',
      resourcePattern: 'session.*',
      rights: { write: true },
      optional: false,
      reason: 'Log all session orchestration steps for audit trail',
    },
  ],
  allowedSyscalls: [
    'sys.time.now', // For timestamps and session timing
    'sys.audit.log', // For comprehensive audit logging
  ],
  allowedChannels: [
    { pattern: 'session.*', publish: true, subscribe: true },
    { pattern: 'accrual.*', publish: true, subscribe: true },
    { pattern: 'compliance.*', publish: true, subscribe: true },
    { pattern: 'audit.session', publish: true, subscribe: false },
  ],
  resourceLimits: {
    maxMemoryBytes: 16 * 1024 * 1024, // 16 MB for session state management
    maxExecutionTimeMs: 2000, // 2 seconds for complex workflows
    maxQueueDepth: 50,
    maxConcurrentRequests: 10,
    cpuQuotaMs: 100, // 10% CPU quota
  },
  entryPoint: 'handleMessage',
  dependencies: [],
  priority: 'high' as Priority, // High priority for coordinated workflows
  moduleType: 'service',
};

export default manifest;
