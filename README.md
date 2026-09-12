# QR Manager

> **100% Free. No subscriptions. No ads.**

Create, customize and manage QR Codes from one simple, free application.

## Features

### Phase 10 (Current)
- **Advanced analytics & reports** — `/analytics` is now a full reporting dashboard built exclusively on real `qr_scans` data: **5 KPI cards** (Total / Today / This Week / This Month / **Avg per day**), a dependency-free SVG **Scans over time** chart, **Top QR Codes** (with View all), device/OS/browser breakdowns, **QR performance table**, **QR comparison**, and CSV/JSON/report **exports**
- **URL-driven filters** — the URL is the source of truth (`/analytics?range=…&qr=…[&from=&to=]`); period (Today / 7 / 30 / 90 days / All time / **Custom range**) and QR filters, with a **custom from/to range** validated as local calendar dates (≤ 365 days, end never in the future). Every URL value is re-validated on load; anything invalid falls back to a safe default
- **Smarter granularity** — trend buckets adapt to the selected window: hourly ≤ 48 h, **daily ≤ ~200 days**, weekly ≤ ~800 days, monthly otherwise. "Last 30 days" is now bucketed per day
- **QR performance table** — one row per Dynamic QR: Total / Today / Last 7 days / Last 30 days and **Last scan** ("just now", "x minutes ago"…) in the selected window, static codes intentionally absent (rendered "—", never a misleading 0)
- **QR comparison** — select 2–5 Dynamic QR codes (ownership validated server-side; foreign/deleted ids are rejected) to see per-QR totals, share of total, last scan and a mini bar chart over the identical window
- **Exports** — CSV (UTF-8 BOM, RFC 4180 quoting, localized headers), JSON (self-describing envelope: `generatedAt`, `filters`, `data`) and a plain-text **report** built from already-fetched secured data. Only privacy-safe columns are exposed (QR name, type, local scan time, device, OS, browser); the row count is server-capped (1–50 000)
- **Live data guarantees** — refresh button + "Updated at …" indicator, "—" for an empty window average, "Never scanned" labels, and no placeholder figures anywhere
- **Server-side SQL (migration 06)** — new `SECURITY DEFINER` functions `get_qr_performance()`, `get_qr_comparison()`, `get_qr_scans_export()` and a regenerated `get_qr_analytics()`; every function scopes all reads to `auth.uid()` with per-QR ownership guards, and `execute` is revoked from `anon` / granted to `authenticated`
- **Detail + dashboard integration** — the QR detail analytics card now shows Total / Today / Last 7 / Last 30 / Last scan, and the dashboard **Total Scans** and **Scans Today** tiles link into `/analytics`
- **States & a11y** — loading skeletons, error + retry, offline and sign-in prompts, empty states with a "Share a QR Code" CTA, a privacy-notice card, screen-reader textual chart summaries, and RTL-safe layout
- **i18n** — new analytics keys (filters, custom range, relative time, performance table, comparison, exports, reports) in FR, EN, AR
- **Unit tests** — 42 new tests: URL-selection parsing and fallbacks, custom-range validation, day counts, range windows, avg-per-day and percentage safety, relative-time formatting, CSV escaping/BOM, export validation, envelope and report builders. Suite total: 326 tests, all green

