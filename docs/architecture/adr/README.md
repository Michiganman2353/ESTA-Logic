# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for ESTA-Logic.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## ADR Index

| ADR    | Title                                      | Status      | Date       |
| ------ | ------------------------------------------ | ----------- | ---------- |
| [001]  | Monorepo Strategy - Nx                     | Implemented | 2025-11-20 |
| [002]  | Gleam Integration for Type-Safe Kernel     | Implemented | 2025-12-01 |
| [003]  | Tauri Desktop Application Strategy         | Planned     | 2025-12-01 |
| [004]  | WASM Compilation Strategy                  | Planned     | 2025-12-01 |
| [005]  | IPC Message-Passing Architecture           | Partial     | 2025-12-01 |
| [006]  | Adapter Pattern for Persistence Isolation  | Partial     | 2025-12-01 |

[001]: ./001-monorepo-strategy.md
[002]: ./002-gleam-integration.md
[003]: ./003-tauri-desktop.md
[004]: ./004-wasm-strategy.md
[005]: ./005-ipc-messaging.md
[006]: ./006-adapter-pattern.md

## ADR Status Definitions

| Status       | Description                                      |
| ------------ | ------------------------------------------------ |
| Proposed     | Under discussion, not yet accepted               |
| Accepted     | Accepted but not yet implemented                 |
| Planned      | Accepted and scheduled for implementation        |
| Partial      | Implementation in progress                       |
| Implemented  | Fully implemented and in production              |
| Deprecated   | No longer recommended, superseded by another ADR |
| Superseded   | Replaced by a newer ADR                          |

## Creating a New ADR

1. Copy the template below
2. Create a new file: `docs/architecture/adr/NNN-title.md`
3. Fill in the sections
4. Add entry to this index
5. Submit PR for review

### Template

```markdown
# ADR NNN: Title

**Status**: Proposed  
**Date**: YYYY-MM-DD  
**Decision Makers**: [Names/Teams]  
**Replaces**: [ADR number if applicable, or N/A]

## Context

[Describe the issue motivating this decision]

## Decision

[Describe the decision and the key reasons for it]

## Consequences

### Positive

- [List positive outcomes]

### Negative

- [List negative outcomes]

### Mitigations

- [How to address negative outcomes]

## References

- [Links to related documents, issues, or external resources]

## Revision History

| Version | Date | Author | Changes |
| ------- | ---- | ------ | ------- |
| 1.0.0   | DATE | NAME   | Initial |
```

## ADR Governance

### When to Create an ADR

Create an ADR when:

- Introducing new technology or framework
- Making changes to system architecture
- Changing development or deployment processes
- Making decisions with long-term consequences

### Review Process

1. **Draft**: Author creates ADR and opens PR
2. **Review**: Team reviews and provides feedback
3. **Approval**: Senior engineer(s) approve
4. **Merge**: ADR merged with "Accepted" status
5. **Implementation**: Status updated as work progresses

### Updating ADRs

- ADRs are **immutable** once accepted
- To change a decision, create a new ADR that supersedes the old one
- Update the old ADR's status to "Superseded" with link to new ADR

## Quick Links

- [Architecture Overview](../architecture.md)
- [Microkernel Status](../MICROKERNEL_STATUS.md)
- [Kernel Contract Specification](../../abi/kernel_contract.md)
