#!/usr/bin/env bash
# Build WASM module for accrual engine
#
# Prerequisites:
#   - rustup installed (https://rustup.rs/)
#   - Rust stable toolchain: rustup install stable && rustup default stable
#   - wasm32 target: rustup target add wasm32-unknown-unknown
#
# Usage:
#   bash scripts/build-wasm.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Check for rustup
if ! command -v rustup &> /dev/null; then
    echo "[wasm-build] ERROR: rustup not found. Install from https://rustup.rs/"
    exit 1
fi

echo "[wasm-build] building accrual engine to wasm32-unknown-unknown..."
pushd libs/accrual-engine-wasm

# Ensure wasm32 target is installed (only show output if adding new target)
if ! rustup target list --installed | grep -q wasm32-unknown-unknown; then
    echo "[wasm-build] Installing wasm32-unknown-unknown target..."
    rustup target add wasm32-unknown-unknown
fi

cargo build --release --target wasm32-unknown-unknown
WASM_PATH=target/wasm32-unknown-unknown/release/accrual_engine_wasm.wasm
if [ -f "$WASM_PATH" ]; then
  echo "WASM built: $WASM_PATH"
  mkdir -p "$ROOT/dist/wasm"
  cp "$WASM_PATH" "$ROOT/dist/wasm/accrual.wasm"
else
  echo "WASM build failed"
  exit 1
fi
popd
echo "[wasm-build] done."
