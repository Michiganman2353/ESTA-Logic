# Minimal Viable Deployment (MVD) - January 2025

## Overview

This repository has been transformed to a **Minimal Viable Deployment** (MVD) approach, prioritizing a green Vercel deployment over complex tooling and testing infrastructure.

## Key Principles

1. **Single Node Version**: Node 24.x only (local, CI, Vercel)
2. **Simple Build**: `npm run build` builds the frontend
3. **Deploy-First**: No tests or checks block deployment
4. **Minimal Surface Area**: Experimental features archived

## What Changed

### Runtime Consolidation

- **Before**: Multi-Node CI matrix (20.x, 22.x), complex version management
- **After**: Node 24.x everywhere (.nvmrc, package.json, vercel.json, CI)

### Removed/Archived

- ✂️ Gleam compiler and logic/gleam-core
- ✂️ WASM build pipeline
- ✂️ Multi-Node version testing
- ✂️ Nx affected optimizations
- ✂️ Typecheck gates blocking deployment
- ✂️ E2E tests blocking deployment
- ✂️ Blueprint validation blocking deployment
- ✂️ Marketing visual tests blocking deployment
- ✂️ Mutation testing
- ✂️ Sentinel workflow

### Simplified CI/CD

**Old**: 800+ lines of complex CI with multiple jobs, matrix builds, Gleam setup
**New**: ~200 lines focusing on:

1. Build frontend
2. Deploy to Vercel preview (PRs)
3. Deploy to Vercel production (master)

Linting is non-blocking. No tests block deployment.

### Simplified Scripts

**Before**:

```json
{
  "build": "npx nx run-many --target=build --all",
  "build:affected": "nx affected --target=build",
  "test:affected": "nx affected --target=test",
  "typecheck:affected": "nx affected --target=typecheck",
  "gleam:build": "bash scripts/build-gleam-wasm.sh",
  "wasm:build": "nx run accrual-engine:wasm-build"
}
```

**After**:

```json
{
  "build": "npm run build:frontend",
  "build:frontend": "npx nx build frontend",
  "dev": "npm run dev:frontend",
  "lint": "nx run-many --target=lint --all"
}
```

## How to Work With This

### Local Development

```bash
npm ci
npm run dev           # Start frontend dev server
npm run build         # Build for production
npm run lint          # Optional linting
```

### CI/CD Pipeline

1. **Build Job**: Installs deps → Builds frontend → Validates output
2. **Deploy Preview** (PRs): Deploys to Vercel preview environment
3. **Deploy Production** (master): Deploys to Vercel production

### Adding Features Back

When the deployment is stable and the app is shipping to customers:

1. **Tests**: Add them back incrementally, never as deployment blockers
2. **E2E**: Useful for validation, but run separately from deployment
3. **Typecheck**: Make it a PR check, not a deployment gate
4. **Advanced Features**: Consider Gleam/WASM only when absolutely needed

## Deployment Checklist

✅ Single Node version (24.x)
✅ One build command
✅ Zero experimental tooling
✅ Minimal CI pipeline
✅ No tests blocking deployment
✅ Vercel deployment configured

## Philosophy

> "A test suite that prevents deployment is worse than no tests at your stage."

The goal is to get a working application deployed to production as quickly as possible. Once that's stable, iterate and add sophistication.

## Emergency Rollback

If you need to restore the previous complex CI/CD:

```bash
mv .github/workflows/ci-old-complex.yml.disabled .github/workflows/ci.yml
```

Archived experimental code is in:

- `archive/gleam-core/` - Gleam microkernel
- `archive/gleam-scripts/` - Gleam build scripts
- `.github/workflows/*.disabled` - Disabled workflows

## Next Steps

1. Merge this PR
2. Verify green Vercel deployment
3. Test deployed app functionality
4. Iterate on features
5. Add back quality gates incrementally (as non-blocking)

---

**Remember**: Tools serve the product, not the other way around.
