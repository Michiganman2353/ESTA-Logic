# ADR 007: WASM Accrual Engine Specification

**Status**: RFC (Request for Comments)  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team, Architecture Review Board  
**Extends**: [ADR 004](./004-wasm-strategy.md) (WASM Compilation Strategy)

## Abstract

This RFC defines the specification for a deterministic WebAssembly (WASM) accrual calculation engine that enables:

1. **Deterministic execution** across all platforms (browser, server, desktop)
2. **Offline-first** calculations for Tauri desktop applications
3. **Formal verification** capability for compliance auditing
4. **Source language flexibility** via Gleam or Rust compilation paths

## Context

### Business Requirements

ESTA Tracker must calculate sick time accruals with:

- **Legal precision**: Calculations must match Michigan ESTA law exactly
- **Auditability**: Every calculation must be reproducible
- **Offline support**: Desktop users need calculations without network
- **Cross-platform parity**: Same results everywhere

### Technical Drivers

| Driver       | Requirement       | WASM Solution                     |
| ------------ | ----------------- | --------------------------------- |
| Determinism  | Bit-exact results | No floating-point non-determinism |
| Isolation    | Memory safety     | Linear memory sandbox             |
| Portability  | Multi-runtime     | Single binary, multiple hosts     |
| Performance  | Sub-millisecond   | Near-native execution             |
| Auditability | Execution replay  | Deterministic host functions      |

## Specification

### 1. Core Engine Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    WASM Accrual Engine                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    esta_accrual.wasm                        ││
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   ││
│  │  │ Accrual Calc  │  │ Carryover     │  │ Balance       │   ││
│  │  │ Module        │  │ Module        │  │ Module        │   ││
│  │  └───────────────┘  └───────────────┘  └───────────────┘   ││
│  │                                                              ││
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐   ││
│  │  │ Employer Size │  │ Usage Limit   │  │ Benefit Year  │   ││
│  │  │ Rules         │  │ Rules         │  │ Rules         │   ││
│  │  └───────────────┘  └───────────────┘  └───────────────┘   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Host Interface                            ││
│  │  get_timestamp() │ log_audit() │ get_random() │ abort()     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 2. Deterministic Execution Model

#### 2.1 No External Dependencies

The WASM module MUST NOT:

- Access network
- Read filesystem
- Use system time directly
- Generate random numbers internally

All external data MUST be passed through the host interface.

#### 2.2 Fixed-Point Arithmetic

To ensure determinism, all monetary and time calculations use fixed-point:

```rust
/// Fixed-point decimal with 6 decimal places
/// 1.000000 is represented as 1_000_000
pub struct Decimal6 {
    value: i64,
}

impl Decimal6 {
    pub const SCALE: i64 = 1_000_000;

    pub fn from_hours(hours: f64) -> Self {
        Self { value: (hours * Self::SCALE as f64).round() as i64 }
    }

    pub fn to_hours(self) -> f64 {
        self.value as f64 / Self::SCALE as f64
    }
}
```

#### 2.3 Timestamp Handling

```typescript
// Host provides timestamps - WASM never reads system clock
interface AccrualInput {
  employeeId: string;
  hoursWorked: Decimal6;
  periodStart: UnixTimestampMs; // Host-provided
  periodEnd: UnixTimestampMs; // Host-provided
  calculationTime: UnixTimestampMs; // For audit trail
}
```

### 3. Gleam Source Path

The primary source language is Gleam, compiled to WASM via the JavaScript target with wasm-bindgen wrapper.

#### 3.1 Module Structure

```gleam
// estalogic_kernel/src/accrual.gleam

/// Calculate accrued sick time for a work period
pub fn calculate_accrual(
  hours_worked: Decimal6,
  employer_size: EmployerSize,
  benefit_year_start: Timestamp,
) -> Result(AccrualResult, AccrualError) {
  let rate = get_accrual_rate(employer_size)
  let accrued = hours_worked
    |> decimal6.divide(rate.hours_per_unit)
    |> decimal6.multiply(rate.accrual_per_unit)

  let capped = apply_annual_cap(accrued, employer_size)

  Ok(AccrualResult(
    accrued_hours: capped,
    rate_applied: rate,
    calculation_timestamp: get_host_timestamp(),
  ))
}

/// Get accrual rate based on employer size
fn get_accrual_rate(size: EmployerSize) -> AccrualRate {
  case size {
    Small -> AccrualRate(hours_per_unit: 30, accrual_per_unit: 1)
    Large -> AccrualRate(hours_per_unit: 30, accrual_per_unit: 1)
  }
}
```

