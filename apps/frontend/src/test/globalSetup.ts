/**
 * Global setup file for Vitest
 * Runs once before all test files
 * Used to configure the test environment
 */

export default function setup() {
  // This runs in Node.js context before the jsdom environment is created
  // We can't directly manipulate the DOM here, but we can set up global configurations

  // Return a teardown function if needed
  return () => {
    // Cleanup after all tests
  };
}
