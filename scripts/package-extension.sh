#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"
EXT_DIST="$DIST/extension"
ZIP="$DIST/extension.zip"

if [[ ! -d "$EXT_DIST" ]]; then
  echo "Missing $EXT_DIST. Build first."
  exit 1
fi

ZIP_PATH="$ZIP" python3 - <<'PY'
import os, pathlib
zip_path = pathlib.Path(os.environ['ZIP_PATH'])
if zip_path.exists():
    zip_path.unlink()
PY

(cd "$EXT_DIST" && zip -r "$ZIP" .)
"$ROOT/scripts/verify-zip-manifest-root.sh" "$ZIP"

echo "Packaged extension zip: $ZIP"
