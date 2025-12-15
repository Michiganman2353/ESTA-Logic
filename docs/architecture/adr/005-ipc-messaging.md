# ADR 005: IPC Message-Passing Architecture

**Status**: Implemented (Partial)  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team  
**Replaces**: N/A

## Context

ESTA-Logic requires deterministic, traceable communication between components for:

1. **Audit Trails**: Every operation must be traceable
2. **Distributed Tracing**: Correlation across services
3. **Decoupling**: Components should be loosely coupled
4. **Fault Isolation**: Failures shouldn't cascade
5. **Multi-Runtime**: Works across Node.js, browser, WASM, Tauri

### Current State

The `@esta/kernel-boundary` package provides TypeScript types for message-passing, but runtime implementation varies by environment:

| Environment  | Transport      | Status      |
| ------------ | -------------- | ----------- |
| Local (Node) | In-memory      | Implemented |
| Web Workers  | `postMessage`  | Planned     |
| Tauri IPC    | Tauri Commands | Planned     |
| Kafka        | Kafka Streams  | Specified   |
| Redis        | Redis Pub/Sub  | Specified   |

## Decision

We adopt a **unified message envelope** with pluggable transports.

### Message Envelope

```
┌─────────────────────────────────────────────────────────────────┐
│                        Message Envelope                          │
├─────────────────────────────────────────────────────────────────┤
│  Header                                                          │
│  ┌───────────────┬───────────────┬───────────────┬────────────┐ │
│  │   messageId   │  correlationId│   timestamp   │  priority  │ │
│  │   (UUID)      │   (UUID)      │   (ISO 8601)  │  (0-7)     │ │
│  └───────────────┴───────────────┴───────────────┴────────────┘ │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Trace Context (W3C Trace Context)             │  │
│  │   traceId  │  spanId  │  traceFlags  │  traceState        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                    Auth Context                            │  │
│  │   principal  │  claims  │  tenantId  │  capabilities      │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Message Type                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  command | query | event | response | system              │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  name: string  │  version: string  │  data: T       │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Payload                                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  JSON-serializable data (validated by Zod schemas)        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Message Types

| Type       | Description                        | Example                 |
| ---------- | ---------------------------------- | ----------------------- |
| `command`  | Request to modify state            | `CreateEmployee`        |
| `query`    | Request for data (no state change) | `GetEmployeeById`       |
| `event`    | Notification of state change       | `EmployeeCreated`       |
| `response` | Reply to command/query             | `CreateEmployeeResult`  |
| `system`   | Infrastructure messages            | `Heartbeat`, `Shutdown` |

### Transport Abstraction

```typescript
// libs/kernel-boundary/src/ipc.ts
export interface ChannelAddress {
  transport: Transport;
  channel: string;
  partition?: number;
}

export type Transport =
  | 'local' // In-memory
  | 'worker' // Web Workers
  | 'tauri' // Tauri IPC
  | 'kafka' // Kafka Streams
  | 'redis' // Redis Pub/Sub
  | 'http'; // HTTP/REST (fallback)

export interface MessageBus {
  publish<T>(channel: ChannelAddress, message: Message<T>): Promise<void>;

  subscribe<T>(
    channel: ChannelAddress,
    handler: MessageHandler<T>
  ): Promise<Subscription>;

  request<Req, Res>(
    channel: ChannelAddress,
    message: Message<Req>,
    timeout?: Duration
  ): Promise<Message<Res>>;
}
```

## Implementation

### Local Message Bus

```typescript
// libs/kernel-boundary/src/ipc.ts
export function createLocalMessageBus(): MessageBus {
  const handlers = new Map<string, Set<MessageHandler<unknown>>>();
  const pending = new Map<string, PendingRequest>();

  return {
    async publish(channel, message) {
      const key = channelKey(channel);
      const channelHandlers = handlers.get(key);
      if (channelHandlers) {
        for (const handler of channelHandlers) {
          await handler(message);
        }
      }
    },

    async subscribe(channel, handler) {
      const key = channelKey(channel);
      if (!handlers.has(key)) {
        handlers.set(key, new Set());
      }
      handlers.get(key)!.add(handler as MessageHandler<unknown>);
      return {
        unsubscribe: () =>
          handlers.get(key)?.delete(handler as MessageHandler<unknown>),
      };
    },

    async request(channel, message, timeout = { milliseconds: 30000 }) {
      // ... request/response implementation
    },
  };
}
```

### Trace Context Propagation

```typescript
// W3C Trace Context compliant
export interface TraceContext {
  traceId: TraceId; // 32 hex chars
  spanId: SpanId; // 16 hex chars
  traceFlags: TraceFlags;
  traceState: TraceStateEntry[];
}

// Propagate across boundaries
export function propagateTrace(
  incoming: TraceContext,
  operationName: string
): TraceContext {
  return {
    traceId: incoming.traceId,
    spanId: generateSpanId(), // New span for this operation
    traceFlags: incoming.traceFlags,
    traceState: incoming.traceState,
  };
}
```

### Message Construction Helpers

```typescript
// Create a command message
const command = createCommand(
  generateMessageId(Date.now()),
  nowTimestamp(),
  'CreateEmployee',
  { name: 'John Doe', tenantId: 'tenant-123' },
  traceContext,
  authContext
);

// Create an event message
const event = createEvent(
  generateMessageId(Date.now()),
  nowTimestamp(),
  'EmployeeCreated',
  { employeeId: 'emp-456', name: 'John Doe' },
  traceContext,
  authContext
);
```

## Flow Diagrams

### Command/Response Flow

```
┌─────────────┐                    ┌─────────────┐
│   Frontend  │                    │   Backend   │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │  Command: CreateEmployee         │
       │  correlationId: abc-123          │
       │──────────────────────────────────>
       │                                  │
       │                         Validate capability
       │                         Execute business logic
       │                         Emit EmployeeCreated event
       │                                  │
       │  Response: CreateEmployeeResult  │
       │  correlationId: abc-123          │
       │<──────────────────────────────────
       │                                  │
```

### Event Fan-Out

```
                    ┌──────────────┐
                    │ Event Source │
                    └──────┬───────┘
                           │
           EmployeeCreated │
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Accrual Svc  │  │  Audit Log   │  │ Notification │
│ (init accrual)│  │ (log event)  │  │ (send email) │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Consequences

### Positive

- **Traceability**: Every message has trace context for debugging
- **Decoupling**: Components communicate via messages, not direct calls
- **Testability**: Easy to mock message bus for testing
- **Auditability**: All messages can be logged for compliance
- **Flexibility**: Swap transports without changing business logic

### Negative

- **Complexity**: More infrastructure than direct function calls
- **Latency**: Serialization/deserialization overhead
- **Debugging**: Harder to follow execution flow

### Mitigations

- **Local Transport**: Zero-copy for in-process messages
- **Structured Logging**: Trace IDs in all log entries
- **Dev Tools**: Message inspector for debugging

## References

- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Kernel Boundary Package](../../libs/kernel-boundary/)
- [Gleam Protocol Types](../../estalogic_protocol/)

## Revision History

| Version | Date       | Author    | Changes          |
| ------- | ---------- | --------- | ---------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial decision |
