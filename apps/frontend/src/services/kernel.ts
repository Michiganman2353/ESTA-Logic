/**
 * ESTA Kernel Client Service
 *
 * ============================================================================
 * MICROKERNEL ARCHITECTURE - FRONTEND KERNEL INTERFACE
 * ============================================================================
 *
 * This module provides the client-side API for communicating with the
 * ESTA Rust microkernel via Tauri IPC.
 *
 * ARCHITECTURAL ROLE: Untrusted Client Interface
 * - Frontend is an UNTRUSTED CLIENT
 * - All compliance calculations are delegated to the kernel
 * - Frontend NEVER performs business logic directly
 * - All operations go through: UI → Kernel → WASM Module → Result
 *
 * The kernel provides:
 * - Deterministic WASM execution with fuel metering
 * - Capability-based access control
 * - Ed25519 signature verification for modules
 * - Audit logging of all operations
 *
 * All kernel operations go through validated handlers with proper
 * error handling and type safety.
 *
 * Reference: docs/ENGINEERING_PRINCIPLES.md
 * ============================================================================
 */

import { createLogger } from '@esta-tracker/shared-utils';

const logger = createLogger('KernelClient');

// Type definitions for kernel API

export interface KernelRequest {
  action: string;
  module: string;
  payload: Record<string, unknown>;
}

export interface KernelResponse<T = unknown> {
  success: boolean;
  data: T | null;
  error: string | null;
}

export interface KernelStatus {
  version: string;
  status: 'running' | 'stopped' | 'error';
  modules: string[];
  config: {
    max_fuel: number;
    max_memory_bytes: number;
    require_signatures: boolean;
  };
  audit: {
    enabled: boolean;
    entries: number;
  };
}

export interface AccrualResult {
  accrued_minutes: number;
  minutes_worked: number;
  employer_size: string;
  rate: string;
  source: string;
}

export interface ValidationResult {
  valid: boolean;
  employee_id: string;
  balance: number;
  validation_errors: string[];
}

export interface AuditLogEntry {
  sequence: number;
  timestamp: number;
  event: Record<string, unknown>;
  source: string;
  prev_hash: string;
  hash: string;
}

export interface TenantPolicy {
  tenant_id: string;
  employer_size: 'small' | 'large';
  accrual_rate: number;
  max_carryover_hours: number;
  max_usage_hours: number;
}

export interface EmployeeAccruals {
  tenant_id: string;
  employee_id: string;
  accrued_minutes: number;
  used_minutes: number;
  balance_minutes: number;
  carryover_minutes: number;
  policy: {
    rate: string;
    employer_size: string;
  };
}

// Check if we're running in Tauri environment
const isTauri = (): boolean => {
  return typeof window !== 'undefined' && '__TAURI__' in window;
};

// Type for Tauri invoke function
type TauriInvokeFn = <T>(
  cmd: string,
  args?: Record<string, unknown>
) => Promise<T>;

// Type for Tauri module structure
interface TauriModule {
  invoke: TauriInvokeFn;
}

// Dynamic import for Tauri
const getTauriInvoke = async (): Promise<TauriInvokeFn | null> => {
  if (!isTauri()) {
    return null;
  }
  try {
    // Dynamic import to avoid bundling issues when not in Tauri
    // The module path is checked at runtime when in Tauri environment
    const modulePath = '@tauri-apps/api';
    const tauriModule: TauriModule = await import(
      /* webpackIgnore: true */ modulePath
    );
    return tauriModule.invoke;
  } catch {
    return null;
  }
};

/**
 * ESTA Kernel Client
 *
 * Provides a type-safe interface for communicating with the kernel.
 * Falls back to mock implementations when not running in Tauri.
 */
export class KernelClient {
  private static instance: KernelClient;

  private constructor() {}

  /**
   * Get the singleton instance of the kernel client
   */
  static getInstance(): KernelClient {
    if (!KernelClient.instance) {
      KernelClient.instance = new KernelClient();
    }
    return KernelClient.instance;
  }

