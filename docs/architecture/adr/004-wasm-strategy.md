# ADR 004: WASM Compilation Strategy

**Status**: Planned  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team  
**Replaces**: N/A

## Context

ESTA-Logic needs to execute deterministic, isolated business logic in multiple environments:

1. **Tauri Desktop**: Local accrual calculations without network
2. **Web Workers**: CPU-intensive computations off main thread
3. **Edge Functions**: Serverless compliance checks
4. **Formal Verification**: Deterministic replay for audits

### Requirements

| Requirement      | Priority | WASM Support |
| ---------------- | -------- | ------------ |
| Determinism      | Critical | ✅ Native    |
| Memory Isolation | Critical | ✅ Native    |
| Cross-Platform   | High     | ✅ Native    |
| Performance      | High     | ✅ Native    |
| Source Language  | Medium   | Gleam/Rust   |
| Bundle Size      | Medium   | Varies       |

## Decision

We adopt a **multi-source WASM strategy** with Gleam as the primary source for business logic and Rust for performance-critical paths.

### Compilation Targets

```
┌──────────────────────────────────────────────────────────────────┐
│                       Source Languages                            │
├──────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │     Gleam       │  │      Rust       │  │   TypeScript    │  │
│  │  (Pure Logic)   │  │  (Performance)  │  │  (Fallback)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│           ▼                    ▼                    ▼            │
├──────────────────────────────────────────────────────────────────┤
│                     Compilation Pipeline                          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  gleam build    │  │   wasm-pack     │  │  N/A (native)   │  │
│  │  --target=wasm  │  │   build         │  │                 │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │            │
│           └────────────────────┼────────────────────┘            │
│                                │                                  │
│                                ▼                                  │
├──────────────────────────────────────────────────────────────────┤
│                        WASM Modules                               │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  esta_accrual.wasm    │  esta_crypto.wasm  │  Fallback TS   │ │
│  │  (Gleam → WASM)       │  (Rust → WASM)     │  (No WASM)     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Module Catalog

| Module              | Source | Size    | Purpose                     |
| ------------------- | ------ | ------- | --------------------------- |
| `esta_accrual`      | Gleam  | ~50 KB  | Sick time calculations      |
| `esta_carryover`    | Gleam  | ~30 KB  | Year-end carryover logic    |
| `esta_compliance`   | Gleam  | ~80 KB  | ESTA law validation         |
| `esta_crypto`       | Rust   | ~200 KB | Argon2id, constant-time ops |
| `esta_capabilities` | Rust   | ~100 KB | Capability token validation |

## WASM Host Interface

### Memory Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    WASM Module Memory                            │
├─────────────────────────────────────────────────────────────────┤
│  Linear Memory (64 KB initial, 16 MB max)                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Stack │  Heap  │  Static Data │  Shared Buffers (opt)     ││
│  │  4 KB  │ 60 KB  │    Variable  │      Variable             ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  No Direct Host Memory Access                                    │
│  All I/O Through Explicit Interface                              │
└─────────────────────────────────────────────────────────────────┘
```

### Host Functions

```typescript
// WASM Host Bindings
interface WasmHost {
  // Logging (no side effects beyond output)
  log_debug(level: number, msg_ptr: number, msg_len: number): void;
  log_error(code: number, msg_ptr: number, msg_len: number): void;

  // Time (deterministic in replay mode)
  get_timestamp_ms(): bigint;

  // Random (seeded in replay mode)
  get_random_bytes(buf_ptr: number, buf_len: number): number;

  // Audit trail
  emit_audit_event(event_ptr: number, event_len: number): void;
}
```

### Deterministic Execution

For formal verification and audit replay:

```typescript
interface DeterministicContext {
  // Fixed seed for reproducibility
  randomSeed: Uint8Array;

  // Monotonic timestamp source
  timestamp: number;
  timestampIncrement: number;

  // Input snapshot
  inputs: Readonly<Record<string, unknown>>;

  // Execution trace
  trace: ExecutionStep[];
}

interface ExecutionStep {
  instruction: number;
  memoryHash: string;
  hostCalls: HostCall[];
}
```

## Implementation

### Gleam to WASM Pipeline

```bash
# 1. Build Gleam to Erlang/JS (current)
cd packages/helix && gleam build

# 2. Future: Build Gleam to WASM (when gleam supports wasm32)
cd packages/helix && gleam build --target=wasm32

# 3. Optimize WASM
wasm-opt -Oz esta_accrual.wasm -o esta_accrual.opt.wasm
```

### Rust to WASM Pipeline

```bash
# Build with wasm-pack
cd crates/esta-crypto
wasm-pack build --target web --release

# Output: pkg/esta_crypto.wasm, pkg/esta_crypto.js
```

### Runtime Integration

```typescript
// libs/wasm-loader/src/index.ts
import init, { calculate_accrual } from '@esta/wasm-accrual';

let wasmReady = false;

export async function initWasm(): Promise<void> {
  if (wasmReady) return;
  await init();
  wasmReady = true;
}

export function calculateAccrual(
  hoursWorked: number,
  yearsService: number,
  employerSize: number
): AccrualResult {
  if (!wasmReady) {
    // Fallback to TypeScript implementation
    return calculateAccrualTS(hoursWorked, yearsService, employerSize);
  }
  return calculate_accrual(hoursWorked, yearsService, employerSize);
}
```

## Consequences

### Positive

- **Deterministic**: Same inputs always produce same outputs
- **Isolated**: Memory safety guaranteed by WASM sandbox
- **Portable**: Runs in browser, Node.js, Tauri, edge functions
- **Auditable**: Execution can be replayed for compliance verification
- **Performance**: Near-native speed for computation-heavy tasks

### Negative

- **Complexity**: Multiple build pipelines to maintain
- **Bundle Size**: WASM modules add to initial download
- **Debugging**: Harder to debug than native JavaScript
- **Tooling**: Gleam → WASM not yet mature (planned)

### Mitigations

- **Graceful Fallback**: TypeScript implementations as backup
- **Lazy Loading**: Only load WASM when needed
- **Source Maps**: Enable WASM debugging with DWARF info
- **Progressive**: Start with Rust → WASM, add Gleam when ready

## Timeline

### Phase 1: Rust Crypto (Q1 2026)

- Compile Argon2id and constant-time ops to WASM
- Integrate with Tauri desktop

### Phase 2: Gleam Accrual (Q2 2026)

- When Gleam WASM target matures
- Port helix accrual to WASM

### Phase 3: Full Kernel (Q3 2026)

- Complete kernel business logic in WASM
- Formal verification integration

## References

- [WebAssembly Specification](https://webassembly.github.io/spec/)
- [wasm-pack Documentation](https://rustwasm.github.io/wasm-pack/)
- [Gleam Language](https://gleam.run/) - WASM target planned for future releases
- [WASM Interface Types](https://github.com/WebAssembly/interface-types)

## Revision History

| Version | Date       | Author    | Changes          |
| ------- | ---------- | --------- | ---------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial decision |
