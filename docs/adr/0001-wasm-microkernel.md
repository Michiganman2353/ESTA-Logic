# ADR 0001 - Adopt WASM-native Microkernel Architecture

Date: 2025-12-03

## Status

Accepted (prototype)

## Re-evaluation Cadence

This ADR shall be re-evaluated:

- **Quarterly**: During architecture review meetings
- **On Phase Completion**: After each migration phase (P0→P3) completes
- **On Security Findings**: If cargo-audit or CodeQL identifies critical vulnerabilities in wasmtime or kernel dependencies

## Context

ESTA-Logic must deliver deterministic accruals, auditable evidence, modular policy swaps, and strong tenant isolation to comply with MCL 408.963. The team evaluated alternatives: microservices re-architecture, monolithic refactor, or WASM microkernel. The WASM microkernel was chosen for reproducibility and isolation.

## Decision

Adopt a Rust-based kernel (esta-kernel) with WASM modules. Tauri will host the kernel.

## Consequences

- Developer learning curve for Rust/WASM.
- Increased upfront engineering cost; long-term gains in auditability, security, and modularity.

## References

- [Architecture Overview](../architecture.md)
- [Microkernel Diagram](../diag/microkernel.mmd)
