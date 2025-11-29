import js from '@eslint/js';
import globals from 'globals';
import tauri from './eslint-plugin-tauri.js';

export default [
  // Ignore patterns for files handled by sub-project configs or build artifacts
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/.next/**',
      '**/coverage/**',
      'apps/*/src/**', // Handled by app-specific ESLint configs
      'libs/*/src/**', // Handled by lib-specific ESLint configs
      'functions/**', // Handled by functions-specific ESLint config
      'api/**/*.ts', // TypeScript files handled by their own configs
    ],
  },
  js.configs.recommended,
  ...tauri.configs['flat/recommended'],
  {
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
        __TAURI__: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }], // Ignore Tauri callbacks
      'prefer-template': 'error',
      '@typescript-eslint/no-explicit-any': 'off', // For n8n JSON
      'import/no-unresolved': 'off', // For Rust-TS bridges
    },
  },
];
