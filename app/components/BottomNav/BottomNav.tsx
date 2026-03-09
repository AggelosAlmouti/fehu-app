"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Clock, Plus, CalendarDays, Settings } from "lucide-react";
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

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav}>
      {tabs.map((tab, index) => {
        if (tab.type === "add") {
          return (
            <button key={index} className={styles.addButton}>
              <Plus size={26} strokeWidth={2} />
            </button>
          );
        }

        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`${styles.tab} ${isActive ? styles.active : ""}`}
          >
            <tab.icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
