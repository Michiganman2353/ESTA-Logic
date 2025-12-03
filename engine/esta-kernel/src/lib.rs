//! ESTA Kernel - Core WebAssembly runtime for ESTA compliance calculations.
//!
//! This crate provides the foundational async runtime and WASM execution
//! environment for the ESTA Tracker compliance engine.
//!
//! # Features
//!
//! - **Deterministic Execution**: Fuel metering and memory limits ensure
//!   predictable, reproducible module execution.
//! - **Capability-Based Security**: Modules only have access to explicitly
//!   granted capabilities.
//! - **Ed25519 Signatures**: Cryptographic verification of module integrity.
//! - **Audit Logging**: Tamper-evident append-only log of all operations.
//! - **Supervision**: Erlang-inspired crash-restart supervision tree.

pub mod security;
pub mod supervisor;

#[cfg(feature = "wasmtime")]
pub mod kernel;

#[cfg(feature = "wasmtime")]
pub use kernel::{Kernel, ModuleManifest, ExecutionConfig, KernelStatus};

pub use security::{
    SignatureVerifier, SignatureError,
    CapabilityManager, CapabilityToken, CapabilityError, Capability as SecCapability,
    AuditLog, AuditEvent, AuditEventType,
};
pub use security::capabilities::{CapabilityRight, ResourceType};

pub use supervisor::{
    Supervisor, ChildSpec, ChildStatus, RestartStrategy, EscalationLevel, SupervisorAction,
};
