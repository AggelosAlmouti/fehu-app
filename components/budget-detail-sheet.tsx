"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { formatCurrency, relativeDay, type Budget, type Transaction } from "@/lib/data";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";
import { useCurrency } from "@/lib/use-currency";

type ExpenseTransaction = Extract<Transaction, { type: "expense" }>;

export function BudgetDetailSheet({
  budget,
  transactions,
  onClose,
  onEdit,
  onDelete,
}: {
  budget: Budget | null;
  /** Already scoped to the right window by the caller. */
  transactions: ExpenseTransaction[];
  onClose: () => void;
  onEdit: (transaction: ExpenseTransaction) => void;
  onDelete: (id: string) => void;
}) {
  const { currency } = useCurrency();
  const [pendingDelete, setPendingDelete] = useState<ExpenseTransaction | null>(
    null,
  );

  if (!budget) return null;
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const overspent = spent > budget.amount;
  const pct = overspent ? 100 : Math.min(100, Math.round((spent / budget.amount) * 100));

  return (
    <>
      <Sheet
        open={budget !== null}
        onClose={onClose}
        ariaLabel={`${budget.name} transactions`}
        scrollable
      >
        <SheetHeader title={budget.name} onClose={onClose} />

        <div className="mb-4">
          <div className="mb-1.5 text-right text-[11px] text-muted">
            {formatCurrency(spent, currency)} / {formatCurrency(budget.amount, currency)}
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-border">
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${
                overspent ? "bg-danger" : "bg-accent"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {sorted.length > 0 ? (
          <ul className="flex flex-col overflow-y-auto">
            {sorted.map((t, i) => (
              <li
                key={t.id}
                className={`flex items-center gap-3 py-3 ${
                  i === sorted.length - 1 ? "" : "border-b border-border"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{t.title}</div>
                  <div className="text-xs text-muted">{relativeDay(t.date)}</div>
                </div>
                <div className="shrink-0 text-sm font-medium">
                  {formatCurrency(t.amount, currency)}
                </div>
                <button
                  type="button"
                  onClick={() => onEdit(t)}
                  aria-label={`Edit ${t.title}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-foreground"
                >
                  <Pencil className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(t)}
                  aria-label={`Delete ${t.title}`}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-detail transition-colors hover:text-danger"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-8 text-center text-sm text-muted">
            No transactions {budget.cadence === "monthly" ? "this month" : "yet"}.
          </p>
        )}
      </Sheet>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete transaction"
        description={
          pendingDelete
            ? `Delete "${pendingDelete.title}"? This can't be undone.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
