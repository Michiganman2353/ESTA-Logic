/**
 * Centralized test setup file
 * Provides deterministic mocks for CI stability
 *
 * This file is registered in vitest.config.ts and runs before all tests.
 * It mocks external dependencies to ensure tests are deterministic and
 * don't rely on external services or ephemeral tokens.
 */

import { vi } from 'vitest';
import jwt from 'jsonwebtoken';

// ===== JWT Mocking =====
// Provide a deterministic secret for tests
export const TEST_JWT_SECRET = 'test-secret-for-ci';

/**
 * Create a test JWT token with predictable behavior
 * @param payload - Token payload (default: { userId: 'test-user' })
 * @param options - JWT sign options (default: { expiresIn: '7d' })
 * @returns Signed JWT token
 */
export function createTestToken(payload = { userId: 'test-user' }, options = {}) {
  return jwt.sign(payload, TEST_JWT_SECRET, { expiresIn: '7d', ...options });
}

// Mock jwt.verify to only accept tokens signed with TEST_JWT_SECRET
// This ensures tokens don't expire during test runs
// Tests can still override these mocks using vi.mocked() if needed
vi.mock('jsonwebtoken', async () => {
  const actual = await vi.importActual<typeof import('jsonwebtoken')>('jsonwebtoken');
  return {
    ...actual,
    sign: (payload: any, secret: string, opts: any) => {
      // Use TEST_JWT_SECRET by default, but allow tests to override
      // by checking if secret is explicitly different
      const secretToUse = secret === undefined || secret === '' ? TEST_JWT_SECRET : secret;
      return actual.sign(payload, secretToUse, opts);
    },
    verify: (token: string, secretOrPublicKey: any, optionsOrCb?: any, cb?: any) => {
      try {
        // Use TEST_JWT_SECRET by default for deterministic testing
        // Tests that need to verify with wrong secrets can mock this function directly
        const secretToUse = secretOrPublicKey === undefined ? TEST_JWT_SECRET : secretOrPublicKey;
        return actual.verify(token, secretToUse, optionsOrCb, cb);
      } catch (err) {
        // Preserve the original error
        throw err;
      }
    },
  };
});

// ===== Firebase Authentication Mocking =====
// Mock Firebase auth methods used by Login tests
vi.mock('firebase/auth', () => {
  const signInWithEmailAndPassword = vi.fn(async (auth: any, email: string, password: string) => {
    // Allow tests to provoke failures by using special email addresses
    if (email === 'invalid@example.com') {
      return Promise.reject({ code: 'auth/invalid-credentials', message: 'Invalid credentials' });
    }
    if (email === 'network-error@example.com') {
      return Promise.reject({ isNetworkError: true });
    }
    if (email === 'unauthorized@example.com') {
      return Promise.reject({ status: 401 });
    }
    // Default success case
    return Promise.resolve({ user: { uid: 'test-uid', email } });
  });

  const getAuth = vi.fn(() => ({}));
  
  return { 
    getAuth, 
    signInWithEmailAndPassword,
  };
});

// ===== Navigator Media Devices Mocking =====
// Mock navigator.mediaDevices.getUserMedia for camera access tests
// Only add if not already defined (avoid overriding test-specific mocks)
if (typeof globalThis.navigator === 'undefined' || !globalThis.navigator.mediaDevices) {
  Object.defineProperty(globalThis, 'navigator', {
    value: {
      ...globalThis.navigator,
      mediaDevices: {
        getUserMedia: vi.fn(async (constraints: any) => {
          // Return a minimal fake MediaStream
          return {
            getTracks: () => [],
            getVideoTracks: () => [],
            getAudioTracks: () => [],
            addTrack: vi.fn(),
            removeTrack: vi.fn(),
            id: 'fake-media-stream',
            active: true,
          } as unknown as MediaStream;
        }),
      },
    },
    configurable: true,
    writable: true,
  });
}

// Export vi for tests that might need it
export { vi };
