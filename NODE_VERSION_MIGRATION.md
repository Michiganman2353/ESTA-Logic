# Node Version Migration Guide - 20.x to 22.x

## Overview
This repository has been updated to use Node.js 22.x to align with Vercel deployment requirements and ensure compatibility across all environments.

## Changes Made
- Updated `.nvmrc` from `20` to `22`
- Updated `engines.node` in all `package.json` files from `20.x` to `22.x`:
  - Root `package.json`
  - `apps/backend/package.json`
  - `apps/frontend/package.json`
  - `apps/marketing/package.json`
  - `functions/package.json`
- Updated `vercel.json` runtime from `nodejs20.x` to `nodejs22.x` for all API functions

## Local Environment Migration

### Step 1: Switch to Node 22.x

If you're using **nvm** (Node Version Manager):

```bash
nvm install 22
nvm use 22
```

If you're using **nvm on Windows**:

```bash
nvm install 22.0.0
nvm use 22.0.0
```

Verify your Node version:

```bash
node --version
# Should output: v22.x.x
```

### Step 2: Clean and Reinstall Dependencies

To avoid version drift and ensure all dependencies are compatible with Node 22.x:

**Using npm:**

```bash
# Remove existing node_modules and lock file artifacts
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
rm -rf packages/*/node_modules
rm -rf functions/node_modules

# Reinstall with the new Node version
npm ci
```

**Using pnpm:**

```bash
# Remove existing node_modules
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf libs/*/node_modules
rm -rf packages/*/node_modules
rm -rf functions/node_modules

# Reinstall with the new Node version
pnpm install --frozen-lockfile
```

### Step 3: Verify Installation

Run the following commands to ensure everything is working correctly:

```bash
# Verify type checking
npm run typecheck

# Verify linting
npm run lint

# Run tests
npm run test

# Build the project
npm run build
```

## CI/CD Considerations

- **Vercel**: Now uses Node 22.x runtime for all serverless functions
- **GitHub Actions**: Workflows should be updated to use Node 22.x if they reference specific Node versions
- **Local Development**: All team members should migrate to Node 22.x to maintain consistency

## Troubleshooting

### Issue: Dependencies fail to install

**Solution**: Ensure you're running Node 22.x:
```bash
node --version
```

If still on Node 20.x, switch using nvm and try again.

### Issue: Build or test failures after migration

**Solution**: Some dependencies may need updates. Check for any deprecated packages:
```bash
npm outdated
```

### Issue: Vercel deployment still fails

**Solution**: Ensure your Vercel project settings also specify Node 22.x:
1. Go to your Vercel project settings
2. Navigate to "General" → "Node.js Version"
3. Select "22.x"
4. Redeploy

## Benefits of Node 22.x

- **Performance**: Improved V8 engine performance
- **Security**: Latest security patches and updates
- **Compatibility**: Aligned with Vercel's recommended Node version
- **Modern Features**: Access to latest JavaScript/TypeScript features

## Questions or Issues?

If you encounter any problems during migration, please:
1. Check that you're using Node 22.x (`node --version`)
2. Ensure all dependencies are reinstalled fresh
3. Review this guide's troubleshooting section
4. Open an issue on the repository if problems persist

---

**Migration Date**: December 2025  
**Required by**: All team members and CI/CD pipelines
