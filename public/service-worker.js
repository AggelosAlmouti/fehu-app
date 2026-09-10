const CACHE_NAME = "fehu-cache-v1";

self.addEventListener("install", () => {
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

      // Cache-first, refresh in the background (see CLAUDE.md).
      const network = fetch(event.request).then((response) => {
        // Only cache successful responses — fetch() resolves (doesn't
        // reject) on HTTP errors like 404/500, so without this check we'd
        // cache error pages and serve them later while offline.
        if (response.ok) cache.put(event.request, response.clone());
        return response;
      });

      if (cached) {
        network.catch(() => {});
        return cached;
      }
      return network;
    })(),
  );
});
