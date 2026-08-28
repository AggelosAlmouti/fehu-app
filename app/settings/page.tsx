"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CurrencyPickerSheet } from "@/components/currency-picker-sheet";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { currencyMap } from "@/lib/currencies";
import { useCurrency } from "@/lib/use-currency";

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      <h1 className="mb-8 text-2xl font-medium tracking-tight md:mb-10">
        Settings
      </h1>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-medium">Currency</div>
            <div className="mt-0.5 text-xs text-muted">
              Used to format amounts throughout the app.
            </div>
          </div>
          {/* min-w matches the Delete button below; "Other" shows no fallback text. */}
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex min-w-20 shrink-0 items-center justify-center gap-1 rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-detail"
          >
            {currencyMap[currency].symbol}
            <ChevronRight className="size-3.5 text-muted" aria-hidden="true" />
          </button>
        </div>

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
            className="flex min-w-20 shrink-0 items-center justify-center rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:opacity-80"
          >
            Delete
          </button>
        </div>
      </div>

      <CurrencyPickerSheet
        open={pickerOpen}
        value={currency}
        onClose={() => setPickerOpen(false)}
        onSelect={setCurrency}
      />

      <DeleteAccountDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
