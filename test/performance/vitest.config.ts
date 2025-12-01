import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['**/*.ts'],
    environment: 'node',
    testTimeout: 60000, // 60 second timeout for load tests
    reporters: ['verbose'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@esta/firebase': '../libs/esta-firebase/src',
    },
  },
});
