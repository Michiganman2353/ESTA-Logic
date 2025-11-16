# Build & Deployment Troubleshooting Guide

This guide helps diagnose and fix common build and deployment issues for the ESTA Tracker application.

## Quick Diagnostics

Run these commands to check your environment:

```bash
# Check Node.js and npm versions
node --version  # Should be v20.x
npm --version   # Should be ≥9.0.0

# Check if dependencies are installed
ls node_modules

# Run a clean build
npm run clean
npm install
npm run build
```

## Common Build Issues

### 1. Build Command Failures

#### Issue: "command not found: npm"

**Cause:** Node.js/npm not installed or not in PATH

**Solution:**
```bash
# Install Node.js 20.x using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Verify installation
node --version
npm --version
```

#### Issue: "Cannot find module 'vite'"

**Cause:** Dependencies not installed or corrupted

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
npm install
```

#### Issue: Build fails with TypeScript errors

**Cause:** TypeScript compilation errors

**Solution:**
```bash
# Check for errors
npm run typecheck

# Common fixes:
# 1. Update TypeScript types
npm install --save-dev @types/node@latest @types/react@latest

# 2. Clear TypeScript build cache
rm -rf packages/*/tsconfig.tsbuildinfo
npm run build
```

### 2. Missing Dependencies

#### Issue: "Module not found" errors

**Cause:** Dependency not listed in package.json

**Solution:**
```bash
# Install missing dependency
npm install <package-name>

# Or for dev dependencies
npm install --save-dev <package-name>
```

#### Issue: Peer dependency warnings

**Cause:** Conflicting peer dependencies

**Solution:**
```bash
# Usually safe to ignore if build succeeds
# To suppress warnings:
npm install --legacy-peer-deps
```

### 3. Version Conflicts

#### Issue: "Incompatible Node.js version"

**Cause:** Wrong Node.js version

**Solution:**
```bash
# Check required version
cat .nvmrc

# Use correct version
nvm use 20
# or
nvm use $(cat .nvmrc)
```

#### Issue: npm version too old

**Cause:** npm < 9.0.0

**Solution:**
```bash
npm install -g npm@latest
npm --version
```

### 4. Environment Variable Issues

#### Issue: "Environment variable not defined"

**Cause:** Missing .env file or variables not set

**Solution:**
```bash
# Create .env from example
cp .env.example .env

# Edit with your values
nano .env

# For Vercel, set in dashboard:
# Project Settings → Environment Variables
```

#### Issue: VITE_ prefix missing

**Cause:** Frontend env vars must start with VITE_

**Solution:**
```bash
# Wrong:
API_URL=http://localhost:3001

# Correct:
VITE_API_URL=http://localhost:3001
```

## Vercel-Specific Issues

### 1. Deployment Failures

#### Issue: "Build exceeded time limit"

**Cause:** Build taking too long

**Solution:**
- Check for infinite loops in build scripts
- Optimize dependencies
- Contact Vercel support for limit increase

#### Issue: "Output directory not found"

**Cause:** Wrong output directory in vercel.json

**Solution:**
```json
// Verify in vercel.json:
{
  "outputDirectory": "packages/frontend/dist"
}
```

#### Issue: "Module not found" in production

**Cause:** Dependency in devDependencies instead of dependencies

**Solution:**
```bash
# Move to production dependencies
npm install --save-prod <package-name>
npm uninstall --save-dev <package-name>
```

### 2. Runtime Errors on Vercel

#### Issue: 500 Internal Server Error

**Cause:** Missing environment variables

**Solution:**
1. Go to Vercel Dashboard
2. Project Settings → Environment Variables
3. Add all required variables from `.env.example`
4. Redeploy

#### Issue: CORS errors

**Cause:** CORS not configured for production domain

**Solution:**
```bash
# Set in Vercel environment variables:
CORS_ORIGIN=https://your-domain.vercel.app
```

#### Issue: API routes return 404

**Cause:** Incorrect API configuration

**Solution:**
```javascript
// Check VITE_API_URL in frontend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
```

### 3. Build Configuration Issues

#### Issue: "Command failed with exit code 1"

**Cause:** Build command failed

**Solution:**
```bash
# Test build locally first
npm run build:frontend

# Check build logs in Vercel for specific error
```

#### Issue: Node.js version mismatch

**Cause:** Vercel using wrong Node version

**Solution:**
Ensure these files are consistent:

**.nvmrc:**
```
20
```

**package.json:**
```json
{
  "engines": {
    "node": "20.x"
  }
}
```

**vercel.json:**
```json
{
  "functions": {
    "api/*.js": {
      "runtime": "nodejs20.x"
    }
  }
}
```

## Performance Issues

### 1. Slow Builds

#### Issue: Build takes too long locally

**Solution:**
```bash
# Use Vite's fast refresh
npm run dev

# Clear build cache
rm -rf packages/frontend/dist
rm -rf packages/frontend/.vite
npm run build
```

#### Issue: Large bundle size

**Solution:**
```bash
# Analyze bundle
npx vite-bundle-visualizer

# Common fixes:
# - Remove unused dependencies
# - Use dynamic imports for routes
# - Optimize images
```

### 2. Memory Issues

#### Issue: "JavaScript heap out of memory"

**Solution:**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or add to package.json scripts:
"build": "NODE_OPTIONS='--max-old-space-size=4096' npm run build:frontend"
```

## Database Connection Issues

### 1. Connection Failures

#### Issue: "Connection refused" or "Connection timeout"

**Cause:** Database not accessible

**Solution:**
```bash
# Check DATABASE_URL format
DATABASE_URL=postgresql://username:password@host:5432/database

# Test connection
psql $DATABASE_URL

# Common issues:
# - Wrong host/port
# - Firewall blocking connection
# - Database not running
```

#### Issue: SSL required

**Cause:** Database requires SSL connection

**Solution:**
```bash
# Add SSL parameter
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

## Monorepo-Specific Issues

### 1. Workspace Errors

#### Issue: "Workspace not found"

**Cause:** npm workspaces not configured

**Solution:**
```json
// Verify in root package.json:
{
  "workspaces": [
    "packages/*"
  ]
}
```

#### Issue: Cross-workspace dependency issues

**Solution:**
```bash
# Install from root
cd /path/to/esta-tracker-clean
npm install

# Not from individual packages
```

### 2. Build Order Issues

#### Issue: Backend builds before types are generated

**Solution:**
```bash
# Build in correct order
npm run build:backend
npm run build:frontend

# Or use the root command that handles order:
npm run build
```

## Testing Issues

### 1. Test Failures

#### Issue: Tests fail but code works

**Cause:** Test environment not configured

**Solution:**
```bash
# Check vitest.config.ts
# Ensure environment matches runtime

# Run tests with debug output
npm run test -- --reporter=verbose
```

#### Issue: "Cannot find module" in tests

**Cause:** Path alias not configured for tests

**Solution:**
```typescript
// vitest.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Clean Slate Solution

If all else fails, start fresh:

```bash
# 1. Clean everything
npm run clean
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules
rm -rf packages/*/dist

