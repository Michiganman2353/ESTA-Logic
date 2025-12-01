# Security: OIDC Integration Guide

## Overview

This guide explains how to set up OpenID Connect (OIDC) authentication between GitHub Actions and Vercel for secure, token-free deployments.

## Why OIDC?

Traditional deployment workflows require storing long-lived API tokens as GitHub Secrets. OIDC provides:

- **No stored credentials**: Tokens are generated just-in-time
- **Short-lived tokens**: Automatically expire after use
- **Audit trail**: Clear provenance of deployment actions
- **Key rotation**: No manual rotation required

## Current Status

As of 2025, Vercel's native OIDC support for GitHub Actions is in development. This document provides:

1. **Immediate**: Best practices for secure token management
2. **Future**: OIDC setup when native support is available

## Immediate: Secure Token Management

### 1. Token Rotation Policy

Implement a quarterly rotation schedule for all deployment tokens:

```yaml
# .github/workflows/rotate-secrets.yml (manual trigger)
name: Quarterly Secret Rotation Reminder

on:
  schedule:
    # First day of each quarter at 9 AM UTC
    - cron: '0 9 1 1,4,7,10 *'

jobs:
  remind:
    runs-on: ubuntu-latest
    steps:
      - name: Create rotation reminder issue
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔐 Quarterly Secret Rotation Due',
              body: `## Secret Rotation Checklist
              
              It's time for quarterly secret rotation. Please update:
              
              - [ ] VERCEL_TOKEN
              - [ ] TENANT_SIGNING_SECRET
              - [ ] Any other deployment credentials
              
              ### Steps:
              1. Generate new tokens in respective dashboards
              2. Update GitHub Secrets
              3. Verify deployment still works
              4. Revoke old tokens
              
              **Deadline**: Within 7 days`,
              labels: ['security', 'maintenance']
            });
```

### 2. Minimal Token Scopes

When creating Vercel tokens:

1. Go to **Vercel Dashboard** → **Settings** → **Tokens**
2. Create a new token with:
   - **Scope**: Team (if applicable)
   - **Expiration**: 90 days (aligns with rotation)
   - **Name**: `github-actions-deploy-YYYY-QN`

### 3. Secure Token Handling in Workflows

```yaml
# Example secure deployment step
- name: Deploy to Vercel
  env:
    # Token is never echoed or logged
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
  run: |
    # Mask the token
    echo "::add-mask::$VERCEL_TOKEN"

    # Deploy
    vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN"
```

## Future: Native OIDC Setup

When Vercel supports GitHub OIDC natively, update workflows as follows:

### 1. Configure GitHub OIDC Provider

```yaml
# .github/workflows/deploy.yml
permissions:
  id-token: write # Required for OIDC
  contents: read

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Get OIDC Token
        id: oidc
        uses: actions/github-script@v7
        with:
          script: |
            const token = await core.getIDToken('vercel.com');
            core.setOutput('token', token);
            core.setSecret(token);

      - name: Deploy with OIDC
        env:
          VERCEL_OIDC_TOKEN: ${{ steps.oidc.outputs.token }}
        run: |
          vercel deploy --prebuilt --prod --oidc-token="$VERCEL_OIDC_TOKEN"
```

### 2. Configure Vercel Trust Policy

In Vercel Dashboard, configure trusted GitHub repositories:

```json
{
  "oidc": {
    "github": {
      "trustedRepositories": ["Michiganman2353/ESTA-Logic"],
      "allowedBranches": ["main", "master"],
      "allowedActions": ["deploy", "preview"]
    }
  }
}
```

## Secret Inventory

| Secret Name           | Purpose                | Rotation    | Storage                     |
| --------------------- | ---------------------- | ----------- | --------------------------- |
| VERCEL_TOKEN          | Deployment auth        | Quarterly   | GitHub Secrets              |
| VERCEL_ORG_ID         | Org identification     | Static      | GitHub Secrets              |
| VERCEL_PROJECT_ID     | Project identification | Static      | GitHub Secrets              |
| TENANT_SIGNING_SECRET | Tenant ID signing      | Quarterly   | GitHub Secrets + Vercel Env |
| VITE*FIREBASE*\*      | Firebase config        | Per-project | GitHub Secrets + Vercel Env |

## Monitoring

### Deployment Audit Logging

All deployments should be logged:

```typescript
// api/lib/auditLogger.ts
export async function logDeployment(deploymentId: string, actor: string) {
  await db.collection('deploymentAudit').add({
    deploymentId,
    actor,
    timestamp: FieldValue.serverTimestamp(),
    source: 'github-actions',
  });
}
```

### Alert on Suspicious Activity

Configure Vercel to alert on:

- Deployments from unexpected branches
- Multiple failed deployments
- Deployments outside business hours

## References

- [GitHub OIDC Documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [ESTA Tracker Security Policy](../SECURITY.md)
