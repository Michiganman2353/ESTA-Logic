# Gleam Development Guide

## Overview

The ESTA-Logic repository includes two Gleam packages that provide immutable, type-safe logic for ESTA compliance calculations:

1. **@esta-logic/helix** (`packages/helix`) - Immutable ESTA DNA and accrual calculations
2. **@esta-logic/gleam-core** (`logic/gleam-core`) - Microkernel logic compiled to WebAssembly

These packages use Gleam 1.11.0 and target JavaScript for seamless integration with the Node.js/TypeScript ecosystem.

## Requirements

### System Dependencies

- **Gleam**: >= 1.11.0
- **Erlang/OTP**: >= 25 (required for Gleam runtime)
- **rebar3**: 3.20.0+ (Erlang build tool)

### Network Access

Gleam requires network access to `packages.gleam.run` to download dependencies. If you're working in a sandboxed or restricted environment, Gleam builds may fail during dependency resolution.

## Installation

### Automated Installation (Recommended)

Use the provided installation script:

```bash
bash scripts/install-gleam.sh
```

This script will:

- Download Gleam 1.11.0 for Linux x86_64
- Extract to `/usr/local/bin`
- Install rebar3 if not present
- Verify the installation

### Manual Installation

1. **Install Erlang/OTP**:

   ```bash
   sudo apt-get update
   sudo apt-get install -y erlang-base erlang-dev erlang-asn1 \
     erlang-eunit erlang-xmerl erlang-public-key erlang-ssl erlang-inets
   ```

2. **Install Gleam**:

   ```bash
   GLEAM_VERSION=1.11.0
   curl -fsSL "https://github.com/gleam-lang/gleam/releases/download/v${GLEAM_VERSION}/gleam-v${GLEAM_VERSION}-x86_64-unknown-linux-musl.tar.gz" -o /tmp/gleam.tar.gz
   sudo tar -C /usr/local/bin -xzf /tmp/gleam.tar.gz
   gleam --version
   ```

3. **Install rebar3**:
   ```bash
   sudo curl -fsSL -o /usr/local/bin/rebar3 https://github.com/erlang/rebar3/releases/download/3.20.0/rebar3
   sudo chmod +x /usr/local/bin/rebar3
   ```

## Building Gleam Packages

### Using Nx

```bash
# Build both Gleam packages
npx nx run-many --target=build --projects=@esta-logic/helix,@esta-logic/gleam-core

# Build individual package
npx nx build @esta-logic/helix
npx nx build @esta-logic/gleam-core

# Run tests
npx nx test @esta-logic/helix
npx nx test @esta-logic/gleam-core
```

### Direct Gleam Commands

```bash
# Navigate to package directory
cd packages/helix  # or logic/gleam-core

# Download dependencies
gleam deps download

# Build package
gleam build

# Run tests
gleam test

# Format code
gleam format
```

## CI/CD

### GitHub Actions

The CI workflow (`.github/workflows/ci.yml`) automatically installs Gleam and Erlang using the `erlef/setup-beam@v1` action:

```yaml
- name: Setup Gleam and Erlang
  uses: erlef/setup-beam@v1
  with:
    otp-version: '27'
    gleam-version: '1.11.0'
```

This ensures Gleam packages build successfully in CI even if they fail in restricted local environments.

## Troubleshooting

### Network Access Issues

**Symptom**: `gleam deps download` hangs or fails with "Could not resolve host: packages.gleam.run"

**Solutions**:

1. Check your network connection
2. Verify you can access https://packages.gleam.run
3. If behind a proxy, configure your proxy settings
4. In sandboxed environments, Gleam builds may not be possible - rely on CI builds instead

### Missing Dependencies

**Symptom**: Build fails with missing Gleam packages

**Solution**: Run `gleam deps download` before building:

```bash
cd packages/helix
gleam deps download
gleam build
```

### Erlang Not Found

**Symptom**: `gleam` command fails with Erlang-related errors

**Solution**: Install Erlang/OTP:

```bash
sudo apt-get install -y erlang-base erlang-dev
erl -version  # Verify installation
```

## Package Structure

### @esta-logic/helix

```
packages/helix/
├── gleam.toml          # Package manifest
├── src/
│   └── accrual.gleam   # ESTA accrual calculations
├── test/
│   └── accrual_test.gleam
└── build/              # Compiled JavaScript output
```

**Dependencies**:

- `gleam_stdlib` >= 0.34.0

### @esta-logic/gleam-core

```
logic/gleam-core/
├── gleam.toml          # Package manifest
├── src/
│   └── kernel.gleam    # Microkernel accrual logic
├── test/
│   └── kernel_test.gleam
└── build/              # Compiled JavaScript output
```

**Dependencies**:

- `gleam_stdlib` >= 0.34.0

## Development Workflow

1. **Make changes** to `.gleam` files in `src/`
2. **Format code**: `gleam format`
3. **Run tests**: `gleam test`
4. **Build**: `gleam build`
5. **Commit changes** including any updated lock files

## Integration with TypeScript

Gleam packages compile to JavaScript and can be imported by TypeScript code:

```typescript
// Import compiled Gleam module
import { calculate } from '@esta-logic/helix/build/dev/javascript/helix/accrual.mjs';

// Use Gleam function
const accrual = calculate(160.0, 3.0, 15);
console.log(accrual);
```

## Why Gleam?

Gleam provides:

- **Type Safety**: Compile-time guarantees prevent runtime errors
- **Immutability**: All data is immutable by default
- **Pattern Matching**: Elegant handling of different cases
- **WebAssembly Target**: Future compilation to WASM for deterministic execution
- **Excellent Error Messages**: Clear, helpful compiler feedback

For ESTA compliance calculations, these properties ensure:

- Calculations are always correct
- No accidental state mutations
- Predictable, auditable behavior
- Easy testing and verification

## Resources

- [Gleam Language Guide](https://gleam.run/documentation/)
- [Gleam Standard Library](https://hexdocs.pm/gleam_stdlib/)
- [Gleam Package Index](https://packages.gleam.run/)
- [Erlang/OTP Documentation](https://www.erlang.org/docs)

## Support

For issues with Gleam packages:

1. Check this guide first
2. Review CI logs for working examples
3. Consult the Gleam documentation
4. Open an issue in the repository
