import { currencyMap, DEFAULT_CURRENCY, type CurrencyCode } from "@/lib/currencies";

export type BudgetCadence = "monthly" | "one-time";

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

export function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toLocalISODate(new Date());
}

const UNITS: [divisor: number, suffix: string][] = [
  [1_000_000_000_000, "T"],
  [1_000_000_000, "B"],
  [1_000_000, "M"],
];

// null means beyond T — formatCurrency shows "-" instead of a wrong number.
function abbreviate(value: number): string | null {
  for (let i = 0; i < UNITS.length; i++) {
    const [divisor, suffix] = UNITS[i];
    if (value < divisor) continue;
    const scaled = Math.round((value / divisor) * 10) / 10;
    // Rounding can push e.g. 999.95M up to "1000M" — bump to the next unit up.
    if (scaled >= 1000) {
      if (i === 0) return null;
      const [nextDivisor, nextSuffix] = UNITS[i - 1];
      const nextScaled = Math.round((value / nextDivisor) * 10) / 10;
      return `${nextScaled % 1 === 0 ? nextScaled : nextScaled.toFixed(1)}${nextSuffix}`;
    }
    return `${scaled % 1 === 0 ? scaled : scaled.toFixed(1)}${suffix}`;
  }
  // Unreachable — formatCurrency only calls this once value >= 1M.
  return `${value}`;
}

export function formatCurrency(
  value: number,
  currency: CurrencyCode = DEFAULT_CURRENCY,
): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const symbol = currencyMap[currency].symbol;
  if (abs >= 1_000_000) {
    const abbreviated = abbreviate(abs);
    return abbreviated === null ? "-" : `${sign}${symbol}${abbreviated}`;
  }
  const number = new Intl.NumberFormat("en-IE", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(abs);
  return `${sign}${symbol}${number}`;
}

function periodStartMonth(transactions: Transaction[], months: number | null): Date | null {
  if (transactions.length === 0) return null;
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  if (months === null) {
    const earliest = transactions.reduce(
      (min, t) => (t.date < min ? t.date : min),
      transactions[0].date,
    );
    const [y, m] = earliest.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  return new Date(end.getFullYear(), end.getMonth() - (months - 1), 1);
}

export type MonthlyTotal = {
  key: string;
  label: string;
  spent: number;
  earned: number;
};

export function monthlyTotals(
  transactions: Transaction[],
  months: number | null,
): MonthlyTotal[] {
  const start = periodStartMonth(transactions, months);
  if (!start) return [];
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets = new Map<string, MonthlyTotal>();
  for (const d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, {
      key,
      label: d.toLocaleDateString("en-IE", { month: "short" }),
      spent: 0,
      earned: 0,
    });
  }
  for (const t of transactions) {
    const bucket = buckets.get(t.date.slice(0, 7));
    if (!bucket) continue;
    if (t.type === "expense") bucket.spent += t.amount;
    else bucket.earned += t.amount;
  }
  return [...buckets.values()];
}

export function isThisMonth(iso: string): boolean {
  const now = new Date();
  const d = new Date(iso + "T00:00:00");
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

type ExpenseTransaction = Extract<Transaction, { type: "expense" }>;

export type BudgetSpending = {
  budget: Budget;
  spent: number;
  transactions: ExpenseTransaction[];
};

export function budgetSpending(
  budgets: Budget[],
  transactions: Transaction[],
): BudgetSpending[] {
  const expenses = transactions.filter(
    (t): t is ExpenseTransaction => t.type === "expense",
  );
  return budgets.map((budget) => {
    const matching = expenses.filter((e) => e.budgetId === budget.id);
    const scoped =
      budget.cadence === "monthly" ? matching.filter((e) => isThisMonth(e.date)) : matching;
    return {
      budget,
      spent: scoped.reduce((sum, e) => sum + e.amount, 0),
      transactions: scoped,
    };
  });
}

export function budgetSpendingInPeriod(
  budgets: Budget[],
  transactions: Transaction[],
  months: number | null,
): BudgetSpending[] {
  const start = periodStartMonth(transactions, months);
  if (!start) return [];
  const startISO = toLocalISODate(start);
  const endISO = todayISO();
  const expenses = transactions.filter(
    (t): t is ExpenseTransaction =>
      t.type === "expense" && t.date >= startISO && t.date <= endISO,
  );
  return budgets
    .map((budget) => {
      const matching = expenses.filter((e) => e.budgetId === budget.id);
      return {
        budget,
        spent: matching.reduce((sum, e) => sum + e.amount, 0),
        transactions: matching,
      };
    })
    .filter((s) => s.transactions.length > 0);
}

export function relativeDay(iso: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  const diff = Math.round(
    (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diff === 0) return "today";
  if (diff === 1) return "yesterday";
  if (diff === -1) return "tomorrow";
  if (diff > 1 && diff < 7) return `${diff} days ago`;
  if (diff < -1 && diff > -7) return `in ${-diff} days`;
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}
