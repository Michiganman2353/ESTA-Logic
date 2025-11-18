# How to Fix: "Error: Input required and not supplied: vercel-token"

## Problem

When running GitHub Actions, the deploy-preview job fails with:
```
Error: Input required and not supplied: vercel-token
```

## Root Cause

The GitHub Actions workflow requires three secrets to be configured in the repository settings:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

These secrets are not currently configured, causing the deployment to fail.

## Solution

### Quick Fix (5 minutes)

1. **Navigate to GitHub Secrets Settings**
   ```
   https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions
   ```

2. **Add VERCEL_TOKEN**
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: `cCWR9S3mirDVwI315SjRzTep` (from VERCEL_TOKEN_SETUP.md)
   - Click "Add secret"

3. **Get Organization and Project IDs**
   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel
   
   # Link your project
   vercel link
   
   # View the generated IDs
   cat .vercel/project.json
   ```

4. **Add VERCEL_ORG_ID**
   - Click "New repository secret"
   - Name: `VERCEL_ORG_ID`
   - Value: Copy the `orgId` from `.vercel/project.json`
   - Click "Add secret"

5. **Add VERCEL_PROJECT_ID**
   - Click "New repository secret"
   - Name: `VERCEL_PROJECT_ID`
   - Value: Copy the `projectId` from `.vercel/project.json`
   - Click "Add secret"

### Verify the Fix

1. Create a test pull request
2. Check the Actions tab
3. The "Deploy Preview" job should now succeed

### Detailed Documentation

For complete instructions, troubleshooting, and security best practices, see:
- **[GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)** - Complete setup guide
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment documentation
- **[VERCEL_TOKEN_SETUP.md](./VERCEL_TOKEN_SETUP.md)** - Original token documentation

### Local Validation

To verify your local environment has the necessary secrets:

```bash
./scripts/validate-secrets.sh
```

This script checks if all required environment variables are configured.

## Changes Made to Fix This Issue

1. **Added validation step to CI workflow** - Now provides clear error messages
2. **Created GITHUB_SECRETS_SETUP.md** - Comprehensive setup guide
3. **Created validation script** - `scripts/validate-secrets.sh` for local testing
4. **Updated documentation** - Added prominent references in DEPLOYMENT.md and TESTING.md

## Why This Error Occurs

The GitHub Actions workflow uses the `amondnet/vercel-action@v25` action which requires these three inputs:
- `vercel-token`: For authenticating with Vercel API
- `vercel-org-id`: To identify which Vercel organization to deploy to
- `vercel-project-id`: To identify which Vercel project to deploy to

Without these secrets configured in GitHub, the action cannot authenticate and deploy, resulting in the error message.

## Security Notes

- ✅ Secrets are stored securely in GitHub and never exposed in logs
- ✅ The workflow now validates secrets before attempting deployment
- ✅ Clear error messages help identify which secrets are missing
- ❌ Never commit these secrets directly to the repository
- ❌ Never share secrets in pull request descriptions or comments

## Additional Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Vercel with GitHub Actions Guide](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
