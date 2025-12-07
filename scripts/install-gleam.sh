#!/usr/bin/env bash
set -euo pipefail

# Usage: GLEAM_VERSION=1.11.0 ./scripts/install-gleam.sh
GLEAM_VERSION="${GLEAM_VERSION:-1.11.0}"
TARGET_DIR="/usr/local/gleam-${GLEAM_VERSION}"
TMP_TAR="/tmp/gleam-${GLEAM_VERSION}.tar.gz"

echo "Installing Gleam ${GLEAM_VERSION}..."

# Fetch release tarball (Linux x86_64). If you need mac/arm64, adapt accordingly.
GITHUB_RELEASE="https://github.com/gleam-lang/gleam/releases/download/v${GLEAM_VERSION}/gleam-${GLEAM_VERSION}-x86_64-linux.tar.gz"

curl -fsSL "${GITHUB_RELEASE}" -o "${TMP_TAR}"
sudo rm -rf "${TARGET_DIR}"
sudo mkdir -p "${TARGET_DIR}"
sudo tar -C /usr/local -xzf "${TMP_TAR}"
export PATH="/usr/local/gleam-${GLEAM_VERSION}/bin:${PATH}"

echo "Gleam installed at /usr/local/gleam-${GLEAM_VERSION}"
gleam --version || (echo "gleam not found on PATH" && exit 2)

# ensure rebar3 is available (Gleam's test tooling sometimes needs it)
if ! command -v rebar3 &>/dev/null; then
  echo "Installing rebar3..."
  REBAR3_URL="https://github.com/erlang/rebar3/releases/download/3.20.0/rebar3"
  sudo curl -fsSL -o /usr/local/bin/rebar3 "${REBAR3_URL}"
  sudo chmod +x /usr/local/bin/rebar3
fi

echo "Gleam, rebar3 available"
