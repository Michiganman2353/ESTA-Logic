export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  transform: {},
  moduleNameMapper: {},
  testMatch: ['**/__tests__/**/*.spec.js'],
  collectCoverageFrom: [
    '**/*.js',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!jest.config.mjs'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  verbose: true,
};
