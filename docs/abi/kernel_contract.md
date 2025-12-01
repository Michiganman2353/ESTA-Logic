# ESTA Logic Kernel Boundary Contract (KBC) Specification

**Version**: 1.0.0  
**Status**: Draft - Target Architecture  
**Last Updated**: 2025-12-01  
**NASA-Level Requirement**: No module shall implicitly define protocol behavior.

---

> **⚠️ Implementation Status**  
> This document describes the **target architecture** for ESTA-Logic. The current implementation
> is a modular monolith with formal type specifications. See [MICROKERNEL_STATUS.md](../architecture/MICROKERNEL_STATUS.md)
> for the current state and migration path.
>
> **What's Implemented:**
>
> - Gleam type specifications (`estalogic_kernel`, `estalogic_protocol`)
> - TypeScript port interfaces (`@esta/kernel-boundary`)
> - Pure business logic (`accrual-engine`, `esta-core`)
>
> **What's Planned:**
>
> - Runtime capability enforcement
> - Message-based IPC
> - WASM module execution
> - Formal verification

---

## Table of Contents

1. [Overview](#overview)
2. [Process Lifecycle Contract](#process-lifecycle-contract)
3. [Message-Passing Semantics](#message-passing-semantics)
4. [Scheduling Rules](#scheduling-rules)
5. [Memory Model](#memory-model)
6. [Error Handling & Escalation](#error-handling--escalation)
7. [Invariants & Guarantees](#invariants--guarantees)
8. [Formal Verification Targets](#formal-verification-targets)

---

## Overview

The ESTA Logic Microkernel provides a deterministic, safety-critical execution environment for WASM-based compliance logic. This document specifies the Application Binary Interface (ABI) that all kernel components and WASM modules must adhere to.

### Design Principles

1. **Explicitness**: Every protocol behavior must be explicitly defined in type signatures
2. **Determinism**: Identical inputs must produce identical outputs across executions
3. **Isolation**: WASM modules operate in isolated memory spaces with controlled communication
4. **Fault Tolerance**: All failures are recoverable; no silent corruption
5. **Auditability**: All state transitions are traceable and verifiable

### Terminology

| Term              | Definition                                                      |
| ----------------- | --------------------------------------------------------------- |
| **Process**       | A logical execution unit managed by the kernel scheduler        |
| **Message**       | An immutable, typed data packet sent between processes          |
| **Mailbox**       | A bounded, FIFO queue for incoming messages to a process        |
| **Capability**    | An unforgeable reference granting specific rights to a resource |
| **Linear Memory** | WASM's contiguous, growable byte array for module-local data    |

---

## Process Lifecycle Contract

### Process States

```
                      ┌─────────────┐
                      │   CREATED   │
                      └─────┬───────┘
                            │ spawn()
                            ▼
                      ┌─────────────┐
        timeout/      │   READY     │◀──────┐
        preempt       └─────┬───────┘       │
            ▲               │ schedule()    │
            │               ▼               │
            │         ┌─────────────┐       │
            └─────────│   RUNNING   │───────┘
                      └─────┬───────┘  yield()
                            │
               ┌────────────┼────────────┐
               │            │            │
               ▼            ▼            ▼
         ┌──────────┐ ┌──────────┐ ┌───────────┐
         │ WAITING  │ │ BLOCKED  │ │ COMPLETED │
         └────┬─────┘ └────┬─────┘ └───────────┘
              │            │
              │ msg_recv() │ resource_ready()
              │            │
              └────────────┴────────────▶ READY
```

### State Transition Rules

#### CREATED → READY

- **Trigger**: `spawn(module_id, entry_point, initial_args)`
- **Precondition**: Module is loaded and validated
- **Postcondition**: Process added to ready queue with assigned PID
- **Invariant**: Process memory is initialized to zero-state

#### READY → RUNNING

- **Trigger**: Scheduler selects process
- **Precondition**: Process is at front of priority queue
- **Postcondition**: CPU context restored, time slice allocated
- **Invariant**: At most one process per core in RUNNING state

#### RUNNING → WAITING

- **Trigger**: `receive_message(timeout_ms)`
- **Precondition**: Mailbox is empty
- **Postcondition**: Process removed from scheduler until message arrives or timeout
- **Invariant**: No busy-waiting; scheduler reclaims time slice

#### RUNNING → BLOCKED

- **Trigger**: Async I/O request
- **Precondition**: Valid capability for requested resource
- **Postcondition**: Process suspended pending resource availability
- **Invariant**: Blocked processes do not consume CPU cycles

#### RUNNING → COMPLETED

- **Trigger**: Normal return from entry point or explicit `exit(code)`
- **Precondition**: None
- **Postcondition**: Process resources reclaimed, exit notification sent to supervisor
- **Invariant**: All messages in outbox are delivered before termination

### Process Termination Guarantees

1. **Graceful Exit**: Process may complete pending operations within grace period
2. **Forced Exit**: Supervisor may force termination after timeout
3. **Resource Cleanup**: All resources are reclaimed in reverse allocation order
4. **Message Delivery**: Messages in transit are guaranteed delivery or explicit failure notification

---

## Message-Passing Semantics

### Message Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         Message Header                          │
├─────────────┬─────────────┬─────────────┬─────────────┬────────┤
│  Source PID │  Target PID │  Sequence # │  Timestamp  │ Flags  │
│   (32 bit)  │   (32 bit)  │   (64 bit)  │   (64 bit)  │ (8 bit)│
├─────────────┴─────────────┴─────────────┴─────────────┴────────┤
│                         Message Type                            │
│                         (32 bit enum)                           │
├─────────────────────────────────────────────────────────────────┤
│                         Payload Length                          │
│                           (32 bit)                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                          Payload Data                           │
│                      (variable length)                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Ordering Guarantees

#### FIFO Per-Channel

Messages between any pair of processes (A, B) are delivered in the order sent.

**Formal Property**:

```
∀ m1, m2 ∈ Messages:
  (src(m1) = src(m2)) ∧ (dst(m1) = dst(m2)) ∧ (send_time(m1) < send_time(m2))
  ⟹ receive_time(m1) < receive_time(m2)
```

#### No Global Ordering

Messages from different sources to the same destination may be interleaved.

#### Causality Preservation

If process A sends m1 to B, then sends m2 to C, and B forwards m1' to C:

```
receive_time(m1') may be before or after receive_time(m2)
```

### Backpressure Mechanism

#### Mailbox Capacity

Each process has a bounded mailbox:

- **Default capacity**: 1024 messages
- **High-priority processes**: 4096 messages
- **System processes**: 16384 messages

#### Overflow Behavior

| Mode            | Behavior                   | Use Case                         |
| --------------- | -------------------------- | -------------------------------- |
| `DROP_NEWEST`   | Discard incoming message   | Telemetry, non-critical updates  |
| `DROP_OLDEST`   | Remove oldest, accept new  | Streaming with latest-wins       |
| `BLOCK_SENDER`  | Suspend sender until space | Critical, at-least-once delivery |
| `NOTIFY_SENDER` | Return failure immediately | Soft real-time systems           |

Default mode: `NOTIFY_SENDER`

### Queue Semantics

#### Receive Patterns

```gleam
// Selective receive with pattern matching
receive {
  pattern { tag: "accrual", data: d } -> handle_accrual(d)
  pattern { tag: "audit", data: d } -> handle_audit(d)
  after 5000 -> handle_timeout()
}
```

#### Priority Levels

Messages may carry priority hints (0-7, higher = more urgent).
High-priority messages are delivered before lower-priority ones in the same mailbox.

**Note**: Priority does not violate FIFO within same source-destination-priority tuple.

---

## Scheduling Rules

### Priority Levels

| Level | Name     | Description          | Preemptible |
| ----- | -------- | -------------------- | ----------- |
| 0     | IDLE     | Background tasks     | Yes         |
| 1     | LOW      | Batch processing     | Yes         |
| 2     | NORMAL   | Standard operations  | Yes         |
| 3     | HIGH     | User-facing requests | Yes         |
| 4     | REALTIME | Compliance deadlines | Limited     |
| 5     | SYSTEM   | Kernel operations    | No          |

### Time Slice Allocation

| Priority | Base Slice (ms) | Max Consecutive Slices |
| -------- | --------------- | ---------------------- |
| IDLE     | 100             | 1                      |
| LOW      | 50              | 2                      |
| NORMAL   | 25              | 4                      |
| HIGH     | 15              | 8                      |
| REALTIME | 10              | 16                     |
| SYSTEM   | N/A             | Runs to completion     |

### Preemption Rules

1. **Higher Priority Preempts**: A higher-priority process preempts any lower-priority running process
2. **Cooperative Within Level**: Same-priority processes use cooperative scheduling
3. **Slice Exhaustion**: Process returns to ready queue after time slice expires
4. **Yield Point**: WASM modules must yield at explicit safe points (at least every 1M instructions)

### Starvation Prevention

#### Aging Mechanism

Processes gain priority credit over time spent waiting:

```
effective_priority = base_priority + floor(wait_time_ms / 1000)
```

Maximum effective priority boost: +2 levels (cannot exceed REALTIME)

#### Minimum Service Guarantee

Every process in READY state is guaranteed at least one time slice per:

- 100ms for IDLE priority
- 50ms for LOW priority
- 25ms for NORMAL and above

#### Fairness Metric

The scheduler maintains fairness ratio:

```
fairness = min(actual_cpu_time / expected_cpu_time) for all processes
```

Target: fairness ≥ 0.8 over any 10-second window

---

## Memory Model

### Memory Regions

```
┌───────────────────────────────────────────────────────────────────┐
│                     Kernel Space (Shared)                         │
├───────────────────────────────────────────────────────────────────┤
│  Process Table  │  Message Buffers  │  Capability Table  │ Logs  │
├─────────────────┴───────────────────┴────────────────────┴───────┤
│                                                                   │
│                     WASM Linear Memory (Per-Module)               │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Module A   │  │   Module B   │  │   Module C   │    ...     │
│  │   (64 KB)    │  │   (256 KB)   │  │   (128 KB)   │            │
│  └──────────────┘  └──────────────┘  └──────────────┘            │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

### Shared Memory Rules

| Region           | Access            | Mutability             | Synchronization  |
| ---------------- | ----------------- | ---------------------- | ---------------- |
| Process Table    | Kernel only       | Mutable                | Spinlock         |
| Message Buffers  | Producer/Consumer | Append-only            | Lock-free queue  |
| Capability Table | Kernel only       | Mutable                | RCU              |
| Audit Logs       | Append-only       | Immutable once written | Sequential write |

### WASM Linear Memory

#### Isolation Guarantees

- Each WASM module has exclusive access to its linear memory
- No direct pointer sharing between modules
- All inter-module data transfer via message-passing

#### Memory Limits

| Module Type       | Initial | Maximum | Growth Step |
| ----------------- | ------- | ------- | ----------- |
| User Logic        | 64 KB   | 16 MB   | 64 KB       |
| System            | 256 KB  | 64 MB   | 256 KB      |
| Compliance Engine | 128 KB  | 32 MB   | 128 KB      |

#### Access Patterns

**Monotonic Access (Required for determinism)**:

```
∀ read r at address a, time t:
  ∃ write w at address a, time t' < t:
    value(r) = value(w) ∧ ∀ w' between w and r: address(w') ≠ a
```

**Linear Type Guards**:

- Mutable references are unique (affine typing)
- Shared references are immutable
- Ownership transfer is explicit

---

## Error Handling & Escalation

### Error Categories

| Category        | Code Range | Severity | Recovery                |
| --------------- | ---------- | -------- | ----------------------- |
| USER_ERROR      | 1000-1999  | Info     | Process handles         |
| LOGIC_ERROR     | 2000-2999  | Warning  | Retry with backoff      |
| RESOURCE_ERROR  | 3000-3999  | Error    | Supervisor intervention |
| INTEGRITY_ERROR | 4000-4999  | Critical | Module isolation        |
| SYSTEM_ERROR    | 5000-5999  | Fatal    | System restart          |

### Panic Semantics

When a WASM module traps:

1. **Immediate Suspension**: Execution halts at trap point
2. **State Capture**: Current stack and registers are preserved
3. **Supervisor Notification**: Parent process receives crash report
4. **Escalation Decision**: Supervisor chooses recovery strategy

### Escalation Ladder

```
Level 1: Process Restart (same state)
         ↓ (3 failures in 60s)
Level 2: Process Restart (clean state)
         ↓ (3 failures in 60s)
Level 3: Module Reload
         ↓ (3 failures in 60s)
Level 4: Supervisor Restart
         ↓ (failure)
Level 5: System Restart
```

### Trap Types

| Trap                | Code | Description                   | Recoverable |
| ------------------- | ---- | ----------------------------- | ----------- |
| UNREACHABLE         | 4001 | Explicit trap instruction     | No          |
| INTEGER_DIV_BY_ZERO | 4002 | Division by zero              | No          |
| INTEGER_OVERFLOW    | 4003 | Integer operation overflow    | No          |
| OUT_OF_BOUNDS       | 4004 | Memory access violation       | No          |
| INDIRECT_CALL_TYPE  | 4005 | Indirect call type mismatch   | No          |
| STACK_OVERFLOW      | 4006 | Call stack exhausted          | No          |
| TIMEOUT             | 3001 | Execution time limit exceeded | Yes         |
| OOM                 | 3002 | Memory allocation failed      | Yes         |

---

## Invariants & Guarantees

### System Invariants

1. **Progress**: If any process is in READY state, some process will make progress
2. **Bounded Wait**: Every message is delivered or explicitly failed within bounded time
3. **Isolation**: A faulting module cannot corrupt another module's memory
4. **Determinism**: Given identical inputs and scheduling, output is identical
5. **Auditability**: Every state transition is logged and verifiable

### Safety Properties

```tla+
SafetyInvariant ==
  /\ \A p \in Processes: p.state \in {CREATED, READY, RUNNING, WAITING, BLOCKED, COMPLETED}
  /\ \A m \in Messages: m.source \in Processes /\ m.target \in Processes
  /\ Cardinality({p \in Processes: p.state = RUNNING}) <= NumCores
  /\ \A p \in Processes: p.mailbox.size <= p.mailbox.capacity
```

### Liveness Properties

```tla+
LivenessProperty ==
  /\ <>[]((\E p \in Processes: p.state = READY) => (\E p \in Processes: p.state = RUNNING))
  /\ \A m \in Messages: <>(m.delivered \/ m.failed)
  /\ \A p \in Processes: [](p.state = WAITING => <>(p.state # WAITING))
```

---

## Formal Verification Targets

### TLA+ Model Checking

| Property           | Type     | Status   |
| ------------------ | -------- | -------- |
| No Deadlock        | Safety   | Required |
| Message Delivery   | Liveness | Required |
| Starvation Freedom | Liveness | Required |
| Memory Safety      | Safety   | Required |
| Priority Inversion | Safety   | Required |

### Coverage Requirements

| Component         | Function Coverage | Branch Coverage |
| ----------------- | ----------------- | --------------- |
| Scheduler         | 100%              | ≥ 95%           |
| Message Queue     | 100%              | ≥ 95%           |
| Process Manager   | 100%              | ≥ 95%           |
| Memory Manager    | 100%              | ≥ 95%           |
| Capability System | 100%              | ≥ 95%           |

---

## Appendix A: ABI Function Signatures

See `estalogic_kernel/abi.gleam` for the complete type-level representation of this specification.

## Appendix B: Message Type Registry

| Type ID | Name             | Payload Schema |
| ------- | ---------------- | -------------- |
| 0x0001  | PING             | Empty          |
| 0x0002  | PONG             | Empty          |
| 0x0010  | ACCRUAL_REQUEST  | AccrualParams  |
| 0x0011  | ACCRUAL_RESPONSE | AccrualResult  |
| 0x0020  | AUDIT_START      | AuditContext   |
| 0x0021  | AUDIT_RECORD     | AuditEntry     |
| 0x0022  | AUDIT_END        | AuditSummary   |
| 0xFFFF  | SYSTEM_SHUTDOWN  | ShutdownReason |

## Appendix C: Revision History

| Version | Date       | Author    | Changes               |
| ------- | ---------- | --------- | --------------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial specification |
