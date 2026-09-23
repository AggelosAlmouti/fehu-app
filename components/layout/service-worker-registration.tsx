"use client";

import { useEffect } from "react";

// Production only — in dev it'd cache and serve stale code.
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }
  }, []);

  return null;
}
