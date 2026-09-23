"use client";

import { useEffect, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

const TOAST_DURATION_MS = 3500;

// Shared top-of-screen pill. The toast sits above the loading pill.
function TopPill({
  zIndex,
  className,
  children,
}: {
  zIndex: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`pointer-events-none fixed inset-x-0 top-0 ${zIndex} flex justify-center px-5 pt-[max(0.75rem,env(safe-area-inset-top))]`}
    >
      <div
        className={`fehu-drop-in rounded-full border-2 border-border-strong bg-card floating ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

export function LoadingPill() {
  return (
    <TopPill zIndex="z-40" className="flex items-center gap-2 px-3.5 py-1.5 text-label">
      <Loader2 className="size-4 animate-spin text-accent" aria-hidden="true" />
      Loading your data
    </TopPill>
  );
}

export function Toast({
  message,
  onClose,
}: {
  message: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, TOAST_DURATION_MS);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <TopPill
      zIndex="z-50"
      className="pointer-events-auto px-4 py-2.5 text-center text-body text-foreground"
    >
      {message}
    </TopPill>
  );
}
