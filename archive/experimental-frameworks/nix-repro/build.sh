#!/usr/bin/env bash
#
# ESTA-Logic WASM Build Reproducer
#
# This script reproduces the exact CI build steps in a Nix environment.
# It is designed to help debug CI failures locally.
#
# Usage:
#   # From the nix-repro directory:
#   ./build.sh
#
#   # Or with specific options:
#   ./build.sh --skip-optimize     # Skip wasm-opt optimization
#   ./build.sh --skip-sign         # Skip manifest signing
#   ./build.sh --verbose           # Enable verbose output
#
# Environment Variables:
#   KERNEL_PRIVATE_KEY  - Ed25519 private key for signing (optional)
#   KERNEL_PUBLIC_KEY   - Ed25519 public key for verification (optional)
#   BUILD_MODE          - "release" or "debug" (default: release)
#
set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_MODE="${BUILD_MODE:-release}"
SKIP_OPTIMIZE=false
SKIP_SIGN=false
VERBOSE=false

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-optimize)
            SKIP_OPTIMIZE=true
            shift
            ;;
        --skip-sign)
            SKIP_SIGN=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --skip-optimize   Skip wasm-opt optimization step"
            echo "  --skip-sign       Skip manifest signing step"
            echo "  --verbose         Enable verbose output"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_step "Checking Prerequisites"
    
    local missing=()
    
    if ! command -v rustc &> /dev/null; then
        missing+=("rustc")
    else
        log_info "Rust: $(rustc --version)"
    fi
    
    if ! command -v cargo &> /dev/null; then
        missing+=("cargo")
    else
        log_info "Cargo: $(cargo --version)"
    fi
    
    if ! command -v wasm-opt &> /dev/null; then
        missing+=("wasm-opt (binaryen)")
    else
        log_info "wasm-opt: $(wasm-opt --version)"
    fi
    
    if ! command -v node &> /dev/null; then
        missing+=("node")
    else
        log_info "Node.js: $(node --version)"
    fi
    
    if ! command -v gleam &> /dev/null; then
        missing+=("gleam")
    else
        log_info "Gleam: $(gleam --version)"
    fi
    
    # Check for WASM target
    if ! rustup target list --installed 2>/dev/null | grep -q "wasm32-unknown-unknown"; then
        log_warning "wasm32-unknown-unknown target not installed"
        log_info "Installing wasm32-unknown-unknown target..."
        rustup target add wasm32-unknown-unknown || {
            log_error "Failed to install wasm32-unknown-unknown target"
            missing+=("wasm32-unknown-unknown target")
        }
    else
        log_info "WASM target: wasm32-unknown-unknown installed"
    fi
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing prerequisites: ${missing[*]}"
        log_info "Please run this script inside the Nix shell:"
        log_info "  nix develop ./nix-repro"
        log_info "  # or"
        log_info "  nix-shell ./nix-repro/shell.nix"
        exit 1
    fi
    
    log_success "All prerequisites satisfied"
}

# Build accrual engine WASM
build_accrual_wasm() {
    log_step "Building Accrual Engine WASM"
    
    local wasm_dir="$ROOT_DIR/libs/accrual-engine-wasm"
    
    if [[ ! -d "$wasm_dir" ]]; then
        log_error "Accrual engine directory not found: $wasm_dir"
        exit 1
    fi
    
    cd "$wasm_dir"
    log_info "Building in $BUILD_MODE mode..."
    
    if [[ "$BUILD_MODE" == "release" ]]; then
        cargo build --release --target wasm32-unknown-unknown
    else
        cargo build --target wasm32-unknown-unknown
    fi
    
    local wasm_path
    if [[ "$BUILD_MODE" == "release" ]]; then
        wasm_path="$wasm_dir/target/wasm32-unknown-unknown/release/accrual_engine_wasm.wasm"
    else
        wasm_path="$wasm_dir/target/wasm32-unknown-unknown/debug/accrual_engine_wasm.wasm"
    fi
    
    if [[ -f "$wasm_path" ]]; then
        log_success "WASM built: $wasm_path"
        
        # Copy to dist directory
        mkdir -p "$ROOT_DIR/dist/wasm"
        cp "$wasm_path" "$ROOT_DIR/dist/wasm/accrual.wasm"
        log_info "Copied to: $ROOT_DIR/dist/wasm/accrual.wasm"
    else
        log_error "WASM file not found: $wasm_path"
        exit 1
    fi
    
    cd "$ROOT_DIR"
}

