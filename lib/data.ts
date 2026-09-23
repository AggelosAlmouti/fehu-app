export type CurrencyCode = "USD" | "EUR" | "JPY" | "GBP" | "OTHER";

type CurrencyOption = {
  code: CurrencyCode;
  label: string;
  /** Empty for "Other". */
  symbol: string;
};

export const currencies: CurrencyOption[] = [
  { code: "USD", label: "Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "OTHER", label: "Other", symbol: "" },
];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export const currencyMap: Record<CurrencyCode, CurrencyOption> =
  currencies.reduce(
    (acc, c) => {
      acc[c.code] = c;
      return acc;
    },
    {} as Record<CurrencyCode, CurrencyOption>,
  );

export function isCurrencyCode(value: unknown): value is CurrencyCode {
  return currencies.some((c) => c.code === value);
}

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

type ExpenseTransaction = Extract<Transaction, { type: "expense" }>;
type IncomeTransaction = Extract<Transaction, { type: "income" }>;

// What gets written to Firestore — everything but the generated id.
type WithoutId<T> = T extends unknown ? Omit<T, "id"> : never;
export type NewBudget = WithoutId<Budget>;
export type NewIncomeSource = WithoutId<IncomeSource>;
export type NewTransaction = WithoutId<Transaction>;

export const MAX_NAME_LENGTH = 30;

export function isExpense(t: Transaction): t is ExpenseTransaction {
  return t.type === "expense";
}

export function isIncome(t: Transaction): t is IncomeTransaction {
  return t.type === "income";
}

export function sumAmounts(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/** Case-insensitive duplicate check for budget/source names. */
export function nameTaken(
  items: { id: string; name: string }[],
  name: string,
  ignoreId?: string,
): boolean {
  const wanted = name.trim().toLowerCase();
  return items.some((i) => i.id !== ignoreId && i.name.toLowerCase() === wanted);
}

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

/** "YYYY-MM" for a date — the key budgets and period filters use. */
function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return toMonthKey(new Date());
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

const amountFormat = new Intl.NumberFormat("en-IE", {
  style: "decimal",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

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
  return `${sign}${symbol}${amountFormat.format(abs)}`;
}

function monthKeyToDate(monthKey: string): Date {
  const [y, m] = monthKey.split("-").map(Number);
  return new Date(y, m - 1, 1);
}

function endOfMonthISO(monthKey: string): string {
  const [y, m] = monthKey.split("-").map(Number);
  return toLocalISODate(new Date(y, m, 0));
}

// null means all time.
export type MonthRange = { startMonth: string; endMonth: string } | null;
type ResolvedRange = NonNullable<MonthRange>;

function resolveRange(
  range: MonthRange,
  transactions: Transaction[],
): ResolvedRange | null {
  if (range) return range;
  if (transactions.length === 0) return null;
  const months = transactions.map((t) => t.date.slice(0, 7));
  const latest = months.reduce((max, m) => (m > max ? m : max), currentMonthKey());
  const earliest = months.reduce((min, m) => (m < min ? m : min), latest);
  return { startMonth: earliest, endMonth: latest };
}

export function transactionsInRange(
  transactions: Transaction[],
  range: ResolvedRange,
): Transaction[] {
  const startISO = `${range.startMonth}-01`;
  const endISO = endOfMonthISO(range.endMonth);
  return transactions.filter((t) => t.date >= startISO && t.date <= endISO);
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
    const key = toMonthKey(d);
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
  return iso.slice(0, 7) === currentMonthKey();
}

// A monthly budget always counts; a one-time budget only during its own month.
export function isBudgetActive(budget: Budget): boolean {
  return budget.cadence === "monthly" || budget.month === currentMonthKey();
}

type BudgetSpending = {
  budget: Budget;
  spent: number;
  transactions: ExpenseTransaction[];
};

type IncomeBySource = {
  source: IncomeSource;
  earned: number;
  transactions: IncomeTransaction[];
};

function spendingFor(
  budget: Budget,
  expenses: ExpenseTransaction[],
): BudgetSpending {
  const matching = expenses.filter((e) => e.budgetId === budget.id);
  return { budget, spent: sumAmounts(matching), transactions: matching };
}

function earningsFor(
  source: IncomeSource,
  income: IncomeTransaction[],
): IncomeBySource {
  const matching = income.filter((t) => t.sourceId === source.id);
  return { source, earned: sumAmounts(matching), transactions: matching };
}

// Cadence-aware (Dashboard): this month's spend for every active budget, even
// at zero. Deliberately separate from the period-scoped version below.
export function budgetSpending(
  budgets: Budget[],
  transactions: Transaction[],
): BudgetSpending[] {
  const expenses = transactions.filter(
    (t): t is ExpenseTransaction => isExpense(t) && isThisMonth(t.date),
  );
  return budgets.filter(isBudgetActive).map((b) => spendingFor(b, expenses));
}

// Period-scoped (Insights): only budgets with activity in the window.
export function budgetSpendingInPeriod(
  budgets: Budget[],
  transactions: Transaction[],
  range: MonthRange,
): BudgetSpending[] {
  const resolved = resolveRange(range, transactions);
  if (!resolved) return [];
  const expenses = transactionsInRange(transactions, resolved).filter(isExpense);
  return budgets
    .map((b) => spendingFor(b, expenses))
    .filter((s) => s.transactions.length > 0);
}

// Mirrors budgetSpending() — every source shows, even at zero this month.
export function incomeBySource(
  sources: IncomeSource[],
  transactions: Transaction[],
): IncomeBySource[] {
  const income = transactions.filter(
    (t): t is IncomeTransaction => isIncome(t) && isThisMonth(t.date),
  );
  return sources.map((s) => earningsFor(s, income));
}

export function incomeBySourceInPeriod(
  sources: IncomeSource[],
  transactions: Transaction[],
  range: MonthRange,
): IncomeBySource[] {
  const resolved = resolveRange(range, transactions);
  if (!resolved) return [];
  const income = transactionsInRange(transactions, resolved).filter(isIncome);
  return sources
    .map((s) => earningsFor(s, income))
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
  return toMonthKey(d);
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
