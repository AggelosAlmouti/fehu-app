"use client";

import { useMemo, useState } from "react";
import { ChartLine, List, Wallet } from "lucide-react";
import {
  budgetSpendingInPeriod,
  endOfMonthISO,
  formatCurrency,
  incomeBySourceInPeriod,
  monthlyTotals,
  todayISO,
  type MonthRange,
  type Transaction,
} from "@/lib/data";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { BudgetDetailSheet } from "@/components/budget-detail-sheet";
import { DeleteTransactionDialog } from "@/components/delete-transaction-dialog";
import { EmptyState } from "@/components/empty-state";
import { InsightsChart } from "@/components/insights-chart";
import { LoadingPill } from "@/components/loading-pill";
import { MonthStepper } from "@/components/month-stepper";
import { TransactionRow } from "@/components/transaction-row";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useDemoAwareData } from "@/lib/use-demo-aware-data";

type Period = "month" | "q1" | "q2" | "q3" | "q4" | "year" | "all";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Month", value: "month" },
  { label: "Q1", value: "q1" },
  { label: "Q2", value: "q2" },
  { label: "Q3", value: "q3" },
  { label: "Q4", value: "q4" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
];

const QUARTER_START_MONTH: Record<"q1" | "q2" | "q3" | "q4", number> = {
  q1: 1,
  q2: 4,
  q3: 7,
  q4: 10,
};

function periodToRange(period: Period, browsedMonth: string): MonthRange {
  if (period === "all") return null;
  if (period === "month")
    return { startMonth: browsedMonth, endMonth: browsedMonth };
  const year = new Date().getFullYear();
  if (period === "year")
    return { startMonth: `${year}-01`, endMonth: `${year}-12` };
  const startM = QUARTER_START_MONTH[period];
  return {
    startMonth: `${year}-${String(startM).padStart(2, "0")}`,
    endMonth: `${year}-${String(startM + 2).padStart(2, "0")}`,
  };
}