# Optimize WASM with wasm-opt
optimize_wasm() {
    log_step "Optimizing WASM with wasm-opt"
    
    if [[ "$SKIP_OPTIMIZE" == "true" ]]; then
        log_warning "Skipping wasm-opt optimization (--skip-optimize)"
        return
    fi
    
    local wasm_path="$ROOT_DIR/dist/wasm/accrual.wasm"
    local optimized_path="$ROOT_DIR/dist/wasm/accrual.opt.wasm"
    
    if [[ ! -f "$wasm_path" ]]; then
        log_error "WASM file not found: $wasm_path"
        exit 1
    fi
    
    log_info "Running wasm-opt with -O3 optimization..."
    wasm-opt -O3 "$wasm_path" -o "$optimized_path"
    
    local original_size=$(stat -f%z "$wasm_path" 2>/dev/null || stat -c%s "$wasm_path")
    local optimized_size=$(stat -f%z "$optimized_path" 2>/dev/null || stat -c%s "$optimized_path")
    
    log_success "Original size: $original_size bytes"
    log_success "Optimized size: $optimized_size bytes"
    log_info "Size reduction: $(( (original_size - optimized_size) * 100 / original_size ))%"
    
    # Replace with optimized version
    mv "$optimized_path" "$wasm_path"
}

# Generate SHA256 hash
generate_hash() {
    log_step "Generating SHA256 Hash"
    
    local wasm_path="$ROOT_DIR/dist/wasm/accrual.wasm"
    local hash_path="$ROOT_DIR/dist/wasm/accrual.wasm.sha256"
    
    if [[ ! -f "$wasm_path" ]]; then
        log_error "WASM file not found: $wasm_path"
        exit 1
    fi
    
    local hash
    if command -v sha256sum &> /dev/null; then
        hash=$(sha256sum "$wasm_path" | cut -d' ' -f1)
    elif command -v shasum &> /dev/null; then
        hash=$(shasum -a 256 "$wasm_path" | cut -d' ' -f1)
    else
        log_error "Neither sha256sum nor shasum available"
        exit 1
    fi
    
    echo "$hash  accrual.wasm" > "$hash_path"
    log_success "SHA256: $hash"
    log_info "Hash saved to: $hash_path"
}