  /**
   * Invoke a kernel command
   */
  private async invoke<T>(
    command: string,
    args: Record<string, unknown> = {}
  ): Promise<KernelResponse<T>> {
    const tauriInvoke = await getTauriInvoke();

    if (tauriInvoke) {
      try {
        return await tauriInvoke(command, args);
      } catch (error) {
        return {
          success: false,
          data: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }

    // Mock implementation for non-Tauri environments
    logger.warn('Running in mock mode', { command });
    return this.mockInvoke(command, args);
  }

  /**
   * Mock implementation for development/testing outside Tauri
   */
  private mockInvoke<T>(
    command: string,
    args: Record<string, unknown>
  ): KernelResponse<T> {
    switch (command) {
      case 'kernel_get_status':
        return {
          success: true,
          data: {
            version: '1.0.0-mock',
            status: 'running',
            modules: [],
            config: {
              max_fuel: 20_000_000,
              max_memory_bytes: 33_554_432,
              require_signatures: false,
            },
            audit: {
              enabled: true,
              entries: 0,
            },
          } as T,
          error: null,
        };

      case 'invoke_kernel': {
        const request = args.request as KernelRequest | undefined;
        if (request?.action === 'accrue') {
          const minutesWorked =
            (request.payload?.minutes_worked as number) || 0;
          return {
            success: true,
            data: {
              accrued_minutes: Math.floor(minutesWorked / 30),
              minutes_worked: minutesWorked,
              employer_size: 'small',
              rate: '1:30',
              source: 'mock',
            } as T,
            error: null,
          };
        }
        return {
          success: true,
          data: { mock: true } as T,
          error: null,
        };
      }

      default:
        return {
          success: true,
          data: { mock: true, command } as T,
          error: null,
        };
    }
  }

  /**
   * Get kernel status
   */
  async getStatus(): Promise<KernelResponse<KernelStatus>> {
    return this.invoke<KernelStatus>('kernel_get_status');
  }

  /**
   * Calculate accrual for given worked minutes
   */
  async calculateAccrual(
    minutesWorked: number,
    employerSize: 'small' | 'large' = 'small'
  ): Promise<KernelResponse<AccrualResult>> {
    return this.invoke<AccrualResult>('invoke_kernel', {
      request: {
        action: 'accrue',
        module: 'accrual',
        payload: {
          minutes_worked: minutesWorked,
          employer_size: employerSize,
        },
      },
    });
  }

  /**
   * Validate employee accrual data
   */
  async validateAccrual(
    employeeId: string,
    accruedMinutes: number,
    usedMinutes: number
  ): Promise<KernelResponse<ValidationResult>> {
    return this.invoke<ValidationResult>('invoke_kernel', {
      request: {
        action: 'validate',
        module: 'compliance',
        payload: {
          employee_id: employeeId,
          accrued_minutes: accruedMinutes,
          used_minutes: usedMinutes,
        },
      },
    });
  }

  /**
   * Load a WASM module
   */
  async loadModule(
    manifestPath: string
  ): Promise<KernelResponse<{ loaded: boolean }>> {
    return this.invoke('kernel_load_module', {
      request: { manifest_path: manifestPath },
    });
  }

  /**
   * Execute a function on a loaded module
   */
  async executeFunction(
    moduleName: string,
    functionName: string,
    input: Record<string, unknown>
  ): Promise<KernelResponse<{ result: unknown; fuel_consumed: number }>> {
    return this.invoke('kernel_execute', {
      request: {
        module: moduleName,
        function: functionName,
        input,
      },
    });
  }

  /**
   * Get audit log entries
   */
  async getAuditLogs(options?: {
    limit?: number;
    source?: string;
    afterSequence?: number;
  }): Promise<KernelResponse<{ entries: AuditLogEntry[]; total: number }>> {
    return this.invoke('kernel_get_logs', {
      request: {
        limit: options?.limit,
        source: options?.source,
        after_sequence: options?.afterSequence,
      },
    });
  }

  /**
   * Set tenant policy
   */
  async setTenantPolicy(
    policy: TenantPolicy
  ): Promise<KernelResponse<{ policy_set: boolean }>> {
    return this.invoke('tenant_set_policy', { policy });
  }

  /**
   * Get tenant accruals
   */
  async getTenantAccruals(
    tenantId: string
  ): Promise<KernelResponse<{ employees: EmployeeAccruals[] }>> {
    return this.invoke('tenant_get_accruals', { tenant_id: tenantId });
  }

  /**
   * Get employee accruals
   */
  async getEmployeeAccruals(
    tenantId: string,
    employeeId: string
  ): Promise<KernelResponse<EmployeeAccruals>> {
    return this.invoke<EmployeeAccruals>('employee_view_accruals', {
      query: { tenant_id: tenantId, employee_id: employeeId },
    });
  }
}

// Export singleton instance
export const kernelClient = KernelClient.getInstance();

// Export convenience functions
export const getKernelStatus = () => kernelClient.getStatus();
export const calculateAccrual = (minutes: number, size?: 'small' | 'large') =>
  kernelClient.calculateAccrual(minutes, size);
export const validateAccrual = (empId: string, accrued: number, used: number) =>
  kernelClient.validateAccrual(empId, accrued, used);
