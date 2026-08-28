import { currencyMap, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currencies";

export type BudgetCadence = "monthly" | "one-time";

// A budget the user set up — not tied to a fixed category list.
export type Budget = {
  id: string;
  name: string;
  amount: number;
  cadence: BudgetCadence;
};

// `amount` is always positive; `type` carries the sign.
export type Transaction =
  | {
      id: string;
      type: "expense";
      title: string;
      amount: number;
      budgetId?: string;
      /** ISO date string */
      date: string;
    }
  | {
      id: string;
      type: "income";
      title: string;
      amount: number;
      /** ISO date string */
      date: string;
    };

export function currentMonthLabel(): string {
  return new Date().toLocaleDateString("en-IE", {
    month: "long",
    year: "numeric",
  });
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  // Symbol is always the hardcoded one, not Intl's (ICU renders CHF as
  // literal "CHF"). "Other"'s blank symbol prints a bare number.
  const sign = value < 0 ? "-" : "";
  const number = new Intl.NumberFormat("en-IE", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(value));
  return `${sign}${currencyMap[currency].symbol}${number}`;
}

export function relativeDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  const diff = Math.round(
    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff < 7) return `${diff} days ago`;
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}
