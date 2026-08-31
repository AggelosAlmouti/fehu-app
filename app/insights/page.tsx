"use client";

import { useEffect, useMemo, useState } from "react";
import { ChartLine } from "lucide-react";
import { budgetSpendingInPeriod, formatCurrency, monthlyTotals, type Transaction } from "@/lib/data";
import { generateDummyData } from "@/lib/dummy-data";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { BudgetDetailSheet } from "@/components/budget-detail-sheet";
import { EmptyState } from "@/components/empty-state";
import { InsightsChart } from "@/components/insights-chart";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useTransactions } from "@/lib/use-transactions";
import { useBudgets } from "@/lib/use-budgets";

type Period = 1 | 3 | 6 | 12 | null;

const PERIODS: { label: string; value: Period }[] = [
  { label: "1M", value: 1 },
  { label: "3M", value: 3 },
  { label: "6M", value: 6 },
  { label: "1Y", value: 12 },
  { label: "All", value: null },
];

export default function InsightsPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const live = useTransactions(user?.uid);
  const liveBudgets = useBudgets(user?.uid);

  const [demoMode, setDemoMode] = useState(false);
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    setDemoMode(new URLSearchParams(window.location.search).get("demo") === "1");
  }, []);
  const demoData = useMemo(() => generateDummyData(), []);

  const transactions = demoMode ? demoData.transactions : live.transactions;
  const budgets = demoMode ? demoData.budgets : liveBudgets.budgets;
  const updateTransaction = demoMode ? () => {} : live.updateTransaction;
  const deleteTransaction = demoMode ? () => {} : live.deleteTransaction;

  const [period, setPeriod] = useState<Period>(12);
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const points = useMemo(() => monthlyTotals(transactions, period), [transactions, period]);
  const periodSpent = useMemo(() => points.reduce((s, p) => s + p.spent, 0), [points]);
  const periodEarned = useMemo(() => points.reduce((s, p) => s + p.earned, 0), [points]);

  const spending = useMemo(
    () => budgetSpendingInPeriod(budgets, transactions, period),
    [budgets, transactions, period],
  );
  const rankedBudgets = useMemo(
    () => [...spending].sort((a, b) => b.spent - a.spent),
    [spending],
  );
  const maxSpent = Math.max(1, ...rankedBudgets.map((b) => b.spent));

  const openBudget = budgets.find((b) => b.id === openBudgetId) ?? null;
  const openBudgetTransactions = useMemo(
    () => spending.find((s) => s.budget.id === openBudgetId)?.transactions ?? [],
    [spending, openBudgetId],
  );

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      <h1 className="mb-8 text-2xl font-medium tracking-tight md:mb-10">Insights</h1>

      {transactions.length === 0 ? (
        <EmptyState icon={ChartLine}>
          Add a transaction to start seeing trends and breakdowns here.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex gap-1.5">
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
              <div className="text-[26px] font-medium leading-tight tracking-tight text-foreground">
                {formatCurrency(periodEarned, currency)}
              </div>
            </div>
          </div>

          <InsightsChart points={points} />

          {rankedBudgets.length > 0 ? (
            <div className="mt-8 flex flex-col gap-2">
              {rankedBudgets.map(({ budget, spent }) => (
                <button
                  key={budget.id}
                  type="button"
                  onClick={() => setOpenBudgetId(budget.id)}
                  className="rounded-[var(--radius-card)] border-[0.5px] border-border px-3.5 py-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-foreground">{budget.name}</span>
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
            <p className="mt-8 text-xs text-muted">No spending in this period.</p>
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
        onClose={() => setEditingTransaction(null)}
        onAdd={() => {}}
        onUpdate={updateTransaction}
      />
    </div>
  );
}
