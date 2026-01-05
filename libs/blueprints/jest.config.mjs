export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {},
  testMatch: ['**/__tests__/**/*.spec.js'],
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
