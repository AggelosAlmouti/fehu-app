"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type InstallStatus =
  | "checking"
  | "installed"
  | "already-installed"
  | "installable"
  | "ios"
  | "other";

const INSTALLED_KEY = "fehu-installed";

function readInstalledFlag(): boolean {
  try {
    return localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeInstalledFlag(installed: boolean) {
  try {
    if (installed) localStorage.setItem(INSTALLED_KEY, "1");
    else localStorage.removeItem(INSTALLED_KEY);
  } catch {
    // private mode / storage disabled — the flag is only an optimization
  }
}

export function useInstallPrompt() {
  const [status, setStatus] = useState<InstallStatus>("checking");
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Dev-only: ?install=<state> forces a state (see CLAUDE.md).
    if (process.env.NODE_ENV !== "production") {
      const override = new URLSearchParams(window.location.search).get("install");
      if (
        override === "ios" ||
        override === "other" ||
        override === "installable" ||
        override === "already-installed" ||
        override === "installed"
      ) {
        setStatus(override);
        return;
      }
    }

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (isStandalone) {
      setStatus("installed");
      return;
    }

    const ua = navigator.userAgent;
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isMacSafari =
      /Macintosh/.test(ua) &&
      /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua) &&
      navigator.maxTouchPoints === 0;
    if (isIOSDevice || isMacSafari) {
      setStatus("ios");
      return;
    }

    // Installed Chromium PWAs stop firing beforeinstallprompt (see CLAUDE.md).
    if (readInstalledFlag()) setStatus("already-installed");

    function handlePrompt(e: Event) {
      e.preventDefault();
      writeInstalledFlag(false);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus("installable");
    }
    function handleInstalled() {
      writeInstalledFlag(true);
      setStatus("already-installed");
    }
    window.addEventListener("beforeinstallprompt", handlePrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const fallback = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "other" : current));
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handlePrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      clearTimeout(fallback);
    };
  }, []);

  async function promptInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      writeInstalledFlag(true);
      setStatus("already-installed");
    } else {
      setStatus("installable");
    }
  }

  return { status, promptInstall };
}
