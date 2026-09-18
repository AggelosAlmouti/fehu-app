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
import { IconToggleGroup } from "@/components/icon-toggle-group";
import { LoadingPill } from "@/components/loading-pill";
import { Meter } from "@/components/meter";
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

      <div className="mb-4.5 flex items-center justify-between">
        <span className="text-label">Welcome back!</span>
        <button
          type="button"
          onClick={openAddSheet}
          aria-label="Add transaction"
          className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-accent text-background transition-opacity hover:opacity-90 md:flex"
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-5.5 grid grid-cols-[1fr_auto_auto] items-baseline gap-x-5 gap-y-0.5">
        <div className="text-label">Net</div>
        <div className="text-label">Spent</div>
        <div className="text-label">Earned</div>
        <div
          className={`text-hero ${
            net >= 0 ? "text-accent" : "text-danger"
          }`}
        >
          {formatCurrency(net, currency)}
        </div>
        <div className="text-base font-medium text-foreground">
          {formatCurrency(spent, currency)}
        </div>
        <div className="text-base font-medium text-accent">
          {formatCurrency(earned, currency)}
        </div>
      </div>

      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-label">{currentMonthLabel()}</span>
        <IconToggleGroup
          value={view}
          onChange={setView}
          options={[
            { value: "expense", icon: Wallet, label: "Show budgets" },
            { value: "income", icon: Coins, label: "Show income sources" },
          ]}
        />
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
            <BudgetsLink />{" "}
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
          <BudgetsLink />{" "}
          to start tracking income.
        </EmptyState>
      )}

      <button
        type="button"
        onClick={openAddSheet}
        aria-label="Add transaction"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-background floating transition-transform active:scale-95 md:hidden"
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

function BudgetsLink() {
  return (
    <Link
      href="/budgets"
      className="mx-1 inline-block font-medium text-foreground transition-transform duration-150 hover:scale-110"
    >
      Budgets
    </Link>
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
      className="card-box px-3.5 py-3 text-left"
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <span className="min-w-0 truncate text-base text-foreground">{budget.name}</span>
        <span className="shrink-0 text-caption">
          {formatCurrency(spent, currency)} /{" "}
          {formatCurrency(budget.amount, currency)}
        </span>
      </div>
      <Meter percent={pct} tone={overspent ? "danger" : "accent"} />
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
      className="flex aspect-square flex-col justify-between card-box p-2 text-left"
    >
      <span className="truncate text-base font-medium text-foreground">
        {source.name}
      </span>
      <span className="truncate text-base font-medium text-accent">
        {formatCurrency(earned, currency)}
      </span>
    </button>
  );
}
