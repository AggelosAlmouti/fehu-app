"use client";

import { Sheet } from "@/components/sheet";

// Replaces native confirm() — one component, reused wherever a
// destructive action needs a yes/no check.
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Sheet
      open={open}
      onClose={onCancel}
      ariaLabel={title}
      role="alertdialog"
      maxWidth="max-w-sm"
      zIndex="z-[60]"
    >
      <h2 className="mb-2 text-base font-medium text-danger">{title}</h2>
      <p className="mb-5 text-sm text-muted">{description}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-full border border-border-strong py-3 text-sm font-medium text-detail transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-full bg-danger py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {confirmLabel}
        </button>
      </div>
    </Sheet>
  );
}
