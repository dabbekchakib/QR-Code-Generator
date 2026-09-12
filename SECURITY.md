# Security

Security and privacy notes for QR Manager. This document summarizes the
current posture, the controls in place and the known limitations.

## Data model & privacy

- **Local-first**: QR codes are stored in IndexedDB on the device
  (`qr-manager`, stores `qr-codes` + `sync-queue`). The app works fully
  offline and without an account.
- **Cloud (optional)**: when signed in, records are mirrored to Supabase
  (Postgres). Static QR data, customizations and logos are **never** uploaded
  unless the user signs in and creates them online.
- **Scan analytics** store only three limited categories per hit: **device
  type**, **OS**, **browser** (derived server-side). **No IP address, no raw
  User-Agent, no location, no cookies, no fingerprinting** is stored.
- **No third-party trackers** (no analytics SDK, no ads, no marketing pixels),
  and **no external code** is ever loaded at runtime (all JS/CSS is
  same-origin and bundled).

## Authentication & authorization

- Supabase Auth (email/password), sessions refreshed via middleware
  (`src/middleware.ts`). Auth is purely additive — anonymous local mode is a
  first-class supported state.
- Row-level security is enabled on `qr_codes` (migration 01), `profiles`
  (01), and `qr_scans` (04). Each table has only the policies it needs:
  - `qr_codes`: owner SELECT/INSERT/UPDATE/DELETE (own rows only).
  - `qr_scans`: owner SELECT **only** — there is deliberately **no** client
    INSERT/UPDATE/DELETE policy; scan creation happens exclusively through the
    `SECURITY DEFINER` function `record_qr_scan()`.
- Public route `/qr/[shortCode]` resolves codes server-side via
  `resolve_dynamic_qr` (migration 03, `SECURITY DEFINER`) and records scans via
  `record_qr_scan()` (migration 04). It never accepts a client-supplied QR id.
- Analytics functions (`get_qr_analytics`, `get_qr_performance`,
  `get_qr_comparison`, `get_qr_scans_export`, `list_dynamic_qrs`) are all
  `SECURITY DEFINER`, scope every read to `auth.uid()`, verify per-QR
  ownership, and have `EXECUTE` revoked from `anon`.
- `record_qr_scan` must remain executable by `anon` (visitor tracking). The
  anti-flood guard (migration 07) pauses tracking for a code that receives
  more than 1200 scans in 10 minutes — generous enough never to clip real
  traffic, bounding only true floods.

## Sync queue & shared devices

- The offline queue is **per-user scoped**: every `SyncOperation` carries the
  `userId` it was enqueued for (`src/features/qr/sync/types.ts`). `processQueue`
  replays only the operations of the signed-in user, so a queued mutation from
  one account can never be written into another account on the same device
  (`sync-engine.ts`). Operations queued before this field existed (legacy,
  `userId = null`) are attributed to the account that processes them next.
- Signed-out data is **never deleted**, by design: sign-out clears the auth
  state, not IndexedDB or the queue.
- **Known limitation**: the app is designed around *one primary user per
  device*. The sync queue persists across accounts so that a re-authenticating
  user does not lose pending work, but if two different people use the same
  device and *both* sign in, their local records remain shared in IndexedDB
  (cloud records stay separate). This is documented, deliberate scope.

## PWA / service worker policy

- The service worker (`public/sw.js`) caches **only same-origin** shell pages
  and build assets.
- **Supabase API calls, auth calls and anything with an `Authorization`
  header are never cached** — private data can never be served stale from the
  cache.
- Offline navigation falls back to the exact-URL cached document, then the
  cached `/` shell, then `/offline`.
- Updates are controlled: a new worker waits (`no skipWaiting()`), the UI
  shows a "Refresh to update" banner, and only the user's click posts
  `SKIP_WAITING`.
- IndexedDB is never read or written by the worker.

## Transport & headers

`next.config.ts` sets a Content-Security-Policy and `securityHeaders` are
applied to every response:

- `Content-Security-Policy` — allows only same-origin script/style sources,
  `data:`/`blob:` for images/fonts/downloads, `connect-src` is restricted and
  includes the configured Supabase origin only.
- `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy`, `X-DNS-Prefetch-Control`.
- The public QR redirect additionally sends `no-store`, `noindex` and
  `Referrer-Policy: no-referrer`.

**Known trade-off**: the CSP uses `style-src 'unsafe-inline'` because Tailwind
v4 + inline style injection are used by the design system. This is documented
and reviewed; removing it would break the designer. No `script-unsafe-eval`
is used.

## Input validation

- **Logo uploads** (`designer/qr-logo.ts`): MIME allow-list
  (PNG/JPEG/WebP/SVG), 2 MB cap, browser decode gate, and SVG content
  sanitization — scripts, event handlers, `<foreignObject>`,
  `javascript:`/`vbscript:`/`data:text/html` URLs, external `href`/`src`/`url()`
  references are rejected (`CONTENT` error). Logos stay in the browser and are
  never uploaded.
- **Backup import** (`storage/backup.ts`): Zod-validated envelope (`app`,
  `version`), a hard cap of 250 QR records per file and 50 MB file size, and a
  per-logo data-URL length cap. Exports carry only privacy-safe columns.
- **QR payload escaping** (`lib/qr-generator.ts`): WiFi and vCard fields escape
  `\ ; , : "` and strip CR/LF so user text can never inject extra fields or
  lines into the encoded payload.
- **CSV exports** (`analytics/utils/analytics-export.ts`): RFC 4180 quoting
  plus spreadsheet-formula neutralization (`= + - @ \t` and CR prefixes are
  prefixed with `'`) to prevent formula injection when opening exports in
  Excel/LibreOffice.
- **Dynamic destinations**: only `http(s)` absolute URLs are accepted
  (`dynamic/destination.ts`); static-code and javascript: schemes are rejected
  before anything is stored or rendered.

## Secrets & configuration

- No secrets are committed. `.gitignore` excludes `.env`, `.env.*` except
  `.env.example`; the example ships no real values.
- All Supabase access keys are `NEXT_PUBLIC_*` (inherently public by design)
  and are gated by RLS on the server; there are no server-side secrets in the
  repository.

## Vulnerability reporting

QR Manager is a free, non-commercial open-source project. For security issues,
contact the maintainer privately (see the repository owner) with a minimal
reproduction. **Do not** open public issues for 0-day security details.

## Known limitations (accepted risk)

1. **Shared-device multi-account**: see the sync-queue section above.
2. **Anonymous scan tracking vs. floods**: mitigated per-code via migration 07,
   but a sustained multi-IP flood can still generate rows for an active code
   up to the per-window cap.
3. **Public QR analytics are per-hit, not per-unique-visitor**: documented
   product decision (`1 hit = 1 scan`).
4. **CSP `style-src 'unsafe-inline'`**: required by the design system (above).