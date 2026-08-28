"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Wallet } from "lucide-react";
import {
  formatCurrency,
  currentMonthLabel,
  type Budget,
  type Transaction,
} from "@/lib/data";
import { AddTransactionSheet } from "@/components/add-transaction-sheet";
import { BudgetDetailSheet } from "@/components/budget-detail-sheet";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useTransactions } from "@/lib/use-transactions";
import { useBudgets } from "@/lib/use-budgets";

type ExpenseTransaction = Extract<Transaction, { type: "expense" }>;

function isThisMonth(iso: string): boolean {
  const now = new Date();
  const d = new Date(iso + "T00:00:00");
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { transactions, addTransaction, updateTransaction, deleteTransaction } =
    useTransactions(user?.uid);
  const { budgets } = useBudgets(user?.uid);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [openBudgetId, setOpenBudgetId] = useState<string | null>(null);

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

  const expenses = useMemo(
    () => transactions.filter((t): t is ExpenseTransaction => t.type === "expense"),
    [transactions],
  );
  const monthlyExpenses = useMemo(
    () => monthly.filter((t): t is ExpenseTransaction => t.type === "expense"),
    [monthly],
  );

  // Monthly resets each month; one-time is a running total.
  function sumByBudget(list: ExpenseTransaction[]): Map<string, number> {
    const map = new Map<string, number>();
    list.forEach((t) => {
      if (t.budgetId) map.set(t.budgetId, (map.get(t.budgetId) ?? 0) + t.amount);
    });
    return map;
  }
  const spentByBudget = useMemo(
    () => ({
      monthly: sumByBudget(monthlyExpenses),
      allTime: sumByBudget(expenses),
    }),
    [monthlyExpenses, expenses],
  );

  const budgetCards = useMemo(
    () =>
      [...budgets]
        .sort((a, b) => b.amount - a.amount)
        .map((b) => ({
          budget: b,
          spent:
            (b.cadence === "monthly" ? spentByBudget.monthly : spentByBudget.allTime).get(
              b.id,
            ) ?? 0,
        })),
    [budgets, spentByBudget],
  );

  const openBudget = budgets.find((b) => b.id === openBudgetId) ?? null;
  const openBudgetTransactions = useMemo(() => {
    if (!openBudget) return [];
    const source = openBudget.cadence === "monthly" ? monthlyExpenses : expenses;
    return source.filter((t) => t.budgetId === openBudget.id);
  }, [openBudget, monthlyExpenses, expenses]);

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
      <div className="mb-[18px] text-sm text-detail">{currentMonthLabel()}</div>

      <div className="mb-[22px] flex items-end gap-8">
        <div>
          <div className="mb-0.5 text-xs text-detail">Net</div>
          <div className="text-[34px] font-medium leading-tight tracking-tight text-foreground">
            {formatCurrency(net, currency)}
          </div>
        </div>
        <div>
          <div className="mb-0.5 text-[11px] text-muted">Spent</div>
          <div className="text-[13px] text-foreground">{formatCurrency(spent, currency)}</div>
        </div>
        <div>
          <div className="mb-0.5 text-[11px] text-muted">Earned</div>
          <div className="text-[13px] text-foreground">{formatCurrency(earned, currency)}</div>
        </div>
      </div>

      <div className="mb-2.5 text-xs text-detail">Budgets</div>

      {budgetCards.length > 0 ? (
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
      ) : (
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
      )}

      {/* Floating add button (thumb-reachable) */}
      <button
        type="button"
        onClick={openAddSheet}
        aria-label="Add transaction"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-black/40 transition-transform active:scale-95 md:size-14"
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

      <AddTransactionSheet
        open={sheetOpen}
        editing={editingTransaction}
        budgets={budgets}
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
      className="rounded-[10px] border-[0.5px] border-border px-3 py-2.5 text-left"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[13px] text-foreground">{budget.name}</span>
        <span className="text-[11px] text-muted">
          {formatCurrency(spent, currency)} / {formatCurrency(budget.amount, currency)}
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
