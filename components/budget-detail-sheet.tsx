"use client";

import { useState } from "react";
import { formatCurrency, type Budget, type Transaction } from "@/lib/data";
import { EmptyNote } from "@/components/empty-note";
import { Meter } from "@/components/meter";
import { DeleteTransactionDialog } from "@/components/delete-transaction-dialog";
import { Sheet } from "@/components/sheet";
import { SheetHeader } from "@/components/sheet-header";
import { TransactionRow } from "@/components/transaction-row";
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
          <div className="mb-1.5 text-right text-caption">
            {formatCurrency(spent, currency)} / {formatCurrency(budget.amount, currency)}
          </div>
          <Meter percent={pct} tone={overspent ? "danger" : "accent"} />
        </div>

        {sorted.length > 0 ? (
          <ul className="flex flex-col overflow-y-auto">
            {sorted.map((t, i) => (
              <TransactionRow
                key={t.id}
                transaction={t}
                isLast={i === sorted.length - 1}
                onEdit={() => onEdit(t)}
                onDelete={() => setPendingDelete(t)}
              />
            ))}
          </ul>
        ) : (
          <EmptyNote>No transactions this month.</EmptyNote>
        )}
      </Sheet>

      <DeleteTransactionDialog
        transaction={pendingDelete}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) onDelete(pendingDelete.id);
          setPendingDelete(null);
        }}
      />
    </>
  );
}
