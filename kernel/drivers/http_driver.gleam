//// kernel/drivers/http_driver.gleam
////
//// ESTA Logic HTTP Driver
////
//// Reference: docs/abi/kernel_contract.md
//// Version: 1.0.0

/// HTTP method
pub type Method {
  Get
  Post
  Put
  Delete
  Patch
  Head
  Options
}

/// HTTP request
pub type Request {
  Request(
    method: Method,
    url: String,
    headers: List(#(String, String)),
    body: Result(String, Nil),
  )
}

/// HTTP response
pub type Response {
  Response(
    status: Int,
    headers: List(#(String, String)),
    body: String,
  )
}

/// Execute an HTTP request
pub fn execute(
  _request: Request,
  _timeout_ms: Int,
  _capability: Int,
) -> Result(Response, String) {
  Ok(Response(status: 200, headers: [], body: ""))
}

/// Execute a GET request
pub fn get(
  url: String,
  headers: List(#(String, String)),
  _capability: Int,
) -> Result(Response, String) {
  execute(
    Request(method: Get, url: url, headers: headers, body: Error(Nil)),
    30_000,
    0,
  )
}

/// Execute a POST request
pub fn post(
  url: String,
  headers: List(#(String, String)),
  body: String,
  _capability: Int,
) -> Result(Response, String) {
  execute(
    Request(method: Post, url: url, headers: headers, body: Ok(body)),
    30_000,
    0,
  )
}
