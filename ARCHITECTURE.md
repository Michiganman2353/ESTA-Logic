# ESTA-Logic Microkernel Architecture

> **Single Source of Truth for System Architecture**

## Overview

ESTA-Logic is a **WASM-native microkernel compliance OS** where:

- The **kernel orchestrates** all operations
- **Sandboxed WASM modules** perform deterministic compliance computation
- **Services communicate only via IPC** - no direct imports
- **All host access is mediated** through syscalls
- **Capabilities control all resource access**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ESTA-Logic System                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   Accrual   │  │ Compliance  │  │  Employee   │  │    Time     │       │
│   │   Engine    │  │   Engine    │  │   Service   │  │   Service   │       │
│   │   (WASM)    │  │   (WASM)    │  │   (WASM)    │  │   (WASM)    │       │
│   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │
│          │                │                │                │               │
│          └────────────────┼────────────────┼────────────────┘               │
│                           │                │                                 │
│                           ▼                ▼                                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         KERNEL IPC ROUTER                            │   │
│   │              (Message Passing, Priority Queues, Routing)             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                           │                │                                 │
│            ┌──────────────┼────────────────┼──────────────┐                 │
│            ▼              ▼                ▼              ▼                 │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│   │  Scheduler  │ │ Capability  │ │   Module    │ │   Syscall   │          │
│   │             │ │   Engine    │ │   Loader    │ │  Interface  │          │
│   └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                         HOST SHELL (Tauri)                           │   │
│   │        (File System, Network, Database, Clock, Notifications)        │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Core Principles

### 1. Kernel is the Conductor

Every module is an instrument. The kernel is the conductor. Nothing plays out of tune.

- All scheduling decisions go through the kernel
- All message routing goes through the kernel
- All capability validation goes through the kernel
- All host access goes through the kernel

### 2. No Direct Service-to-Service Communication

Services NEVER import from each other. All communication is via IPC messages:

```typescript
// ❌ WRONG - Direct import
import { calculateAccrual } from '../accrual-engine';

// ✅ CORRECT - IPC message
const response = await kernel.send({
  type: 'Command',
  target: 'accrual-engine',
  opcode: 'accrual.calculate',
  payload: { employeeId, hoursWorked },
});
```

### 3. Capability-Based Security

Every resource access requires a capability token:

```typescript
// Module manifest declares required capabilities
{
  requiredCapabilities: [
    {
      resourceType: 'channel',
      resourcePattern: 'accrual.*',
      rights: { read: true, write: true },
      reason: 'Receive accrual requests',
    },
  ];
}
```

### 4. Deterministic Execution

All WASM modules must be deterministic:

- No direct time access (use `sys.time.now`)
- No random number generation without seed
- No external I/O (all via syscalls)
- Same inputs always produce same outputs

### 5. Host Access via Syscalls Only

Modules never access host resources directly:

```typescript
// ❌ WRONG - Direct host access
const now = Date.now();
const data = await fetch(url);

// ✅ CORRECT - Syscall
const now = await syscall({ syscall: 'sys.time.now' });
const data = await syscall({ syscall: 'sys.net.fetch', url, method: 'GET' });
```

## UX Experience Contract Layer

### Philosophy: UX Drives the Machine

**"This is a calming, guided experience that just happens to be backed by advanced compliance technology."**

The system must be:
- **Correct** ✅ (we have this)
- **Understandable** ✅ (now guaranteed)
- **Emotionally Trustworthy** ✅ (now guaranteed)

**📖 Complete Documentation: [UX Response API Guide](./docs/api/README.md)**

### The Contract

Every engine output MUST implement the `ExperienceResponse` interface:

```typescript
{
  // Primary decision
  decision: 'APPROVED' | 'DENIED' | 'NEEDS_INFORMATION' | ...,
  
  // Human-readable WHY
  explanation: "Based on Michigan ESTA regulations, you earned 2.5 hours...",
  
  // What this specifically means for the user
  humanMeaning: "Your sick time balance is now 15.5 hours, giving you peace of mind.",
  
  // Risk transparency
  riskLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  
  // Confidence transparency (0-100)
  confidenceScore: 98,
  
  // Emotional reassurance
  reassuranceMessage: {
    message: "You are fully compliant and on track.",
    context: "All calculations follow Michigan ESTA 2025 exactly.",
    tone: 'positive',
    emphasize: true,
  },
  
  // Clear next steps
  nextSteps: [
    {
      category: 'ACTION_REQUIRED' | 'INFORMATION' | 'RECOMMENDATION',
      title: "Review your balance",
      description: "View your complete sick time history.",
      priority: 'low' | 'medium' | 'high' | 'urgent',
      estimatedMinutes: 3,
      helpLink: '/dashboard/sick-time',
    }
  ],
  
  // Legal context in plain English
  legalReferences: [
    {
      citation: "Michigan ESTA 2025, Section 3(a)",
      summary: "Employees accrue 1 hour per 30 hours worked",
      relevanceExplanation: "This law defines your accrual rate.",
      officialLink: "https://...",
    }
  ],
  
  // Raw engine output (optional, for advanced users)
  technicalDetails: { ... },
  
  // Metadata
  timestamp: "2024-01-15T10:30:00Z",
  sourceEngine: "accrual-engine",
  responseId: "uuid",
}
```

