#!/usr/bin/env bash
set -euo pipefail

# Usage: GLEAM_VERSION=1.11.0 ./scripts/install-gleam.sh
GLEAM_VERSION="${GLEAM_VERSION:-1.11.0}"
TMP_TAR="/tmp/gleam-v${GLEAM_VERSION}.tar.gz"
INSTALL_DIR="/usr/local"

echo "Installing Gleam ${GLEAM_VERSION}..."

# Fetch release tarball (Linux x86_64 musl). If you need mac/arm64, adapt accordingly.
GITHUB_RELEASE="https://github.com/gleam-lang/gleam/releases/download/v${GLEAM_VERSION}/gleam-v${GLEAM_VERSION}-x86_64-unknown-linux-musl.tar.gz"

curl -fsSL "${GITHUB_RELEASE}" -o "${TMP_TAR}"
# Extract directly to /usr/local/bin since the tarball contains just the 'gleam' binary
sudo tar -C "${INSTALL_DIR}/bin" -xzf "${TMP_TAR}"

echo "Gleam installed to ${INSTALL_DIR}/bin"
${INSTALL_DIR}/bin/gleam --version || (echo "gleam not found at ${INSTALL_DIR}/bin/gleam" && exit 2)

# ensure rebar3 is available (Gleam's test tooling sometimes needs it)
if ! command -v rebar3 &>/dev/null; then
  echo "Installing rebar3..."
  REBAR3_URL="https://github.com/erlang/rebar3/releases/download/3.20.0/rebar3"
  sudo curl -fsSL -o /usr/local/bin/rebar3 "${REBAR3_URL}"
  sudo chmod +x /usr/local/bin/rebar3
fi

echo "Gleam and rebar3 installed successfully"
echo "If running locally and 'gleam' is not found, run: export PATH=\"${INSTALL_DIR}/bin:\$PATH\""
