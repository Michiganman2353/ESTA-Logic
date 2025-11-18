# GitHub Secrets Setup Guide

## Overview

This guide explains how to configure GitHub Secrets for the ESTA Tracker CI/CD pipeline. These secrets are required for automated deployments to Vercel during pull requests and merges.

## Required Secrets

The following secrets must be configured in your GitHub repository:

### 1. VERCEL_TOKEN

**Purpose**: Authentication token for Vercel API access  
**Required for**: Preview deployments on pull requests  
**Error if missing**: `Error: Input required and not supplied: vercel-token`

**How to obtain**:
1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Give it a descriptive name (e.g., "ESTA Tracker GitHub Actions")
4. Set the scope to your organization/account
5. Click **"Create"**
6. Copy the token immediately (you won't see it again)

**Token from VERCEL_TOKEN_SETUP.md**: `cCWR9S3mirDVwI315SjRzTep`

### 2. VERCEL_ORG_ID

**Purpose**: Identifies your Vercel organization/account  
**Required for**: Deploying to the correct Vercel organization  

**How to obtain**:
1. Run `vercel link` in your project directory (requires Vercel CLI)
2. Follow the prompts to link to your Vercel project
3. Check the `.vercel/project.json` file
4. Copy the `orgId` value

### 3. VERCEL_PROJECT_ID

**Purpose**: Identifies the specific Vercel project  
**Required for**: Deploying to the correct Vercel project  

**How to obtain**:
1. Run `vercel link` in your project directory (requires Vercel CLI)
2. Follow the prompts to link to your Vercel project
3. Check the `.vercel/project.json` file
4. Copy the `projectId` value

## Adding Secrets to GitHub

### Step-by-Step Instructions

1. **Navigate to Repository Settings**
   ```
   https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add VERCEL_TOKEN**
   - Name: `VERCEL_TOKEN`
   - Value: `cCWR9S3mirDVwI315SjRzTep` (or your new token)
   - Click **"Add secret"**

4. **Add VERCEL_ORG_ID**
   - Name: `VERCEL_ORG_ID`
   - Value: Your organization ID from `.vercel/project.json`
   - Click **"Add secret"**

5. **Add VERCEL_PROJECT_ID**
   - Name: `VERCEL_PROJECT_ID`
   - Value: Your project ID from `.vercel/project.json`
   - Click **"Add secret"**

### Screenshot Guide

Here's what the GitHub Secrets page should look like:

```
Repository → Settings → Secrets and variables → Actions

Repository secrets:
┌────────────────────────────────────────────────────┐
│ VERCEL_TOKEN          Updated 1 minute ago  Update │
│ VERCEL_ORG_ID         Updated 1 minute ago  Update │
│ VERCEL_PROJECT_ID     Updated 1 minute ago  Update │
└────────────────────────────────────────────────────┘
```

## Verifying the Setup

### 1. Check if Secrets are Configured

GitHub doesn't show secret values for security, but you can verify they exist:
- Go to repository Settings → Secrets and variables → Actions
- You should see all three secrets listed

### 2. Test with a Pull Request

1. Create a new branch
2. Make a small change (e.g., update README)
3. Push and create a pull request
4. Check the "Actions" tab
5. The "Deploy Preview" job should succeed

### 3. Check Workflow Logs

If deployment fails, check the workflow logs:
1. Go to Actions tab
2. Click on the failed workflow run
3. Click on the "Deploy Preview" job
4. Look for error messages

**Common errors**:
- `Error: Input required and not supplied: vercel-token` → VERCEL_TOKEN not set
- `Error: Invalid token` → VERCEL_TOKEN is incorrect or expired
- `Error: Project not found` → VERCEL_PROJECT_ID is incorrect

## Security Best Practices

### ✅ DO:
- Store tokens only in GitHub Secrets (never in code)
- Use descriptive names when creating tokens
- Regularly rotate tokens (every 6-12 months)
- Use the minimum required scope for tokens
- Revoke tokens immediately if compromised

### ❌ DON'T:
- Never commit tokens to git
- Never share tokens in plain text
- Never include tokens in pull request descriptions
- Never log tokens in workflow runs
- Never store tokens in `.env` files that are committed

## Token Rotation

If you need to rotate the VERCEL_TOKEN:

1. **Generate new token** in Vercel dashboard
2. **Update GitHub Secret**:
   - Go to Settings → Secrets → Actions
   - Click "Update" next to VERCEL_TOKEN
   - Paste new token
   - Click "Update secret"
3. **Revoke old token** in Vercel dashboard
4. **Test deployment** with a new pull request

## Troubleshooting

### Error: "Input required and not supplied: vercel-token"

**Cause**: `VERCEL_TOKEN` secret is not configured in GitHub  
**Solution**: Follow the "Adding Secrets to GitHub" section above

### Error: "Invalid token"

**Cause**: Token is expired, revoked, or incorrectly copied  
**Solution**: 
1. Generate a new token in Vercel
2. Update the GitHub secret
3. Retry the workflow

### Error: "Project not found"

**Cause**: `VERCEL_PROJECT_ID` or `VERCEL_ORG_ID` is incorrect  
**Solution**:
1. Run `vercel link` locally
2. Get correct IDs from `.vercel/project.json`
3. Update GitHub secrets

### Workflow doesn't trigger deploy-preview job

**Cause**: The workflow only runs on pull requests to main/master branches  
**Solution**: Create a pull request targeting main or master branch

## Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Deployment with GitHub Actions](https://vercel.com/guides/how-can-i-use-github-actions-with-vercel)
- Project-specific documentation: `VERCEL_TOKEN_SETUP.md`

## Quick Reference

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Link project (generates .vercel/project.json)
vercel link

# Get project details
cat .vercel/project.json

# Deploy manually (for testing)
vercel --token YOUR_TOKEN

# Deploy to production
vercel --prod --token YOUR_TOKEN
```

## Summary Checklist

Before marking this as complete, verify:

- [ ] `VERCEL_TOKEN` is added to GitHub Secrets
- [ ] `VERCEL_ORG_ID` is added to GitHub Secrets
- [ ] `VERCEL_PROJECT_ID` is added to GitHub Secrets
- [ ] Secrets are visible in Settings → Secrets → Actions
- [ ] Test pull request triggers deploy-preview job successfully
- [ ] Deployment succeeds and preview URL is posted as comment
- [ ] No token values are exposed in workflow logs

---

**Last Updated**: November 2024  
**Status**: Ready for implementation  
**Owner**: Repository maintainer must configure these secrets
