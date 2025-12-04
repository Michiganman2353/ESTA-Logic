/**
 * ESTA-Logic Microkernel Module Loader
 *
 * Handles WASM module lifecycle: loading, instantiation, and hot-swapping.
 * Ensures all modules are properly sandboxed and capability-scoped.
 *
 * @module kernel/loader
 */

import type { ProcessId, Priority } from '../core/scheduler';
import type {
  CapabilityId,
  ResourceId,
  ResourceType,
} from '../core/capability-engine';
import { createCapability, type EngineState } from '../core/capability-engine';

// ============================================================================
// SECTION 1: MODULE MANIFEST
// ============================================================================

/** Module manifest - declares capabilities and requirements */
export interface ModuleManifest {
  /** Unique module identifier */
  readonly moduleId: string;
  /** Module version (semver) */
  readonly version: string;
  /** Human-readable name */
  readonly name: string;
  /** Module description */
  readonly description: string;
  /** Required capabilities */
  readonly requiredCapabilities: readonly CapabilityRequirement[];
  /** Allowed syscalls */
  readonly allowedSyscalls: readonly string[];
  /** Allowed IPC channels */
  readonly allowedChannels: readonly ChannelPermission[];
  /** Resource limits */
  readonly resourceLimits: ResourceLimits;
  /** Entry point function */
  readonly entryPoint: string;
  /** Dependencies on other modules */
  readonly dependencies: readonly ModuleDependency[];
  /** Module priority */
  readonly priority: Priority;
  /** Module type */
  readonly moduleType: ModuleType;
}

/** Types of modules */
export type ModuleType =
  | 'service' // Business logic service
  | 'driver' // Hardware/IO driver
  | 'extension' // Kernel extension
  | 'worker'; // Background worker

/** Capability requirement */
export interface CapabilityRequirement {
  /** Resource type needed */
  readonly resourceType: ResourceType;
  /** Resource path pattern (supports wildcards) */
  readonly resourcePattern: string;
  /** Required rights */
  readonly rights: {
    readonly read?: boolean;
    readonly write?: boolean;
    readonly delete?: boolean;
    readonly execute?: boolean;
    readonly create?: boolean;
    readonly list?: boolean;
  };
  /** Whether this is optional */
  readonly optional: boolean;
  /** Reason for requiring this capability */
  readonly reason: string;
}

/** Channel permission */
export interface ChannelPermission {
  /** Channel pattern */
  readonly pattern: string;
  /** Can publish to channel */
  readonly publish: boolean;
  /** Can subscribe to channel */
  readonly subscribe: boolean;
}

/** Resource limits for a module */
export interface ResourceLimits {
  /** Maximum memory (bytes) */
  readonly maxMemoryBytes: number;
  /** Maximum execution time per call (ms) */
  readonly maxExecutionTimeMs: number;
  /** Maximum message queue depth */
  readonly maxQueueDepth: number;
  /** Maximum concurrent requests */
  readonly maxConcurrentRequests: number;
  /** Maximum CPU time per second (ms, 0-1000) */
  readonly cpuQuotaMs: number;
}

/** Module dependency */
export interface ModuleDependency {
  /** Module ID */
  readonly moduleId: string;
  /** Version range (semver) */
  readonly versionRange: string;
  /** Whether dependency is optional */
  readonly optional: boolean;
}

// ============================================================================
// SECTION 2: MODULE STATE
// ============================================================================

/** Module state in the loader */
export type ModuleState =
  | 'unloaded'
  | 'loading'
  | 'loaded'
  | 'initializing'
  | 'running'
  | 'suspended'
  | 'stopping'
  | 'failed';

/** Loaded module */
export interface LoadedModule {
  /** Module manifest */
  readonly manifest: ModuleManifest;
  /** Assigned process ID */
  readonly pid: ProcessId;
  /** Current state */
  readonly state: ModuleState;
  /** Granted capabilities */
  readonly capabilities: readonly CapabilityId[];
  /** WASM instance (opaque handle) */
  readonly instance: WasmInstance;
  /** Load timestamp */
  readonly loadedAt: number;
  /** Last active timestamp */
  readonly lastActiveAt: number;
  /** Error if failed */
  readonly error?: string;
}

