/* QR Manager — Service Worker (Phase 11 hardening)
 *
 * Cache strategy:
 *  - "qr-manager-static-v1": the app shell (navigations), icons and manifest,
 *    precached at install. Each precached HTML page ALSO warms up the hashed
 *    /_next/static assets it references so a fresh install survives an
 *    immediate disconnect. Bumped when the shell changes.
 *  - "qr-manager-runtime-v1": same-origin static assets (JS/CSS/fonts/images),
 *    stale-while-revalidate per fetch.
 *
 * Never cached:
 *  - cross-origin API responses (Supabase REST/RPC/auth) — private data must
 *    never be served stale and is never stored in Cache Storage.
 *  - requests carrying an Authorization header (defensive backstop).
 *
 * Offline navigation: fetch first, then the cached page for the exact URL,
 * then the cached shell "/", then /offline.
 *
 * Updates are *controlled*: the new worker installs but does NOT call
 * skipWaiting(); it waits. The app shows a "Refresh to update" banner and
 * posts SKIP_WAITING only when the user agrees (see
 * service-worker-registration.tsx). clients.claim() + cache cleanup run in
 * activate so stale caches are removed once the user refreshes.
 *
 * IndexedDB is never touched by this worker, so updates never risk user data.
 */
const STATIC_CACHE = "qr-manager-static-v1";
const RUNTIME_CACHE = "qr-manager-runtime-v1";

const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/create",
  "/qrs",
  "/analytics",
  "/templates",
  "/settings",
  "/offline",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/favicon.svg",
];

function isCrossOrigin(url) {
  return url.origin !== self.location.origin;
}

function isSupabase(url) {
  const host = url.hostname;
  return host === "supabase.co" || host.endsWith(".supabase.co");
}

function shouldSkip(request, url) {
  if (request.method !== "GET") return true;
  if (isCrossOrigin(url) || isSupabase(url)) return true;
  if (request.headers.get("Authorization")) return true;
  if (request.destination === "document" && request.mode !== "navigate") return true;
  return false;
}

/** Cache a single URL without letting one failure abort a larger install. */
function cacheOne(cache, url) {
  return cache.add(url).catch(() => {
    console.warn(`[sw] precache skipped: ${url}`);
  });
}

/**
 * Warm up the static assets referenced by a freshly cached HTML shell page
 * (/_next/static/... JS/CSS). Without this, a fresh install followed by an
 * immediate disconnect would serve HTML that references chunks the service
 * worker never cached. Failures are non-fatal: the runtime cache fills the
 * gaps on the first online visit.
 */
function extractStaticAssets(html) {
  const urls = new Set();
  const re = /\/_next\/static\/[^"'\\ ]+/g;
  let match;
  while ((match = re.exec(html)) !== null) {
    urls.add(match[0]);
  }
  return Array.from(urls);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.all(PRECACHE_URLS.map((url) => cacheOne(cache, url)))
      )
      // Warm the hashed chunk URLs referenced by the precached shell so a
      // brand-new install works offline on the very first try.
      .then(() =>
        caches.open(STATIC_CACHE).then(async (cache) => {
          for (const url of PRECACHE_URLS) {
            if (!url.endsWith(".html") && url !== "/") continue;
            try {
              const response = await caches.match(url);
              if (!response) continue;
              const html = await response.text();
              await Promise.all(
                extractStaticAssets(html).map((asset) => cacheOne(cache, asset))
              );
            } catch {
              /* non-fatal */
            }
          }
        })
      )
      // Do NOT skipWaiting() here: a new version must be activated by the
      // user-visible "Refresh to update" flow, never by surprise.
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// The app decides when the *new* worker takes over (user clicks "Refresh").
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (shouldSkip(request, url)) return;

  // Navigations (top-level and offline) are network-first with an offline
  // fallback chain: latest HTML for the exact URL -> cached shell "/" ->
  // /offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            // Store the fresh document under its own URL so each route keeps
            // its latest server-rendered shell (never collapsed onto "/").
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(url.href, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(url.href);
          if (cached) return cached;
          const shell = await caches.match("/");
          if (shell) return shell;
          return caches.match("/offline");
        })
    );
    return;
  }

  // Static assets: serve cache first, refresh in the background.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});