# ADR 002: Gleam Integration for Type-Safe Kernel

**Status**: Implemented  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team  
**Replaces**: N/A

## Context

ESTA-Logic requires a type-safe, pure functional core for compliance calculations and kernel specifications. The system needs:

1. **Immutable data structures** for audit trails and compliance proofs
2. **Strong type guarantees** at the language level
3. **WASM compilation target** for desktop (Tauri) and web workers
4. **Pattern matching** for complex business logic
5. **Erlang-style concurrency model** for future scalability

## Decision

We adopt **Gleam** as the specification language for kernel types and pure business logic.

### Gleam Components

| Package             | Purpose                                      | Status      |
| ------------------- | -------------------------------------------- | ----------- |
| `estalogic_kernel`  | Core ABI types, process lifecycle, IPC specs | Implemented |
| `estalogic_protocol`| Message schemas, reliability contracts       | Implemented |
| `estalogic_drivers` | Adapter specifications (Kafka, Redis, PG)    | Implemented |
| `estalogic_observe` | Observability and telemetry types            | Implemented |
| `packages/helix`    | Pure accrual calculation logic               | Implemented |

### Key Design Decisions

1. **Target: JavaScript** - Gleam compiles to JavaScript for Node.js and browser compatibility
2. **TypeScript Port** - All Gleam types are ported to TypeScript in `@esta/kernel-boundary`
3. **No Runtime Dependency** - Gleam specs are compile-time only; runtime uses TypeScript
4. **WASM Future** - Architecture supports future WASM compilation when needed

## Consequences

### Positive

- **Formal Type Contracts**: Gleam's exhaustive pattern matching prevents missing cases
- **Documentation as Code**: Type definitions serve as living documentation
- **Cross-Language Consistency**: Same types in Gleam and TypeScript
- **Future-Proof**: Ready for WASM compilation when performance requires it
- **Pure Functions**: Gleam enforces purity, ideal for compliance calculations

### Negative

- **Learning Curve**: Team must understand Gleam syntax for spec review
- **Build Complexity**: Adds Gleam toolchain to CI/CD
- **Dual Maintenance**: Types exist in both Gleam and TypeScript

### Mitigations

- **Code Generation**: Future tooling could auto-generate TypeScript from Gleam
- **Documentation**: Comprehensive comments in both languages
- **Training**: Internal knowledge base on Gleam basics

## Implementation

### Gleam Installation

```bash
# Install Gleam (Homebrew)
brew install gleam

# Or via npm (CI-friendly)
npm install -g gleam
```

### Building Gleam Packages

```bash
# Build kernel specs
cd estalogic_kernel && gleam build

# Build protocol specs
cd estalogic_protocol && gleam build

# Build helix (accrual)
cd packages/helix && gleam build
```

### TypeScript Integration

The `@esta/kernel-boundary` package provides TypeScript equivalents:

```typescript
// Gleam type
pub type Capability {
  Capability(id: Int, rights: List(Right), ...)
}

// TypeScript equivalent
export interface Capability {
  readonly id: CapabilityId;
  readonly rights: CapabilityRights;
  // ...
}
```

## References

- [Gleam Documentation](https://gleam.run/)
- [estalogic_kernel Source](../../estalogic_kernel/)
- [Kernel Boundary Package](../../libs/kernel-boundary/)
- [Helix Accrual Engine](../../packages/helix/)

## Revision History

| Version | Date       | Author    | Changes            |
| ------- | ---------- | --------- | ------------------ |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial decision   |