### Phase 9
- **Central sharing service** — new `src/features/sharing/` feature hosts the qr share/copy/download logic that the create, detail, library and dashboard screens all reuse (single implementation, no duplicated handlers)
- **Web Share API with reliable fallback** — a share button uses the native system share sheet (sharing the rendered PNG file when customization is active, falling back to text). When the native sheet is unavailable the button opens the **Share dialog** instead, so there is never a dead end: copy the permanent URL / content or download from there. `shareQRCode()` itself ends in clipboard as a last resort
- **Copy again, safely** — `copyToClipboard()` returns a structured `{ success, error? }` result (Clipboard API with an `execCommand` legacy fallback), and "Copy content" reuses the Phase 2 generator so the copied text always matches what the QR encodes
- **Public QR URL card** — the detail page now shows the QR's permanent public URL (LTR, mono), with **Copy link** and **Open**, plus a live publication badge: *Published / Publishing… / Pending changes / Not published / Offline* (published = signed in + online + up-to-date with the sync queue)
- **Safe opening & sharing** — "Open" only ever navigates to validated `http(s)` URLs in a new tab (`rel="noopener noreferrer"`); dynamic QR sharing always sends the permanent URL, never the destination; shared/copied files keep the `qr-manager-<name>.png` naming
- **Downloads everywhere** — PNG / SVG download actions (same icons as Phase 2/3) are exposed on the detail page, the library card menu, and the share dialog via the shared `DownloadQRButton`
- **Privacy & SEO** — `/robots.txt` disallows the private app pages and `/qr/`; login-gated pages and the public QR route send `noindex, nofollow`; the public QR response family adds `Referrer-Policy: no-referrer` and `X-Content-Type-Options: nosniff` on top of `no-store`
- **i18n** — a new `share` namespace (buttons, dialog, toasts, publication badges) is fully localized in FR, EN, AR
- **Unit tests** — clipboard behavior/fallbacks, safe-URL parsing (rejects `javascript:`, empty, malformed), share-metadata correctness (destination never exposed), native-share flows (file name, text share, abort, copied, failed) and queue pending-state detection. Suite total: 284 tests, all green

### Phase 8
- **Advanced designer** — `/create` now has a full design panel: the 5 one-click presets plus live preview, module styles (square/rounded/dots), independent finder-eye styles with optional eye color, foreground/background color pickers, size, quiet-zone margin and error-correction level
- **Center logo** — upload a PNG/JPEG/WebP/SVG (max 2 MB, never uploaded — read locally as a data URL) with size, margin and shape (square/rounded/circle) controls; drawn on a white contrast plate so it never blends into busy modules
- **Frames & text** — None / Simple / Rounded / Badge (top plate) / Scan (bottom band), with optional caption text (≤30 chars) that auto-detects RTL scripts (Arabic/Hebrew)
- **Transparent background** — export a PNG/SVG with no background rect (frame plates are dropped too) so the code composites cleanly on any surface
- **Readability guardrails** — live contrast check (≥4.5 good / ≥3 warning / <3 danger) plus warnings for small quiet zones, oversized logos (>25%), logos without correction H, transparent backgrounds, and decorative styles; overall quality is the worst severity present and nothing is silently changed
- **Real exports** — PNG is rasterized from the same draw-command list as the on-screen preview; SVG is a true vector (`buildQRSVG`) sharing identical geometry, so preview == PNG == SVG. Filenames are sanitized from the QR name (`qr-manager-<name>.png/.svg`)
- **Share** — native share sheet for the rendered PNG, falling back to text share and then clipboard
- **Design defaults** — `/settings` gains a "QR Design Defaults" card that stores the default style locally (logo excluded) and applies it to new codes
- **Backward compatible** — every new field is optional on `QRCustomization` and normalized at runtime (`normalizeCustomization`); legacy records, backups and cloud rows keep working and the JSONB `customization` column needs no migration
- **No engine duplication** — `qrcode` stays the single matrix source; the designer is a pure visualization layer (matrix/geometry → shared draw commands → SVG + canvas)
- **i18n** — all designer strings localized in FR, EN, AR
- **Unit tests** — readability/contrast, SVG output (frames, logo, transparency, RTL, eye colors), customization normalization and legacy round-trips, download filename sanitization, and preset design resolution. Suite total: 253 tests, all green

