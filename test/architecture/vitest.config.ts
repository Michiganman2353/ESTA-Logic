import { defineConfig } from 'vitest/config';

/**
 * Architecture Tests Configuration
 *
 * These tests verify kernel components and service manifests.
 * Services are only imported via their public exports (index.ts),
 * enforcing the architectural boundary that services communicate via IPC.
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**'],
  },
});
