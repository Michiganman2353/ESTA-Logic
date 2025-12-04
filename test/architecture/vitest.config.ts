import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@kernel': path.resolve(__dirname, '../../kernel'),
      '@services': path.resolve(__dirname, '../../services'),
    },
  },
});
