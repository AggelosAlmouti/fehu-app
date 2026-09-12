"use client";

import { Loader2 } from "lucide-react";

export function LoadingPill() {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="fehu-drop-in flex items-center gap-2 rounded-full border border-border-strong bg-card px-3.5 py-1.5 text-xs text-detail shadow-lg shadow-black/40">
        <Loader2 className="size-3.5 animate-spin text-accent" aria-hidden="true" />
        Loading your data
      </div>
    </div>
  );
}
