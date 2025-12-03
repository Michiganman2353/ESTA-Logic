//! ESTA Kernel - Core WebAssembly runtime for ESTA compliance calculations.
//!
//! This crate provides the foundational async runtime and WASM execution
//! environment for the ESTA Tracker compliance engine.

#[cfg(feature = "wasmtime")]
pub mod kernel;

#[cfg(feature = "wasmtime")]
pub use kernel::{Kernel, ModuleManifest};
