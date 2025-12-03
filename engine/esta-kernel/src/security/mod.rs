//! Security module for the ESTA Kernel
//!
//! This module provides security primitives for the microkernel:
//! - Ed25519 signature verification for WASM modules
//! - Capability-based access control
//! - Audit logging for security events

pub mod sig;
pub mod capabilities;
pub mod audit;

pub use sig::{SignatureVerifier, SignatureError};
pub use capabilities::{Capability, CapabilityManager, CapabilityToken, CapabilityError};
pub use audit::{AuditLog, AuditEvent, AuditEventType};
