"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Wallet } from "lucide-react";
import { formatCurrency, type Budget } from "@/lib/data";
import { AddBudgetSheet } from "@/components/add-budget-sheet";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { useAuth } from "@/lib/use-auth";
import { useCurrency } from "@/lib/use-currency";
import { useBudgets } from "@/lib/use-budgets";

export default function BudgetsPage() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { budgets, addBudget, updateBudget, deleteBudget } = useBudgets(user?.uid);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Budget | null>(null);

  const sorted = [...budgets].sort((a, b) => b.amount - a.amount);
  const total = budgets.reduce((sum, b) => sum + b.amount, 0);

  function openAdd() {
    setEditing(null);
    setSheetOpen(true);
  }

  function openEdit(b: Budget) {
    setEditing(b);
    setSheetOpen(true);
  }

  function closeSheet() {
    setSheetOpen(false);
    setEditing(null);
  }

  return (
    <div className="mx-auto w-full max-w-xl px-5 pb-32 pt-6 md:pt-10">
      <div className="mb-8 flex items-center justify-between md:mb-10">
        <h1 className="text-2xl font-medium tracking-tight">Budgets</h1>
        <button
          type="button"
          onClick={openAdd}
          className="flex shrink-0 items-center gap-1.5 rounded-full border border-accent/40 px-3.5 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          Add budget
        </button>
      </div>

      <div className="mb-0.5 text-xs text-detail">Total</div>
      <div className="mb-8 text-[34px] font-medium leading-tight tracking-tight text-foreground">
        {formatCurrency(total, currency)}
      </div>

      {sorted.length > 0 ? (
        <ul className="flex flex-col">
          {sorted.map((b, i) => (
            <li
              key={b.id}
              className={`py-3 ${i === sorted.length - 1 ? "" : "border-b border-border"}`}
            >
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-foreground">{b.name}</div>
                  <div className="text-xs text-muted">
                    {b.cadence === "monthly" ? "Monthly" : "One-time"}
                  </div>
                </div>
                <div className="shrink-0 text-sm font-medium text-foreground">
                  {formatCurrency(b.amount, currency)}
                </div>
                <button
                  type="button"
                  onClick={() => openEdit(b)}
                  aria-label={`Edit ${b.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(b)}
                  aria-label={`Delete ${b.name}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
              {/* Purely decorative, not a meter. */}
              <div className="mt-2 h-[3px] rounded-full bg-accent" />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={Wallet}>
          No budgets yet. Add one to start tracking your spending.
        </EmptyState>
      )}

      <AddBudgetSheet
        open={sheetOpen}
        editing={editing}
        onClose={closeSheet}
        onAdd={addBudget}
        onUpdate={updateBudget}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete budget"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.name}"? This can't be undone.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteBudget(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
