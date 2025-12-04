{
  description = "ESTA Rainforest — The Living Compliance Ecosystem";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = import nixpkgs {
          inherit system;
          overlays = [ rust-overlay.overlays.default ];
        };

        # Rust toolchain with WASM targets for microkernel builds
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" "clippy" "rustfmt" ];
          targets = [
            "wasm32-unknown-unknown"
            "wasm32-wasi"
          ];
        };
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Node.js ecosystem
            nodejs_20
            pnpm
            nodePackages.npm

            # Rust toolchain with WASM support
            rustToolchain
            cargo

            # WASM build utilities
            wasm-pack
            binaryen  # Provides wasm-opt
            wasmtime

            # Gleam for Helix package
            gleam
            erlang

            # Tauri desktop development
            cargo-tauri
            trunk

            # Build utilities
            pkg-config
            openssl

            # Optional AI tooling
            ollama
          ];

          nativeBuildInputs = with pkgs; [
            pkg-config
          ] ++ lib.optionals stdenv.isLinux [
            lld
            clang
          ];

          shellHook = ''
            export PATH="$PATH:$HOME/.cargo/bin"
            export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER="lld"
            echo "╔════════════════════════════════════════════════════════════╗"
            echo "║  ESTA Rainforest — The Living Compliance Ecosystem         ║"
            echo "╚════════════════════════════════════════════════════════════╝"
            echo ""
            echo "Available tools:"
            echo "  • Rust with WASM targets (wasm32-unknown-unknown, wasm32-wasi)"
            echo "  • wasm-pack, wasm-opt (binaryen), wasmtime"
            echo "  • Node.js 20, pnpm, npm"
            echo "  • Gleam, Erlang"
            echo "  • Tauri (cargo-tauri, trunk)"
            echo ""
            echo "Quick commands:"
            echo "  pnpm tauri dev     - Start Tauri development"
            echo "  ./nix-repro/build.sh - Build WASM modules"
            echo ""
          '';

          # Required for some Rust crates that use cc
          LIBCLANG_PATH = "${pkgs.llvmPackages.libclang.lib}/lib";
        };

        # CI-specific shell with minimal tooling
        devShells.ci = pkgs.mkShell {
          buildInputs = with pkgs; [
            rustToolchain
            cargo
            wasm-pack
            binaryen
            wasmtime
            nodejs_20
            nodePackages.npm
            gleam
            erlang
            pkg-config
            openssl
          ];

          shellHook = ''
            export PATH="$PATH:$HOME/.cargo/bin"
            echo "[ESTA-Logic] CI environment ready"
          '';
        };
      });
}
