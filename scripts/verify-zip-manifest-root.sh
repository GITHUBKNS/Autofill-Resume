#!/usr/bin/env bash
set -euo pipefail

ZIP_PATH="${1:-dist/extension.zip}"

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Zip file not found: $ZIP_PATH"
  exit 1
fi

python3 - "$ZIP_PATH" <<'PY'
import sys, zipfile
zip_path = sys.argv[1]
with zipfile.ZipFile(zip_path) as zf:
    names = zf.namelist()

has_root_manifest = 'manifest.json' in names
nested_manifests = [n for n in names if n.endswith('/manifest.json') or (n.count('/') > 0 and n.endswith('manifest.json'))]

if not has_root_manifest:
    print(f"ERROR: {zip_path} is missing manifest.json at zip root")
    if nested_manifests:
        print("Found nested manifest candidates:")
        for n in nested_manifests:
            print(f"  - {n}")
    sys.exit(1)

print(f"OK: {zip_path} contains root manifest.json")
PY
