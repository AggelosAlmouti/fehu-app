"use client";

import { Share } from "lucide-react";
import { useInstallPrompt } from "@/lib/use-install-prompt";

// Sign-in gate only — see CLAUDE.md, this must never render on the marketing page.
export function InstallSection() {
  const { status, promptInstall } = useInstallPrompt();

  if (status === "checking" || status === "installed") return null;

  return (
    <div className="max-w-xs text-center">
      {status === "installable" && (
        <button
          type="button"
          onClick={promptInstall}
          className="rounded-full border border-accent/40 px-4 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          Install app
        </button>
      )}
      {status === "ios" && (
        <p className="text-xs text-muted">
          Tap <Share className="inline size-3 align-text-bottom" aria-hidden="true" /> Share, then "Add to Home
          Screen".
        </p>
      )}
      {status === "other" && (
        <p className="text-xs text-muted">
          Check your browser's{" "}
          <a
            href="https://web.dev/learn/pwa/installation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            guide
          </a>{" "}
          on how to install a PWA, or use Chrome for the official version.
        </p>
      )}
    </div>
  );
}
