import { CloudOff, Coins, Wallet, ChartLine, type LucideIcon } from "lucide-react";

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: Wallet,
    title: "Budgets you define",
    description:
      "No fixed category list — create the budgets that match how you actually spend, monthly or one-time.",
  },
  {
    icon: ChartLine,
    title: "Real insights",
    description:
      "See spend versus income over time and which budgets are actually where your money goes.",
  },
  {
    icon: Coins,
    title: "Multi-currency",
    description: "Switch currencies from Settings; every amount formats accordingly.",
  },
  {
    icon: CloudOff,
    title: "Works offline",
    description: "Log expenses with no connection — they sync automatically once you're back online.",
  },
];

export function Features() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="mb-8 text-center text-2xl font-medium tracking-tight text-foreground">
        Everything you need, nothing you don't
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="rounded-[var(--radius-card)] border border-border bg-surface p-5"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-card">
              <Icon className="size-5 text-accent" aria-hidden="true" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-foreground">{title}</h3>
            <p className="text-sm text-muted">{description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
