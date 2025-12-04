//// kernel/loader/wasm_loader.gleam
////
//// ESTA Logic WASM Module Loader
////
//// This module handles loading, validation, and instantiation of
//// WebAssembly modules in the ESTA Logic microkernel.
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

// ============================================================================
// SECTION 1: LOADER TYPES
// ============================================================================

/// Module identifier
pub type ModuleId {
  ModuleId(value: Int)
}

/// WASM module metadata
pub type WasmModule {
  WasmModule(
    id: ModuleId,
    name: String,
    version: String,
    checksum: Int,
    size_bytes: Int,
    imports: List(WasmImport),
    exports: List(WasmExport),
    state: ModuleState,
  )
}

/// Module state
pub type ModuleState {
  Unloaded
  Loading
  Validating
  Instantiating
  Ready
  Failed(reason: String)
}

/// WASM import declaration
pub type WasmImport {
  WasmImport(module: String, name: String, kind: ImportKind)
}

/// WASM export declaration
pub type WasmExport {
  WasmExport(name: String, kind: ExportKind)
}

/// Import kinds
pub type ImportKind {
  ImportFunc(params: List(ValueType), results: List(ValueType))
  ImportGlobal(value_type: ValueType, mutable: Bool)
  ImportMemory(min_pages: Int, max_pages: Result(Int, Nil))
  ImportTable(element_type: String, min: Int, max: Result(Int, Nil))
}

/// Export kinds
pub type ExportKind {
  ExportFunc
  ExportGlobal
  ExportMemory
  ExportTable
}

/// WASM value types
pub type ValueType {
  I32
  I64
  F32
  F64
  V128
  FuncRef
  ExternRef
}

/// Loader state
pub type WasmLoader {
  WasmLoader(
    modules: List(WasmModule),
    next_id: Int,
    config: LoaderConfig,
    stats: LoaderStats,
  )
}

/// Loader configuration
pub type LoaderConfig {
  LoaderConfig(
    max_modules: Int,
    max_module_size_bytes: Int,
    max_memory_pages: Int,
    enable_validation: Bool,
  )
}

/// Loader statistics
pub type LoaderStats {
  LoaderStats(
    total_loaded: Int,
    total_failed: Int,
    total_bytes_loaded: Int,
  )
}

/// Load result
pub type LoadResult {
  LoadOk(module: WasmModule)
  LoadFailed(reason: String)
  LoadValidationFailed(errors: List(String))
}

// ============================================================================
// SECTION 2: LOADER CREATION
// ============================================================================

/// Create a new WASM loader
pub fn new() -> WasmLoader {
  new_with_config(default_config())
}

/// Create a loader with custom configuration
pub fn new_with_config(config: LoaderConfig) -> WasmLoader {
  WasmLoader(
    modules: [],
    next_id: 1,
    config: config,
    stats: LoaderStats(
      total_loaded: 0,
      total_failed: 0,
      total_bytes_loaded: 0,
    ),
  )
}

/// Default loader configuration
pub fn default_config() -> LoaderConfig {
  LoaderConfig(
    max_modules: 100,
    max_module_size_bytes: 10_485_760,
    max_memory_pages: 1024,
    enable_validation: True,
  )
}

// ============================================================================
// SECTION 3: MODULE LOADING
// ============================================================================

/// Load a WASM module
pub fn load(
  loader: WasmLoader,
  name: String,
  version: String,
  bytes_size: Int,
  checksum: Int,
) -> #(WasmLoader, LoadResult) {
  // Check module limit
  case list_length(loader.modules) >= loader.config.max_modules {
    True -> #(loader, LoadFailed("Module limit exceeded"))
    False -> {
      // Check size limit
      case bytes_size > loader.config.max_module_size_bytes {
        True -> #(loader, LoadFailed("Module size exceeds limit"))
        False -> {
          let id = ModuleId(loader.next_id)
          let module = WasmModule(
            id: id,
            name: name,
            version: version,
            checksum: checksum,
            size_bytes: bytes_size,
            imports: [],
            exports: [],
            state: Ready,
          )
          let new_loader = WasmLoader(
            ..loader,
            modules: [module, ..loader.modules],
            next_id: loader.next_id + 1,
            stats: LoaderStats(
              ..loader.stats,
              total_loaded: loader.stats.total_loaded + 1,
              total_bytes_loaded: loader.stats.total_bytes_loaded + bytes_size,
            ),
          )
          #(new_loader, LoadOk(module))
        }
      }
    }
  }
}

/// Unload a module
pub fn unload(
  loader: WasmLoader,
  id: ModuleId,
) -> #(WasmLoader, Result(Nil, String)) {
  case find_module(loader.modules, id) {
    Error(Nil) -> #(loader, Error("Module not found"))
    Ok(_) -> {
      let modules = remove_module(loader.modules, id)
      let new_loader = WasmLoader(..loader, modules: modules)
      #(new_loader, Ok(Nil))
    }
  }
}

// ============================================================================
// SECTION 4: MODULE QUERIES
// ============================================================================

/// Get a module by ID
pub fn get_module(loader: WasmLoader, id: ModuleId) -> Result(WasmModule, Nil) {
  find_module(loader.modules, id)
}

/// Get a module by name
pub fn get_module_by_name(
  loader: WasmLoader,
  name: String,
) -> Result(WasmModule, Nil) {
  find_module_by_name(loader.modules, name)
}

/// Get all loaded modules
pub fn get_all_modules(loader: WasmLoader) -> List(WasmModule) {
  loader.modules
}

/// Get loader statistics
pub fn get_stats(loader: WasmLoader) -> LoaderStats {
  loader.stats
}

// ============================================================================
// SECTION 5: HELPER FUNCTIONS
// ============================================================================

fn find_module(modules: List(WasmModule), id: ModuleId) -> Result(WasmModule, Nil) {
  case modules {
    [] -> Error(Nil)
    [m, ..rest] ->
      case m.id.value == id.value {
        True -> Ok(m)
        False -> find_module(rest, id)
      }
  }
}

fn find_module_by_name(modules: List(WasmModule), name: String) -> Result(WasmModule, Nil) {
  case modules {
    [] -> Error(Nil)
    [m, ..rest] ->
      case m.name == name {
        True -> Ok(m)
        False -> find_module_by_name(rest, name)
      }
  }
}

fn remove_module(modules: List(WasmModule), id: ModuleId) -> List(WasmModule) {
  case modules {
    [] -> []
    [m, ..rest] ->
      case m.id.value == id.value {
        True -> rest
        False -> [m, ..remove_module(rest, id)]
      }
  }
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}
