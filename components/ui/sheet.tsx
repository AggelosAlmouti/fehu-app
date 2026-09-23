"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/button";

// Open sheet ids, topmost last — lets Escape close only the front sheet.
const openStack: string[] = [];

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
  const id = useId();
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
    if (!open) return;
    openStack.push(id);
    document.body.style.overflow = "hidden";
    return () => {
      const i = openStack.indexOf(id);
      if (i !== -1) openStack.splice(i, 1);
      if (openStack.length === 0) document.body.style.overflow = "";
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
        className={`fehu-slide-up relative w-full ${maxWidth} rounded-t-sheet border-2 border-border bg-surface px-5 pb-8 pt-5 outline-none sm:rounded-sheet sm:pb-6 ${
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
