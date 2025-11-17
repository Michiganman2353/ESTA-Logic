# Branch Protection Guidelines

This document outlines the recommended branch protection rules for the ESTA Tracker repository to maintain code quality and prevent accidental changes to critical branches.

## Overview

Branch protection rules help enforce workflows and prevent force pushes, accidental deletions, and unauthorized changes to important branches.

## Recommended Protection Rules

### Main Branch (`main`)

The `main` branch should have the strictest protection as it represents production-ready code.

**Protection Settings:**

- ✅ **Require pull request reviews before merging**
  - Required approving reviews: `1` (recommended: `2` for production)
  - Dismiss stale pull request approvals when new commits are pushed: `enabled`
  - Require review from Code Owners: `enabled` (if CODEOWNERS file exists)

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging: `enabled`
  - Status checks that are required:
    - `ci` (Continuous Integration)
    - `validate-branch` (Branch validation)
    - Any other CI/CD checks

- ✅ **Require conversation resolution before merging**
  - All review comments must be resolved: `enabled`

- ✅ **Require signed commits** (optional but recommended)
  - Commits must be signed with GPG: `enabled`

- ✅ **Include administrators**
  - Enforce all configured restrictions for administrators: `enabled`

- ✅ **Restrict who can push to matching branches**
  - Only allow specific people/teams to push: `enabled`
  - Add specific users or teams who can merge to main

- ✅ **Allow force pushes**
  - Never allow force pushes: `disabled`

- ✅ **Allow deletions**
  - Never allow branch deletion: `disabled`

### Develop Branch (`develop`)

The `develop` branch should have moderate protection to allow flexibility while maintaining quality.

**Protection Settings:**

- ✅ **Require pull request reviews before merging**
  - Required approving reviews: `1`
  - Dismiss stale pull request approvals when new commits are pushed: `enabled`

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging: `enabled`
  - Status checks that are required:
    - `ci` (Continuous Integration)
    - `validate-branch` (Branch validation)

- ✅ **Require conversation resolution before merging**
  - All review comments must be resolved: `enabled`

- ⚠️ **Include administrators**
  - Enforce all configured restrictions for administrators: `optional`
  - Allow admins to bypass for emergency fixes

- ⚠️ **Allow force pushes**
  - Allow force pushes by administrators only: `enabled for admins only`
  - Use with extreme caution for history cleanup

- ✅ **Allow deletions**
  - Never allow branch deletion: `disabled`

### Feature Branches

Feature branches can have lighter protection but should still maintain quality standards.

#### `feature/section-1-vision-purpose`

**Protection Settings:**

- ✅ **Require pull request reviews before merging**
  - Required approving reviews: `1`

- ✅ **Require status checks to pass before merging**
  - Status checks that are required:
    - `ci` (Continuous Integration)

- ⚠️ **Allow force pushes**
  - Allow force pushes by contributors: `enabled`
  - For rebasing and history cleanup during development

- ⚠️ **Allow deletions**
  - Allow branch deletion after merge: `enabled`

#### `feature/section-3-core-features`

**Protection Settings:**

- ✅ **Require pull request reviews before merging**
  - Required approving reviews: `1`

- ✅ **Require status checks to pass before merging**
  - Status checks that are required:
    - `ci` (Continuous Integration)

- ⚠️ **Allow force pushes**
  - Allow force pushes by contributors: `enabled`
  - For rebasing and history cleanup during development

- ⚠️ **Allow deletions**
  - Allow branch deletion after merge: `enabled`

## Setting Up Branch Protection

### Via GitHub Web Interface

1. Navigate to your repository on GitHub
2. Click **Settings** → **Branches** (in the left sidebar)
3. Under "Branch protection rules", click **Add rule**
4. Enter the branch name pattern (e.g., `main`, `develop`, `feature/*`)
5. Configure the protection settings as outlined above
6. Click **Create** or **Save changes**

### Via GitHub CLI

You can also set up branch protection using the GitHub CLI:

