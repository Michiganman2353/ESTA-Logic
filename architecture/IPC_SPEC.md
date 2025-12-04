# ESTA Logic IPC Specification

## Overview

Inter-process communication in ESTA Logic uses typed message passing with explicit routing.

## Message Format

```
┌────────────────────────────────────────┐
│              Header (48 bytes)         │
├────────────────────────────────────────┤
│ Message ID (16 bytes)                  │
│ Source PID (4 bytes)                   │
│ Target PID (4 bytes)                   │
│ Sequence Number (8 bytes)              │
│ Timestamp (8 bytes)                    │
│ Priority (1 byte)                      │
│ Flags (1 byte)                         │
│ Payload Size (4 bytes)                 │
│ Reserved (2 bytes)                     │
├────────────────────────────────────────┤
│              Payload                   │
│ (variable size, max 1MB)               │
└────────────────────────────────────────┘
```

## Message Types

| Type | Value | Description |
|------|-------|-------------|
| Ping | 0x01 | Health check request |
| Pong | 0x02 | Health check response |
| AccrualRequest | 0x10 | Accrual calculation request |
| AccrualResponse | 0x11 | Accrual calculation response |
| AuditStart | 0x20 | Begin audit session |
| AuditRecord | 0x21 | Single audit record |
| AuditEnd | 0x22 | End audit session |
| SystemShutdown | 0xFF | System shutdown notification |

## Priority Levels

| Level | Value | Time Slice |
|-------|-------|------------|
| Low | 0 | 100ms |
| Normal | 1 | 25ms |
| High | 2 | 15ms |
| Critical | 3 | 10ms |

## Delivery Guarantees

- **Ordering**: Messages are delivered in FIFO order within priority classes
- **Reliability**: Messages are not lost but may be rejected if mailbox full
- **Acknowledgment**: Optional ACK for confirmed delivery

## Backpressure

When a mailbox is full, the behavior depends on the overflow mode:
- `DropNewest`: New message is discarded
- `DropOldest`: Oldest message is removed
- `BlockSender`: Sender is blocked until space available
- `NotifySender`: Sender receives failure notification
