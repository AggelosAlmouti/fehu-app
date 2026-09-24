"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";

// Open layer ids (sheets and drawers), topmost last — lets Escape close only
// the front one, and keeps the page scroll-locked until the last one closes.
const openStack: string[] = [];

function useLayer(open: boolean, onClose: () => void) {
  const id = useId();
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    openStack.push(id);
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && openStack[openStack.length - 1] === id) onCloseRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      const i = openStack.indexOf(id);
      if (i !== -1) openStack.splice(i, 1);
      if (openStack.length === 0) document.body.style.overflow = "";
    };
  }, [open, id]);

  return id;
}

// Open/edit state for an add-or-edit sheet; `editing` is null when adding.
export function useEditSheet<T>() {
  const [state, setState] = useState<{ open: boolean; editing: T | null }>({
    open: false,
    editing: null,
  });
  return {
    open: state.open,
    editing: state.editing,
    openAdd: () => setState({ open: true, editing: null }),
    openEdit: (item: T) => setState({ open: true, editing: item }),
    close: () => setState({ open: false, editing: null }),
  };
}

export function Sheet({
  open,
  onClose,
  onConfirm,
  title,
  ariaLabel = title,
  role = "dialog",
  maxWidth = "max-w-md",
  scrollable = false,
  zIndex = "z-50",
  initialFocus,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  /** Renders the standard title + close row. Dialogs with their own heading omit it and pass `ariaLabel`. */
  title?: string;
  ariaLabel?: string;
  /** "alertdialog" for confirmations, "dialog" otherwise. */
  role?: "dialog" | "alertdialog";
  /** Tailwind max-width class. */
  maxWidth?: string;
  /** Caps height, scrolls the list body inside. */
  scrollable?: boolean;
  /** Higher for sheets that stack on top of another. */
  zIndex?: string;
  /** Field to focus once the slide-in settles, instead of the dialog itself. */
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}) {
  const id = useLayer(open, onClose);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const active = document.activeElement;
    if (active instanceof Node && dialogRef.current?.contains(active)) return;
    dialogRef.current?.focus();
    if (!initialFocus) return;
    const t = setTimeout(() => initialFocus.current?.focus(), 120);
    return () => clearTimeout(t);
  }, [open, initialFocus]);

  useEffect(() => {
    if (!open || !onConfirm) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter" || openStack[openStack.length - 1] !== id) return;
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
      onConfirm?.();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onConfirm, id]);

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
        className={`fehu-slide-up relative w-full ${maxWidth} rounded-t-sheet border-2 border-border bg-surface px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-5 outline-none sm:rounded-sheet sm:pb-6 ${
          scrollable ? "flex max-h-[80vh] flex-col" : ""
        }`}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border-strong sm:hidden" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-strong">{title}</h2>
            <IconButton icon={X} label="Close" onClick={onClose} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

// Mobile-only menu that slides in from the left (the app's nav).
export function Drawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useLayer(open, onClose);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <button type="button" aria-label="Close menu" onClick={onClose} className="fehu-fade-in scrim" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        className="fehu-slide-in absolute left-0 top-0 flex h-full w-72 max-w-4/5 flex-col border-r-2 border-border bg-background px-4 pb-6 pt-[max(1.5rem,env(safe-area-inset-top))]"
      >
        <div className="mb-8 flex items-center justify-between px-3">
          <IconButton icon={X} label="Close menu" onClick={onClose} />
          <Wordmark />
        </div>
        {children}
      </div>
    </div>
  );
}
