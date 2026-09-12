# Testing

Unit testing strategy for QR Manager (Vitest + `fake-indexeddb` + jsdom).

## Running the suite

```bash
npm test           # full run
npm run test:watch # watch mode
```

There is no separate `typecheck` script in `package.json`; type-checking
happens in CI via `tsc --noEmit` (documented here because the project relies on
it) and inside `next build`:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

## Test config

- **`vitest.config`** — jsdom environment, `fake-indexeddb` registered
  globally (IndexedDB tests), path alias `@/` → `src/`.
- Tests live **next to the code**: `src/features/**/*.test.ts` and
  `src/features/**/__tests__/`, plus framework-level suites
  (`src/i18n`, `src/lib`, `src/app/...`).
- IndexedDB suites reset the schema before each case
  (`resetDBForTests` from `storage/db`).

## Coverage matrix (most valuable invariants)

### Core generator (`features/qr/lib/qr-generator.test.ts`)
- URL auto-`https://`, phone/WhatsApp normalization, `mailto:` encoding.
- WiFi escaping (`\ " ; : ,`) **and CR/LF stripping** (no payload breakage).
- vCard CRLF output, field escaping, and **newline injection resistance**
  (multi-line `NOTE`/`ORG`/`FN` collapse to a space).

### Storage & backup (`features/qr/__tests__/backup.test.ts`,
`customization.test.ts`)
- Backup envelope parsing, per-type record schema, dynamic-required fields.
- **Import caps**: >250 records, >50 MB raw JSON and over-sized logo data URLs
  are rejected.
- `normalizeCustomization` backward-compat for Phase 5/8 defaults.

### Offline sync queue (`features/qr/__tests__/sync-queue.test.ts`)
- FIFO order, global + **per-user `pendingCountForUser`/`listOperationsForUser`**.
- Coalescing: UPDATE-over-CREATE refreshes payload, UPDATE supersedes UPDATE,
  DELETE cancels queued CREATE/UPDATE, CREATE-after-DELETE replaces, duplicate
  DELETE ignored.
- Legacy `userId = null` ops are attributed to the current account.

### Sync engine & retries (`features/qr/sync/__tests__/retry.test.ts`,
`qr-service-sync.test.ts`, `dynamic-qr.test.ts`)
- Backoff schedule 1s/2s/4s/8s capped; `MAX_RETRY_COUNT`/`MAX_SCHEDULED_RETRIES`.
- Permanent vs transient error classification (401/403/404/422,
  PG `23502/23503/23505/23514`, `PGRST116`).
- Offline queueing, replay on reconnect, `processQueue` scoped to the signed-in
  user, delete-before-push ordering, logout keeps local data.

### Conflict resolution (`features/qr/__tests__/conflicts.test.ts`)
- Newest `updated_at` wins; dynamic destination edits keep the short code.

### Dynamic QR (`features/qr/__tests__/dynamic-qr.test.ts`)
- Short-code alphabet/validation, destination validation (only `http(s)`),
  collision re-generation, offline dynamic creation queueing.

### Designer & exports (`features/qr/designer/__tests__/qr-logo.test.ts`,
`features/qr/__tests__/customization.test.ts`, `qr-render-svg` tests)
- **SVG logo sanitization**: scripts, event handlers, `<foreignObject>`,
  `javascript:`/`vbscript:`/`data:text/html`, external `href`/`src`/`url()` are
  rejected; safe vectors pass.
- Logo static checks (MIME allow-list, 2 MB cap, data-URL length cap).
- SVG/CSS geometry parity, transparency, RTL frame text, readability/contrast.

### Analytics (`features/analytics/__tests__/`)
- UA classification (iOS 13+, Chrome, Safari, Edge, Samsung Internet…).
- Period windows + granularity rules; avg-per-day and percentage safety
  (never NaN/Infinity); relative-time formatting.
- **CSV escaping**, UTF-8 BOM + CRLF, header-first output, and
  **formula-injection neutralization** (`= + - @ tab CR` prefixes).
- Envelope/report builders, filename datestamps.
- Repository mapping and `get_qr_scans_export` row caps.

### Redirect service (`features/analytics/__tests__/redirect-service.test.ts`)
- Scan tracking best-effort: a failing/blocked scan still returns the redirect.
- Disabled/missing/static codes never record scans.

### Seed / fixture integrity
- `package.json` scripts are linted (`eslint src/`) and type-checked; the
  production build (`next build --webpack`) runs a full TypeScript pass.

## Manual test matrix (recommended before each release)

1. **Offline first-install** — install the PWA, force offline immediately:
   app shell + `/offline` render; navigation is network-first.
2. **Controlled update** — deploy a new SW version: on next visit the banner
   appears; data is untouched until "Refresh".
3. **Anonymous QR creation** — create/edit/delete QR while signed out;
   everything persists in IndexedDB.
4. **Sign-in + sync** — first-login push dialog; online edits appear on a
   second device after sign-in; offline edits queue and replay on reconnect;
   pending badge clears.
5. **Shared device** — sign out user A with queued offline changes, sign in
   user B: B never sees A's pending count and cloud records of B are clean.
6. **Analytics** — a public `/qr/<code>` hit records 1 scan; disabled/static
   never; anon can't call `get_*` RPCs.
7. **CSV export** — a QR named `=SUM(A1)` exports as `'=SUM(A1)` and opens
   literally in Excel.
8. **Backup limits** — import a file with >250 records → rejected.
9. **SVG logo** — a logo file containing `<script>` is refused.
10. **Light/Dark/RTL/AR** — dashboard, designer and public-page screens are
    usable in all three languages with correct `dir`.