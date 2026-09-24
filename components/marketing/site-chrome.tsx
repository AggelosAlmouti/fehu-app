"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { IconButton, navItemClass, quietLinkClass } from "@/components/ui/button";
import { Wordmark } from "@/components/ui/wordmark";
import { OWNER } from "@/components/marketing/owner";

// The landing page's sections, in page order — each id is a section's anchor.
const SECTIONS = [
  { id: "preview", label: "Take a look" },
  { id: "features", label: "Features" },
  { id: "faq", label: "FAQ" },
  { id: "pricing", label: "Pricing" },
];

function scrollToTarget(target: HTMLElement | null) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  else window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

// A link to a landing-page section (or its top, when `id` is null). On the
// landing page it scrolls instead of navigating; elsewhere it loads the
// landing page at that section.
function SectionLink({
  id,
  className,
  onNavigate,
  children,
  ...rest
}: {
  id: string | null;
  className?: string;
  onNavigate?: () => void;
  children: ReactNode;
  "aria-label"?: string;
}) {
  const pathname = usePathname();

  function handleClick(e: MouseEvent) {
    onNavigate?.();
    if (pathname !== "/") return;
    e.preventDefault();
    // Next frame, so the mobile menu has closed first.
    requestAnimationFrame(() => scrollToTarget(id ? document.getElementById(id) : null));
  }

  return (
    <Link href={id ? `/#${id}` : "/"} onClick={handleClick} className={className} {...rest}>
      {children}
    </Link>
  );
}

function SiteNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <>
      <SectionLink id={null} aria-label="Fehu home" className="mb-8 hidden px-3 md:block">
        <Wordmark />
      </SectionLink>
      <nav className="flex flex-col gap-1" aria-label="Sections">
        {SECTIONS.map((s) => (
          <SectionLink key={s.id} id={s.id} onNavigate={onNavigate} className={navItemClass()}>
            {s.label}
          </SectionLink>
        ))}
      </nav>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="mx-auto mt-12 max-w-3xl border-t-2 border-border px-5 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-8">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p className="text-caption">
          © {OWNER.name} {new Date().getFullYear()}
        </p>
        <div className="flex gap-5">
          <Link href="/contact" className={quietLinkClass}>
            Contact
          </Link>
          <Link href="/privacy" className={quietLinkClass}>
            Privacy
          </Link>
        </div>
      </div>
    </footer>
  );
}

// Sidebar on desktop, a small dropdown menu on mobile, footer under every page.
export function SiteChrome({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tapping outside the menu or pressing Escape closes it.
  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!menuRef.current?.contains(e.target as Node)) closeMenu();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMenu();
    }
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen, closeMenu]);

  return (
    <div className="md:flex">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col px-4 py-6 md:flex">
        <SiteNav />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between bg-background px-5 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
        <div ref={menuRef} className="relative -ml-2">
          <IconButton
            icon={menuOpen ? X : Menu}
            size="lg"
            label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          />
          {menuOpen && (
            <div className="fehu-fade-in absolute left-0 top-full mt-2 w-52 rounded-card border-2 border-border-strong bg-surface p-1.5 floating">
              <SiteNav onNavigate={closeMenu} />
            </div>
          )}
        </div>
        <Wordmark />
      </header>

      <div className="min-w-0 flex-1">
        <main>{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
}
