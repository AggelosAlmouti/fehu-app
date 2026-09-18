"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
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
      <h1 className="mb-8 text-hero md:mb-10">Settings</h1>

      <div className="card-box bg-surface">
        {showInstallRow && (
          <SettingRow
            title="Install app"
            description="Add Fehu to your home screen for one-tap access."
          >
            {installStatus === "installable" ? (
              <Button variant="solid" className="min-w-20 shrink-0" onClick={promptInstall}>
                Install
              </Button>
            ) : (
              <Button
                variant="solid"
                className="min-w-20 shrink-0"
                onClick={() => setInstallSheetOpen(true)}
              >
                Install
                <ChevronRight className="size-4" aria-hidden="true" />
              </Button>
            )}
          </SettingRow>
        )}

        <SettingRow
          title="Currency"
          description="Used to format amounts throughout the app."
        >
          <Button
            variant="neutral"
            className="min-w-20 shrink-0"
            onClick={() => setPickerOpen(true)}
          >
            {currencyMap[currency].symbol}
            <ChevronRight className="size-4 text-muted" aria-hidden="true" />
          </Button>
        </SettingRow>

        <SettingRow
          title="Delete account"
          description="Permanently delete your account and all your expenses."
          last
        >
          <Button
            variant="danger-outline"
            className="min-w-20 shrink-0"
            onClick={() => setDialogOpen(true)}
          >
            Delete
          </Button>
        </SettingRow>
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

function SettingRow({
  title,
  description,
  last = false,
  children,
}: {
  title: string;
  description: string;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 px-5 py-4 ${
        last ? "" : "border-b-2 border-border"
      }`}
    >
      <div>
        <div className="text-base font-medium text-foreground">{title}</div>
        <div className="mt-0.5 text-caption">{description}</div>
      </div>
      {children}
    </div>
  );
}
