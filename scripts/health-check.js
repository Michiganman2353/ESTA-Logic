#!/usr/bin/env node
/**
 * ESTA-Logic Health Checker
 *
 * Validates that core ESTA sick time calculation rules are working correctly.
 * Run this to verify the accrual engine is functioning as expected.
 */

const path = require('path');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol}${colors.reset} ${message}`);
}

async function runHealthCheck() {
  console.log('\n🏥 ESTA-Logic Health Check\n');
  console.log('━'.repeat(50));

  let totalTests = 0;
  let passedTests = 0;
  const failures = [];

  // Test 1: Check if @esta/core is importable
  try {
    const coreDistDir = path.join(
      __dirname,
      '..',
      'packages',
      'esta-core',
      'dist'
    );
    const possibleEntryPoints = ['index.js', 'index.mjs', 'index.cjs'];
    let core = null;
    let loadedPath = null;

    for (const entryPoint of possibleEntryPoints) {
      const fullPath = path.join(coreDistDir, entryPoint);
      if (require('fs').existsSync(fullPath)) {
        core = require(fullPath);
        loadedPath = fullPath;
        break;
      }
    }

    if (!core) {
      throw new Error(`No entry point found in ${coreDistDir}`);
    }

    totalTests++;

    // Verify exports exist
    if (typeof core.calculateAccruedHours === 'function') {
      log('green', '✓', 'calculateAccruedHours function exported');
      passedTests++;
    } else {
      failures.push('calculateAccruedHours function not found');
    }

    // Test accrual calculation: 30 hours = 1 hour sick time
    totalTests++;
    const accrued = core.calculateAccruedHours(30);
    if (Math.abs(accrued - 1) < 0.0001) {
      log(
        'green',
        '✓',
        'Accrual rate correct: 30 hours worked = 1 hour sick time'
      );
      passedTests++;
    } else {
      failures.push(
        `Accrual calculation incorrect: expected 1, got ${accrued}`
      );
    }

    // Accrual is not capped at annual USE limits (MI LEO ESTA FAQ).
    totalTests++;
    const smallEarned = core.calculateCappedAccrual(2000, 10);
    if (Math.abs(smallEarned - 66.666667) < 0.000001) {
      log('green', '✓', 'Small-employer accrual remains uncapped');
      passedTests++;
    } else {
      failures.push(`Incorrect small-employer accrual: ${smallEarned}`);
    }

    totalTests++;
    const standardEarned = core.calculateCappedAccrual(3000, 11);
    if (standardEarned === 100) {
      log('green', '✓', 'Standard-employer accrual remains uncapped');
      passedTests++;
    } else {
      failures.push(`Incorrect standard-employer accrual: ${standardEarned}`);
    }

    totalTests++;
    if (core.calculateAvailableForUse(66.666667, 0, 10) === 40 &&
        core.calculateAvailableForUse(100, 0, 11) === 72) {
      log('green', '✓', 'Annual use limits are independent of accrual');
      passedTests++;
    } else {
      failures.push('Annual use limits incorrectly calculated');
    }

    // Test balance calculation
    totalTests++;
    const balance = core.calculateBalance(20, 5);
    if (balance === 15) {
      log(
        'green',
        '✓',
        'Balance calculation correct: 20 accrued - 5 used = 15 remaining'
      );
      passedTests++;
    } else {
      failures.push(
        `Balance calculation incorrect: expected 15, got ${balance}`
      );
    }

    // Test balance floor at 0
    totalTests++;
    const negativeBalance = core.calculateBalance(5, 10);
    if (negativeBalance === 0) {
      log('green', '✓', 'Balance floor correct: cannot go negative');
      passedTests++;
    } else {
      failures.push(
        `Balance floor incorrect: expected 0, got ${negativeBalance}`
      );
    }

    // Test input validation
    totalTests++;
    try {
      core.calculateAccruedHours(-1);
      failures.push('Should have thrown error for negative hours');
    } catch (e) {
      log('green', '✓', 'Input validation working: rejects negative hours');
      passedTests++;
    }
  } catch (err) {
    log('yellow', '⚠', `Could not load @esta/core - run "npm run build" first`);
    log('yellow', '  ', `Error: ${err.message}`);
  }

  // Summary
  console.log(`\n${'━'.repeat(50)}`);
  console.log('\n📊 Health Check Summary\n');

  if (failures.length === 0 && passedTests === totalTests) {
    log('green', '✅', `All ${passedTests}/${totalTests} tests passed!`);
    console.log('\n🎉 ESTA-Logic is healthy and ready for production.\n');
    process.exit(0);
  } else if (passedTests > 0) {
    log('yellow', '⚠', `${passedTests}/${totalTests} tests passed`);
    if (failures.length > 0) {
      console.log('\nFailures:');
      failures.forEach((f) => log('red', '✗', f));
    }
    console.log('\n⚠️  Some health checks failed. Review the issues above.\n');
    process.exit(1);
  } else {
    log('red', '❌', 'Health check could not complete');
    console.log(
      '\nMake sure to run "npm run build" before running health check.\n'
    );
    process.exit(1);
  }
}

runHealthCheck().catch((err) => {
  console.error('Health check failed with error:', err);
  process.exit(1);
});
