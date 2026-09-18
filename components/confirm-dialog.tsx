"use client";

import { Button } from "@/components/button";
import { Sheet } from "@/components/sheet";

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
      onConfirm={onConfirm}
      ariaLabel={title}
      role="alertdialog"
      maxWidth="max-w-sm"
      zIndex="z-60"
    >
      <h2 className="mb-2 text-base font-medium text-danger">{title}</h2>
      <p className="mb-5 text-caption">{description}</p>
      <div className="flex gap-2">
        <Button variant="neutral" size="block" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="block" className="flex-1" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
