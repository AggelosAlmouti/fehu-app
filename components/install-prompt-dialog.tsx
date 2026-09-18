"use client";

import { useEffect, useState } from "react";
import type { InstallStatus } from "@/lib/use-install-prompt";
import { Button } from "@/components/button";
import { InstallInstructions } from "@/components/install-instructions";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";

const DISMISSED_KEY = "fehu-install-prompt-dismissed";

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDismissed() {
  try {
    localStorage.setItem(DISMISSED_KEY, "1");
  } catch {
    // private mode / storage disabled — worst case it asks again next visit
  }
}

// Shown once per signed-in browser-tab session (not the installed standalone
// app) whenever there's an actual install action to offer — closing it
// normally just defers to next time; "Don't show this again" is permanent.
export function InstallPromptDialog({
  status,
  onInstall,
  onDismissForever,
}: {
  status: InstallStatus;
  onInstall: () => void;
  /** Fires once the user opts out permanently — caller surfaces the Settings hint. */
  onDismissForever: () => void;
}) {
  const [open, setOpen] = useState(false);

  const actionable =
    status === "installable" || status === "ios" || status === "other";

  useEffect(() => {
    if (!actionable || readDismissed()) return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [actionable]);

  function handleInstall() {
    onInstall();
    setOpen(false);
  }

  function handleDismissForever() {
    writeDismissed();
    setOpen(false);
    onDismissForever();
  }

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      ariaLabel="Install Fehu"
      maxWidth="max-w-sm"
    >
      <SheetHeader title="Install Fehu" onClose={() => setOpen(false)} />

      <p className="mb-4 text-caption">
        Add Fehu to your home screen for one-tap access, even offline.
      </p>

      {status === "installable" ? (
        <Button variant="solid" size="block" className="mb-4" onClick={handleInstall}>
          Install app
        </Button>
      ) : status === "ios" || status === "other" ? (
        <div className="mb-4">
          <InstallInstructions status={status} />
        </div>
      ) : null}

      <Button variant="link" size="block" onClick={handleDismissForever}>
        Don&apos;t show this again
      </Button>
    </Sheet>
  );
}
