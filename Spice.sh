#!/usr/bin/env bash
set -euo pipefail
SPICE_APP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SPICE_APP_DIR/launch.py" "$@"
