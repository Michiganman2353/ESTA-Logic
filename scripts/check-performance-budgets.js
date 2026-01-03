#!/usr/bin/env node

/**
 * Performance Budget Checker
 *
 * Validates build output against defined performance budgets.
 * Fails CI builds if budgets are exceeded.
 *
 * Usage:
 *   node scripts/check-performance-budgets.js [--ci]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

// Load performance budgets
const budgetsPath = path.join(__dirname, '..', 'performance-budgets.json');
if (!fs.existsSync(budgetsPath)) {
  console.error(
    `${colors.red}Error: performance-budgets.json not found${colors.reset}`
  );
  process.exit(1);
}

const budgets = JSON.parse(fs.readFileSync(budgetsPath, 'utf8'));
const isCI = process.argv.includes('--ci');
const config = isCI ? budgets.enforcement.ci : budgets.enforcement.local;

console.log(
  `${colors.bright}${colors.blue}=== Performance Budget Check ===${colors.reset}\n`
);

// Check if build output exists
const distPath = path.join(__dirname, '..', 'apps', 'frontend', 'dist');
if (!fs.existsSync(distPath)) {
  console.error(
    `${colors.red}Error: Build output not found at ${distPath}${colors.reset}`
  );
  console.log('Run "npm run build" first.');
  process.exit(1);
}

/**
 * Get file size in KB with gzip compression
 */
function getGzipSize(filePath) {
  try {
    const gzippedSize = execSync(`gzip -c "${filePath}" | wc -c`, {
      encoding: 'utf8',
    });
    return Math.round(parseInt(gzippedSize.trim()) / 1024);
  } catch (error) {
    // Fallback to uncompressed size
    const stats = fs.statSync(filePath);
    return Math.round(stats.size / 1024);
  }
}

/**
 * Parse size string like "200KB" to number
 */
function parseSize(sizeStr) {
  const match = sizeStr.match(/^(\d+)KB$/i);
  return match ? parseInt(match[1]) : 0;
}

/**
 * Check a budget against actual size
 */
function checkBudget(name, actualKB, budgetConfig) {
  const limit = parseSize(budgetConfig.limit);
  const warning = parseSize(budgetConfig.warning || budgetConfig.limit);

  const status =
    actualKB > limit ? 'FAIL' : actualKB > warning ? 'WARN' : 'PASS';
  const color =
    status === 'FAIL'
      ? colors.red
      : status === 'WARN'
        ? colors.yellow
        : colors.green;

  console.log(
    `${color}${status}${colors.reset} ${name.padEnd(30)} ${actualKB}KB / ${limit}KB ${status === 'FAIL' ? '❌' : status === 'WARN' ? '⚠️' : '✓'}`
  );

  return status;
}

// Collect all JS files
const assetsPath = path.join(distPath, 'assets', 'js');
const jsFiles = fs.existsSync(assetsPath)
  ? fs.readdirSync(assetsPath).filter((f) => f.endsWith('.js'))
  : [];

// Calculate total sizes
let totalJS = 0;
let reactVendorSize = 0;
let firebaseVendorSize = 0;
let lazyChunkSizes = [];

jsFiles.forEach((file) => {
  const filePath = path.join(assetsPath, file);
  const size = getGzipSize(filePath);
  totalJS += size;

  if (file.includes('react-vendor')) {
    reactVendorSize += size;
  } else if (file.includes('firebase-vendor')) {
    firebaseVendorSize += size;
  } else if (!file.includes('index')) {
    lazyChunkSizes.push({ name: file, size });
  }
});

// Calculate CSS size
const cssPath = path.join(distPath, 'assets', 'css');
let totalCSS = 0;
if (fs.existsSync(cssPath)) {
  const cssFiles = fs.readdirSync(cssPath).filter((f) => f.endsWith('.css'));
  cssFiles.forEach((file) => {
    totalCSS += getGzipSize(path.join(cssPath, file));
  });
}

// Display results
console.log(`${colors.bright}Frontend Bundle Sizes:${colors.reset}\n`);

const results = [];

// Check initial bundle
if (budgets.budgets.frontend.initial) {
  if (budgets.budgets.frontend.initial.js) {
    results.push(
      checkBudget('Initial JS', totalJS, budgets.budgets.frontend.initial.js)
    );
  }
  if (budgets.budgets.frontend.initial.css) {
    results.push(
      checkBudget('Initial CSS', totalCSS, budgets.budgets.frontend.initial.css)
    );
  }
  if (budgets.budgets.frontend.initial.total) {
    results.push(
      checkBudget(
        'Total Initial',
        totalJS + totalCSS,
        budgets.budgets.frontend.initial.total
      )
    );
  }
}

// Check vendor bundles
if (budgets.budgets.frontend.vendor) {
  if (budgets.budgets.frontend.vendor.react && reactVendorSize > 0) {
    results.push(
      checkBudget(
        'React Vendor',
        reactVendorSize,
        budgets.budgets.frontend.vendor.react
      )
    );
  }
  if (budgets.budgets.frontend.vendor.firebase && firebaseVendorSize > 0) {
    results.push(
      checkBudget(
        'Firebase Vendor',
        firebaseVendorSize,
        budgets.budgets.frontend.vendor.firebase
      )
    );
  }
}

// Check lazy chunks
if (budgets.budgets.frontend.lazy && lazyChunkSizes.length > 0) {
  console.log(`\n${colors.bright}Lazy Loaded Chunks:${colors.reset}\n`);
  lazyChunkSizes.forEach((chunk) => {
    results.push(
      checkBudget(
        `  ${chunk.name}`,
        chunk.size,
        budgets.budgets.frontend.lazy.js
      )
    );
  });
}

// Display summary
console.log(`\n${colors.bright}Summary:${colors.reset}`);
const passCount = results.filter((r) => r === 'PASS').length;
const warnCount = results.filter((r) => r === 'WARN').length;
const failCount = results.filter((r) => r === 'FAIL').length;

console.log(`${colors.green}✓ ${passCount} passed${colors.reset}`);
if (warnCount > 0) {
  console.log(`${colors.yellow}⚠ ${warnCount} warnings${colors.reset}`);
}
if (failCount > 0) {
  console.log(`${colors.red}❌ ${failCount} failed${colors.reset}`);
}

// Build time check (if available)
const buildMetricsPath = path.join(distPath, 'build-metrics.json');
if (fs.existsSync(buildMetricsPath)) {
  const buildMetrics = JSON.parse(fs.readFileSync(buildMetricsPath, 'utf8'));
  console.log(`\n${colors.bright}Build Metrics:${colors.reset}`);
  console.log(`Build Time: ${buildMetrics.buildTime}s`);
  console.log(`Chunk Count: ${buildMetrics.chunkCount}`);
}

// Exit with appropriate code
if (config.failOnExceed && failCount > 0) {
  console.log(
    `\n${colors.red}Build failed: Performance budgets exceeded${colors.reset}`
  );
  process.exit(1);
}

if (config.warnOnWarning && warnCount > 0) {
  console.log(
    `\n${colors.yellow}Warning: Some budgets are approaching limits${colors.reset}`
  );
}

if (failCount === 0 && warnCount === 0) {
  console.log(
    `\n${colors.green}All performance budgets passed! 🎉${colors.reset}`
  );
}

process.exit(0);
