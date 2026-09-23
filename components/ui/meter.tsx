import type { ReactNode } from "react";
import { CardButton } from "@/components/ui/button";

// The app's one progress/comparison bar (budget cards, budget detail sheet,
// Insights' ranked rows). Height and animation live here only.
export function Meter({
  percent,
  tone = "accent",
  className = "",
}: {
  percent: number;
  tone?: "accent" | "danger";
  className?: string;
}) {
  return (
    <div className={`h-1.25 overflow-hidden rounded-full bg-border ${className}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${
          tone === "danger" ? "bg-danger" : "bg-accent"
        }`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// Spend against a budget's cap; reads as over-budget past 100%.
export function BudgetMeter({ spent, limit }: { spent: number; limit: number }) {
  const overspent = spent > limit;
  return (
    <Meter
      percent={overspent ? 100 : Math.round((spent / limit) * 100)}
      tone={overspent ? "danger" : "accent"}
    />
  );
}

// Card with a name, a right-aligned value and a bar underneath. Pressable when
// given onClick (Dashboard budget cards, Insights' ranked rows).
export function MeterCard({
  name,
  value,
  onClick,
  children,
}: {
  name: string;
  value: ReactNode;
  onClick?: () => void;
  /** The bar — a Meter or BudgetMeter. */
  children: ReactNode;
}) {
  const content = (
    <>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-body text-foreground">{name}</span>
        <span className="shrink-0">{value}</span>
      </div>
      {children}
    </>
  );
  return onClick ? (
    <CardButton className="px-3.5 py-3" onClick={onClick}>
      {content}
    </CardButton>
  ) : (
    <div className="card-box px-3.5 py-3">{content}</div>
  );
}
