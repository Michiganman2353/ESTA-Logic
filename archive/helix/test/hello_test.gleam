/// packages/helix/test/hello_test.gleam
/// Minimal smoke test so `gleam test` always finds an exported entrypoint.
///
/// This file uses gleeunit as a basic test framework that Gleam's test
/// runner will discover. It is intentionally tiny — it ensures CI will never
/// exit "No tests found".

import gleeunit
import gleeunit/should

pub fn main() {
  gleeunit.main()
}

/// Basic smoke test - always passes
pub fn basic_true_test() {
  1
  |> should.equal(1)
}
