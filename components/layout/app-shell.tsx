"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Script from "next/script";
import {
  ChartLine,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/use-auth";
import { Wordmark } from "@/components/ui/wordmark";
import { IconButton, navItemClass } from "@/components/ui/button";
import { Drawer } from "@/components/ui/sheet";
import { InstallPromptDialog } from "@/components/layout/install-prompt";
import { Toast } from "@/components/ui/notices";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            auto_select?: boolean;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              shape?: string;
              text?: string;
            },
          ) => void;
        };
      };
    };
  }
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Budgets", href: "/budgets", icon: Wallet },
  { label: "Insights", href: "/insights", icon: ChartLine },
  { label: "Settings", href: "/settings", icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {navItems.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            replace
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={navItemClass(active)}
          >
            <Icon
              className={`size-5 shrink-0 ${active ? "text-accent" : ""}`}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function AccountFooter({ onLogOut }: { onLogOut?: () => void }) {
  const { effectiveUser, logOut } = useAuth();
  return (
    <div className="mt-auto border-t-2 border-border pt-3">
      <div className="truncate px-3 pb-2 text-caption">{effectiveUser?.email}</div>
      <button
        type="button"
        onClick={() => {
          onLogOut?.();
          logOut();
        }}
        className={navItemClass(false)}
      >
        <LogOut className="size-5 shrink-0" aria-hidden="true" />
        Log out
      </button>
    </div>
  );
}

// Title row shared by every authenticated page; `action` sits on the right.
export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex items-center justify-between md:mb-10">
      <h1 className="text-hero">{title}</h1>
      {action}
    </div>
  );
}

function SignInGate() {
  const { signInWithGoogleCredential } = useAuth();
  const [isOnline, setIsOnline] = useState(true);
  const [signInError, setSignInError] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Lets a second mount pick up a script that already loaded once (see CLAUDE.md).
  useEffect(() => {
    if (window.google) setGoogleScriptLoaded(true);
  }, []);

  // GIS renderButton(), not One Tap prompt() — prompt() depends on FedCM,
  // which browsers can silently suppress with no way to detect it.
  useEffect(() => {
    if (!googleScriptLoaded || !isOnline || !window.google) return;
    const buttonEl = document.getElementById("google-signin-button");
    if (!buttonEl) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      auto_select: false,
      callback: async (response) => {
        setSignInError(false);
        try {
          await signInWithGoogleCredential(response.credential);
        } catch {
          setSignInError(true);
        }
      },
    });
    window.google.accounts.id.renderButton(buttonEl, {
      theme: "filled_black",
      size: "large",
      shape: "pill",
      text: "signin_with",
    });
  }, [googleScriptLoaded, isOnline, signInWithGoogleCredential]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-5 text-center">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleScriptLoaded(true)}
      />
      <Wordmark />
      {!isOnline ? (
        <p className="max-w-xs text-caption">
          No internet connection. Connect to the internet to sign in.
        </p>
      ) : (
        <>
          <div id="google-signin-button" />
          {signInError && (
            <p className="max-w-xs text-body text-danger">
              Sign in failed. Check your connection and try again.
            </p>
          )}
        </>
      )}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const pathname = usePathname();
  const { user, hasPriorSession, loading } = useAuth();
  const clearToast = useCallback(() => setToastMessage(null), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // No remembered session — nothing to show optimistically yet.
  if (loading && !hasPriorSession) {
    return <div className="min-h-dvh" />;
  }

  // `loading && hasPriorSession` falls through to the real shell below
  // rather than blocking here (see CLAUDE.md's Auth model).
  if (!loading && !user) return <SignInGate />;

  return (
    <div className="min-h-dvh">
      {pathname === "/dashboard" && (
        <InstallPromptDialog
          onDismissForever={() =>
            setToastMessage("You can install the app anytime from Settings.")
          }
        />
      )}
      <Toast message={toastMessage} onClose={clearToast} />

      <div className="md:flex">
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r-2 border-border px-4 py-6 md:flex">
          <Wordmark className="mb-8 px-3" />
          <NavLinks />
          <AccountFooter />
        </aside>

        {/* No wordmark here — only in the drawer. */}
        <header className="flex items-center px-5 pt-5 md:hidden">
          <IconButton
            icon={Menu}
            size="lg"
            label="Open menu"
            aria-expanded={menuOpen}
            className="-ml-2"
            onClick={() => setMenuOpen(true)}
          />
        </header>

        <Drawer open={menuOpen} onClose={closeMenu}>
          <NavLinks onNavigate={closeMenu} />
          <AccountFooter onLogOut={closeMenu} />
        </Drawer>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
