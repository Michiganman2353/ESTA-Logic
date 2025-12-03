use anyhow::Result;
use log::{error, info};
use serde::{Deserialize, Serialize};
use tokio::task;
use wasmtime::{Engine, Linker, Module, Store};

#[derive(Debug, Serialize, Deserialize)]
pub struct ModuleManifest {
    pub name: String,
    pub path: String,
    pub checksum: String,
    pub capabilities: Vec<String>,
}

pub struct Kernel {
    engine: Engine,
    // future: store global audit sink reference
}

impl Kernel {
    pub fn new() -> Result<Self> {
        // Keep engine minimal and deterministic
        let engine = Engine::default();
        Ok(Self { engine })
    }

    /// Launch module given a manifest path (signed manifest expected)
    pub async fn launch_module(&self, manifest_path: &str) -> Result<()> {
        let manifest_bytes = tokio::fs::read(manifest_path).await?;
        let manifest: ModuleManifest = serde_json::from_slice(&manifest_bytes)?;

        info!("Loading module {} from {}", manifest.name, manifest.path);

        // Validate checksum (TODO: implement sig verification)

        let module_bytes = tokio::fs::read(&manifest.path).await?;
        let module = Module::new(&self.engine, module_bytes)?;

        // Linker with strict imports - only provide controlled host functions
        let linker = Linker::new(&self.engine);

        // TODO: register capability-limited host functions here (logging, persistence adapters)

        let mut store = Store::new(&self.engine, ());
        let instance = linker.instantiate_async(&mut store, &module).await?;

        // Expect an exported `_start` or `instantiate` function; run in task to prevent blocking
        let run_handle = task::spawn(async move {
            // This is simplified: real kernel must route I/O through capability tokens
            if let Ok(start) = instance.get_typed_func::<(), ()>(&mut store, "_start") {
                let _ = start.call_async(&mut store, ()).await;
            }
        });

        // Detach for now; kernel must track handles for orderly shutdown
        tokio::spawn(async move {
            if let Err(e) = run_handle.await {
                error!("module {} failed: {:?}", manifest.name, e);
            }
        });

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn new_kernel() {
        let k = Kernel::new().unwrap();
        // Verify kernel was created successfully with a valid engine
        let _engine = k.engine.clone();
    }
}