### Phase 7
- **Templates system** — 10 ready-made templates (Website, QR Menu, WhatsApp, Business Card, Contact, WiFi, Location, Event, Social Profile, Google Review) on `/templates`, with a gallery: live search, category chips, Recently Used, and local Favorites (indexed per device)
- **Design presets** — 5 one-click QR styles (Classic, Midnight, Minimal, Soft, Bold) in the customizer, with a live contrast check that warns when the foreground/background pair falls below 3:1
- **Template-driven creation** — `/create?template=<id>` prefills the wizard with the template's fields and its customization preset; dynamic templates (QR Menu, Google Review) pre-enable Dynamic mode with a permanent destination URL. Unknown template ids fall back to the normal create screen; `edit` mode always wins over the template param
- **No engine duplication** — templates are a thin input layer: each template declares fields + a Zod schema + a payload mapper, and feeds the exact same QR engine, offline queue, and cloud sync as regular QRs (Static/Dynamic, favorites, backup, edit, duplicate all work identically)
- **Non-invasive data** — saved QRs carry an optional `template_id` (`qr_codes.template_id`, migration 05) purely for the gallery/back-office; it is nullable so existing records, backups, and clouds rows are unaffected
- **Fully local & free** — templates are built-in defaults; category/recent/favorite state lives in a private IndexedDB store (`qr-manager-template-prefs`). No locked/premium templates, no tracking, no server round-trips to load a template
- **i18n** — all template names, descriptions, field labels, placeholders and design-preset labels are localized in FR, EN, AR (`t()` now supports `{param}` interpolation, e.g. the contrast ratio)
- **Unit tests** — 44 new tests: registry lookups, per-template schema validation (incl. location URL-or-coordinates and event date/time refines), payload → `generateQRContent` round trips, presets contrast ≥ 3:1, and `template_id` round trips through backup and cloud mappers. Suite total: 214 tests, all green

### Phase 6
- **Scan tracking** — every hit on an active Dynamic QR (with a destination) records exactly **one scan** (`qr_scans`, migration 04): a phone camera scan, a click, even a page reload. Replayed requests equal replayed scans; this is documented in-app (`1 hit = 1 scan`)
- **Privacy-first** — only three limited categories are stored per scan: **device type** (desktop/tablet/mobile/unknown), **operating system**, and **browser**. **No IP address, no raw User-Agent, no location, no cookies, no fingerprinting, no third-party trackers**
- **Server-side recording** — the public route resolves the QR, validates it is a dynamic + active code with a safe destination, then records the scan through the `SECURITY DEFINER` function `record_qr_scan()` (which resolves the short code internally — it never accepts a client-supplied QR id). **Tracking failures can never block the visitor's redirect**
- **Owner-only reads with RLS** — `qr_scans` has only a SELECT policy scoped to the QR owner (`qr_codes.user_id = auth.uid()`); anonymous visitors get no INSERT/UPDATE/DELETE access and are blocked from the analytics functions at the grant level (`revoke execute ... from anon`)
- **Single-fetch analytics** — `get_qr_analytics()` returns one JSON payload (summary, timeseries, top QR codes, devices, OS, browsers) scoped by `auth.uid()` with a per-QR ownership guard, so every dashboard widget shares the exact same period and QR filter
- **`/analytics` dashboard** — KPIs (Total / Today / This Week / This Month), a dependency-free SVG **Scans over time** chart (hourly for ≤48 h, daily, weekly, monthly), **Top QR Codes**, and device/OS/browser breakdowns with sizes and percentages; period (Today/7/30/90/all-time) and QR filters, empty/loading/error/offline states, and a privacy notice card
- **Detail analytics** — dynamic QRs show a compact scans summary plus a "View full analytics" link (`/analytics?qr=<id>`)
- **Real dashboard data** — dashboard KPI cards now show Total QR Codes, Dynamic QR Codes, **Total Scans** and **Scans Today** (all-time real data only; "—" when offline or signed out). Hard-coded placeholder stats were removed
- **Timezone-correct periods** — timestamps are stored in UTC; period windows are calendar-aligned to the visitor's local timezone (`offsetMinutes` passed to the RPC)
- **Unit tests** — UA parsing (iPhone/iPadOS 13+, Android Chrome, Windows Chrome, macOS Safari, Firefox, Edge, Samsung Internet, unknown), period windows, percentage safety (never NaN/Infinity), repository mappings, and redirect-service behavior (incl. tracking-failure resilience: a failing scan still redirects)
- **Live E2E** — verified against the production build + live Supabase: 28 checks covering scan recording per hit, disabled/static/missing QR never recording, anon blocked from analytics RPCs, ownership guard, aggregation correctness, and hourly/daily timeseries granularity

