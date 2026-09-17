"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Coins, Plus, Wallet } from "lucide-react";
import {
  formatCurrency,
  currentMonthLabel,
  isThisMonth,
  budgetSpending,
  incomeBySource,
  type Budget,
  type IncomeSource,
  type Transaction,
} from "@/lib/data";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { BudgetDetailSheet } from "@/components/budget-detail-sheet";
import { EmptyState } from "@/components/empty-state";
import { IncomeSourceDetailSheet } from "@/components/income-source-detail-sheet";
import { LoadingPill } from "@/components/loading-pill";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useDemoAwareData } from "@/lib/use-demo-aware-data";

export function Dashboard() {
  const { effectiveUser } = useAuth();
  const { currency } = useCurrency();
  const {
    transactions,
    budgets,
    sources,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transactionsLoading,
    budgetsLoading,
    sourcesLoading,
  } = useDemoAwareData(effectiveUser?.uid);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(null);
  const [openSourceId, setOpenSourceId] = useState<string | null>(null);
  const [view, setView] = useState<"expense" | "income">("expense");

  const monthly = useMemo(
    () => transactions.filter((t) => isThisMonth(t.date)),
    [transactions],
  );

  const spent = useMemo(
    () =>
      monthly
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthly],
  );
  const earned = useMemo(
    () =>
      monthly
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0),
    [monthly],
  );
  const net = earned - spent;

  const incomeCards = useMemo(
    () => incomeBySource(sources, transactions),
    [sources, transactions],
  );

  const spending = useMemo(() => budgetSpending(budgets, transactions), [budgets, transactions]);
  const budgetCards = useMemo(
    () => [...spending].sort((a, b) => b.budget.amount - a.budget.amount),
    [spending],
  );

  const openBudget = budgets.find((b) => b.id === openBudgetId) ?? null;
  const openBudgetTransactions = useMemo(
    () => spending.find((s) => s.budget.id === openBudgetId)?.transactions ?? [],
    [spending, openBudgetId],
  );

  const openSource = sources.find((s) => s.id === openSourceId) ?? null;
  const openSourceTransactions = useMemo(
    () => incomeCards.find((c) => c.source.id === openSourceId)?.transactions ?? [],
    [incomeCards, openSourceId],
  );

  function openAddSheet() {
    setEditingTransaction(null);
    setSheetOpen(true);
  }

  function closeAddSheet() {
    setSheetOpen(false);
    setEditingTransaction(null);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      {(transactionsLoading || budgetsLoading || sourcesLoading) && <LoadingPill />}

      <div className="mb-[18px] flex items-center justify-between">
        <span className="text-sm text-detail">Welcome back!</span>
        <button
          type="button"
          onClick={openAddSheet}
          aria-label="Add transaction"
          className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-accent text-background transition-opacity hover:opacity-90 md:flex"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-[22px] flex items-end justify-between">
        <div>
          <div className="mb-0.5 text-xs text-detail">Net</div>
          <div
            className={`text-[34px] font-medium leading-tight tracking-tight ${
              net >= 0 ? "text-accent" : "text-danger"
            }`}
          >
            {formatCurrency(net, currency)}
          </div>
        </div>
        <div className="flex items-end gap-5">
          <div>
            <div className="mb-0.5 text-[11px] text-muted">Spent</div>
            <div className="text-[13px] text-foreground">
              {formatCurrency(spent, currency)}
            </div>
          </div>
          <div>
            <div className="mb-0.5 text-[11px] text-muted">Earned</div>
            <div className="text-[13px] font-medium text-accent">
              {formatCurrency(earned, currency)}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-xs text-detail">{currentMonthLabel()}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setView("expense")}
            aria-pressed={view === "expense"}
            aria-label="Show budgets"
            className={`flex size-6 items-center justify-center rounded-full transition-colors ${
              view === "expense"
                ? "bg-accent text-background"
                : "text-detail hover:text-foreground"
            }`}
          >
            <Wallet className="size-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setView("income")}
            aria-pressed={view === "income"}
            aria-label="Show income sources"
            className={`flex size-6 items-center justify-center rounded-full transition-colors ${
              view === "income"
                ? "bg-accent text-background"
                : "text-detail hover:text-foreground"
            }`}
          >
            <Coins className="size-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {view === "expense" ? (
        budgetCards.length > 0 ? (
          <div className="flex flex-col gap-2">
            {budgetCards.map(({ budget, spent }) => (
              <BudgetCard
                key={budget.id}
                budget={budget}
                spent={spent}
                onClick={() => setOpenBudgetId(budget.id)}
              />
            ))}
          </div>
        ) : budgetsLoading ? null : (
          <EmptyState icon={Wallet}>
            No budgets set yet. Add one from{" "}
            <Link
              href="/budgets"
              className="mx-1 inline-block font-bold text-foreground transition-transform duration-150 hover:scale-110"
            >
              Budgets
            </Link>{" "}
            to start tracking spending.
          </EmptyState>
        )
      ) : incomeCards.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {incomeCards.map(({ source, earned }) => (
            <IncomeSourceCard
              key={source.id}
              source={source}
              earned={earned}
              onClick={() => setOpenSourceId(source.id)}
            />
          ))}
        </div>
      ) : sourcesLoading ? null : (
        <EmptyState icon={Coins}>
          No income sources yet. Add one from{" "}
          <Link
            href="/budgets"
            className="mx-1 inline-block font-bold text-foreground transition-transform duration-150 hover:scale-110"
          >
            Budgets
          </Link>{" "}
          to start tracking income.
        </EmptyState>
      )}

      <button
        type="button"
        onClick={openAddSheet}
        aria-label="Add transaction"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-black/40 transition-transform active:scale-95 md:hidden"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <BudgetDetailSheet
        budget={openBudget}
        transactions={openBudgetTransactions}
        onClose={() => setOpenBudgetId(null)}
        onEdit={(t) => {
          setEditingTransaction(t);
          setSheetOpen(true);
        }}
        onDelete={deleteTransaction}
      />

      <IncomeSourceDetailSheet
        source={openSource}
        transactions={openSourceTransactions}
        onClose={() => setOpenSourceId(null)}
        onEdit={(t) => {
          setEditingTransaction(t);
          setSheetOpen(true);
        }}
        onDelete={deleteTransaction}
      />

      <AddTransactionSheet
        open={sheetOpen}
        editing={editingTransaction}
        budgets={budgets}
        budgetsLoading={budgetsLoading}
        sources={sources}
        sourcesLoading={sourcesLoading}
        onClose={closeAddSheet}
        onAdd={addTransaction}
        onUpdate={updateTransaction}
      />
    </div>
  );
}

function BudgetCard({
  budget,
  spent,
  onClick,
}: {
  budget: Budget;
  spent: number;
  onClick: () => void;
}) {
  const { currency } = useCurrency();
  const overspent = spent > budget.amount;
  const pct = overspent
    ? 100
    : Math.min(100, Math.round((spent / budget.amount) * 100));

  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[10px] border-[0.5px] border-border px-3 py-3.5 text-left"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] text-foreground">{budget.name}</span>
        <span className="text-[11px] text-muted">
          {formatCurrency(spent, currency)} /{" "}
          {formatCurrency(budget.amount, currency)}
        </span>
      </div>
      <div className="h-[3px] overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${
            overspent ? "bg-danger" : "bg-accent"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}

function IncomeSourceCard({
  source,
  earned,
  onClick,
}: {
  source: IncomeSource;
  earned: number;
  onClick: () => void;
}) {
  const { currency } = useCurrency();

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex aspect-square flex-col justify-between rounded-[10px] border-[0.5px] border-border p-2 text-left"
    >
      <span className="truncate text-[13px] font-medium text-foreground">
        {source.name}
      </span>
      <span className="truncate text-base font-medium text-accent">
        {formatCurrency(earned, currency)}
      </span>
    </button>
  );
}