/** WASM instance handle (abstraction over actual WASM) */
export interface WasmInstance {
  readonly instanceId: string;
  readonly memoryUsedBytes: number;
  readonly tableEntries: number;
}

// ============================================================================
// SECTION 3: LOADER STATE
// ============================================================================

/** Loader configuration */
export interface LoaderConfig {
  /** Maximum concurrent module loads */
  readonly maxConcurrentLoads: number;
  /** Module load timeout (ms) */
  readonly loadTimeoutMs: number;
  /** Enable hot-swapping */
  readonly hotSwapEnabled: boolean;
  /** Module cache size (bytes) */
  readonly cacheSizeBytes: number;
  /** Auto-restart failed modules */
  readonly autoRestart: boolean;
  /** Max restart attempts */
  readonly maxRestartAttempts: number;
}

/** Loader state */
export interface LoaderState {
  readonly config: LoaderConfig;
  readonly modules: ReadonlyMap<string, LoadedModule>;
  readonly byPid: ReadonlyMap<number, string>;
  readonly loadQueue: readonly string[];
  readonly stats: LoaderStats;
}

/** Loader statistics */
export interface LoaderStats {
  readonly totalLoaded: number;
  readonly totalFailed: number;
  readonly totalUnloaded: number;
  readonly currentlyLoading: number;
  readonly avgLoadTimeMs: number;
  readonly cacheHits: number;
  readonly cacheMisses: number;
}

// ============================================================================
// SECTION 4: CONFIGURATION
// ============================================================================

/** Default loader configuration */
export function defaultLoaderConfig(): LoaderConfig {
  return {
    maxConcurrentLoads: 4,
    loadTimeoutMs: 5000,
    hotSwapEnabled: true,
    cacheSizeBytes: 50 * 1024 * 1024, // 50 MB
    autoRestart: true,
    maxRestartAttempts: 3,
  };
}

/** Default resource limits */
export function defaultResourceLimits(): ResourceLimits {
  return {
    maxMemoryBytes: 16 * 1024 * 1024, // 16 MB
    maxExecutionTimeMs: 1000,
    maxQueueDepth: 100,
    maxConcurrentRequests: 10,
    cpuQuotaMs: 100, // 10% of CPU
  };
}

/** Create initial loader state */
export function createLoader(
  config: LoaderConfig = defaultLoaderConfig()
): LoaderState {
  return {
    config,
    modules: new Map(),
    byPid: new Map(),
    loadQueue: [],
    stats: {
      totalLoaded: 0,
      totalFailed: 0,
      totalUnloaded: 0,
      currentlyLoading: 0,
      avgLoadTimeMs: 0,
      cacheHits: 0,
      cacheMisses: 0,
    },
  };
}

// ============================================================================
// SECTION 5: LOADER OPERATIONS
// ============================================================================

/** Load result */
export type LoadResult =
  | { type: 'success'; module: LoadedModule }
  | { type: 'error'; error: LoadError };

/** Load error types */
export type LoadError =
  | { type: 'manifest_invalid'; reason: string }
  | { type: 'dependency_not_found'; moduleId: string }
  | { type: 'capability_denied'; requirement: CapabilityRequirement }
  | { type: 'resource_exhausted'; resource: string }
  | { type: 'timeout' }
  | { type: 'wasm_error'; message: string }
  | { type: 'already_loaded' };

/** Request module load */
export function requestLoad(
  state: LoaderState,
  manifest: ModuleManifest
): [LoaderState, string | null] {
  // Check if already loaded
  if (state.modules.has(manifest.moduleId)) {
    return [state, null];
  }

  // Check if already in queue
  if (state.loadQueue.includes(manifest.moduleId)) {
    return [state, null];
  }

  // Check concurrent load limit
  if (state.stats.currentlyLoading >= state.config.maxConcurrentLoads) {
    // Add to queue
    return [
      {
        ...state,
        loadQueue: [...state.loadQueue, manifest.moduleId],
      },
      manifest.moduleId,
    ];
  }

  return [
    {
      ...state,
      stats: {
        ...state.stats,
        currentlyLoading: state.stats.currentlyLoading + 1,
      },
    },
    manifest.moduleId,
  ];
}

