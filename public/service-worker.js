const CACHE_NAME = "fehu-cache-v3";

// Every real route in the app (the nav items in components/layout/app-shell.tsx,
// plus the public marketing page) — precached at install so the very first
// service-worker-controlled load of any of them is already a full cache hit.
const PRECACHE_ROUTES = ["/", "/dashboard", "/budgets", "/insights", "/settings"];

// Next.js content-hashes this path's filenames — the response for a given
// URL can never change, so a cache hit never needs a background refetch.
function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

// Stores a page only once every asset its HTML references is cached too, so a
// cached page can never point at scripts that would have to come from the
// network (see CLAUDE.md). The regex stops at backslashes because the inline
// RSC payload repeats each URL inside escaped quotes.
async function cachePage(cache, key, response) {
  const html = await response.clone().text();
  const assetUrls = new Set(
    [...html.matchAll(/\/_next\/static\/[^"'\s\\]+/g)].map((m) => m[0]),
  );
  const results = await Promise.all(
    [...assetUrls].map(async (assetUrl) => {
      if (await cache.match(assetUrl)) return true;
      try {
        const assetResponse = await fetch(assetUrl);
        if (assetResponse.ok) await cache.put(assetUrl, assetResponse);
        // An HTTP error means the asset doesn't exist — nothing to wait for.
        return true;
      } catch {
        return false;
      }
    }),
  );
  if (results.every(Boolean)) await cache.put(key, response);
}

async function store(cache, key, response, isPage) {
  if (isPage) await cachePage(cache, key, response);
  else await cache.put(key, response);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        PRECACHE_ROUTES.map(async (route) => {
          const response = await fetch(route);
          if (response.ok) await cachePage(cache, route, response);
        }),
      );
    })(),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Only handle our own GET requests — leave Firestore/Google API calls
  // (and anything else cross-origin) to the browser untouched, so
  // Firestore's own offline handling isn't interfered with.
  if (event.request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  // Pages are keyed by path alone — query params like ?add=1 are read
  // client-side, so they all share the one cached page.
  const isPage = event.request.mode === "navigate";
  const key = isPage ? url.pathname : event.request;

  // Background work is collected here and handed to waitUntil synchronously
  // below — calling waitUntil later, after an await, isn't reliable everywhere.
  let background = Promise.resolve();

  const responsePromise = (async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(key);

    if (cached) {
      // Cache-first, refresh in the background (see CLAUDE.md) — except
      // immutable assets, which can never go stale.
      if (!isImmutableAsset(url)) {
        background = fetch(event.request)
          .then((response) => {
            // fetch() resolves on HTTP errors too — never cache those.
            if (response.ok) return store(cache, key, response, isPage);
          })
          .catch(() => {});
      }
      return cached;
    }

    const response = await fetch(event.request);
    if (response.ok) {
      background = store(cache, key, response.clone(), isPage).catch(() => {});
    }
    return response;
  })();

  event.respondWith(responsePromise);
  event.waitUntil(responsePromise.then(() => background, () => {}));
});
