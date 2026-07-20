#!/bin/bash
# Position-aware Explore comparison validator.

set -u
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec python3 "$SCRIPT_DIR/check-explore-variants.py" "$@"
