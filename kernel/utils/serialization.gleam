//// kernel/utils/serialization.gleam
////
//// ESTA Logic Serialization Utilities
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// Serialization format
pub type Format {
  Json
  MessagePack
  Protobuf
  Binary
}

/// Serialization result
pub type SerializeResult {
  SerializeOk(data: List(Int))
  SerializeError(reason: String)
}

/// Deserialization result
pub type DeserializeResult(a) {
  DeserializeOk(value: a)
  DeserializeError(reason: String)
}

/// Serialize to bytes
pub fn serialize_to_bytes(_value: a, _format: Format) -> SerializeResult {
  SerializeOk(data: [])
}

/// Deserialize from bytes
pub fn deserialize_from_bytes(
  _data: List(Int),
  _format: Format,
) -> DeserializeResult(String) {
  DeserializeOk(value: "")
}

/// Serialize integer to bytes
pub fn int_to_bytes(value: Int, size: Int) -> List(Int) {
  int_to_bytes_helper(value, size, [])
}

fn int_to_bytes_helper(value: Int, remaining: Int, acc: List(Int)) -> List(Int) {
  case remaining <= 0 {
    True -> acc
    False -> {
      let byte = value % 256
      int_to_bytes_helper(value / 256, remaining - 1, [byte, ..acc])
    }
  }
}

/// Deserialize bytes to integer
pub fn bytes_to_int(bytes: List(Int)) -> Int {
  bytes_to_int_helper(bytes, 0)
}

fn bytes_to_int_helper(bytes: List(Int), acc: Int) -> Int {
  case bytes {
    [] -> acc
    [b, ..rest] -> bytes_to_int_helper(rest, acc * 256 + b)
  }
}

/// Calculate checksum
pub fn checksum(data: List(Int)) -> Int {
  checksum_helper(data, 0)
}

fn checksum_helper(data: List(Int), acc: Int) -> Int {
  case data {
    [] -> acc % 65536
    [b, ..rest] -> checksum_helper(rest, acc + b)
  }
}