/** Complete module load */
export function completeLoad(
  state: LoaderState,
  capabilityEngine: EngineState,
  manifest: ModuleManifest,
  pid: ProcessId,
  instance: WasmInstance,
  now: number
): [LoaderState, EngineState, LoadResult] {
  // Validate manifest
  const validationError = validateManifest(manifest);
  if (validationError) {
    return [
      {
        ...state,
        stats: {
          ...state.stats,
          currentlyLoading: Math.max(0, state.stats.currentlyLoading - 1),
          totalFailed: state.stats.totalFailed + 1,
        },
      },
      capabilityEngine,
      { type: 'error', error: validationError },
    ];
  }

  // Grant capabilities
  let updatedCapEngine = capabilityEngine;
  const grantedCaps: CapabilityId[] = [];

  for (const req of manifest.requiredCapabilities) {
    const resource: ResourceId = {
      resourceType: req.resourceType,
      resourcePath: req.resourcePattern,
      tenantId: 'system', // TODO: Get from context
    };

    const rights = {
      read: req.rights.read ?? false,
      write: req.rights.write ?? false,
      delete: req.rights.delete ?? false,
      execute: req.rights.execute ?? false,
      create: req.rights.create ?? false,
      list: req.rights.list ?? false,
      delegate: false,
      revoke: false,
      customRights: [],
    };

    const [newEngine, cap] = createCapability(
      updatedCapEngine,
      resource,
      rights,
      pid,
      'system'
    );

    updatedCapEngine = newEngine;
    grantedCaps.push(cap.id);
  }

  // Create loaded module
  const loadedModule: LoadedModule = {
    manifest,
    pid,
    state: 'running',
    capabilities: grantedCaps,
    instance,
    loadedAt: now,
    lastActiveAt: now,
  };

  // Update state
  const newModules = new Map(state.modules);
  newModules.set(manifest.moduleId, loadedModule);

  const newByPid = new Map(state.byPid);
  newByPid.set(pid.value, manifest.moduleId);

  // Process queue
  const newQueue = state.loadQueue.filter((id) => id !== manifest.moduleId);

  return [
    {
      ...state,
      modules: newModules,
      byPid: newByPid,
      loadQueue: newQueue,
      stats: {
        ...state.stats,
        totalLoaded: state.stats.totalLoaded + 1,
        currentlyLoading: Math.max(0, state.stats.currentlyLoading - 1),
      },
    },
    updatedCapEngine,
    { type: 'success', module: loadedModule },
  ];
}

/** Unload a module */
export function unloadModule(
  state: LoaderState,
  moduleId: string
): [LoaderState, ProcessId | null] {
  const module = state.modules.get(moduleId);
  if (!module) {
    return [state, null];
  }

  const newModules = new Map(state.modules);
  newModules.delete(moduleId);

  const newByPid = new Map(state.byPid);
  newByPid.delete(module.pid.value);

  return [
    {
      ...state,
      modules: newModules,
      byPid: newByPid,
      stats: {
        ...state.stats,
        totalUnloaded: state.stats.totalUnloaded + 1,
      },
    },
    module.pid,
  ];
}

/** Suspend a module */
export function suspendModule(
  state: LoaderState,
  moduleId: string
): LoaderState {
  const module = state.modules.get(moduleId);
  if (!module || module.state !== 'running') {
    return state;
  }

  const updatedModule: LoadedModule = {
    ...module,
    state: 'suspended',
  };

  const newModules = new Map(state.modules);
  newModules.set(moduleId, updatedModule);

  return {
    ...state,
    modules: newModules,
  };
}

