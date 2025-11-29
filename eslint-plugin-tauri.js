/**
 * Custom ESLint plugin for Tauri applications
 * Provides recommended configurations for Tauri + TypeScript + Rust bridge development
 */

const plugin = {
  meta: {
    name: 'eslint-plugin-tauri',
    version: '1.0.0',
  },
  configs: {},
  rules: {},
};

// Define the flat config recommended preset
Object.assign(plugin.configs, {
  'flat/recommended': [
    {
      name: 'tauri/recommended',
      languageOptions: {
        globals: {
          __TAURI__: 'readonly',
        },
      },
      rules: {
        // Allow unused vars prefixed with underscore (common in Tauri callbacks)
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        // Prefer template literals for string concatenation
        'prefer-template': 'error',
      },
    },
  ],
});

export default plugin;
