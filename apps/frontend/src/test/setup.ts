// Vitest setup file
// Tests are configured in vitest.config.ts

// CRITICAL FIX: Must be FIRST before any imports
// Fix for React DOM in jsdom environment - React DOM checks navigator.userAgent during module initialization
if (typeof global !== 'undefined') {
  // Ensure navigator exists and has userAgent
  const nav = global.navigator || {};
  if (!nav.userAgent) {
    Object.defineProperty(nav, 'userAgent', {
      value:
        'Mozilla/5.0 (linux) AppleWebKit/537.36 (KHTML, like Gecko) jsdom/25.0.1',
      configurable: true,
      writable: true,
    });
  }
  if (!global.navigator) {
    Object.defineProperty(global, 'navigator', {
      value: nav,
      configurable: true,
      writable: true,
    });
  }
}

import '@testing-library/jest-dom';

/**
 * Global Firebase Mock
 *
 * The @esta/firebase package detects test environments (via VITEST env var)
 * and returns null for Firebase instances to allow proper mocking.
 *
 * Individual test files that need Firebase should add their own vi.mock() calls
 * to provide specific mock implementations. Example:
 *
 * ```typescript
 * vi.mock('@esta/firebase', () => ({
 *   app: {},
 *   auth: { currentUser: null },
 *   db: {},
 *   storage: {},
 *   analytics: null,
 *   // Add any specific functions your tests need
 * }));
 * ```
 *
 * For more complete mocks, use the testing utilities:
 * ```typescript
 * import { mockApp, mockAuth, mockDb, mockStorage } from '@esta/firebase/testing';
 * ```
 */

// Polyfill for File.arrayBuffer() in jsdom environment
// jsdom's File doesn't have arrayBuffer() method, so we add it
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  // Adding polyfill for missing method in jsdom
  File.prototype.arrayBuffer = async function (
    this: File
  ): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to read file as ArrayBuffer'));
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(this);
    });
  };
}