/** Resume a suspended module */
export function resumeModule(
  state: LoaderState,
  moduleId: string,
  now: number
): LoaderState {
  const module = state.modules.get(moduleId);
  if (!module || module.state !== 'suspended') {
    return state;
  }

  const updatedModule: LoadedModule = {
    ...module,
    state: 'running',
    lastActiveAt: now,
  };

  const newModules = new Map(state.modules);
  newModules.set(moduleId, updatedModule);

  return {
    ...state,
    modules: newModules,
  };
}

/** Mark module as failed */
export function failModule(
  state: LoaderState,
  moduleId: string,
  error: string
): LoaderState {
  const module = state.modules.get(moduleId);
  if (!module) {
    return state;
  }

  const updatedModule: LoadedModule = {
    ...module,
    state: 'failed',
    error,
  };

  const newModules = new Map(state.modules);
  newModules.set(moduleId, updatedModule);

  return {
    ...state,
    modules: newModules,
    stats: {
      ...state.stats,
      totalFailed: state.stats.totalFailed + 1,
    },
  };
}

/** Get module by PID */
export function getModuleByPid(
  state: LoaderState,
  pid: ProcessId
): LoadedModule | undefined {
  const moduleId = state.byPid.get(pid.value);
  if (!moduleId) return undefined;
  return state.modules.get(moduleId);
}

/** Get module by ID */
export function getModuleById(
  state: LoaderState,
  moduleId: string
): LoadedModule | undefined {
  return state.modules.get(moduleId);
}

/** List all running modules */
export function listRunningModules(
  state: LoaderState
): readonly LoadedModule[] {
  return Array.from(state.modules.values()).filter(
    (m) => m.state === 'running'
  );
}

// ============================================================================
// SECTION 6: VALIDATION
// ============================================================================

/** Validate module manifest */
function validateManifest(manifest: ModuleManifest): LoadError | null {
  if (!manifest.moduleId || manifest.moduleId.length === 0) {
    return { type: 'manifest_invalid', reason: 'moduleId is required' };
  }

  if (!manifest.version || !/^\d+\.\d+\.\d+/.test(manifest.version)) {
    return { type: 'manifest_invalid', reason: 'version must be semver' };
  }

  if (!manifest.entryPoint || manifest.entryPoint.length === 0) {
    return { type: 'manifest_invalid', reason: 'entryPoint is required' };
  }

  if (manifest.resourceLimits.maxMemoryBytes <= 0) {
    return {
      type: 'manifest_invalid',
      reason: 'maxMemoryBytes must be positive',
    };
  }

  return null;
}

// ============================================================================
// SECTION 7: HOT-SWAP SUPPORT
// ============================================================================

/** Hot-swap result */
export type HotSwapResult =
  | { type: 'success'; oldVersion: string; newVersion: string }
  | { type: 'error'; error: string };

/** Prepare for hot-swap (save state) */
export function prepareHotSwap(
  state: LoaderState,
  moduleId: string
): [LoaderState, unknown | null] {
  const module = state.modules.get(moduleId);
  if (!module) {
    return [state, null];
  }

  // Mark as stopping
  const updatedModule: LoadedModule = {
    ...module,
    state: 'stopping',
  };

  const newModules = new Map(state.modules);
  newModules.set(moduleId, updatedModule);

  // In a real implementation, we would serialize module state here
  return [
    {
      ...state,
      modules: newModules,
    },
    { moduleId, version: module.manifest.version },
  ];
}

/** Complete hot-swap with new module */
export function completeHotSwap(
  state: LoaderState,
  moduleId: string,
  newModule: LoadedModule,
  _savedState: unknown
): [LoaderState, HotSwapResult] {
  const oldModule = state.modules.get(moduleId);
  if (!oldModule) {
    return [state, { type: 'error', error: 'Module not found' }];
  }

  // Replace module
  const newModules = new Map(state.modules);
  newModules.set(moduleId, newModule);

  const newByPid = new Map(state.byPid);
  newByPid.delete(oldModule.pid.value);
  newByPid.set(newModule.pid.value, moduleId);

  return [
    {
      ...state,
      modules: newModules,
      byPid: newByPid,
    },
    {
      type: 'success',
      oldVersion: oldModule.manifest.version,
      newVersion: newModule.manifest.version,
    },
  ];
}
