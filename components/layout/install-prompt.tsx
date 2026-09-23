"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Download,
  Menu,
  Plus,
  Share,
  type LucideIcon,
} from "lucide-react";
import { readStorage, writeStorage } from "@/lib/storage";
import { useInstallPrompt } from "@/lib/use-install-prompt";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";

const DISMISSED_KEY = "fehu-install-prompt-dismissed";

function Step({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-detail" aria-hidden="true" />
      <span>{children}</span>
    </li>
  );
}

// Manual install steps, for browsers with no native install prompt.
export function InstallInstructions({ status }: { status: "ios" | "other" }) {
  if (status === "ios") {
    return (
      <ul className="flex flex-col gap-2.5 text-caption">
        <Step icon={Share}>Tap the Share button in your browser</Step>
        <Step icon={Plus}>
          Choose "Add to Home Screen"{" "}
          <span className="text-detail">(or "Add to Dock" on Mac)</span>
        </Step>
        <Step icon={Check}>Tap "Add" to confirm</Step>
      </ul>
    );
  }

  return (
    <div>
      <ul className="flex flex-col gap-2.5 text-caption">
        <Step icon={Menu}>Open your browser's menu</Step>
        <Step icon={Download}>Choose "Install app" or "Add to Home screen"</Step>
      </ul>
      <p className="mt-3 text-label">
        See your browser's guide for installing PWAs.
      </p>
    </div>
  );
}

// Shown on each signed-in dashboard visit (not the installed standalone app)
// whenever there's an actual install action to offer — closing it normally
// just defers to next time; "Don't show this again" is permanent.
export function InstallPromptDialog({
  onDismissForever,
}: {
  /** Fires once the user opts out permanently — caller surfaces the Settings hint. */
  onDismissForever: () => void;
}) {
  const { status, canInstall, promptInstall } = useInstallPrompt();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!canInstall || readStorage(DISMISSED_KEY) === "1") return;
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [canInstall]);

  function handleInstall() {
    promptInstall();
    setOpen(false);
  }

  function handleDismissForever() {
    writeStorage(DISMISSED_KEY, "1");
    setOpen(false);
    onDismissForever();
  }

  return (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title="Install Fehu"
      maxWidth="max-w-sm"
    >
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