### Benefits

1. **UX Never Interprets Raw Logic**
   - No guesswork about what violations mean
   - No custom mapping logic in frontend
   - Consistent experience across all features

2. **Trust Built Into Every Interaction**
   - Every decision includes reassurance
   - Confidence scores show transparency
   - Risk levels set proper expectations

3. **Users Never Feel Abandoned**
   - Every response includes next steps
   - Clear priorities guide action
   - Help links provide depth when needed

4. **Safe to Change Logic Without Breaking UX**
   - Contract isolates engines from UI
   - Changes to calculations don't require UI updates
   - Experience layer adapts automatically

### Usage Patterns

#### For Raw Technical Responses
```typescript
// Old way - raw calculation
const response = await kernel.send({
  opcode: 'accrual.calculate',
  payload: request,
});
// Result: { hoursAccrued: 2.5, newBalance: 15.5, ... }
```

#### For UX-Enhanced Responses
```typescript
// New way - experience-enhanced
const response = await kernel.send({
  opcode: 'accrual.calculate.experience',
  payload: request,
});
// Result: Full ExperienceResponse with explanations, reassurance, next steps
```

Both are supported. Use `.experience` suffix for UX-facing operations.

### Timing Guarantees

The experience layer adds negligible overhead (< 1ms) because:
- Transformations are pure functions
- No async operations
- No external calls
- All text is pre-templated

Performance metadata is included in every response:

```typescript
{
  performance: {
    computationTimeMs: 2.3,
    wasCached: false,
    exceededTargetTime: false,
    targetTimeMs: 100,
  }
}
```

### Preventing Breaking Changes

The contract ensures:
1. **Engines can evolve independently** - Only the transformer needs updating
2. **UX remains stable** - Interface never changes
3. **No cascade failures** - Experience layer catches and explains errors
4. **Safe experimentation** - Try new logic without touching UI

This solves the branching complexity problem: changes are localized and tested independently.

### Documentation

For detailed implementation guides and examples:

- **[UX Response API Guide](./docs/api/UX_RESPONSE_API_GUIDE.md)** — Complete specification and examples
- **[Quick Reference](./docs/api/DECISION_EXPLANATION_QUICKREF.md)** — One-page cheat sheet
- **[Integration Examples](./docs/api/INTEGRATION_EXAMPLES.md)** — Real-world patterns
- **[Type Definitions](./libs/shared-types/src/ux-experience-contract.ts)** — TypeScript source

## Directory Structure

```
/
├── kernel/                      # Microkernel core
│   ├── core/                    # Core kernel modules
│   │   ├── scheduler.ts         # Process scheduling
│   │   ├── ipc-router.ts        # Message routing
│   │   ├── capability-engine.ts # Capability validation
│   │   └── index.ts
│   ├── abi/                     # WASM ABI definitions
│   │   ├── messages.ts          # Canonical message schema
│   │   └── index.ts
│   ├── loader/                  # Module lifecycle
│   │   ├── module-loader.ts     # Load, unload, hot-swap
│   │   └── index.ts
│   ├── syscalls/                # System call interface
│   │   ├── syscalls.ts          # All syscall definitions
│   │   └── index.ts
│   ├── utils/                   # Shared utilities
│   │   └── index.ts
│   └── index.ts
│
├── services/                    # WASM service modules
│   ├── accrual-engine/          # Sick time accrual
│   │   ├── manifest.ts          # Module manifest
│   │   ├── capabilities.json    # Capability declarations
│   │   ├── handlers/            # Message handlers
│   │   └── index.ts
│   ├── compliance-engine/       # ESTA compliance checking
│   │   ├── manifest.ts
│   │   ├── capabilities.json
│   │   ├── handlers/
│   │   └── index.ts
│   ├── employee-service/        # Employee management
│   └── time-service/            # Time tracking
│
├── estalogic_kernel/            # Gleam kernel specifications
│   └── src/
│       ├── abi.gleam            # ABI types
│       ├── isolation/           # Guardrails
│       ├── runtime/             # WASM safety
│       ├── realtime/            # Timing constraints
│       ├── redundancy/          # Dual-core support
│       └── security/            # Capability system
│
├── estalogic_protocol/          # Gleam protocol definitions
│   └── src/
│       ├── message.gleam        # Message types
│       └── reliability.gleam    # Delivery guarantees
│
├── estalogic_drivers/           # Gleam driver contracts
│   ├── kafka/
│   ├── redis/
│   └── postgres/
│
├── estalogic_observe/           # Gleam observability
│   └── src/
│       ├── log_integrity.gleam
│       └── tracing.gleam
│
├── libs/                        # Shared libraries
│   ├── kernel-boundary/         # TypeScript IPC/Capability types
│   ├── accrual-engine/          # Reference implementation
│   └── shared-types/            # Common TypeScript types
│
└── apps/                        # Applications
    ├── frontend/                # React web app
    ├── backend/                 # Express API server
    └── desktop/                 # Tauri desktop app
```

