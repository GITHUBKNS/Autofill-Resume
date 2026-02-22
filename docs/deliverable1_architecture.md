# Deliverable 1 — High-Level Architecture & Component Breakdown

## 1) System goals and design constraints

This extension is designed to:
- Store and manage multiple resume-derived profiles.
- Autofill job application forms with explicit user control.
- Keep sensitive data protected by default.

The architecture is explicitly shaped by:
- **Chrome Extension Manifest V3 (MV3)**: all executable code must be bundled in the extension; no remote code execution.
- **Chrome Web Store user-data rules**: least permissions, clear single purpose, secure handling of user data, and strong limits on browsing-activity collection.

## 2) Top-level architecture

```text
┌─────────────────────────── Extension (MV3) ────────────────────────────┐
│                                                                        │
│  Popup UI (React/TS)      Options UI (React/TS)                        │
│  - Select profile          - Upload resume                              │
│  - Trigger Fill            - Review extraction                          │
│  - Preview/Undo toggles    - Manage profiles/privacy                    │
│           │                           │                                 │
│           └──────────────┬────────────┘                                 │
│                          ▼                                              │
│                Service Worker (Background)                              │
│                - Orchestrates commands                                  │
│                - Handles state persistence                              │
│                - Injects/messaging content script                       │
│                - Enforces user-gesture gating                           │
│                          │                                              │
│                          ▼                                              │
│                    Content Script                                       │
│                    - Detect fields                                      │
│                    - Compute mappings                                   │
│                    - Preview → confirm → apply fill                     │
│                    - Undo + dynamic form observer                       │
│                                                                        │
│  Shared Libraries                                                       │
│  - Crypto (PBKDF2 + AES-GCM, Web Crypto)                               │
│  - Schema/types/validation                                              │
│  - Extract pipeline (PDF.js, mammoth.js, OCR hook)                     │
│                                                                        │
│  Local Vault                                                            │
│  - Encrypted blobs in chrome.storage.local                              │
│  - Optional encrypted file payloads in IndexedDB                        │
└────────────────────────────────────────────────────────────────────────┘

Optional cloud sync (separate service):
- Stores only encrypted ciphertext blobs + metadata.
- Never receives extension executable logic.
```

## 3) Component breakdown

### A) Gemini Labs “Gem” (generator)
- **Responsibility**: generate reproducible monorepo scaffolding, code, tests, and packaging workflow.
- **Interfaces**: input prompt/instructions → output repo tree and files.
- **Constraint fit**: helps enforce MV3-safe and reviewer-friendly patterns across generated projects.

### B) Popup frontend
- **Responsibility**:
  - Profile selector and Fill trigger.
  - Show status (fields detected, confidence, review-needed count).
  - Fast user-control actions (undo, preview requirement).
- **Interfaces**:
  - `chrome.runtime.sendMessage` to service worker.
  - Read current profile metadata from encrypted storage wrapper.
- **Tech**: TypeScript + React + Vite bundle.

### C) Options frontend
- **Responsibility**:
  - Resume upload/import flow.
  - Extraction review and correction UI.
  - Profile CRUD, default profile selection.
  - Privacy/security controls (consent toggles, delete-all-data).
- **Interfaces**:
  - Uses shared extraction + crypto modules.
  - Persists encrypted profile payloads.

### D) Service worker (MV3 background)
- **Responsibility**:
  - Command orchestration (`FILL_ACTIVE_TAB`, import/save workflows).
  - Script injection (`chrome.scripting.executeScript`) and content-script messaging.
  - Durable state handling despite worker suspension.
  - Optional auth token mediation for cloud sync.
- **Key design note**:
  - Service worker is non-persistent; all critical state must be stored, not kept only in memory.

### E) Content script
- **Responsibility**:
  - DOM scanning for form controls.
  - Label/attribute/autocomplete-based field matching.
  - Preview overlay for user confirmation.
  - Fill apply + undo support.
  - Dynamic field detection via `MutationObserver`.
- **Security note**:
  - Runs in isolated world; page scripts cannot directly read extension variables.

### F) Vault storage subsystem
- **Local MVP mode**:
  - Store encrypted profile and extraction artifacts in `chrome.storage.local`.
  - Use IndexedDB for larger encrypted file blobs if needed.
- **Cloud-sync mode (optional)**:
  - Sync only ciphertext + metadata to backend.
  - Client keeps decryption capability (passphrase-derived key model).

### G) Extraction pipeline (hybrid)
- **Responsibility**:
  - Convert uploaded files to normalized text.
  - Extract structured profile candidates with confidence + provenance.
- **Default libraries**:
  - PDF: PDF.js
  - DOCX: mammoth.js
  - OCR fallback: Tesseract.js
- **Output**:
  - `ProfileDraft` object, confidence per field, warning list, and evidence snippets.

### H) Optional backend API
- **Responsibility**:
  - Account/session integration.
  - Encrypted blob sync and version metadata.
  - Device management, audit events, and enterprise hooks.
- **Data policy**:
  - Store ciphertext only for user profile payloads.
  - No plaintext resume/profile fields server-side in E2EE mode.

### I) Admin tools (internal, optional)
- **Responsibility**:
  - Deletion requests, abuse controls, operational dashboards.
- **Constraint**:
  - No default admin access to raw user PII; strict least-privilege and justified-access flows.

### J) Privacy-safe telemetry
- **Responsibility**:
  - Reliability metrics (success rates, mapping corrections, latency, errors).
- **Constraint**:
  - No PII payloads.
  - No broad browsing-activity collection.
  - Prefer aggregated counters and opt-in reporting.

## 4) End-to-end data flow (happy path)

1. User opens popup/options and uploads resume.
2. UI routes file by type (`PDF`, `DOCX`, `TXT`; OCR only when needed).
3. Extraction creates normalized text + `ProfileDraft` with confidence and evidence.
4. User reviews/edits fields and explicitly confirms save.
5. Extension encrypts payload with Web Crypto and stores ciphertext in local vault.
6. On a target job page, user clicks **Fill** in popup.
7. Service worker injects/activates content script for active tab.
8. Content script maps fields, shows preview, then applies fill on explicit confirmation.
9. Undo metadata is retained for rollback; mapping hints are stored encrypted for site origin.

## 5) Permission and trust model

Minimum default permissions:
- `storage`
- `scripting`
- `activeTab`

Principles:
- Request access only at the moment of user action.
- Prefer runtime/optional permissions over broad static host access.
- Never auto-submit forms by default.
- Require explicit user confirmation for low-confidence mappings and sensitive categories.

## 6) Resilience and reliability notes

- Persist all operation state transitions (import started, extraction complete, fill pending, fill applied).
- Treat content script communication as retryable (tab reload, SPA transitions).
- Keep deterministic heuristic matching as baseline; layer semantic matching later.
- Always provide manual correction path and undo capability.

## 7) Security baseline checklist

- Encrypt all profile/resume artifacts before storage.
- Keep key derivation and encryption local to extension context.
- Separate sensitive demographics and keep disabled by default.
- Never infer or auto-populate demographics silently.
- Include clear deletion controls and policy disclosures.
