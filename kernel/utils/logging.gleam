//// kernel/utils/logging.gleam
////
//// ESTA Logic Logging Utilities
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Log level
pub type LogLevel {
  Trace
  Debug
  Info
  Warn
  Error
  Fatal
}

/// Log entry
pub type LogEntry {
  LogEntry(
    level: LogLevel,
    message: String,
    module: String,
    timestamp_ns: Int,
    fields: List(#(String, String)),
  )
}

/// Logger state
pub type Logger {
  Logger(
    min_level: LogLevel,
    entries: List(LogEntry),
    max_entries: Int,
  )
}

/// Create a new logger
pub fn new(min_level: LogLevel) -> Logger {
  Logger(min_level: min_level, entries: [], max_entries: 10000)
}

/// Log a message
pub fn log(
  logger: Logger,
  level: LogLevel,
  message: String,
  module: String,
  timestamp_ns: Int,
) -> Logger {
  case should_log(logger.min_level, level) {
    False -> logger
    True -> {
      let entry = LogEntry(
        level: level,
        message: message,
        module: module,
        timestamp_ns: timestamp_ns,
        fields: [],
      )
      add_entry(logger, entry)
    }
  }
}

/// Log trace level
pub fn trace(logger: Logger, message: String, module: String, ts: Int) -> Logger {
  log(logger, Trace, message, module, ts)
}

/// Log debug level
pub fn debug(logger: Logger, message: String, module: String, ts: Int) -> Logger {
  log(logger, Debug, message, module, ts)
}

/// Log info level
pub fn info(logger: Logger, message: String, module: String, ts: Int) -> Logger {
  log(logger, Info, message, module, ts)
}

/// Log warn level
pub fn warn(logger: Logger, message: String, module: String, ts: Int) -> Logger {
  log(logger, Warn, message, module, ts)
}

/// Log error level
pub fn error(logger: Logger, message: String, module: String, ts: Int) -> Logger {
  log(logger, Error, message, module, ts)
}

/// Get all entries
pub fn get_entries(logger: Logger) -> List(LogEntry) {
  logger.entries
}

/// Clear all entries
pub fn clear(logger: Logger) -> Logger {
  Logger(..logger, entries: [])
}

// Helper functions
fn should_log(min_level: LogLevel, level: LogLevel) -> Bool {
  level_to_int(level) >= level_to_int(min_level)
}

fn level_to_int(level: LogLevel) -> Int {
  case level {
    Trace -> 0
    Debug -> 1
    Info -> 2
    Warn -> 3
    Error -> 4
    Fatal -> 5
  }
}

fn add_entry(logger: Logger, entry: LogEntry) -> Logger {
  let entries = case list_length(logger.entries) >= logger.max_entries {
    True -> drop_oldest(logger.entries)
    False -> logger.entries
  }
  Logger(..logger, entries: [entry, ..entries])
}

fn list_length(list: List(a)) -> Int {
  case list {
    [] -> 0
    [_, ..rest] -> 1 + list_length(rest)
  }
}

fn drop_oldest(list: List(a)) -> List(a) {
  reverse(drop_last(reverse(list)))
}

fn drop_last(list: List(a)) -> List(a) {
  case list {
    [] -> []
    [_] -> []
    [first, ..rest] -> [first, ..drop_last(rest)]
  }
}

fn reverse(list: List(a)) -> List(a) {
  reverse_helper(list, [])
}

fn reverse_helper(list: List(a), acc: List(a)) -> List(a) {
  case list {
    [] -> acc
    [first, ..rest] -> reverse_helper(rest, [first, ..acc])
  }
}
