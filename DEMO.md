# ESTA-Logic Microkernel Demo

> **"The Blueprint, Running on the Track"**

This demo shows the ESTA-Logic microkernel architecture in action—not just documentation, but actual running code.

## Quick Start

```bash
# Install dependencies
npm install

# Run the microkernel demo
npm run demo
```

## What the Demo Shows

The demo initializes the microkernel and demonstrates:

### 1. Kernel Initialization

- **Scheduler**: Priority-based preemptive scheduling
- **IPC Router**: Message routing between services
- **Capability Engine**: Capability-based security
- **Module Loader**: WASM module lifecycle management

### 2. WASM Service Modules

- **accrual-engine**: Deterministic sick time accrual calculations
- **compliance-engine**: ESTA 2025 compliance checking

### 3. IPC Message Flow

- Command creation with trace context
- Routing through the kernel
- Deterministic processing

### 4. ESTA Calculations

- **Accrual**: 1 hour per 30 hours worked (ESTA 2025)
- **Carryover**: Year-end balance limits by employer size
- **Compliance**: Rule evaluation with violations and warnings

### 5. Security

- Capability validation for resource access
- Audit logging for compliance

## Sample Output

```
╔══════════════════════════════════════════════════════════════════════╗
║            ESTA-Logic Microkernel Demonstration                      ║
║                  "The Blueprint, Running on the Track"               ║
╚══════════════════════════════════════════════════════════════════════╝

======================================================================
  STEP 1: Initialize Microkernel
======================================================================

[00:00:00] [KERNEL      ] Microkernel initialized
[00:00:00] [SCHEDULER   ] Created with 0 processes
[00:00:00] [IPC-ROUTER  ] Created with 0 routes
[00:00:00] [CAP-ENGINE  ] Created with 0 capabilities
[00:00:00] [LOADER      ] Created with 0 modules

======================================================================
  STEP 2: Load WASM Service Modules
======================================================================

[00:00:00] [LOADER      ] ✓ Loaded accrual-engine (PID: 1)
[00:00:00] [LOADER      ] ✓ Loaded compliance-engine (PID: 2)
[00:00:00] [KERNEL      ] Running modules: 2
...
```

## Running Tests

```bash
# TypeScript kernel architecture tests
npx vitest run --config test/architecture/vitest.config.ts

# Rust WASM module tests
cd libs/accrual-engine-wasm && cargo test

# Rust kernel tests
cd engine/esta-kernel && cargo test --features wasmtime
```

## Architecture Overview

```
                    ┌─────────────────────────────────────┐
                    │          ESTA-Logic System          │
                    ├─────────────────────────────────────┤
                    │                                     │
   ┌─────────────┐  │  ┌─────────────┐  ┌─────────────┐  │
   │   Accrual   │  │  │ Compliance  │  │  Employee   │  │
   │   Engine    │──┼──│   Engine    │──│   Service   │  │
   │   (WASM)    │  │  │   (WASM)    │  │   (WASM)    │  │
   └──────┬──────┘  │  └──────┬──────┘  └──────┬──────┘  │
          │         │         │                │         │
          └─────────┼─────────┼────────────────┘         │
                    │         │                          │
                    │         ▼                          │
                    │  ┌─────────────────────────────┐   │
                    │  │     KERNEL IPC ROUTER       │   │
                    │  └─────────────────────────────┘   │
                    │         │                          │
         ┌──────────┼─────────┼──────────────┐          │
         ▼          │         ▼              ▼          │
  ┌───────────┐     │  ┌───────────┐  ┌───────────┐     │
  │ Scheduler │     │  │Capability │  │  Module   │     │
  │           │     │  │  Engine   │  │  Loader   │     │
  └───────────┘     │  └───────────┘  └───────────┘     │
                    │                                    │
                    └────────────────────────────────────┘
```

## Key Principles Demonstrated

1. **Kernel is the Conductor** - All modules play under kernel direction
2. **No Direct Service-to-Service Imports** - Everything via IPC
3. **Capability-Based Security** - All access requires valid capabilities
4. **Deterministic Execution** - Same inputs always produce same outputs
5. **Host Access via Syscalls Only** - No direct host calls from modules

## Files

| File                        | Description                           |
| --------------------------- | ------------------------------------- |
| `demo/kernel-demo.ts`       | Main demo script                      |
| `kernel/`                   | TypeScript microkernel implementation |
| `services/`                 | WASM service modules                  |
| `engine/esta-kernel/`       | Rust WASM runtime kernel              |
| `libs/accrual-engine-wasm/` | Rust WASM accrual module              |

## License

See [LICENSE](./LICENSE)
