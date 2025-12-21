#!/usr/bin/env node

/**
 * Validate narrative test files structure
 */

const fs = require('fs');
const path = require('path');

const narrativeDir = path.join(__dirname, '..', 'e2e', 'narratives');
const files = fs
  .readdirSync(narrativeDir)
  .filter((f) => f.endsWith('.spec.ts'));

console.log('✅ Found', files.length, 'narrative test files:');
files.forEach((f) => console.log('  -', f));
console.log('');

// Basic syntax check - try to parse the files
let hasErrors = false;
files.forEach((file) => {
  const content = fs.readFileSync(path.join(narrativeDir, file), 'utf8');

  // Check for common issues
  const issues = [];

  if (!content.includes('import { test, expect } from')) {
    issues.push('Missing Playwright imports');
  }

  if (!content.includes('test.describe')) {
    issues.push('Missing test.describe blocks');
  }

  const testCount = (content.match(/test\(/g) || []).length;
  const describeCount = (content.match(/test\.describe\(/g) || []).length;

  console.log(`📊 ${file}:`);
  console.log(`   - ${describeCount} test suites`);
  console.log(`   - ${testCount} individual tests`);

  if (issues.length > 0) {
    console.log('   ❌ Issues:', issues.join(', '));
    hasErrors = true;
  } else {
    console.log('   ✅ Structure looks good');
  }
  console.log('');
});

if (hasErrors) {
  console.log('❌ Some tests have issues');
  process.exit(1);
} else {
  console.log('✅ All narrative tests validated successfully!');
  console.log('');
  console.log('To run these tests:');
  console.log('  npm run test:e2e -- e2e/narratives');
  console.log('  npm run test:e2e:ui -- e2e/narratives');
  process.exit(0);
}