#### 3.2 Compilation Pipeline

```bash
# Step 1: Compile Gleam to JavaScript
cd estalogic_kernel
gleam build --target=javascript

# Step 2: Bundle with wasm-bindgen (future)
# When Gleam supports direct WASM target:
gleam build --target=wasm32-unknown-unknown

# Step 3: Optimize
wasm-opt -O3 build/esta_accrual.wasm -o dist/esta_accrual.opt.wasm

# Step 4: Generate TypeScript bindings
wasm-bindgen build/esta_accrual.wasm \
  --out-dir pkg \
  --target web \
  --typescript
```

### 4. Rust Source Path

For performance-critical paths and cryptographic operations:

#### 4.1 Crate Structure

```rust
// crates/esta-wasm-accrual/src/lib.rs

use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub struct AccrualEngine {
    employer_size: EmployerSize,
    benefit_year_start: i64,
}

#[wasm_bindgen]
impl AccrualEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(employer_size: u8, benefit_year_start: i64) -> Self {
        Self {
            employer_size: EmployerSize::from(employer_size),
            benefit_year_start,
        }
    }

    /// Calculate accrual for hours worked
    /// Returns hours accrued as fixed-point Decimal6
    pub fn calculate(&self, hours_worked: i64) -> i64 {
        let rate = self.employer_size.accrual_rate();
        let accrued = (hours_worked * rate.accrual_per_unit) / rate.hours_per_unit;
        self.apply_cap(accrued)
    }
}
```

#### 4.2 Build Configuration

```toml
# crates/esta-wasm-accrual/Cargo.toml
[package]
name = "esta-wasm-accrual"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"

[profile.release]
opt-level = "z"     # Optimize for size
lto = true          # Link-time optimization
panic = "abort"     # No unwinding
```

### 5. Host Interface Specification

#### 5.1 Imported Functions

```wit
// WASM Interface Types (future standard)
interface esta-accrual-host {
    // Logging (side-effect: audit trail)
    log-audit: func(level: log-level, message: string) -> ()

    // Time (must be deterministic in replay)
    get-timestamp-ms: func() -> s64

    // Abort with error
    abort: func(code: u32, message: string) -> ()
}

enum log-level {
    debug,
    info,
    warn,
    error,
}
```

#### 5.2 Exported Functions

```wit
interface esta-accrual {
    // Initialize engine with configuration
    init: func(config: accrual-config) -> result<engine-handle, init-error>

    // Calculate accrual for a period
    calculate: func(
        handle: engine-handle,
        input: accrual-input
    ) -> result<accrual-result, calc-error>

    // Get current balance
    get-balance: func(
        handle: engine-handle,
        employee-id: string
    ) -> result<balance-info, balance-error>

    // Apply carryover at year end
    apply-carryover: func(
        handle: engine-handle,
        year-end: timestamp
    ) -> result<carryover-result, carryover-error>
}
```

### 6. Client-Side Offline Calculations (Tauri)

#### 6.1 Desktop Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Frontend (WebView)                     │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  React App  │  WASM Module (in-browser)            │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────┬─────────────────────────────┘   │
│                               │ IPC                              │
│  ┌────────────────────────────┴─────────────────────────────┐   │
│  │                    Rust Backend                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │  Native WASM Runtime (wasmtime)                     │ │   │
│  │  │  - Offline calculations                             │ │   │
│  │  │  - Local SQLite cache                               │ │   │
│  │  │  - Sync queue for cloud                             │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### 6.2 Offline Sync Protocol

```typescript
interface OfflineCalculation {
  id: string;
  timestamp: UnixTimestampMs;
  input: AccrualInput;
  result: AccrualResult;
  wasmVersion: string;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

interface SyncQueue {
  // Add calculation to sync queue
  enqueue(calc: OfflineCalculation): Promise<void>;

  // Attempt to sync with server
  sync(): Promise<SyncResult>;

  // Get pending calculations
  getPending(): Promise<OfflineCalculation[]>;
}
```

#### 6.3 Conflict Resolution

```typescript
type ConflictResolution =
  | { strategy: 'server-wins' }
  | { strategy: 'client-wins' }
  | { strategy: 'merge'; resolver: ConflictResolver };

interface ConflictResolver {
  resolve(
    local: AccrualResult,
    remote: AccrualResult,
    baseVersion: string
  ): AccrualResult;
}
```

### 7. Formal Verification Support

#### 7.1 Execution Trace

