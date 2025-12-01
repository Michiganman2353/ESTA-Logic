/**
 * Circuit Breaker Pattern Implementation
 *
 * Provides fault tolerance for external service calls (Firestore, Redis, etc.)
 * to prevent cascade failures under high load or service degradation.
 *
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failure threshold exceeded, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 *
 * Usage:
 * ```typescript
 * const breaker = createCircuitBreaker('firestore', { failureThreshold: 5 });
 * const result = await breaker.execute(() => db.collection('users').get());
 * ```
 */

import redis from './client';

/**
 * Circuit breaker states
 */
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Circuit breaker configuration options
 */
export interface CircuitBreakerOptions {
  /** Name identifier for the circuit (used in metrics/logging) */
  name: string;
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Number of successes in half-open state to close circuit */
  successThreshold: number;
  /** Time in ms to wait before transitioning from OPEN to HALF_OPEN */
  resetTimeout: number;
  /** Time window in ms to count failures */
  monitorWindow: number;
  /** Optional: Custom error filter to determine if error should count */
  isFailure?: (error: Error) => boolean;
}

/**
 * Default circuit breaker options
 */
export const DEFAULT_CIRCUIT_OPTIONS: Omit<CircuitBreakerOptions, 'name'> = {
  failureThreshold: 5,
  successThreshold: 2,
  resetTimeout: 30000, // 30 seconds
  monitorWindow: 60000, // 1 minute
  isFailure: () => true, // All errors count by default
};

/**
 * Circuit breaker metrics
 */
export interface CircuitBreakerMetrics {
  name: string;
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: string | null;
  lastSuccess: string | null;
  lastStateChange: string | null;
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
  rejectedRequests: number;
}

/**
 * Circuit breaker state stored in Redis
 */
interface CircuitBreakerState {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailure: number | null;
  lastSuccess: number | null;
  lastStateChange: number;
  totalRequests: number;
  failedRequests: number;
  successfulRequests: number;
  rejectedRequests: number;
}

/**
 * Error thrown when circuit is open
 */
export class CircuitOpenError extends Error {
  constructor(
    public readonly circuitName: string,
    public readonly resetTimeout: number
  ) {
    super(`Circuit '${circuitName}' is open. Retry after ${resetTimeout}ms`);
    this.name = 'CircuitOpenError';
  }
}

/**
 * Get the Redis key for a circuit breaker
 */
function getCircuitKey(name: string): string {
  return `esta:circuit:${name}`;
}

/**
 * Get the initial state for a new circuit
 */
function getInitialState(): CircuitBreakerState {
  return {
    state: 'CLOSED',
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    lastStateChange: Date.now(),
    totalRequests: 0,
    failedRequests: 0,
    successfulRequests: 0,
    rejectedRequests: 0,
  };
}

/**
 * Load circuit state from Redis
 */
async function loadCircuitState(name: string): Promise<CircuitBreakerState> {
  const key = getCircuitKey(name);
  const data = await redis.get(key);

  if (!data) {
    return getInitialState();
  }

  try {
    return JSON.parse(data as string) as CircuitBreakerState;
  } catch {
    return getInitialState();
  }
}

/**
 * Save circuit state to Redis
 */
async function saveCircuitState(
  name: string,
  state: CircuitBreakerState
): Promise<void> {
  const key = getCircuitKey(name);
  // State persists for 1 hour to allow recovery analysis
  await redis.setex(key, 3600, JSON.stringify(state));
}

/**
 * Circuit Breaker class
 */
export class CircuitBreaker {
  private options: CircuitBreakerOptions;

  constructor(options: CircuitBreakerOptions) {
    this.options = {
      ...DEFAULT_CIRCUIT_OPTIONS,
      ...options,
    };
  }

