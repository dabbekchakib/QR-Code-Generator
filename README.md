# QR Manager

> **100% Free. No subscriptions. No ads.**

Create, customize and manage QR Codes from one simple, free application.

## Features

### Phase 1 (Current)
- Modern, responsive UI (mobile-first)
- Light/Dark theme with system detection
- Internationalization (FR, EN, AR with RTL support)
- Dashboard with stats overview
- QR Code creation wizard (type selection UI)
- QR Code list management
- PWA with service worker & offline shell
- SEO optimized (Open Graph, metadata)
- Supabase integration ready (browser + server clients)
- TypeScript strict mode

### Upcoming Phases
- Real QR Code generation (static + dynamic)
- QR Code customization (colors, logos, frames)
- Supabase authentication
- Scan tracking & analytics
- IndexedDB offline sync
- Templates system
- QR Code download (PNG, SVG, PDF)

## Tech Stack

| Technology | Purpose |
|---|---|
| Next.js 16 | App Router, React Server Components |
| TypeScript | Strict mode, full type safety |
| Tailwind CSS v4 | Utility-first styling |
| shadcn/ui | Accessible component library |
| Lucide React | Icon library |
| Supabase | Backend (Auth, Database, Storage) |
| PostgreSQL | Database (via Supabase) |
| Zod | Schema validation |
| React Hook Form | Form management |
| Zustand | Global state (minimal) |
| TanStack Query | Server state management |
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

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (optional, for Phase 2+)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/qr-manager.git
cd qr-manager

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
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
