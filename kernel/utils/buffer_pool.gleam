//// kernel/utils/buffer_pool.gleam
////
//// ESTA Logic Buffer Pool Utilities
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Buffer identifier
pub type BufferId {
  BufferId(value: Int)
}

/// Buffer
pub type Buffer {
  Buffer(
    id: BufferId,
    capacity: Int,
    used: Int,
    data: List(Int),
  )
}

/// Buffer pool
pub type BufferPool {
  BufferPool(
    buffers: List(Buffer),
    free_list: List(BufferId),
    next_id: Int,
    config: PoolConfig,
  )
}

/// Pool configuration
pub type PoolConfig {
  PoolConfig(
    buffer_size: Int,
    initial_count: Int,
    max_count: Int,
  )
}

/// Create a new buffer pool
pub fn new() -> BufferPool {
  new_with_config(default_config())
}

/// Create a pool with custom configuration
pub fn new_with_config(config: PoolConfig) -> BufferPool {
  let #(buffers, free_list, next_id) = create_initial_buffers(
    config.initial_count,
    config.buffer_size,
    1,
    [],
    [],
  )
  BufferPool(
    buffers: buffers,
    free_list: free_list,
    next_id: next_id,
    config: config,
  )
}

/// Default pool configuration
pub fn default_config() -> PoolConfig {
  PoolConfig(
    buffer_size: 4096,
    initial_count: 16,
    max_count: 256,
  )
}

/// Acquire a buffer from the pool
pub fn acquire(pool: BufferPool) -> #(BufferPool, Result(Buffer, String)) {
  case pool.free_list {
    [] -> grow_and_acquire(pool)
    [id, ..rest] -> {
      case find_buffer(pool.buffers, id) {
        Error(Nil) -> #(BufferPool(..pool, free_list: rest), Error("Buffer not found"))
        Ok(buffer) -> {
          let new_pool = BufferPool(..pool, free_list: rest)
          #(new_pool, Ok(buffer))
        }
      }
    }
  }
}

/// Release a buffer back to the pool
pub fn release(pool: BufferPool, id: BufferId) -> BufferPool {
  let buffers = reset_buffer(pool.buffers, id)
  BufferPool(..pool, buffers: buffers, free_list: [id, ..pool.free_list])
}

/// Get pool statistics
pub fn stats(pool: BufferPool) -> #(Int, Int, Int) {
  let total = list_length(pool.buffers)
  let free = list_length(pool.free_list)
  let used = total - free
  #(total, used, free)
}

// Helper functions
fn create_initial_buffers(
  count: Int,
  size: Int,
  next_id: Int,
  buffers: List(Buffer),
  free_list: List(BufferId),
) -> #(List(Buffer), List(BufferId), Int) {
  case count <= 0 {
    True -> #(buffers, free_list, next_id)
    False -> {
      let id = BufferId(next_id)
      let buffer = Buffer(id: id, capacity: size, used: 0, data: [])
      create_initial_buffers(
        count - 1,
        size,
        next_id + 1,
        [buffer, ..buffers],
        [id, ..free_list],
      )
    }
  }
}

fn grow_and_acquire(pool: BufferPool) -> #(BufferPool, Result(Buffer, String)) {
  let total = list_length(pool.buffers)
  case total >= pool.config.max_count {
    True -> #(pool, Error("Pool exhausted"))
    False -> {
      let id = BufferId(pool.next_id)
      let buffer = Buffer(id: id, capacity: pool.config.buffer_size, used: 0, data: [])
      let new_pool = BufferPool(
        ..pool,
        buffers: [buffer, ..pool.buffers],
        next_id: pool.next_id + 1,
      )
      #(new_pool, Ok(buffer))
    }
  }
}

fn find_buffer(buffers: List(Buffer), id: BufferId) -> Result(Buffer, Nil) {
  case buffers {
    [] -> Error(Nil)
    [b, ..rest] ->
      case b.id.value == id.value {
        True -> Ok(b)
        False -> find_buffer(rest, id)
      }
  }
}

fn reset_buffer(buffers: List(Buffer), id: BufferId) -> List(Buffer) {
  case buffers {
    [] -> []
    [b, ..rest] ->
      case b.id.value == id.value {
        True -> [Buffer(..b, used: 0, data: []), ..rest]
        False -> [b, ..reset_buffer(rest, id)]
      }
  }
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}