```typescript
interface ExecutionTrace {
  // Unique trace identifier
  traceId: string;

  // WASM module hash (for reproducibility)
  wasmHash: string;

  // All inputs
  inputs: Record<string, unknown>;

  // Host function calls with arguments and returns
  hostCalls: HostCall[];

  // Final result
  result: unknown;

  // Deterministic hash of entire execution
  executionHash: string;
}

interface HostCall {
  function: string;
  arguments: unknown[];
  returnValue: unknown;
  timestamp: number; // Relative to trace start
}
```

#### 7.2 Replay Mode

```typescript
class DeterministicHost implements WasmHost {
  private trace: ExecutionTrace;
  private callIndex = 0;

  constructor(trace: ExecutionTrace) {
    this.trace = trace;
  }

  getTimestampMs(): bigint {
    const expected = this.trace.hostCalls[this.callIndex++];
    return BigInt(expected.returnValue as number);
  }

  logAudit(level: number, message: string): void {
    // Verify matches recorded call
    const expected = this.trace.hostCalls[this.callIndex++];
    if (expected.arguments[0] !== level) {
      throw new ReplayMismatchError('log level mismatch');
    }
  }
}
```

### 8. Performance Requirements

| Metric                     | Target  | Measurement Method     |
| -------------------------- | ------- | ---------------------- |
| Single accrual calculation | < 1ms   | Benchmark suite        |
| Module load time           | < 50ms  | Cold start measurement |
| Memory usage               | < 1MB   | Heap profiling         |
| Bundle size (gzipped)      | < 100KB | Build output           |

### 9. Security Considerations

#### 9.1 Memory Safety

- WASM linear memory is isolated from host
- No raw pointer access from host
- All data passed through explicit interface

#### 9.2 Input Validation

```rust
impl AccrualEngine {
    pub fn calculate(&self, input: AccrualInput) -> Result<AccrualResult, ValidationError> {
        // Validate hours within reasonable bounds
        if input.hours_worked < 0 || input.hours_worked > 24 * 365 * DECIMAL6_SCALE {
            return Err(ValidationError::HoursOutOfRange);
        }

        // Validate timestamps
        if input.period_end <= input.period_start {
            return Err(ValidationError::InvalidPeriod);
        }

        // Continue with calculation...
    }
}
```

#### 9.3 Audit Trail Integrity

Every calculation produces an audit entry:

```typescript
interface AuditEntry {
  calculationId: string;
  timestamp: UnixTimestampMs;
  wasmModuleHash: string;
  inputHash: string;
  outputHash: string;
  executionTraceHash?: string; // Optional for deep audit
}
```

## Implementation Phases

### Phase 1: Foundation (Q1 2026)

- [ ] Define WASM interface types
- [ ] Create Rust accrual crate structure
- [ ] Build compilation pipeline
- [ ] Implement host interface

### Phase 2: Gleam Integration (Q2 2026)

- [ ] Port Gleam kernel logic to WASM-compatible subset
- [ ] Create Gleam → WASM build tooling
- [ ] Implement cross-compilation tests

### Phase 3: Tauri Integration (Q3 2026)

- [ ] Integrate with Tauri desktop app
- [ ] Implement offline calculation support
- [ ] Build sync queue and conflict resolution

### Phase 4: Formal Verification (Q4 2026)

- [ ] Implement execution tracing
- [ ] Build replay verification tooling
- [ ] Create compliance audit reports

## Consequences

### Positive

- **Guaranteed determinism** across all platforms
- **Offline-first** capability for enterprise desktop users
- **Formal verification** enables compliance certification
- **Performance** near-native speed for calculations
- **Security** via memory-safe sandbox

### Negative

- **Complexity** multiple build pipelines to maintain
- **Tooling maturity** Gleam → WASM not yet production-ready
- **Bundle size** additional download for WASM modules
- **Debugging** harder than native JavaScript

### Mitigations

- **Graceful fallback** TypeScript implementation as backup
- **Progressive enhancement** load WASM only when available
- **Source maps** enable WASM debugging with DWARF info
- **Lazy loading** defer WASM load until needed

## References

- [ADR 004: WASM Compilation Strategy](./004-wasm-strategy.md)
- [ADR 002: Gleam Integration](./002-gleam-integration.md)
- [ADR 003: Tauri Desktop Application](./003-tauri-desktop.md)
- [WebAssembly Specification](https://webassembly.github.io/spec/)
- [WASM Interface Types](https://github.com/WebAssembly/interface-types)
- [Gleam Language](https://gleam.run/)
- [wasm-bindgen](https://rustwasm.github.io/wasm-bindgen/)

## Revision History

| Version | Date       | Author    | Changes           |
| ------- | ---------- | --------- | ----------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial RFC draft |
