//// kernel/syscalls/fs.gleam
////
//// ESTA Logic File System Syscalls
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// File descriptor
pub type FileDescriptor {
  FileDescriptor(value: Int)
}

/// File open modes
pub type OpenMode {
  ReadOnly
  WriteOnly
  ReadWrite
  Append
  Create
  Truncate
}

/// File stat result
pub type FileStat {
  FileStat(
    size: Int,
    created_at_ns: Int,
    modified_at_ns: Int,
    is_directory: Bool,
    is_file: Bool,
  )
}

/// Open a file
pub fn open(
  _path: String,
  _modes: List(OpenMode),
  _capability: Int,
) -> Result(FileDescriptor, String) {
  Ok(FileDescriptor(1))
}

/// Close a file
pub fn close(_fd: FileDescriptor) -> Result(Nil, String) {
  Ok(Nil)
}

/// Read from a file
pub fn read(
  _fd: FileDescriptor,
  _count: Int,
) -> Result(List(Int), String) {
  Ok([])
}

/// Write to a file
pub fn write(
  _fd: FileDescriptor,
  _data: List(Int),
) -> Result(Int, String) {
  Ok(0)
}

/// Get file statistics
pub fn stat(_path: String, _capability: Int) -> Result(FileStat, String) {
  Ok(FileStat(
    size: 0,
    created_at_ns: 0,
    modified_at_ns: 0,
    is_directory: False,
    is_file: True,
  ))
}
