//// drivers/hardware-sim/mock_network.gleam
////
//// Mock Network for Testing
////
//// Version: 1.0.0

/// Mock HTTP request
pub type MockRequest {
  MockRequest(
    method: String,
    url: String,
    headers: List(#(String, String)),
    body: Result(String, Nil),
  )
}

/// Mock HTTP response
pub type MockResponse {
  MockResponse(
    status: Int,
    headers: List(#(String, String)),
    body: String,
  )
}

/// Mock route handler
pub type MockRoute {
  MockRoute(
    method: String,
    pattern: String,
    response: MockResponse,
  )
}

/// Mock network state
pub type MockNetwork {
  MockNetwork(
    routes: List(MockRoute),
    requests: List(MockRequest),
    latency_ms: Int,
  )
}

/// Create a new mock network
pub fn new() -> MockNetwork {
  MockNetwork(routes: [], requests: [], latency_ms: 0)
}

/// Add a mock route
pub fn add_route(
  network: MockNetwork,
  method: String,
  pattern: String,
  response: MockResponse,
) -> MockNetwork {
  let route = MockRoute(method: method, pattern: pattern, response: response)
  MockNetwork(..network, routes: [route, ..network.routes])
}

/// Make a request
pub fn request(
  network: MockNetwork,
  req: MockRequest,
) -> #(MockNetwork, MockResponse) {
  let new_network = MockNetwork(..network, requests: [req, ..network.requests])
  case find_route(network.routes, req.method, req.url) {
    Ok(route) -> #(new_network, route.response)
    Error(_) -> #(new_network, MockResponse(status: 404, headers: [], body: "Not Found"))
  }
}

/// Set network latency
pub fn set_latency(network: MockNetwork, latency_ms: Int) -> MockNetwork {
  MockNetwork(..network, latency_ms: latency_ms)
}

/// Get all recorded requests
pub fn get_requests(network: MockNetwork) -> List(MockRequest) {
  network.requests
}

// Helper functions
fn find_route(
  routes: List(MockRoute),
  method: String,
  url: String,
) -> Result(MockRoute, Nil) {
  case routes {
    [] -> Error(Nil)
    [r, ..rest] ->
      case r.method == method && matches_pattern(r.pattern, url) {
        True -> Ok(r)
        False -> find_route(rest, method, url)
      }
  }
}

fn matches_pattern(pattern: String, url: String) -> Bool {
  pattern == url
}