### Phase 5
- **Dynamic QR codes** — toggle between **Static** and **Dynamic** when saving (`/create`); dynamic codes get a permanent public URL `https://<APP_URL>/qr/<shortCode>` that always redirects to the latest destination
- **Editable destinations** — update the target URL of a dynamic code at any time without changing the shareable short URL (`/qrs/[id]`)
- **Disable / Enable** — dynamic codes can be turned off (public page returns **410 Gone**) and back on
- **Public redirect route** — server-side `src/app/qr/[shortCode]/route.ts` resolves via a `SECURITY DEFINER` Postgres function (`resolve_dynamic_qr`, migration 03) and returns **302** (active), **410** (disabled), **404** (missing or static), **400** (invalid code), **503** (temporary); responses are self-contained localized HTML (FR/EN/AR with RTL) and `noindex, nofollow`
- **Secure short codes** — 8-char URL-safe alphabet (no `0/O/1/l/I`), unique-index enforced, `createDynamic` auto-regenerates on collision (max 5 attempts)
- **Offline-first** — dynamic codes created offline are queued with their short code and destination, and replayed on reconnect like any other mutation
- **Duplicate** — duplicating a dynamic code generates a fresh short code (target URL is preserved)
- **Unit tests** — dynamic module (short codes, destination validation, create/update/disable, collision retry, offline queue) plus cloud-mapper and backup schema coverage

### Phase 4
- **Accounts (optional)** — email/password sign up, sign in, password reset via Supabase Auth (`/login`, `/register`, `/forgot-password`, `/reset-password`). The app remains **fully usable without an account** — auth is purely additive.
- **Cloud sync** — QR Codes stored in an IndexedDB-first cache that syncs to Postgres (`qr_codes` + `profiles` tables with row-level security) on every change, when online and signed in
- **Offline queue** — mutations made offline are queued locally and replayed in order on reconnect; edits coalesce (create+update/delete collapse)
- **Conflict resolution** — newest `updated_at` wins when a record changed on both sides
- **First-login sync dialog** — on first sign-in, choose to push local codes to the account, keep local only, or cancel
- **Sync status in app** — pending count badge, online indicator, "Load changes" action in the header, user menu with sign out
- **Profile settings** — display name editing, Data & Privacy card, auth-aware Account card
- **Server-side session middleware** — cookie refresh + guarding auth pages from signed-in users
- **Unit tests** — for cloud mappers/schemas, conflict resolution, sync queue coalescing, and the sync service (offline queueing, replay, logout-keeps-local)

### Phase 3
- **Local QR library** — QR Codes stored in IndexedDB on this device (no server)
- **`/qrs` library** — search, filter by status (All/Static/Favorites), filter by type, sort (recently updated/created, name A–Z/Z–A)
- **`/qrs/[id]` detail page** — preview on actual background, view content, download PNG/SVG, copy content, share, favorite, edit, duplicate, delete
- **Save & Edit flow** — Save a configured QR with a name; edit an existing QR in-place at `/create?edit=<id>` (type locked while editing)
- **Export / Import** — JSON backup files (`qr-manager-backup-YYYYMMDD.json`) with schema validation
- **Clear all local data** — with confirmation dialog (Settings → Local Data)
- **Dashboard** — real local QR count, favorites count, and Recent QR Codes
- **Homepage** — Recent QR Codes section when records exist
- **Toast notifications** — save/export/import/delete feedback (self-dismissing)
- **Data model** — `QRCodeRecord` stores the original data + customization (never only the generated image)
- **Repository abstraction** — `QRRepository` interface (IndexedDB implementation now, interchangeable for a future remote backend)
- **i18n coverage** — all library/detail/settings texts localized in FR, EN, AR
- **Unit tests** — for storage utilities (search/filter/sort, duplicate) and backup import/export validation

