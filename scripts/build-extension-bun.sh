#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist/extension"

rm -rf "$DIST"
mkdir -p "$DIST"

bun build "$ROOT/extension/src/service_worker.ts" --outfile "$DIST/service_worker.js" --target browser
bun build "$ROOT/extension/src/content_script.ts" --outfile "$DIST/content_script.js" --target browser
bun build "$ROOT/extension/src/popup/popup.ts" --outfile "$DIST/popup.js" --target browser
bun build "$ROOT/extension/src/options/options.ts" --outfile "$DIST/options.js" --target browser

cp "$ROOT/extension/manifest.json" "$DIST/manifest.json"
cp "$ROOT/extension/src/popup/popup.html" "$DIST/popup.html"
cp "$ROOT/extension/src/popup/popup.css" "$DIST/popup.css"
cp "$ROOT/extension/src/options/options.html" "$DIST/options.html"
cp "$ROOT/extension/src/options/options.css" "$DIST/options.css"

echo "Built extension in $DIST"
