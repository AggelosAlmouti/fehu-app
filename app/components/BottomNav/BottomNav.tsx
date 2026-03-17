"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Clock, Plus, CalendarDays, Settings } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import styles from "./BottomNav.module.css";

type NavTab =
  | { type: "link"; href: string; label: string; icon: React.ElementType }
  | { type: "add" };

const tabs: NavTab[] = [
  { type: "link", href: "/app", label: "Dashboard", icon: House },
  { type: "link", href: "/app/history", label: "History", icon: Clock },
  { type: "add" },
  { type: "link", href: "/app/plan", label: "Plan", icon: CalendarDays },
  { type: "link", href: "/app/settings", label: "Settings", icon: Settings },
];

const INDICATOR_WIDTH = 20;

export default function BottomNav() {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [indicatorX, setIndicatorX] = useState(0);

  const linkTabs = tabs.filter((t) => t.type === "link");
  const activeIndex = linkTabs.findIndex(
    (t) => t.type === "link" && t.href === pathname,
  );

  useEffect(() => {
    const calculate = () => {
      const activeWrapper = tabRefs.current[activeIndex];
      const nav = navRef.current;
      if (!activeWrapper || !nav) return;

      const tabRect = activeWrapper.getBoundingClientRect();
      const navRect = nav.getBoundingClientRect();
      const center = tabRect.left - navRect.left + tabRect.width / 2;
      setIndicatorX(center - INDICATOR_WIDTH / 2);
    };

    calculate();
    window.addEventListener("resize", calculate);
    return () => window.removeEventListener("resize", calculate);
  }, [activeIndex]);

  let linkIndex = 0;

  return (
    <nav ref={navRef} className={styles.nav}>
      <div
        className={styles.indicator}
        style={{ transform: `translateX(${indicatorX}px)` }}
      />
      {tabs.map((tab, index) => {
        if (tab.type === "add") {
          return (
            <div key={index} className={styles.tabWrapper}>
              <button className={styles.addButton}>
                <Plus size={26} strokeWidth={2} />
              </button>
            </div>
          );
        }

        const isActive = pathname === tab.href;
        const currentLinkIndex = linkIndex++;
        return (
          <div
            key={tab.href}
            ref={(el) => {
              tabRefs.current[currentLinkIndex] = el;
            }}
            className={styles.tabWrapper}
          >
            <Link
              href={tab.href}
              replace
              className={`${styles.tab} ${isActive ? styles.active : ""}`}
            >
              <tab.icon size={22} />
              <span>{tab.label}</span>
            </Link>
          </div>
        );
      })}
    </nav>
  );
}
