"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { CurrencyPickerSheet } from "@/components/currency-picker-sheet";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { InstallInstructions } from "@/components/install-instructions";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";
import { currencyMap } from "@/lib/currencies";
import { useCurrency } from "@/lib/use-currency";
import { useInstallPrompt } from "@/lib/use-install-prompt";

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [installSheetOpen, setInstallSheetOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { status: installStatus, promptInstall } = useInstallPrompt();

  const showInstallRow =
    installStatus === "installable" ||
    installStatus === "ios" ||
    installStatus === "other";

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      <h1 className="mb-8 text-2xl font-medium tracking-tight md:mb-10">
        Settings
      </h1>

      <div className="rounded-[var(--radius-card)] border border-border bg-surface">
        {showInstallRow && (
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <div className="text-sm font-medium">Install app</div>
              <div className="mt-0.5 text-xs text-muted">
                Add Fehu to your home screen for one-tap access.
              </div>
            </div>
            {installStatus === "installable" ? (
              <button
                type="button"
                onClick={promptInstall}
                className="min-w-20 shrink-0 rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-detail"
              >
                Install
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setInstallSheetOpen(true)}
                className="flex min-w-20 shrink-0 items-center justify-center gap-1 rounded-full border border-border-strong px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-detail"
              >
                Install
                <ChevronRight
                  className="size-3.5 text-muted"
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <div className="text-sm font-medium">Currency</div>
            <div className="mt-0.5 text-xs text-muted">
              Used to format amounts throughout the app.
            </div>
          </div>
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

      {(installStatus === "ios" || installStatus === "other") && (
        <Sheet
          open={installSheetOpen}
          onClose={() => setInstallSheetOpen(false)}
          ariaLabel="Install Fehu"
        >
          <SheetHeader
            title="Install Fehu"
            onClose={() => setInstallSheetOpen(false)}
          />
          <InstallInstructions status={installStatus} />
        </Sheet>
      )}
    </div>
  );
}
