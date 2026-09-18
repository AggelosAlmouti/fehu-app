"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

// Open sheet ids, topmost last — lets Escape close only the front sheet.
const openStack: string[] = [];

export function Sheet({
  open,
  onClose,
  onConfirm,
  ariaLabel,
  role = "dialog",
  maxWidth = "max-w-md",
  scrollable = false,
  zIndex = "z-50",
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (active instanceof Node && dialogRef.current?.contains(active)) return;
    dialogRef.current?.focus();
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
      if (openStack[openStack.length - 1] !== id) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Enter" || !onConfirm) return;
      const active = document.activeElement;
      const insideDialog = active instanceof Node && dialogRef.current?.contains(active);
      if (
        insideDialog &&
        (active instanceof HTMLButtonElement ||
          active instanceof HTMLAnchorElement ||
          active instanceof HTMLTextAreaElement)
      ) {
        return;
      }
      onConfirm();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onConfirm, id]);

  if (!open) return null;

  return (
    <div className={`fixed inset-0 ${zIndex} flex items-end justify-center sm:items-center`}>
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="fehu-fade-in scrim"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role={role}
        aria-modal="true"
        aria-label={ariaLabel}
        className={`fehu-slide-up relative w-full ${maxWidth} rounded-t-3xl border-2 border-border bg-surface px-5 pb-8 pt-5 outline-none sm:rounded-3xl sm:pb-6 ${
          scrollable ? "flex max-h-[80vh] flex-col" : ""
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong sm:hidden" />
        {children}
      </div>
    </div>
  );
}
