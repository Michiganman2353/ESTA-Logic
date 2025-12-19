# ESTA-Logic Architecture Overview

> **⚠️ Strategic Direction Update:** ESTA-Logic is undergoing a strategic reset to become a TurboTax-style guided compliance experience. This technical architecture document describes our underlying engine. For the experience-first architectural approach that guides our implementation, see [Experience-First Architecture](./Experience-First-Architecture.md) and [Strategic Roadmap](./ROADMAP.md).

This document describes the WASM-native microkernel architecture, migration strategy, and components required to transform ESTA-Logic from an Nx/Firestore modular monolith to a deterministic, isolated compliance engine.

## Overview

- **Kernel (esta-kernel)**: Rust runtime providing module lifecycle, capability enforcement, IPC, and audit logging.
- **WASM Modules**: Compiled bytecode for accruals, policies, audit processors, and adapters (persistence, notifications).
- **Tauri Host**: Provides secure native capabilities, UI (React), and acts as the kernel process manager.
- **Hybrid Persistence**: Firestore remains a persistence plugin during migration. A WASM persistence adapter isolates all DB access.

## Runtime model

1. Tauri launches the kernel process.
2. Kernel reads module manifest (signed JSON) and instantiates WASM modules in sandboxes.
3. Modules communicate via capability-limited message passing (no shared memory).
4. Kernel performs deterministic scheduling and logs all module calls to an immutable audit log.

## Migration plan (high-level)

| Phase | Description                                                                                      | Owner          | ETA     | Status      |
| ----- | ------------------------------------------------------------------------------------------------ | -------------- | ------- | ----------- |
| P0    | Accrual prototype: compile `libs/accrual-engine` to WASM and validate deterministic outputs.     | @kernel-team   | Q1 2025 | In Progress |
| P1    | Tauri integration: allow kernel to be launched by Tauri, enforce module allowlists.              | @kernel-team   | Q2 2025 | Planned     |
| P2    | Persistence plugin: implement Firestore adapter as WASM plugin; move read-only operations first. | @platform-team | Q3 2025 | Planned     |
| P3    | Replace Nx orchestration with kernel loader; retire server-side domain logic.                    | @platform-team | Q4 2025 | Planned     |

> **Note**: Track detailed status and blockers on the project board. Update ADR 0001 upon phase completion.

## Security model

- Linear memory per module
- WASI with minimal syscall allowlist
- Signed manifests and module hashing for provenance
- Capability-based access tokens scoped per tenant

## CI/CD & reproducibility

- Binary reproducible WASM builds (hash, sig)
- GitHub Actions: build wasm artifacts, run proptest property tests, cargo-audit and npm-audit

## Appendix: modules

- accrual.wasm — accrual engine
- audit.wasm — immutable logger/encoder
- persistence-firestore.wasm — Firestore adapter (hybrid)

Refer to ADRs and `docs/adr/0001-wasm-microkernel.md` for decision history.
