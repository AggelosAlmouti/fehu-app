"use client";

import { X } from "lucide-react";

export function SheetHeader({
  title,
  onClose,
  capitalize = false,
}: {
  title: string;
  onClose: () => void;
  /** Titles built from `${verb} ${type}` (e.g. "Add expense") need this to
   *  capitalize the second word too. */
  capitalize?: boolean;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className={`text-base font-medium${capitalize ? " capitalize" : ""}`}>
        {title}
      </h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-8 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
      >
        <X className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
