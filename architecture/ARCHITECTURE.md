# ESTA Logic Architecture

## Overview

ESTA Logic is built on a microkernel architecture designed for safety-critical compliance operations. The system separates concerns into distinct layers with explicit boundaries.

## Core Principles

1. **Microkernel Design**: Only essential services run in the kernel space
2. **Capability-Based Security**: All access controlled by unforgeable tokens
3. **Message-Passing IPC**: All inter-process communication through explicit messages
4. **WASM Isolation**: Services run in sandboxed WebAssembly modules
5. **Deterministic Behavior**: Critical for compliance operations

## System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (Tauri)                       │
├─────────────────────────────────────────────────────────────┤
│                    Services Layer                           │
│  ┌──────────┐ ┌────────────┐ ┌─────────┐ ┌─────────────┐   │
│  │ Accrual  │ │ Compliance │ │ Session │ │  Employer   │   │
│  │ Engine   │ │   Engine   │ │ Service │ │   Engine    │   │
│  └──────────┘ └────────────┘ └─────────┘ └─────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                     Kernel Layer                            │
│  ┌──────────┐ ┌─────────┐ ┌──────────────┐ ┌───────────┐   │
│  │Scheduler │ │ Router  │ │ Capabilities │ │  Loader   │   │
│  └──────────┘ └─────────┘ └──────────────┘ └───────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    Drivers Layer                            │
│  ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────────────┐   │
│  │Firestore │ │   HTTP   │ │  Clock  │ │ Tauri Bridge  │   │
│  └──────────┘ └──────────┘ └─────────┘ └───────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

See the individual README files in each directory for detailed information.

## Key Components

### Kernel
- Scheduler: Priority-based preemptive scheduling
- Message Router: Reliable IPC with backpressure
- Capabilities Engine: Unforgeable access tokens
- Module Registry: Module lifecycle management
- WASM Loader: WebAssembly module loading

### Services
- Accrual Engine: ESTA sick time calculations
- Compliance Engine: Rule evaluation and policy enforcement
- User Session: Authentication and session management
- Employer Engine: Employer data and policy management
- UI Sync: State synchronization with frontend

### Drivers
- Firestore Driver: Cloud database integration
- HTTP Driver: Network requests
- Clock Driver: Time operations
- Tauri Bridge: Desktop app integration
