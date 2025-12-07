#!/usr/bin/env bash
# Wrapper script for gleam test that ignores extra arguments
# This allows CI to pass --coverage and --passWithNoTests flags which gleam doesn't support

set -e

# Get the project directory from first argument
PROJECT_DIR="${1:-.}"

# Change to project directory
cd "$PROJECT_DIR"

# Run gleam test (ignoring any extra arguments passed by nx)
gleam deps download
gleam test
