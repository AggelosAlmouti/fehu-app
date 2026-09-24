"use client";

import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { currencyMap } from "@/lib/data";
import { replaceUserData } from "@/lib/firestore";
import { generateTestData } from "@/lib/test-data";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { InstallInstructions } from "@/components/layout/install-prompt";
import { Sheet } from "@/components/ui/sheet";
import { CurrencyPickerSheet } from "@/components/settings/currency-picker-sheet";
import { DeleteAccountDialog } from "@/components/settings/delete-account-dialog";

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [installSheetOpen, setInstallSheetOpen] = useState(false);
  const { currency, setCurrency } = useCurrency();
  const { status: installStatus, canInstall, promptInstall } = useInstallPrompt();

  return (
    <>
      <PageHeader title="Settings" />

      <div className="card-box divide-y-2 divide-border">
        {canInstall && (
          <SettingRow
            title="Install app"
            description="Add Fehu to your home screen for one-tap access."
          >
            <Button
              variant="solid"
              className="min-w-20 shrink-0"
              onClick={installStatus === "installable" ? promptInstall : () => setInstallSheetOpen(true)}
            >
              Install
              {installStatus !== "installable" && (
                <ChevronRight className="size-4" aria-hidden="true" />
              )}
            </Button>
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
            {currencyMap[currency].symbol || currencyMap[currency].label}
            <ChevronRight className="size-4 text-muted" aria-hidden="true" />
          </Button>
        </SettingRow>

        {process.env.NODE_ENV !== "production" && <TestDataRow />}

        <SettingRow
          title="Delete account"
          description="Permanently delete your account and all your data."
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
          title="Install Fehu"
          maxWidth="max-w-sm"
        >
          <InstallInstructions status={installStatus} />
        </Sheet>
      )}
    </>
  );
}

function SettingRow({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div>
        <div className="text-body text-foreground">{title}</div>
        <div className="mt-0.5 text-caption">{description}</div>
      </div>
      {children}
    </div>
  );
}

// Dev builds only: wipes the signed-in account's budgets, incomes and
// transactions and writes a generated set in their place (lib/test-data.ts).
function TestDataRow() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"idle" | "working" | "done" | "failed">("idle");

  async function handleReplace() {
    if (!user) return;
    const confirmed = window.confirm(
      "Replace ALL your budgets, incomes and transactions with generated test data? This can't be undone.",
    );
    if (!confirmed) return;
    setStatus("working");
    try {
      await replaceUserData(user.uid, generateTestData());
      setStatus("done");
    } catch (error) {
      console.error(error);
      setStatus("failed");
    }
  }

  return (
    <SettingRow
      title="Test data"
      description="Dev only. Replaces your data with 18 months of history plus 2 future months."
    >
      <Button
        variant="danger-outline"
        className="min-w-20 shrink-0"
        onClick={handleReplace}
        disabled={!user || status === "working"}
      >
        {status === "working" ? "Working…" : status === "done" ? "Done" : status === "failed" ? "Failed" : "Replace"}
      </Button>
    </SettingRow>
  );
}