# 2. Fresh install
npm install

# 3. Verify versions
node --version  # Should be 20.x
npm --version   # Should be ≥9.0.0

# 4. Build
npm run build

# 5. Test
npm run test

# 6. If still failing, check:
git status  # Any uncommitted changes?
git log -1  # On correct branch/commit?
```

## Getting Help

If you're still stuck:

1. **Check build logs:** Full error messages help diagnose issues
2. **Search issues:** [GitHub Issues](https://github.com/Michiganman2353/esta-tracker-clean/issues)
3. **Create issue:** Include:
   - Node/npm versions
   - Full error message
   - Steps to reproduce
   - Environment (local/Vercel/other)

## Useful Commands Reference

```bash
# Clean and rebuild
npm run clean && npm install && npm run build

# Check for outdated dependencies
npm outdated

# Security audit
npm audit

# Check TypeScript errors
npm run typecheck

# Lint code
npm run lint

# Run tests
npm run test

# Development mode
npm run dev

# Production build
npm run build

# Check disk space (builds need space)
df -h
```

## Prevention Tips

1. ✅ Always commit package-lock.json
2. ✅ Use .nvmrc for version consistency
3. ✅ Test builds before pushing
4. ✅ Keep dependencies updated
5. ✅ Document environment variables
6. ✅ Use CI/CD for automated testing
7. ✅ Monitor build times and sizes

## Additional Resources

- [Vite Troubleshooting](https://vitejs.dev/guide/troubleshooting.html)
- [Vercel Docs](https://vercel.com/docs)
- [npm Troubleshooting](https://docs.npmjs.com/common-errors)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)