## Message Schema

All IPC messages follow this canonical schema:

```typescript
interface IPCMessage<T = unknown> {
  type: 'Event' | 'Command' | 'Response' | 'Query' | 'System';
  source: string; // Module ID
  target: string | 'kernel';
  opcode: string; // e.g., 'accrual.calculate'
  payload: T;
  metadata: {
    messageId: string;
    correlationId?: string; // For request/response
    timestamp: string; // ISO 8601
    priority: 'background' | 'low' | 'normal' | 'high' | 'critical';
    ttlMs?: number;
    trace?: TraceContext;
    schemaVersion: number;
  };
}
```

## Capability Model

Capabilities are unforgeable tokens that grant resource access:

```typescript
interface Capability {
  id: CapabilityId;
  resource: {
    resourceType: ResourceType; // 'channel' | 'database' | 'file' | ...
    resourcePath: string; // Pattern like 'accrual.*'
    tenantId: string;
  };
  rights: {
    read: boolean;
    write: boolean;
    delete: boolean;
    execute: boolean;
    create: boolean;
    list: boolean;
    delegate: boolean;
    revoke: boolean;
  };
  validity: {
    expiresAt?: number;
    maxUseCount: number;
    useCount: number;
  };
}
```

## Syscall Interface

All host interactions go through syscalls:

| Syscall            | Description              |
| ------------------ | ------------------------ |
| `sys.fs.read`      | Read file content        |
| `sys.fs.write`     | Write file content       |
| `sys.fs.delete`    | Delete file              |
| `sys.net.fetch`    | HTTP request             |
| `sys.net.socket.*` | Socket operations        |
| `sys.time.now`     | Get current time         |
| `sys.db.read`      | Read from database       |
| `sys.db.write`     | Write to database        |
| `sys.db.query`     | Query database           |
| `sys.db.transact`  | Transaction              |
| `sys.audit.log`    | Write audit log          |
| `sys.proc.spawn`   | Spawn process            |
| `sys.proc.kill`    | Kill process             |
| `sys.crypto.*`     | Cryptographic operations |

## Scheduling

The kernel uses priority-based preemptive scheduling:

| Priority   | Time Slice | Use Case              |
| ---------- | ---------- | --------------------- |
| `system`   | Unlimited  | Kernel operations     |
| `realtime` | 10ms       | Compliance checks     |
| `high`     | 15ms       | User requests         |
| `normal`   | 25ms       | Background processing |
| `low`      | 50ms       | Batch operations      |
| `idle`     | 100ms      | Maintenance tasks     |

Anti-starvation: Processes waiting >1s get priority boost.

## Invariants

These invariants must always hold:

1. **No Direct Imports**: Services never import from other services
2. **Capability Required**: All resource access requires valid capability
3. **Kernel Mediation**: All host access goes through kernel syscalls
4. **Deterministic WASM**: All WASM modules are deterministic
5. **Audit Trail**: All compliance operations are logged
6. **Message Validation**: All messages validated at kernel boundary
7. **Resource Limits**: All modules have bounded memory and CPU

## Testing

Architecture tests verify these invariants:

```typescript
// Test: No forbidden imports
test('services do not import from each other', () => {
  // Scan import statements
  // Verify no cross-service imports
});

// Test: All messages are valid
test('messages pass schema validation', () => {
  // Validate message structure
  // Verify required fields
});

// Test: Capabilities are enforced
test('resource access requires capability', () => {
  // Attempt access without capability
  // Verify rejection
});
```

## Migration Path

For existing code:

1. Move business logic into services with manifests
2. Replace direct imports with IPC messages
3. Replace host calls with syscalls
4. Add capability declarations to manifests
5. Add architecture tests to CI

## References

- `kernel/` - TypeScript kernel implementation
- `estalogic_kernel/` - Gleam kernel specifications
- `services/` - WASM service modules
- `libs/kernel-boundary/` - TypeScript IPC types
