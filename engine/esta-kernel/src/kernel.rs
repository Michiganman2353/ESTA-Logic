//! ESTA Kernel - WASM Microkernel Runtime
//!
//! This module provides the core kernel functionality for running WASM modules
//! with deterministic execution, capability-based security, and fuel metering.
//!
//! Key Features:
//! - Deterministic WASM execution with fuel metering
//! - Ed25519 signature verification for modules
//! - Capability-based access control
//! - Memory limits and safety bounds
//! - Integrated audit logging

use anyhow::{anyhow, Result};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use wasmtime::{Caller, Config, Engine, Linker, Module, Store, StoreLimits, StoreLimitsBuilder};

use crate::security::{AuditLog, SignatureVerifier};

/// Configuration for deterministic WASM execution
#[derive(Debug, Clone)]
pub struct ExecutionConfig {
    /// Maximum fuel (instructions) per invocation
    pub max_fuel: u64,
    /// Maximum linear memory in bytes (default 32 MiB)
    pub max_memory_bytes: usize,
    /// Minimum linear memory in bytes (default 4 MiB)
    pub min_memory_bytes: usize,
    /// Maximum number of WASM tables
    pub max_tables: u32,
    /// Maximum number of WASM instances
    pub max_instances: u32,
    /// Whether to enforce signature verification
    pub require_signatures: bool,
}

impl Default for ExecutionConfig {
    fn default() -> Self {
        Self {
            max_fuel: 20_000_000, // 20M instructions per invocation
            max_memory_bytes: 32 * 1024 * 1024, // 32 MiB
            min_memory_bytes: 4 * 1024 * 1024,  // 4 MiB
            max_tables: 10,
            max_instances: 10,
            require_signatures: false, // Set to true in production
        }
    }
}

/// Module execution statistics
#[derive(Debug, Clone, Default, Serialize)]
pub struct ModuleStats {
    /// Total fuel consumed
    pub fuel_consumed: u64,
    /// Number of invocations
    pub invocation_count: u64,
    /// Number of traps/errors
    pub error_count: u64,
    /// Peak memory usage in bytes
    pub peak_memory_bytes: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleManifest {
    pub name: String,
    pub path: String,
    pub checksum: String,
    pub capabilities: Vec<String>,
    /// Ed25519 signature (hex-encoded) for module verification
    pub signature: Option<String>,
}

/// Capability tokens that can be granted to WASM modules
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub enum Capability {
    Log,
    AuditEmit,
    PersistenceRead,
    PersistenceWrite,
}

impl Capability {
    fn from_str(s: &str) -> Option<Self> {
        match s {
            "log" => Some(Capability::Log),
            "audit_emit" => Some(Capability::AuditEmit),
            "persistence_read" => Some(Capability::PersistenceRead),
            "persistence_write" => Some(Capability::PersistenceWrite),
            _ => None,
        }
    }
}

/// Store data for WASM module execution
pub struct ModuleStoreData {
    /// Granted capabilities
    capabilities: Vec<Capability>,
    /// Store limits for resource control
    limits: StoreLimits,
    /// Module name for logging
    module_name: String,
}

/// Tracks running module instances for lifecycle management.
#[allow(dead_code)]
struct ModuleHandle {
    name: String,
    handle: JoinHandle<()>,
    capabilities: Vec<Capability>,
    stats: Arc<RwLock<ModuleStats>>,
}

/// Module registry for tracking active modules and orderly shutdown
pub struct ModuleRegistry {
    modules: HashMap<String, ModuleHandle>,
}

impl ModuleRegistry {
    pub fn new() -> Self {
        Self {
            modules: HashMap::new(),
        }
    }

    pub fn register(
        &mut self,
        name: String,
        handle: JoinHandle<()>,
        capabilities: Vec<Capability>,
        stats: Arc<RwLock<ModuleStats>>,
    ) {
        self.modules.insert(
            name.clone(),
            ModuleHandle {
                name,
                handle,
                capabilities,
                stats,
            },
        );
    }

    #[allow(dead_code)]
    pub(crate) fn unregister(&mut self, name: &str) -> Option<JoinHandle<()>> {
        self.modules.remove(name).map(|h| h.handle)
    }

    #[allow(dead_code)]
    pub fn get_module_capabilities(&self, name: &str) -> Option<&[Capability]> {
        self.modules.get(name).map(|h| h.capabilities.as_slice())
    }

    #[allow(dead_code)]
    pub async fn get_module_stats(&self, name: &str) -> Option<ModuleStats> {
        if let Some(handle) = self.modules.get(name) {
            Some(handle.stats.read().await.clone())
        } else {
            None
        }
    }

    pub async fn shutdown_all(&mut self) {
        for (name, handle) in self.modules.drain() {
            info!("Shutting down module: {}", name);
            handle.handle.abort();
        }
    }

