#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "[wasm-build] building accrual engine to wasm32-unknown-unknown..."
pushd libs/accrual-engine-wasm
# ensure target exists
rustup target add wasm32-unknown-unknown || true
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
