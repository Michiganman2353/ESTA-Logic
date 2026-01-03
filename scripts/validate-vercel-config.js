#!/usr/bin/env node

/**
 * Validation script for Vercel deployment configuration
 * Ensures runtime alignment between vercel.json, package.json, and .nvmrc
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, fileName) {
  if (!fs.existsSync(filePath)) {
    log(`❌ ERROR: ${fileName} not found at ${filePath}`, 'red');
    return false;
  }
  log(`✅ ${fileName} found`, 'green');
  return true;
}

function validateVercelJson() {
  log('\n🔍 Validating vercel.json...', 'blue');
  const vercelJsonPath = path.join(REPO_ROOT, 'vercel.json');

  if (!checkFileExists(vercelJsonPath, 'vercel.json')) {
    return false;
  }

  try {
    const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));

    // Check schema
    if (!vercelConfig.$schema) {
      log('⚠️  Warning: $schema not defined in vercel.json', 'yellow');
    } else {
      log(`✅ Schema: ${vercelConfig.$schema}`, 'green');
    }

    // Check version
    if (vercelConfig.version !== 2) {
      log(
        `❌ ERROR: vercel.json version should be 2, got ${vercelConfig.version}`,
        'red'
      );
      return false;
    }
    log(`✅ Version: ${vercelConfig.version}`, 'green');

    // Check functions runtime
    if (!vercelConfig.functions) {
      log('⚠️  Warning: No functions configuration found', 'yellow');
      return true;
    }

    const runtimes = new Set();
    Object.entries(vercelConfig.functions).forEach(([pattern, config]) => {
      if (config.runtime) {
        runtimes.add(config.runtime);
        log(`  ℹ️  ${pattern}: ${config.runtime}`, 'blue');
      }
    });

    if (runtimes.size === 0) {
      log('❌ ERROR: No runtime specified for any functions', 'red');
      return false;
    }

    if (runtimes.size > 1) {
      log(
        `⚠️  Warning: Multiple runtimes detected: ${Array.from(runtimes).join(', ')}`,
        'yellow'
      );
    }

    // Extract Node version from runtime
    const runtime = Array.from(runtimes)[0];
    const nodeVersionMatch = runtime.match(/nodejs(\d+)\.x/);
    if (!nodeVersionMatch) {
      log(`❌ ERROR: Invalid runtime format: ${runtime}`, 'red');
      return false;
    }

    const vercelNodeVersion = nodeVersionMatch[1];
    log(`✅ Vercel runtime Node version: ${vercelNodeVersion}`, 'green');

    // Check build configuration
    if (!vercelConfig.buildCommand) {
      log('⚠️  Warning: No buildCommand specified', 'yellow');
    } else {
      log(`✅ Build command: ${vercelConfig.buildCommand}`, 'green');
    }

    if (!vercelConfig.outputDirectory) {
      log('⚠️  Warning: No outputDirectory specified', 'yellow');
    } else {
      log(`✅ Output directory: ${vercelConfig.outputDirectory}`, 'green');
    }

    return { valid: true, nodeVersion: vercelNodeVersion };
  } catch (error) {
    log(`❌ ERROR: Failed to parse vercel.json: ${error.message}`, 'red');
    return false;
  }
}

function validatePackageJson(expectedNodeVersion) {
  log('\n🔍 Validating package.json...', 'blue');
  const packageJsonPath = path.join(REPO_ROOT, 'package.json');

  if (!checkFileExists(packageJsonPath, 'package.json')) {
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    if (!packageJson.engines || !packageJson.engines.node) {
      log('⚠️  Warning: No Node.js engine specified in package.json', 'yellow');
      return true;
    }

    const nodeEngine = packageJson.engines.node;
    log(`✅ Node engine: ${nodeEngine}`, 'green');

    // Extract major version from various formats (>=20.0.0, 22.x, etc.)
    const versionMatch = nodeEngine.match(/(\d+)/);
    if (!versionMatch) {
      log(
        `⚠️  Warning: Could not parse Node version from: ${nodeEngine}`,
        'yellow'
      );
      return true;
    }

    const packageNodeVersion = versionMatch[1];

    // Accept >= patterns for dual-runtime strategy
    if (nodeEngine.includes('>=')) {
      if (
        parseInt(packageNodeVersion, 10) <= parseInt(expectedNodeVersion, 10)
      ) {
        log(
          `✅ Package.json accepts Node ${expectedNodeVersion} (engine: ${nodeEngine})`,
          'green'
        );
        return true;
      } else {
        log(
          `❌ ERROR: package.json requires Node >=${packageNodeVersion}, but Vercel uses ${expectedNodeVersion}`,
          'red'
        );
        return false;
      }
    }

    if (packageNodeVersion !== expectedNodeVersion) {
      log(
        `⚠️  Warning: Node version mismatch - package.json: ${packageNodeVersion}, vercel.json: ${expectedNodeVersion}`,
        'yellow'
      );
      log(
        `   This is acceptable for dual-runtime strategies (dev vs production)`,
        'yellow'
      );
    } else {
      log(`✅ Node version alignment verified: ${packageNodeVersion}`, 'green');
    }

    return true;
  } catch (error) {
    log(`❌ ERROR: Failed to parse package.json: ${error.message}`, 'red');
    return false;
  }
}

function validateNvmrc(expectedNodeVersion) {
  log('\n🔍 Validating .nvmrc...', 'blue');
  const nvmrcPath = path.join(REPO_ROOT, '.nvmrc');

  if (!checkFileExists(nvmrcPath, '.nvmrc')) {
    log('⚠️  Warning: .nvmrc not found (optional)', 'yellow');
    return true;
  }

  try {
    const nvmrcVersion = fs.readFileSync(nvmrcPath, 'utf-8').trim();
    log(`✅ .nvmrc version: ${nvmrcVersion}`, 'green');

    // Dual-runtime strategy: Allow .nvmrc to be >= Vercel runtime
    // .nvmrc is for local development (can be newer)
    // vercel.json is for production runtime (must match Vercel support)
    const nvmrcMajor = parseInt(nvmrcVersion, 10);
    const vercelMajor = parseInt(expectedNodeVersion, 10);

    if (nvmrcMajor < vercelMajor) {
      log(
        `❌ ERROR: .nvmrc version (${nvmrcVersion}) is older than Vercel runtime (${expectedNodeVersion})`,
        'red'
      );
      log('   .nvmrc should be >= vercel.json runtime for development', 'red');
      return false;
    }

    if (nvmrcMajor > vercelMajor) {
      log(
        `✅ Dual-runtime strategy detected: .nvmrc (${nvmrcVersion}) for local dev, vercel.json (${expectedNodeVersion}) for production`,
        'green'
      );
    } else {
      log(`✅ Node version alignment verified: ${nvmrcVersion}`, 'green');
    }

    return true;
  } catch (error) {
    log(`❌ ERROR: Failed to read .nvmrc: ${error.message}`, 'red');
    return false;
  }
}

function validateVercelIgnore() {
  log('\n🔍 Validating .vercelignore...', 'blue');
  const vercelIgnorePath = path.join(REPO_ROOT, '.vercelignore');

  if (!fs.existsSync(vercelIgnorePath)) {
    log('⚠️  Warning: .vercelignore not found (optional)', 'yellow');
    return true;
  }

  try {
    const vercelIgnore = fs.readFileSync(vercelIgnorePath, 'utf-8');
    const lines = vercelIgnore
      .split('\n')
      .filter((line) => line.trim() && !line.startsWith('#'));

    // Check for critical build/config files being ignored (node_modules is OK to ignore)
    const criticalFiles = ['package.json', 'vercel.json'];
    const ignoredCritical = lines.filter((line) => {
      return criticalFiles.some(
        (pattern) => line.includes(pattern) && !line.startsWith('!')
      );
    });

    if (ignoredCritical.length > 0) {
      log(
        `⚠️  Warning: Critical files may be ignored: ${ignoredCritical.join(', ')}`,
        'yellow'
      );
    }

    log(`✅ .vercelignore validated (${lines.length} patterns)`, 'green');
    return true;
  } catch (error) {
    log(`❌ ERROR: Failed to read .vercelignore: ${error.message}`, 'red');
    return false;
  }
}

function validateBuildOutput() {
  log('\n🔍 Validating build output configuration...', 'blue');

  const vercelJsonPath = path.join(REPO_ROOT, 'vercel.json');
  const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf-8'));

  if (!vercelConfig.outputDirectory) {
    log('⚠️  Warning: No outputDirectory specified in vercel.json', 'yellow');
    return true;
  }

  const outputPath = path.join(REPO_ROOT, vercelConfig.outputDirectory);
  log(`  ℹ️  Expected output: ${outputPath}`, 'blue');

  // We don't fail if the build output doesn't exist yet (it will be created during build)
  if (fs.existsSync(outputPath)) {
    log(`✅ Build output directory exists`, 'green');
  } else {
    log(`  ℹ️  Build output will be created during deployment`, 'blue');
  }

  return true;
}

function main() {
  log('═══════════════════════════════════════════════════════', 'blue');
  log('   Vercel Configuration Validation', 'blue');
  log('═══════════════════════════════════════════════════════', 'blue');

  const vercelResult = validateVercelJson();
  if (!vercelResult || !vercelResult.valid) {
    log('\n❌ VALIDATION FAILED: vercel.json is invalid or missing', 'red');
    process.exit(1);
  }

  const expectedNodeVersion = vercelResult.nodeVersion;

  const results = [
    validatePackageJson(expectedNodeVersion),
    validateNvmrc(expectedNodeVersion),
    validateVercelIgnore(),
    validateBuildOutput(),
  ];

  log('\n═══════════════════════════════════════════════════════', 'blue');

  if (results.every((r) => r !== false)) {
    log('✅ ALL VALIDATIONS PASSED', 'green');
    log('═══════════════════════════════════════════════════════', 'blue');
    process.exit(0);
  } else {
    log('❌ VALIDATION FAILED', 'red');
    log('═══════════════════════════════════════════════════════', 'blue');
    process.exit(1);
  }
}

main();
