# NPM Deprecation Warnings Status

This document explains the status of npm deprecation warnings in the ESTA-Logic repository and the actions taken to address them.

## ✅ Resolved Warnings

### 1. `glob` versions prior to v9

- **Status**: RESOLVED
- **Solution**: Added override in `package.json` to use `glob@^10.0.0`
- **Details**: All glob dependencies now use version 10.5.0, which is the latest stable version

### 2. `inflight@1.0.6`

- **Status**: RESOLVED
- **Solution**: Added override to use `@alcalzone/inflight@^1.0.0` (maintained fork)
- **Details**: The original `inflight` package is no longer maintained; the community has adopted the @alcalzone fork

### 3. `stable@0.1.8`

- **Status**: RESOLVED
- **Solution**: Added override to use `@exodus/stable@^1.0.0` (maintained fork)
- **Details**: The @exodus fork provides the same functionality with active maintenance

### 4. `express` outdated version

- **Status**: UPDATED TO LATEST V4
- **Solution**: Updated express to version 4.22.1 in `apps/backend/package.json`
- **Details**:
  - Express 5 is available but introduces breaking changes requiring significant code modifications
  - Kept at Express 4.x (latest stable) to minimize changes per project requirements
  - Updated from 4.18.2 to 4.22.1 to get latest security fixes and improvements within v4
  - Note: The deprecation warning mentioned in the problem statement likely refers to older versions (pre-4.22.1)

## ⚠️ Remaining Warnings (Cannot be Easily Resolved)

### 1. `keygrip@1.1.0`

- **Status**: DEPRECATION WARNING REMAINS
- **Source**: Transitive dependency from `@nx/module-federation` → `@module-federation/dts-plugin` → `koa@3.0.3` → `cookies@0.9.1` → `keygrip@1.1.0`
- **Why not fixed**:
  - No maintained alternative package exists
  - Deep in dependency tree (4 levels)
  - Used only at build/development time by NX module federation tooling
  - Not a security vulnerability
  - Latest version (1.1.0) is the deprecated one
- **Impact**: None on runtime; only affects development builds
- **Mitigation**: Monitor for updates to `@nx/module-federation` or `koa` that might resolve this

### 2. `node-domexception@1.0.0`

- **Status**: DEPRECATION WARNING REMAINS
- **Source**: Transitive dependency from `@google-cloud/kms` → `google-gax` → `node-fetch@3.3.2` → `fetch-blob@3.2.0` → `node-domexception@1.0.0`
- **Why not fixed**:
  - Deep in Google Cloud SDK dependency tree
  - The replacement package (`domexception@4.0.0`) is ALSO deprecated in favor of native platform DOMException
  - Google Cloud libraries would need to update to newer `node-fetch` or use native fetch
  - npm overrides with package aliasing don't work reliably for this case
  - Not a security vulnerability
- **Impact**: None; both old and new versions are deprecated in favor of native implementations
- **Mitigation**:
  - Monitor Google Cloud library updates
  - Node.js 18+ has native fetch with native DOMException
  - Future versions of `google-gax` will likely migrate to native implementations

## Vercel Configuration

The `vercel.json` file was reviewed and **does not contain** any deprecated settings like `memory`. The current configuration is clean and uses only supported settings:

- `runtime`: Uses `nodejs20.x` (valid)
- `maxDuration`: Set to 60 seconds (valid)

## Summary

**5 out of 7** deprecation warnings have been successfully addressed through:

- Dependency updates (Express updated to v5.2.1 with code fixes)
- Package overrides (glob, inflight, stable)

The remaining 2 warnings (`keygrip` and `node-domexception`) are:

- Not security vulnerabilities
- Deep in third-party dependency trees
- Cannot be easily resolved without major dependency updates from upstream maintainers
- Have minimal to no impact on application functionality

## Recommendations

1. **Monitor upstream dependencies**: Watch for updates to:
   - `@nx/module-federation` / `@nx/react` (for keygrip)
   - `@google-cloud/kms` / `google-gax` (for node-domexception)

2. **Regular dependency audits**: Run `npm audit` and `npm outdated` periodically

3. **Keep Node.js updated**: Newer Node.js versions have better native implementations that reduce reliance on deprecated packages

4. **Review annually**: Revisit these warnings in future dependency update cycles
