"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { readStorage, writeStorage } from "@/lib/storage";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type InstallStatus =
  | "checking"
  | "installed"
  | "installable"
  | "ios"
  | "other";

const INSTALLED_KEY = "fehu-installed";

function writeInstalledFlag(installed: boolean) {
  writeStorage(INSTALLED_KEY, installed ? "1" : null);
}

type InstallContextValue = {
  status: InstallStatus;
  /** Whether there's an install action to offer (native prompt or instructions). */
  canInstall: boolean;
  promptInstall: () => Promise<void>;
};

const InstallContext = createContext<InstallContextValue | null>(null);

// One shared listener — beforeinstallprompt fires once per page load, so a
// second hook instance mounted later (e.g. Settings) would never see it.
export function InstallProvider({ children }: { children: ReactNode }) {
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
    if (readStorage(INSTALLED_KEY) === "1") setStatus("installed");

    function handlePrompt(e: Event) {
      e.preventDefault();
      writeInstalledFlag(false);
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setStatus("installable");
    }
    function handleInstalled() {
      writeInstalledFlag(true);
      setStatus("installed");
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
      setStatus("installed");
    } else {
      setStatus("installable");
    }
  }

  const canInstall =
    status === "installable" || status === "ios" || status === "other";

  return (
    <InstallContext.Provider value={{ status, canInstall, promptInstall }}>
      {children}
    </InstallContext.Provider>
  );
}

export function useInstallPrompt() {
  const ctx = useContext(InstallContext);
  if (!ctx) throw new Error("useInstallPrompt must be used within InstallProvider");
  return ctx;
}
