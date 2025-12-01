# ADR 003: Tauri Desktop Application Strategy

**Status**: Planned  
**Date**: 2025-12-01  
**Decision Makers**: Engineering Team  
**Replaces**: N/A

## Context

ESTA Tracker requires offline-capable desktop clients for employers who:

1. Operate in low-connectivity environments
2. Need local data sovereignty for sensitive employee information
3. Require faster performance than web applications
4. Want native OS integrations (system tray, notifications, file system)

### Alternatives Considered

| Option     | Size    | Performance | Security | Rust Backend |
| ---------- | ------- | ----------- | -------- | ------------ |
| Electron   | ~150 MB | Moderate    | Moderate | No           |
| Tauri      | ~10 MB  | Excellent   | Strong   | Yes          |
| PWA        | N/A     | Good        | Good     | No           |
| Flutter    | ~25 MB  | Excellent   | Good     | No           |

## Decision

We adopt **Tauri 2.0** for the desktop application.

### Key Reasons

1. **Security-First**: Rust backend with strict capability allowlists
2. **Bundle Size**: 10-15x smaller than Electron
3. **Performance**: Native Rust performance for IPC
4. **WASM Integration**: Seamless integration with future Gleam/WASM modules
5. **Frontend Reuse**: Uses existing React frontend

## Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Tauri Application                          │
├──────────────────────────────────────────────────────────────────┤
│                      Frontend (Webview)                           │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                     React Application                        │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │ │
│  │  │   Existing   │  │   Tauri      │  │   Offline    │       │ │
│  │  │  Components  │  │   Bindings   │  │   Storage    │       │ │
│  │  └──────────────┘  └──────┬───────┘  └──────────────┘       │ │
│  └───────────────────────────┼─────────────────────────────────┘ │
│                              │ IPC                                │
├──────────────────────────────┼───────────────────────────────────┤
│                      Rust Backend                                 │
│  ┌──────────────────────────┼──────────────────────────────────┐ │
│  │                   Tauri Commands                             │ │
│  │  ┌──────────────┐  ┌─────┴────────┐  ┌──────────────┐       │ │
│  │  │   Accrual    │  │  Capability  │  │   SQLite     │       │ │
│  │  │   Engine     │  │  Validation  │  │   Adapter    │       │ │
│  │  │   (WASM)     │  │              │  │              │       │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │ │
│  └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Security Configuration

```json
// tauri.conf.json - Capability Allowlist
{
  "tauri": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'"
    },
    "allowlist": {
      "all": false,
      "shell": {
        "all": false
      },
      "fs": {
        "all": false,
        "readFile": false,
        "writeFile": false
      },
      "protocol": {
        "asset": true,
        "assetScope": ["$APPDATA/**"]
      }
    }
  }
}
```

## IPC Communication

### Message Flow

```
Frontend                      Rust Backend
    │                              │
    │  invoke('calculate_accrual') │
    │──────────────────────────────>
    │                              │
    │     Capability Validation    │
    │              │               │
    │         WASM Accrual         │
    │              │               │
    │     Result/Error Response    │
    │<──────────────────────────────
    │                              │
```

### IPC Types

```typescript
// frontend/src/tauri/commands.ts
import { invoke } from '@tauri-apps/api';

export interface AccrualRequest {
  hoursWorked: number;
  yearsOfService: number;
  employerSize: number;
  capability: string; // Capability token
}

export interface AccrualResponse {
  regular: number;
  bonus: number;
  cap: number;
}

export async function calculateAccrual(
  request: AccrualRequest
): Promise<AccrualResponse> {
  return await invoke('calculate_accrual', { request });
}
```

## Implementation Plan

### Phase 1: Foundation (Week 1-2)

- [ ] Initialize Tauri project structure
- [ ] Configure security allowlist
- [ ] Set up IPC bindings
- [ ] Port SQLite adapter from Node.js

### Phase 2: Core Features (Week 3-4)

- [ ] Implement offline storage sync
- [ ] Add WASM accrual engine
- [ ] Create system tray integration
- [ ] Add auto-update mechanism

### Phase 3: Polish (Week 5-6)

- [ ] Native notifications
- [ ] Deep OS integration
- [ ] Code signing configuration
- [ ] Release pipeline

## Consequences

### Positive

- **Small Bundle**: 10-15 MB vs 150+ MB for Electron
- **Secure by Default**: Rust memory safety + capability system
- **Native Performance**: Rust backend for heavy computation
- **Offline-First**: SQLite local storage with cloud sync
- **Cross-Platform**: Windows, macOS, Linux from single codebase

### Negative

- **Rust Requirement**: Team needs Rust knowledge for backend
- **WASM Complexity**: Additional build step for Gleam → WASM
- **Fewer Libraries**: Smaller ecosystem than Electron

### Mitigations

- **Training**: Rust fundamentals workshop for team
- **Abstraction**: IPC layer hides Rust complexity from frontend devs
- **Minimal Surface**: Only security-critical code in Rust

## References

- [Tauri 2.0 Documentation](https://tauri.app/)
- [Tauri Security Guide](https://tauri.app/v2/guides/security/)
- [WASM Pack](https://rustwasm.github.io/wasm-pack/)
- [Gleam WASM Target](https://gleam.run/writing-gleam/targets/)

## Revision History

| Version | Date       | Author    | Changes          |
| ------- | ---------- | --------- | ---------------- |
| 1.0.0   | 2025-12-01 | ESTA Team | Initial decision |
