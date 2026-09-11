# QR Manager

> **100% Free. No subscriptions. No ads.**

Create, customize and manage QR Codes from one simple, free application.

## Features

### Phase 5 (Current)
- **Dynamic QR codes** — toggle between **Static** and **Dynamic** when saving (`/create`); dynamic codes get a permanent public URL `https://<APP_URL>/qr/<shortCode>` that always redirects to the latest destination
- **Editable destinations** — update the target URL of a dynamic code at any time without changing the shareable short URL (`/qrs/[id]`)
- **Disable / Enable** — dynamic codes can be turned off (public page returns **410 Gone**) and back on
- **Public redirect route** — server-side `src/app/qr/[shortCode]/route.ts` resolves via a `SECURITY DEFINER` Postgres function (`resolve_dynamic_qr`, migration 03) and returns **302** (active), **410** (disabled), **404** (missing or static), **400** (invalid code), **503** (temporary); responses are self-contained localized HTML (FR/EN/AR with RTL) and `noindex, nofollow`
- **Secure short codes** — 8-char URL-safe alphabet (no `0/O/1/l/I`), unique-index enforced, `createDynamic` auto-regenerates on collision (max 5 attempts)
- **Offline-first** — dynamic codes created offline are queued with their short code and destination, and replayed on reconnect like any other mutation
- **Duplicate** — duplicating a dynamic code generates a fresh short code (target URL is preserved)
- **Dashboard** — stat cards for Total/Static/Dynamic/Active-Dynamic and a Dynamic QR summary card
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
- **Dashboard** — real local QR count, favorites count, "Scans — Coming with Dynamic QR", Recent QR Codes
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
- QR Code logos & advanced styles (Rounded, Dots)
- Scan tracking & analytics
- Templates system

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

3. Apply the migrations in `supabase/migrations/` (creates `profiles` and `qr_codes` tables with row-level security; migration 03 adds the dynamic QR fields and the `resolve_dynamic_qr` resolver function).

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

Navigate to `/create`, pick a type, fill in the fields — the QR code updates live. Customize colors, size, and error correction, then download PNG or SVG. You can also deep-link to a specific type: `/create?type=whatsapp`.

Click **Save QR** to name and store it locally, or open an existing code for editing via `/create?edit=<id>`.

### Dynamic QR codes

- Choose **Static** (the QR encodes the final content forever) or **Dynamic** (the QR encodes a permanent URL) when saving.
- For dynamic codes, the generated QR points to a permanent link `https://<APP_URL>/qr/<shortCode>`; scanners are redirected to the current destination, so you can change it anytime without re-printing the code.
- Manage dynamic codes from the detail page: copy the permanent URL, **Edit destination**, or **Disable / Enable**.

### Accounts & Sync

- **Sign up / Sign in** (`/login`, `/register`) — email/password. Password reset via `/forgot-password`.
- **First sign-in** — choose to push the current local codes to your account, keep them local only, or cancel.
- **Sync** — when online and signed in, every change is written to your account instantly; offline changes are queued and replayed on reconnect. Pending count is shown in the header.
- **Signed out** — everything stays in IndexedDB on this device; data is never deleted.

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
