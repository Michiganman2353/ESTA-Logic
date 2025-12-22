# Vercel Deployment Guide

## Overview

This document provides comprehensive guidance for deploying the ESTA Tracker application to Vercel.

## Prerequisites

### Required Secrets

Configure the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

#### Vercel Secrets

- `VERCEL_TOKEN` - Your Vercel authentication token
- `VERCEL_ORG_ID` - Your Vercel organization/team ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID

#### Firebase Secrets (for Production Build)

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

## Runtime Configuration

### Node.js Version Alignment

The project uses **Node.js 22.x** across all environments:

- **vercel.json**: All serverless functions use `nodejs22.x`
- **package.json**: `"engines": { "node": "22.x" }`
- **.nvmrc**: Contains `22`
- **CI/CD workflows**: Use Node.js `22.x`

⚠️ **IMPORTANT**: All these files must stay aligned. Use the validation script to ensure consistency:

```bash
npm run validate:vercel
```

## Vercel Configuration Files

### vercel.json

The main Vercel configuration file defines:

1. **Build Settings**
   - `buildCommand`: `npm run build:frontend`
   - `outputDirectory`: `apps/frontend/dist`
   - `installCommand`: `npm ci --prefer-offline`

2. **Serverless Functions**
   - All functions in `api/` directory use `nodejs22.x` runtime
   - Background jobs: 300s max duration, 1024MB memory
   - Secure endpoints: 60s max duration, 512MB memory
   - Standard APIs: 30s max duration, 512MB memory

3. **Security Headers**
   - Content Security Policy (CSP)
   - X-Frame-Options: DENY
   - Strict Transport Security
   - And more...

### .vercelignore

Controls which files are excluded from deployment:

```
node_modules/
.git/
.env
.env.local
```

**Note**: The `!packages/frontend/scripts/` line ensures necessary scripts are included.

## Deployment Workflows

### Preview Deployments (Pull Requests)

Triggered automatically on PR creation:

1. Runs full test suite
2. Builds production bundle
3. Deploys to Vercel preview environment
4. Runs smoke tests
5. Posts preview URL in PR comments

### Production Deployments (Master Branch)

Triggered on push to `master`:

1. Runs comprehensive validation
2. Builds production bundle
3. Deploys to Vercel production
4. Runs smoke tests
5. Reports deployment status

## Manual Deployment

### Local CLI Deployment

1. Install Vercel CLI globally:

   ```bash
   npm install -g vercel@latest
   ```

2. Login to Vercel:

   ```bash
   vercel login
   ```

3. Link to your project (first time only):

   ```bash
   vercel link
   ```

4. Deploy to preview:

   ```bash
   vercel
   ```

5. Deploy to production:
   ```bash
   vercel --prod
   ```

### Force Clean Deployment

If you encounter cache issues:

```bash
vercel --force
```

Or in the Vercel dashboard:

1. Go to your project
2. Click on "Deployments"
3. Click the "..." menu on any deployment
4. Select "Redeploy"
5. Check "Use existing Build Cache" to disable it

## Validation Scripts

### Automated Validation

Run before any manual deployment:

```bash
# Validate Vercel configuration
npm run validate:vercel

# Validate complete deployment setup
npm run validate:deployment

# Full CI validation
npm run ci:validate
```

### What Gets Validated

1. **vercel.json**
   - Valid JSON syntax
   - Correct schema
   - Runtime configuration
   - Build settings

2. **Runtime Alignment**
   - package.json engines match vercel.json
   - .nvmrc matches vercel.json
   - All use Node.js 22

3. **.vercelignore**
   - Critical files not excluded
   - Build artifacts properly configured

4. **Build Output**
   - Output directory configuration
   - Build command validity

## Troubleshooting

### Common Issues

#### Runtime Mismatch Error

**Symptom**: Vercel deployment fails with runtime version error

**Solution**:

```bash
# Validate runtime alignment
npm run validate:vercel

# All files should specify Node 22
# - vercel.json: nodejs22.x
# - package.json: "node": "22.x"
# - .nvmrc: 22
```

#### Build Fails to Find Dependencies

**Symptom**: `Cannot find module` errors during build

**Solution**:

```bash
# Ensure .vercelignore doesn't exclude node_modules
# Vercel will install dependencies automatically
# Check that package-lock.json is committed
```

#### Functions Timeout

**Symptom**: Serverless functions exceed time limit

**Solutions**:

1. Increase `maxDuration` in vercel.json for specific function patterns
2. Optimize function code to run faster
3. Consider using background jobs for long-running tasks

#### Cache Corruption

**Symptom**: Deployment succeeds but app doesn't work as expected

**Solutions**:

1. Force redeploy without cache in Vercel dashboard
2. Use `vercel --force` flag
3. Clear Nx cache: `npm run clean:all`

### Environment Variables

#### Missing Environment Variables

Check Vercel dashboard:

1. Project Settings → Environment Variables
2. Ensure all Firebase variables are set
3. Set for appropriate environments (Production, Preview, Development)

#### Local Development

Create `.env.local` (never commit this file):

```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## Best Practices

### Pre-Deployment Checklist

- [ ] Run `npm run validate:vercel` locally
- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] No type errors: `npm run typecheck`
- [ ] Build succeeds locally: `npm run build`
- [ ] All required secrets configured
- [ ] Version alignment verified

### Security

1. **Never commit secrets** to source code
2. **Use GitHub Secrets** for CI/CD
3. **Use Vercel Environment Variables** for runtime config
4. **Review security headers** in vercel.json regularly
5. **Keep dependencies updated** with `npm audit`

### Performance

1. **Monitor bundle sizes** with build reports
2. **Use code splitting** (already configured in vite.config.ts)
3. **Optimize images** before committing
4. **Review performance budgets** in performance-budgets.json
5. **Monitor Vercel Analytics** for real-world performance

## Support

### Documentation

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [Serverless Functions](https://vercel.com/docs/functions/serverless-functions)

### Project-Specific

- See `BUILD.md` for build instructions
- See `QUICK_START.md` for development setup
- See `ARCHITECTURE.md` for system architecture

### Getting Help

1. Check the troubleshooting section above
2. Review GitHub Actions logs for detailed error messages
3. Check Vercel deployment logs in the dashboard
4. Contact the development team

## Monitoring

### Vercel Dashboard

Monitor your deployments at [vercel.com/dashboard](https://vercel.com/dashboard):

- Deployment status and logs
- Function execution logs
- Analytics and performance metrics
- Environment variables

### GitHub Actions

Monitor CI/CD at your repository's Actions tab:

- Build and test logs
- Deployment status
- Artifact uploads
- Error reports

---

**Last Updated**: 2025-12-22  
**Maintained By**: ESTA Tracker Development Team