export default function InsightsPage() {
  const { effectiveUser } = useAuth();
  const { currency } = useCurrency();
  const {
    transactions,
    budgets,
    sources,
    updateTransaction,
    deleteTransaction,
    transactionsLoading,
    budgetsLoading,
  } = useDemoAwareData(effectiveUser?.uid);
  const loading = transactionsLoading || budgetsLoading;

  const [period, setPeriod] = useState<Period>("month");
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const [browsedMonth, setBrowsedMonth] = useState(() =>
    todayISO().slice(0, 7),
  );
  const [historyView, setHistoryView] = useState<"budget" | "date">("budget");
  const range = useMemo(
    () => periodToRange(period, browsedMonth),
    [period, browsedMonth],
  );

  const points = useMemo(
    () => monthlyTotals(transactions, range),
    [transactions, range],
  );
  const periodSpent = useMemo(
    () => points.reduce((s, p) => s + p.spent, 0),
    [points],
  );
  const periodEarned = useMemo(
    () => points.reduce((s, p) => s + p.earned, 0),
    [points],
  );

  const spending = useMemo(
    () => budgetSpendingInPeriod(budgets, transactions, range),
    [budgets, transactions, range],
  );
  const rankedBudgets = useMemo(
    () => [...spending].sort((a, b) => b.spent - a.spent),
    [spending],
  );
  const maxSpent = Math.max(1, ...rankedBudgets.map((b) => b.spent));

  const incomeSpending = useMemo(
    () => incomeBySourceInPeriod(sources, transactions, range),
    [sources, transactions, range],
  );
  const rankedIncome = useMemo(
    () => [...incomeSpending].sort((a, b) => b.earned - a.earned),
    [incomeSpending],
  );
  const maxEarned = Math.max(1, ...rankedIncome.map((s) => s.earned));

  const monthTransactions = useMemo(() => {
    if (period !== "month") return [];
    const startISO = `${browsedMonth}-01`;
    const endISO = endOfMonthISO(browsedMonth);
    return transactions
      .filter((t) => t.date >= startISO && t.date <= endISO)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, period, browsedMonth]);

  const openBudget = budgets.find((b) => b.id === openBudgetId) ?? null;
  const openBudgetTransactions = useMemo(
    () =>
      spending.find((s) => s.budget.id === openBudgetId)?.transactions ?? [],
    [spending, openBudgetId],
  );

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      {loading && <LoadingPill />}

      <h1 className="mb-8 text-2xl font-medium tracking-tight md:mb-10">
        Insights
      </h1>

      {loading ? null : transactions.length === 0 ? (
        <EmptyState icon={ChartLine}>
          Add a transaction to start seeing trends and breakdowns here.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setPeriod(p.value)}
                aria-pressed={period === p.value}
                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                  period === p.value
                    ? "bg-accent text-background"
                    : "border border-border-strong text-detail hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="mb-5 flex items-end gap-6">
            <div>
              <div className="mb-0.5 text-xs text-detail">Spent</div>
              <div className="text-[26px] font-medium leading-tight tracking-tight text-foreground">
                {formatCurrency(periodSpent, currency)}
              </div>
            </div>
            <div>
              <div className="mb-0.5 text-xs text-detail">Earned</div>
              <div className="text-[26px] font-medium leading-tight tracking-tight text-accent">
                {formatCurrency(periodEarned, currency)}
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] border border-border p-4">
            <InsightsChart points={points} />
          </div>

          <div className="mt-8">
            {period === "month" && (
              <div className="mb-3 flex items-center justify-between rounded-full border border-border-strong bg-card px-2 py-1">
                <div className="flex items-center gap-1">
                  <MonthStepper
                    month={browsedMonth}
                    onChange={setBrowsedMonth}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistoryView("budget")}
                    aria-pressed={historyView === "budget"}
                    aria-label="Group by budget"
                    className={`flex size-6 items-center justify-center rounded-full transition-colors ${
                      historyView === "budget"
                        ? "bg-accent text-background"
                        : "text-detail hover:text-foreground"
                    }`}
                  >
                    <Wallet className="size-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryView("date")}
                    aria-pressed={historyView === "date"}
                    aria-label="List by date"
                    className={`flex size-6 items-center justify-center rounded-full transition-colors ${
                      historyView === "date"
                        ? "bg-accent text-background"
                        : "text-detail hover:text-foreground"
                    }`}
                  >
                    <List className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {period === "month" && historyView === "date" ? (
              monthTransactions.length > 0 ? (
                <ul className="flex flex-col">
                  {monthTransactions.map((t, i) => (
                    <TransactionRow
                      key={t.id}
                      transaction={t}
                      isLast={i === monthTransactions.length - 1}
                      onEdit={() => setEditingTransaction(t)}
                      onDelete={() => setPendingDelete(t)}
                    />
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">
                  No transactions this month.
                </p>
              )
            ) : rankedBudgets.length > 0 ? (
              <div className="flex flex-col gap-2">
                {rankedBudgets.map(({ budget, spent }) => (
                  <button
                    key={budget.id}
                    type="button"
                    onClick={() => setOpenBudgetId(budget.id)}
                    className="rounded-[var(--radius-card)] border-[0.5px] border-border px-3.5 py-3 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-foreground">
                        {budget.name}
                      </span>
                      <span className="text-[13px] font-medium text-foreground">
                        {formatCurrency(spent, currency)}
                      </span>
                    </div>
                    <div
                      className="mt-2 h-[3px] rounded-full bg-accent"
                      style={{ width: `${(spent / maxSpent) * 100}%` }}
                    />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted">No spending in this period.</p>
            )}
          </div>

          {rankedIncome.length > 0 &&
            !(period === "month" && historyView === "date") && (
              <div className="mt-8">
                <div className="mb-3 text-xs text-detail">Income</div>
                <div className="flex flex-col gap-2">
                  {rankedIncome.map(({ source, earned }) => (
                    <div
                      key={source.id}
                      className="rounded-[var(--radius-card)] border-[0.5px] border-border px-3.5 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] text-foreground">
                          {source.name}
                        </span>
                        <span className="text-[13px] font-medium text-accent">
                          {formatCurrency(earned, currency)}
                        </span>
                      </div>
                      <div
                        className="mt-2 h-[3px] rounded-full bg-accent"
                        style={{ width: `${(earned / maxEarned) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
        </>
      )}

      <BudgetDetailSheet
        budget={openBudget}
        transactions={openBudgetTransactions}
        onClose={() => setOpenBudgetId(null)}
        onEdit={(t) => setEditingTransaction(t)}
        onDelete={deleteTransaction}
      />

      <AddTransactionSheet
        open={editingTransaction !== null}
        editing={editingTransaction}
        budgets={budgets}
        sources={sources}
        onClose={() => setEditingTransaction(null)}
        onAdd={() => {}}
        onUpdate={updateTransaction}
      />

      <DeleteTransactionDialog
        transaction={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteTransaction(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
