# Vercel Token Setup Checklist

Use this checklist to ensure all required secrets are properly configured for GitHub Actions deployments.

## Prerequisites
- [ ] Vercel account created
- [ ] Vercel CLI installed (`npm i -g vercel`)
- [ ] Access to repository settings

## Step 1: Generate Vercel Token
- [ ] Go to https://vercel.com/account/tokens
- [ ] Click "Create Token"
- [ ] Name it "ESTA Tracker GitHub Actions"
- [ ] Copy the token immediately (can't view it again)
- [ ] Save token securely

**Token from VERCEL_TOKEN_SETUP.md**: `cCWR9S3mirDVwI315SjRzTep`

## Step 2: Get Organization and Project IDs
- [ ] Open terminal in project directory
- [ ] Run `vercel login` (if not already logged in)
- [ ] Run `vercel link`
- [ ] Select your organization
- [ ] Select or create project
- [ ] Run `cat .vercel/project.json`
- [ ] Copy `orgId` value
- [ ] Copy `projectId` value

## Step 3: Add Secrets to GitHub
- [ ] Go to https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions
- [ ] Add `VERCEL_TOKEN` secret with your token
- [ ] Add `VERCEL_ORG_ID` secret with your org ID
- [ ] Add `VERCEL_PROJECT_ID` secret with your project ID
- [ ] Verify all three secrets are listed

## Step 4: Verify Setup
- [ ] Create a test branch: `git checkout -b test-vercel-setup`
- [ ] Make a small change (e.g., add comment to README)
- [ ] Commit and push: `git push -u origin test-vercel-setup`
- [ ] Create pull request
- [ ] Check Actions tab - "Deploy Preview" job should succeed
- [ ] Verify deployment comment is posted on PR
- [ ] Delete test branch after verification

## Step 5: Local Validation (Optional)
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add secrets to `.env.local`:
  ```
  VERCEL_TOKEN=your-token-here
  VERCEL_ORG_ID=your-org-id-here
  VERCEL_PROJECT_ID=your-project-id-here
  ```
- [ ] Run `./scripts/validate-secrets.sh`
- [ ] Verify all checks pass
- [ ] Test local deployment: `vercel`

## Troubleshooting

### ❌ Error: "Input required and not supplied: vercel-token"
- Secret name must be exactly `VERCEL_TOKEN` (case-sensitive)
- Secret must be added to repository settings, not environment
- Check: Settings → Secrets and variables → Actions (not Environments)

### ❌ Error: "Invalid token"
- Token may be expired or revoked
- Generate a new token and update the secret
- Ensure no extra spaces when copying token

### ❌ Error: "Project not found"
- Verify `VERCEL_PROJECT_ID` matches `.vercel/project.json`
- Run `vercel link` again to refresh IDs
- Update GitHub secrets with correct IDs

### ❌ Workflow doesn't run deploy-preview job
- Deploy preview only runs on pull requests
- Target branch must be `main` or `master`
- Create a PR instead of pushing directly

## Security Checklist
- [ ] Secrets are stored in GitHub Secrets (not in code)
- [ ] `.env.local` is in `.gitignore`
- [ ] No secrets committed to repository
- [ ] Token has appropriate scope (not too broad)
- [ ] Team members instructed not to share secrets publicly

## Success Criteria

✅ All three secrets are visible in GitHub repository settings  
✅ Pull request triggers deploy-preview job  
✅ Deploy-preview job completes successfully  
✅ Vercel deployment URL is posted as PR comment  
✅ Local validation script passes (optional)  
✅ No secrets are committed to git  

## Documentation References

- **Quick Fix**: [FIX_VERCEL_TOKEN_ERROR.md](./FIX_VERCEL_TOKEN_ERROR.md)
- **Complete Guide**: [GITHUB_SECRETS_SETUP.md](./GITHUB_SECRETS_SETUP.md)
- **Deployment Info**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Testing Info**: [TESTING.md](./TESTING.md)
- **Original Token Doc**: [VERCEL_TOKEN_SETUP.md](./VERCEL_TOKEN_SETUP.md)

---

**Last Updated**: November 2024  
**Status**: Ready for implementation  
**Estimated Time**: 10-15 minutes