### Phase 2
- Real QR Code generation engine (client-side, `qrcode` library)
- Supported QR types: **URL**, **WiFi**, **Phone**, **Email**, **WhatsApp**, **vCard**, **Text**
- Local QR generation — your data never leaves your browser
- Real-time preview as you type
- Customization: size (256–1024px), margin, foreground & background colors, error correction level (L/M/Q/H)
- **Download PNG** and **Download SVG** exports
- **Copy content** (URL, WiFi data, vCard, etc.)
- Reset form & customization
- Per-type Zod validation with clear, accessible inline errors
- URL type auto-prepends `https://` when protocol is omitted
- WiFi output compatible with standard QR readers (special-char escaping, open networks, hidden SSID)
- vCard generation with CRLF line endings and proper escaping
- WhatsApp links with normalized numbers and URL-encoded messages
- Unicode support (French, Arabic, English, emojis)
- Direct links: `/create?type=url`, `/create?type=wifi`, etc.
- Unit tests for all QR data generators
- Offline-ready architecture

### Phase 1
- Modern, responsive UI (mobile-first)
- Light/Dark theme with system detection
- Internationalization (FR, EN, AR with RTL support)
- Dashboard with stats overview
- QR Code creation wizard (type selection)
- QR Code list management
- PWA with service worker & offline shell
- SEO optimized (Open Graph, metadata)
- Supabase integration ready (browser + server clients)
- TypeScript strict mode

### Upcoming Phases
- To be defined

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | App Router, React Server Components |
| TypeScript | Strict mode, full type safety |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui + Base UI | Accessible component library |
| Lucide React | Icon library |
| IndexedDB (`idb`) | Local persistence (My QR Codes) |
| Supabase | Auth (email/password) + Postgres with RLS |
| Zustand | Lightweight client state (sync status) |
| Zod | Schema validation |
| qrcode | Client-side QR Code generation |
| Vitest | Unit testing |
| PWA | Service Worker, manifest, offline support |

## Architecture

```
src/
├── app/                    # Next.js App Router
│   ├── (app)/              # Authenticated routes (sidebar layout)
│   │   ├── dashboard/
│   │   ├── create/
│   │   ├── qrs/
│   │   ├── analytics/
│   │   ├── templates/
│   │   └── settings/
│   ├── (auth)/             # Auth routes (standalone layout)
│   │   ├── login/
│   │   └── register/
│   ├── layout.tsx          # Root layout
│   ├── providers.tsx       # Theme, i18n, SW providers
│   ├── page.tsx            # Landing page
│   ├── qr/
│   │   └── [shortCode]/    # Public dynamic QR redirect route
│   └── not-found.tsx       # 404 page
├── components/             # Reusable UI components
│   ├── ui/                 # shadcn/ui components
│   ├── logo.tsx
│   ├── sidebar.tsx
│   ├── mobile-nav.tsx
│   ├── header.tsx
│   └── online-indicator.tsx
├── features/               # Feature-specific modules
│   ├── dashboard/
│   ├── templates/           # template registry, schemas, data, presets, gallery UI, prefs store
│   └── qr/
│       ├── components/      # QRType cards, forms, preview, customizer, download
│       │   ├── forms/       # URL, WiFi, Phone, Email, WhatsApp, vCard, Text forms
│       │   ├── library/     # QR card, skeleton, empty state
│       │   └── detail/      # QR detail page content
│       ├── hooks/           # use-qrs, use-qr-preview
│       ├── storage/         # QRCodeRecord, IndexedDB repository, sync queue DB, backup, utils
│       ├── cloud/           # Supabase repository, mappers, row validation
│       ├── sync/            # sync queue store, conflict resolution, sync engine
│       ├── dynamic/         # short codes, destination validation, public-page renderer, public URL
│       ├── service/         # qr-service orchestration (local cache + cloud + queue)
│       ├── lib/             # qr-generator, qr-renderer, qr-download, qr-clipboard
│       ├── __tests__/       # Unit tests
│       ├── types.ts         # Form values + customization types
│       └── schemas.ts       # Per-type Zod schemas
├── hooks/                  # Custom React hooks
├── i18n/                   # Internationalization
│   ├── config.ts
│   ├── translations.ts
│   └── provider.tsx
├── lib/                    # Utilities & configurations
│   ├── utils.ts
│   ├── auth/               # AuthProvider, use-auth, schemas/errors
│   ├── supabase/
│   ├── theme-provider.tsx
│   └── site-config.ts
├── services/               # Data services
├── types/                  # TypeScript types
└── validations/            # Zod schemas
```

