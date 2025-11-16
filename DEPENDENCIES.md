# Dependency Management & Security

This document outlines the dependency management strategy, known issues, and security considerations for the ESTA Tracker project.

## Current Status

### Node.js & npm Versions

- **Node.js**: 20.x (specified in `.nvmrc` and `package.json`)
- **npm**: ≥9.0.0
- **Vercel Runtime**: Node.js 20.x

### Package Manager

This project uses **npm** with workspaces for the monorepo structure.

## Dependency Overview

### Root Dependencies

```json
{
  "firebase-admin": "^12.0.0",
  "concurrently": "^8.2.2",
  "typescript": "^5.3.3"
}
```

### Frontend Dependencies

**Production:**
- React 18.2.0
- React Router DOM 6.22.3
- date-fns 4.1.0
- Zustand 4.5.0 (state management)
- clsx 2.1.0 (utility)

**Development:**
- Vite 5.0.12
- TypeScript 5.3.3
- Vitest 1.2.1
- Tailwind CSS 3.4.1
- ESLint 8.56.0

### Backend Dependencies

**Production:**
- Express 4.18.2
- PostgreSQL (pg) 8.11.3
- JWT & bcrypt for authentication
- Zod 3.22.4 (validation)
- Helmet 7.1.0 (security)

## Known Vulnerabilities

### Development-Only Issues (Non-Critical)

The following vulnerabilities exist in **development dependencies only** and do not affect production builds:

1. **esbuild ≤0.24.2** (Moderate)
   - **Impact**: Development server only
   - **Issue**: Potential SSRF in dev server
   - **Risk**: LOW - only affects local development
   - **Action**: Monitor for updates; does not affect production builds

2. **vite 0.11.0 - 6.1.6** (Moderate)
   - **Impact**: Indirect via esbuild
   - **Risk**: LOW - development only
   - **Action**: Monitor for non-breaking updates

3. **vitest 1.2.1** (Moderate)
   - **Impact**: Testing framework
   - **Risk**: LOW - not used in production
   - **Action**: Update to v4+ requires major version migration

### Mitigation Strategy

- ✅ Production builds do not include dev dependencies
- ✅ Development should be done in isolated/containerized environments
- ✅ Regular security audits scheduled
- ✅ Automated Dependabot updates enabled (recommended)

## Dependency Update Strategy

### Semantic Versioning

We follow semantic versioning (semver) principles:

- **Patch updates** (x.x.X): Bug fixes - Update freely
- **Minor updates** (x.X.x): New features, backward compatible - Update with testing
- **Major updates** (X.x.x): Breaking changes - Requires careful review and testing

### Update Schedule

- **Weekly**: Check for security patches
- **Monthly**: Review and update patch/minor versions
- **Quarterly**: Evaluate major version upgrades
- **As needed**: Critical security vulnerabilities

### Update Process

1. **Check for updates:**
   ```bash
   npm outdated
   ```

2. **Review changelogs** for breaking changes

3. **Update dependencies:**
   ```bash
   # Update a specific package
   npm update package-name
   
   # Update all non-breaking changes
   npm update
   ```

4. **Test thoroughly:**
   ```bash
   npm run test
   npm run build
   npm run lint
   ```

5. **Commit with descriptive message:**
   ```bash
   git commit -m "chore(deps): update vite to v5.1.0"
   ```

## Security Best Practices

### Automated Scanning

1. **Enable GitHub Dependabot:**
   - Automatically creates PRs for security updates
   - Configure in `.github/dependabot.yml`

2. **Run security audits regularly:**
   ```bash
   npm audit
   ```

3. **Use npm audit fix cautiously:**
   ```bash
   # Review changes before applying
   npm audit fix --dry-run
   
   # Apply non-breaking fixes
   npm audit fix
   
   # Force updates (may break things)
   npm audit fix --force
   ```

### Manual Review

Before updating dependencies:

1. ✅ Check GitHub Security Advisories
2. ✅ Review changelogs and migration guides
3. ✅ Test in development environment
4. ✅ Run full test suite
5. ✅ Verify build succeeds
6. ✅ Check for breaking changes in TypeScript types

## Lock File Management

### package-lock.json

- ✅ **Keep committed** to repository
- ✅ Ensures consistent installs across environments
- ✅ Vercel and CI/CD use this for reproducible builds

### When to Update Lock File

```bash
# After adding/removing dependencies
npm install

# After updating dependencies
npm update

# Force regeneration (rare, if lock file is corrupted)
rm package-lock.json
npm install
```

### Lock File Conflicts

If you encounter merge conflicts in `package-lock.json`:

```bash
# Regenerate lock file
rm package-lock.json
npm install
git add package-lock.json
git commit -m "chore: regenerate lock file after merge"
```

## Troubleshooting

### Build Failures

**Issue**: Dependencies fail to install
```bash
# Solution 1: Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Solution 2: Use legacy peer deps
npm install --legacy-peer-deps
```

**Issue**: TypeScript errors after update
```bash
# Check for type definition updates
npm install --save-dev @types/node@latest
npm run typecheck
```

### Peer Dependency Warnings

Peer dependency warnings are usually safe to ignore if:
- The application builds successfully
- Tests pass
- No runtime errors occur

To suppress warnings:
```bash
npm install --legacy-peer-deps
```

## Dependency Analysis Tools

### Visualize Dependencies

```bash
# Install globally
npm install -g depcheck

# Check for unused dependencies
npx depcheck

# Analyze bundle size
npx vite-bundle-visualizer
```

### Find Outdated Packages

```bash
# List outdated packages
npm outdated

# Check for major updates
npx npm-check-updates
```

## Production Deployment

### What Gets Deployed

**Frontend (Vercel):**
- Only production dependencies
- Optimized and minified bundles
- No dev dependencies included

**Backend:**
- Production dependencies only
- Dev dependencies excluded

### Vercel-Specific

Vercel automatically:
- Uses `package-lock.json` for consistent builds
- Installs only production dependencies in serverless functions
- Caches dependencies between builds

## Recommended Actions

### Immediate

- [ ] Enable GitHub Dependabot
- [ ] Set up automated security scanning
- [ ] Document any custom dependency requirements

### Short-term (1-3 months)

- [ ] Evaluate upgrading Vite to v6+ (when stable)
- [ ] Consider upgrading Vitest to v4+ for better DX
- [ ] Update React to v18.3+ when available

### Long-term (6+ months)

- [ ] Plan React 19 migration when stable
- [ ] Consider migrating from Vite 5 to Vite 6+
- [ ] Evaluate modern state management alternatives

## Additional Resources

- [npm Documentation](https://docs.npmjs.com/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Security Advisories](https://github.com/advisories)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [npm Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)

## Support

For dependency-related issues:
1. Check this document first
2. Search existing GitHub issues
3. Create new issue with reproduction steps
4. Tag as `dependencies` or `security`
