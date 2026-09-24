"use client";

import { useMemo, useState } from "react";
import { ChartLine, List, Wallet } from "lucide-react";
import {
  budgetSpendingInPeriod,
  currentMonthKey,
  formatCurrency,
  incomeBySourceInPeriod,
  monthlyTotals,
  transactionsInRange,
  type MonthRange,
  type Transaction,
} from "@/lib/data";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useBudgets, useIncomeSources, useTransactions } from "@/lib/firestore";
import { PageHeader } from "@/components/layout/app-shell";
import { AddTransactionSheet } from "@/components/transactions/add-transaction-sheet";
import { IconToggleGroup, Pill } from "@/components/ui/button";
import { EmptyNote, EmptyState } from "@/components/ui/empty-state";
import { Meter, MeterCard } from "@/components/ui/meter";
import { MonthStepper } from "@/components/ui/month-stepper";
import { LoadingPill } from "@/components/ui/notices";
import { useEditSheet } from "@/components/ui/sheet";
import { Stat } from "@/components/ui/stat";
import { BudgetDetailSheet, TransactionList } from "@/components/transactions/transaction-list";
import { InsightsChart } from "@/components/insights/insights-chart";

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

// First and last month of each calendar quarter.
const QUARTER_MONTHS: Record<"q1" | "q2" | "q3" | "q4", [string, string]> = {
  q1: ["01", "03"],
  q2: ["04", "06"],
  q3: ["07", "09"],
  q4: ["10", "12"],
};

function periodToRange(period: Period, browsedMonth: string): MonthRange {
  if (period === "all") return null;
  if (period === "month")
    return { startMonth: browsedMonth, endMonth: browsedMonth };
  const year = new Date().getFullYear();
  if (period === "year")
    return { startMonth: `${year}-01`, endMonth: `${year}-12` };
  const [start, end] = QUARTER_MONTHS[period];
  return { startMonth: `${year}-${start}`, endMonth: `${year}-${end}` };
}

export default function InsightsPage() {
  const { effectiveUser } = useAuth();
  const { currency } = useCurrency();
  const {
    transactions,
    loading: transactionsLoading,
    updateTransaction,
    deleteTransaction,
  } = useTransactions(effectiveUser?.uid);
  const { budgets, loading: budgetsLoading } = useBudgets(effectiveUser?.uid);
  const { sources } = useIncomeSources(effectiveUser?.uid);
  const loading = transactionsLoading || budgetsLoading;

  const [period, setPeriod] = useState<Period>("month");
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(null);
  const editSheet = useEditSheet<Transaction>();

  const [browsedMonth, setBrowsedMonth] = useState(currentMonthKey);
  const [historyView, setHistoryView] = useState<"budget" | "date">("budget");
  const range = useMemo(
    () => periodToRange(period, browsedMonth),
    [period, browsedMonth],
  );

  const points = useMemo(
    () => monthlyTotals(transactions, range),
    [transactions, range],
  );
  const periodSpent = points.reduce((sum, p) => sum + p.spent, 0);
  const periodEarned = points.reduce((sum, p) => sum + p.earned, 0);

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

  const monthTransactions = useMemo(
    () =>
      period === "month"
        ? transactionsInRange(transactions, {
            startMonth: browsedMonth,
            endMonth: browsedMonth,
          })
        : [],
    [transactions, period, browsedMonth],
  );

  const openBudget = budgets.find((b) => b.id === openBudgetId) ?? null;
  const openBudgetTransactions = useMemo(
    () =>
      spending.find((s) => s.budget.id === openBudgetId)?.transactions ?? [],
    [spending, openBudgetId],
  );

  return (
    <>
      {loading && <LoadingPill />}

      <PageHeader title="Insights" />

      {loading ? null : transactions.length === 0 ? (
        <EmptyState icon={ChartLine}>
          Add a transaction to start seeing trends and breakdowns here.
        </EmptyState>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-1.5">
            {PERIODS.map((p) => (
              <Pill
                key={p.label}
                selected={period === p.value}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </Pill>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap items-end gap-x-6 gap-y-3">
            <Stat label="Spent">{formatCurrency(periodSpent, currency)}</Stat>
            <Stat label="Earned" tone="gain">
              {formatCurrency(periodEarned, currency)}
            </Stat>
          </div>

          <div className="card-box p-4">
            <InsightsChart points={points} />
          </div>

          <div className="mt-8">
            {period === "month" && (
              <div className="mb-3 flex items-center justify-between rounded-full border-2 border-border-strong px-2 py-1">
                <div className="flex items-center gap-1">
                  <MonthStepper
                    month={browsedMonth}
                    onChange={setBrowsedMonth}
                  />
                </div>
                <IconToggleGroup
                  value={historyView}
                  onChange={setHistoryView}
                  options={[
                    { value: "budget", icon: Wallet, label: "Group by budget" },
                    { value: "date", icon: List, label: "List by date" },
                  ]}
                />
              </div>
            )}

            {period === "month" && historyView === "date" ? (
              <TransactionList
                transactions={monthTransactions}
                emptyText="No transactions this month."
                onEdit={editSheet.openEdit}
                onDelete={deleteTransaction}
              />
            ) : rankedBudgets.length > 0 ? (
              <div className="flex flex-col gap-2">
                {rankedBudgets.map(({ budget, spent }) => (
                  <MeterCard
                    key={budget.id}
                    name={budget.name}
                    value={
                      <span className="text-strong text-foreground">
                        {formatCurrency(spent, currency)}
                      </span>
                    }
                    onClick={() => setOpenBudgetId(budget.id)}
                  >
                    <Meter percent={(spent / maxSpent) * 100} />
                  </MeterCard>
                ))}
              </div>
            ) : (
              <EmptyNote>No spending in this period.</EmptyNote>
            )}
          </div>

          {rankedIncome.length > 0 &&
            !(period === "month" && historyView === "date") && (
              <div className="mt-8">
                <div className="mb-3 text-label">Income</div>
                <div className="flex flex-col gap-2">
                  {rankedIncome.map(({ source, earned }) => (
                    <MeterCard
                      key={source.id}
                      name={source.name}
                      value={
                        <span className="text-strong text-accent">
                          {formatCurrency(earned, currency)}
                        </span>
                      }
                    >
                      <Meter percent={(earned / maxEarned) * 100} />
                    </MeterCard>
                  ))}
                </div>
              </div>
            )}
        </>
      )}

      <BudgetDetailSheet
        budget={openBudget}
        singleMonth={period === "month"}
        transactions={openBudgetTransactions}
        onClose={() => setOpenBudgetId(null)}
        onEdit={editSheet.openEdit}
        onDelete={deleteTransaction}
      />

      <AddTransactionSheet
        open={editSheet.open}
        editing={editSheet.editing}
        budgets={budgets}
        sources={sources}
        onClose={editSheet.close}
        onUpdate={updateTransaction}
      />
    </>
  );
}