```bash
# Install GitHub CLI if not already installed
# https://cli.github.com/

# Protect main branch
gh api repos/Michiganman2353/esta-tracker-clean/branches/main/protection \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci", "validate-branch"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF

# Protect develop branch
gh api repos/Michiganman2353/esta-tracker-clean/branches/develop/protection \
  --method PUT \
  --input - <<EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci", "validate-branch"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "dismissal_restrictions": {},
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false,
    "required_approving_review_count": 1
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

### Using a Script

For convenience, you can use the provided script to set up branch protection:

```bash
# This script would need to be created by repository admins
./scripts/setup-branch-protection.sh
```

## Rulesets (Alternative Approach)

GitHub also supports **Repository Rulesets**, which are a more flexible way to manage branch protection. Rulesets can target multiple branches with patterns and offer additional controls.

### Advantages of Rulesets:
- Apply rules to multiple branches at once
- More granular control over permissions
- Easier to manage as the repository grows
- Support for tag protection

### Creating a Ruleset:

1. Go to **Settings** → **Rules** → **Rulesets**
2. Click **New ruleset**
3. Configure:
   - Name: "Main and Develop Protection"
   - Target branches: `main`, `develop`
   - Rules: As outlined above

## CODEOWNERS File

To automatically request reviews from specific team members, create a `.github/CODEOWNERS` file:

```
# CODEOWNERS file for ESTA Tracker

# Global owners (apply to all files unless overridden)
* @Michiganman2353

# Documentation
/docs/** @Michiganman2353
/README.md @Michiganman2353

# Core features (Section 3)
/packages/backend/src/features/** @Michiganman2353
/packages/frontend/src/features/** @Michiganman2353

# Scripts and automation
/scripts/** @Michiganman2353
/.github/workflows/** @Michiganman2353

# Configuration files
package.json @Michiganman2353
tsconfig*.json @Michiganman2353
firebase.json @Michiganman2353
```

## Monitoring and Auditing

### View Protection Status

Check which branches are protected:

```bash
# Using GitHub CLI
gh api repos/Michiganman2353/esta-tracker-clean/branches --jq '.[] | select(.protected == true) | {name: .name, protected: .protected}'
```

### Audit Log

Repository administrators can view the audit log to track:
- Changes to branch protection rules
- Force pushes (if allowed)
- Branch deletions
- Review bypasses

Access via: **Settings** → **Security** → **Audit log**

## Best Practices

1. **Start Strict, Relax as Needed**
   - Begin with strict protection and relax rules only when necessary
   - Document any exceptions and the reasoning

2. **Regular Reviews**
   - Periodically review branch protection settings
   - Update as team size and workflow evolve

3. **Clear Communication**
   - Ensure all team members understand the protection rules
   - Document any special procedures for emergency fixes

4. **CI/CD Integration**
   - Ensure all required status checks are reliable
   - Fix flaky tests that might block legitimate merges

5. **Emergency Procedures**
   - Document the process for emergency hotfixes
   - Define who can bypass protection in critical situations

## Troubleshooting

### Cannot Merge PR Due to Protection Rules

1. Ensure all required status checks are passing
2. Verify you have the required number of approvals
3. Check that all conversations are resolved
4. Ensure the branch is up to date with the base branch

### Need to Force Push

1. Check if you're pushing to a protected branch
2. If necessary, request temporary permission from an admin
3. Consider rebasing on a feature branch instead
4. Document the reason for the force push

### Status Check Won't Pass

1. Review the check logs to identify the issue
2. Fix the underlying problem in your code
3. If the check is flaky, consider temporarily removing it from required checks
4. Report persistent issues with CI/CD infrastructure

## Related Documentation

- [BRANCHING_STRATEGY.md](BRANCHING_STRATEGY.md) - Complete branching strategy
- [GitHub Docs: Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Docs: Rulesets](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)

---

**Last Updated:** 2025-11-17  
**Version:** 1.0.0  
**Maintainer:** ESTA Tracker Development Team
