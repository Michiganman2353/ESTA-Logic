#!/usr/bin/env bash
set -euo pipefail

# Usage: GLEAM_VERSION=1.11.0 ./scripts/install-gleam.sh
GLEAM_VERSION="${GLEAM_VERSION:-1.11.0}"
TMP_TAR="/tmp/gleam-${GLEAM_VERSION}.tar.gz"
INSTALL_DIR="/usr/local"

echo "Installing Gleam ${GLEAM_VERSION}..."

# Fetch release tarball (Linux x86_64). If you need mac/arm64, adapt accordingly.
GITHUB_RELEASE="https://github.com/gleam-lang/gleam/releases/download/v${GLEAM_VERSION}/gleam-${GLEAM_VERSION}-x86_64-linux.tar.gz"

curl -fsSL "${GITHUB_RELEASE}" -o "${TMP_TAR}"
sudo tar -C "${INSTALL_DIR}" -xzf "${TMP_TAR}"

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
