"use client";

import type { InstallStatus } from "@/lib/use-install-prompt";
import { InstallInstructions } from "@/components/install-instructions";

// Sign-in gate only — see CLAUDE.md, this must never render on the marketing page.
export function InstallSection({
  status,
  onInstall,
}: {
  status: InstallStatus;
  onInstall: () => void;
}) {
  if (status === "installable") {
    return (
      <button
        type="button"
        onClick={onInstall}
        className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Install app
      </button>
    );
  }

  if (status === "already-installed") {
    return (
      <p className="max-w-xs text-sm text-muted">Fehu is already installed.</p>
    );
  }

  if (status === "ios" || status === "other") {
    return (
      <div className="w-full max-w-xs rounded-[var(--radius-card)] border border-border bg-surface p-4 text-left">
        <p className="mb-3 text-sm font-medium text-foreground">Install app</p>
        <InstallInstructions status={status} />
      </div>
    );
  }

  return null;
}
