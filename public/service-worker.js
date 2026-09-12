const CACHE_NAME = "fehu-cache-v2";

// Every real route in the app (mirrors lib/nav.ts's hrefs, plus the public
// marketing page) — precached at install so the very first
// service-worker-controlled load of any of them is already a full cache
// hit, rather than depending on a prior visit having happened to run
// through the fetch handler below for that specific route (a page's own
// first-ever load is never itself controlled by the service worker
// installing during that same load).
const PRECACHE_ROUTES = ["/", "/dashboard", "/budgets", "/insights", "/settings"];

// Next.js content-hashes this path's filenames — the response for a given
// URL can never change, so a cache hit never needs a background refetch.
function isImmutableAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        PRECACHE_ROUTES.map(async (route) => {
          const response = await fetch(route);
          if (!response.ok) return;
          await cache.put(route, response.clone());

          // Pull the hashed asset URLs this route's HTML actually references
          // so they're cached too, not just the document itself. Routes
          // share most of their chunks, so this naturally dedupes across
          // the precache list via the cache.match check below.
          const html = await response.text();
          const assetUrls = [...html.matchAll(/\/_next\/static\/[^"'\s]+/g)].map((m) => m[0]);
          await Promise.allSettled(
            assetUrls.map(async (assetUrl) => {
              if (await cache.match(assetUrl)) return;
              const assetResponse = await fetch(assetUrl);
              if (assetResponse.ok) await cache.put(assetUrl, assetResponse);
            }),
          );
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

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(event.request);

      if (cached) {
        // Cache-first, refresh in the background (see CLAUDE.md) — except
        // for immutable assets, which can never go stale, so there's
        // nothing to refresh and no reason to spend bandwidth on one.
        if (!isImmutableAsset(url)) {
          // Only cache successful responses — fetch() resolves (doesn't
          // reject) on HTTP errors like 404/500, so without this check we'd
          // cache error pages and serve them later while offline.
          fetch(event.request)
            .then((response) => {
              if (response.ok) cache.put(event.request, response.clone());
            })
            .catch(() => {});
        }
        return cached;
      }

      // Nothing cached — the precache list above is meant to make this
      // the rare case rather than something routinely relied on.
      const response = await fetch(event.request);
      if (response.ok) cache.put(event.request, response.clone());
      return response;
    })(),
  );
});
