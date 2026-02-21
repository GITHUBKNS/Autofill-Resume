#!/usr/bin/env bash
set -euo pipefail

: "${CWS_REFRESH_TOKEN:?Missing CWS_REFRESH_TOKEN}"
: "${CWS_CLIENT_ID:?Missing CWS_CLIENT_ID}"
: "${CWS_CLIENT_SECRET:?Missing CWS_CLIENT_SECRET}"
: "${CWS_EXTENSION_ID:?Missing CWS_EXTENSION_ID}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ZIP="$ROOT/dist/extension.zip"

echo "Building fresh package to ensure manifest.json is at zip root..."
if command -v npm >/dev/null 2>&1 && [[ -f "$ROOT/package.json" ]]; then
  if npm run build >/dev/null 2>&1; then
    :
  else
    "$ROOT/scripts/build-extension-bun.sh"
    "$ROOT/scripts/package-extension.sh"
  fi
else
  "$ROOT/scripts/build-extension-bun.sh"
  "$ROOT/scripts/package-extension.sh"
fi

"$ROOT/scripts/verify-zip-manifest-root.sh" "$ZIP"

TOKEN_JSON="$(curl -sS https://oauth2.googleapis.com/token \
  -d client_id="$CWS_CLIENT_ID" \
  -d client_secret="$CWS_CLIENT_SECRET" \
  -d refresh_token="$CWS_REFRESH_TOKEN" \
  -d grant_type=refresh_token)"

ACCESS_TOKEN="$(python3 - <<'PY'
import json,sys
obj=json.loads(sys.stdin.read())
print(obj.get('access_token',''))
PY
<<< "$TOKEN_JSON")"

if [[ -z "$ACCESS_TOKEN" ]]; then
  echo "Failed to fetch OAuth token"
  echo "$TOKEN_JSON"
  exit 1
fi

echo "Uploading zip for extension: $CWS_EXTENSION_ID"
curl -sS -X PUT \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-goog-api-version: 2" \
  -T "$ZIP" \
  "https://www.googleapis.com/upload/chromewebstore/v1.1/items/$CWS_EXTENSION_ID"

echo
echo "Publishing extension..."
curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-goog-api-version: 2" \
  "https://www.googleapis.com/chromewebstore/v1.1/items/$CWS_EXTENSION_ID/publish"

echo
echo "Publish request submitted."
