# ESTA Logic Architecture: From Modular Monolith to Verified Microkernel

**Version**: 1.1.0  
**Status**: Active  
**Last Updated**: 2025-12-01

---

## Overview

This document describes the true architectural state of ESTA-Logic and the roadmap towards a verified microkernel architecture. It replaces misleading documentation that described the system as a microkernel when it was actually a modular monolith.

> **Related ADRs:**
>
> - [ADR-002: Gleam Integration](./adr/002-gleam-integration.md)
> - [ADR-003: Tauri Desktop](./adr/003-tauri-desktop.md)
> - [ADR-004: WASM Strategy](./adr/004-wasm-strategy.md)
> - [ADR-005: IPC Messaging](./adr/005-ipc-messaging.md)
> - [ADR-006: Adapter Pattern](./adr/006-adapter-pattern.md)

## Current State: Modular Monolith

### Accurate Description

ESTA-Logic is currently implemented as a **modular monolith** with the following characteristics:

1. **Monolithic Deployment**: All components deploy as a single unit
2. **Shared Process Space**: No true process isolation between modules
3. **Direct Dependencies**: Some business logic has direct Firebase dependencies
4. **No IPC**: Components communicate via direct function calls, not message passing
5. **No Capability System**: Authorization is done via middleware, not unforgeable tokens

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT ARCHITECTURE                        │
│                     (Modular Monolith)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │  Frontend   │   │   Backend   │   │  Functions  │           │
│  │   (React)   │   │  (Express)  │   │ (Firebase)  │           │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘           │
│         │                 │                 │                   │
│  ┌──────┴─────────────────┴─────────────────┴──────────────┐   │
│  │                      SHARED LIBS                         │   │
│  │  ┌────────────────┐  ┌────────────────┐                 │   │
│  │  │ accrual-engine │  │  shared-types  │  ...            │   │
│  │  │   (Pure TS)    │  │    (Types)     │                 │   │
│  │  └────────────────┘  └────────────────┘                 │   │
│  └─────────────────────────────────────────────────────────┘   │
│         │                                                       │
│         ▼                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    FIREBASE SDK                          │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │   │
│  │  │ Firestore  │  │    Auth    │  │  Storage   │         │   │
│  │  └────────────┘  └────────────┘  └────────────┘         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### What Works Well

- **Pure business logic**: `accrual-engine`, `esta-core` have no Firebase dependencies
- **Gleam kernel specs**: Type-level specifications exist in `estalogic_kernel`
- **Message types defined**: `estalogic_protocol` has formal message schemas
- **Capability types exist**: Gleam capability system is specified

### What Needs Work

- Backend routes directly import Firebase SDK
- No runtime capability enforcement
- No message-based IPC between components
- No formal adapter interfaces for persistence

---

## Target State: Verified Microkernel

### Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET ARCHITECTURE                         │
│                    (Verified Microkernel)                       │
├─────────────────────────────────────────────────────────────────┤
│                         USER LAND                               │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │  Frontend   │   │   Backend   │   │   Workers   │           │
│  │   (React)   │   │  (Express)  │   │   (WASM)    │           │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘           │
│         │                 │                 │                   │
├─────────┴─────────────────┴─────────────────┴───────────────────┤
│                    KERNEL BOUNDARY                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │               Capability Enforcement                     │   │
│  │    validate()  │  create()  │  delegate()  │  revoke()  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  IPC Message Bus                         │   │
│  │    publish()  │  subscribe()  │  request()  │  reply()  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Adapter Layer                           │   │
│  │    Repository  │  Transaction  │  AuditLog  │  Health   │   │
│  └─────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                         KERNEL                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐           │
│  │   Gleam     │   │   Drivers   │   │   Observe   │           │
│  │   Kernel    │   │ (Firebase)  │   │  (Logging)  │           │
│  └─────────────┘   └─────────────┘   └─────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Properties

1. **Explicit Boundaries**: Kernel/userland separation enforced at compile time
2. **Capability-Based Security**: All access through unforgeable tokens
3. **Message-Passing IPC**: Deterministic, traceable communication
4. **Adapter Isolation**: No direct database access from business logic
5. **Formal Verification**: TLA+ specs for critical paths

---

## Kernel Boundary Contract (KBC)

