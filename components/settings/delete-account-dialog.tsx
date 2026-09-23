"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Sheet } from "@/components/ui/sheet";

export function DeleteAccountDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { deleteAccount, logOut } = useAuth();
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
      onConfirm={handleDelete}
      ariaLabel="Delete account"
      role="alertdialog"
      maxWidth="max-w-sm"
    >
      <h2 className="mb-2 text-strong text-danger">Delete account</h2>
      <p className="mb-5 text-caption">
        This permanently deletes your account and all your data. This
        can&apos;t be undone.
      </p>

      <Field
        label={
          <>
            Type <span className="font-medium text-foreground">delete</span> to
            confirm
          </>
        }
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        autoFocus
        autoComplete="off"
        className="mb-5"
      />

      {error && (
        <div className="mb-4 flex flex-col items-start gap-2">
          <p className="text-body text-danger">
            Couldn&apos;t delete your account. Try signing out and back in, then
            try again.
          </p>
          <Button variant="outline" onClick={logOut}>
            Log out
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="neutral" size="block" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          size="block"
          className="flex-1"
          onClick={handleDelete}
          disabled={!canDelete || deleting}
        >
          {deleting ? "Deleting…" : "Delete"}
        </Button>
      </div>
    </Sheet>
  );
}
