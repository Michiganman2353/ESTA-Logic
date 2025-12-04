//// tests/unit/test_loader.gleam
////
//// Unit Test: WASM Loader
////
//// Version: 1.0.0

import gleeunit/should

/// Test loader creation
pub fn test_loader_creation() {
  let loader = create_loader()
  should.equal(loader.module_count, 0)
}

/// Test module loading
pub fn test_load_module() {
  let loader = create_loader()
  let result = load_module(loader, "test_module", 1024)
  should.equal(result.1, Ok(1))
}

/// Test module size limit
pub fn test_module_size_limit() {
  let loader = create_loader_with_limit(1000)
  let result = load_module(loader, "large_module", 2000)
  should.equal(result.1, Error("Module too large"))
}

/// Loader state
pub type Loader {
  Loader(module_count: Int, max_size: Int)
}

fn create_loader() -> Loader {
  Loader(module_count: 0, max_size: 10_485_760)
}

fn create_loader_with_limit(max_size: Int) -> Loader {
  Loader(module_count: 0, max_size: max_size)
}

fn load_module(
  loader: Loader,
  _name: String,
  size: Int,
) -> #(Loader, Result(Int, String)) {
  case size > loader.max_size {
    True -> #(loader, Error("Module too large"))
    False -> {
      let new_loader = Loader(..loader, module_count: loader.module_count + 1)
      #(new_loader, Ok(new_loader.module_count))
    }
  }
}
