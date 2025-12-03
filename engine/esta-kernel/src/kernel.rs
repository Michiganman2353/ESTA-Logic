use anyhow::{anyhow, Result};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use tokio::task::JoinHandle;
use wasmtime::{Caller, Engine, Linker, Module, Store};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModuleManifest {
    pub name: String,
    pub path: String,
    pub checksum: String,
    pub capabilities: Vec<String>,
    /// Optional Ed25519 signature (hex-encoded) for manifest verification
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

/// Tracks running module instances for lifecycle management.
/// Stores module metadata for capability validation and status reporting.
#[allow(dead_code)]
struct ModuleHandle {
    name: String,
    handle: JoinHandle<()>,
    /// Capabilities granted to this module, used for runtime validation
    capabilities: Vec<Capability>,
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

    pub fn register(&mut self, name: String, handle: JoinHandle<()>, capabilities: Vec<Capability>) {
        self.modules.insert(
            name.clone(),
            ModuleHandle {
                name,
                handle,
                capabilities,
            },
        );
    }

    /// Remove a module from the registry
    #[allow(dead_code)]
    pub(crate) fn unregister(&mut self, name: &str) -> Option<JoinHandle<()>> {
        self.modules.remove(name).map(|h| h.handle)
    }

    /// Get the capabilities granted to a module
    #[allow(dead_code)]
    pub fn get_module_capabilities(&self, name: &str) -> Option<&[Capability]> {
        self.modules.get(name).map(|h| h.capabilities.as_slice())
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

pub struct Kernel {
    engine: Engine,
    registry: Arc<RwLock<ModuleRegistry>>,
}

impl Kernel {
    pub fn new() -> Result<Self> {
        // Keep engine minimal and deterministic
        let engine = Engine::default();
        Ok(Self {
            engine,
            registry: Arc::new(RwLock::new(ModuleRegistry::new())),
        })
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

    /// Verify manifest signature (placeholder for Ed25519 verification)
    /// TODO: Implement proper Ed25519 signature verification with a trusted public key
    fn verify_signature(manifest: &ModuleManifest) -> Result<()> {
        match &manifest.signature {
            Some(sig) if !sig.is_empty() => {
                // For prototype: log warning and proceed
                // Production: implement Ed25519 verification
                warn!(
                    "Signature verification not fully implemented for module {}. Proceeding with prototype mode.",
                    manifest.name
                );
                Ok(())
            }
            _ => {
                warn!(
                    "No signature provided for module {}. This is acceptable for prototype/dev only.",
                    manifest.name
                );
                Ok(())
            }
        }
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

    /// Register minimal host functions based on granted capabilities
    /// 
    /// Note: In production, these functions should read from WASM linear memory
    /// using the caller's memory export. Currently they are stubs that only log
    /// the operation parameters for prototype validation.
    fn register_host_functions(
        linker: &mut Linker<Vec<Capability>>,
        capabilities: &[Capability],
    ) -> Result<()> {
        // Only register functions for capabilities the module has been granted

        if capabilities.contains(&Capability::Log) {
            linker.func_wrap("env", "host_log", |_caller: Caller<'_, Vec<Capability>>, level: i32, ptr: i32, len: i32| {
                // Validate parameters before processing
                if ptr < 0 || len < 0 || len > Self::MAX_WASM_MEMORY_SIZE {
                    warn!("WASM log: invalid parameters (ptr={}, len={})", ptr, len);
                    return;
                }
                // Minimal logging stub - in production, read string from WASM memory using caller.get_export("memory")
                // TODO: Implement proper memory read with bounds checking
                info!("WASM log (level={}, ptr={}, len={})", level, ptr, len);
            })?;
        }

        if capabilities.contains(&Capability::AuditEmit) {
            linker.func_wrap("env", "host_audit_emit", |_caller: Caller<'_, Vec<Capability>>, event_type: i32, ptr: i32, len: i32| {
                // Validate parameters before processing
                if ptr < 0 || len < 0 || len > Self::MAX_WASM_MEMORY_SIZE {
                    warn!("WASM audit emit: invalid parameters (ptr={}, len={})", ptr, len);
                    return;
                }
                // Audit emit stub - in production, read data from WASM memory and write to immutable audit log
                // TODO: Implement proper memory read with bounds checking
                info!("WASM audit emit (type={}, ptr={}, len={})", event_type, ptr, len);
            })?;
        }

        // Note: PersistenceRead/PersistenceWrite would be added when persistence adapter is implemented
        // These are intentionally not registered until P2 phase

        Ok(())
    }

    /// Launch module given a manifest path (signed manifest expected)
    pub async fn launch_module(&self, manifest_path: &str) -> Result<()> {
        let manifest_bytes = tokio::fs::read(manifest_path).await?;
        let manifest: ModuleManifest = serde_json::from_slice(&manifest_bytes)?;

        info!("Loading module {} from {}", manifest.name, manifest.path);

        // Verify signature before proceeding
        Self::verify_signature(&manifest)?;

        let module_bytes = tokio::fs::read(&manifest.path).await?;

        // Verify checksum
        Self::verify_checksum(&module_bytes, &manifest.checksum)?;
        info!("Checksum verified for module {}", manifest.name);

        // Parse and validate capabilities
        let capabilities = Self::parse_capabilities(&manifest);
        info!(
            "Module {} granted capabilities: {:?}",
            manifest.name, capabilities
        );

        let module = Module::new(&self.engine, &module_bytes)?;

        // Create linker with strict imports - only provide controlled host functions
        let mut linker = Linker::new(&self.engine);
        Self::register_host_functions(&mut linker, &capabilities)?;

        let mut store = Store::new(&self.engine, capabilities.clone());
        let instance = linker.instantiate_async(&mut store, &module).await?;

        let module_name = manifest.name.clone();
        let _registry = self.registry.clone();

        // Run in supervised task with proper lifecycle management
        let run_handle = tokio::spawn(async move {
            // This is simplified: real kernel must route I/O through capability tokens
            if let Ok(start) = instance.get_typed_func::<(), ()>(&mut store, "_start") {
                if let Err(e) = start.call_async(&mut store, ()).await {
                    error!("Module {} _start failed: {:?}", module_name, e);
                }
            }
        });

        // Register module in registry for lifecycle tracking
        let mut reg = self.registry.write().await;
        reg.register(manifest.name.clone(), run_handle, capabilities);
        info!("Module {} registered in kernel", manifest.name);

        Ok(())
    }

    /// Shutdown the kernel and all running modules
    pub async fn shutdown(&self) -> Result<()> {
        info!("Kernel shutdown initiated");
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

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn new_kernel() {
        let k = Kernel::new().unwrap();
        // Verify kernel was created successfully with a valid engine
        let modules = k.list_modules().await;
        assert!(modules.is_empty());
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

        let handle = tokio::spawn(async {});
        registry.register("test".into(), handle, vec![Capability::Log]);

        assert_eq!(registry.list_modules(), vec!["test"]);

        registry.shutdown_all().await;
        assert!(registry.list_modules().is_empty());
    }
}
