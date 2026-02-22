# Autofill Resume Extension

This repository now contains a **publishable Manifest V3 Chrome extension** scaffold for resume profile storage and one-click autofill.

## What is included

- MV3 extension with:
  - popup UI for selecting a profile and triggering fill
  - options page for creating profiles
  - service worker for orchestration and tab messaging
  - content script for heuristic field filling
- Build pipeline to produce:
  - `dist/extension/` (load unpacked)
  - `dist/extension.zip` (Chrome Web Store upload)
- CI workflow for build checks
- Optional publish workflow scaffold using Chrome Web Store API

## Local development

```bash
npm install
npm run build:extension
```

Load `dist/extension` in Chrome:
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click **Load unpacked**
4. Select `dist/extension`

## Create store ZIP

```bash
npm run build
```

This creates `dist/extension.zip` and validates  that `manifest.json` is at the root of the zip package.

## Publish to Chrome Web Store

### Manual publish (recommended first release)
1. Build and zip: `npm run build`
2. Open Chrome Web Store Developer Dashboard
3. Upload `dist/extension.zip`
4. Fill listing + privacy fields
5. Submit for review and publish

### API-based publish (optional)
A workflow scaffold is provided in `.github/workflows/publish.yml`.
Set these GitHub secrets before running it:
- `CWS_REFRESH_TOKEN`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_EXTENSION_ID`

Then trigger the workflow manually from GitHub Actions.


## No-npm fallback build (for restricted environments)

If npm registry access is blocked, you can still build with Bun (already available in this environment):

```bash
./scripts/build-extension-bun.sh
./scripts/package-extension.sh
```

## One-command Chrome Web Store publish (API)

With credentials exported as environment variables, run:

```bash
./scripts/publish-cws.sh
```

Required variables:
- `CWS_REFRESH_TOKEN`
- `CWS_CLIENT_ID`
- `CWS_CLIENT_SECRET`
- `CWS_EXTENSION_ID`

## Notes

- This scaffold intentionally uses least-privilege extension permissions (`storage`, `scripting`, `activeTab`).
- It is a production starter, not a full compliance-complete product. Add encryption, consent UX, and policy text before public launch.


### Validate an existing zip package

```bash
./scripts/verify-zip-manifest-root.sh dist/extension.zip
```
