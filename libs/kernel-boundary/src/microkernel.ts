/**
 * Gleam Microkernel Loader
 *
 * This module provides the TypeScript interface for loading and interacting
 * with the Gleam microkernel compiled to JavaScript/WASM.
 *
 * @module microkernel
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Accrual calculation result from the Gleam microkernel
 */
export interface AccrualResult {
  readonly hours_accrued: number;
  readonly cap: number;
  readonly total: number;
}

/**
 * Gleam microkernel interface
 */
export interface MicrokernelAPI {
  /** Get the microkernel version string */
  version(): string;

  /** Calculate sick time accrual based on hours worked (1 hour per 30 hours) */
  compute_accrual(hours_worked: number): number;

  /** Get employer cap based on size (>10 = 72 hours, <=10 = 40 hours) */
  employer_cap(employer_size: number): number;

  /** Calculate accrual with cap enforcement */
  calculate_with_cap(
    hours_worked: number,
    employer_size: number
  ): AccrualResult;
}

/**
 * Microkernel load result
 */
export type MicrokernelLoadResult =
  | { ok: true; kernel: MicrokernelAPI }
  | { ok: false; error: Error };

// ============================================================================
// LOADER
// ============================================================================

/**
 * Default path to the compiled Gleam microkernel JavaScript module
 */
export const DEFAULT_KERNEL_PATH = '/logic/wasm_build/index.mjs';

/**
 * Load the Gleam microkernel
 *
 * @param modulePath - Path to the compiled kernel module (default: /logic/wasm_build/index.mjs)
 * @returns Promise resolving to the microkernel API or an error
 *
 * @example
 * ```typescript
 * const result = await loadMicrokernel();
 * if (result.ok) {
 *   const hours = result.kernel.compute_accrual(70);
 *   console.log(`Accrued: ${hours} hours`); // Accrued: 2 hours
 * }
 * ```
 */
export async function loadMicrokernel(
  modulePath: string = DEFAULT_KERNEL_PATH
): Promise<MicrokernelLoadResult> {
  try {
    // Dynamic import of the compiled Gleam module
    const kernelModule = await import(/* webpackIgnore: true */ modulePath);

    // Validate that the module has expected exports
    const requiredExports = [
      'version',
      'compute_accrual',
      'employer_cap',
      'calculate_with_cap',
    ];

    for (const exportName of requiredExports) {
      if (typeof kernelModule[exportName] !== 'function') {
        throw new Error(
          `Microkernel module missing required export: ${exportName}`
        );
      }
    }

    const kernel: MicrokernelAPI = {
      version: () => kernelModule.version(),
      compute_accrual: (hours: number) => kernelModule.compute_accrual(hours),
      employer_cap: (size: number) => kernelModule.employer_cap(size),
      calculate_with_cap: (hours: number, size: number) =>
        kernelModule.calculate_with_cap(hours, size),
    };

    return { ok: true, kernel };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Create a mock microkernel for testing purposes
 *
 * @returns MicrokernelAPI implementation with the same logic as the Gleam kernel
 *
 * @example
 * ```typescript
 * const kernel = createMockMicrokernel();
 * expect(kernel.compute_accrual(70)).toBe(2);
 * ```
 */
export function createMockMicrokernel(): MicrokernelAPI {
  return {
    version: () => 'ESTA-Logic Gleam Microkernel v0.1.0 (mock)',

    compute_accrual: (hours_worked: number): number => {
      return Math.floor(hours_worked / 30);
    },

    employer_cap: (employer_size: number): number => {
      return employer_size > 10 ? 72.0 : 40.0;
    },

    calculate_with_cap: (
      hours_worked: number,
      employer_size: number
    ): AccrualResult => {
      const ratio = 30.0;
      const base = hours_worked / ratio;
      const cap = employer_size > 10 ? 72.0 : 40.0;
      const total = Math.min(base, cap);
      return {
        hours_accrued: base,
        cap: cap,
        total: total,
      };
    },
  };
}