    pub fn list_modules(&self) -> Vec<&str> {
        self.modules.keys().map(|s| s.as_str()).collect()
    }
}

impl Default for ModuleRegistry {
    fn default() -> Self {
        Self::new()
    }
}

/// The ESTA Kernel - manages WASM module execution
pub struct Kernel {
    engine: Engine,
    registry: Arc<RwLock<ModuleRegistry>>,
    config: ExecutionConfig,
    signature_verifier: Option<SignatureVerifier>,
    audit_log: Arc<AuditLog>,
}

impl Kernel {
    /// Create a new kernel with default configuration
    pub fn new() -> Result<Self> {
        Self::with_config(ExecutionConfig::default())
    }

    /// Create a new kernel with custom configuration
    pub fn with_config(config: ExecutionConfig) -> Result<Self> {
        // Configure engine for deterministic execution
        let mut engine_config = Config::new();
        engine_config
            .async_support(true)
            .consume_fuel(true)  // Enable fuel metering
            .epoch_interruption(false)  // Use fuel instead of epochs
            .wasm_threads(false)  // Disable threads for determinism
            .wasm_simd(true)  // SIMD is deterministic
            .wasm_multi_memory(false)  // Single memory for simplicity
            .wasm_memory64(false)  // 32-bit memory addresses
            .cranelift_nan_canonicalization(true);  // Deterministic NaN handling

        let engine = Engine::new(&engine_config)?;

        Ok(Self {
            engine,
            registry: Arc::new(RwLock::new(ModuleRegistry::new())),
            config,
            signature_verifier: None,
            audit_log: Arc::new(AuditLog::with_defaults()),
        })
    }

    /// Set the signature verifier for module verification
    pub fn with_signature_verifier(mut self, public_key_hex: &str) -> Result<Self> {
        self.signature_verifier = Some(SignatureVerifier::new(public_key_hex)?);
        Ok(self)
    }

    /// Get the audit log
    pub fn audit_log(&self) -> Arc<AuditLog> {
        self.audit_log.clone()
    }

    /// Verify module checksum matches the actual bytes
    fn verify_checksum(module_bytes: &[u8], expected_checksum: &str) -> Result<()> {
        let mut hasher = Sha256::new();
        hasher.update(module_bytes);
        let actual_checksum = hex::encode(hasher.finalize());

        if actual_checksum != expected_checksum {
            return Err(anyhow!(
                "Checksum mismatch: expected {}, got {}",
                expected_checksum,
                actual_checksum
            ));
        }
        Ok(())
    }

    /// Verify module signature using Ed25519
    fn verify_signature(&self, module_bytes: &[u8], manifest: &ModuleManifest) -> Result<()> {
        if self.config.require_signatures {
            let signature = manifest.signature.as_ref()
                .ok_or_else(|| anyhow!("Signature required but not provided for module {}", manifest.name))?;

            let verifier = self.signature_verifier.as_ref()
                .ok_or_else(|| anyhow!("Signature verification required but no verifier configured"))?;

            verifier.verify_module(module_bytes, &manifest.checksum, signature)
                .map_err(|e| anyhow!("Signature verification failed for module {}: {}", manifest.name, e))?;

            info!("Signature verified for module {}", manifest.name);
        } else {
            // Development mode - warn about missing signatures
            match &manifest.signature {
                Some(sig) if !sig.is_empty() => {
                    if let Some(verifier) = &self.signature_verifier {
                        match verifier.verify_module(module_bytes, &manifest.checksum, sig) {
                            Ok(()) => info!("Signature verified for module {}", manifest.name),
                            Err(e) => warn!("Signature verification failed for module {} (dev mode): {}", manifest.name, e),
                        }
                    }
                }
                _ => {
                    warn!(
                        "No signature provided for module {}. This is acceptable for dev only.",
                        manifest.name
                    );
                }
            }
        }
        Ok(())
    }

    /// Parse and validate capabilities from manifest
    fn parse_capabilities(manifest: &ModuleManifest) -> Vec<Capability> {
        manifest
            .capabilities
            .iter()
            .filter_map(|cap| Capability::from_str(cap))
            .collect()
    }

    /// Maximum allowed size for WASM memory operations
    const MAX_WASM_MEMORY_SIZE: i32 = 1_048_576; // 1MB

    /// Register host functions based on granted capabilities
    fn register_host_functions(
        linker: &mut Linker<ModuleStoreData>,
        capabilities: &[Capability],
    ) -> Result<()> {
        if capabilities.contains(&Capability::Log) {
            linker.func_wrap("env", "host_log", |caller: Caller<'_, ModuleStoreData>, level: i32, ptr: i32, len: i32| {
                if ptr < 0 || len < 0 || len > Self::MAX_WASM_MEMORY_SIZE {
                    warn!("WASM log: invalid parameters (ptr={}, len={})", ptr, len);
                    return;
                }
                let module_name = &caller.data().module_name;
                info!("[{}] WASM log (level={}, ptr={}, len={})", module_name, level, ptr, len);
            })?;
        }

