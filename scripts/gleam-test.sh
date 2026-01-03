#!/usr/bin/env bash
# Wrapper script for gleam test that ignores extra arguments
# This allows CI to pass --coverage and --passWithNoTests flags which gleam doesn't support
#
# Usage: bash scripts/gleam-test.sh <project-directory>
# Example: bash scripts/gleam-test.sh packages/helix
#
# Note: This script has executable permissions set via git attributes

set -e

# Validate that a project directory is provided
if [ -z "$1" ]; then
  echo "Error: Project directory is required"
  echo "Usage: $0 <project-directory>"
  exit 1
fi

PROJECT_DIR="$1"

# Validate that the directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo "Error: Directory '$PROJECT_DIR' does not exist"
  exit 1
fi

# Check if gleam is installed
if ! command -v gleam &> /dev/null; then
  echo "⚠️  Gleam compiler not found - skipping Gleam tests"
  echo "Note: Gleam tests will run in CI where the compiler is installed"
  echo "To run locally, install Gleam: https://gleam.run/getting-started/installing/"
  exit 0
fi

# Change to project directory
cd "$PROJECT_DIR"

# Run gleam test (ignoring any extra arguments passed by nx)
gleam deps download
gleam test
