# ESTA-Logic Pilot Agent Session

## Overview

The Pilot Agent Session service is a high-level orchestration layer that coordinates complex, multi-step compliance workflows across ESTA-Logic's microkernel architecture. It demonstrates the power of the IPC-based message passing system by seamlessly coordinating between multiple specialized logic engines.

## Purpose

### What is a Pilot Agent Session?

A pilot agent session represents a complete end-to-end compliance scenario for an employee:

1. **Session Initialization** - Set up employee and employer context
2. **Accrual Calculation** - Calculate sick time accrual via the accrual-engine
3. **Compliance Validation** - Verify compliance via the compliance-engine
4. **Audit Trail Generation** - Create comprehensive audit records
5. **Result Synthesis** - Return unified session outcome

### Why Does This Exist?

The pilot agent session serves multiple critical purposes:

- **Demonstrates Kernel Architecture** - Shows how services coordinate via IPC without direct imports
- **Provides Reference Implementation** - Serves as a template for building complex workflows
- **Validates System Integration** - Proves that the microkernel design works for real-world scenarios
- **Enables End-to-End Testing** - Allows testing complete compliance workflows deterministically

## Architecture

### Design Principles

1. **Stateless Orchestration** - All state is passed via IPC messages, never stored
2. **No Direct Imports** - Communicates only through kernel message passing
3. **Deterministic Logic** - Same inputs always produce same outputs
4. **Comprehensive Auditing** - Every step is logged for compliance verification

### Message Flow

```
Client Request
    ↓
┌─────────────────────────────────────┐
│  Pilot Agent Session                │
├─────────────────────────────────────┤
│  1. Initialize session state        │
│  2. Prepare accrual calculation     │
└─────────────────┬───────────────────┘
                  │ IPC Message
                  ↓
        ┌──────────────────┐
        │  Accrual Engine  │
        │  (Calculate)     │
        └──────┬───────────┘
               │ Result
               ↓
┌─────────────────────────────────────┐
│  Pilot Agent Session                │
│  3. Process accrual result          │
│  4. Prepare compliance check        │
└─────────────────┬───────────────────┘
                  │ IPC Message
                  ↓
      ┌────────────────────────┐
      │  Compliance Engine     │
      │  (Validate)            │
      └──────┬─────────────────┘
             │ Result
             ↓
┌─────────────────────────────────────┐
│  Pilot Agent Session                │
│  5. Process compliance result       │
│  6. Finalize session                │
│  7. Return unified result           │
└─────────────────────────────────────┘
```

## Usage

### Basic Session Execution

```typescript
import { startSession, finalizeSession } from './services/pilot-agent-session';

// Initialize a session
const sessionRequest = {
  sessionId: 'session-001',
  employeeId: 'EMP-123',
  employerId: 'EMPLOYER-456',
  employerSize: 'large',
  periodStart: '2025-01-01',
  periodEnd: '2025-01-15',
  hoursWorked: 80,
  existingBalance: 10,
  carryoverFromPreviousYear: 5,
};

// Start the session
const sessionState = startSession(sessionRequest);

// Orchestration continues via IPC messages...
// (See demo/pilot-session-demo.ts for complete example)
```

### Session Operations

The service exposes these operation codes via IPC:

| Opcode | Purpose | Input | Output |
|--------|---------|-------|--------|
| `session.start` | Initialize new session | `SessionStartRequest` | `SessionState` |
| `session.prepare_accrual` | Prepare accrual calculation | `SessionState` | Accrual IPC message + updated state |
| `session.process_accrual` | Process accrual results | `SessionState` + accrual result | Updated `SessionState` |
| `session.prepare_compliance` | Prepare compliance check | `SessionState` + accrual result | Compliance IPC message + updated state |
| `session.process_compliance` | Process compliance results | `SessionState` + compliance result | Updated `SessionState` |
| `session.finalize` | Generate final result | `SessionState` | `SessionResult` |

## Data Structures

### SessionStartRequest

Initial request to start a new session:

```typescript
{
  sessionId: string;           // Unique session identifier
  employeeId: string;          // Employee to process
  employerId: string;          // Employer/tenant ID
  employerSize: 'small' | 'large';  // Determines ESTA rules
  periodStart: string;         // ISO 8601 date
  periodEnd: string;           // ISO 8601 date
  hoursWorked: number;         // Hours in period
  existingBalance: number;     // Current sick time balance
  carryoverFromPreviousYear: number;
}
```

### SessionResult

Final comprehensive result:

```typescript
{
  sessionId: string;
  employeeId: string;
  status: 'success' | 'partial' | 'failed';
  steps: SessionStep[];        // Detailed step tracking
  accrualResult?: {
    hoursAccrued: number;
    newBalance: number;
    maxBalance: number;
    isAtMax: boolean;
  };
  complianceResult?: {
    compliant: boolean;
    violations: Array<{...}>;
    warnings: Array<{...}>;
  };
  summary: string;             // Human-readable summary
  timestamp: string;           // ISO 8601
  durationMs: number;          // Total session duration
}
```

### SessionStep

Individual step tracking for audit trail:

```typescript
{
  stepNumber: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: string;
  endTime?: string;
  durationMs?: number;
  error?: string;
  result?: unknown;
}
```

## Capabilities & Security

### Required Capabilities

The pilot agent session requires these capabilities:

- `channel:session.*` - Receive session requests
- `channel:accrual.*` - Communicate with accrual engine
- `channel:compliance.*` - Communicate with compliance engine
- `audit_log:session.*` - Write audit logs

### Allowed Syscalls

- `sys.time.now` - For timestamps
- `sys.audit.log` - For audit logging

### Resource Limits

- Max Memory: 16 MB
- Max Execution Time: 2000 ms (2 seconds)
- CPU Quota: 10%

## Testing

See `tests/pilot-agent-session.test.ts` for comprehensive test coverage:

- ✅ Session initialization
- ✅ Accrual step orchestration
- ✅ Compliance step orchestration
- ✅ Session finalization
- ✅ Error handling
- ✅ Deterministic behavior verification

## Integration

### Adding to Kernel

```typescript
import { manifest } from './services/pilot-agent-session';

// Register with kernel loader
kernel = registerPilotAgentSession(kernel);
```

### Demo Script

Run the complete demo:

```bash
npm run demo:pilot-session
```

This demonstrates:
- Session initialization
- Multi-service orchestration
- IPC message flow
- Audit trail generation
- Deterministic execution

## Benefits

### For Developers

- **Clear Pattern** - Template for building complex workflows
- **Type Safety** - Full TypeScript typing for all operations
- **Testable** - Pure functions enable easy testing
- **Observable** - Detailed step tracking for debugging

### For the System

- **Proof of Concept** - Validates microkernel architecture
- **Performance Baseline** - Demonstrates multi-service coordination speed
- **Audit Foundation** - Shows comprehensive logging approach
- **Scalability Model** - Proves IPC-based coordination scales

### For Compliance

- **Complete Audit Trail** - Every step is tracked and timestamped
- **Deterministic Results** - Same inputs always produce same outputs
- **Regulatory Alignment** - Follows Michigan ESTA 2025 requirements
- **Defensible Records** - Immutable session history

## Future Enhancements

Potential extensions to the pilot agent session:

- [ ] Support for batch processing (multiple employees)
- [ ] Async/promise-based orchestration
- [ ] Session persistence and resume
- [ ] Real-time progress notifications
- [ ] Integration with UX experience contract layer
- [ ] Support for carryover calculations
- [ ] Employee usage request workflows
- [ ] Multi-step approval chains

## Related Documentation

- [Microkernel Architecture](../../ARCHITECTURE.md)
- [IPC Message Schema](../../kernel/abi/messages.ts)
- [Accrual Engine](../accrual-engine/README.md)
- [Compliance Engine](../compliance-engine/README.md)
- [Kernel Demo](../../demo/kernel-demo.ts)

## License

Part of the ESTA-Logic system. See [LICENSE](../../LICENSE) for details.
