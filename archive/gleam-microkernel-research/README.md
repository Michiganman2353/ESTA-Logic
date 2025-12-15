# Gleam Microkernel Research Archive

**Archived:** 2025-12-15  
**Original Location:** Root directory (estalogic_kernel, estalogic_protocol, estalogic_drivers, estalogic_observe)  
**Reason:** Experimental research code not integrated into production

## Overview

This archive contains experimental Gleam-based implementations of a microkernel architecture designed for WASM-native execution of compliance logic. The research explored:

- **Security-first design** with capability-based access control
- **Message-passing architecture** for inter-module communication
- **Driver isolation** for external services (Kafka, Postgres, Redis)
- **Observability layer** for monitoring and debugging
- **Real-time constraints** for deterministic execution
- **Dual-core redundancy** for safety-critical operations

## Architecture Concepts

### estalogic_kernel/

Core kernel implementation with:

- **abi.gleam** - Application Binary Interface definitions
- **security/cap_system.gleam** - Capability-based security system
- **isolation/guardrails.gleam** - Isolation and safety guardrails
- **runtime/wasm_safety.gleam** - WASM runtime safety checks
- **realtime/constraints.gleam** - Real-time execution constraints
- **redundancy/dual_core.gleam** - Dual-core safety architecture

### estalogic_protocol/

Message passing and reliability:

- **message.gleam** - Message format and routing definitions
- **reliability.gleam** - Reliable message delivery guarantees

### estalogic_drivers/

Driver contracts for external services:

- **kafka/contract.gleam** - Kafka driver interface
- **postgres/contract.gleam** - PostgreSQL driver interface
- **redis/contract.gleam** - Redis driver interface

### estalogic_observe/

Observability infrastructure:

- Logging, tracing, and monitoring abstractions

## Key Learnings

1. **Capability Security Model:** The capability-based security system proved valuable for fine-grained access control. This concept was ported to TypeScript.

2. **Message Passing:** The message protocol design informed the IPC boundary in `libs/kernel-boundary/src/ipc.ts`.

3. **WASM Safety:** Runtime safety checks were valuable but added overhead. Balanced approach taken in production.

4. **Type Safety:** Gleam's type system caught many potential bugs, but added complexity for the team's primarily TypeScript skillset.

## Why Archived

1. **Not Production-Ready:** Remained in research phase, never integrated into production workflow
2. **Team Skillset:** Team primarily works in TypeScript/JavaScript, maintaining Gleam code added friction
3. **Concepts Preserved:** Key architectural concepts ported to TypeScript in `libs/kernel-boundary/`
4. **No Active Development:** Last meaningful commit was during initial research phase
5. **No CI Integration:** Not built or tested in production CI pipeline

## TypeScript Ports

The valuable concepts from this research were ported to TypeScript:

- **libs/kernel-boundary/src/capability.ts** - TypeScript port of cap_system.gleam
- **libs/kernel-boundary/src/ipc.ts** - TypeScript port of message.gleam
- **libs/kernel-boundary/** - General boundary patterns

These TypeScript implementations are actively maintained and documented.

## Restoration

To restore this code for further research:

1. Copy directories back to project root
2. Install Gleam toolchain (version 1.11.0+)
3. Install Erlang/OTP (version 27+)
4. Run `gleam build` in each directory
5. Re-enable `gleam-ci.yml` workflow if needed

## References

- **Original Architecture Doc:** [docs/MICROKERNEL_ARCHITECTURE.md](../../docs/MICROKERNEL_ARCHITECTURE.md)
- **ADR:** [docs/architecture/adr/0001-wasm-microkernel.md](../../docs/architecture/adr/0001-wasm-microkernel.md)
- **TypeScript Port:** [libs/kernel-boundary/](../../libs/kernel-boundary/)

---

**Note:** This research informed our architectural thinking even though the specific implementation was not adopted. The exploration was valuable for understanding WASM-native architectures and safety-critical system design.
