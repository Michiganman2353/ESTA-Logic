/**
 * Circuit Breaker Tests
 *
 * Tests for the circuit breaker pattern implementation that provides
 * fault tolerance for external service calls.
 *
 * The circuit breaker has three states:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Failure threshold exceeded, requests fail fast
 * - HALF_OPEN: Testing if service has recovered
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CircuitBreaker,
  createCircuitBreaker,
  CircuitOpenError,
  DEFAULT_CIRCUIT_OPTIONS,
  CIRCUITS,
  getAllCircuitMetrics,
} from './circuit-breaker';

describe('Circuit Breaker', () => {
  // Use unique names for each test to avoid state conflicts
  let testCounter = 0;
  const getTestName = () => `test-circuit-${Date.now()}-${++testCounter}`;

  describe('CircuitBreaker class', () => {
    describe('execute - success path', () => {
      it('should execute successful operations in CLOSED state', async () => {
        const breaker = createCircuitBreaker(getTestName());

        const result = await breaker.execute(async () => 'success');

        expect(result).toBe('success');
      });

      it('should track successful requests in metrics', async () => {
        const breaker = createCircuitBreaker(getTestName());

        await breaker.execute(async () => 'result');
        await breaker.execute(async () => 'result');

        const metrics = await breaker.getMetrics();
        expect(metrics.successfulRequests).toBe(2);
        expect(metrics.totalRequests).toBe(2);
        expect(metrics.state).toBe('CLOSED');
      });
    });

    describe('execute - failure path', () => {
      it('should track failures and open circuit when threshold exceeded', async () => {
        const name = getTestName();
        const breaker = createCircuitBreaker(name, {
          failureThreshold: 3,
        });

        // Fail 3 times to trigger circuit open
        for (let i = 0; i < 3; i++) {
          await expect(
            breaker.execute(async () => {
              throw new Error('Service unavailable');
            })
          ).rejects.toThrow('Service unavailable');
        }

        const metrics = await breaker.getMetrics();
        expect(metrics.state).toBe('OPEN');
        expect(metrics.failedRequests).toBe(3);
      });

      it('should reject requests immediately when circuit is OPEN', async () => {
        const name = getTestName();
        const breaker = createCircuitBreaker(name, {
          failureThreshold: 2,
          resetTimeout: 60000, // Long timeout to ensure it stays open
        });

        // Fail twice to open circuit
        for (let i = 0; i < 2; i++) {
          try {
            await breaker.execute(async () => {
              throw new Error('Failure');
            });
          } catch {
            // Expected
          }
        }

        // Next request should fail fast with CircuitOpenError
        await expect(
          breaker.execute(async () => 'should not run')
        ).rejects.toThrow(CircuitOpenError);
      });
    });

    describe('getMetrics', () => {
      it('should return initial metrics for new circuit', async () => {
        const name = getTestName();
        const breaker = createCircuitBreaker(name);

        const metrics = await breaker.getMetrics();

        expect(metrics.name).toBe(name);
        expect(metrics.state).toBe('CLOSED');
        expect(metrics.failures).toBe(0);
        expect(metrics.successes).toBe(0);
        expect(metrics.totalRequests).toBe(0);
        expect(metrics.failedRequests).toBe(0);
        expect(metrics.successfulRequests).toBe(0);
        expect(metrics.rejectedRequests).toBe(0);
      });
    });

    describe('forceState', () => {
      it('should force circuit to OPEN state', async () => {
        const breaker = createCircuitBreaker(getTestName());

        await breaker.forceState('OPEN');

        const metrics = await breaker.getMetrics();
        expect(metrics.state).toBe('OPEN');
      });

      it('should force circuit to CLOSED state and reset failures', async () => {
        const breaker = createCircuitBreaker(getTestName(), {
          failureThreshold: 2,
        });

        // Fail to open circuit
        for (let i = 0; i < 2; i++) {
          try {
            await breaker.execute(async () => {
              throw new Error('Fail');
            });
          } catch {
            // Expected
          }
        }

        // Force closed
        await breaker.forceState('CLOSED');

        const metrics = await breaker.getMetrics();
        expect(metrics.state).toBe('CLOSED');
        expect(metrics.failures).toBe(0);
      });

      it('should force circuit to HALF_OPEN state', async () => {
        const breaker = createCircuitBreaker(getTestName());

        await breaker.forceState('HALF_OPEN');

        const metrics = await breaker.getMetrics();
        expect(metrics.state).toBe('HALF_OPEN');
      });
    });

    describe('reset', () => {
      it('should reset circuit to initial state', async () => {
        const breaker = createCircuitBreaker(getTestName());

        // Do some operations
        await breaker.execute(async () => 'result');
        await breaker.forceState('OPEN');

        // Reset
        await breaker.reset();

        // Metrics should be at initial state
        const metrics = await breaker.getMetrics();
        expect(metrics.state).toBe('CLOSED');
        expect(metrics.totalRequests).toBe(0);
      });
    });

    describe('isFailure filter', () => {
      it('should not count filtered errors as failures', async () => {
        const breaker = createCircuitBreaker(getTestName(), {
          failureThreshold: 2,
          isFailure: (err) => !err.message.includes('expected'),
        });

        // Throw "expected" errors that should not count
        for (let i = 0; i < 5; i++) {
          try {
            await breaker.execute(async () => {
              throw new Error('expected error');
            });
          } catch {
            // Expected
          }
        }

        const metrics = await breaker.getMetrics();
        expect(metrics.state).toBe('CLOSED'); // Should still be closed
        expect(metrics.failures).toBe(0); // No counted failures
      });
    });
  });

  describe('createCircuitBreaker', () => {
    it('should create circuit breaker with default options', () => {
      const breaker = createCircuitBreaker('default-test');

      expect(breaker).toBeInstanceOf(CircuitBreaker);
    });

    it('should create circuit breaker with custom options', async () => {
      const name = getTestName();
      const breaker = createCircuitBreaker(name, {
        failureThreshold: 10,
        successThreshold: 5,
        resetTimeout: 5000,
      });

      const metrics = await breaker.getMetrics();
      expect(metrics.name).toBe(name);
    });
  });

  describe('DEFAULT_CIRCUIT_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CIRCUIT_OPTIONS.failureThreshold).toBe(5);
      expect(DEFAULT_CIRCUIT_OPTIONS.successThreshold).toBe(2);
      expect(DEFAULT_CIRCUIT_OPTIONS.resetTimeout).toBe(30000);
      expect(DEFAULT_CIRCUIT_OPTIONS.monitorWindow).toBe(60000);
      expect(typeof DEFAULT_CIRCUIT_OPTIONS.isFailure).toBe('function');
    });
  });

  describe('CircuitOpenError', () => {
    it('should contain circuit name and reset timeout', () => {
      const error = new CircuitOpenError('test-circuit', 5000);

      expect(error.circuitName).toBe('test-circuit');
      expect(error.resetTimeout).toBe(5000);
      expect(error.name).toBe('CircuitOpenError');
      expect(error.message).toContain('test-circuit');
      expect(error.message).toContain('5000');
    });
  });

  describe('CIRCUITS - Pre-configured Breakers', () => {
    it('should have FIRESTORE circuit breaker', () => {
      expect(CIRCUITS.FIRESTORE).toBeInstanceOf(CircuitBreaker);
    });

    it('should have EXTERNAL_API circuit breaker', () => {
      expect(CIRCUITS.EXTERNAL_API).toBeInstanceOf(CircuitBreaker);
    });

    it('should have BACKGROUND_JOBS circuit breaker', () => {
      expect(CIRCUITS.BACKGROUND_JOBS).toBeInstanceOf(CircuitBreaker);
    });
  });

  describe('getAllCircuitMetrics', () => {
    it('should return metrics for all pre-configured circuits', async () => {
      const metrics = await getAllCircuitMetrics();

      expect(metrics).toHaveLength(3);
      expect(metrics.map((m) => m.name)).toContain('firestore');
      expect(metrics.map((m) => m.name)).toContain('external-api');
      expect(metrics.map((m) => m.name)).toContain('background-jobs');
    });
  });
});
