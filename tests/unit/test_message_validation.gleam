//// tests/unit/test_message_validation.gleam
////
//// Unit Test: Message Validation
////
//// Version: 1.0.0

import gleeunit/should

/// Test valid message
pub fn test_valid_message() {
  let msg = create_message(1, 2, "test")
  let result = validate_message(msg)
  should.equal(result, Ok(Nil))
}

/// Test invalid source
pub fn test_invalid_source() {
  let msg = create_message(0, 2, "test")
  let result = validate_message(msg)
  should.equal(result, Error("Invalid source"))
}

/// Test invalid target
pub fn test_invalid_target() {
  let msg = create_message(1, 0, "test")
  let result = validate_message(msg)
  should.equal(result, Error("Invalid target"))
}

/// Test empty payload
pub fn test_empty_payload() {
  let msg = create_message(1, 2, "")
  let result = validate_message(msg)
  should.equal(result, Error("Empty payload"))
}

/// Message type
pub type Message {
  Message(source: Int, target: Int, payload: String)
}

fn create_message(source: Int, target: Int, payload: String) -> Message {
  Message(source: source, target: target, payload: payload)
}

fn validate_message(msg: Message) -> Result(Nil, String) {
  case msg.source <= 0 {
    True -> Error("Invalid source")
    False ->
      case msg.target <= 0 {
        True -> Error("Invalid target")
        False ->
          case msg.payload == "" {
            True -> Error("Empty payload")
            False -> Ok(Nil)
          }
      }
  }
}