## QR Generator

Supported QR types:

- **URL** — website links with auto `https://` when protocol is omitted
- **WiFi** — WPA/WPA2, WEP, or open networks; supports hidden SSID and special-character escaping
- **Phone** — normalized `tel:` links (spaces/dashes removed, international prefix kept)
- **Email** — `mailto:` with URL-encoded subject and body
- **WhatsApp** — `wa.me` links with normalized numbers and URL-encoded messages
- **vCard** — contact cards (FN, N, ORG, TITLE, TEL, EMAIL, URL, ADR, NOTE) with CRLF and escaping
- **Text** — free-form Unicode text (French, Arabic, English, emojis)

### Generator features

- **Local QR generation** — generated entirely in your browser, no data is sent to any server
- **PNG export** — download `qr-manager-{type}-{timestamp}.png`
- **SVG export** — true vector SVG, download `qr-manager-{type}-{timestamp}.svg`
- **Customization** — size (256/512/768/1024px), margin, foreground/background colors, error correction (L/M/Q/H)
- **Privacy** — your data stays in your browser; static QR codes are never uploaded
- **Offline-ready** — generation works without a network connection

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

No external services are **required** — everything runs locally in the browser. Supabase (Auth + Postgres) is optional and only enables accounts + cross-device sync.

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/qr-manager.git
cd qr-manager

# Install dependencies
npm install
```

### Supabase setup (optional)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000  # your public origin (permanent QR link)
   ```

3. Apply the migrations in `supabase/migrations/` (creates `profiles` and `qr_codes` tables with row-level security; migration 03 adds the dynamic QR fields and the `resolve_dynamic_qr` resolver function; migration 05 adds the optional `template_id` column).

Without this config the app still works fully locally, in anonymous mode.

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npx next build --webpack
npm run start
```

### Linting

```bash
npm run lint
```

### Tests

```bash
npm test
```

### Creating a QR Code

Navigate to `/create`, pick a type, fill in the fields — the QR code updates live. Open the design panel to pick a preset or fine-tune module/eye styles, colors, a center logo, a frame with caption, transparency, size and error correction, watching the live readability warnings. Then download PNG or SVG. You can also deep-link to a specific type: `/create?type=whatsapp`.

Click **Save QR** to name and store it locally, or open an existing code for editing via `/create?edit=<id>`.

### Dynamic QR codes

- Choose **Static** (the QR encodes the final content forever) or **Dynamic** (the QR encodes a permanent URL) when saving.
- For dynamic codes, the generated QR points to a permanent link `https://<APP_URL>/qr/<shortCode>`; scanners are redirected to the current destination, so you can change it anytime without re-printing the code.
- Manage dynamic codes from the detail page: copy the permanent URL, **Edit destination**, or **Disable / Enable**.

### Scan tracking & analytics

- Every hit on an active dynamic QR records **one scan** (server-side, on the redirect). Refresh = new scan. Static and disabled codes never record scans.
- Privacy: only device type, operating system and browser are stored — never an IP, raw User-Agent, or location. No cookies, no third-party tracking.
- **Analytics** (`/analytics`) shows Total / Today / This Week / This Month KPIs, a scans-over-time chart, Top QR Codes, and device/OS/browser breakdowns. Period (Today / 7 / 30 / 90 days / all time) and per-QR filters are supported; every widget reflects the exact same window.
- One request == one scan. There is deliberately no "unique visitors" concept.

### Accounts & Sync

- **Sign up / Sign in** (`/login`, `/register`) — email/password. Password reset via `/forgot-password`.
- **First sign-in** — choose to push the current local codes to your account, keep them local only, or cancel.
- **Sync** — when online and signed in, every change is written to your account instantly; offline changes are queued and replayed on reconnect. Pending count is shown in the header.
- **Signed out** — everything stays in IndexedDB on this device; data is never deleted.

