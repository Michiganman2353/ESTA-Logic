# ESTA Tracker Scripts

This directory contains automation scripts for the ESTA Tracker project.

## Available Scripts

### `setup-branches.sh`

**Purpose:** Automates the creation of the Git branch hierarchy for the ESTA Tracker project.

**What it does:**
- Creates the `main` branch (if it doesn't exist)
- Creates the `develop` branch from `main`
- Creates feature branches:
  - `feature/section-1-vision-purpose` - For vision documents and goals
  - `feature/section-3-core-features` - For core feature development
- Pushes all branches to the remote repository
- Returns you to your original branch after setup

**Usage:**
```bash
# Make the script executable (first time only)
chmod +x scripts/setup-branches.sh

# Run the script
./scripts/setup-branches.sh
```

**Features:**
- ✅ Safe to run multiple times (idempotent)
- ✅ Checks for existing branches before creating
- ✅ Provides colored output for easy tracking
- ✅ Handles errors gracefully
- ✅ Displays branch hierarchy after completion

**Requirements:**
- Git installed and configured
- Repository cloned locally
- Access to push to the remote repository

## Documentation

For more information about the branching strategy, see:
- [BRANCHING_STRATEGY.md](../docs/BRANCHING_STRATEGY.md)

## Contributing

When adding new scripts to this directory:
1. Make scripts executable: `chmod +x scripts/your-script.sh`
2. Add proper documentation headers in the script
3. Update this README with script description
4. Follow the existing script structure and error handling patterns