The `@esta/kernel-boundary` package defines the formal interface between kernel and userland.

### Components

1. **Capability Enforcement Layer** (`capability.ts`)
   - Tenant-scoped, role-scoped callable capabilities
   - Unforgeable, revocable, and auditable access tokens
   - Monotonic attenuation (can only weaken, never strengthen)

2. **IPC Messaging Layer** (`ipc.ts`)
   - W3C Trace Context compatible for distributed tracing
   - Deterministic request/response semantics
   - Support for multiple transports (local, Kafka, Redis, WASM, Tauri)

3. **Adapter Isolation** (`adapter.ts`)
   - Formal repository interfaces
   - Tenant-scoped queries
   - Transaction support
   - Health checks

### Usage Example

```typescript
import {
  // Capability types
  Capability,
  CapabilityValidator,
  readOnlyRights,

  // IPC types
  Message,
  MessageBus,
  createLocalMessageBus,

  // Adapter types
  Repository,
  AdapterFactory,
} from '@esta/kernel-boundary';

// Create a message bus
const bus = createLocalMessageBus();

// Publish a command
await bus.publish(
  { transport: 'local', channel: 'accrual' },
  createCommand(
    generateMessageId(Date.now()),
    nowTimestamp(),
    'calculateAccrual',
    { employeeId: '123', hoursWorked: 40 },
    traceContext,
    authContext
  )
);
```

---

## Migration Path

### Phase 1: Foundation (Current)

- [x] Define TypeScript port of Gleam types
- [x] Create kernel-boundary package
- [x] Define adapter interfaces
- [ ] Create Firebase adapter implementation
- [ ] Migrate backend routes to use adapters

### Phase 2: Enforcement

- [ ] Implement capability validation middleware
- [ ] Add message bus for internal communication
- [ ] Create audit logging through adapters
- [ ] Remove direct Firebase imports from routes

### Phase 3: Verification

- [ ] Write TLA+ specs for critical paths
- [ ] Implement formal verification checks
- [ ] Add property-based testing
- [ ] Complete coverage of kernel contracts

### Phase 4: Optimization

- [ ] WASM compilation of Gleam kernel
- [ ] Tauri integration for desktop
- [ ] Performance optimization
- [ ] Multi-region deployment

---

## Design Principles

### 1. Explicitness

Every protocol behavior is explicitly defined in type signatures. No implicit behavior allowed.

```typescript
// BAD: Implicit behavior
function getUser(id: string) {
  return db.collection('users').doc(id).get();
}

// GOOD: Explicit interface
interface UserRepository {
  findById(id: string): Promise<AdapterResult<User | null>>;
}
```

### 2. Determinism

Identical inputs must produce identical outputs across executions.

```typescript
// Pure function - deterministic
export function calculateAccrual(hoursWorked: number): number {
  return hoursWorked / 30;
}
```

### 3. Isolation

Modules operate in isolated spaces with controlled communication.

```typescript
// All communication through message bus
await bus.publish(channel, message);

// Not direct function calls across boundaries
// await otherModule.doSomething(); // WRONG
```

### 4. Fault Tolerance

All failures are recoverable; no silent corruption.

```typescript
// Always return Result types
type AdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AdapterError };
```

### 5. Auditability

All state transitions are traceable and verifiable.

```typescript
// Every message has trace context
interface Message {
  traceContext: TraceContext;
  authContext: AuthContext;
  // ...
}
```

---

## Glossary

| Term           | Definition                                                   |
| -------------- | ------------------------------------------------------------ |
| **Kernel**     | Core infrastructure providing IPC, scheduling, and isolation |
| **Userland**   | Application code that uses kernel services                   |
| **Capability** | An unforgeable token granting specific rights to a resource  |
| **Adapter**    | Implementation of a formal interface for external services   |
| **IPC**        | Inter-Process Communication via message passing              |
| **FCR**        | Fault Containment Region - isolated failure domain           |
| **KBC**        | Kernel Boundary Contract - formal interface specification    |

---

## References

- [Kernel Contract Specification](../abi/kernel_contract.md)
- [Gleam Kernel Source](../../estalogic_kernel/src/)
- [Gleam Protocol Source](../../estalogic_protocol/src/)
- [Kernel Boundary Package](../../libs/kernel-boundary/)