### Templates

- **Gallery** (`/templates`) — browse all 10 templates, search by name/description, filter by category, favorite templates (pinned row at the top), and pick up from Recently Used. The gallery is also reachable from the homepage ("Popular Templates") and the dashboard ("Quick create").
- **Create from a template** — `/create?template=<id>` (or the "Use" button on a card) loads the template fields into the wizard. Dynamic templates (QR Menu, Google Review) start in Dynamic mode and show a permanent URL box. Every template ships with a design preset that is applied to the preview automatically.
- **Design presets** — in the customizer, pick Classic, Midnight, Minimal, Soft or Bold. The preview keeps your size/margin; a live contrast check flags any combination below 3:1 contrast.
- QRs created from a template behave exactly like normal codes: Static/Dynamic, favorites, export/import, edit, duplicate, and cloud sync all work. The originating template id (if any) is stored as `template_id` for your reference.

### Adding a new template

Templates are declarative — no changes to the QR engine, sync, or create wizard are required:

1. **Define the data** — add include an entry in `src/features/templates/data/` (a new file modeled on the existing ones, e.g. `website.ts`), exporting a `TemplateDefinition` with a unique `id`, `qrType`, `nameKey`/`descriptionKey`, `fields`, `defaultValues`, `defaultMode`, optional `dynamicField`, `category`, `defaultName`, `presetId`, `computeName`, `schema`, and `toPayload`. Wire it up in `data/index.ts` (and optionally add its id to `POPULAR_TEMPLATE_IDS` / `QUICK_CREATE_TEMPLATE_IDS`).
2. **Add a Zod schema** — extend `src/features/templates/schemas/index.ts` with a schema shaped like `TemplateValues` (name + the template's fields) so the form validates the same way as the core QR types.
3. **Localize it** — add `name`, `description`, `fields`, `placeholders` and `helper` keys under the `templates` namespace in `src/i18n/translations.ts` for **all three** locales (fr, en, ar). Design-preset labels live under the `design` namespace.
4. **Register a badge** — template cards derive category badges from `templates.categories.<category>`; add the category to `TEMPLATE_CATEGORIES` only if it is genuinely new to the gallery.
5. **Test** — add a payload round-trip test in `src/features/templates/__tests__/payloads.test.ts` proving the template's schema → `toPayload` → `generateQRContent` produces the expected content.

That's it — the gallery renders it, the wizard prefills it, and saving behaves like any other QR.

### Managing QR Codes

- **Library** (`/qrs`) — search, filter (All/Static/Dynamic/Favorites), filter by type, and sort your codes. Export/Import JSON backups from the header.
- **Detail** (`/qrs/[id]`) — preview the code, download PNG/SVG, copy/share the content, toggle favorite, and edit/duplicate/delete. Dynamic codes add permanent URL copy, destination editing, and disable/enable.
- **Settings → Local Data** — export a backup file, import one, or clear all locally stored QR Codes.

## PWA

QR Manager is a Progressive Web App. When deployed in production:

- The app registers a service worker for offline caching
- The shell loads from cache for instant startup
- Add to home screen on mobile devices
- Works offline for cached pages

## Design System

The UI follows a **Minimalist Tech + Swiss Design + Soft Glass** direction:

- **Light mode**: Clean whites with blue accents (#2563EB)
- **Dark mode**: Deep navy with blue accents (#3B82F6)
- Mobile-first responsive design
- Subtle transitions and micro-interactions
- Clear typographic hierarchy

## Internationalization

Supports three languages:
- **Francais** (default)
- **English**
- **العربية** (Arabic with RTL support)

Language switching is persisted in localStorage. The i18n architecture uses a simple key-based translation system without external dependencies.

## Branding

- **Name**: QR Manager
- **Tagline**: Create. Customize. Share.
- **Positioning**: 100% Free forever. No subscriptions. No ads.

## License

Free and open source.
