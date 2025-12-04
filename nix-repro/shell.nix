# ESTA-Logic Reproducible WASM Build Environment
# Legacy shell.nix for non-flake Nix users
#
# Usage:
#   nix-shell shell.nix
#
# Or with pure mode:
#   nix-shell shell.nix --pure
#
{ pkgs ? import <nixpkgs> {} }:

let
  # Use Mozilla's Rust overlay for better WASM support
  rustOverlay = import (builtins.fetchTarball {
    url = "https://github.com/oxalica/rust-overlay/archive/master.tar.gz";
  });
  
  pkgsWithRust = import <nixpkgs> {
    overlays = [ rustOverlay ];
  };

  # Rust toolchain with WASM targets
  rustToolchain = pkgsWithRust.rust-bin.stable.latest.default.override {
    extensions = [ "rust-src" "rust-analyzer" "clippy" "rustfmt" ];
    targets = [
      "wasm32-unknown-unknown"
      "wasm32-wasi"
    ];
  };

in pkgsWithRust.mkShell {
  buildInputs = with pkgsWithRust; [
    # Rust toolchain with WASM targets
    rustToolchain
    cargo
    
    # WASM utilities
    wasm-pack
    binaryen  # Provides wasm-opt
    wasmtime
    
    # Node.js ecosystem
    nodejs_20
    nodePackages.npm
    
    # Gleam for helix package
    gleam
    erlang
    
    # Build utilities
    pkg-config
    openssl
    
    # Development utilities
    jq
    git
    cacert
  ];

  nativeBuildInputs = with pkgsWithRust; [
    pkg-config
  ] ++ lib.optionals stdenv.isLinux [
    lld
    clang
  ];

  shellHook = ''
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║  ESTA-Logic Reproducible WASM Build Environment (Legacy)   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Tools available:"
    echo "  • Rust: $(rustc --version)"
    echo "  • Cargo: $(cargo --version)"
    echo "  • WASM targets: wasm32-unknown-unknown, wasm32-wasi"
    echo "  • wasm-opt: $(wasm-opt --version)"
    echo "  • Node.js: $(node --version)"
    echo "  • Gleam: $(gleam --version)"
    echo ""
    echo "Run './build.sh' to reproduce CI build steps"
    echo ""
    
    # Ensure cargo bin is in PATH
    export PATH="$HOME/.cargo/bin:$PATH"
    
    # Set WASM-specific environment variables  
    export CARGO_TARGET_WASM32_UNKNOWN_UNKNOWN_LINKER="lld"
    
    # SSL certificates for cargo
    export SSL_CERT_FILE="${pkgsWithRust.cacert}/etc/ssl/certs/ca-bundle.crt"
  '';

  # Required for some Rust crates that use cc
  LIBCLANG_PATH = "${pkgsWithRust.llvmPackages.libclang.lib}/lib";
}
