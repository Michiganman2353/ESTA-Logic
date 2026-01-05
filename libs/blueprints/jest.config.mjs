export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {},
  testMatch: ['**/__tests__/**/*.spec.js'],
  // Use v8 coverage provider for better ES module support
  // Note: coverageThreshold is not set due to a Jest 29 bug with v8 provider
  // Coverage is still collected and reported - verify it meets standards manually
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.mjs',
    '!validateAll.js',
    '!index.js'
  ],
  verbose: true,
};
