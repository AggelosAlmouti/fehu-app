"use client";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

// The app's one confirm for non-catastrophic deletes; open while `name` is set.
// Account deletion is deliberately not built on this — it needs a heavier flow.
export function ConfirmDeleteDialog({
  noun,
  name,
  onCancel,
  onConfirm,
}: {
  /** What's being deleted, e.g. "budget". */
  noun: string;
  name: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet
      open={name !== null}
      onClose={onCancel}
      onConfirm={onConfirm}
      ariaLabel={`Delete ${noun}`}
      role="alertdialog"
      maxWidth="max-w-sm"
      zIndex="z-60"
    >
      <h2 className="mb-2 text-strong text-danger">Delete {noun}</h2>
      <p className="mb-5 text-caption">{`Delete "${name}"? This can't be undone.`}</p>
      <div className="flex gap-2">
        <Button variant="neutral" size="block" className="flex-1" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="danger" size="block" className="flex-1" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Sheet>
  );
}
