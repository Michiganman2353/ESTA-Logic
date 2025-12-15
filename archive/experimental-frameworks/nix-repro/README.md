# ESTA-Logic Reproducible Nix Build Environment

This directory contains a fully reproducible Nix build environment for the ESTA-Logic WASM microkernel. It provides deterministic builds across developer machines and CI environments.

## Why Nix?

ESTA-Logic is a WASM-native microkernel running a multi-language, multi-toolchain ecosystem:

- **Rust → WASM**: Accrual engine, kernel core
- **Gleam → JavaScript**: Helix functional core
- **Node/TypeScript**: Orchestrators, API layer
- **Tauri**: Desktop host for WASM modules

The traditional CI approach of installing tools ad-hoc leads to:

- Toolchain version drift between developers and CI
- Missing WASM targets (`wasm32-unknown-unknown`, `wasm32-wasi`)
- Linker issues (`rust-lld` not found)
- Missing WASM optimization tools (`wasm-opt`)
- Inconsistent Gleam/Erlang versions

Nix solves all of these by providing a hermetic, reproducible environment.

## Quick Start

### Using Nix Flakes (Recommended)

```bash
# Enter the development shell
nix develop ./nix-repro

# Run the build reproducer
./build.sh
```

### Using Legacy shell.nix

```bash
# Enter the development shell
nix-shell ./nix-repro/shell.nix

# Run the build reproducer
./build.sh
```

## Files

| File        | Description                                     |
| ----------- | ----------------------------------------------- |
| `flake.nix` | Nix flake with reproducible build environment   |
| `shell.nix` | Legacy non-flake support for older Nix versions |
| `build.sh`  | Script that reproduces CI build steps locally   |

## What's Included

The Nix environment provides:

### Rust Toolchain

- Latest stable Rust compiler
- Cargo package manager
- WASM targets: `wasm32-unknown-unknown`, `wasm32-wasi`
- rust-analyzer, clippy, rustfmt

### WASM Tools

- `wasm-pack` - Rust to WASM compilation helper
- `binaryen` - WASM optimization suite (`wasm-opt`)
- `wasmtime` - WASM runtime for testing

### Node.js Ecosystem

- Node.js 20.x
- npm package manager

### Gleam/Erlang

- Gleam compiler
- Erlang/OTP runtime

### Build Utilities

- `pkg-config`, `openssl` - Native dependency support
- `lld`, `clang` - Alternative linkers for WASM
- `jq`, `git` - General utilities

## Build Script Options

```bash
# Full build with optimization and signing
./build.sh

# Skip wasm-opt optimization
./build.sh --skip-optimize

# Skip manifest signing
./build.sh --skip-sign

# Verbose output
./build.sh --verbose
```

## Environment Variables

| Variable             | Description                                   |
| -------------------- | --------------------------------------------- |
| `KERNEL_PRIVATE_KEY` | Ed25519 private key for WASM module signing   |
| `KERNEL_PUBLIC_KEY`  | Ed25519 public key for signature verification |
| `BUILD_MODE`         | `release` or `debug` (default: `release`)     |

## CI Integration

The GitHub Actions workflow `.github/workflows/nix-repro.yml` uses this environment:

```yaml
- uses: cachix/install-nix-action@v22
  with:
    nix_path: nixpkgs=channel:nixos-24.05
    extra_nix_config: |
      experimental-features = nix-command flakes

- name: Build in Nix environment
  run: |
    nix develop ./nix-repro --command bash -c "./nix-repro/build.sh"
```

## Troubleshooting

### "flakes are not enabled"

Add to `~/.config/nix/nix.conf`:

```
experimental-features = nix-command flakes
```

### "rust-lld not found"

The Nix environment includes `lld` from LLVM. If you see linker errors, ensure you're inside the Nix shell:

```bash
nix develop ./nix-repro
```

### "wasm32-unknown-unknown target not installed"

The Nix-provided Rust toolchain includes WASM targets. If using system Rust instead:

```bash
rustup target add wasm32-unknown-unknown
```

### Gleam build fails

Ensure you're in the Nix shell and have network access for dependency download:

```bash
cd packages/helix
gleam deps download
gleam build
```

## Architecture Notes

This reproducible build environment supports the ESTA-Logic microkernel architecture:

1. **WASM Modules** - Compiled from Rust, signed, capability-controlled
2. **Helix Core** - Gleam functional engine, compiles to JavaScript
3. **TypeScript Orchestrators** - Load, verify, and execute WASM modules
4. **Tauri Host** - Desktop runtime for WASM execution

Each component builds deterministically with pinned dependencies.

## Contributing

When adding new build dependencies:

1. Update `flake.nix` with the new package
2. Update `shell.nix` for legacy support
3. Test with `nix flake check ./nix-repro`
4. Update this README if needed
