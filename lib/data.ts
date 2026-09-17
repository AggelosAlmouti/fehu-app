import {
  currencyMap,
  DEFAULT_CURRENCY,
  type CurrencyCode,
} from "@/lib/currencies";

export type BudgetCadence = "monthly" | "one-time";

export type Budget = {
  id: string;
  name: string;
  amount: number;
  cadence: BudgetCadence;
  /** Only set for one-time budgets — the "YYYY-MM" month it's scoped to. */
  month?: string;
};

export type IncomeSource = {
  id: string;
  name: string;
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
      sourceId?: string;
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

function monthKeyToDate(monthKey: string): Date {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

export function endOfMonthISO(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return toLocalISODate(new Date(y, m, 0));
}

export type MonthRange = { startMonth: string; endMonth: string } | null;

function resolveRange(
  range: MonthRange,
  transactions: Transaction[],
): { startMonth: string; endMonth: string } | null {
  if (range) return range;
  if (transactions.length === 0) return null;
  const earliest = transactions.reduce(
    (min, t) => (t.date < min ? t.date : min),
    transactions[0].date,
  );
  return { startMonth: earliest.slice(0, 7), endMonth: todayISO().slice(0, 7) };
}

export type MonthlyTotal = {
  key: string;
  label: string;
  spent: number;
  earned: number;
};

export function monthlyTotals(
  transactions: Transaction[],
  range: MonthRange,
): MonthlyTotal[] {
  const resolved = resolveRange(range, transactions);
  if (!resolved) return [];
  const start = monthKeyToDate(resolved.startMonth);
  const end = monthKeyToDate(resolved.endMonth);

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
  const today = new Date();
  const d = new Date(iso + "T00:00:00");
  return (
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth()
  );
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
  const currentMonth = todayISO().slice(0, 7);
  return budgets
    .filter(
      (budget) => budget.cadence === "monthly" || budget.month === currentMonth,
    )
    .map((budget) => {
      const matching = expenses.filter((e) => e.budgetId === budget.id);
      const scoped =
        budget.cadence === "monthly"
          ? matching.filter((e) => isThisMonth(e.date))
          : matching.filter((e) => e.date.slice(0, 7) === budget.month);
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
  range: MonthRange,
): BudgetSpending[] {
  const resolved = resolveRange(range, transactions);
  if (!resolved) return [];
  const startISO = `${resolved.startMonth}-01`;
  const endISO = endOfMonthISO(resolved.endMonth);
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

type IncomeTransaction = Extract<Transaction, { type: "income" }>;

export type IncomeBySource = {
  source: IncomeSource;
  earned: number;
  transactions: IncomeTransaction[];
};

// Mirrors budgetSpending() — always shows every source, even at €0 this
// month, the same way a monthly budget always shows regardless of spend.
export function incomeBySource(
  sources: IncomeSource[],
  transactions: Transaction[],
): IncomeBySource[] {
  const income = transactions.filter(
    (t): t is IncomeTransaction => t.type === "income" && isThisMonth(t.date),
  );
  return sources.map((source) => {
    const matching = income.filter((t) => t.sourceId === source.id);
    return {
      source,
      earned: matching.reduce((sum, t) => sum + t.amount, 0),
      transactions: matching,
    };
  });
}

export function incomeBySourceInPeriod(
  sources: IncomeSource[],
  transactions: Transaction[],
  range: MonthRange,
): IncomeBySource[] {
  const resolved = resolveRange(range, transactions);
  if (!resolved) return [];
  const startISO = `${resolved.startMonth}-01`;
  const endISO = endOfMonthISO(resolved.endMonth);
  const income = transactions.filter(
    (t): t is IncomeTransaction =>
      t.type === "income" && t.date >= startISO && t.date <= endISO,
  );
  return sources
    .map((source) => {
      const matching = income.filter((t) => t.sourceId === source.id);
      return {
        source,
        earned: matching.reduce((sum, t) => sum + t.amount, 0),
        transactions: matching,
      };
    })
    .filter((s) => s.transactions.length > 0);
}

export function monthLabel(monthKey: string): string {
  return monthKeyToDate(monthKey).toLocaleDateString("en-IE", {
    month: "short",
    year: "numeric",
  });
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const d = monthKeyToDate(monthKey);
  d.setMonth(d.getMonth() + delta);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
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
  return d.toLocaleDateString("en-IE", { day: "numeric", month: "short" });
}
