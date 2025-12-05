#!/usr/bin/env bash
# Build Gleam microkernel to JavaScript/WASM output
#
# Prerequisites:
#   - Gleam installed (https://gleam.run/getting-started/installing/)
#   - Erlang/OTP installed for Gleam compilation
#
# Usage:
#   bash scripts/build-gleam-wasm.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Check for gleam
if ! command -v gleam &> /dev/null; then
    echo "[gleam-build] ERROR: gleam not found. Install from https://gleam.run/getting-started/installing/"
    exit 1
fi

echo "[gleam-build] Building Gleam microkernel to JavaScript target..."

# Build gleam-core
pushd logic/gleam-core > /dev/null

# Download dependencies
echo "[gleam-build] Downloading dependencies..."
gleam deps download

# Build to JavaScript target
echo "[gleam-build] Compiling to JavaScript..."
gleam build --target=javascript

# Check if build output exists
BUILD_OUTPUT="build/dev/javascript/esta_logic_core"
if [ -d "$BUILD_OUTPUT" ]; then
    echo "[gleam-build] Build output available at: $BUILD_OUTPUT"
    
    # Create wasm_build directory and copy output
    mkdir -p "$ROOT/logic/wasm_build"
    
    # Copy the compiled JavaScript modules
    cp -r "$BUILD_OUTPUT"/* "$ROOT/logic/wasm_build/"
    
    # Create a simple module entry point
    cat > "$ROOT/logic/wasm_build/index.mjs" << 'EOF'
// ESTA-Logic Gleam Microkernel - JavaScript Entry Point
// This module provides the compiled Gleam kernel functions

import * as kernel from './kernel.mjs';

// Named exports for direct usage
export const version = kernel.version;
export const compute_accrual = kernel.compute_accrual;
export const employer_cap = kernel.employer_cap;
export const calculate_with_cap = kernel.calculate_with_cap;

// Default export as object for compatibility
export default {
  version: kernel.version,
  compute_accrual: kernel.compute_accrual,
  employer_cap: kernel.employer_cap,
  calculate_with_cap: kernel.calculate_with_cap,
};
EOF
    
    echo "[gleam-build] Module entry point created at: $ROOT/logic/wasm_build/index.mjs"
else
    echo "[gleam-build] ERROR: Build output not found at $BUILD_OUTPUT"
    exit 1
fi

popd > /dev/null
echo "[gleam-build] ✅ Gleam microkernel build complete."
