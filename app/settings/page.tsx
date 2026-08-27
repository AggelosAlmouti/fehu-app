"use client";

import { useState } from "react";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      <h1 className="mb-8 text-2xl font-medium tracking-tight md:mb-10">
        Settings
      </h1>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div>
            <div className="text-sm font-medium">Delete account</div>
            <div className="mt-0.5 text-xs text-muted">
              Permanently delete your account and all your expenses.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="shrink-0 rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:opacity-80"
          >
            Delete
          </button>
        </div>
      </div>

      <DeleteAccountDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
