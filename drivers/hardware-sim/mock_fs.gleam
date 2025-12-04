//// drivers/hardware-sim/mock_fs.gleam
////
//// Mock File System for Testing
////
//// Version: 1.0.0

/// Mock file
pub type MockFile {
  MockFile(
    path: String,
    content: List(Int),
    is_directory: Bool,
    created_at_ns: Int,
    modified_at_ns: Int,
  )
}

/// Mock file system state
pub type MockFs {
  MockFs(
    files: List(MockFile),
    current_time_ns: Int,
  )
}

/// Create a new mock file system
pub fn new() -> MockFs {
  MockFs(files: [], current_time_ns: 0)
}

/// Create a file
pub fn create_file(
  fs: MockFs,
  path: String,
  content: List(Int),
) -> MockFs {
  let file = MockFile(
    path: path,
    content: content,
    is_directory: False,
    created_at_ns: fs.current_time_ns,
    modified_at_ns: fs.current_time_ns,
  )
  MockFs(..fs, files: [file, ..fs.files])
}

/// Read a file
pub fn read_file(fs: MockFs, path: String) -> Result(List(Int), String) {
  case find_file(fs.files, path) {
    Ok(file) -> Ok(file.content)
    Error(_) -> Error("File not found")
  }
}

/// Write to a file
pub fn write_file(
  fs: MockFs,
  path: String,
  content: List(Int),
) -> MockFs {
  let files = update_file_content(fs.files, path, content, fs.current_time_ns)
  MockFs(..fs, files: files)
}

/// Delete a file
pub fn delete_file(fs: MockFs, path: String) -> MockFs {
  let files = remove_file(fs.files, path)
  MockFs(..fs, files: files)
}

/// List directory contents
pub fn list_dir(fs: MockFs, path: String) -> List(String) {
  filter_by_prefix(fs.files, path)
}

// Helper functions
fn find_file(files: List(MockFile), path: String) -> Result(MockFile, Nil) {
  case files {
    [] -> Error(Nil)
    [f, ..rest] ->
      case f.path == path {
        True -> Ok(f)
        False -> find_file(rest, path)
      }
  }
}

fn update_file_content(
  files: List(MockFile),
  path: String,
  content: List(Int),
  now: Int,
) -> List(MockFile) {
  case files {
    [] -> []
    [f, ..rest] ->
      case f.path == path {
        True -> [MockFile(..f, content: content, modified_at_ns: now), ..rest]
        False -> [f, ..update_file_content(rest, path, content, now)]
      }
  }
}

fn remove_file(files: List(MockFile), path: String) -> List(MockFile) {
  case files {
    [] -> []
    [f, ..rest] ->
      case f.path == path {
        True -> rest
        False -> [f, ..remove_file(rest, path)]
      }
  }
}

fn filter_by_prefix(files: List(MockFile), _prefix: String) -> List(String) {
  case files {
    [] -> []
    [f, ..rest] -> [f.path, ..filter_by_prefix(rest, _prefix)]
  }
}
