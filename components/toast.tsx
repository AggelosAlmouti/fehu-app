"use client";

import { useEffect } from "react";

export function Toast({
  message,
  onClose,
  duration = 3500,
}: {
  message: string | null;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-5 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="fehu-drop-in pointer-events-auto rounded-full border border-border-strong bg-card px-4 py-2.5 text-center text-xs text-foreground shadow-lg shadow-black/40">
        {message}
      </div>
    </div>
  );
}