        if capabilities.contains(&Capability::AuditEmit) {
            linker.func_wrap("env", "host_audit_emit", |caller: Caller<'_, ModuleStoreData>, event_type: i32, ptr: i32, len: i32| {
                if ptr < 0 || len < 0 || len > Self::MAX_WASM_MEMORY_SIZE {
                    warn!("WASM audit emit: invalid parameters (ptr={}, len={})", ptr, len);
                    return;
                }
                let module_name = &caller.data().module_name;
                info!("[{}] WASM audit emit (type={}, ptr={}, len={})", module_name, event_type, ptr, len);
            })?;
        }

        Ok(())
    }

    /// Create a store with deterministic configuration and resource limits
    fn create_store(&self, capabilities: Vec<Capability>, module_name: String) -> Store<ModuleStoreData> {
        let limits = StoreLimitsBuilder::new()
            .memory_size(self.config.max_memory_bytes)
            .tables(self.config.max_tables as usize)
            .instances(self.config.max_instances as usize)
            .build();

        let store_data = ModuleStoreData {
            capabilities,
            limits,
            module_name,
        };

        let mut store = Store::new(&self.engine, store_data);
        
        // Add fuel for this execution (fuel consumption is enabled in engine config)
        let _ = store.add_fuel(self.config.max_fuel);
        
        // Enable resource limiting
        store.limiter(|data| &mut data.limits);

        store
    }

    /// Launch module given a manifest path
    pub async fn launch_module(&self, manifest_path: &str) -> Result<()> {
        let manifest_bytes = tokio::fs::read(manifest_path).await?;
        let manifest: ModuleManifest = serde_json::from_slice(&manifest_bytes)?;

        info!("Loading module {} from {}", manifest.name, manifest.path);

        let module_bytes = tokio::fs::read(&manifest.path).await?;

        // Verify checksum first
        Self::verify_checksum(&module_bytes, &manifest.checksum)?;
        info!("Checksum verified for module {}", manifest.name);

        // Verify signature
        self.verify_signature(&module_bytes, &manifest)?;

        // Parse capabilities
        let capabilities = Self::parse_capabilities(&manifest);
        info!(
            "Module {} granted capabilities: {:?}",
            manifest.name, capabilities
        );

        // Log to audit
        self.audit_log.log_module_loaded(
            &manifest.name,
            &manifest.checksum,
            "kernel",
        ).await;

        let module = Module::new(&self.engine, &module_bytes)?;

        // Create linker with capability-based host functions
        let mut linker = Linker::new(&self.engine);
        Self::register_host_functions(&mut linker, &capabilities)?;

        let mut store = self.create_store(capabilities.clone(), manifest.name.clone());
        let instance = linker.instantiate_async(&mut store, &module).await?;

        let module_name = manifest.name.clone();
        let stats = Arc::new(RwLock::new(ModuleStats::default()));
        let stats_clone = stats.clone();
        let audit_log = self.audit_log.clone();
        let max_fuel = self.config.max_fuel;

        // Run in supervised task
        let run_handle = tokio::spawn(async move {
            if let Ok(start) = instance.get_typed_func::<(), ()>(&mut store, "_start") {
                match start.call_async(&mut store, ()).await {
                    Ok(()) => {
                        // Calculate fuel consumed
                        let consumed = store.fuel_consumed().unwrap_or(0);
                        
                        let mut s = stats_clone.write().await;
                        s.fuel_consumed += consumed;
                        s.invocation_count += 1;

                        audit_log.log_execution_completed(
                            &module_name,
                            "_start",
                            consumed,
                            "kernel",
                        ).await;
                    }
                    Err(e) => {
                        let mut s = stats_clone.write().await;
                        s.error_count += 1;
                        s.invocation_count += 1;
                        
                        let error_msg = format!("{:?}", e);
                        error!("Module {} _start failed: {}", module_name, error_msg);

                        if error_msg.contains("fuel") {
                            audit_log.log_fuel_exhausted(&module_name, max_fuel, "kernel").await;
                        } else {
                            audit_log.log_module_crashed(&module_name, &error_msg, "kernel").await;
                        }
                    }
                }
            }
        });

        // Register module
        let mut reg = self.registry.write().await;
        reg.register(manifest.name.clone(), run_handle, capabilities, stats);
        info!("Module {} registered in kernel", manifest.name);

        Ok(())
    }

    /// Execute a function on a module with fuel limits
    pub async fn execute_function(
        &self,
        module_name: &str,
        function_name: &str,
        input_ptr: i32,
        input_len: i32,
    ) -> Result<i32> {
        // This is a placeholder for direct function execution
        // In a full implementation, this would look up the module instance
        // and call the specified function with fuel metering
        info!(
            "Execute function {} on module {} with input at ptr={}, len={}",
            function_name, module_name, input_ptr, input_len
        );
        
        Ok(0)
    }

    /// Get kernel status
    pub async fn get_status(&self) -> KernelStatus {
        let reg = self.registry.read().await;
        let modules: Vec<String> = reg.list_modules().iter().map(|s| s.to_string()).collect();
        let audit_stats = self.audit_log.stats().await;

        KernelStatus {
            version: env!("CARGO_PKG_VERSION").to_string(),
            modules_loaded: modules.len(),
            module_names: modules,
            max_fuel_per_call: self.config.max_fuel,
            max_memory_bytes: self.config.max_memory_bytes,
            require_signatures: self.config.require_signatures,
            audit_entries: audit_stats.total_entries,
        }
    }

    /// Shutdown the kernel and all running modules
    pub async fn shutdown(&self) -> Result<()> {
        info!("Kernel shutdown initiated");
        
        self.audit_log.append(crate::security::audit::AuditEvent::new(
            crate::security::audit::AuditEventType::KernelShutdown { 
                reason: "normal shutdown".into() 
            },
            "kernel",
        )).await;

        let mut reg = self.registry.write().await;
        reg.shutdown_all().await;
        info!("Kernel shutdown complete");
        Ok(())
    }

    /// List all running modules
    pub async fn list_modules(&self) -> Vec<String> {
        let reg = self.registry.read().await;
        reg.list_modules().into_iter().map(String::from).collect()
    }
}

