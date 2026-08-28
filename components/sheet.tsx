"use client";

import { useEffect, useId, type ReactNode } from "react";

// The app's one modal/bottom-sheet shell — every dialog renders through
// this instead of hand-rolling its own overlay and close behavior.

// Open sheet ids, topmost last — lets Escape close only the front sheet
// when stacked, same as a backdrop click already does.
const openStack: string[] = [];

export function Sheet({
  open,
  onClose,
  ariaLabel,
  role = "dialog",
  maxWidth = "max-w-md",
  scrollable = false,
  zIndex = "z-50",
  children,
}: {
  open: boolean;
  onClose: () => void;
  ariaLabel: string;
  /** "alertdialog" for confirmations, "dialog" otherwise. */
  role?: "dialog" | "alertdialog";
  /** Tailwind max-width class. */
  maxWidth?: string;
  /** Caps height, scrolls the list body inside. */
  scrollable?: boolean;
  /** Higher for sheets that stack on top of another. */
  zIndex?: string;
  children: ReactNode;
}) {
  const id = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    openStack.push(id);
    return () => {
      const i = openStack.indexOf(id);
      if (i !== -1) openStack.splice(i, 1);
    };
  }, [open, id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Only the topmost sheet responds.
      if (openStack[openStack.length - 1] === id) onClose();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, id]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end justify-center sm:items-center`}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fehu-fade-in absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        className={`fehu-slide-up relative w-full ${maxWidth} rounded-t-3xl border border-border bg-surface px-5 pb-8 pt-5 sm:rounded-3xl sm:pb-6 ${
          scrollable ? "flex max-h-[80vh] flex-col" : ""
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong sm:hidden" />
        {children}
      </div>
    </div>
  );
}
