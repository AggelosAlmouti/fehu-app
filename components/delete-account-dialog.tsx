"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Sheet } from "@/components/sheet";

export function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { deleteAccount } = useAuth();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (open) {
      setConfirmText("");
      setDeleting(false);
      setError(false);
    }
  }, [open]);

  const canDelete = confirmText.trim().toLowerCase() === "delete";

  async function handleDelete() {
    if (!canDelete) return;
    setDeleting(true);
    setError(false);
    try {
      await deleteAccount();
    } catch {
      setError(true);
      setDeleting(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      ariaLabel="Delete account"
      role="alertdialog"
      maxWidth="max-w-sm"
    >
      <h2 className="mb-2 text-base font-medium text-danger">
        Delete account
      </h2>
      <p className="mb-5 text-sm text-muted">
        This permanently deletes your account and all your expenses. This
        can&apos;t be undone.
      </p>

      <label
        htmlFor="delete-confirm"
        className="mb-1.5 block text-xs text-detail"
      >
        Type <span className="font-medium text-foreground">delete</span> to
        confirm
      </label>
      <input
        id="delete-confirm"
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        autoFocus
        autoComplete="off"
        className="mb-5 w-full rounded-[var(--radius-card)] border border-border bg-card px-3.5 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted focus:border-border-strong"
      />

      {error && (
        <p className="mb-4 text-sm text-danger">
          Couldn&apos;t delete your account. Try signing out and back in,
          then try again.
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-full border border-border-strong py-3 text-sm font-medium text-detail transition-colors hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
          className="flex-1 rounded-full bg-danger py-3 text-sm font-medium text-background transition-opacity disabled:opacity-40"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Sheet>
  );
}
