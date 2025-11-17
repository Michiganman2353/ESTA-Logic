#!/bin/bash

###############################################################################
# ESTA Tracker - Branch Setup Automation Script
###############################################################################
# This script automates the creation of the Git branch hierarchy for the
# ESTA Tracker project according to the defined branching strategy.
#
# Branch Structure:
#   main (base production branch)
#   ├── develop (integration branch)
#       ├── feature/section-1-vision-purpose (vision documents and goals)
#       └── feature/section-3-core-features (core feature development)
#
# Usage:
#   chmod +x scripts/setup-branches.sh
#   ./scripts/setup-branches.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if a branch exists locally
branch_exists_local() {
    git rev-parse --verify "$1" >/dev/null 2>&1
}

# Function to check if a branch exists on remote
branch_exists_remote() {
    git ls-remote --heads origin "$1" | grep -q "$1"
}

# Function to create a branch if it doesn't exist
create_branch() {
    local branch_name=$1
    local base_branch=$2
    
    print_info "Processing branch: $branch_name (base: $base_branch)"
    
    # Check if branch exists locally
    if branch_exists_local "$branch_name"; then
        print_warning "Branch '$branch_name' already exists locally"
        return 0
    fi
    
    # Check if branch exists on remote
    if branch_exists_remote "$branch_name"; then
        print_warning "Branch '$branch_name' already exists on remote, checking out..."
        git fetch origin "$branch_name:$branch_name" 2>/dev/null || git checkout -b "$branch_name" "origin/$branch_name"
        print_success "Checked out existing branch '$branch_name'"
        return 0
    fi
    
    # Ensure we have the base branch
    if ! branch_exists_local "$base_branch"; then
        if branch_exists_remote "$base_branch"; then
            print_info "Fetching base branch '$base_branch' from remote..."
            git fetch origin "$base_branch:$base_branch"
        else
            print_error "Base branch '$base_branch' does not exist locally or remotely"
            return 1
        fi
    fi
    
    # Create the new branch
    print_info "Creating branch '$branch_name' from '$base_branch'..."
    git checkout -b "$branch_name" "$base_branch"
    print_success "Created branch '$branch_name'"
}

# Function to push branch to remote
push_branch() {
    local branch_name=$1
    
    print_info "Pushing branch '$branch_name' to remote..."
    
    # Check if branch exists on remote
    if branch_exists_remote "$branch_name"; then
        print_warning "Branch '$branch_name' already exists on remote"
    else
        git push -u origin "$branch_name"
        print_success "Pushed branch '$branch_name' to remote"
    fi
}

###############################################################################
# Main Script Execution
###############################################################################

print_info "Starting ESTA Tracker branch setup automation..."
echo ""

# Store the current branch to return to it later
ORIGINAL_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_info "Current branch: $ORIGINAL_BRANCH"
echo ""

# Fetch latest from remote
print_info "Fetching latest changes from remote..."
git fetch origin
echo ""

# 1. Setup main branch
print_info "=== Setting up 'main' branch ==="
if branch_exists_local "main"; then
    print_success "'main' branch already exists locally"
elif branch_exists_remote "main"; then
    print_info "Fetching 'main' branch from remote..."
    git fetch origin main:main
    print_success "Fetched 'main' branch from remote"
else
    # If main doesn't exist anywhere, create it from current branch
    print_warning "'main' branch does not exist, creating from current branch..."
    CURRENT_COMMIT=$(git rev-parse HEAD)
    git checkout -b main "$CURRENT_COMMIT"
    push_branch "main"
    print_success "Created and pushed 'main' branch"
fi
echo ""

# 2. Setup develop branch
print_info "=== Setting up 'develop' branch ==="
create_branch "develop" "main"
push_branch "develop"
echo ""

# 3. Setup feature branches
print_info "=== Setting up feature branches ==="

# Feature branch for Section 1: Vision & Purpose
print_info "--- Feature: Section 1 - Vision & Purpose ---"
create_branch "feature/section-1-vision-purpose" "develop"
push_branch "feature/section-1-vision-purpose"
echo ""

# Feature branch for Section 3: Core Features
print_info "--- Feature: Section 3 - Core Features ---"
create_branch "feature/section-3-core-features" "develop"
push_branch "feature/section-3-core-features"
echo ""

# Return to original branch
print_info "Returning to original branch: $ORIGINAL_BRANCH"
git checkout "$ORIGINAL_BRANCH"
echo ""

# Display branch hierarchy
print_success "Branch setup complete! Current branch structure:"
echo ""
git --no-pager branch -a | grep -E '(main|develop|feature/)' | sort
echo ""

print_info "Branch hierarchy visualization:"
cat << 'EOF'

main (production)
 └── develop (integration)
      ├── feature/section-1-vision-purpose (vision documents & goals)
      └── feature/section-3-core-features (core feature development)

EOF

print_success "All branches have been set up successfully!"
print_info "You can now switch to any branch using: git checkout <branch-name>"
