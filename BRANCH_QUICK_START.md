# Git Branch Setup - Quick Start

## One-Line Setup

```bash
chmod +x setup-git-branches.sh && ./setup-git-branches.sh
```

## What Gets Created

This script creates **38 branches** organized into this structure:

```
main (production)
├── develop (integration)
│   ├── 30 feature branches
│   ├── 4 release branches
│   └── 1 docs placeholder
└── 1 hotfix placeholder
```

## Example Output

When you run the script, you'll see:

```
========================================================================
  ESTA Tracker - Git Branch Tree Structure Setup
========================================================================

→ === Step 1: Setting up main branch ===
✓ Main branch ready

→ === Step 2: Setting up develop branch ===
✓ Created branch: develop

→ === Step 3: Creating feature branches ===
✓ Created branch: feature/section-1-vision-purpose
✓ Created branch: feature/section-2-user-roles-permissions
✓ Created branch: feature/section-3-core-features
  ✓ Created branch: feature/section-3.1-sick-time-accrual-engine
  ✓ Created branch: feature/section-3.2-pto-request-system
  ... (and 10 more section-3 sub-branches)
...

✓ Branch tree structure setup complete!
```

## Verify the Setup

```bash
# List all branches
git branch -a

# Visualize the tree
git log --graph --oneline --all --decorate
```

## Next Steps

1. **Choose a feature to work on:**
   ```bash
   git checkout feature/section-3.1-sick-time-accrual-engine
   ```

2. **Make your changes:**
   ```bash
   # Edit files, add features
   git add .
   git commit -m "Implement accrual calculation"
   ```

3. **Merge when ready:**
   ```bash
   # Merge to parent branch
   git checkout feature/section-3-core-features
   git merge feature/section-3.1-sick-time-accrual-engine
   
   # Then merge to develop
   git checkout develop
   git merge feature/section-3-core-features
   ```

## Full Documentation

For complete details, see [BRANCH_SETUP_GUIDE.md](./BRANCH_SETUP_GUIDE.md)

## Testing

Run the test suite to validate the script:

```bash
chmod +x test-branch-setup.sh && ./test-branch-setup.sh
```

Expected output:
```
================================
All tests passed! ✓
================================
```
