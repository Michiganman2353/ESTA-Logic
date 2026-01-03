/**
 * Global setup runs once before all test files
 * This is the earliest point to inject polyfills
 */

export async function setup() {
  // Ensure navigator.userAgent exists before React DOM loads
  // Note: This runs in Node.js context, not in the test environment
  // so it won't fix the React DOM issue, but kept for completeness
  if (typeof globalThis.navigator === 'undefined') {
    globalThis.navigator = {} as Navigator;
  }

  if (!globalThis.navigator.userAgent) {
    Object.defineProperty(globalThis.navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      configurable: true,
      writable: true,
    });
  }
}

export async function teardown() {
  // Cleanup if needed
}
