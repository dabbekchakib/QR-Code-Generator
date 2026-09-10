# QR Manager

> **100% Free. No subscriptions. No ads.**

Create, customize and manage QR Codes from one simple, free application.

## Features

### Phase 3 (Current)
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
- Dynamic QR codes
- QR Code logos & advanced styles (Rounded, Dots)
- Supabase authentication
- Scan tracking & analytics
- Templates system
- Public QR redirect API

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | App Router, React Server Components |
| TypeScript | Strict mode, full type safety |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui + Base UI | Accessible component library |
| Lucide React | Icon library |
| IndexedDB (`idb`) | Local persistence (My QR Codes) |
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
│       ├── storage/         # QRCodeRecord, IndexedDB repository, backup, utils
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

No database or external services required — everything runs locally in the browser.

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/qr-manager.git
cd qr-manager

# Install dependencies
npm install
```

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

### Managing QR Codes

- **Library** (`/qrs`) — search, filter (All/Static/Favorites), filter by type, and sort your codes. Export/Import JSON backups from the header.
- **Detail** (`/qrs/[id]`) — preview the code, download PNG/SVG, copy/share the content, toggle favorite, and edit/duplicate/delete.
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
