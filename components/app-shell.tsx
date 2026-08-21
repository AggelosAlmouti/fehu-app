"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { navItems } from "@/lib/nav";
import { useAuth } from "@/lib/use-auth";

function Wordmark({ className }: { className?: string }) {
  return (
    <div className={className}>
      <span className="text-lg font-medium tracking-tight text-foreground">
        fehu
      </span>
      <span className="ml-1 text-accent" aria-hidden="true">
        ᚠ
      </span>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {navItems.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-[var(--radius-card)] px-3 py-2.5 text-sm transition-colors ${
              active
                ? "bg-card text-foreground"
                : "text-detail hover:bg-card/60 hover:text-foreground"
            }`}
          >
            <Icon
              className={`size-[18px] shrink-0 ${active ? "text-accent" : ""}`}
              aria-hidden="true"
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [signInError, setSignInError] = useState(false);
  const pathname = usePathname();
  const { user, loading, signInWithGoogle, logOut } = useAuth();

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while the drawer is open.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  // Track connectivity so the sign-in screen can explain why signing in
  // isn't working, instead of a doomed-to-fail popup attempt.
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

  // Register the offline service worker. Only in production: in dev, it
  // would cache your own code and keep serving stale versions after every
  // change, which is more confusing than helpful while iterating.
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/service-worker.js");
    }
  }, []);

  // Avoid flashing the sign-in screen while Firebase is still checking for
  // an existing session.
  if (loading) {
    return <div className="min-h-dvh" />;
  }

  async function handleSignIn() {
    setSignInError(false);
    try {
      await signInWithGoogle();
    } catch {
      setSignInError(true);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5 text-center">
        <Wordmark />
        {isOnline ? (
          <>
            <p className="max-w-xs text-sm text-muted">
              Sign in with Google to track your expenses and keep them synced
              across devices.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background"
            >
              Sign in with Google
            </button>
            {signInError && (
              <p className="max-w-xs text-sm text-danger">
                Sign in failed. Check your connection and try again.
              </p>
            )}
          </>
        ) : (
          <p className="max-w-xs text-sm text-muted">
            No internet connection. Connect to the internet to sign in.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-dvh">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-5 py-2.5 text-xs text-detail">
        <span>Signed in — synced across devices.</span>
        <button
          type="button"
          onClick={logOut}
          className="shrink-0 rounded-full border border-border-strong px-3 py-1 font-medium text-detail hover:text-foreground"
        >
          Log out
        </button>
      </div>
      <div className="md:flex">
        {/* Desktop permanent sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border px-4 py-6 md:flex">
          <Wordmark className="mb-8 px-3" />
          <NavLinks />
        </aside>

        {/* Mobile top bar with burger */}
        <header className="flex items-center justify-between px-5 pt-5 md:hidden">
          <Wordmark />
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
            className="-mr-2 flex size-10 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
          >
            <Menu className="size-[22px]" aria-hidden="true" />
          </button>
        </header>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <div className="fehu-slide-in absolute right-0 top-0 flex h-full w-72 max-w-[80%] flex-col border-l border-border bg-background px-4 py-6 shadow-2xl">
              <div className="mb-8 flex items-center justify-between px-3">
                <Wordmark />
                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                  className="flex size-9 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
                >
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
