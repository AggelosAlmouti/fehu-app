"use client";

import {
  Check,
  Download,
  Menu,
  Plus,
  Share,
  type LucideIcon,
} from "lucide-react";

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

export function InstallInstructions({ status }: { status: "ios" | "other" }) {
  if (status === "ios") {
    return (
      <ul className="flex flex-col gap-2.5 text-sm text-muted">
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
      <ul className="flex flex-col gap-2.5 text-sm text-muted">
        <Step icon={Menu}>Open your browser's menu</Step>
        <Step icon={Download}>Choose "Install app" or "Add to Home screen"</Step>
      </ul>
      <p className="mt-3 text-xs text-detail">
        See your browser's guide for installing PWAs.
      </p>
    </div>
  );
}