  /**
   * Execute a function with circuit breaker protection
   *
   * @param fn - Async function to execute
   * @returns Result of the function
   * @throws CircuitOpenError if circuit is open
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = await loadCircuitState(this.options.name);
    const now = Date.now();

    // Check if circuit should transition from OPEN to HALF_OPEN
    if (state.state === 'OPEN') {
      const timeSinceOpen = now - state.lastStateChange;
      if (timeSinceOpen >= this.options.resetTimeout) {
        state.state = 'HALF_OPEN';
        state.lastStateChange = now;
        state.successes = 0;
        await saveCircuitState(this.options.name, state);
      } else {
        state.totalRequests++;
        state.rejectedRequests++;
        await saveCircuitState(this.options.name, state);
        throw new CircuitOpenError(
          this.options.name,
          this.options.resetTimeout - timeSinceOpen
        );
      }
    }

    state.totalRequests++;

    try {
      const result = await fn();

      // Success handling
      state.successfulRequests++;
      state.lastSuccess = now;

      if (state.state === 'HALF_OPEN') {
        state.successes++;
        if (state.successes >= this.options.successThreshold) {
          state.state = 'CLOSED';
          state.failures = 0;
          state.lastStateChange = now;
        }
      } else {
        // In CLOSED state, reset failure count on success
        state.failures = 0;
      }

      await saveCircuitState(this.options.name, state);
      return result;
    } catch (error) {
      const isFailure = this.options.isFailure
        ? this.options.isFailure(error as Error)
        : true;

      if (!isFailure) {
        // Error doesn't count as failure, just rethrow
        throw error;
      }

      // Failure handling
      state.failedRequests++;
      state.failures++;
      state.lastFailure = now;

      if (state.state === 'HALF_OPEN') {
        // Any failure in HALF_OPEN opens the circuit again
        state.state = 'OPEN';
        state.lastStateChange = now;
      } else if (state.failures >= this.options.failureThreshold) {
        // Too many failures, open the circuit
        state.state = 'OPEN';
        state.lastStateChange = now;
      }

      await saveCircuitState(this.options.name, state);
      throw error;
    }
  }

  /**
   * Get current circuit metrics
   */
  async getMetrics(): Promise<CircuitBreakerMetrics> {
    const state = await loadCircuitState(this.options.name);
    return {
      name: this.options.name,
      state: state.state,
      failures: state.failures,
      successes: state.successes,
      lastFailure: state.lastFailure
        ? new Date(state.lastFailure).toISOString()
        : null,
      lastSuccess: state.lastSuccess
        ? new Date(state.lastSuccess).toISOString()
        : null,
      lastStateChange: new Date(state.lastStateChange).toISOString(),
      totalRequests: state.totalRequests,
      failedRequests: state.failedRequests,
      successfulRequests: state.successfulRequests,
      rejectedRequests: state.rejectedRequests,
    };
  }

  /**
   * Force the circuit to a specific state (for testing/emergency)
   */
  async forceState(newState: CircuitState): Promise<void> {
    const state = await loadCircuitState(this.options.name);
    state.state = newState;
    state.lastStateChange = Date.now();
    if (newState === 'CLOSED') {
      state.failures = 0;
    }
    await saveCircuitState(this.options.name, state);
  }

  /**
   * Reset the circuit to initial state
   */
  async reset(): Promise<void> {
    const key = getCircuitKey(this.options.name);
    await redis.del(key);
  }
}

/**
 * Create a new circuit breaker instance
 *
 * @param name - Circuit breaker name
 * @param options - Configuration options
 * @returns CircuitBreaker instance
 */
export function createCircuitBreaker(
  name: string,
  options: Partial<Omit<CircuitBreakerOptions, 'name'>> = {}
): CircuitBreaker {
  return new CircuitBreaker({
    ...DEFAULT_CIRCUIT_OPTIONS,
    ...options,
    name,
  });
}

/**
 * Pre-configured circuit breakers for common services
 */
export const CIRCUITS = {
  /** Circuit breaker for Firestore operations */
  FIRESTORE: createCircuitBreaker('firestore', {
    failureThreshold: 5,
    resetTimeout: 30000,
  }),
  /** Circuit breaker for external API calls */
  EXTERNAL_API: createCircuitBreaker('external-api', {
    failureThreshold: 3,
    resetTimeout: 60000,
  }),
  /** Circuit breaker for background jobs */
  BACKGROUND_JOBS: createCircuitBreaker('background-jobs', {
    failureThreshold: 10,
    resetTimeout: 120000,
  }),
} as const;

/**
 * Get all circuit breaker metrics
 */
export async function getAllCircuitMetrics(): Promise<CircuitBreakerMetrics[]> {
  return Promise.all([
    CIRCUITS.FIRESTORE.getMetrics(),
    CIRCUITS.EXTERNAL_API.getMetrics(),
    CIRCUITS.BACKGROUND_JOBS.getMetrics(),
  ]);
}
