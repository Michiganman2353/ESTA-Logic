/**
 * Stryker Mutation Testing Configuration
 * 
 * This configuration enables mutation testing for the ESTA accrual engine.
 * Mutation testing helps ensure test quality by introducing small changes
 * (mutations) to the code and verifying that tests catch them.
 * 
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
export default {
  "$schema": "https://raw.githubusercontent.com/stryker-mutator/stryker/master/packages/core/schema/stryker-schema.json",
  packageManager: "npm",
  
  // Use Vitest as the test runner
  testRunner: "vitest",
  vitest: {
    configFile: "vitest.config.ts"
  },
  
  // TypeScript type checking for better mutation analysis
  checkers: ["typescript"],
  tsconfigFile: "tsconfig.json",
  
  // Target the core calculation files for mutation testing
  mutate: [
    "src/calculator.ts",
    "src/carryover.ts",
    "src/compliance-engine.ts",
    "src/rules.ts",
    "src/validator.ts"
  ],
  
  // Coverage analysis for faster mutation testing
  coverageAnalysis: "perTest",
  
  // Report formats
  reporters: ["html", "clear-text", "progress", "json"],
  htmlReporter: {
    fileName: "mutation-report.html"
  },
  jsonReporter: {
    fileName: "mutation-report.json"
  },
  
  // Mutation score thresholds
  thresholds: {
    high: 80,
    low: 60,
    break: 50  // Fail if mutation score drops below 50%
  },
  
  // Timeouts
  timeoutMS: 10000,
  timeoutFactor: 2.5,
  
  // Disable certain mutators that create too many false positives
  disableTypeChecks: false,
  ignorePatterns: [
    "dist",
    "node_modules",
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**"
  ],
  
  // Incremental mode for faster reruns
  incremental: true,
  incrementalFile: ".stryker-tmp/incremental.json",
  
  // Concurrency
  concurrency: 4,
  
  // Log level
  logLevel: "info"
};
