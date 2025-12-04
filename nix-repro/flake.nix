{
  description = "ESTA-Logic Reproducible WASM Build Environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, flake-utils, rust-overlay }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        overlays = [ rust-overlay.overlays.default ];
        pkgs = import nixpkgs {
          inherit system overlays;
        };

        # Define a complete Rust toolchain with WASM targets
        rustToolchain = pkgs.rust-bin.stable.latest.default.override {
          extensions = [ "rust-src" "rust-analyzer" "clippy" "rustfmt" ];
          targets = [
            "wasm32-unknown-unknown"
            "wasm32-wasi"
          ];
        };

        # Common build inputs for WASM development
        buildInputs = with pkgs; [
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
        ];

        # Native build inputs (Linux-specific)
        nativeBuildInputs = with pkgs; [
          pkg-config
        ] ++ pkgs.lib.optionals pkgs.stdenv.isLinux [
          # Linux-specific linker support
          lld
          clang
        ];

      in {
        # Development shell for interactive development
        devShells.default = pkgs.mkShell {
          inherit buildInputs nativeBuildInputs;

          shellHook = ''
            echo "╔════════════════════════════════════════════════════════════╗"
            echo "║  ESTA-Logic Reproducible WASM Build Environment            ║"
            echo "╚════════════════════════════════════════════════════════════╝"
            echo ""
            echo "Tools available:"
            echo "  • Rust: $(rustc --version)"
            echo "  • Cargo: $(cargo --version)"
            echo "  • WASM targets: wasm32-unknown-unknown, wasm32-wasi"
            echo "  • wasm-pack: $(wasm-pack --version 2>/dev/null || echo 'installed')"
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
          '';

          # Required for some Rust crates that use cc
          LIBCLANG_PATH = "${pkgs.llvmPackages.libclang.lib}/lib";
        };

        # CI-specific shell with minimal tooling
        devShells.ci = pkgs.mkShell {
          inherit buildInputs nativeBuildInputs;

          shellHook = ''
            echo "[nix-repro] CI environment ready"
            export PATH="$HOME/.cargo/bin:$PATH"
          '';
        };

        # Note: The packages below are provided as examples for future use.
        # They require Cargo.lock files to be committed to the repository.
        # Currently, we use the build.sh script for WASM builds in CI.
        # 
        # To enable these packages:
        # 1. Remove Cargo.lock from .gitignore
        # 2. Commit the Cargo.lock files
        # 3. Uncomment the packages below

        # packages.accrual-wasm = pkgs.rustPlatform.buildRustPackage {
        #   pname = "accrual-engine-wasm";
        #   version = "0.1.0";
        #   src = ../libs/accrual-engine-wasm;
        #   cargoLock.lockFile = ../libs/accrual-engine-wasm/Cargo.lock;
        #   nativeBuildInputs = [ pkgs.wasm-pack pkgs.binaryen ];
        #   buildPhase = ''
        #     cargo build --release --target wasm32-unknown-unknown
        #   '';
        #   installPhase = ''
        #     mkdir -p $out/lib
        #     cp target/wasm32-unknown-unknown/release/*.wasm $out/lib/ || true
        #   '';
        #   doCheck = false;
        # };
      }
    );
}