/// Kernel status information
#[derive(Debug, Clone, Serialize)]
pub struct KernelStatus {
    pub version: String,
    pub modules_loaded: usize,
    pub module_names: Vec<String>,
    pub max_fuel_per_call: u64,
    pub max_memory_bytes: usize,
    pub require_signatures: bool,
    pub audit_entries: u64,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_new_kernel() {
        let k = Kernel::new().unwrap();
        let modules = k.list_modules().await;
        assert!(modules.is_empty());
    }

    #[tokio::test]
    async fn test_kernel_with_config() {
        let config = ExecutionConfig {
            max_fuel: 10_000_000,
            max_memory_bytes: 16 * 1024 * 1024,
            require_signatures: false,
            ..Default::default()
        };
        let k = Kernel::with_config(config).unwrap();
        let status = k.get_status().await;
        assert_eq!(status.max_fuel_per_call, 10_000_000);
    }

    #[test]
    fn test_checksum_verification() {
        let data = b"test module bytes";
        let mut hasher = Sha256::new();
        hasher.update(data);
        let checksum = hex::encode(hasher.finalize());

        assert!(Kernel::verify_checksum(data, &checksum).is_ok());
        assert!(Kernel::verify_checksum(data, "invalid").is_err());
    }

    #[test]
    fn test_capability_parsing() {
        let manifest = ModuleManifest {
            name: "test".into(),
            path: "test.wasm".into(),
            checksum: "abc".into(),
            capabilities: vec!["log".into(), "audit_emit".into(), "unknown".into()],
            signature: None,
        };
        let caps = Kernel::parse_capabilities(&manifest);
        assert_eq!(caps.len(), 2);
        assert!(caps.contains(&Capability::Log));
        assert!(caps.contains(&Capability::AuditEmit));
    }

    #[tokio::test]
    async fn test_module_registry() {
        let mut registry = ModuleRegistry::new();
        let stats = Arc::new(RwLock::new(ModuleStats::default()));

        let handle = tokio::spawn(async {});
        registry.register("test".into(), handle, vec![Capability::Log], stats);

        assert_eq!(registry.list_modules(), vec!["test"]);

        registry.shutdown_all().await;
        assert!(registry.list_modules().is_empty());
    }

    #[tokio::test]
    async fn test_kernel_status() {
        let k = Kernel::new().unwrap();
        let status = k.get_status().await;
        
        assert_eq!(status.modules_loaded, 0);
        assert_eq!(status.max_fuel_per_call, 20_000_000);
    }

    #[tokio::test]
    async fn test_kernel_audit_log() {
        let k = Kernel::new().unwrap();
        let audit_log = k.audit_log();
        
        // Log a test event
        audit_log.log_custom("test", "test message", "test").await;
        
        let stats = audit_log.stats().await;
        assert_eq!(stats.total_entries, 1);
    }

    #[test]
    fn test_execution_config_default() {
        let config = ExecutionConfig::default();
        assert_eq!(config.max_fuel, 20_000_000);
        assert_eq!(config.max_memory_bytes, 32 * 1024 * 1024);
        assert!(!config.require_signatures);
    }
}