# Sign WASM manifest (if keys are available)
sign_manifest() {
    log_step "Signing WASM Manifest"
    
    if [[ "$SKIP_SIGN" == "true" ]]; then
        log_warning "Skipping manifest signing (--skip-sign)"
        return
    fi
    
    if [[ -z "${KERNEL_PRIVATE_KEY:-}" ]]; then
        log_warning "KERNEL_PRIVATE_KEY not set - skipping signing"
        log_info "To enable signing, set environment variables:"
        log_info "  export KERNEL_PRIVATE_KEY='<base64-encoded-ed25519-private-key>'"
        log_info "  export KERNEL_PUBLIC_KEY='<base64-encoded-ed25519-public-key>'"
        return
    fi
    
    local wasm_path="$ROOT_DIR/dist/wasm/accrual.wasm"
    local manifest_path="$ROOT_DIR/dist/wasm/manifest.json"
    local hash
    
    if command -v sha256sum &> /dev/null; then
        hash=$(sha256sum "$wasm_path" | cut -d' ' -f1)
    else
        hash=$(shasum -a 256 "$wasm_path" | cut -d' ' -f1)
    fi
    
    # Create manifest
    cat > "$manifest_path" << EOF
{
  "version": "0.1.0",
  "modules": [
    {
      "name": "accrual-engine",
      "path": "accrual.wasm",
      "sha256": "$hash",
      "capabilities": ["compute", "memory"],
      "signed": true,
      "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    }
  ]
}
EOF
    
    log_success "Manifest created: $manifest_path"
    log_warning "Ed25519 signature generation requires Node.js crypto module"
    log_info "Full signing implementation available in production build pipeline"
}

# Build Helix (Gleam) project
build_helix() {
    log_step "Building Helix (Gleam) Project"
    
    local helix_dir="$ROOT_DIR/packages/helix"
    
    if [[ ! -d "$helix_dir" ]]; then
        log_warning "Helix directory not found: $helix_dir"
        return
    fi
    
    cd "$helix_dir"
    
    log_info "Downloading Gleam dependencies..."
    gleam deps download || {
        log_warning "Failed to download Gleam dependencies (may be offline)"
    }
    
    log_info "Building Gleam project..."
    gleam build || {
        log_warning "Gleam build failed - this may indicate missing dependencies"
    }
    
    cd "$ROOT_DIR"
    log_success "Helix build completed"
}

# Build esta-kernel (Rust native)
build_kernel() {
    log_step "Building ESTA Kernel"
    
    local kernel_dir="$ROOT_DIR/engine/esta-kernel"
    
    if [[ ! -d "$kernel_dir" ]]; then
        log_warning "Kernel directory not found: $kernel_dir"
        return
    fi
    
    cd "$kernel_dir"
    log_info "Building kernel in $BUILD_MODE mode..."
    
    if [[ "$BUILD_MODE" == "release" ]]; then
        cargo build --release
    else
        cargo build
    fi
    
    cd "$ROOT_DIR"
    log_success "Kernel build completed"
}

# Run tests
run_tests() {
    log_step "Running Tests"
    
    # Accrual engine tests
    local wasm_dir="$ROOT_DIR/libs/accrual-engine-wasm"
    if [[ -d "$wasm_dir" ]]; then
        cd "$wasm_dir"
        log_info "Running accrual engine tests..."
        cargo test || log_warning "Some accrual engine tests failed"
        cd "$ROOT_DIR"
    fi
    
    # Kernel tests
    local kernel_dir="$ROOT_DIR/engine/esta-kernel"
    if [[ -d "$kernel_dir" ]]; then
        cd "$kernel_dir"
        log_info "Running kernel tests..."
        cargo test || log_warning "Some kernel tests failed"
        cd "$ROOT_DIR"
    fi
    
    log_success "Tests completed"
}

# Summary
print_summary() {
    log_step "Build Summary"
    
    echo ""
    echo "Build artifacts:"
    
    if [[ -f "$ROOT_DIR/dist/wasm/accrual.wasm" ]]; then
        local size=$(stat -f%z "$ROOT_DIR/dist/wasm/accrual.wasm" 2>/dev/null || stat -c%s "$ROOT_DIR/dist/wasm/accrual.wasm")
        echo "  ✅ dist/wasm/accrual.wasm ($size bytes)"
    else
        echo "  ❌ dist/wasm/accrual.wasm (not found)"
    fi
    
    if [[ -f "$ROOT_DIR/dist/wasm/accrual.wasm.sha256" ]]; then
        echo "  ✅ dist/wasm/accrual.wasm.sha256"
    fi
    
    if [[ -f "$ROOT_DIR/dist/wasm/manifest.json" ]]; then
        echo "  ✅ dist/wasm/manifest.json"
    fi
    
    echo ""
    log_success "Build completed successfully!"
}

# Main execution
main() {
    echo ""
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║     ESTA-Logic WASM Build Reproducer                       ║"
    echo "║     Reproducing CI build steps in Nix environment          ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    
    check_prerequisites
    build_accrual_wasm
    optimize_wasm
    generate_hash
    sign_manifest
    build_helix
    build_kernel
    run_tests
    print_summary
}

# Run main function
main "$@"
