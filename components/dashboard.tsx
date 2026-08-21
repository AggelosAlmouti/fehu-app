"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  categoryMap,
  monthlyBudget,
  formatCurrency,
  relativeDay,
  currentMonthLabel,
  type Expense,
  type CategoryId,
} from "@/lib/data";
import {
  AddExpenseSheet,
  type NewExpense,
} from "@/components/add-expense-sheet";
import { useAuth } from "@/lib/use-auth";
import { useExpenses } from "@/lib/use-expenses";

type Filter = "all" | CategoryId;

export function Dashboard() {
  const { user } = useAuth();
  const { expenses, addExpense } = useExpenses(user?.uid);
  const [filter, setFilter] = useState<Filter>("all");
  const [sheetOpen, setSheetOpen] = useState(false);

  const spent = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses],
  );
  const pct = Math.min(100, Math.round((spent / monthlyBudget) * 100));
  const remaining = Math.max(0, monthlyBudget - spent);

  // Filter chips: "All" plus categories that actually have expenses.
  const usedCategories = useMemo(() => {
    const set = new Set<CategoryId>();
    expenses.forEach((e) => set.add(e.category));
    return Array.from(set);
  }, [expenses]);

  const visible = useMemo(() => {
    const list =
      filter === "all"
        ? expenses
        : expenses.filter((e) => e.category === filter);
    return [...list].sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, filter]);

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      {/* Month */}
      <div className="mb-6">
        <span className="text-sm text-detail">{currentMonthLabel()}</span>
      </div>

      {/* Spent this month */}
      <div className="mb-5">
        <div className="mb-1 text-sm text-detail">Spent this month</div>
        <div className="text-4xl font-medium tracking-tight">
          {formatCurrency(spent)}
        </div>
      </div>

      {/* Budget progress */}
      <div className="mb-7">
        <div className="h-1 overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted">
          <span>{pct}% of budget</span>
          <span>{formatCurrency(remaining)} left</span>
        </div>
      </div>

      {/* Filter chips */}
      <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto">
        <FilterChip
          label="All"
          active={filter === "all"}
          onClick={() => setFilter("all")}
        />
        {usedCategories.map((id) => (
          <FilterChip
            key={id}
            label={categoryMap[id].label}
            active={filter === id}
            onClick={() => setFilter(id)}
          />
        ))}
      </div>

      {/* Transactions */}
      {visible.length > 0 ? (
        <ul className="flex flex-col">
          {visible.map((e, i) => (
            <ExpenseRow
              key={e.id}
              expense={e}
              last={i === visible.length - 1}
            />
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-sm text-muted">
          No expenses in this category yet.
        </p>
      )}

      {/* Floating add button (thumb-reachable) */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="Add expense"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-accent text-background shadow-lg shadow-black/40 transition-transform active:scale-95 md:size-14"
      >
        <Plus className="size-6" aria-hidden="true" />
      </button>

      <AddExpenseSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onAdd={addExpense}
      />
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs transition-colors ${
        active
          ? "bg-accent font-medium text-background"
          : "border border-border-strong text-detail hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function ExpenseRow({ expense, last }: { expense: Expense; last: boolean }) {
  const category = categoryMap[expense.category];
  const Icon = category.icon;
  const upcoming = Boolean(expense.due);

  return (
    <li
      className={`flex items-center gap-3 py-3 ${
        last ? "" : "border-b border-border"
      }`}
    >
      <div
        className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-card ${
          upcoming ? "border border-accent" : ""
        }`}
      >
        <Icon
          className={`size-[18px] ${upcoming ? "text-accent" : "text-detail"}`}
          aria-hidden="true"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm">{expense.title}</div>
        <div className={`text-xs ${upcoming ? "text-accent" : "text-muted"}`}>
          {category.label} ·{" "}
          {upcoming ? expense.due : relativeDay(expense.date)}
        </div>
      </div>
      <div className="text-sm font-medium">
        -{formatCurrency(expense.amount)}
      </div>
    </li>
  );
}
