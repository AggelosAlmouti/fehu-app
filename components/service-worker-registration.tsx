"use client";

import { useEffect } from "react";

// Production only — in dev it'd cache and serve stale code. Registered at
// the root so it's active on the (public) marketing page too, not just the
// authenticated app — Chromium won't fire beforeinstallprompt without one.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }
  }, []);

  return null;
}
