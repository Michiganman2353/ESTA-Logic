# ESTA Logic Microkernel

This directory contains the core microkernel implementation for ESTA Logic.

## Directory Structure

```
kernel/
├── core/                    # Core kernel components
│   ├── scheduler.gleam      # Priority-based preemptive scheduler
│   ├── message_router.gleam # Inter-process message routing
│   ├── capabilities_engine.gleam # Capability-based security
│   ├── module_registry.gleam    # Module lifecycle management
│   ├── kernel_loop.gleam    # Main event loop
│   └── init.gleam           # Initialization sequence
│
├── abi/                     # Application Binary Interface
│   ├── messages.gleam       # Message type definitions
│   ├── syscalls.gleam       # System call interface
│   ├── types.gleam          # Core type definitions
│   └── errors.gleam         # Error type definitions
│
├── loader/                  # Module loading
│   ├── wasm_loader.gleam    # WASM module loader
│   ├── lifecycle_manager.gleam # Module lifecycle
│   └── preload_manager.gleam   # Preloading optimization
│
├── syscalls/                # System call implementations
│   ├── fs.gleam             # File system syscalls
│   ├── net.gleam            # Network syscalls
│   ├── time.gleam           # Time syscalls
│   ├── db.gleam             # Database syscalls
│   ├── host_events.gleam    # Host event syscalls
│   └── notifications.gleam  # Notification syscalls
│
├── drivers/                 # Device drivers
│   ├── firestore_driver.gleam   # Firestore integration
│   ├── filesystem_driver.gleam  # File system driver
│   ├── http_driver.gleam        # HTTP client driver
│   ├── clock_driver.gleam       # Clock/timer driver
│   └── tauri_bridge.gleam       # Tauri IPC bridge
│
└── utils/                   # Utility modules
    ├── validation.gleam     # Input validation
    ├── serialization.gleam  # Data serialization
    ├── logging.gleam        # Logging infrastructure
    └── buffer_pool.gleam    # Memory buffer management
```

## Key Design Principles

1. **Microkernel Architecture**: Only essential services run in the kernel
2. **Capability-Based Security**: All access controlled by unforgeable tokens
3. **Message Passing**: All IPC through explicit message routing
4. **Deterministic Behavior**: Critical for compliance operations
5. **WASM Isolation**: Services run in sandboxed WASM modules

## Reference

See `docs/abi/kernel_contract.md` for the formal ABI specification.
