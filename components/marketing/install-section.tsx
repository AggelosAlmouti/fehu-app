"use client";

import Link from "next/link";
import { Share, SquarePlus, CircleCheck, ExternalLink } from "lucide-react";
import { useInstallPrompt } from "@/lib/use-install-prompt";

export function InstallSection() {
  const { status, promptInstall } = useInstallPrompt();

  if (status === "checking") return null;

  return (
    <section className="mx-auto max-w-xl px-5 py-16">
      <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 text-center">
        {status === "installed" && (
          <>
            <CircleCheck className="mx-auto mb-3 size-8 text-accent" aria-hidden="true" />
            <h2 className="mb-1 text-lg font-medium text-foreground">You're all set</h2>
            <p className="mb-5 text-sm text-muted">Fehu is already installed on this device.</p>
            <Link
              href="/dashboard"
              className="inline-block rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Open Fehu
            </Link>
          </>
        )}

        {status === "installable" && (
          <>
            <h2 className="mb-1 text-lg font-medium text-foreground">Install Fehu</h2>
            <p className="mb-5 text-sm text-muted">
              Add it to your home screen for one-tap access, even offline.
            </p>
            <button
              type="button"
              onClick={promptInstall}
              className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Install app
            </button>
          </>
        )}

        {status === "ios" && (
          <>
            <h2 className="mb-1 text-lg font-medium text-foreground">Add to your Home Screen</h2>
            <p className="mb-5 text-sm text-muted">Safari doesn't offer a one-tap install, but it takes two taps:</p>
            <div className="mx-auto flex max-w-xs flex-col gap-3 text-left">
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-xs font-medium text-accent">
                  1
                </div>
                <p className="text-sm text-foreground">
                  Tap the Share icon <Share className="inline size-4 align-text-bottom" aria-hidden="true" /> in Safari's toolbar
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-xs font-medium text-accent">
                  2
                </div>
                <p className="text-sm text-foreground">
                  Scroll down and tap "Add to Home Screen"{" "}
                  <SquarePlus className="inline size-4 align-text-bottom" aria-hidden="true" />
                </p>
              </div>
            </div>
          </>
        )}

        {status === "other" && (
          <>
            <h2 className="mb-1 text-lg font-medium text-foreground">Install Fehu</h2>
            <p className="mb-4 text-sm text-muted">
              Look for "Install app" or "Add to Home Screen" in your browser's menu — usually
              behind the ⋮ or Share icon.
            </p>
            <a
              href="https://web.dev/learn/pwa/installation"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              How to install a PWA
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </>
        )}
      </div>
    </section>
  );
}
