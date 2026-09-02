"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallStatus = "checking" | "installed" | "installable" | "ios" | "other";

export function useInstallPrompt() {
  const [status, setStatus] = useState<InstallStatus>("checking");
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setStatus("installed");
      return;
    }

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) {
      setStatus("ios");
      return;
    }

    function handlePrompt(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus("installable");
    }
    window.addEventListener("beforeinstallprompt", handlePrompt);

    const fallback = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "other" : current));
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      clearTimeout(fallback);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setStatus("installed");
  }

  return { status, promptInstall };
}
